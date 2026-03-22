import numpy as np
import tensorflow as tf
from scipy.signal import resample_poly, iirnotch, butter, filtfilt

# Load trained model
model = tf.keras.models.load_model("Models/ecg_lstm_model.h5")

FS_SENSOR = 250
FS_TARGET = 360
WIN_SEC = 2.0
timesteps = int(FS_TARGET * WIN_SEC)

# ---------- Preprocessing functions ----------
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

def preprocess_signal(raw_signal, fs_raw):
    s = raw_signal.astype(np.float32)
    s = resample_to_target(s, fs_raw, FS_TARGET)
    try:
        s = notch_filter(s, FS_TARGET, f0=50.0)
    except Exception:
        pass
    s = bandpass_filter(s, FS_TARGET, low=0.5, high=45.0)
    s = (s - np.mean(s)) / (np.std(s) + 1e-8)
    return s

# ---------- Generate test signals ----------
def generate_normal_ecg(fs, duration):
    """Normal sinus rhythm - healthy heartbeat"""
    np.random.seed(42)
    t = np.linspace(0, duration, int(fs * duration))
    heart_rate = 75
    beat_interval = 60 / heart_rate
    signal = np.zeros_like(t)
    
    for beat_time in np.arange(0, duration, beat_interval):
        p_center = beat_time + 0.08
        signal += 0.15 * np.exp(-((t - p_center) ** 2) / (2 * 0.01 ** 2))
        
        qrs_center = beat_time + 0.2
        signal += 1.2 * np.exp(-((t - qrs_center) ** 2) / (2 * 0.015 ** 2))
        
        t_center = beat_time + 0.38
        signal += 0.3 * np.exp(-((t - t_center) ** 2) / (2 * 0.04 ** 2))
    
    signal += np.random.normal(0, 0.05, len(t))
    return signal

def generate_abnormal_ecg(fs, duration):
    """Severe arrhythmia - chaotic pattern"""
    np.random.seed(555)
    t = np.linspace(0, duration, int(fs * duration))
    signal = np.zeros_like(t)
    
    # Completely random spikes at irregular intervals
    num_spikes = np.random.randint(8, 15)
    spike_times = np.sort(np.random.uniform(0, duration, num_spikes))
    
    for spike_time in spike_times:
        amplitude = np.random.uniform(0.5, 2.0)
        width = np.random.uniform(0.01, 0.05)
        signal += amplitude * np.exp(-((t - spike_time) ** 2) / (2 * width ** 2))
        
        if np.random.rand() > 0.5:
            signal -= amplitude * 0.5 * np.exp(-((t - (spike_time + 0.03)) ** 2) / (2 * width ** 2))
    
    # Heavy irregular baseline
    signal += 0.3 * np.sin(2 * np.pi * 0.8 * t)
    signal += 0.2 * np.sin(2 * np.pi * 1.7 * t)
    signal += np.random.normal(0, 0.2, len(t))
    
    return signal

# ---------- Prediction function ----------
def predict_ecg(raw_signal, fs_raw, label):
    """
    Process ECG signal and predict arrhythmia
    
    Args:
        raw_signal: Raw ECG samples (numpy array)
        fs_raw: Sampling frequency of raw signal
        label: Description label for output
    
    Returns:
        probability: Arrhythmia probability (0-1)
    """
    print(f"\n{'='*70}")
    print(f"  {label}")
    print(f"{'='*70}")
    
    # Preprocess
    processed = preprocess_signal(raw_signal, fs_raw)
    
    # Reshape for LSTM model
    X = processed.reshape(1, timesteps, 1)
    
    # Predict
    probability = model.predict(X, verbose=0)[0][0]
    
    # Determine classification
    if probability > 0.5:
        result = "⚠️  ABNORMAL"
        confidence = probability * 100
        risk_level = "HIGH RISK" if probability > 0.8 else "MEDIUM RISK"
    else:
        result = "✅ NORMAL"
        confidence = (1 - probability) * 100
        risk_level = "LOW RISK"
    
    # Display results
    print(f"  Raw signal shape:        {raw_signal.shape}")
    print(f"  Processed shape:         {processed.shape}")
    print(f"  Model input shape:       {X.shape}")
    print(f"  ")
    print(f"  Arrhythmia Probability:  {probability:.4f}")
    print(f"  Classification:          {result}")
    print(f"  Confidence:              {confidence:.1f}%")
    print(f"  Risk Level:              {risk_level}")
    
    return probability

# ---------- Main execution ----------
if __name__ == "__main__":
    print("\n" + "="*70)
    print("  ECG ARRHYTHMIA DETECTION - DUMMY DATA TEST")
    print("="*70)
    
    # Generate test signals
    print("\n📊 Generating dummy ECG signals...")
    normal_signal = generate_normal_ecg(FS_SENSOR, WIN_SEC)
    abnormal_signal = generate_abnormal_ecg(FS_SENSOR, WIN_SEC)
    
    print(f"  ✓ Normal ECG generated:   {normal_signal.shape}")
    print(f"  ✓ Abnormal ECG generated: {abnormal_signal.shape}")
    
    # Run predictions
    print("\n🔬 Running Model Predictions...")
    
    prob_normal = predict_ecg(normal_signal, FS_SENSOR, "TEST 1: Normal Sinus Rhythm")
    prob_abnormal = predict_ecg(abnormal_signal, FS_SENSOR, "TEST 2: Severe Arrhythmia")
    
    # Final summary
    print(f"\n{'='*70}")
    print("  FINAL SUMMARY")
    print(f"{'='*70}")
    print(f"  {'Test Case':<30} {'Probability':<12} {'Result':<15}")
    print(f"  {'-'*68}")
    print(f"  {'Normal Sinus Rhythm':<30} {prob_normal:<12.4f} {'✅ NORMAL' if prob_normal <= 0.5 else '⚠️  ABNORMAL':<15}")
    print(f"  {'Severe Arrhythmia':<30} {prob_abnormal:<12.4f} {'✅ NORMAL' if prob_abnormal <= 0.5 else '⚠️  ABNORMAL':<15}")
    print(f"{'='*70}\n")
    
    # Validation check
    if prob_normal < 0.5 and prob_abnormal > 0.5:
        print("✅ MODEL VALIDATION: PASSED - Model correctly distinguished normal from abnormal!")
    elif prob_normal < 0.5 and prob_abnormal < 0.5:
        print("⚠️  MODEL VALIDATION: PARTIAL - Normal detected correctly, but abnormal classified as normal")
    else:
        print("❌ MODEL VALIDATION: FAILED - Model predictions unexpected")
    
    # Export model in native Keras format (most compatible)
    print("\n" + "="*70)
    print("  EXPORTING MODEL TO .KERAS FORMAT")
    print("="*70)
    try:
        keras_file = "Models/ecg_lstm_model.keras"
        model.save(keras_file)
        print(f"✅ Model exported to .keras format: {keras_file}")
        print(f"  This format is compatible with TensorFlow 2.13+")
        print(f"  Update backend to load from: {keras_file}")
    except Exception as e:
        print(f"❌ Export failed: {e}")