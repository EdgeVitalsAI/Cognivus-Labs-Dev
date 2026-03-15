#define STEP_PIN    3
#define DIR_PIN     4
#define BUTTON_PIN  2

bool timerStarted = false;
unsigned long previousMillis = 0;

unsigned long interval = 10000;

int stepsPerSlot = 200;

void setup() {
  pinMode(STEP_PIN,   OUTPUT);
  pinMode(DIR_PIN,    OUTPUT);
  pinMode(BUTTON_PIN, INPUT_PULLUP);

  digitalWrite(DIR_PIN, HIGH);   // clockwise

  Serial.begin(9600);
  Serial.println("Automatic Pill Dispenser Ready");
}

void loop() {
  // Start on first button press
  if (digitalRead(BUTTON_PIN) == LOW && !timerStarted) {
    delay(50); // debounce
    if (digitalRead(BUTTON_PIN) == LOW) {
      Serial.println("Button Pressed - Dispensing First Pill & Starting Timer");
      rotateSlot();
      timerStarted    = true;
      previousMillis  = millis();
    }
  }

  // Timed dispensing
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
