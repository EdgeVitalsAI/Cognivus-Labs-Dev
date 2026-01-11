"""
Real-Time ECG Arrhythmia Detection System
==========================================
Connects to ESP32, collects ECG data, and runs inference using your trained LSTM model.

Requirements:
pip install websocket-client numpy tensorflow scipy

Usage:
python realtime_ecg_monitor.py
"""

import numpy as np
import tensorflow as tf
from scipy.signal import resample_poly, iirnotch, butter, filtfilt
import websocket
import json
import threading
import time
from collections import deque
from datetime import datetime

# ============= CONFIGURATION =============
ESP32_IP = "192.168.1.10"
WEBSOCKET_PORT = 81
MODEL_PATH = "E:\Projects\Cognivus-Labs-Dev\ml-models\ecg-analysis\models\ecg_lstm_model.h5"

FS_SENSOR = 250   # Your ECG sensor sampling rate
FS_TARGET = 360   # Model's expected sampling rate
WIN_SEC = 2.0     # Window size in seconds
TIMESTEPS = int(FS_TARGET * WIN_SEC)  # 720 samples

# How many samples to collect before running inference
SAMPLES_NEEDED = int(FS_SENSOR * WIN_SEC)  # 500 samples at 250Hz = 2 seconds
# =========================================

# Global data buffer (thread-safe with deque)
ecg_buffer = deque(maxlen=SAMPLES_NEEDED * 2)  # Keep extra for continuous monitoring
inference_lock = threading.Lock()

# Statistics
total_inferences = 0
abnormal_count = 0
normal_count = 0

# Load trained model
print("🔄 Loading trained model...")
try:
    model = tf.keras.models.load_model(MODEL_PATH)
    print("✅ Model loaded successfully!")
    print(f"   Model expects input shape: (batch, {TIMESTEPS}, 1)")
except Exception as e:
    print(f"❌ Error loading model: {e}")
    print("   Make sure the model path is correct!")
    exit(1)

# ---------- PREPROCESSING FUNCTIONS (Same as training) ----------
def notch_filter(signal, fs, f0=50.0, Q=30):
    """Remove 50Hz powerline interference"""
    b, a = iirnotch(f0/(fs/2), Q)
    return filtfilt(b, a, signal)

def bandpass_filter(signal, fs, low=0.5, high=45.0, order=4):
    """Bandpass filter to keep ECG relevant frequencies"""
    b, a = butter(order, [low/(fs/2), high/(fs/2)], btype='band')
    return filtfilt(b, a, signal)

def resample_to_target(sig, fs_src, fs_tgt):
    """Resample signal from sensor rate to model's expected rate"""
    if fs_src == fs_tgt:
        return sig
    gcd = np.gcd(int(fs_tgt), int(fs_src))
    up = int(fs_tgt // gcd)
    down = int(fs_src // gcd)
    return resample_poly(sig, up, down)

def preprocess_signal(raw_signal, fs_raw):
    """Complete preprocessing pipeline"""
    s = raw_signal.astype(np.float32)
    
    # Resample to target frequency
    s = resample_to_target(s, fs_raw, FS_TARGET)
    
    # Apply notch filter (remove powerline noise)
    try:
        s = notch_filter(s, FS_TARGET, f0=50.0)
    except Exception as e:
        print(f"⚠️  Notch filter warning: {e}")
    
    # Apply bandpass filter
    s = bandpass_filter(s, FS_TARGET, low=0.5, high=45.0)
    
    # Z-score normalization (same as training)
    s = (s - np.mean(s)) / (np.std(s) + 1e-8)
    
    return s
# ----------------------------------------------------------------

def run_inference(raw_samples):
    """Run model inference on ECG samples"""
    global total_inferences, abnormal_count, normal_count
    
    try:
        # Preprocess
        processed = preprocess_signal(raw_samples, FS_SENSOR)
        
        # Reshape for model: (1, 720, 1)
        X = processed.reshape(1, TIMESTEPS, 1)
        
        # Inference
        prob = model.predict(X, verbose=0)[0][0]
        
        # Update statistics
        total_inferences += 1
        
        timestamp = datetime.now().strftime('%H:%M:%S')
        
        if prob > 0.5:
            abnormal_count += 1
            print(f"\n{'='*60}")
            print(f"⚠️  ABNORMAL HEARTBEAT DETECTED! [{timestamp}]")
            print(f"   Arrhythmia Probability: {prob:.4f} ({prob*100:.2f}%)")
            print(f"   Total Abnormal: {abnormal_count}/{total_inferences}")
            print(f"{'='*60}\n")
        else:
            normal_count += 1
            print(f"✅ Normal [{timestamp}] | Prob: {prob:.4f} | Normal: {normal_count}/{total_inferences}")
        
        return prob
        
    except Exception as e:
        print(f"❌ Inference error: {e}")
        return None

def inference_thread():
    """Continuously monitor buffer and run inference when enough samples collected"""
    global ecg_buffer
    
    print("🔄 Inference thread started...")
    last_inference_time = 0
    min_inference_interval = 1.0  # Run inference at most once per second
    
    while True:
        time.sleep(0.1)  # Check every 100ms
        
        with inference_lock:
            if len(ecg_buffer) >= SAMPLES_NEEDED:
                current_time = time.time()
                
                # Avoid running inference too frequently
                if current_time - last_inference_time >= min_inference_interval:
                    # Get last SAMPLES_NEEDED samples
                    samples = np.array(list(ecg_buffer)[-SAMPLES_NEEDED:])
                    
                    # Run inference in background
                    run_inference(samples)
                    
                    last_inference_time = current_time

def on_message(ws, message):
    """Handle incoming WebSocket messages"""
    try:
        data = json.loads(message)
        
        if data['type'] == 'ecg':
            ecg_value = data['val']
            
            # Add to buffer (thread-safe)
            with inference_lock:
                ecg_buffer.append(ecg_value)
            
            # Print buffer status occasionally
            if len(ecg_buffer) % 100 == 0:
                print(f"📊 Buffer: {len(ecg_buffer)}/{SAMPLES_NEEDED} samples | "
                      f"Inferences: {total_inferences} | "
                      f"Abnormal: {abnormal_count} | Normal: {normal_count}")
        
        elif data['type'] == 'system':
            print(f"🔔 {data.get('msg', 'System message')}")
        
        elif data['type'] == 'ping':
            # Connection keepalive
            pass
            
    except json.JSONDecodeError:
        print(f"❌ Invalid JSON: {message}")
    except Exception as e:
        print(f"❌ Error processing message: {e}")

def on_error(ws, error):
    """Handle WebSocket errors"""
    print(f"❌ WebSocket Error: {error}")

def on_close(ws, close_status_code, close_msg):
    """Handle connection close"""
    print("\n" + "="*60)
    print("🔌 Connection Closed")
    print("="*60)
    print_final_statistics()

def on_open(ws):
    """Handle connection open"""
    print("\n" + "="*60)
    print("✅ Connected to ESP32!")
    print(f"   Server: ws://{ESP32_IP}:{WEBSOCKET_PORT}")
    print(f"   Collecting {SAMPLES_NEEDED} samples ({WIN_SEC}s) before first inference...")
    print("="*60 + "\n")

def print_final_statistics():
    """Print final statistics"""
    print("\n" + "="*60)
    print("📊 FINAL STATISTICS")
    print(f"   Total Inferences: {total_inferences}")
    print(f"   Normal: {normal_count} ({(normal_count/max(total_inferences,1)*100):.1f}%)")
    print(f"   Abnormal: {abnormal_count} ({(abnormal_count/max(total_inferences,1)*100):.1f}%)")
    print("="*60 + "\n")

if __name__ == "__main__":
    print("\n" + "="*60)
    print("🏥 Real-Time ECG Arrhythmia Detection System")
    print("="*60)
    print(f"\n📡 Configuration:")
    print(f"   ESP32 IP: {ESP32_IP}")
    print(f"   Sensor Rate: {FS_SENSOR} Hz")
    print(f"   Model Rate: {FS_TARGET} Hz")
    print(f"   Window Size: {WIN_SEC} seconds ({SAMPLES_NEEDED} samples)")
    print(f"   Model Path: {MODEL_PATH}")
    print("\n🔄 Starting inference thread...")
    
    # Start inference thread
    inference_thread_obj = threading.Thread(target=inference_thread, daemon=True)
    inference_thread_obj.start()
    
    print("🔄 Connecting to ESP32...\n")
    
    # Create WebSocket connection
    websocket_url = f"ws://{ESP32_IP}:{WEBSOCKET_PORT}"
    
    try:
        ws = websocket.WebSocketApp(
            websocket_url,
            on_open=on_open,
            on_message=on_message,
            on_error=on_error,
            on_close=on_close
        )
        
        # Run forever (until Ctrl+C)
        ws.run_forever()
        
    except KeyboardInterrupt:
        print("\n\n⏹️  Stopping... (Ctrl+C pressed)")
        print_final_statistics()
        print("\n✅ Monitoring session completed!\n")
    except Exception as e:
        print(f"\n❌ Fatal Error: {e}")
        print("   Check that:")
        print("   1. ESP32 is powered on and connected to WiFi")
        print("   2. ECG sensor is properly connected")
        print("   3. You're on the same network as the ESP32")
        print("   4. All required libraries are installed\n")