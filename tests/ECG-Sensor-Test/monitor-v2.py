"""
Real-time ECG Monitoring with Anomaly Detection
Reads data from Arduino AD8232, processes it, and runs inference
"""

import numpy as np
import tensorflow as tf
from scipy.signal import resample_poly, iirnotch, butter, filtfilt
import serial
import serial.tools.list_ports
import time
from collections import deque
import matplotlib.pyplot as plt
from matplotlib.animation import FuncAnimation
import threading
import queue

# ============ Configuration ============
FS_SENSOR = 250        # Arduino sampling rate (Hz)
FS_TARGET = 360        # Model's expected sampling rate
WIN_SEC = 2.0          # Window size in seconds
BUFFER_SIZE = int(FS_SENSOR * WIN_SEC)  # 500 samples for 2 seconds
PREDICTION_INTERVAL = 1.0  # Run prediction every 1 second
MODEL_PATH = "Models\Trained\ecg_lstm_model.h5"

# Serial settings
BAUD_RATE = 115200
SERIAL_PORT = None  # Auto-detect, or set manually like "COM3" or "/dev/ttyUSB0"

# ============ Preprocessing Functions ============
def notch_filter(signal, fs, f0=50.0, Q=30):
    """Remove powerline interference"""
    b, a = iirnotch(f0/(fs/2), Q)
    return filtfilt(b, a, signal)

def bandpass_filter(signal, fs, low=0.5, high=45.0, order=4):
    """Bandpass filter to remove baseline wander and high-freq noise"""
    b, a = butter(order, [low/(fs/2), high/(fs/2)], btype='band')
    return filtfilt(b, a, signal)

def resample_to_target(sig, fs_src, fs_tgt):
    """Resample signal to target frequency"""
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
    
    # Apply filters
    try:
        s = notch_filter(s, FS_TARGET, f0=50.0)
    except Exception as e:
        print(f"Notch filter warning: {e}")
    
    s = bandpass_filter(s, FS_TARGET, low=0.5, high=45.0)
    
    # Z-score normalization
    s = (s - np.mean(s)) / (np.std(s) + 1e-8)
    
    return s

# ============ Serial Port Detection ============
def find_arduino():
    """Auto-detect Arduino serial port"""
    ports = serial.tools.list_ports.comports()
    for port in ports:
        if 'Arduino' in port.description or 'CH340' in port.description or 'USB' in port.description:
            return port.device
    return None

# ============ ECG Monitor Class ============
class ECGMonitor:
    def __init__(self, model_path, serial_port=None):
        print("Loading model...")
        self.model = tf.keras.models.load_model(model_path)
        print("Model loaded successfully!")
        
        # Data buffers
        self.buffer = deque(maxlen=BUFFER_SIZE)
        self.raw_data = deque(maxlen=5000)  # For visualization
        self.predictions = deque(maxlen=100)
        self.timestamps = deque(maxlen=100)
        
        # Serial connection
        if serial_port is None:
            serial_port = find_arduino()
            if serial_port is None:
                raise Exception("Arduino not found. Please specify serial port manually.")
        
        print(f"Connecting to {serial_port}...")
        self.serial = serial.Serial(serial_port, BAUD_RATE, timeout=1)
        time.sleep(2)  # Wait for Arduino reset
        
        # Clear any initial garbage
        self.serial.reset_input_buffer()
        
        # Wait for ready signal with timeout
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
            print("Continuing anyway... If no data appears, check:")
            print("  1. Arduino code is uploaded correctly")
            print("  2. Serial Monitor is closed in Arduino IDE")
            print("  3. Correct baud rate (115200)")
            response = input("\nContinue anyway? (y/n): ").strip().lower()
            if response != 'y':
                raise Exception("User cancelled - Arduino not ready")
        
        # Threading
        self.running = False
        self.data_queue = queue.Queue()
        self.last_prediction_time = time.time()
        
        # Lead status tracking (to reduce spam)
        self.leads_off = False
        self.last_lead_warning_time = 0
        self.lead_warning_interval = 2.0  # Only warn every 2 seconds
        
    def read_serial(self):
        """Read data from Arduino in separate thread"""
        while self.running:
            try:
                line = self.serial.readline().decode('utf-8', errors='ignore').strip()
                
                if not line:
                    continue
                
                if "LEADS_OFF" in line:
                    print("⚠️  Leads disconnected!")
                    continue
                
                # Parse timestamp,value
                parts = line.split(',')
                if len(parts) == 2:
                    timestamp = int(parts[0])
                    value = int(parts[1])
                    
                    # Convert ADC value to voltage (assuming 5V reference, 10-bit ADC)
                    voltage = (value / 1023.0) * 5.0
                    
                    self.data_queue.put(voltage)
                    
            except Exception as e:
                print(f"Serial read error: {e}")
                
    def process_data(self):
        """Process incoming data and run predictions"""
        while self.running:
            try:
                # Get data from queue
                if not self.data_queue.empty():
                    value = self.data_queue.get()
                    self.buffer.append(value)
                    self.raw_data.append(value)
                    
                    # Check if we have enough data and enough time has passed
                    current_time = time.time()
                    if (len(self.buffer) >= BUFFER_SIZE and 
                        current_time - self.last_prediction_time >= PREDICTION_INTERVAL):
                        
                        self.run_prediction()
                        self.last_prediction_time = current_time
                
                time.sleep(0.001)  # Small delay to prevent CPU overuse
                
            except Exception as e:
                print(f"Processing error: {e}")
    
    def run_prediction(self):
        """Run model inference on buffered data"""
        try:
            # Get buffer as numpy array
            raw_signal = np.array(self.buffer)
            
            # Preprocess
            processed = preprocess_signal(raw_signal, FS_SENSOR)
            
            # Reshape for model: (1, timesteps, 1)
            timesteps = int(FS_TARGET * WIN_SEC)
            X = processed.reshape(1, timesteps, 1)
            
            # Predict
            prob = self.model.predict(X, verbose=0)[0][0]
            
            # Store results
            self.predictions.append(prob)
            self.timestamps.append(time.time())
            
            # Display result
            status = "⚠️  ABNORMAL" if prob > 0.5 else "✅ NORMAL"
            print(f"{status} | Probability: {prob:.4f}")
            
            if prob > 0.5:
                print("🚨 ALERT: Potential arrhythmia detected!")
            
        except Exception as e:
            print(f"Prediction error: {e}")
    
    def start(self):
        """Start monitoring"""
        self.running = True
        
        # Start threads
        self.serial_thread = threading.Thread(target=self.read_serial, daemon=True)
        self.process_thread = threading.Thread(target=self.process_data, daemon=True)
        
        self.serial_thread.start()
        self.process_thread.start()
        
        print("\n" + "="*50)
        print("ECG MONITORING STARTED")
        print("="*50)
        print("Waiting for data...")
        
    def stop(self):
        """Stop monitoring"""
        self.running = False
        self.serial.close()
        print("\nMonitoring stopped.")

# ============ Main Program ============
def main():
    try:
        # Initialize monitor
        monitor = ECGMonitor(MODEL_PATH, SERIAL_PORT)
        
        # Start monitoring
        monitor.start()
        
        # Keep running
        print("\nPress Ctrl+C to stop...\n")
        while True:
            time.sleep(1)
            
    except KeyboardInterrupt:
        print("\n\nStopping monitor...")
        monitor.stop()
        
    except Exception as e:
        print(f"\nError: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()