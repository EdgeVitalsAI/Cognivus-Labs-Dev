"""
Patient-level digital twin risk scoring.
Combines ECG and SpO2 model outputs into an overall weighted risk score.
"""
from typing import Any, Dict, List, Optional


def _clamp(value: float, lo: float = 0.0, hi: float = 1.0) -> float:
    return max(lo, min(hi, value))


def _norm_conf(confidence: Optional[float]) -> float:
    if confidence is None:
        return 0.5
    # Services currently emit confidence in [0, 100].
    return _clamp(float(confidence) / 100.0)


def _ecg_risk(ecg_prediction: Optional[Any]) -> Dict[str, float]:
    if ecg_prediction is None:
        return {"risk": 0.42, "confidence": 0.45}

    trend = getattr(getattr(ecg_prediction, "trend", None), "value", "insufficient_data")
    confidence = _norm_conf(getattr(ecg_prediction, "confidence", None))

    trend_base = {
        "normal": 0.12,
        "abnormal": 0.70,
        "unstable": 0.93,
        "insufficient_data": 0.50,
    }.get(trend, 0.50)

    if trend == "normal":
        risk = trend_base * (1.10 - 0.60 * confidence)
    else:
        risk = trend_base * (0.65 + 0.55 * confidence)

    return {
        "risk": _clamp(risk),
        "confidence": confidence,
    }


def _spo2_penalty(current_value: Optional[float]) -> float:
    if current_value is None:
        return 0.42

    value = float(current_value)
    if value >= 96.0:
        return 0.05
    if value >= 93.0:
        return 0.25
    if value >= 90.0:
        return 0.55
    return 0.85


def _spo2_risk(spo2_prediction: Optional[Any]) -> Dict[str, float]:
    if spo2_prediction is None:
        return {"risk": 0.40, "confidence": 0.45}

    trend = getattr(getattr(spo2_prediction, "trend", None), "value", "insufficient_data")
    confidence = _norm_conf(getattr(spo2_prediction, "confidence", None))
    current_value = getattr(spo2_prediction, "current_value", None)

    trend_base = {
        "stable": 0.18,
        "declining": 0.70,
        "critical": 0.92,
        "insufficient_data": 0.50,
    }.get(trend, 0.50)

    absolute_penalty = _spo2_penalty(current_value)
    risk = 0.55 * trend_base + 0.45 * absolute_penalty

    if trend == "stable":
        risk *= (1.05 - 0.45 * confidence)
    else:
        risk *= (0.70 + 0.45 * confidence)

    return {
        "risk": _clamp(risk),
        "confidence": confidence,
    }


def _stability_risk(spo2_prediction: Optional[Any], ecg_prediction: Optional[Any]) -> float:
    spo2_current = getattr(spo2_prediction, "current_value", None) if spo2_prediction else None
    spo2_average = getattr(spo2_prediction, "average_value", None) if spo2_prediction else None

    if spo2_current is None or spo2_average is None:
        drift_component = 0.35
    else:
        # 6 percentage points is treated as a strong drift event.
        drift_component = _clamp(abs(float(spo2_current) - float(spo2_average)) / 6.0)

    ecg_trend = getattr(getattr(ecg_prediction, "trend", None), "value", "insufficient_data") if ecg_prediction else "insufficient_data"
    ecg_instability = {
        "normal": 0.05,
        "abnormal": 0.45,
        "unstable": 0.85,
        "insufficient_data": 0.35,
    }.get(ecg_trend, 0.35)

    return _clamp(0.65 * drift_component + 0.35 * ecg_instability)


def _risk_level(score: int) -> str:
    if score >= 80:
        return "CRITICAL"
    if score >= 60:
        return "HIGH"
    if score >= 30:
        return "GUARDED"
    return "LOW"


def _avg(values: List[float], fallback: float) -> float:
    if not values:
        return fallback
    return float(sum(values) / len(values))


def _latest_trend(predictions: List[Any], default_trend: str = "insufficient_data") -> str:
    if not predictions:
        return default_trend
    return getattr(getattr(predictions[-1], "trend", None), "value", default_trend)


def _window_stability_risk(ecg_predictions: List[Any], spo2_predictions: List[Any]) -> float:
    spo2_values = []
    for prediction in spo2_predictions:
        current_value = getattr(prediction, "current_value", None)
        if current_value is not None:
            spo2_values.append(float(current_value))

    if len(spo2_values) >= 2:
        # Treat 6 points spread in a 1-minute window as high instability.
        drift_component = _clamp((max(spo2_values) - min(spo2_values)) / 6.0)
    elif spo2_predictions:
        current_value = getattr(spo2_predictions[-1], "current_value", None)
        average_value = getattr(spo2_predictions[-1], "average_value", None)
        if current_value is not None and average_value is not None:
            drift_component = _clamp(abs(float(current_value) - float(average_value)) / 6.0)
        else:
            drift_component = 0.35
    else:
        drift_component = 0.35

    trend_instability_map = {
        "normal": 0.05,
        "abnormal": 0.45,
        "unstable": 0.85,
        "insufficient_data": 0.35,
    }
    ecg_instability_values = [
        trend_instability_map.get(getattr(getattr(p, "trend", None), "value", "insufficient_data"), 0.35)
        for p in ecg_predictions
    ]
    ecg_instability = _avg(ecg_instability_values, 0.35)

    return _clamp(0.65 * drift_component + 0.35 * ecg_instability)


def compute_overall_patient_risk_window(
    ecg_predictions: Optional[List[Any]],
    spo2_predictions: Optional[List[Any]],
    window_seconds: int = 60,
) -> Dict[str, Any]:
    """Compute weighted digital-twin risk using a rolling 1-minute prediction window."""
    ecg_predictions = list(ecg_predictions or [])
    spo2_predictions = list(spo2_predictions or [])

    ecg_risks = [_ecg_risk(p) for p in ecg_predictions]
    spo2_risks = [_spo2_risk(p) for p in spo2_predictions]

    ecg_risk = _avg([item["risk"] for item in ecg_risks], 0.42)
    spo2_risk = _avg([item["risk"] for item in spo2_risks], 0.40)

    ecg_confidence = _avg([item["confidence"] for item in ecg_risks], 0.45)
    spo2_confidence = _avg([item["confidence"] for item in spo2_risks], 0.45)

    stability = _window_stability_risk(ecg_predictions, spo2_predictions)

    ecg_weight = 0.60
    spo2_weight = 0.35
    stability_weight = 0.05

    blended = ecg_weight * ecg_risk + spo2_weight * spo2_risk + stability_weight * stability

    ecg_trend = _latest_trend(ecg_predictions)
    spo2_trend = _latest_trend(spo2_predictions)
    if ecg_trend in ("abnormal", "unstable") and spo2_trend in ("declining", "critical"):
        blended = _clamp(blended + 0.08)

    blended_confidence = _clamp(0.6 * ecg_confidence + 0.4 * spo2_confidence)
    adjusted = blended * (0.70 + 0.30 * blended_confidence)

    score = int(round(_clamp(adjusted) * 100.0))
    level = _risk_level(score)

    return {
        "score": score,
        "level": level,
        "confidence": int(round(blended_confidence * 100.0)),
        "windowSeconds": max(1, int(window_seconds)),
        "samples": {
            "ecg": len(ecg_predictions),
            "spo2": len(spo2_predictions),
        },
        "weights": {
            "ecg": ecg_weight,
            "spo2": spo2_weight,
            "stability": stability_weight,
        },
        "contributors": {
            "ecg": int(round(ecg_risk * 100.0)),
            "spo2": int(round(spo2_risk * 100.0)),
            "stability": int(round(stability * 100.0)),
        },
        "rationale": (
            "Rolling 1-minute average risk from ECG and SpO2 predictions, "
            "designed to dampen motion-related transient oxygen drops."
        ),
    }


def compute_overall_patient_risk(ecg_prediction: Optional[Any], spo2_prediction: Optional[Any]) -> Dict[str, Any]:
    """Compatibility wrapper for single prediction risk computation."""
    ecg_window = [ecg_prediction] if ecg_prediction is not None else []
    spo2_window = [spo2_prediction] if spo2_prediction is not None else []
    return compute_overall_patient_risk_window(ecg_window, spo2_window, window_seconds=1)
