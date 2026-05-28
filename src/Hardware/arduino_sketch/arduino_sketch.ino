
#include <Encoder.h>

// Pins
const int PIN_LDR     = A1;
const int PIN_ENC_SW  = 4;    // click — D4, clean digital pin
const int PIN_LED     = 9;    // hardware PWM

Encoder enc(3, 2);            // DT = D3, CLK = D2

// Draaien
const int SEND_INTERVAL_MS = 100;
const int DEBOUNCE_MS      = 50;
const int ENC_STEP         = 15;   
const int ENC_MIN          = -255; 
const int ENC_MAX          =  255; 

const int LDR_DARK         = 822;  
const int LDR_BRIGHT       = 972;  
const int BRIGHTNESS_MIN   = 80;   
const int BRIGHTNESS_MAX   = 255;

// Status
bool          energyAlert    = false;
bool          testMode       = false;
bool          clickEvent     = false;
unsigned long lastDebounce   = 0;
unsigned long lastSend       = 0;
int           encTrim        = 0;
String        cmdBuffer      = "";

bool swRaw    = HIGH;
bool swStable = HIGH;

// LED helderheid
int computeBrightness(int ldrRaw) {

  int stretched = map(ldrRaw, LDR_DARK, LDR_BRIGHT, 0, BRIGHTNESS_MAX);
  int base = constrain(stretched, 0, BRIGHTNESS_MAX);
  int trim = constrain(encTrim * ENC_STEP, ENC_MIN, ENC_MAX);
  return constrain(base + trim, 0, BRIGHTNESS_MAX);
}

//Setup
void setup() {
  Serial.begin(115200);
  pinMode(PIN_ENC_SW, INPUT_PULLUP); 
  pinMode(PIN_LED,    OUTPUT);
  analogWrite(PIN_LED, 0);
  enc.write(0);                        // reset encoder positie naar 0
}

//Loop
void loop() {
  unsigned long now = millis();
  long rawPos = enc.read();
  int detents = (int)(rawPos / 4);
  encTrim = constrain(detents, ENC_MIN / ENC_STEP, ENC_MAX / ENC_STEP);  // ±17 detents max

  //Read LDR
  int ldrRaw    = analogRead(PIN_LDR);
  int brightness = computeBrightness(ldrRaw);

  //LED
  if (testMode) {
    analogWrite(PIN_LED, 255);
  } else if (energyAlert) {
    analogWrite(PIN_LED, brightness);
  } else {
    analogWrite(PIN_LED, 0);
  }

  swRaw = digitalRead(PIN_ENC_SW);
  if (swRaw != swStable) {
    lastDebounce = now;
  }
  if ((now - lastDebounce) > DEBOUNCE_MS) {
    if (swRaw == LOW && swStable == HIGH) {
      clickEvent = true;
    }
    swStable = swRaw;
  }

  //Read serial commands van Pi
  while (Serial.available()) {
    char c = Serial.read();
    if (c == '\n' || c == '\r') {
      if (cmdBuffer.length() > 0) {
        cmdBuffer.trim();
        if      (cmdBuffer == "ALERT:1")    { energyAlert = true; enc.write(0); encTrim = 0; }
        else if (cmdBuffer == "ALERT:0")    { energyAlert = false; analogWrite(PIN_LED, 0); }
        else if (cmdBuffer == "LED_TEST:1") { testMode = true; }
        else if (cmdBuffer == "LED_TEST:0") { testMode = false; analogWrite(PIN_LED, 0); }
        else if (cmdBuffer == "RESET") {
          energyAlert = false;
          testMode    = false;
          enc.write(0);
          encTrim     = 0;
          clickEvent  = false;
          swStable    = HIGH;
          cmdBuffer   = "";    
          analogWrite(PIN_LED, 0);
        }
        cmdBuffer = "";
      }
    } else {
      if (cmdBuffer.length() < 32) cmdBuffer += c;
    }
  }

  if (now - lastSend >= SEND_INTERVAL_MS) {
    lastSend = now;

    Serial.print(F("{\"ldr\":"));
    Serial.print(ldrRaw);
    Serial.print(F(",\"enc\":"));
    Serial.print(encTrim);
    Serial.print(F(",\"click\":"));
    Serial.print(clickEvent ? 1 : 0);
    Serial.print(F(",\"brightness\":"));
    Serial.print(brightness);
    Serial.print(F(",\"energy_alert\":"));
    Serial.print(energyAlert ? 1 : 0);
    Serial.println(F("}"));

    clickEvent = false;
  }
}
