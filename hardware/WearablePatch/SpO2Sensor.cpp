#include "SpO2Sensor.h"

SpO2Sensor::SpO2Sensor()
  : sensorActive(false),
    fingerDetected(false),
    spo2Ready(false),
    bufferLength(SPO2_BUFFER_LENGTH),
    spo2(0),
    validSPO2(0),
    heartRate(0),
    validHeartRate(0),
    lastSpo2Update(0),
    lastSpo2Send(0),
    spo2SampleCount(0),
    lastIRValue(0),
    lastRedValue(0) {
}

bool SpO2Sensor::begin() {
  // Initialize I2C for MAX30102
  Wire.begin(SPO2_I2C_SDA, SPO2_I2C_SCL);

  // Initialize MAX30102 sensor
  if (!particleSensor.begin(Wire, I2C_SPEED_FAST)) {
    Serial.println("✗ SpO2 Sensor: MAX30102 not found!");
    sensorActive = false;
    return false;
  }

  Serial.println("✓ SpO2 Sensor: MAX30102 initialized");
  sensorActive = true;

  // Configure sensor (preserve original configuration)
  particleSensor.setup(
    SPO2_LED_BRIGHTNESS,
    SPO2_SAMPLE_AVERAGE,
    SPO2_LED_MODE,
    SPO2_SAMPLE_RATE,
    SPO2_PULSE_WIDTH,
    SPO2_ADC_RANGE
  );

  particleSensor.setPulseAmplitudeRed(SPO2_RED_AMPLITUDE);
  particleSensor.setPulseAmplitudeGreen(SPO2_GREEN_AMPLITUDE);

  return true;
}

void SpO2Sensor::update() {
  if (!sensorActive) return;

  lastIRValue = particleSensor.getIR();

  // Check if finger is detected
  if (lastIRValue < SPO2_FINGER_THRESHOLD) {
    if (fingerDetected) {
      // Finger was just removed
      fingerDetected = false;
    }
    // Reset state when no finger
    fingerDetected = false;
    spo2 = 0;
    spo2Ready = false;
    spo2SampleCount = 0;
    validSPO2 = 0;
    return;
  }

  // Finger detected
  fingerDetected = true;
  collectSamples();
}

void SpO2Sensor::collectSamples() {
  // Sample at configured interval (default 40ms)
  if (millis() - lastSpo2Update <= SPO2_SAMPLE_INTERVAL) {
    return;
  }

  lastSpo2Update = millis();

  if (spo2SampleCount < 100) {
    // Collecting initial samples (preserve original logic)
    lastRedValue = particleSensor.getRed();
    redBuffer[spo2SampleCount] = lastRedValue;
    irBuffer[spo2SampleCount] = lastIRValue;
    spo2SampleCount++;

    if (spo2SampleCount == 100) {
      // First calculation after 100 samples (DO NOT MODIFY - validated algorithm)
      maxim_heart_rate_and_oxygen_saturation(
        irBuffer,
        bufferLength,
        redBuffer,
        &spo2,
        &validSPO2,
        &heartRate,
        &validHeartRate
      );
      spo2Ready = true;
    }
  } else {
    // Continuous update: shift buffer (preserve original logic)
    for (byte i = 25; i < 100; i++) {
      redBuffer[i - 25] = redBuffer[i];
      irBuffer[i - 25] = irBuffer[i];
    }

    // Add new samples (preserve original logic)
    for (byte i = 75; i < 100; i++) {
      while (particleSensor.available() == false)
        particleSensor.check();

      redBuffer[i] = particleSensor.getRed();
      irBuffer[i] = particleSensor.getIR();
      particleSensor.nextSample();
    }

    lastRedValue = redBuffer[99];
    lastIRValue = irBuffer[99];

    // Recalculate (DO NOT MODIFY - validated algorithm)
    maxim_heart_rate_and_oxygen_saturation(
      irBuffer,
      bufferLength,
      redBuffer,
      &spo2,
      &validSPO2,
      &heartRate,
      &validHeartRate
    );
  }
}

bool SpO2Sensor::shouldSendUpdate() {
  if (!sensorActive || !fingerDetected || !spo2Ready) {
    return false;
  }

  // Rate limit WebSocket updates (default 2 seconds)
  if (millis() - lastSpo2Send > SPO2_SEND_INTERVAL) {
    lastSpo2Send = millis();
    return true;
  }

  return false;
}
