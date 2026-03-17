#include <Wire.h>
#include <RTClib.h>

// ── Pin Definitions (ESP32) ──────────────────────────
#define STEP_PIN    18
#define DIR_PIN     19
#define BUTTON_PIN  15
#define BUZZER_PIN  5

// ── RTC ─────────────────────────────────────────────
RTC_DS1307 rtc;

// ── Settings ─────────────────────────────────────────
// Wokwi stepper = 800 steps/rev, 7 slots → 800/7 ≈ 114
int stepsPerSlot = 114;

// Dispense times (24h format) — edit as needed
int dispenseHours[]   = {0,0,0};
int dispenseMinutes[] = {0,1,2};
int numDoses = 3;

bool dosedToday[3] = {false, false, false};
int  lastDay = -1;

bool timerStarted    = false;
bool buttonStarted   = false;
unsigned long previousMillis = 0;
unsigned long simInterval    = 10000; // 10s for simulation

// ── Buzzer beep ──────────────────────────────────────
void beep(int times) {
  for (int i = 0; i < times; i++) {
    digitalWrite(BUZZER_PIN, HIGH);
    delay(200);
    digitalWrite(BUZZER_PIN, LOW);
    delay(150);
  }
}

// ── Rotate one pill slot ─────────────────────────────
void rotateSlot() {
  Serial.println(">> Rotating slot...");
  for (int i = 0; i < stepsPerSlot; i++) {
    digitalWrite(STEP_PIN, HIGH);
    delayMicroseconds(800);
    digitalWrite(STEP_PIN, LOW);
    delayMicroseconds(800);
  }
  beep(2);
  Serial.println(">> Pill dispensed!");
}

void setup() {
  Serial.begin(115200);

  pinMode(STEP_PIN,   OUTPUT);
  pinMode(DIR_PIN,    OUTPUT);
  pinMode(BUZZER_PIN, OUTPUT);
  pinMode(BUTTON_PIN, INPUT_PULLUP);

  digitalWrite(DIR_PIN,    HIGH);
  digitalWrite(BUZZER_PIN, LOW);
  digitalWrite(STEP_PIN, LOW);

  // ── RTC Init ─────────────────────────────────────
  Wire.begin(21, 22); // ESP32 default SDA=21, SCL=22
  if (!rtc.begin()) {
    Serial.println("ERROR: RTC not found!");
  } else {
    if (!rtc.isrunning()) {
      Serial.println("RTC not running — setting time to compile time");
      rtc.adjust(DateTime(F(__DATE__), F(__TIME__)));
    }
    Serial.println("RTC OK");
  }

  beep(1);
  Serial.println("Automatic Pill Dispenser Ready");
}

void loop() {

  // ── Button: manual dispense / start system ────────
  if (digitalRead(BUTTON_PIN) == LOW && !buttonStarted) {
    delay(50);
    if (digitalRead(BUTTON_PIN) == LOW) {
      Serial.println("Button pressed — manual dispense");
      rotateSlot();
      buttonStarted  = true;
      timerStarted   = true;
      previousMillis = millis();
      while (digitalRead(BUTTON_PIN) == LOW);
    }
  }

  // ── RTC-based automatic dispensing ───────────────
    DateTime now = rtc.now();

    // Reset daily flags at midnight
    if (now.day() != lastDay) {
      for (int i = 0; i < numDoses; i++) {
        dosedToday[i] = false;
      }
      lastDay = now.day();
    }

    for (int i = 0; i < numDoses; i++) {

      if (!dosedToday[i] &&
          now.hour() == dispenseHours[i] &&
          now.minute() == dispenseMinutes[i] &&
          now.second() < 5) {

        Serial.print("RTC Alarm — dispensing dose ");
        Serial.println(i + 1);

        rotateSlot();
        dosedToday[i] = true;
      }
    }

  // ── Simulation fallback (timed, no RTC needed) ────
  // ── Simulation fallback (timed, no RTC needed) ────
  if (timerStarted) {

    unsigned long currentMillis = millis();

    if (currentMillis - previousMillis >= simInterval) {

      Serial.println("Sim timer — dispensing next pill");

      rotateSlot();

      previousMillis = currentMillis;
    }
  }

  delay(500);
  }
