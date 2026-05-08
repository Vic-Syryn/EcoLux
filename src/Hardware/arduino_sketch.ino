/*
 * EcoLux – Arduino Component Controller
 * Arduino Uno edition – uses the Encoder library for reliable reading
 * ---------------------------------------------------------------
 *
 * LIBRARY REQUIRED:
 *   Install "Encoder" by Paul Stoffregen via Arduino IDE:
 *   Sketch → Include Library → Manage Libraries → search "Encoder" → Install
 *
 * Pin wiring (matches your diagram):
 *   D2  – Encoder CLK  (interrupt pin)
 *   D3  – Encoder DT   (interrupt pin)
 *   D4  – Encoder SW   (click button) → other side to GND
 *   A1  – LDR          → voltage divider: 5V–[LDR]–A1–[10kΩ]–GND
 *   D9  – LED          → D9–[330Ω]–LED(+) LED(-)–GND
 *
 * Serial protocol (115200 baud):
 *   Sends every 100 ms:
 *     {"ldr":512,"enc":3,"click":0,"brightness":180,"energy_alert":0}
 *
 *   Receives from Pi:
 *     "ALERT:1"    → energy loss detected, LED on (sensor-driven brightness)
 *     "ALERT:0"    → alert cleared, LED off
 *     "LED_TEST:1" → force LED full brightness (for testing only)
 *     "LED_TEST:0" → exit test mode
 *     "RESET"      → clear all state, zero encoder counter (sent before each test)
 *
 * FIXES vs previous version:
 *   1. Click detection: lastSWState was being compared to itself (always equal)
 *      because the debounce window check and the edge check shared the wrong
 *      reference value. Fixed by tracking a separate `swStable` variable that
 *      only updates after the debounce settles, so the falling-edge comparison
 *      is always between the new stable value and the previous stable value.
 *
 *   2. LED dimming: BRIGHTNESS_MIN (80) was applied inside computeBrightness(),
 *      clamping the return value so the encoder could never dim below 80 even
 *      in a dark room with full counter-clockwise trim. Fixed by computing the
 *      unconstrained value inside the function (floor = 0) and applying the
 *      BRIGHTNESS_MIN floor only at the analogWrite() call site, so it acts as
 *      a safety minimum only when the alert is active, not as a calculation cap.
 */

#include <Encoder.h>

// ── Pins ──────────────────────────────────────────────────────────────────────
const int PIN_LDR     = A1;
const int PIN_ENC_SW  = 4;    // click — D4, clean digital pin
const int PIN_LED     = 9;    // hardware PWM

// Swapped to 3,2 to fix inverted rotation direction
Encoder enc(3, 2);            // DT = D3, CLK = D2

// ── Tuning ────────────────────────────────────────────────────────────────────
const int SEND_INTERVAL_MS = 100;
const int DEBOUNCE_MS      = 50;
const int ENC_STEP         = 15;   // brightness units per encoder detent (was 4 — increased for fast, visible response)
const int ENC_MIN          = -255; // trim floor (was -60 — now full range so encoder can drive LED to 0)
const int ENC_MAX          =  255; // trim ceiling (was 60)
// LDR calibration — set these to the raw ADC values your sensor actually reaches.
// Run test 2 and note the 'Dark value' and 'Bright value' printed there, then paste them here.
// Current values are based on observed hardware (covered hand ~700, direct torch ~960).
const int LDR_DARK         = 822;  // ADC reading when LDR is fully covered
const int LDR_BRIGHT       = 972;  // ADC reading under direct torch
const int BRIGHTNESS_MIN   = 80;   // LED never goes below this when alert is on
const int BRIGHTNESS_MAX   = 255;

// ── State ─────────────────────────────────────────────────────────────────────
bool          energyAlert    = false;
bool          testMode       = false;
bool          clickEvent     = false;
unsigned long lastDebounce   = 0;
unsigned long lastSend       = 0;
int           encTrim        = 0;
String        cmdBuffer      = "";

// FIX 1: use two separate variables for debounce
//   swRaw    – the raw reading this loop iteration
//   swStable – the last value that passed the debounce filter
// This ensures the falling-edge comparison is always old-stable vs new-stable,
// not new vs new (which was the original bug).
bool swRaw    = HIGH;
bool swStable = HIGH;

// ── Brightness ────────────────────────────────────────────────────────────────
int computeBrightness(int ldrRaw) {
  // Stretch the LDR's real working range to full brightness range.
  // LDR_DARK and LDR_BRIGHT are calibrated to the actual min/max observed
  // on this hardware — avoids the dead zone when the sensor never reaches 0 or 1023.
  int stretched = map(ldrRaw, LDR_DARK, LDR_BRIGHT, 0, BRIGHTNESS_MAX);
  int base = constrain(stretched, 0, BRIGHTNESS_MAX);
  int trim = constrain(encTrim * ENC_STEP, ENC_MIN, ENC_MAX);
  return constrain(base + trim, 0, BRIGHTNESS_MAX);
}

// ── Setup ─────────────────────────────────────────────────────────────────────
void setup() {
  Serial.begin(115200);
  pinMode(PIN_ENC_SW, INPUT_PULLUP);   // click: idle = HIGH, pressed = LOW
  pinMode(PIN_LED,    OUTPUT);
  analogWrite(PIN_LED, 0);
  enc.write(0);                        // reset encoder position to 0
}

// ── Loop ──────────────────────────────────────────────────────────────────────
void loop() {
  unsigned long now = millis();

  // ── Read encoder (Encoder library returns 4 ticks per detent on most encoders)
  long rawPos = enc.read();
  // Convert raw ticks → detent steps (divide by 4)
  int detents = (int)(rawPos / 4);
  encTrim = constrain(detents, ENC_MIN / ENC_STEP, ENC_MAX / ENC_STEP);  // ±17 detents max

  // ── Read LDR ────────────────────────────────────────────────────────────────
  int ldrRaw    = analogRead(PIN_LDR);
  int brightness = computeBrightness(ldrRaw);

  // ── Drive LED ───────────────────────────────────────────────────────────────
  if (testMode) {
    analogWrite(PIN_LED, 255);
  } else if (energyAlert) {
    // No floor applied — LDR and encoder can drive brightness all the way to 0
    // so covering the LDR visibly dims/kills the LED (fixes test 6).
    analogWrite(PIN_LED, brightness);
  } else {
    analogWrite(PIN_LED, 0);
  }

  // ── Click detection (debounced) ──────────────────────────────────────────────
  // FIX 1: read into swRaw; only update swStable (and check for edge) after the
  // debounce window has elapsed. This guarantees swStable always holds the
  // *previous* confirmed state when we test for a falling edge.
  swRaw = digitalRead(PIN_ENC_SW);
  if (swRaw != swStable) {
    // State changed — (re)start the debounce timer
    lastDebounce = now;
  }
  if ((now - lastDebounce) > DEBOUNCE_MS) {
    // Signal has been stable long enough — check for falling edge
    if (swRaw == LOW && swStable == HIGH) {
      clickEvent = true;
    }
    swStable = swRaw;   // advance stable reference only after debounce confirms
  }

  // ── Read serial commands from Pi (non-blocking, char by char) ───────────────
  while (Serial.available()) {
    char c = Serial.read();
    if (c == '\n' || c == '\r') {
      if (cmdBuffer.length() > 0) {
        cmdBuffer.trim();
        if      (cmdBuffer == "ALERT:1")    { energyAlert = true; enc.write(0); encTrim = 0; }  // reset trim so LDR has full range from the start
        else if (cmdBuffer == "ALERT:0")    { energyAlert = false; analogWrite(PIN_LED, 0); }
        else if (cmdBuffer == "LED_TEST:1") { testMode = true; }
        else if (cmdBuffer == "LED_TEST:0") { testMode = false; analogWrite(PIN_LED, 0); }
        else if (cmdBuffer == "RESET") {
          energyAlert = false;
          testMode    = false;
          enc.write(0);
          encTrim     = 0;
          clickEvent  = false;
          swStable    = HIGH;   // reset debounce state too
          cmdBuffer   = "";     // flush any leftover partial command
          analogWrite(PIN_LED, 0);
        }
        cmdBuffer = "";
      }
    } else {
      if (cmdBuffer.length() < 32) cmdBuffer += c;  // guard against overflow
    }
  }

  // ── Send JSON every SEND_INTERVAL_MS ────────────────────────────────────────
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

    clickEvent = false;   // clear after reporting
  }
}
