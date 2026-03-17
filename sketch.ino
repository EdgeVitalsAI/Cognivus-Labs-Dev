#define STEP_PIN    3
#define DIR_PIN     4
#define BUTTON_PIN  2

bool timerStarted = false;
unsigned long previousMillis = 0;

// Simulation interval (10 seconds)
// Change to 86400000UL for real 24-hour dispensing
unsigned long interval = 10000;

// Stepper motor steps per pill slot
// Wokwi motor = 800 steps per full rotation
// 7 pill slots → 800 / 7 ≈ 114
int stepsPerSlot = 114;

void setup() {

  pinMode(STEP_PIN, OUTPUT);
  pinMode(DIR_PIN, OUTPUT);
  pinMode(BUTTON_PIN, INPUT_PULLUP);

  digitalWrite(DIR_PIN, HIGH); // rotation direction

  Serial.begin(9600);
  Serial.println("Automatic Pill Dispenser Ready");
}

void loop() {

  // Start system when button is pressed
  if (digitalRead(BUTTON_PIN) == LOW && !timerStarted) {

    delay(50); // debounce

    if (digitalRead(BUTTON_PIN) == LOW) {

      Serial.println("Button Pressed - Dispensing First Pill & Starting Timer");

      rotateSlot();

      timerStarted = true;
      previousMillis = millis();

      // wait until button released
      while(digitalRead(BUTTON_PIN) == LOW);
    }
  }

  // Automatic timed dispensing
  if (timerStarted) {

    unsigned long currentMillis = millis();

    if (currentMillis - previousMillis >= interval) {

      Serial.println("Dispensing Next Pill");

      rotateSlot();

      previousMillis = currentMillis;
    }
  }
}

void rotateSlot() {

  for (int i = 0; i < stepsPerSlot; i++) {

    digitalWrite(STEP_PIN, HIGH);
    delayMicroseconds(800);

    digitalWrite(STEP_PIN, LOW);
    delayMicroseconds(800);
  }

  Serial.println("Rotation complete");
}