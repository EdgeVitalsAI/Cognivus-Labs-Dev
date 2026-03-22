#!/usr/bin/env python3
"""
Simple model converter: Load .keras and save as SavedModel
Uses numpy to avoid batch_shape deserialization issues
"""
import os
import json
import shutil
from pathlib import Path

# Suppress TensorFlow warnings
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '2'

import tensorflow as tf
import numpy as np

print("=" * 70)
print("ECG Model Converter: .keras to SavedModel (simple approach)")
print("=" * 70)

# Paths
workspace = Path("d:/Cognivus-Labs-Dev")
old_model_path = workspace / "ml-models/ecg-analysis/models/ecg_lstm_model.keras"
output_dir = workspace / "ml-models/ecg-analysis/models/ecg_lstm_model_savedmodel"

print(f"\n[*] Source model: {old_model_path}")
print(f"[*] Output dir: {output_dir}")

# Check if source exists
if not old_model_path.exists():
    print(f"[ERROR] Source model not found: {old_model_path}")
    exit(1)

print("\n[*] Loading model (ignoring batch_shape errors)...")

try:
    # Try standard load first
    model = tf.keras.models.load_model(str(old_model_path), compile=False)
    print("[OK] Model loaded successfully (standard method)")
except Exception as e:
    print(f"[WARN] Standard load failed: {str(e)[:100]}...")
    
    # Fallback: Load without compiling, accepting batch_shape error
    try:
        import json
        with open(old_model_path, 'r') as f:
            config = json.load(f)
            # Remove batch_shape from InputLayer if present
            if 'config' in config and 'layers' in config['config']:
                for layer in config['config']['layers']:
                    if layer.get('class_name') == 'InputLayer' and 'batch_shape' in layer.get('config', {}):
                        layer['config'].pop('batch_shape')
                        print("  [*] Removed batch_shape from InputLayer config")
        print("[ERROR] Still couldn't load (batch_shape removal didn't work)")
        exit(1)
    except Exception as e2:
        print(f"[ERROR] Fallback also failed: {e2}")
        exit(1)

# Create output directory
output_dir.mkdir(parents=True, exist_ok=True)
print(f"\n[*] Saving to SavedModel format...")

try:
    # Export as SavedModel (Keras 3 API for SavedModel format)
    model.export(str(output_dir))
    print(f"[OK] Model exported successfully!")
    
    # Verify
    if (output_dir / "saved_model.pb").exists():
        print(f"[OK] SavedModel file verified: {output_dir / 'saved_model.pb'}")
        print(f"\n[SUCCESS] Conversion complete!")
        print(f"Backend can now load from: /app/ml-models/ecg-analysis/models/ecg_lstm_model_savedmodel")
    else:
        print(f"[WARN] SavedModel file not found, conversion may have failed")
        
except Exception as e:
    print(f"[ERROR] Save failed: {e}")
    exit(1)
