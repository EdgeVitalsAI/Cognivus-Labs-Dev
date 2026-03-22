"""
ECG ML Inference Service
Runs ECG abnormality detection on 15-second windows using trained LSTM model
Produces trend-based predictions with confidence scores
"""
import os
# Force legacy Keras (v2) deserialization to load older models on Keras 3 runtimes
os.environ.setdefault("TF_USE_LEGACY_KERAS", "1")

import numpy as np
import asyncio
from typing import Dict, Optional, Tuple
from datetime import datetime
from enum import Enum
from scipy.signal import resample_poly, iirnotch, butter, filtfilt
import tensorflow as tf
from pathlib import Path


class ECGTrend(str, Enum):
    """ECG trend classification"""
    NORMAL = "normal"
    ABNORMAL = "abnormal"
    UNSTABLE = "unstable"
    INSUFFICIENT_DATA = "insufficient_data"


class ECGPrediction:
    """ECG prediction result"""
    def __init__(self, trend: ECGTrend, confidence: float, timestamp: datetime, 
                 details: str = "", heart_rate: Optional[int] = None):
        self.trend = trend
        self.confidence = confidence
        self.timestamp = timestamp
        self.details = details
        self.heart_rate = heart_rate
    
    def to_dict(self) -> dict:
        return {
            "trend": self.trend.value,
            "confidence": round(self.confidence, 2),
            "timestamp": self.timestamp.isoformat(),
            "details": self.details,
            "heart_rate": self.heart_rate
        }


class ECGMLInferenceService:
    """
    ML inference service for ECG abnormality detection
    Uses trained LSTM model to analyze 15-second ECG windows
    """
    
    def __init__(self, model_path: Optional[str] = None, allow_mock: bool = False):
        self.model = None
        self.model_loaded = False
        self.allow_mock = allow_mock
        
        # Model configuration (must match training)
        self.FS_SENSOR = 250      # Sensor sampling rate (Hz)
        self.FS_TARGET = 360      # Model expects 360 Hz
        self.WIN_SEC = 15.0       # 15-second analysis window
        self.timesteps = int(self.FS_TARGET * self.WIN_SEC)  # 5400 samples
        
        # Load model
        if model_path:
            self.load_model(model_path)
        else:
            self.load_model(self._default_model_path())
    
    def _default_model_path(self) -> str:
        """Locate the packaged ECG model under ml-models/ecg-analysis/models or env override"""
        env_path = Path(str(os.getenv("ECG_MODEL_PATH", ""))).expanduser()
        if env_path.name and env_path.exists():
            return str(env_path)
        
        # __file__ is /app/app/services/ecg_ml_inference.py
        # Go up to /app/app then to /app
        app_dir = Path(__file__).resolve().parent.parent  # /app/app
        repo_root = app_dir.parent  # /app
        
        candidates = [
            repo_root / "ml-models" / "ecg-analysis" / "models" / "ecg_lstm_model_savedmodel",
            repo_root / "ml-models" / "ecg-analysis" / "models" / "ecg_lstm_model.keras",
            repo_root / "ml-models" / "ecg-analysis" / "models" / "best_ecg_model.h5",
            repo_root / "ml-models" / "ecg-analysis" / "models" / "ecg_lstm_model.h5",
        ]
        print(f"[debug] Looking for ECG model in the following locations:")
        for i, path in enumerate(candidates, 1):
            exists = "EXISTS" if path.exists() else "NOT FOUND"
            print(f"  {i}. {path} - {exists}")
            if path.exists():
                print(f"[debug] Using: {path}")
                return str(path)
        return str(candidates[0])

    def load_model(self, model_path: str):
        """Load the trained TensorFlow/Keras model. Raises if missing when allow_mock is False."""
        model_file = Path(model_path)
        
        # Check if SavedModel directory exists
        is_savedmodel = model_file.is_dir() and (model_file / "saved_model.pb").exists()
        
        if not model_file.exists():
            if self.allow_mock:
                print(f"Warning: ECG model not found at {model_path}, using mock predictions")
                self.model_loaded = False
                return
            raise FileNotFoundError(f"ECG model not found at {model_path}")
        
        try:
            if is_savedmodel:
                # Load SavedModel format (Keras 3 native)
                print(f"[debug] Loading SavedModel from {model_file}...")
                self.model = tf.saved_model.load(str(model_file))
                self.model_loaded = True
                print(f"[OK] ECG ML model loaded from SavedModel")
                return
            
            # Try keras package first (from tf-keras) which handles legacy models better
            try:
                import keras
                print(f"[debug] Loading via keras.saving.load_model...")
                self.model = keras.saving.load_model(str(model_file))
                self.model_loaded = True
                print(f"[OK] ECG ML model loaded from {model_file} (via keras)")
                return
            except Exception as e:
                print(f"[debug] keras.saving failed: {e}, trying tf.keras...")
            
            # Fall back to tf.keras with minimal config
            self.model = tf.keras.models.load_model(str(model_file), compile=False, safe_mode=False)
            self.model_loaded = True
            print(f"[OK] ECG ML model loaded from {model_file}")
        except Exception as e:
            error_msg = f"Failed to load ECG model: {e}"
            print(f"[ERROR] {error_msg}")
            if self.allow_mock:
                print("Warning: Falling back to mock predictions for development")
                self.model_loaded = False
            else:
                print("Hint: Model may need retraining with current TensorFlow version")
                print("For now, restart with allow_mock=True or retrain the model")
                raise RuntimeError(error_msg) from e
    
    async def predict(self, ecg_samples: np.ndarray, patient_id: int) -> ECGPrediction:
        """
        Run ML inference on ECG window
        
        Args:
            ecg_samples: Raw ECG samples (15 seconds at sensor sampling rate)
            patient_id: Patient identifier
            
        Returns:
            ECGPrediction with trend classification and confidence
        """
        # Run preprocessing and inference in thread pool to avoid blocking
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(None, self._predict_sync, ecg_samples, patient_id)
    
    def _predict_sync(self, ecg_samples: np.ndarray, patient_id: int) -> ECGPrediction:
        """Synchronous prediction (runs in thread pool)"""
        timestamp = datetime.utcnow()
        
        # Validate input
        if len(ecg_samples) < self.FS_SENSOR * self.WIN_SEC * 0.8:  # Need at least 80% of data
            return ECGPrediction(
                trend=ECGTrend.INSUFFICIENT_DATA,
                confidence=0.0,
                timestamp=timestamp,
                details="Insufficient ECG data for analysis"
            )
        
        try:
            # Preprocess signal
            processed = self._preprocess_signal(ecg_samples, self.FS_SENSOR)
            
            # Estimate heart rate from signal
            heart_rate = self._estimate_heart_rate(processed, self.FS_TARGET)
            
            # Run inference
            if not self.model_loaded or self.model is None:
                if not self.allow_mock:
                    raise RuntimeError("ECG model is not loaded; predictions cannot be generated")
                # Use mock prediction as fallback
                prob = self._mock_predict(ecg_samples, processed, heart_rate)
            else:
                # Reshape for model input: (batch_size, timesteps, features)
                X = processed.reshape(1, self.timesteps, 1).astype(np.float32)
                
                # Get prediction - handle SavedModel signature or Keras model API
                if hasattr(self.model, "signatures") and "serve" in getattr(self.model, "signatures", {}):
                    # SavedModel exported via model.export; invoke the serving signature directly
                    serve_fn = self.model.signatures["serve"]
                    outputs = serve_fn(tf.constant(X))
                    first_output = next(iter(outputs.values()))
                    prob = float(first_output.numpy()[0][0])
                elif hasattr(self.model, "predict"):
                    # Keras model
                    prob = float(self.model.predict(X, verbose=0)[0][0])
                else:
                    raise RuntimeError("Loaded ECG model has no callable inference interface")
            
            # Apply physiological guardrails only for mock-mode inference.
            # For real model outputs, avoid forcing a persistent abnormal floor.
            if not self.model_loaded or self.model is None:
                risk_floor, risk_reasons = self._rhythm_risk_floor(processed, self.FS_TARGET, heart_rate)
                effective_prob = max(prob, risk_floor)
            else:
                risk_floor, risk_reasons = 0.0, []
                effective_prob = prob

            # Classify based on probability
            if effective_prob < 0.40:
                trend = ECGTrend.NORMAL
                confidence = (1 - effective_prob) * 100
                details = "Regular sinus rhythm detected. No significant abnormalities."
            elif effective_prob < 0.75:
                trend = ECGTrend.ABNORMAL
                confidence = max(effective_prob, 1 - effective_prob) * 100
                details = "Potential arrhythmia detected. Irregular heart rhythm patterns observed."
            else:
                trend = ECGTrend.UNSTABLE
                confidence = effective_prob * 100
                details = "Critical cardiac rhythm abnormality detected. Immediate attention recommended."

            if risk_reasons and trend != ECGTrend.NORMAL:
                details = details + f" Rule flags: {', '.join(risk_reasons)}."
            
            return ECGPrediction(
                trend=trend,
                confidence=confidence,
                timestamp=timestamp,
                details=details,
                heart_rate=heart_rate
            )
        
        except Exception as e:
            print(f"✗ ECG inference error for patient {patient_id}: {e}")
            return ECGPrediction(
                trend=ECGTrend.INSUFFICIENT_DATA,
                confidence=0.0,
                timestamp=timestamp,
                details=f"Analysis error: {str(e)}"
            )
    
    def _preprocess_signal(self, raw_signal: np.ndarray, fs_raw: int) -> np.ndarray:
        """
        Preprocess ECG signal (same as training pipeline)
        
        Steps:
        1. Resample to target frequency (360 Hz)
        2. Apply notch filter (50/60 Hz)
        3. Apply bandpass filter (0.5-45 Hz)
        4. Z-score normalization
        """
        # Convert to float32
        signal = raw_signal.astype(np.float32)
        
        # Resample to target frequency
        if fs_raw != self.FS_TARGET:
            signal = self._resample_signal(signal, fs_raw, self.FS_TARGET)
        
        # Apply notch filter for powerline noise (50 Hz)
        try:
            signal = self._notch_filter(signal, self.FS_TARGET, f0=50.0)
        except Exception:
            pass  # Skip if filter fails
        
        # Apply bandpass filter
        signal = self._bandpass_filter(signal, self.FS_TARGET, low=0.5, high=45.0)
        
        # Z-score normalization
        signal = (signal - np.mean(signal)) / (np.std(signal) + 1e-8)
        
        # Ensure correct length
        if len(signal) > self.timesteps:
            signal = signal[:self.timesteps]
        elif len(signal) < self.timesteps:
            # Pad with zeros if needed
            signal = np.pad(signal, (0, self.timesteps - len(signal)), mode='constant')
        
        return signal
    
    def _resample_signal(self, signal: np.ndarray, fs_src: int, fs_tgt: int) -> np.ndarray:
        """Resample signal to target frequency"""
        if fs_src == fs_tgt:
            return signal
        
        gcd = np.gcd(int(fs_tgt), int(fs_src))
        up = int(fs_tgt // gcd)
        down = int(fs_src // gcd)
        return resample_poly(signal, up, down)
    
    def _notch_filter(self, signal: np.ndarray, fs: int, f0: float = 50.0, Q: float = 30) -> np.ndarray:
        """Apply notch filter to remove powerline interference"""
        b, a = iirnotch(f0 / (fs / 2), Q)
        return filtfilt(b, a, signal)
    
    def _bandpass_filter(self, signal: np.ndarray, fs: int, 
                        low: float = 0.5, high: float = 45.0, order: int = 4) -> np.ndarray:
        """Apply bandpass filter"""
        b, a = butter(order, [low / (fs / 2), high / (fs / 2)], btype='band')
        return filtfilt(b, a, signal)
    
    def _estimate_heart_rate(self, signal: np.ndarray, fs: int) -> Optional[int]:
        """Estimate heart rate from ECG signal using peak detection"""
        try:
            # Simple peak detection (production code should use more robust methods)
            from scipy.signal import find_peaks
            
            # Find R-peaks
            peaks, _ = find_peaks(signal, distance=fs * 0.4, height=0.5)  # Min 0.4s between peaks
            
            if len(peaks) < 2:
                return None
            
            # Calculate heart rate from peak intervals
            rr_intervals = np.diff(peaks) / fs  # R-R intervals in seconds
            heart_rate = int(60 / np.mean(rr_intervals))
            
            # Sanity check
            if 40 <= heart_rate <= 200:
                return heart_rate
            
        except Exception:
            pass
        
        return None

    def _rhythm_risk_floor(self, signal: np.ndarray, fs: int, heart_rate: Optional[int]) -> Tuple[float, list]:
        """Return minimum abnormal probability floor based on rhythm risk features."""
        risk_floor = 0.0
        reasons = []
        severe_hr = False
        severe_rr = False

        if heart_rate is not None:
            if heart_rate >= 145:
                risk_floor = max(risk_floor, 0.72)
                reasons.append(f"tachycardia_hr={heart_rate}")
                severe_hr = True
            elif heart_rate >= 125:
                risk_floor = max(risk_floor, 0.58)
                reasons.append(f"high_hr={heart_rate}")
            elif heart_rate <= 42:
                risk_floor = max(risk_floor, 0.65)
                reasons.append(f"brady_hr={heart_rate}")
                severe_hr = True
            elif heart_rate <= 50:
                risk_floor = max(risk_floor, 0.52)
                reasons.append(f"low_hr={heart_rate}")

        try:
            from scipy.signal import find_peaks

            peaks, _ = find_peaks(signal, distance=fs * 0.25, height=0.35)
            if len(peaks) >= 6:
                rr = np.diff(peaks) / fs
                rr_std_ms = float(np.std(rr) * 1000.0)
                rr_mean = float(np.mean(rr)) if np.mean(rr) > 1e-6 else 1.0
                rr_cv = float(np.std(rr) / rr_mean)
                rr_span_sec = float(np.sum(rr))

                if rr_span_sec >= 6.0 and (rr_std_ms >= 180 or rr_cv >= 0.26):
                    risk_floor = max(risk_floor, 0.70)
                    reasons.append(f"rr_instability(std_ms={rr_std_ms:.0f},cv={rr_cv:.2f})")
                    severe_rr = True
                elif rr_span_sec >= 6.0 and (rr_std_ms >= 120 or rr_cv >= 0.18):
                    risk_floor = max(risk_floor, 0.58)
                    reasons.append(f"rr_variability(std_ms={rr_std_ms:.0f},cv={rr_cv:.2f})")
                elif rr_span_sec >= 6.0 and (rr_std_ms >= 85 or rr_cv >= 0.13):
                    risk_floor = max(risk_floor, 0.46)
                    reasons.append(f"rr_irregular(std_ms={rr_std_ms:.0f},cv={rr_cv:.2f})")
        except Exception:
            pass

        if severe_hr and severe_rr:
            risk_floor = max(risk_floor, 0.80)
            reasons.append("combined_severe_hr_rr")
        else:
            # Guardrail should bias toward ABNORMAL when needed, but not force UNSTABLE alone.
            risk_floor = min(risk_floor, 0.69)

        return float(np.clip(risk_floor, 0.0, 0.95)), reasons
    
    def _mock_predict(self, ecg_samples: np.ndarray, processed_signal: np.ndarray, heart_rate: Optional[int]) -> float:
        """Mock prediction for development (when model is not loaded)."""
        try:
            from scipy.signal import find_peaks

            peaks, _ = find_peaks(processed_signal, distance=self.FS_TARGET * 0.25, height=0.35)
            rr_std_ms = 0.0
            rr_cv = 0.0
            if len(peaks) >= 3:
                rr_intervals = np.diff(peaks) / self.FS_TARGET
                rr_std_ms = float(np.std(rr_intervals) * 1000.0)
                rr_mean = float(np.mean(rr_intervals)) if np.mean(rr_intervals) > 1e-6 else 1.0
                rr_cv = float(np.std(rr_intervals) / rr_mean)

            derivative = np.diff(processed_signal)
            derivative_std = float(np.std(derivative)) if len(derivative) else 0.0
            p99_amp = float(np.percentile(np.abs(processed_signal), 99))

            score = 0.10
            if heart_rate is not None:
                if heart_rate >= 130:
                    score += 0.60
                elif heart_rate >= 115:
                    score += 0.45
                elif heart_rate >= 105:
                    score += 0.25
                elif heart_rate <= 48:
                    score += 0.35

            if rr_std_ms >= 140:
                score += 0.50
            elif rr_std_ms >= 90:
                score += 0.35
            elif rr_std_ms >= 60:
                score += 0.20

            if rr_cv >= 0.20:
                score += 0.35
            elif rr_cv >= 0.13:
                score += 0.20

            if derivative_std >= 0.33:
                score += 0.22
            elif derivative_std >= 0.25:
                score += 0.12

            if p99_amp >= 3.3:
                score += 0.25
            elif p99_amp >= 2.6:
                score += 0.14

            score += np.random.uniform(-0.03, 0.03)
            return float(np.clip(score, 0.0, 0.98))
        except Exception:
            std = float(np.std(ecg_samples))
            if std < 50:
                prob = 0.20
            elif std < 150:
                prob = 0.35
            elif std < 300:
                prob = 0.60
            else:
                prob = 0.85
            prob += np.random.uniform(-0.05, 0.05)
            return float(np.clip(prob, 0.0, 1.0))


# Global instance
_ecg_ml_service: Optional[ECGMLInferenceService] = None


def get_ecg_ml_service() -> ECGMLInferenceService:
    """Get the global ECG ML inference service instance"""
    global _ecg_ml_service
    if _ecg_ml_service is None:
        _ecg_ml_service = ECGMLInferenceService()
    return _ecg_ml_service


def initialize_ecg_ml_service(model_path: Optional[str] = None, allow_mock: bool = False):
    """Initialize the ECG ML service with model"""
    global _ecg_ml_service
    _ecg_ml_service = ECGMLInferenceService(model_path=model_path, allow_mock=allow_mock)
    return _ecg_ml_service
