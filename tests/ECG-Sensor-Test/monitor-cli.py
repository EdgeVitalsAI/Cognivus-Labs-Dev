"""
Real-time ECG Monitoring - CLI Only Version
Continuous anomaly detection without GUI
"""

import numpy as np
import tensorflow as tf
from scipy.signal import resample_poly, iirnotch, butter, filtfilt
import serial
import serial.tools.list_ports
import time
from collections import deque
import threading
import queue

# ============ Configuration ============
FS_SENSOR = 250
FS_TARGET = 360
WIN_SEC = 2.0
BUFFER_SIZE = int(FS_SENSOR * WIN_SEC)
PREDICTION_INTERVAL = 1.0
MODEL_PATH = "Models\\Trained\\ecg_lstm_model.h5"
BAUD_RATE = 115200
SERIAL_PORT = None  # Auto-detect

# ============ Preprocessing Functions ============
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
    except:
        pass
    s = bandpass_filter(s, FS_TARGET, low=0.5, high=45.0)
    s = (s - np.mean(s)) / (np.std(s) + 1e-8)
    return s

# ============ Serial Port Detection ============
def find_arduino():
    ports = serial.tools.list_ports.comports()
    for port in ports:
        if 'Arduino' in port.description or 'CH340' in port.description or 'USB' in port.description:
            return port.device
    return None

# ============ ECG Monitor CLI Only ============
class ECGMonitorCLI:
    def __init__(self, model_path, serial_port=None):
        print("Loading model...")
        self.model = tf.keras.models.load_model(model_path)
        print("Model loaded!")
        
        # Data buffers
        self.buffer = deque(maxlen=BUFFER_SIZE)
        
        # Prediction tracking
        self.predictions_history = deque(maxlen=50)
        self.prediction_count = 0
        
        # Statistics
        self.total_predictions = 0
        self.abnormal_count = 0
        self.normal_count = 0
        
        # Serial setup
        if serial_port is None:
            serial_port = find_arduino()
            if serial_port is None:
                raise Exception("Arduino not found!")
        
        print(f"Connecting to {serial_port}...")
        self.serial = serial.Serial(serial_port, BAUD_RATE, timeout=1)
        time.sleep(2)
        self.serial.reset_input_buffer()
        
        print("Waiting for Arduino ready signal (10 seconds timeout)...")
        ready = False
        timeout = 10
        start = time.time()
        
        while time.time() - start < timeout:
            if self.serial.in_waiting > 0:
                line = self.serial.readline().decode('utf-8', errors='ignore').strip()
                print(f"Received: {line}")
                if "ECG_MONITOR_READY" in line:
                    print("✓ Arduino ready!")
                    ready = True
                    break
            time.sleep(0.1)
        
        if not ready:
            print("\n⚠️  Warning: Arduino ready signal not received")
            print("Continuing anyway... Monitor will start when data is received")
        
        # Threading
        self.running = False
        self.data_queue = queue.Queue()
        self.last_prediction_time = time.time()
        self.start_time = time.time()
        
        # Lead status tracking
        self.leads_off = False
        self.last_lead_warning_time = 0
        self.lead_warning_interval = 3.0
        
    def read_serial(self):
        """Read data from Arduino"""
        while self.running:
            try:
                line = self.serial.readline().decode('utf-8', errors='ignore').strip()
                
                if not line:
                    continue
                    
                if "LEADS_OFF" in line:
                    current_time = time.time()
                    if not self.leads_off or (current_time - self.last_lead_warning_time) > self.lead_warning_interval:
                        print("⚠️  Leads disconnected! Check connections.")
                        self.leads_off = True
                        self.last_lead_warning_time = current_time
                    continue
                
                parts = line.split(',')
                if len(parts) == 2:
                    value = int(parts[1])
                    voltage = (value / 1023.0) * 5.0
                    
                    if self.leads_off:
                        print("✓ Leads reconnected - receiving data")
                        self.leads_off = False
                    
                    self.data_queue.put(voltage)
                    
            except Exception as e:
                if self.running:
                    print(f"Serial error: {e}")
                    
    def process_data(self):
        """Process data and run predictions"""
        while self.running:
            try:
                if not self.data_queue.empty():
                    value = self.data_queue.get()
                    self.buffer.append(value)
                    
                    # Run prediction
                    if (len(self.buffer) >= BUFFER_SIZE and 
                        time.time() - self.last_prediction_time >= PREDICTION_INTERVAL):
                        self.run_prediction()
                        self.last_prediction_time = time.time()
                
                time.sleep(0.001)
                
            except Exception as e:
                print(f"Processing error: {e}")
    
    def run_prediction(self):
        """Run ML inference"""
        try:
            raw_signal = np.array(self.buffer)
            processed = preprocess_signal(raw_signal, FS_SENSOR)
            timesteps = int(FS_TARGET * WIN_SEC)
            X = processed.reshape(1, timesteps, 1)
            
            prob = self.model.predict(X, verbose=0)[0][0]
            
            self.predictions_history.append(prob)
            self.prediction_count += 1
            self.total_predictions += 1
            
            # Determine status
            is_abnormal = prob > 0.5
            if is_abnormal:
                status = "⚠️  ABNORMAL"
                self.abnormal_count += 1
            else:
                status = "✅ NORMAL"
                self.normal_count += 1
            
            # Create progress bar
            bar_length = 20
            filled = int(prob * bar_length)
            bar = "█" * filled + "░" * (bar_length - filled)
            
            # Calculate statistics
            if len(self.predictions_history) >= 5:
                recent_avg = np.mean(list(self.predictions_history)[-5:])
                recent_max = np.max(list(self.predictions_history)[-5:])
            else:
                recent_avg = prob
                recent_max = prob
            
            abnormal_rate = (self.abnormal_count / self.total_predictions * 100) if self.total_predictions > 0 else 0
            
            # Print results
            elapsed = time.time() - self.start_time
            print(f"\n{'='*70}")
            print(f"Prediction #{self.prediction_count} | Elapsed: {elapsed:.1f}s")
            print(f"{'='*70}")
            print(f"{status} | [{bar}] {prob:.4f}")
            print(f"Buffer: {len(self.buffer)}/{BUFFER_SIZE} samples")
            print(f"\nStatistics:")
            print(f"  Recent avg (5): {recent_avg:.4f} | Recent max (5): {recent_max:.4f}")
            print(f"  Total: {self.total_predictions} | Normal: {self.normal_count} | Abnormal: {self.abnormal_count}")
            print(f"  Abnormal rate: {abnormal_rate:.1f}%")
            
            if is_abnormal:
                print(f"\n🚨 ALERT: Potential arrhythmia detected!")
                print(f"   Consider medical consultation if pattern continues.")
            
            print(f"{'='*70}\n")
                
        except Exception as e:
            print(f"Prediction error: {e}")
    
    def print_summary(self):
        """Print session summary"""
        print("\n" + "="*70)
        print("SESSION SUMMARY")
        print("="*70)
        elapsed = time.time() - self.start_time
        print(f"Duration: {elapsed:.1f} seconds ({elapsed/60:.1f} minutes)")
        print(f"Total predictions: {self.total_predictions}")
        print(f"Normal: {self.normal_count} ({self.normal_count/self.total_predictions*100:.1f}%)")
        print(f"Abnormal: {self.abnormal_count} ({self.abnormal_count/self.total_predictions*100:.1f}%)")
        
        if len(self.predictions_history) > 0:
            all_probs = list(self.predictions_history)
            print(f"\nProbability statistics:")
            print(f"  Average: {np.mean(all_probs):.4f}")
            print(f"  Min: {np.min(all_probs):.4f}")
            print(f"  Max: {np.max(all_probs):.4f}")
            print(f"  Std dev: {np.std(all_probs):.4f}")
        print("="*70 + "\n")
    
    def start(self):
        """Start monitoring"""
        self.running = True
        
        # Start threads
        self.serial_thread = threading.Thread(target=self.read_serial, daemon=True)
        self.process_thread = threading.Thread(target=self.process_data, daemon=True)
        
        self.serial_thread.start()
        self.process_thread.start()
        
        print("\n" + "="*70)
        print("ECG MONITORING STARTED (CLI MODE)")
        print("="*70)
        print("Collecting data... Predictions will start in ~2 seconds")
        print("Press Ctrl+C to stop monitoring")
        print("="*70 + "\n")
        
    def stop(self):
        """Stop monitoring"""
        self.running = False
        self.print_summary()
        if hasattr(self, 'serial') and self.serial.is_open:
            self.serial.close()
        print("Monitoring stopped.")

# ============ Main ============
def main():
    try:
        monitor = ECGMonitorCLI(MODEL_PATH, SERIAL_PORT)
        monitor.start()
        
        # Keep running until Ctrl+C
        while True:
            time.sleep(1)
        
    except KeyboardInterrupt:
        print("\n\nStopping monitor...")
        monitor.stop()
        
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()