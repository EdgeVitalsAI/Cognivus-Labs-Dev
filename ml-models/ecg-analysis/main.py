# train_ecg_rnn.py
import os
import wfdb
import numpy as np
from scipy.signal import iirnotch, butter, filtfilt, resample_poly
from sklearn.model_selection import train_test_split
from sklearn.utils.class_weight import compute_class_weight
import tensorflow as tf

# -----------------------
# Config
# -----------------------
DATA_DIR = r"E:\PulseSync\data\ECG"   # path where .hea/.dat/.atr live
FS_TARGET = 360   # target sample rate used by MIT-BIH models (360 Hz)
WIN_SEC = 2.0     # window length in seconds
STEP_SEC = 1.0    # step (overlap) in seconds
BATCH_SIZE = 64
EPOCHS = 5
MODEL_SAVE_PATH = "ecg_lstm_model.h5"


# -----------------------
# Helpers: filters & preprocess
# -----------------------
def notch_filter(signal, fs, f0=50.0, Q=30):
    b, a = iirnotch(f0/(fs/2), Q)
    return filtfilt(b, a, signal)

def bandpass_filter(signal, fs, low=0.5, high=45.0, order=4):
    b, a = butter(order, [low/(fs/2), high/(fs/2)], btype='band')
    return filtfilt(b, a, signal)

def resample_to_target(sig, fs_src, fs_tgt):
    if fs_src == fs_tgt:
        return sig
    # use resample_poly for anti-aliasing
    gcd = np.gcd(int(fs_tgt), int(fs_src))
    up = int(fs_tgt // gcd)
    down = int(fs_src // gcd)
    return resample_poly(sig, up, down)

# -----------------------
# Load single record (local)
# -----------------------
def load_record_local(basepath):
    """
    basepath: full path without extension, e.g. r"E:\PulseSync\data\mitdbdir\100"
    returns: signal (n_samples x n_channels), fs, annotation_samples, annotation_symbols
    """
    rec = wfdb.rdrecord(basepath)      # reads local .dat/.hea
    ann = wfdb.rdann(basepath, 'atr')  # reads local .atr
    return rec.p_signal, rec.fs, ann.sample, ann.symbol

# -----------------------
# Create windows and labels
# -----------------------
def windows_and_labels(signal, fs, ann_samples, ann_symbols, win_sec=WIN_SEC, step_sec=STEP_SEC):
    win_len = int(win_sec * fs)
    step = int(step_sec * fs)
    X_windows = []
    y_labels = []
    # simple binary rule: label = 1 if any annotation in window != 'N'
    # (N = normal) — you can change mapping as needed
    for start in range(0, len(signal) - win_len + 1, step):
        end = start + win_len
        win = signal[start:end]
        # find annotations in this window:
        # ann_samples is an array of sample indices
        idxs = np.where((ann_samples >= start) & (ann_samples < end))[0]
        label = 0  # default normal
        if idxs.size > 0:
            syms = [ann_symbols[i] for i in idxs]
            # simple heuristic: if any symbol != 'N' => abnormal
            if any(s != 'N' for s in syms):
                label = 1
        X_windows.append(win)
        y_labels.append(label)
    return np.array(X_windows), np.array(y_labels)

# -----------------------
# Preprocessing pipeline applied to a single 1D lead
# -----------------------
def preprocess_signal_lead(raw_signal, fs_raw, fs_target=FS_TARGET):
    s = raw_signal.astype(np.float32)
    # (1) Resample to target fs
    s = resample_to_target(s, fs_raw, fs_target)
    # (2) Notch mains interference (50Hz) - only if needed
    try:
        s = notch_filter(s, fs_target, f0=50.0)
    except Exception:
        pass
    # (3) Bandpass
    s = bandpass_filter(s, fs_target, low=0.5, high=45.0)
    return s

# -----------------------
# Process all records in folder
# -----------------------
def build_dataset_from_folder(folder):
    X_all = []
    y_all = []
    record_files = [f for f in os.listdir(folder) if f.endswith('.hea')]
    print("Found records:", record_files)
    for hea in record_files:
        base = os.path.join(folder, hea[:-4])
        try:
            signal_matrix, fs, ann_samples, ann_symbols = load_record_local(base)
        except Exception as e:
            print(f"Skipping {base} due to error: {e}")
            continue
        # choose a single lead: use lead 0 (MLII)
        lead0 = signal_matrix[:,0]
        proc = preprocess_signal_lead(lead0, fs, FS_TARGET)
        X_win, y_win = windows_and_labels(proc, FS_TARGET, ann_samples, ann_symbols)
        X_all.append(X_win)
        y_all.append(y_win)
        print(f"Processed {hea}: windows {X_win.shape}, labels {np.bincount(y_win)}")
    if len(X_all) == 0:
        raise RuntimeError("No records processed. Check paths and files.")
    X = np.concatenate(X_all, axis=0)
    y = np.concatenate(y_all, axis=0)
    return X, y

# -----------------------
# Main: build, train process
# -----------------------
def main():
    print("Building dataset from", DATA_DIR)
    X, y = build_dataset_from_folder(DATA_DIR)
    print("Total windows:", X.shape, "Labels distribution:", np.bincount(y))

    # reshape for model: (N, timesteps, channels)
    X = X[..., np.newaxis].astype(np.float32)

    # simple normalization: z-score per window
    eps = 1e-8
    X = (X - X.mean(axis=1, keepdims=True)) / (X.std(axis=1, keepdims=True) + eps)

    # train/val split (random). For clinical work do patient-wise split instead.
    X_train, X_val, y_train, y_val = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)

    # compute class weights to handle imbalance
    classes = np.unique(y_train)
    class_weights = compute_class_weight('balanced', classes=classes, y=y_train)
    cw = {int(c): w for c,w in zip(classes, class_weights)}
    print("Class weights:", cw)

    # build model
    timesteps = X_train.shape[1]
    model = tf.keras.models.Sequential([
        tf.keras.layers.Conv1D(32, kernel_size=7, padding='same', activation='relu', input_shape=(timesteps,1)),
        tf.keras.layers.BatchNormalization(),
        tf.keras.layers.MaxPool1D(2),
        tf.keras.layers.Conv1D(64, kernel_size=5, padding='same', activation='relu'),
        tf.keras.layers.MaxPool1D(2),
        tf.keras.layers.TimeDistributed(tf.keras.layers.Flatten()),
        tf.keras.layers.LSTM(128, return_sequences=False),
        tf.keras.layers.Dense(64, activation='relu'),
        tf.keras.layers.Dropout(0.3),
        tf.keras.layers.Dense(1, activation='sigmoid')
    ])
    model.compile(optimizer=tf.keras.optimizers.Adam(1e-3),
                  loss='binary_crossentropy',
                  metrics=['accuracy', tf.keras.metrics.AUC(name='auc')])
    model.summary()

    # callbacks
    callbacks = [
        tf.keras.callbacks.ModelCheckpoint("best_ecg_model.h5", monitor='val_auc', mode='max', save_best_only=True),
        tf.keras.callbacks.EarlyStopping(monitor='val_auc', mode='max', patience=6, restore_best_weights=True),
        tf.keras.callbacks.ReduceLROnPlateau(monitor='val_auc', mode='max', factor=0.5, patience=3)
    ]

    # train
    model.fit(X_train, y_train, validation_data=(X_val, y_val),
              epochs=EPOCHS, batch_size=BATCH_SIZE, class_weight=cw, callbacks=callbacks)

    # save final model
    model.save(MODEL_SAVE_PATH)
    print("Saved model to", MODEL_SAVE_PATH)

if __name__ == "__main__":
    main()