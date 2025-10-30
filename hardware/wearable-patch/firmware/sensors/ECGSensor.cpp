#include "ECGSensor.h"

ECGSensor::ECGSensor(int ecgPin, int loPlus, int loMinus, int rate, int sendEvery) {
    this->ecgPin = ecgPin;
    this->loPlusPin = loPlus;
    this->loMinusPin = loMinus;
    this->sampleRate = rate;
    this->sendEvery = sendEvery;
    this->sampleInterval = 1000000 / rate;  // microseconds
    this->lastSampleTime = 0;
    this->sendCounter = 0;
    this->leadsOff = false;
    this->lastValue = 0;
    this->isActive = false;
}

bool ECGSensor::begin() {
    pinMode(loPlusPin, INPUT);
    pinMode(loMinusPin, INPUT);
    pinMode(ecgPin, INPUT);
    
    isActive = true;
    Serial.println("✓ ECG Sensor: Initialized");
    return true;
}

bool ECGSensor::update() {
    if (!isActive) return false;
    
    unsigned long currentTime = micros();
    
    if (currentTime - lastSampleTime >= sampleInterval) {
        lastSampleTime = currentTime;
        sendCounter++;
        
        // Check leads connection
        leadsOff = (digitalRead(loPlusPin) == 1) || (digitalRead(loMinusPin) == 1);
        
        if (!leadsOff) {
            lastValue = analogRead(ecgPin);
            
            // Return true when it's time to send
            if (sendCounter >= sendEvery) {
                sendCounter = 0;
                return true;
            }
        }
    }
    
    return false;
}

int ECGSensor::getValue() {
    return lastValue;
}

bool ECGSensor::areLeadsOff() {
    return leadsOff;
}

bool ECGSensor::isActiveSensor() {
    return isActive;
}

unsigned long ECGSensor::getTimestamp() {
    return lastSampleTime;
}