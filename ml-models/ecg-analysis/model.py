import numpy as np
import tensorflow as tf
from scipy.signal import resample_poly, iirnotch, butter, filtfilt

# load trained model
model = tf.keras.models.load_model("Models\Trained\ecg_lstm_model.h5")

FS_SENSOR = 250   # example: your ECG sensor outputs 250Hz (check your datasheet)
FS_TARGET = 360   # model’s target
WIN_SEC = 2.0
timesteps = int(FS_TARGET * WIN_SEC)   # 720

# ---------- same preprocessing as training ----------
def notch_filter(signal, fs, f0=50.0, Q=30):
    b, a = iirnotch(f0/(fs/2), Q)
    return filtfilt(b, a, signal)

def bandpass_filter(signal, fs, low=0.5, high=45.0, order=4):
    b, a = butter(order, [low/(fs/2), high/(fs/2)], btype='band')
    return filtfilt(b, a, signal)

def resample_to_target(sig, fs_src, fs_tgt):
    if fs_src == fs_tgt:
        return sig
    gcd = np.gcd(int(fs_tgt), int(fs_src))
    up = int(fs_tgt // gcd)
    down = int(fs_src // gcd)
    return resample_poly(sig, up, down)

# main pipeline like thing
def preprocess_signal(raw_signal, fs_raw):
    s = raw_signal.astype(np.float32)
    s = resample_to_target(s, fs_raw, FS_TARGET)
    try:
        s = notch_filter(s, FS_TARGET, f0=50.0)
    except Exception:
        pass
    s = bandpass_filter(s, FS_TARGET, low=0.5, high=45.0)
    # z-score normalization (same as training)
    s = (s - np.mean(s)) / (np.std(s) + 1e-8)
    return s
# ---------------------------------------------------

# Example: suppose you already collected 2 seconds of raw sensor samples
raw_samples = np.random.randn(int(FS_SENSOR * WIN_SEC))  # replace with actual sensor data array

# 1) preprocess
proc = preprocess_signal(raw_samples, FS_SENSOR)

# 2) reshape for model
X = proc.reshape(1, timesteps, 1)   # shape (1,720,1)

# 3) inference
prob = model.predict(X)[0][0]
print("Arrhythmia probability:", prob)
if prob > 0.5:
    print("⚠️ Abnormal heartbeat detected")
else:
    print("✅ Normal")
