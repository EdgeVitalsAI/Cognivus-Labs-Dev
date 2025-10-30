#ifndef SPO2_SENSOR_H
#define SPO2_SENSOR_H

#include <Arduino.h>
#include <Wire.h>
#include "MAX30105.h"
#include "spo2_algorithm.h"

class SpO2Sensor {
private:
    MAX30105 particleSensor;
    uint32_t* irBuffer;
    uint32_t* redBuffer;
    int32_t bufferLength;
    int32_t spo2Value;
    int8_t validSPO2;
    int32_t heartRate;
    int8_t validHeartRate;
    
    bool fingerDetected;
    bool dataReady;
    int sampleCount;
    unsigned long lastUpdate;
    unsigned long lastSend;
    
    int sampleInterval;
    int sendInterval;
    int fingerThreshold;
    bool isActive;

public:
    SpO2Sensor(int bufferLen, int sampleInt, int sendInt, int fingerThresh);
    ~SpO2Sensor();
    bool begin(TwoWire &wirePort);
    void update();
    bool shouldSendData();
    
    // Getters
    int32_t getSpO2();
    int32_t getHeartRate();
    bool isFingerDetected();
    bool isDataReady();
    bool isValidSpO2();
    long getIR();
    long getRed();
    bool isActiveSensor();
};

#endif