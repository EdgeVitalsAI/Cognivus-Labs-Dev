"""
Real-time ECG Monitoring with Visualization and Anomaly Detection
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

FS_SENSOR = 250
FS_TARGET = 360
WIN_SEC = 2.0
BUFFER_SIZE = int(FS_SENSOR * WIN_SEC)
PREDICTION_INTERVAL = 1.0
MODEL_PATH = "Models\Trained\ecg_lstm_model.h5"
BAUD_RATE = 115200
SERIAL_PORT = None  

# Visualization ettings
PLOT_WINDOW = 5 
PLOT_SAMPLES = int(FS_SENSOR * PLOT_WINDOW)

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

def find_arduino():
    ports = serial.tools.list_ports.comports()
    for port in ports:
        if 'Arduino' in port.description or 'CH340' in port.description or 'USB' in port.description:
            return port.device
    return None

class ECGMonitorVisualized:
    def __init__(self, model_path, serial_port=None):
        print("Loading model...")
        self.model = tf.keras.models.load_model(model_path)
        print("Model loaded!")
        
        # Data buffers
        self.buffer = deque(maxlen=BUFFER_SIZE)
        self.display_data = deque(maxlen=PLOT_SAMPLES)
        self.time_axis = deque(maxlen=PLOT_SAMPLES)
        
        # Prediction tracking
        self.current_prediction = 0.0
        self.prediction_status = "Waiting..."
        self.alert_active = False
        self.predictions_history = deque(maxlen=50)
        
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
            print("If no data appears within 30 seconds, check Arduino upload")
        
        # Threading
        self.running = False
        self.data_queue = queue.Queue()
        self.last_prediction_time = time.time()
        self.start_time = time.time()
        
        # Lead status tracking
        self.leads_off = False
        self.last_lead_warning_time = 0
        self.lead_warning_interval = 3.0
        
        # Setup plot
        self.setup_plot()
        
    def setup_plot(self):
        """Setup matplotlib figure"""
        plt.style.use('dark_background')
        self.fig = plt.figure(figsize=(14, 8))
        
        # ECG signal plot
        self.ax1 = plt.subplot(2, 1, 1)
        self.line, = self.ax1.plot([], [], 'g-', linewidth=1.5, label='ECG Signal')
        self.ax1.set_xlim(0, PLOT_WINDOW)
        self.ax1.set_ylim(-3, 3)
        self.ax1.set_xlabel('Time (seconds)', fontsize=12)
        self.ax1.set_ylabel('Amplitude (normalized)', fontsize=12)
        self.ax1.set_title('Real-time ECG Signal', fontsize=14, fontweight='bold')
        self.ax1.grid(True, alpha=0.3)
        self.ax1.legend(loc='upper right')
        
        # Status text
        self.status_text = self.ax1.text(0.02, 0.95, '', transform=self.ax1.transAxes,
                                         fontsize=14, verticalalignment='top',
                                         bbox=dict(boxstyle='round', facecolor='black', alpha=0.7))
        
        # Prediction probability plot
        self.ax2 = plt.subplot(2, 1, 2)
        self.pred_line, = self.ax2.plot([], [], 'c-', linewidth=2, label='Anomaly Probability')
        self.threshold_line = self.ax2.axhline(y=0.5, color='r', linestyle='--', 
                                               linewidth=2, label='Threshold')
        self.ax2.set_xlim(0, 50)
        self.ax2.set_ylim(0, 1)
        self.ax2.set_xlabel('Prediction Count', fontsize=12)
        self.ax2.set_ylabel('Probability', fontsize=12)
        self.ax2.set_title('Anomaly Detection Results', fontsize=14, fontweight='bold')
        self.ax2.grid(True, alpha=0.3)
        self.ax2.legend(loc='upper right')
        
        plt.tight_layout()
        
    def read_serial(self):
        """Read data from Arduino"""
        while self.running:
            try:
                line = self.serial.readline().decode('utf-8', errors='ignore').strip()
                if not line or "LEADS_OFF" in line:
                    continue
                
                parts = line.split(',')
                if len(parts) == 2:
                    value = int(parts[1])
                    voltage = (value / 1023.0) * 5.0
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
                    current_time = time.time() - self.start_time
                    
                    self.buffer.append(value)
                    self.display_data.append(value)
                    self.time_axis.append(current_time)
                    
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
            
            self.current_prediction = prob
            self.predictions_history.append(prob)
            
            if prob > 0.5:
                self.prediction_status = "⚠️  ABNORMAL DETECTED"
                self.alert_active = True
                print(f"🚨 ALERT: Arrhythmia detected! Probability: {prob:.4f}")
            else:
                self.prediction_status = "✅ Normal"
                self.alert_active = False
                print(f"✅ Normal heartbeat. Probability: {prob:.4f}")
                
        except Exception as e:
            print(f"Prediction error: {e}")
    
    def update_plot(self, frame):
        """Update matplotlib animation"""
        if len(self.time_axis) > 0:
            # Update ECG signal
            times = np.array(self.time_axis) - self.time_axis[-1] + PLOT_WINDOW
            data = np.array(self.display_data)
            
            # Normalize for display
            if len(data) > 10:
                data = (data - np.mean(data)) / (np.std(data) + 1e-8)
            
            self.line.set_data(times, data)
            
            # Update status text
            color = 'red' if self.alert_active else 'green'
            status_str = (f"{self.prediction_status}\n"
                         f"Probability: {self.current_prediction:.4f}\n"
                         f"Samples: {len(self.buffer)}/{BUFFER_SIZE}")
            self.status_text.set_text(status_str)
            self.status_text.set_color(color)
            
            # Update prediction plot
            if len(self.predictions_history) > 0:
                pred_x = np.arange(len(self.predictions_history))
                pred_y = np.array(self.predictions_history)
                self.pred_line.set_data(pred_x, pred_y)
                
                # Fill area above threshold
                self.ax2.collections.clear()
                self.ax2.fill_between(pred_x, pred_y, 0.5, 
                                     where=(pred_y >= 0.5), 
                                     color='red', alpha=0.3)
        
        return self.line, self.status_text, self.pred_line
    
    def start(self):
        """Start monitoring with visualization"""
        self.running = True
        
        # Start threads
        self.serial_thread = threading.Thread(target=self.read_serial, daemon=True)
        self.process_thread = threading.Thread(target=self.process_data, daemon=True)
        
        self.serial_thread.start()
        self.process_thread.start()
        
        print("\n" + "="*60)
        print("ECG MONITORING STARTED WITH VISUALIZATION")
        print("="*60)
        print("Close the plot window to stop monitoring...\n")
        
        # Start animation
        self.ani = FuncAnimation(self.fig, self.update_plot, interval=50, 
                                blit=False, cache_frame_data=False)
        plt.show()
        
    def stop(self):
        """Stop monitoring"""
        self.running = False
        if hasattr(self, 'serial') and self.serial.is_open:
            self.serial.close()
        print("Monitoring stopped.")

# ============ Main ============
def main():
    try:
        monitor = ECGMonitorVisualized(MODEL_PATH, SERIAL_PORT)
        monitor.start()
        monitor.stop()
        
    except KeyboardInterrupt:
        print("\nStopping...")
        
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()