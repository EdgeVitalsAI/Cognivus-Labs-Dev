#include "ECGSensor.h"

ECGSensor::ECGSensor()
  : sensorActive(false),
    leadsOff(false),
    lastECGValue(0),
    lastSampleTime(0),
    newSampleAvailable(false),
    sendCounter(0),
    debugCounter(0) {
}

bool ECGSensor::begin() {
  // Initialize ECG sensor pins
  pinMode(LO_PLUS, INPUT);
  pinMode(LO_MINUS, INPUT);
  pinMode(ECG_PIN, INPUT);

  sensorActive = true;
  Serial.println("✓ ECG Sensor: Initialized");

  return true;
}

void ECGSensor::update() {
  if (!sensorActive) return;

  unsigned long currentTime = micros();

  // Sample at configured rate (default 250Hz)
  if (currentTime - lastSampleTime >= ECG_SAMPLE_INTERVAL) {
    lastSampleTime = currentTime;
    sendCounter++;

    // Check if leads are properly connected
    if ((digitalRead(LO_PLUS) == 1) || (digitalRead(LO_MINUS) == 1)) {
      leadsOff = true;
      newSampleAvailable = false;
    } else {
      leadsOff = false;

      // Read ECG value (preserve original logic)
      lastECGValue = analogRead(ECG_PIN);
      newSampleAvailable = true;

      // Debug printing
      debugCounter++;
      if (debugCounter >= ECG_DEBUG_INTERVAL) {
        debugCounter = 0;
        Serial.printf("ECG: Current value %d\n", lastECGValue);
      }
    }
  }
}

bool ECGSensor::shouldSendSample() {
  if (!sensorActive || leadsOff || !newSampleAvailable) {
    return false;
  }

  // Send every Nth sample to avoid overwhelming WebSocket
  if (sendCounter >= ECG_SEND_EVERY) {
    sendCounter = 0;
    return true;
  }

  return false;
}
