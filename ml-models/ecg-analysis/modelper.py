import tensorflow as tf
from tensorflow import keras

# Load the H5 model file
model = keras.models.load_model('models/best_ecg_model.h5')

# Print a summary of the model architecture
model.summary()