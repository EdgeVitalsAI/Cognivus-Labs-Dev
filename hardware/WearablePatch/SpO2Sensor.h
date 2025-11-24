#ifndef SPO2_SENSOR_H
#define SPO2_SENSOR_H

#include <Arduino.h>
#include <Wire.h>
#include "MAX30105.h"
#include "spo2_algorithm.h"
#include "Config.h"

/**
 * SpO2Sensor Class
 * Handles MAX30102 sensor for SpO2 and heart rate monitoring
 * Manages data buffers and calculates SpO2 using Maxim algorithm
 *
 * IMPORTANT: The SpO2 calculation algorithm and buffer management logic
 * must not be modified as it uses validated biomedical formulas
 */
class SpO2Sensor {
public:
  SpO2Sensor();

  // Initialization
  bool begin();

  // Core functionality
  void update();  // Call this in main loop
  bool isActive() const { return sensorActive; }

  // Sensor readings
  bool isFingerDetected() const { return fingerDetected; }
  int32_t getSpo2Value() const { return spo2; }
  int8_t isSpo2Valid() const { return validSPO2; }
  int32_t getHeartRate() const { return heartRate; }
  int8_t isHeartRateValid() const { return validHeartRate; }
  long getIRValue() const { return lastIRValue; }
  long getRedValue() const { return lastRedValue; }

  // Data availability
  bool isSpo2Ready() const { return spo2Ready; }
  bool shouldSendUpdate(); // Rate-limited updates for WebSocket

private:
  MAX30105 particleSensor;

  // Sensor state
  bool sensorActive;
  bool fingerDetected;
  bool spo2Ready;

  // SpO2 calculation buffers (DO NOT MODIFY - validated algorithm)
  uint32_t irBuffer[100];
  uint32_t redBuffer[100];
  int32_t bufferLength;

  // Calculated values
  int32_t spo2;
  int8_t validSPO2;
  int32_t heartRate;
  int8_t validHeartRate;

  // Timing and sampling
  unsigned long lastSpo2Update;
  unsigned long lastSpo2Send;
  int spo2SampleCount;

  // Last raw values
  long lastIRValue;
  long lastRedValue;

  // Internal methods
  void collectSamples();
  void calculateSpo2();
};

#endif // SPO2_SENSOR_H
