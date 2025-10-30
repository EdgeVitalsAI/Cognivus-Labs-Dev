#ifndef ECG_SENSOR_H
#define ECG_SENSOR_H

#include <Arduino.h>

class ECGSensor {
private:
    int ecgPin;
    int loPlusPin;
    int loMinusPin;
    int sampleRate;
    unsigned long sampleInterval;
    unsigned long lastSampleTime;
    int sendCounter;
    int sendEvery;
    bool leadsOff;
    int lastValue;
    bool isActive;

public:
    ECGSensor(int ecgPin, int loPlus, int loMinus, int rate, int sendEvery);
    bool begin();
    bool update();  // Returns true when data should be sent
    int getValue();
    bool areLeadsOff();
    bool isActiveSensor();
    unsigned long getTimestamp();
};

#endif