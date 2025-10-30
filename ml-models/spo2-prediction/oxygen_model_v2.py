"""
train_osv_spo2_forecast_improved.py

Improved end-to-end pipeline with:
- Multi-horizon prediction (predict multiple future time points)
- Derivative features (velocity, acceleration, volatility)
- Attention mechanism
- Quantile loss option
- Better evaluation metrics

Author: EdgeVitalsAI / CognivusLabs
Date: 2025-10-30
"""

import os
import glob
import numpy as np
import pandas as pd
import json
from scipy.signal import medfilt
from sklearn.metrics import mean_absolute_error, mean_squared_error
import tensorflow as tf
from tensorflow.keras import layers, models, callbacks
import matplotlib.pyplot as plt

# ----------------------
# Config / Hyperparams
# ----------------------
DATA_DIR = "data/Oxygen"   # path to folder containing dataset files
SAMPLE_RATE = 1         # OSV is 1 Hz
WINDOW_SIZE = 90        # Increased from 60 for more context
HORIZONS = [15, 30, 45, 60]  # Multi-horizon: predict multiple future points
STEP = 1                # sliding window step in seconds
MIN_VALID_SAMPLES = 100  # minimum valid samples per subject to include
TEST_SUBJECTS = 5       # number of subjects to reserve for test
VAL_SUBJECTS = 5        # number of subjects to reserve for val
RANDOM_SEED = 42

# Training hyperparams
BATCH_SIZE = 64
EPOCHS = 50
LR = 0.001
PATIENCE = 20
DROPOUT = 0.3

# Model configuration
USE_ATTENTION = True      # Use attention mechanism
USE_FEATURES = True       # Use derivative features
MODEL_TYPE = "multi_horizon"  # Options: "multi_horizon", "single", "quantile"

# Output
OUT_DIR = "outputs_improved"
os.makedirs(OUT_DIR, exist_ok=True)

# ----------------------
# Utilities: loading
# ----------------------
def find_subject_files(data_dir):
    """
    Finds all .txt files in the directory.
    Returns dict: subject_id -> path
    """
    txt_files = glob.glob(os.path.join(data_dir, "*.txt"))
    subjects = {}
    for f in txt_files:
        subj_id = os.path.splitext(os.path.basename(f))[0]
        subjects[subj_id] = f
    return subjects


def load_signal_for_subject(txt_path):
    """
    Load SpO2 signal from text file.
    """
    try:
        try:
            df = pd.read_csv(txt_path, header=None)
        except Exception:
            df = pd.read_csv(txt_path)
        col = df.select_dtypes(include=[np.number]).columns[0]
        arr = df[col].values.astype(np.float32)
        return arr, SAMPLE_RATE
    except Exception as e:
        print(f"Failed to read {txt_path}: {e}")
        return None, None


# ----------------------
# Preprocessing
# ----------------------
def clean_spo2(signal):
    """Basic cleaning for SpO2"""
    sig = np.array(signal, dtype=np.float32)
    if sig.size == 0:
        return sig
    
    # Handle NaN
    nans = np.isnan(sig)
    if nans.any():
        s = pd.Series(sig)
        s = s.ffill().bfill()
        sig = s.values.astype(np.float32)
    
    # Clip to physiological range
    sig = np.clip(sig, 60.0, 100.0)
    
    # Median filter
    try:
        sig = medfilt(sig, kernel_size=3)
    except Exception:
        pass
    
    return sig


def normalize_spo2(signal):
    """Normalize SpO2 to [0, 1] range"""
    return (signal - 60.0) / 40.0


def denormalize_spo2(signal_normalized):
    """Convert normalized SpO2 back to original scale"""
    return signal_normalized * 40.0 + 60.0


def create_derivative_features(signal, window=10):
    """
    Create derivative and statistical features.
    
    Returns array of shape (len(signal), n_features) where features are:
    - Original signal
    - First derivative (velocity)
    - Second derivative (acceleration)
    - Rolling std (volatility)
    - Deviation from rolling mean
    """
    signal = np.array(signal)
    
    # First derivative
    diff1 = np.diff(signal, prepend=signal[0])
    
    # Second derivative
    diff2 = np.diff(diff1, prepend=diff1[0])
    
    # Rolling statistics
    s = pd.Series(signal)
    rolling_std = s.rolling(window=window, min_periods=1, center=False).std().fillna(0)
    rolling_mean = s.rolling(window=window, min_periods=1, center=False).mean().fillna(signal[0])
    deviation = signal - rolling_mean.values
    
    # Stack all features
    features = np.column_stack([
        signal,
        diff1,
        diff2,
        rolling_std.values,
        deviation
    ])
    
    return features.astype(np.float32)


# ----------------------
# Windowing
# ----------------------
def create_multi_horizon_windows(signal, W=90, horizons=[15, 30, 45, 60], step=1, use_features=True):
    """
    Create sliding windows with multiple horizon targets.
    
    Returns:
        X: (n_windows, W, n_features) if use_features else (n_windows, W, 1)
        y: (n_windows, n_horizons) - targets for each horizon
    """
    if use_features:
        signal_features = create_derivative_features(signal)
        n_features = signal_features.shape[1]
    else:
        signal_features = signal.reshape(-1, 1)
        n_features = 1
    
    max_horizon = max(horizons)
    N = len(signal)
    
    X = []
    y = []
    
    for start in range(0, N - W - max_horizon + 1, step):
        end = start + W
        
        # Input window
        X.append(signal_features[start:end])
        
        # Multiple targets
        targets = []
        for h in horizons:
            target_idx = end + h - 1
            targets.append(signal[target_idx])
        y.append(targets)
    
    if len(X) == 0:
        return np.empty((0, W, n_features)), np.empty((0, len(horizons)))
    
    return np.stack(X).astype(np.float32), np.array(y).astype(np.float32)


# ----------------------
# Data assembly
# ----------------------
def build_dataset(subjects_dict, W=90, horizons=[60], step=1, use_features=True, min_samples=MIN_VALID_SAMPLES):
    """
    Loads and preprocesses all text files, constructs windows.
    """
    X_list, y_list, subj_list = [], [], []
    subj_keys = sorted(subjects_dict.keys())

    for subj_key in subj_keys:
        path = subjects_dict[subj_key]
        sig, fs = load_signal_for_subject(path)
        max_h = max(horizons) if isinstance(horizons, list) else horizons
        
        if sig is None or len(sig) < (W + max_h):
            print(f"Skipping {subj_key}: insufficient data")
            continue

        sig = clean_spo2(sig)
        sig = normalize_spo2(sig)
        
        if len(sig) < min_samples:
            print(f"Skipping {subj_key}: too few valid samples ({len(sig)})")
            continue

        X_sub, y_sub = create_multi_horizon_windows(sig, W=W, horizons=horizons, 
                                                     step=step, use_features=use_features)
        if X_sub.shape[0] == 0:
            continue

        X_list.append(X_sub)
        y_list.append(y_sub)
        subj_list.extend([subj_key] * len(y_sub))

        print(f"Subject {subj_key}: signal_len={len(sig)}, windows={X_sub.shape[0]}, features={X_sub.shape[2]}")

    if not X_list:
        return None, None, None

    X_all = np.concatenate(X_list, axis=0)
    y_all = np.concatenate(y_list, axis=0)
    subj_ids = np.array(subj_list)
    
    return X_all, y_all, subj_ids


# ----------------------
# Subject-wise split
# ----------------------
def subject_split(X, y, subj_ids, test_n=5, val_n=5, seed=RANDOM_SEED):
    """Split by subjects"""
    unique_subj = np.unique(subj_ids)
    
    if len(unique_subj) < test_n + val_n:
        print(f"Warning: Not enough subjects ({len(unique_subj)}) for requested split.")
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

    X_test, y_test = select(test_subj)
    X_val, y_val = select(val_subj)
    X_train, y_train = select(train_subj)

    print(f"Subjects: total={len(unique_subj)}, train={len(train_subj)}, val={len(val_subj)}, test={len(test_subj)}")
    print(f"Samples: train={len(y_train)}, val={len(y_val)}, test={len(y_test)}")
    return (X_train, y_train), (X_val, y_val), (X_test, y_test)


# ----------------------
# Model Builders
# ----------------------
def build_attention_lstm(input_shape, n_outputs=1, dropout=DROPOUT, lr=LR):
    """LSTM with multi-head attention"""
    inputs = layers.Input(shape=input_shape)
    
    # LSTM encoder
    lstm1 = layers.LSTM(128, return_sequences=True)(inputs)
    lstm1 = layers.Dropout(dropout)(lstm1)
    
    lstm2 = layers.LSTM(64, return_sequences=True)(lstm1)
    lstm2 = layers.Dropout(dropout)(lstm2)
    
    # Multi-head attention
    attention = layers.MultiHeadAttention(num_heads=4, key_dim=32)(lstm2, lstm2)
    attention = layers.Dropout(dropout)(attention)
    
    # Combine with residual connection
    combined = layers.Add()([lstm2, attention])
    
    # Global pooling
    pooled = layers.GlobalAveragePooling1D()(combined)
    
    # Dense layers
    x = layers.Dense(64, activation='relu')(pooled)
    x = layers.Dropout(dropout)(x)
    x = layers.Dense(32, activation='relu')(x)
    x = layers.Dropout(dropout)(x)
    
    # Output(s)
    if n_outputs == 1:
        outputs = layers.Dense(1, activation='sigmoid', name='output')(x)
    else:
        outputs = [layers.Dense(1, activation='sigmoid', name=f'output_h{i}')(x) 
                   for i in range(n_outputs)]
    
    model = models.Model(inputs=inputs, outputs=outputs)
    
    if n_outputs == 1:
        model.compile(optimizer=tf.keras.optimizers.Adam(learning_rate=lr),
                      loss='mse',
                      metrics=['mae'])
    else:
        model.compile(optimizer=tf.keras.optimizers.Adam(learning_rate=lr),
                      loss=['mse'] * n_outputs,
                      metrics=[['mae']] * n_outputs)
    
    return model


def build_standard_lstm(input_shape, n_outputs=1, dropout=DROPOUT, lr=LR):
    """Standard LSTM without attention"""
    inputs = layers.Input(shape=input_shape)
    
    x = layers.LSTM(128, return_sequences=True)(inputs)
    x = layers.Dropout(dropout)(x)
    x = layers.LSTM(64, return_sequences=True)(x)
    x = layers.Dropout(dropout)(x)
    x = layers.LSTM(32)(x)
    x = layers.Dropout(dropout)(x)
    
    x = layers.Dense(64, activation='relu')(x)
    x = layers.Dropout(dropout)(x)
    x = layers.Dense(32, activation='relu')(x)
    
    if n_outputs == 1:
        outputs = layers.Dense(1, activation='sigmoid', name='output')(x)
    else:
        outputs = [layers.Dense(1, activation='sigmoid', name=f'output_h{i}')(x) 
                   for i in range(n_outputs)]
    
    model = models.Model(inputs=inputs, outputs=outputs)
    
    if n_outputs == 1:
        model.compile(optimizer=tf.keras.optimizers.Adam(learning_rate=lr),
                      loss='mse',
                      metrics=['mae'])
    else:
        model.compile(optimizer=tf.keras.optimizers.Adam(learning_rate=lr),
                      loss=['mse'] * n_outputs,
                      metrics=['mae'])
    
    return model


def quantile_loss(quantile):
    """Quantile loss function"""
    def loss(y_true, y_pred):
        e = y_true - y_pred
        return tf.reduce_mean(tf.maximum(quantile * e, (quantile - 1) * e))
    return loss


def build_quantile_lstm(input_shape, quantile=0.5, dropout=DROPOUT, lr=LR):
    """LSTM with quantile loss"""
    model = models.Sequential([
        layers.Input(shape=input_shape),
        layers.LSTM(128, return_sequences=True),
        layers.Dropout(dropout),
        layers.LSTM(64, return_sequences=True),
        layers.Dropout(dropout),
        layers.LSTM(32),
        layers.Dropout(dropout),
        layers.Dense(64, activation='relu'),
        layers.Dropout(dropout),
        layers.Dense(32, activation='relu'),
        layers.Dense(1, activation='sigmoid')
    ])
    
    model.compile(optimizer=tf.keras.optimizers.Adam(learning_rate=lr),
                  loss=quantile_loss(quantile),
                  metrics=['mae'])
    return model


# ----------------------
# Evaluation
# ----------------------
def evaluate_multi_horizon(model, X, y, horizons):
    """
    Evaluate multi-horizon model.
    Returns dict with metrics for each horizon.
    """
    preds_list = model.predict(X, batch_size=BATCH_SIZE, verbose=0)
    
    # Handle single vs multiple outputs
    if not isinstance(preds_list, list):
        preds_list = [preds_list]
    
    results = {}
    all_preds = []
    
    for i, h in enumerate(horizons):
        preds_norm = preds_list[i].flatten()
        y_norm = y[:, i]
        
        # Denormalize
        preds = denormalize_spo2(preds_norm)
        y_true = denormalize_spo2(y_norm)
        
        # Metrics
        mae = mean_absolute_error(y_true, preds)
        rmse = np.sqrt(mean_squared_error(y_true, preds))
        
        results[f'H{h}'] = {
            'mae': float(mae),
            'rmse': float(rmse),
            'preds': preds,
            'true': y_true
        }
        all_preds.append(preds)
        
        print(f"  H={h}s: MAE={mae:.4f}, RMSE={rmse:.4f}")
    
    return results, all_preds


def plot_multi_horizon_predictions(results, horizons, n_samples=200, save_path=None):
    """Plot predictions for all horizons"""
    n_horizons = len(horizons)
    fig, axes = plt.subplots(n_horizons, 1, figsize=(12, 3*n_horizons))
    
    if n_horizons == 1:
        axes = [axes]
    
    for i, h in enumerate(horizons):
        ax = axes[i]
        data = results[f'H{h}']
        
        y_true = data['true'][:n_samples]
        y_pred = data['preds'][:n_samples]
        
        ax.plot(y_true, label='True', alpha=0.8, linewidth=2)
        ax.plot(y_pred, label='Predicted', alpha=0.8, linewidth=2)
        ax.set_xlabel('Sample')
        ax.set_ylabel('SpO2 (%)')
        ax.set_title(f'H={h}s Predictions (MAE={data["mae"]:.3f}%, RMSE={data["rmse"]:.3f}%)')
        ax.legend()
        ax.grid(True, alpha=0.3)
    
    plt.tight_layout()
    
    if save_path:
        plt.savefig(save_path, dpi=150, bbox_inches='tight')
    plt.close()


def plot_trajectory_comparison(results, horizons, sample_idx=0, save_path=None):
    """
    Plot a single trajectory showing predictions at multiple horizons.
    Shows how the model's forecast evolves across different time horizons.
    """
    plt.figure(figsize=(12, 6))
    
    # Get true values for all horizons for this sample
    true_vals = [results[f'H{h}']['true'][sample_idx] for h in horizons]
    pred_vals = [results[f'H{h}']['preds'][sample_idx] for h in horizons]
    
    # Plot
    plt.plot([0] + horizons, [true_vals[0]] + true_vals, 'o-', 
             label='True Future', linewidth=2, markersize=8)
    plt.plot([0] + horizons, [pred_vals[0]] + pred_vals, 's--', 
             label='Predicted Future', linewidth=2, markersize=8)
    
    plt.xlabel('Time Ahead (seconds)', fontsize=12)
    plt.ylabel('SpO2 (%)', fontsize=12)
    plt.title(f'Forecast Trajectory Example (Sample {sample_idx})', fontsize=14)
    plt.legend(fontsize=11)
    plt.grid(True, alpha=0.3)
    
    if save_path:
        plt.savefig(save_path, dpi=150, bbox_inches='tight')
    plt.close()


# ----------------------
# Main pipeline
# ----------------------
def main():
    print("="*80)
    print("IMPROVED SPO2 FORECASTING PIPELINE")
    print("="*80)
    print(f"Configuration:")
    print(f"  - Window size: {WINDOW_SIZE}s")
    print(f"  - Horizons: {HORIZONS}")
    print(f"  - Model type: {MODEL_TYPE}")
    print(f"  - Use attention: {USE_ATTENTION}")
    print(f"  - Use features: {USE_FEATURES}")
    print("="*80)
    
    # Find data
    print("\nSearching subject files in", DATA_DIR)
    subjects = find_subject_files(DATA_DIR)
    print(f"Found {len(subjects)} subject files")
    
    if len(subjects) == 0:
        print(f"ERROR: No .txt files found in {DATA_DIR}")
        return

    # Build dataset
    print("\nBuilding dataset...")
    X, y, subj_ids = build_dataset(subjects, W=WINDOW_SIZE, horizons=HORIZONS, 
                                    step=STEP, use_features=USE_FEATURES)
    
    if X is None:
        print("No data built. Exiting.")
        return
    
    print(f"Dataset shape: X={X.shape}, y={y.shape}")
    
    # Split
    (X_train, y_train), (X_val, y_val), (X_test, y_test) = subject_split(
        X, y, subj_ids, test_n=TEST_SUBJECTS, val_n=VAL_SUBJECTS
    )

    # Build model
    print("\nBuilding model...")
    n_outputs = len(HORIZONS)
    input_shape = (X.shape[1], X.shape[2])
    
    if MODEL_TYPE == "multi_horizon":
        if USE_ATTENTION:
            model = build_attention_lstm(input_shape, n_outputs=n_outputs)
        else:
            model = build_standard_lstm(input_shape, n_outputs=n_outputs)
    elif MODEL_TYPE == "quantile":
        # Train 3 models for quantiles 0.1, 0.5, 0.9
        quantiles = [0.1, 0.5, 0.9]
        models_dict = {}
        for q in quantiles:
            print(f"\nTraining quantile model: q={q}")
            model_q = build_quantile_lstm(input_shape, quantile=q)
            model_q.summary()
            
            ckpt_path = os.path.join(OUT_DIR, f"spo2_quantile_{q}.keras")
            es = callbacks.EarlyStopping(monitor='val_loss', patience=PATIENCE, 
                                          restore_best_weights=True, verbose=1)
            cp = callbacks.ModelCheckpoint(ckpt_path, monitor='val_loss', 
                                            save_best_only=True, verbose=1)
            
            history = model_q.fit(X_train, y_train[:, 0],  # First horizon only for quantile
                                validation_data=(X_val, y_val[:, 0]),
                                epochs=EPOCHS,
                                batch_size=BATCH_SIZE,
                                callbacks=[es, cp],
                                verbose=2)
            
            models_dict[q] = tf.keras.models.load_model(ckpt_path, 
                                                         custom_objects={'loss': quantile_loss(q)})
        
        print("\nQuantile models trained. Skipping multi-horizon evaluation.")
        return
    else:
        model = build_standard_lstm(input_shape, n_outputs=n_outputs)
    
    model.summary()

    # Callbacks
    ckpt_path = os.path.join(OUT_DIR, f"spo2_best_model.keras")
    es = callbacks.EarlyStopping(monitor='val_loss', patience=PATIENCE, 
                                  restore_best_weights=True, verbose=1)
    cp = callbacks.ModelCheckpoint(ckpt_path, monitor='val_loss', 
                                    save_best_only=True, verbose=1)
    reduce_lr = callbacks.ReduceLROnPlateau(monitor='val_loss', factor=0.5, 
                                             patience=10, verbose=1, min_lr=1e-6)

    # Training
    print("\nTraining...")
    history = model.fit(X_train, [y_train[:, i] for i in range(n_outputs)],
                        validation_data=(X_val, [y_val[:, i] for i in range(n_outputs)]),
                        epochs=EPOCHS,
                        batch_size=BATCH_SIZE,
                        callbacks=[es, cp, reduce_lr],
                        verbose=2)

    # Load best model
    model = tf.keras.models.load_model(ckpt_path)
    
    # Evaluate
    print("\n" + "="*80)
    print("VALIDATION RESULTS:")
    print("="*80)
    val_results, val_preds = evaluate_multi_horizon(model, X_val, y_val, HORIZONS)
    
    print("\n" + "="*80)
    print("TEST RESULTS:")
    print("="*80)
    test_results, test_preds = evaluate_multi_horizon(model, X_test, y_test, HORIZONS)

    # Save results
    results_summary = {
        'config': {
            'window_size': WINDOW_SIZE,
            'horizons': HORIZONS,
            'use_attention': USE_ATTENTION,
            'use_features': USE_FEATURES,
            'model_type': MODEL_TYPE
        },
        'validation': {h: {'mae': val_results[h]['mae'], 'rmse': val_results[h]['rmse']} 
                      for h in val_results.keys()},
        'test': {h: {'mae': test_results[h]['mae'], 'rmse': test_results[h]['rmse']} 
                for h in test_results.keys()}
    }
    
    summary_path = os.path.join(OUT_DIR, "results_summary.json")
    with open(summary_path, "w") as fw:
        json.dump(results_summary, fw, indent=2)
    print(f"\nResults saved to {summary_path}")

    # Save model
    final_model_path = os.path.join(OUT_DIR, "spo2_final_model.keras")
    model.save(final_model_path)
    print(f"Model saved to {final_model_path}")

    # Visualizations
    print("\nGenerating plots...")
    
    # Plot all horizons
    plot_path = os.path.join(OUT_DIR, "predictions_all_horizons.png")
    plot_multi_horizon_predictions(test_results, HORIZONS, n_samples=200, save_path=plot_path)
    print(f"Saved multi-horizon plot to {plot_path}")
    
    # Plot trajectory for a few samples
    for i in range(min(3, len(y_test))):
        traj_path = os.path.join(OUT_DIR, f"trajectory_sample_{i}.png")
        plot_trajectory_comparison(test_results, HORIZONS, sample_idx=i, save_path=traj_path)
    print(f"Saved trajectory plots")
    
    # Plot training history
    plt.figure(figsize=(12, 4))
    plt.subplot(1, 2, 1)
    for i, h in enumerate(HORIZONS):
        if f'output_h{i}_loss' in history.history:
            plt.plot(history.history[f'output_h{i}_loss'], label=f'H{h}s train')
            plt.plot(history.history[f'val_output_h{i}_loss'], label=f'H{h}s val', linestyle='--')
    plt.xlabel('Epoch')
    plt.ylabel('Loss')
    plt.title('Training Loss by Horizon')
    plt.legend()
    plt.grid(True, alpha=0.3)
    
    plt.subplot(1, 2, 2)
    for i, h in enumerate(HORIZONS):
        if f'output_h{i}_mae' in history.history:
            plt.plot(history.history[f'output_h{i}_mae'], label=f'H{h}s train')
            plt.plot(history.history[f'val_output_h{i}_mae'], label=f'H{h}s val', linestyle='--')
    plt.xlabel('Epoch')
    plt.ylabel('MAE')
    plt.title('Training MAE by Horizon')
    plt.legend()
    plt.grid(True, alpha=0.3)
    
    plt.tight_layout()
    history_path = os.path.join(OUT_DIR, "training_history.png")
    plt.savefig(history_path, dpi=150, bbox_inches='tight')
    plt.close()
    print(f"Saved training history to {history_path}")

    # TFLite conversion
    try:
        print("\nConverting to TFLite...")
        converter = tf.lite.TFLiteConverter.from_keras_model(model)
        converter.optimizations = [tf.lite.Optimize.DEFAULT]
        
        def rep_gen():
            for i in range(min(100, X_train.shape[0])):
                yield [X_train[i:i+1].astype(np.float32)]
        
        converter.representative_dataset = rep_gen
        tflite_model = converter.convert()
        
        tflite_path = os.path.join(OUT_DIR, "spo2_model.tflite")
        with open(tflite_path, "wb") as f:
            f.write(tflite_model)
        print(f"TFLite model saved to {tflite_path}")
    except Exception as e:
        print(f"TFLite conversion failed: {e}")

    print("\n" + "="*80)
    print("TRAINING COMPLETE!")
    print("="*80)


if __name__ == "__main__":
    main()