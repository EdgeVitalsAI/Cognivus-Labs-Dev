#!/usr/bin/env python
"""
Convert ECG model from .keras/.h5 to SavedModel format (Keras 3 compatible)
Run this once to convert the model, then the backend will load it automatically.
"""
import os
import sys

# Force legacy Keras for loading old model
os.environ["TF_USE_LEGACY_KERAS"] = "1"

import tensorflow as tf
from pathlib import Path

print("=" * 70)
print("ECG Model Converter: .keras/.h5 → SavedModel")
print("=" * 70)

# Paths
model_dir = Path("ml-models/ecg-analysis/models")
old_model = model_dir / "ecg_lstm_model.keras"
if not old_model.exists():
    old_model = model_dir / "ecg_lstm_model.h5"
if not old_model.exists():
    old_model = model_dir / "best_ecg_model.h5"

savedmodel_dir = model_dir / "ecg_lstm_model_savedmodel"

if not old_model.exists():
    print(f"❌ Model not found. Searched:")
    print(f"   - {model_dir / 'ecg_lstm_model.keras'}")
    print(f"   - {model_dir / 'ecg_lstm_model.h5'}")
    print(f"   - {model_dir / 'best_ecg_model.h5'}")
    sys.exit(1)

print(f"\n📂 Source model: {old_model}")
print(f"📂 Output dir: {savedmodel_dir}")

try:
    print("\n🔄 Loading old model with legacy Keras...")
    model = tf.keras.models.load_model(str(old_model), compile=False)
    print(f"✓ Model loaded: {model.summary()}")
    
    print(f"\n💾 Saving as SavedModel format...")
    model.save(str(savedmodel_dir), save_format='tf')
    print(f"✓ Saved to {savedmodel_dir}")
    
    # Verify by loading
    print(f"\n✅ Verifying SavedModel...")
    test_model = tf.keras.models.load_model(str(savedmodel_dir))
    print(f"✓ SavedModel loads successfully!")
    print(f"✓ Model shape: {test_model.input_shape}")
    
    print("\n" + "=" * 70)
    print("✅ CONVERSION SUCCESSFUL")
    print("=" * 70)
    print(f"\nThe backend will now load from: {savedmodel_dir}")
    print("Restart the backend to use the new model.")
    
except Exception as e:
    print(f"\n❌ Conversion failed: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)