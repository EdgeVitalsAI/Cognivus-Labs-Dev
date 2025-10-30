"""
train_osv_spo2_forecast.py

End-to-end pipeline:
- Load OSV dataset (WFDB .dat/.hea or .txt signal files)
- Preprocess SpO2 signal (cleaning, clipping, optional smoothing)
- Create sliding windows features and targets for forecasting horizon
- Subject-wise split (train/val/test)
- Train LSTM model and evaluate
- Save model and convert to TFLite

Author: EdgeVitalsAI / CognivusLabs (example)
Date: 2025-10-28
"""

import os
import glob
import numpy as np
import pandas as pd
import json
from scipy.signal import medfilt
from sklearn.metrics import mean_absolute_error
import tensorflow as tf
from tensorflow.keras import layers, models, callbacks
import matplotlib.pyplot as plt

# ----------------------
# Config / Hyperparams
# ----------------------
DATA_DIR = "data/Oxygen"   # path to folder containing dataset files
SAMPLE_RATE = 1         # OSV is 1 Hz
WINDOW_SIZE = 60        # window length in seconds (e.g., 60 for 1 min history)
HORIZONS = [60, 300]    # forecast horizons in seconds: 60s (1 min), 300s (5 min)
STEP = 1                # sliding window step in seconds
MIN_VALID_SAMPLES = 100  # minimum valid samples per subject to include
TEST_SUBJECTS = 5       # number of subjects to reserve for test
VAL_SUBJECTS = 5        # number of subjects to reserve for val
RANDOM_SEED = 42

# Training hyperparams
BATCH_SIZE = 64
EPOCHS = 10
LR = 0.001
PATIENCE = 15   
DROPOUT = 0.3

# Output
OUT_DIR = "outputs"
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
        # subject id = filename without extension
        subj_id = os.path.splitext(os.path.basename(f))[0]
        subjects[subj_id] = f
    return subjects


def load_signal_for_subject(txt_path):
    """
    Load SpO2 signal from text file.
    Supports:
      - One-column numeric text
      - CSV-like text with header
    Returns numpy array of SpO2 values and 1Hz sampling rate.
    """
    try:
        # Try reading as plain one-column numeric file
        try:
            df = pd.read_csv(txt_path, header=None)
        except Exception:
            df = pd.read_csv(txt_path)
        # Select first numeric column
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
    """
    Basic cleaning for SpO2:
    - convert to numpy float
    - remove NaNs (interpolate)
    - clip to physiological range [60, 100]
    - median filter to remove isolated spikes
    """
    sig = np.array(signal, dtype=np.float32)
    if sig.size == 0:
        return sig
    # handle NaN
    nans = np.isnan(sig)
    if nans.any():
        # forward fill then backfill using pandas
        s = pd.Series(sig)
        s = s.ffill().bfill()  # Updated method names
        sig = s.values.astype(np.float32)
    # clip
    sig = np.clip(sig, 60.0, 100.0)
    # median filter (kernel 3) to remove single-sample spikes
    try:
        sig = medfilt(sig, kernel_size=3)
    except Exception:
        pass
    return sig

def normalize_spo2(signal):
    """
    Normalize SpO2 to [0, 1] range for better training.
    Assumes signal is already clipped to [60, 100].
    """
    return (signal - 60.0) / 40.0

def denormalize_spo2(signal_normalized):
    """
    Convert normalized SpO2 back to original scale [60, 100].
    """
    return signal_normalized * 40.0 + 60.0

def detrend_signal(signal, window=300):
    """
    Optional: remove slow drift using rolling median subtraction.
    """
    s = pd.Series(signal)
    med = s.rolling(window=window, min_periods=1, center=True).median()
    detrended = (s - med).values
    # add baseline back (median of original)
    baseline = float(np.nanmedian(signal))
    return detrended + baseline

# ----------------------
# Windowing
# ----------------------
def create_windows(signal, W=60, H=60, step=1):
    """
    Create sliding windows of length W and target at horizon H seconds ahead.
    Returns X (n_windows, W), y (n_windows,)
    """
    X = []
    y = []
    N = len(signal)
    # require that target index exists: index target = start + W + H -1
    for start in range(0, N - W - H + 1, step):
        end = start + W
        target_idx = end + H - 1
        X.append(signal[start:end])
        y.append(signal[target_idx])
    if len(X) == 0:
        return np.empty((0, W)), np.empty((0,))
    return np.stack(X).astype(np.float32), np.array(y).astype(np.float32)

# ----------------------
# Data assembly
# ----------------------
def build_dataset(subjects_dict, W=60, H=60, step=1, min_samples=MIN_VALID_SAMPLES):
    """
    Loads and preprocesses all text files, constructs windows, and assigns subject IDs.
    """
    X_list, y_list, subj_list = [], [], []
    subj_keys = sorted(subjects_dict.keys())

    for subj_key in subj_keys:
        path = subjects_dict[subj_key]
        sig, fs = load_signal_for_subject(path)
        if sig is None or len(sig) < (W + H):
            print(f"Skipping {subj_key}: insufficient data")
            continue

        sig = clean_spo2(sig)
        sig = normalize_spo2(sig)  # Normalize to [0, 1]
        if len(sig) < min_samples:
            print(f"Skipping {subj_key}: too few valid samples ({len(sig)})")
            continue

        X_sub, y_sub = create_windows(sig, W=W, H=H, step=step)
        if X_sub.shape[0] == 0:
            continue

        X_list.append(X_sub)
        y_list.append(y_sub)
        subj_list.extend([subj_key] * len(y_sub))

        print(f"Subject {subj_key}: signal_len={len(sig)}, windows={X_sub.shape[0]}")

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
    """
    Split by subjects: reserve test_n subjects and val_n subjects.
    Returns dictionaries of arrays.
    """
    unique_subj = np.unique(subj_ids)
    
    # Check if we have enough subjects
    if len(unique_subj) < test_n + val_n:
        print(f"Warning: Not enough subjects ({len(unique_subj)}) for requested split.")
        print(f"Adjusting split sizes...")
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
# LSTM Model builder
# ----------------------
def build_lstm_model(input_shape, dropout=DROPOUT, lr=LR):
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
        layers.Dense(1, activation='sigmoid')  # sigmoid for [0,1] normalized output
    ])
    model.compile(optimizer=tf.keras.optimizers.Adam(learning_rate=lr),
                  loss='mse',  # MSE often works better for regression
                  metrics=['mae', 'mse'])
    return model

# ----------------------
# Training & evaluation helpers
# ----------------------
def evaluate_model(model, X, y):
    """
    Predict and return (mae, rmse, preds)
    Predictions are denormalized back to original SpO2 scale.
    """
    preds_norm = model.predict(X, batch_size=BATCH_SIZE, verbose=0).flatten()
    
    # Denormalize predictions and true values
    preds = denormalize_spo2(preds_norm)
    y_true = denormalize_spo2(y)
    
    # ensure numpy arrays and same dtype
    y_true = np.asarray(y_true).astype(np.float32).flatten()
    preds = np.asarray(preds).astype(np.float32).flatten()

    mae = mean_absolute_error(y_true, preds)
    rmse = np.sqrt(np.mean((y_true - preds) ** 2))
    return mae, rmse, preds

def plot_predictions(y_true, y_pred, title="Prediction", save_path=None):
    plt.figure(figsize=(10,4))
    plt.plot(y_true, label="true", alpha=0.8)
    plt.plot(y_pred, label="pred", alpha=0.8)
    plt.legend()
    plt.title(title)
    plt.xlabel("Sample")
    plt.ylabel("SpO2 (%)")
    plt.grid(True, alpha=0.3)
    if save_path:
        plt.savefig(save_path, dpi=150, bbox_inches='tight')
    plt.close()

# ----------------------
# Main pipeline
# ----------------------
def main():
    print("Searching subject files in", DATA_DIR)
    subjects = find_subject_files(DATA_DIR)
    print(f"Found {len(subjects)} subject keys")
    
    if len(subjects) == 0:
        print(f"ERROR: No .txt files found in {DATA_DIR}")
        print("Please check the DATA_DIR path is correct.")
        return

    # Build dataset for each horizon separately
    results_summary = {}
    for H in HORIZONS:
        print("="*60)
        print(f"Preparing dataset for horizon H={H} sec (W={WINDOW_SIZE}, step={STEP})")
        X, y, subj_ids = build_dataset(subjects, W=WINDOW_SIZE, H=H, step=STEP)
        if X is None:
            print("No data built. Skipping this horizon.")
            continue
        # reshape for LSTM: (n_samples, W, 1)
        X = X.reshape((X.shape[0], X.shape[1], 1))
        (X_train, y_train), (X_val, y_val), (X_test, y_test) = subject_split(
            X, y, subj_ids, test_n=TEST_SUBJECTS, val_n=VAL_SUBJECTS
        )

        # build model
        model = build_lstm_model(input_shape=(WINDOW_SIZE, 1))
        model.summary()

        # callbacks
        ckpt_path = os.path.join(OUT_DIR, f"spo2_lstm_H{H}_best.keras")
        es = callbacks.EarlyStopping(monitor='val_mae', patience=PATIENCE, 
                                      restore_best_weights=True, verbose=1)
        cp = callbacks.ModelCheckpoint(ckpt_path, monitor='val_mae', 
                                        save_best_only=True, verbose=1)

        # training
        history = model.fit(X_train, y_train,
                            validation_data=(X_val, y_val),
                            epochs=EPOCHS,
                            batch_size=BATCH_SIZE,
                            callbacks=[es, cp],
                            verbose=2)

        # load best
        model = tf.keras.models.load_model(ckpt_path)

        # evaluate
        mae_val, rmse_val, preds_val = evaluate_model(model, X_val, y_val)
        mae_test, rmse_test, preds_test = evaluate_model(model, X_test, y_test)

        print(f"\nH={H}: VAL MAE={mae_val:.4f}, VAL RMSE={rmse_val:.4f}")
        print(f"H={H}: TEST MAE={mae_test:.4f}, TEST RMSE={rmse_test:.4f}")

        # save final model (Keras format)
        final_keras = os.path.join(OUT_DIR, f"spo2_lstm_H{H}.keras")
        model.save(final_keras)
        print("Saved model to", final_keras)

        # convert to TFLite (optional quantized)
        try:
            converter = tf.lite.TFLiteConverter.from_keras_model(model)
            converter.optimizations = [tf.lite.Optimize.DEFAULT]
            # representative dataset for quantization
            def rep_gen():
                for i in range(min(100, X_train.shape[0])):
                    yield [X_train[i:i+1].astype(np.float32)]
            converter.representative_dataset = rep_gen
            converter.target_spec.supported_ops = [tf.lite.OpsSet.TFLITE_BUILTINS_INT8]
            # ensure input/output are int8
            converter.inference_input_type = tf.int8
            converter.inference_output_type = tf.int8
            tflite_model = converter.convert()
            tflite_path = os.path.join(OUT_DIR, f"spo2_lstm_H{H}.tflite")
            with open(tflite_path, "wb") as f:
                f.write(tflite_model)
            print("Saved TFLite model to", tflite_path)
        except Exception as e:
            print("TFLite conversion failed:", e)

        # store summary
        results_summary[H] = {
            "val_mae": float(mae_val), "val_rmse": float(rmse_val),
            "test_mae": float(mae_test), "test_rmse": float(rmse_test),
            "model_keras": final_keras
        }

        # quick plots (first 200 points)
        try:
            plot_path = os.path.join(OUT_DIR, f"predictions_H{H}.png")
            # Denormalize y_test for plotting
            y_test_denorm = denormalize_spo2(y_test[:200])
            plot_predictions(y_test_denorm, preds_test[:200], 
                           title=f"H={H}s Test Predictions (first 200)", 
                           save_path=plot_path)
            print(f"Saved plot to {plot_path}")
        except Exception as e:
            print(f"Plotting failed: {e}")

    # save results summary
    summary_path = os.path.join(OUT_DIR, "results_summary.json")
    with open(summary_path, "w") as fw:
        json.dump(results_summary, fw, indent=2)
    print(f"\nAll done. Results summary saved to {summary_path}")


if __name__ == "__main__":
    main()