
#include <Adafruit_NeoPixel.h>

#define LED_PIN    9
#define LED_COUNT  27

Adafruit_NeoPixel strip = Adafruit_NeoPixel(LED_COUNT, LED_PIN, NEO_GRB + NEO_KHZ800);

// Pins
const int PIN_LDR = A1;

// Tuning
const int SEND_INTERVAL_MS = 100;

const int LDR_DARK       = 822;
const int LDR_BRIGHT     = 972;
const int BRIGHTNESS_MAX     = 255;
const int ALERT_MIN_BRIGHTNESS = 150;  // strip altijd zichtbaar bij alert

// Cap totaal verbruik op ~40% zodat 120 LEDs binnen 5A PSU blijven
const uint8_t MAX_STRIP_BRIGHTNESS = 200;  // ~78% — ruim binnen 5A PSU

// State
bool          energyAlert = false;
bool          testMode    = false;
unsigned long lastSend    = 0;
String        cmdBuffer   = "";

uint32_t currentColor = 0;

// ── Helderheid ────────────────────────────────────────────────────────────────
int computeBrightness(int ldrRaw) {
  int stretched = map(ldrRaw, LDR_DARK, LDR_BRIGHT, 0, BRIGHTNESS_MAX);
  return constrain(stretched, 0, BRIGHTNESS_MAX);
}

// ── Strip helpers (non-blocking) ──────────────────────────────────────────────
void setStripColor(uint32_t color) {
  if (color == currentColor) return;
  currentColor = color;
  for (uint16_t i = 0; i < strip.numPixels(); i++) {
    strip.setPixelColor(i, color);
  }
  strip.show();
}

void clearStrip() {
  setStripColor(0);
}

// ── Setup ─────────────────────────────────────────────────────────────────────
void setup() {
  Serial.begin(115200);
  strip.begin();
  strip.setBrightness(MAX_STRIP_BRIGHTNESS);
  strip.show();
}

// ── Loop ──────────────────────────────────────────────────────────────────────
void loop() {
  unsigned long now = millis();

  // LDR
  int ldrRaw    = analogRead(PIN_LDR);
  int brightness = computeBrightness(ldrRaw);

  // Strip
  if (testMode) {
    setStripColor(strip.Color(255, 0, 0));
  } else if (energyAlert) {
    int alertBrightness = max(brightness, ALERT_MIN_BRIGHTNESS);
    setStripColor(strip.Color(alertBrightness, 0, 0));
  } else {
    clearStrip();
  }

  // Seriële commando's van Pi
  while (Serial.available()) {
    char c = Serial.read();
    if (c == '\n' || c == '\r') {
      if (cmdBuffer.length() > 0) {
        cmdBuffer.trim();
        if      (cmdBuffer == "ALERT:1")    { energyAlert = true; }
        else if (cmdBuffer == "ALERT:0")    { energyAlert = false; clearStrip(); }
        else if (cmdBuffer == "LED_TEST:1") { testMode = true; }
        else if (cmdBuffer == "LED_TEST:0") { testMode = false; clearStrip(); }
        else if (cmdBuffer == "RESET") {
          energyAlert = false;
          testMode    = false;
          cmdBuffer   = "";
          clearStrip();
        }
        cmdBuffer = "";
      }
    } else {
      if (cmdBuffer.length() < 32) cmdBuffer += c;
    }
  }

  // JSON telemetrie versturen
  if (now - lastSend >= SEND_INTERVAL_MS) {
    lastSend = now;
    Serial.print(F("{\"ldr\":"));
    Serial.print(ldrRaw);
    Serial.print(F(",\"brightness\":"));
    Serial.print(brightness);
    Serial.print(F(",\"energy_alert\":"));
    Serial.print(energyAlert ? 1 : 0);
    Serial.println(F("}"));
  }
}
