#ifndef ECG_SENSOR_H
#define ECG_SENSOR_H

#include <Arduino.h>
#include "Config.h"

/**
 * ECGSensor Class
 * Handles ECG sensor initialization, sampling, and data reading
 * Includes leads-off detection for proper electrode connection monitoring
 */
class ECGSensor {
public:
  ECGSensor();

  // Initialization
  bool begin();

  // Core functionality
  void update();  // Call this in main loop for high-frequency sampling
  bool isActive() const { return sensorActive; }
  bool areLeadsOff() const { return leadsOff; }

  // Data access
  int getLastValue() const { return lastECGValue; }
  unsigned long getLastSampleTime() const { return lastSampleTime; }
  bool hasNewSample() const { return newSampleAvailable; }
  void clearNewSampleFlag() { newSampleAvailable = false; }

  // Rate limiting for WebSocket transmission
  bool shouldSendSample(); // Returns true every Nth sample

private:
  bool sensorActive;
  bool leadsOff;
  int lastECGValue;
  unsigned long lastSampleTime;
  bool newSampleAvailable;

  // Rate limiting for WebSocket
  int sendCounter;
  int debugCounter;
};

#endif // ECG_SENSOR_H
