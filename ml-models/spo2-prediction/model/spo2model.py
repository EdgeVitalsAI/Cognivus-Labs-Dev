"""
VERSION 5: PRODUCTION-READY SYSTEM (BUG FIXED)

Key Changes from v4:
1. Cost-sensitive loss (FN = 10x FP)
2. Multi-stage alert system (fast/medium/slow)
3. Confidence-based predictions
4. F2 score optimization (emphasize recall)
5. Complete monitoring system

Expected: Recall 0.80-0.90, F2 > 0.70
"""
##################### version 5  medium model okay #######################



import os
import glob
import json
import numpy as np
import pandas as pd
from scipy.signal import medfilt
from scipy.interpolate import interp1d
from sklearn.metrics import classification_report, confusion_matrix, accuracy_score, f1_score, fbeta_score, roc_auc_score
import tensorflow as tf
from tensorflow.keras import layers, models, callbacks
import matplotlib.pyplot as plt
import seaborn as sns

# ----------------------
# Config
# ----------------------
DATA_DIR = "data/Oxygen"
SAMPLE_RATE = 1
WINDOW_SIZE = 60

# Multi-stage forecasting
FORECAST_WINDOWS = {
    'fast': 10,     # Immediate decline (10s)
    'medium': 30,   # Short-term decline (30s)
    'slow': 60      # Long-term decline (60s)
}

USE_BINARY = True
STEP = 3
MIN_VALID_SAMPLES = 100
TEST_SUBJECTS = 5
VAL_SUBJECTS = 5
RANDOM_SEED = 42

BATCH_SIZE = 32
EPOCHS = 5
LR = 0.001
PATIENCE = 15
DROPOUT = 0.3
L2_REG = 0.005

# Cost parameters
FN_COST = 10000  # Missing a decline is very expensive
FP_COST = 100    # False alarm is cheap

# Alert thresholds
ALERT_THRESHOLDS = {
    'CRITICAL': 0.8,  # Immediate action required
    'WARNING': 0.7,   # Monitor closely
    'WATCH': 0.6      # Increased attention
}

OUT_DIR = "outputs_trend_v5_production"
os.makedirs(OUT_DIR, exist_ok=True)

# ----------------------
# Utilities
# ----------------------
def find_subject_files(data_dir):
    txt_files = glob.glob(os.path.join(data_dir, "*.txt"))
    subjects = {}
    for f in txt_files:
        subj_id = os.path.splitext(os.path.basename(f))[0]
        subjects[subj_id] = f
    return subjects

def load_signal_for_subject(txt_path):
    try:
        try:
            df = pd.read_csv(txt_path, header=None)
        except Exception:
            df = pd.read_csv(txt_path)
        col = df.select_dtypes(include=[np.number]).columns[0]
        arr = df[col].values.astype(np.float32)
        return arr, SAMPLE_RATE
    except Exception as e:
        return None, None

def clean_spo2(signal):
    sig = np.array(signal, dtype=np.float32)
    if sig.size == 0:
        return sig
    nans = np.isnan(sig)
    if nans.any():
        s = pd.Series(sig)
        s = s.ffill().bfill()
        sig = s.values.astype(np.float32)
    sig = np.clip(sig, 60.0, 100.0)
    try:
        sig = medfilt(sig, kernel_size=3)
    except Exception:
        pass
    return sig

def normalize_spo2(signal):
    return (signal - 60.0) / 40.0

# ----------------------
# Decline-focused features
# ----------------------
def create_decline_focused_features(signal, window=10):
    signal = np.array(signal)
    diff1 = np.diff(signal, prepend=signal[0])
    diff2 = np.diff(diff1, prepend=diff1[0])
    s = pd.Series(signal)

    ma_5 = s.rolling(5, min_periods=1).mean().fillna(signal[0]).values
    ma_10 = s.rolling(10, min_periods=1).mean().fillna(signal[0]).values
    ma_20 = s.rolling(20, min_periods=1).mean().fillna(signal[0]).values
    std_5 = s.rolling(5, min_periods=1).std().fillna(0).values
    std_10 = s.rolling(10, min_periods=1).std().fillna(0).values
    dev_5 = signal - ma_5
    dev_10 = signal - ma_10
    roc_5 = np.concatenate([np.zeros(5), signal[5:] - signal[:-5]]) / 5
    roc_10 = np.concatenate([np.zeros(10), signal[10:] - signal[:-10]]) / 10

    negative_velocity = np.minimum(diff1, 0)
    consecutive_declines = np.zeros_like(signal)
    count = 0
    for i in range(len(signal)):
        if i > 0 and signal[i] < signal[i-1]:
            count += 1
        else:
            count = 0
        consecutive_declines[i] = count

    rolling_max = s.rolling(20, min_periods=1).max().values
    distance_from_peak = signal - rolling_max

    slopes = np.zeros_like(signal)
    for i in range(10, len(signal)):
        x = np.arange(10)
        y = signal[i-10:i]
        slope = np.polyfit(x, y, 1)[0]
        slopes[i] = min(slope, 0)

    volatility = s.rolling(10, min_periods=1).std().fillna(0).values
    momentum = np.where(diff1 > 0, 1, np.where(diff1 < 0, -1, 0))

    features = np.column_stack([
        signal, diff1, diff2,
        ma_5, ma_10, ma_20,
        std_5, std_10,
        dev_5, dev_10,
        roc_5, roc_10,
        negative_velocity,
        consecutive_declines,
        distance_from_peak,
        slopes,
        volatility,
        momentum,
        diff2
    ])
    return features.astype(np.float32)

def classify_trend_binary(current_value, future_value):
    change = future_value - current_value
    return 1 if change < 0 else 0

def create_trend_windows(signal, W=60, forecast_window=30, step=1):
    signal_features = create_decline_focused_features(signal)
    n_features = signal_features.shape[1]
    N = len(signal)
    X, y = [], []

    for start in range(0, N - W - forecast_window + 1, step):
        end = start + W
        future_idx = end + forecast_window - 1
        window = signal_features[start:end]
        X.append(window)

        current_val = signal[end - 1]
        future_val = signal[future_idx]
        trend_class = classify_trend_binary(current_val, future_val)
        y.append(trend_class)

    if len(X) == 0:
        return np.empty((0, W, n_features)), np.empty(0)
    return (np.stack(X).astype(np.float32), np.array(y).astype(np.int32))

# ----------------------
# TARGETED AUGMENTATION - FIXED BUG
# ----------------------
def augment_minority_class(X_train, y_train, target_ratio=0.4):
    """
    Augment DECLINING class with advanced techniques
    FIXED: Corrected formula to avoid UnboundLocalError
    """
    print("\n" + "="*60)
    print("TARGETED AUGMENTATION")
    print("="*60)

    n_total = len(y_train)
    n_declining = np.sum(y_train == 1)
    n_stable = n_total - n_declining

    # FIXED FORMULA: Calculate how many DECLINING samples we need
    # Want: target_declining / (n_stable + target_declining) = target_ratio
    # Solving: target_declining = target_ratio * n_stable / (1 - target_ratio)
    target_declining_needed = int(target_ratio * n_stable / (1 - target_ratio))
    n_to_generate = max(0, target_declining_needed - n_declining)

    print(f"Current DECLINING: {n_declining} ({100*n_declining/n_total:.1f}%)")
    print(f"Target DECLINING: {target_declining_needed} ({100*target_ratio:.1f}%)")
    print(f"Generating: {n_to_generate} synthetic samples")

    if n_to_generate == 0:
        print("No augmentation needed!")
        print("="*60)
        return X_train, y_train

    declining_mask = y_train == 1
    X_declining = X_train[declining_mask]
    X_augmented = []

    for i in range(n_to_generate):
        idx = np.random.randint(0, len(X_declining))
        sample = X_declining[idx].copy()

        # Noise injection
        if np.random.rand() > 0.8:
            noise = np.random.randn(*sample.shape) * 0.02
            sample = sample + noise

        # Random scaling
        if np.random.rand() > 0.7:
            scale = np.random.uniform(0.95, 1.05)
            sample = sample * scale

        # Time warping
        if np.random.rand() > 0.5:
            old_indices = np.arange(len(sample))
            warp = np.random.randn(len(sample)) * 2
            new_indices = np.clip(old_indices + warp, 0, len(sample)-1)
            for feat_idx in range(sample.shape[1]):
                try:
                    f = interp1d(old_indices, sample[:, feat_idx],
                               kind='linear', fill_value='extrapolate')
                    sample[:, feat_idx] = f(new_indices)
                except:
                    pass

        X_augmented.append(sample)

        if (i + 1) % 1000 == 0:
            print(f"  Generated {i+1}/{n_to_generate} samples...")

    X_combined = np.concatenate([X_train, np.array(X_augmented)])
    y_combined = np.concatenate([y_train, np.ones(len(X_augmented))])

    print(f"\nFinal dataset: {len(y_combined)} samples")
    unique, counts = np.unique(y_combined, return_counts=True)
    for cls, count in zip(unique, counts):
        pct = 100 * count / len(y_combined)
        print(f"  Class {cls}: {count} ({pct:.1f}%)")
    print("="*60)

    return X_combined, y_combined

def build_dataset_for_forecast(subjects_dict, forecast_window, W=60, step=3):
    X_list, y_list, subj_list = [], [], []

    for subj_key in sorted(subjects_dict.keys()):
        path = subjects_dict[subj_key]
        sig, fs = load_signal_for_subject(path)
        if sig is None or len(sig) < (W + forecast_window):
            continue

        sig = clean_spo2(sig)
        sig = normalize_spo2(sig)

        X_sub, y_sub = create_trend_windows(sig, W=W,
                                            forecast_window=forecast_window,
                                            step=step)
        if X_sub.shape[0] == 0:
            continue

        X_list.append(X_sub)
        y_list.append(y_sub)
        subj_list.extend([subj_key] * len(y_sub))

    if not X_list:
        return None, None, None

    return (np.concatenate(X_list, axis=0),
            np.concatenate(y_list, axis=0),
            np.array(subj_list))

def subject_split(X, y, subj_ids, test_n=5, val_n=5, seed=RANDOM_SEED):
    unique_subj = np.unique(subj_ids)
    if len(unique_subj) < test_n + val_n:
        test_n = max(1, len(unique_subj) // 5)
        val_n = max(1, len(unique_subj) // 5)
    rng = np.random.RandomState(seed)
    perm = rng.permutation(unique_subj)
    test_subj = perm[:test_n]
    val_subj = perm[test_n:test_n+val_n]
    train_subj = perm[test_n+val_n:]

    def select(subject_list):
        mask = np.isin(subj_ids, subject_list)
        return X[mask], y[mask]

    return select(train_subj), select(val_subj), select(test_subj)

# ----------------------
# COST-SENSITIVE LOSS
# ----------------------
def medical_cost_sensitive_loss(fn_weight=10.0):
    """
    Custom loss that heavily penalizes false negatives
    In medical context: missing a decline is 10x worse than false alarm
    """
    def loss(y_true, y_pred):
        y_true = tf.cast(y_true, tf.float32)
        y_pred = tf.clip_by_value(y_pred, 1e-7, 1 - 1e-7)

        # Binary crossentropy
        bce = -y_true * tf.math.log(y_pred) - (1 - y_true) * tf.math.log(1 - y_pred)

        # Cost weighting: penalize false negatives heavily
        # When y_true=1 (DECLINING) and y_pred is low → high cost
        cost_weight = 1.0 + (fn_weight - 1.0) * y_true

        weighted_loss = bce * cost_weight
        return tf.reduce_mean(weighted_loss)

    return loss

# ----------------------
# Model Builder
# ----------------------
def build_production_model(input_shape, lr=LR, fn_weight=10.0):
    inputs = layers.Input(shape=input_shape)

    x = layers.LSTM(64, return_sequences=False,
                   kernel_regularizer=tf.keras.regularizers.l2(L2_REG))(inputs)
    x = layers.BatchNormalization()(x)
    x = layers.Dropout(DROPOUT)(x)

    x = layers.Dense(32, activation='relu',
                    kernel_regularizer=tf.keras.regularizers.l2(L2_REG))(x)
    x = layers.BatchNormalization()(x)
    x = layers.Dropout(DROPOUT)(x)

    outputs = layers.Dense(1, activation='sigmoid')(x)

    model = models.Model(inputs=inputs, outputs=outputs)

    model.compile(
        optimizer=tf.keras.optimizers.Adam(learning_rate=lr),
        loss=medical_cost_sensitive_loss(fn_weight=fn_weight),
        metrics=['accuracy',
                 tf.keras.metrics.Precision(name='precision'),
                 tf.keras.metrics.Recall(name='recall'),
                 tf.keras.metrics.AUC(name='auc')]
    )

    return model

# ----------------------
# Multi-Stage Alert System
# ----------------------
class DeclineAlertSystem:
    """
    Production monitoring system with staged alerts
    """
    def __init__(self, models_dict, thresholds=ALERT_THRESHOLDS):
        self.models = models_dict
        self.thresholds = thresholds

    def analyze(self, signal_window):
        """
        Analyze signal and return alert level
        """
        # Prepare input
        if len(signal_window.shape) == 2:
            signal_window = np.expand_dims(signal_window, 0)

        # Get predictions from all models
        probs = {}
        for name, model in self.models.items():
            prob = model.predict(signal_window, verbose=0)[0][0]
            probs[name] = float(prob)

        # Determine alert level
        alert_level = 'NONE'

        if probs.get('fast', 0) > self.thresholds['CRITICAL']:
            alert_level = 'CRITICAL'
        elif probs.get('medium', 0) > self.thresholds['WARNING']:
            alert_level = 'WARNING'
        elif probs.get('slow', 0) > self.thresholds['WATCH']:
            alert_level = 'WATCH'

        return {
            'alert_level': alert_level,
            'probabilities': probs,
            'recommendation': self._get_recommendation(alert_level, probs),
            'confidence': max(probs.values()) if probs else 0
        }

    def _get_recommendation(self, level, probs):
        recommendations = {
            'CRITICAL': f'⚠️ IMMEDIATE ACTION: Rapid decline detected (p={probs.get("fast", 0):.2f}). Check patient now.',
            'WARNING': f'⚡ MONITOR CLOSELY: Decline expected within 30s (p={probs.get("medium", 0):.2f}).',
            'WATCH': f'👁️ INCREASED ATTENTION: Possible decline in 60s (p={probs.get("slow", 0):.2f}).',
            'NONE': '✓ Patient stable - continue routine monitoring.'
        }
        return recommendations[level]

# ----------------------
# Evaluation with F2 and Cost Analysis
# ----------------------
def evaluate_medical_model(y_true, y_pred, y_probs):
    print("\n" + "="*80)
    print("MEDICAL-GRADE EVALUATION")
    print("="*80)

    # Standard metrics
    acc = accuracy_score(y_true, y_pred)
    f1 = f1_score(y_true, y_pred, average='macro')
    f2 = fbeta_score(y_true, y_pred, beta=2, average='macro')  # Emphasize recall
    auc = roc_auc_score(y_true, y_probs)

    print(f"\nPerformance Metrics:")
    print(f"  Accuracy:  {acc:.4f}")
    print(f"  F1 Score:  {f1:.4f}")
    print(f"  F2 Score:  {f2:.4f} ⭐ (recall-focused)")
    print(f"  AUC-ROC:   {auc:.4f}")

    # Cost analysis
    cm = confusion_matrix(y_true, y_pred)
    tn, fp, fn, tp = cm.ravel()

    total_cost = fn * FN_COST + fp * FP_COST

    print(f"\n💰 Cost Analysis (Production Impact):")
    print(f"  False Negatives: {fn:4d} × ${FN_COST:,} = ${fn * FN_COST:,}")
    print(f"  False Positives: {fp:4d} × ${FP_COST:,}   = ${fp * FP_COST:,}")
    print(f"  {'='*50}")
    print(f"  Total Cost:                      ${total_cost:,}")

    # Per-class performance
    class_names = ['NOT_DECLINING', 'DECLINING']
    print("\nDetailed Classification Report:")
    print(classification_report(y_true, y_pred, target_names=class_names))

    return {
        'accuracy': acc,
        'f1': f1,
        'f2': f2,
        'auc': auc,
        'total_cost': total_cost,
        'fn': fn,
        'fp': fp
    }

def find_optimal_threshold_f2(y_true, y_pred_probs):
    """Find threshold that maximizes F2 score"""
    thresholds = np.arange(0.1, 0.9, 0.05)
    best_f2 = 0
    best_thresh = 0.5

    print("\nOptimizing threshold for F2 score (emphasizing recall)...")
    for thresh in thresholds:
        y_pred = (y_pred_probs > thresh).astype(int).flatten()
        f2 = fbeta_score(y_true, y_pred, beta=2, average='macro')
        if f2 > best_f2:
            best_f2 = f2
            best_thresh = thresh

    print(f"Optimal threshold: {best_thresh:.2f} (F2={best_f2:.4f})")
    return best_thresh

# ----------------------
# Main Training Pipeline
# ----------------------
def main():
    print("="*80)
    print("VERSION 5: PRODUCTION-READY DECLINE DETECTION SYSTEM")
    print("="*80)
    print(f"\nSystem Features:")
    print(f"  ✓ Cost-sensitive loss (FN={FN_COST/FP_COST:.0f}x FP)")
    print(f"  ✓ Multi-stage alerts (CRITICAL/WARNING/WATCH)")
    print(f"  ✓ F2 score optimization (recall priority)")
    print(f"  ✓ Confidence-based predictions")
    print(f"  ✓ Production cost analysis")
    print("="*80)

    subjects = find_subject_files(DATA_DIR)
    print(f"\nFound {len(subjects)} subjects")
    if len(subjects) == 0:
        return

    # Train models for each forecast window
    trained_models = {}

    for stage, forecast_window in FORECAST_WINDOWS.items():
        print(f"\n{'='*80}")
        print(f"TRAINING {stage.upper()} DECLINE DETECTOR ({forecast_window}s forecast)")
        print(f"{'='*80}")

        # Build dataset
        X, y, subj_ids = build_dataset_for_forecast(subjects, forecast_window,
                                                     W=WINDOW_SIZE, step=STEP)
        if X is None:
            print(f"Failed to build dataset for {stage}")
            continue

        print(f"Dataset: X={X.shape}, y={y.shape}")

        # Print class distribution
        unique, counts = np.unique(y, return_counts=True)
        print(f"Class distribution:")
        for cls, count in zip(unique, counts):
            pct = 100 * count / len(y)
            print(f"  Class {cls}: {count} ({pct:.1f}%)")

        # Split
        (X_train, y_train), (X_val, y_val), (X_test, y_test) = subject_split(X, y, subj_ids)

        print(f"Splits: train={len(y_train)}, val={len(y_val)}, test={len(y_test)}")

        # Augment
        X_train_aug, y_train_aug = augment_minority_class(X_train, y_train, target_ratio=0.4)

        # Build model
        input_shape = (X.shape[1], X.shape[2])
        model = build_production_model(input_shape, fn_weight=10.0)

        print(f"\nModel architecture:")
        model.summary()

        # Train
        ckpt_path = os.path.join(OUT_DIR, f"model_{stage}.keras")
        es = callbacks.EarlyStopping(monitor='val_recall', mode='max',
                                      patience=PATIENCE, restore_best_weights=True, verbose=1)
        cp = callbacks.ModelCheckpoint(ckpt_path, monitor='val_recall', mode='max',
                                        save_best_only=True, verbose=1)
        reduce_lr = callbacks.ReduceLROnPlateau(monitor='val_loss', factor=0.5,
                                                 patience=8, verbose=1, min_lr=1e-7)

        print(f"\nTraining {stage} model...")
        history = model.fit(
            X_train_aug, y_train_aug,
            validation_data=(X_val, y_val),
            epochs=EPOCHS,
            batch_size=BATCH_SIZE,
            callbacks=[es, cp, reduce_lr],
            verbose=2
        )

        # Load best model
        model = tf.keras.models.load_model(ckpt_path,
                                           custom_objects={'loss': medical_cost_sensitive_loss()})

        # Find optimal threshold
        y_val_probs = model.predict(X_val, verbose=0)
        optimal_thresh = find_optimal_threshold_f2(y_val, y_val_probs)

        # Evaluate on test
        y_test_probs = model.predict(X_test, verbose=0)
        y_pred = (y_test_probs > optimal_thresh).astype(int).flatten()

        print(f"\n{stage.upper()} MODEL TEST RESULTS:")
        metrics = evaluate_medical_model(y_test, y_pred, y_test_probs)

        # Save metadata
        metadata = {
            'stage': stage,
            'forecast_window': forecast_window,
            'optimal_threshold': float(optimal_thresh),
            'metrics': {k: float(v) if isinstance(v, (np.floating, float)) else int(v)
                       for k, v in metrics.items()}
        }

        with open(os.path.join(OUT_DIR, f"metadata_{stage}.json"), 'w') as f:
            json.dump(metadata, f, indent=2)

        # Plot confusion matrix
        cm = confusion_matrix(y_test, y_pred)
        plt.figure(figsize=(8, 6))
        sns.heatmap(cm, annot=True, fmt='d', cmap='Blues',
                    xticklabels=['NOT_DECLINING', 'DECLINING'],
                    yticklabels=['NOT_DECLINING', 'DECLINING'])
        plt.xlabel('Predicted')
        plt.ylabel('True')
        plt.title(f'{stage.upper()} Model - Confusion Matrix')
        plt.tight_layout()
        plt.savefig(os.path.join(OUT_DIR, f"confusion_matrix_{stage}.png"), dpi=150)
        plt.close()

        trained_models[stage] = model

        print(f"\n{stage.upper()} model saved to {ckpt_path}")

    # Create Alert System
    print("\n" + "="*80)
    print("INITIALIZING MULTI-STAGE ALERT SYSTEM")
    print("="*80)

    if len(trained_models) == 0:
        print("No models were trained successfully!")
        return

    alert_system = DeclineAlertSystem(trained_models, ALERT_THRESHOLDS)

    print(f"\nAlert System Ready!")
    print(f"  Stages: {list(trained_models.keys())}")
    print(f"  Thresholds: {ALERT_THRESHOLDS}")

    # Demo on test sample
    if 'medium' in trained_models:
        print(f"\n📊 Demo Analysis (random test sample):")
        X, y, subj_ids = build_dataset_for_forecast(subjects, 30, W=WINDOW_SIZE, step=STEP)
        if X is not None and len(X) > 0:
            _, _, (X_test, y_test) = subject_split(X, y, subj_ids)
            if len(X_test) > 0:
                sample_idx = np.random.randint(0, len(X_test))
                sample = X_test[sample_idx]

                result = alert_system.analyze(sample)

                print(f"  Alert Level: {result['alert_level']}")
                print(f"  Probabilities:")
                for stage, prob in result['probabilities'].items():
                    print(f"    {stage:8s}: {prob:.4f}")
                print(f"  Recommendation: {result['recommendation']}")

    print(f"\n{'='*80}")
    print(f"PRODUCTION SYSTEM READY")
    print(f"All outputs saved to: {OUT_DIR}")
    print(f"{'='*80}")

if __name__ == "__main__":
    main()
