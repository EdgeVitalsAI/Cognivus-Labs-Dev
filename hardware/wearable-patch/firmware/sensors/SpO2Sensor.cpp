#include "SpO2Sensor.h"

SpO2Sensor::SpO2Sensor(int bufferLen, int sampleInt, int sendInt, int fingerThresh) {
    bufferLength = bufferLen;
    sampleInterval = sampleInt;
    sendInterval = sendInt;
    fingerThreshold = fingerThresh;
    
    irBuffer = new uint32_t[bufferLength];
    redBuffer = new uint32_t[bufferLength];
    
    fingerDetected = false;
    dataReady = false;
    sampleCount = 0;
    lastUpdate = 0;
    lastSend = 0;
    spo2Value = 0;
    validSPO2 = 0;
    isActive = false;
}

SpO2Sensor::~SpO2Sensor() {
    delete[] irBuffer;
    delete[] redBuffer;
}

bool SpO2Sensor::begin(TwoWire &wirePort) {
    if (!particleSensor.begin(wirePort, I2C_SPEED_FAST)) {
        Serial.println("✗ SpO2 Sensor: MAX30102 not found!");
        return false;
    }
    
    Serial.println("✓ SpO2 Sensor: MAX30102 initialized");
    
    // Configure from config.h values
    particleSensor.setup(60, 4, 2, 100, 411, 4096);
    particleSensor.setPulseAmplitudeRed(0x0A);
    particleSensor.setPulseAmplitudeGreen(0);
    
    isActive = true;
    return true;
}

void SpO2Sensor::update() {
    if (!isActive) return;
    
    long irValue = particleSensor.getIR();
    
    // Check finger detection
    if (irValue < fingerThreshold) {
        fingerDetected = false;
        spo2Value = 0;
        dataReady = false;
        sampleCount = 0;
        validSPO2 = 0;
        return;
    }
    
    fingerDetected = true;
    
    // Sample collection
    if (millis() - lastUpdate > sampleInterval) {
        lastUpdate = millis();
        
        if (sampleCount < bufferLength) {
            // Initial sample collection
            redBuffer[sampleCount] = particleSensor.getRed();
            irBuffer[sampleCount] = irValue;
            sampleCount++;
            
            if (sampleCount == bufferLength) {
                // First calculation
                maxim_heart_rate_and_oxygen_saturation(irBuffer, bufferLength, redBuffer, 
                    &spo2Value, &validSPO2, &heartRate, &validHeartRate);
                dataReady = true;
            }
        } else {
            // Continuous update - shift buffer
            for (int i = 25; i < bufferLength; i++) {
                redBuffer[i - 25] = redBuffer[i];
                irBuffer[i - 25] = irBuffer[i];
            }
            
            // Add new samples
            for (int i = 75; i < bufferLength; i++) {
                while (particleSensor.available() == false)
                    particleSensor.check();
                
                redBuffer[i] = particleSensor.getRed();
                irBuffer[i] = particleSensor.getIR();
                particleSensor.nextSample();
            }
            
            // Recalculate
            maxim_heart_rate_and_oxygen_saturation(irBuffer, bufferLength, redBuffer, 
                &spo2Value, &validSPO2, &heartRate, &validHeartRate);
        }
    }
}

bool SpO2Sensor::shouldSendData() {
    if (!isActive || !fingerDetected) return false;
    
    if (millis() - lastSend > sendInterval) {
        lastSend = millis();
        return true;
    }
    return false;
}

int32_t SpO2Sensor::getSpO2() { return spo2Value; }
int32_t SpO2Sensor::getHeartRate() { return heartRate; }
bool SpO2Sensor::isFingerDetected() { return fingerDetected; }
bool SpO2Sensor::isDataReady() { return dataReady; }
bool SpO2Sensor::isValidSpO2() { return validSPO2 == 1; }
long SpO2Sensor::getIR() { return particleSensor.getIR(); }
long SpO2Sensor::getRed() { return particleSensor.getRed(); }
bool SpO2Sensor::isActiveSensor() { return isActive; }