"""
SpO2 ML Inference Service
Runs oxygen saturation trend prediction using the MEDIUM model.
"""
import os
import json
import tempfile
import zipfile
from datetime import datetime
from enum import Enum
from pathlib import Path
from typing import Optional

import asyncio
import numpy as np
import pandas as pd
import tensorflow as tf
from scipy.signal import medfilt


class SpO2Trend(str, Enum):
    STABLE = "stable"
    DECLINING = "declining"
    CRITICAL = "critical"
    INSUFFICIENT_DATA = "insufficient_data"


class SpO2Prediction:
    def __init__(
        self,
        trend: SpO2Trend,
        confidence: float,
        timestamp: datetime,
        details: str = "",
        current_value: Optional[float] = None,
        average_value: Optional[float] = None,
    ):
        self.trend = trend
        self.confidence = confidence
        self.timestamp = timestamp
        self.details = details
        self.current_value = current_value
        self.average_value = average_value

    def to_dict(self) -> dict:
        return {
            "trend": self.trend.value,
            "confidence": round(self.confidence, 2),
            "timestamp": self.timestamp.isoformat(),
            "details": self.details,
            "current_value": round(self.current_value, 1) if self.current_value is not None else None,
            "average_value": round(self.average_value, 1) if self.average_value is not None else None,
        }


class SpO2MLInferenceService:
    def __init__(self, model_path: Optional[str] = None, allow_mock: bool = True):
        self.model = None
        self.model_loaded = False
        self.allow_mock = allow_mock

        self.window_size = 60
        self.min_required_samples = 40

        self.critical_threshold = 0.80
        self.warning_threshold = 0.70
        self.watch_threshold = 0.60
        self.l2_reg = 0.005
        self.dropout_rate = 0.3

        if model_path:
            self.load_model(model_path)
        else:
            self.load_model(self._default_model_path())

    def _default_model_path(self) -> str:
        env_path = Path(str(os.getenv("SPO2_MODEL_PATH", ""))).expanduser()
        if env_path.name and env_path.exists():
            return str(env_path)

        app_dir = Path(__file__).resolve().parent.parent
        repo_root = app_dir.parent
        workspace_root = repo_root.parent.parent

        candidates = [
            repo_root / "ml-models" / "spo2-prediction" / "model" / "model_medium.keras",
            workspace_root / "ml-models" / "spo2-prediction" / "model" / "model_medium.keras",
            workspace_root / "ml-models" / "spo2-prediction" / "model" / "model_medium.keras" / "config.json",
        ]

        for candidate in candidates:
            if candidate.exists():
                if candidate.name == "config.json":
                    return str(candidate.parent)
                return str(candidate)

        return str(repo_root / "ml-models" / "spo2-prediction" / "model" / "model_medium.keras")

    def load_model(self, model_path: str):
        model_file = Path(model_path)
        if not model_file.exists():
            if self.allow_mock:
                print(f"Warning: SpO2 model not found at {model_path}, using mock predictions")
                self.model_loaded = False
                return
            raise FileNotFoundError(f"SpO2 model not found at {model_path}")

        try:
            # Handle unpacked Keras format directory created by `model.save(..., zipped=False)`
            config_path = model_file / "config.json"
            weights_path = model_file / "model.weights.h5"
            if model_file.is_dir() and config_path.exists() and weights_path.exists():
                self.model = self._build_medium_model_architecture()
                self.model.load_weights(str(weights_path))
                self.model_loaded = True
                print(f"[OK] SpO2 MEDIUM model loaded from unpacked Keras directory {model_file}")
                return

            try:
                import keras

                self.model = keras.saving.load_model(str(model_file))
            except Exception:
                self.model = tf.keras.models.load_model(str(model_file), compile=False, safe_mode=False)
            self.model_loaded = True
            print(f"[OK] SpO2 MEDIUM model loaded from {model_file}")
        except Exception as e:
            if self.allow_mock:
                print(f"Warning: Failed to load SpO2 model ({e}), using mock predictions")
                self.model_loaded = False
            else:
                raise RuntimeError(f"Failed to load SpO2 model: {e}") from e

    def _load_from_unpacked_keras_dir(self, model_dir: Path):
        """
        Load Keras v3 unpacked directory by packing it into a temporary .keras file.
        This avoids version-specific JSON deserialization issues.
        """
        import keras

        with tempfile.TemporaryDirectory() as tmp_dir:
            archive_path = Path(tmp_dir) / "spo2_medium_temp.keras"

            with zipfile.ZipFile(archive_path, mode="w", compression=zipfile.ZIP_DEFLATED) as zf:
                for entry in model_dir.rglob("*"):
                    if entry.is_file():
                        zf.write(entry, arcname=str(entry.relative_to(model_dir)).replace("\\", "/"))

            try:
                return keras.saving.load_model(str(archive_path), compile=False)
            except Exception:
                return tf.keras.models.load_model(str(archive_path), compile=False, safe_mode=False)

    def _build_medium_model_architecture(self):
        """Rebuild MEDIUM model architecture used in training, then load external weights."""
        inputs = tf.keras.layers.Input(shape=(self.window_size, 19), name="input_layer_1")

        x = tf.keras.layers.LSTM(
            64,
            return_sequences=False,
            kernel_regularizer=tf.keras.regularizers.l2(self.l2_reg),
            name="lstm_1",
        )(inputs)
        x = tf.keras.layers.BatchNormalization(name="batch_normalization_2")(x)
        x = tf.keras.layers.Dropout(self.dropout_rate, name="dropout_2")(x)

        x = tf.keras.layers.Dense(
            32,
            activation="relu",
            kernel_regularizer=tf.keras.regularizers.l2(self.l2_reg),
            name="dense_2",
        )(x)
        x = tf.keras.layers.BatchNormalization(name="batch_normalization_3")(x)
        x = tf.keras.layers.Dropout(self.dropout_rate, name="dropout_3")(x)

        outputs = tf.keras.layers.Dense(1, activation="sigmoid", name="dense_3")(x)
        model = tf.keras.Model(inputs=inputs, outputs=outputs, name="functional_1")
        return model

    def _normalize_keras_config(self, cfg):
        """Patch legacy serialized Keras config keys for runtime compatibility."""
        if isinstance(cfg, dict):
            cls_name = cfg.get("class_name")
            inner = cfg.get("config")

            # Legacy models may serialize InputLayer with `batch_shape`.
            if cls_name == "InputLayer" and isinstance(inner, dict) and "batch_shape" in inner:
                if "batch_input_shape" not in inner:
                    inner["batch_input_shape"] = inner["batch_shape"]
                inner.pop("batch_shape", None)

            for key, value in list(cfg.items()):
                cfg[key] = self._normalize_keras_config(value)
            return cfg

        if isinstance(cfg, list):
            return [self._normalize_keras_config(item) for item in cfg]

        return cfg

    async def predict(self, spo2_values: np.ndarray, patient_id: int) -> SpO2Prediction:
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(None, self._predict_sync, spo2_values, patient_id)

    def _predict_sync(self, spo2_values: np.ndarray, patient_id: int) -> SpO2Prediction:
        timestamp = datetime.utcnow()

        if spo2_values is None or len(spo2_values) < self.min_required_samples:
            return SpO2Prediction(
                trend=SpO2Trend.INSUFFICIENT_DATA,
                confidence=0.0,
                timestamp=timestamp,
                details="Insufficient SpO2 data for trend analysis",
            )

        try:
            cleaned = self._clean_spo2(np.asarray(spo2_values, dtype=np.float32))
            current_value = float(cleaned[-1])
            average_value = float(np.mean(cleaned))

            features = self._prepare_window_features(cleaned)

            if self.model_loaded and self.model is not None:
                pred = self.model.predict(features, verbose=0)
                decline_prob = float(pred[0][0])
            else:
                decline_prob = self._mock_probability(cleaned)

            if decline_prob >= self.critical_threshold:
                trend = SpO2Trend.CRITICAL
                confidence = decline_prob * 100.0
                details = "Critical oxygen decline risk predicted in the near term."
            elif decline_prob >= self.watch_threshold:
                trend = SpO2Trend.DECLINING
                confidence = decline_prob * 100.0
                details = "Declining oxygen saturation trend detected."
            else:
                trend = SpO2Trend.STABLE
                confidence = (1.0 - decline_prob) * 100.0
                details = "Oxygen saturation trend is stable."

            return SpO2Prediction(
                trend=trend,
                confidence=confidence,
                timestamp=timestamp,
                details=details,
                current_value=current_value,
                average_value=average_value,
            )
        except Exception as e:
            print(f"[SpO2] Inference error for patient {patient_id}: {e}")
            return SpO2Prediction(
                trend=SpO2Trend.INSUFFICIENT_DATA,
                confidence=0.0,
                timestamp=timestamp,
                details=f"Analysis error: {str(e)}",
            )

    def _clean_spo2(self, signal: np.ndarray) -> np.ndarray:
        sig = np.array(signal, dtype=np.float32)
        if sig.size == 0:
            return sig

        nans = np.isnan(sig)
        if nans.any():
            s = pd.Series(sig)
            sig = s.ffill().bfill().values.astype(np.float32)

        sig = np.clip(sig, 60.0, 100.0)

        try:
            sig = medfilt(sig, kernel_size=3)
        except Exception:
            pass

        return sig

    def _normalize_spo2(self, signal: np.ndarray) -> np.ndarray:
        return (signal - 60.0) / 40.0

    def _create_decline_focused_features(self, signal: np.ndarray) -> np.ndarray:
        signal = np.asarray(signal, dtype=np.float32)

        diff1 = np.diff(signal, prepend=signal[0])
        diff2 = np.diff(diff1, prepend=diff1[0])
        s = pd.Series(signal)

        ma_5 = s.rolling(5, min_periods=1).mean().fillna(signal[0]).values
        ma_10 = s.rolling(10, min_periods=1).mean().fillna(signal[0]).values
        ma_20 = s.rolling(20, min_periods=1).mean().fillna(signal[0]).values
        std_5 = s.rolling(5, min_periods=1).std().fillna(0).values
        std_10 = s.rolling(10, min_periods=1).std().fillna(0).values
        dev_5 = signal - ma_5
        dev_10 = signal - ma_10

        roc_5 = np.concatenate([np.zeros(5), signal[5:] - signal[:-5]]) / 5
        roc_10 = np.concatenate([np.zeros(10), signal[10:] - signal[:-10]]) / 10

        negative_velocity = np.minimum(diff1, 0)

        consecutive_declines = np.zeros_like(signal)
        count = 0
        for i in range(len(signal)):
            if i > 0 and signal[i] < signal[i - 1]:
                count += 1
            else:
                count = 0
            consecutive_declines[i] = count

        rolling_max = s.rolling(20, min_periods=1).max().values
        distance_from_peak = signal - rolling_max

        slopes = np.zeros_like(signal)
        for i in range(10, len(signal)):
            x = np.arange(10)
            y = signal[i - 10:i]
            slope = np.polyfit(x, y, 1)[0]
            slopes[i] = min(slope, 0)

        volatility = s.rolling(10, min_periods=1).std().fillna(0).values
        momentum = np.where(diff1 > 0, 1, np.where(diff1 < 0, -1, 0))

        features = np.column_stack(
            [
                signal,
                diff1,
                diff2,
                ma_5,
                ma_10,
                ma_20,
                std_5,
                std_10,
                dev_5,
                dev_10,
                roc_5,
                roc_10,
                negative_velocity,
                consecutive_declines,
                distance_from_peak,
                slopes,
                volatility,
                momentum,
                diff2,
            ]
        )
        return features.astype(np.float32)

    def _prepare_window_features(self, cleaned_signal: np.ndarray) -> np.ndarray:
        # Keep last 60 seconds and left-pad if needed to maintain model shape.
        if len(cleaned_signal) >= self.window_size:
            window = cleaned_signal[-self.window_size:]
        else:
            pad_len = self.window_size - len(cleaned_signal)
            window = np.pad(cleaned_signal, (pad_len, 0), mode="edge")

        normalized = self._normalize_spo2(window)
        features = self._create_decline_focused_features(normalized)
        return features.reshape(1, self.window_size, features.shape[1]).astype(np.float32)

    def _mock_probability(self, cleaned_signal: np.ndarray) -> float:
        window = cleaned_signal[-min(len(cleaned_signal), self.window_size):]
        if len(window) < 2:
            return 0.0

        slope = (window[-1] - window[0]) / max(1.0, len(window) - 1)
        low_penalty = max(0.0, (94.0 - float(np.mean(window))) / 10.0)

        score = 0.45 * max(0.0, -slope) + 0.55 * low_penalty
        return float(np.clip(score, 0.02, 0.95))


_spo2_ml_service: Optional[SpO2MLInferenceService] = None


def initialize_spo2_ml_service(model_path: Optional[str] = None, allow_mock: bool = True):
    global _spo2_ml_service
    _spo2_ml_service = SpO2MLInferenceService(model_path=model_path, allow_mock=allow_mock)
    return _spo2_ml_service


def get_spo2_ml_service() -> SpO2MLInferenceService:
    global _spo2_ml_service
    if _spo2_ml_service is None:
        _spo2_ml_service = SpO2MLInferenceService(allow_mock=True)
    return _spo2_ml_service
