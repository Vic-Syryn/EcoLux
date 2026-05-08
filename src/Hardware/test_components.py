"""
EcoLux – Component Test Script
---------------------------------
Run this to verify each hardware component works before the demo.
Tests are interactive and clearly report PASS / FAIL.

Usage:
  python3 test_components.py

Requirements:
  pip install pyserial
  Arduino must be connected and running arduino_sketch.ino
"""

import serial
import serial.tools.list_ports
import json
import time
import sys

BAUD_RATE = 115200

# ── ANSI colours ──────────────────────────────────────────────────────────────
GREEN  = "\033[92m"
RED    = "\033[91m"
YELLOW = "\033[93m"
CYAN   = "\033[96m"
BOLD   = "\033[1m"
RESET  = "\033[0m"

def ok(msg):   print(f"  {GREEN}✔  PASS{RESET}  {msg}")
def fail(msg): print(f"  {RED}✘  FAIL{RESET}  {msg}")
def info(msg): print(f"  {CYAN}ℹ  {msg}{RESET}")
def warn(msg): print(f"  {YELLOW}⚠  {msg}{RESET}")

def header(msg):
    print(f"\n{BOLD}{'─'*55}{RESET}")
    print(f"{BOLD}  {msg}{RESET}")
    print(f"{BOLD}{'─'*55}{RESET}")

def prompt(msg) -> str:
    return input(f"\n  {YELLOW}▶  {msg}{RESET} ").strip().lower()


# ── Serial helpers ────────────────────────────────────────────────────────────

def find_port() -> str | None:
    candidates = ["/dev/ttyUSB0", "/dev/ttyUSB1", "/dev/ttyACM0", "/dev/ttyACM1"]
    for p in candidates:
        try:
            s = serial.Serial(p, BAUD_RATE, timeout=0.5)
            s.close()
            return p
        except serial.SerialException:
            pass
    for port_info in serial.tools.list_ports.comports():
        desc = (port_info.description or "").lower()
        if any(k in desc for k in ("arduino", "ch340", "atmega", "usb serial")):
            return port_info.device
    return None


def open_serial(port: str) -> serial.Serial:
    """
    Open serial and wait for the Arduino to boot and send valid JSON.
    Fixes: 'device reports readiness to read but returned no data'
    """
    ser = serial.Serial()
    ser.port     = port
    ser.baudrate = BAUD_RATE
    ser.timeout  = 2
    ser.open()

    info("Waiting for Arduino to boot (3 s) …")
    time.sleep(3)
    ser.reset_input_buffer()

    info("Waiting for first valid JSON frame …")
    deadline = time.time() + 10
    while time.time() < deadline:
        try:
            raw = ser.readline()
            if not raw:
                continue
            text = raw.decode("utf-8", errors="replace").strip()
            if text.startswith("{"):
                json.loads(text)
                info(f"Arduino ready — first frame: {text}")
                return ser
        except (json.JSONDecodeError, UnicodeDecodeError):
            pass

    warn("Handshake timed out — continuing anyway")
    return ser


def read_sample(ser: serial.Serial, n: int = 5, timeout: int = 6) -> list[dict]:
    """Read n valid JSON samples from Arduino."""
    samples = []
    ser.reset_input_buffer()
    deadline = time.time() + timeout
    while len(samples) < n and time.time() < deadline:
        try:
            raw = ser.readline()
            if not raw:
                continue
            text = raw.decode("utf-8", errors="replace").strip()
            if text.startswith("{"):
                samples.append(json.loads(text))
        except (json.JSONDecodeError, UnicodeDecodeError, serial.SerialException):
            pass
    return samples


def send(ser: serial.Serial, cmd: str):
    ser.write((cmd + "\n").encode())


def reset_arduino(ser: serial.Serial):
    """Send RESET before each test so encoder, LED state and command buffer are clean."""
    ser.reset_input_buffer()   # flush Pi-side buffer first
    send(ser, "\n")            # send a newline to flush any partial command in Arduino buffer
    time.sleep(0.1)
    send(ser, "RESET")
    time.sleep(0.5)            # give Arduino time to process
    ser.reset_input_buffer()   # flush any boot/garbage frames


# ── Tests ─────────────────────────────────────────────────────────────────────

def test_connection(ser: serial.Serial) -> bool:
    header("TEST 0 – Arduino Serial Connection")
    info("Reading 3 JSON frames from Arduino …")
    samples = read_sample(ser, 3)
    if len(samples) >= 3:
        ok(f"Receiving data  (last frame: {samples[-1]})")
        return True
    fail("No valid JSON received from Arduino after 6 s")
    warn("Check: USB cable, correct port, sketch uploaded, baud=115200")
    return False


def test_led(ser: serial.Serial):
    reset_arduino(ser)
    header("TEST 1 – LED")
    info("Sending LED_TEST:1 → forces LED to full brightness (ignores all sensors)")
    send(ser, "LED_TEST:1")
    time.sleep(1)
    ans = prompt("Is the LED ON at full brightness? (y/n):")
    if ans == "y":
        ok("LED turns ON correctly")
    else:
        fail(
            "LED did not turn on. Check:\n"
            "    • Long leg (anode) → D9 via 330Ω resistor\n"
            "    • Short leg (cathode) → GND\n"
            "    • LED not inserted backwards"
        )

    info("Sending LED_TEST:0 → LED should turn OFF")
    send(ser, "LED_TEST:0")
    time.sleep(1)
    ans = prompt("Is the LED OFF? (y/n):")
    if ans == "y":
        ok("LED turns OFF correctly")
    else:
        fail("LED did not turn off — check Arduino sketch logic")


def test_ldr(ser: serial.Serial):
    reset_arduino(ser)
    header("TEST 2 – LDR (Light Sensor)")
    info("Reading baseline in current ambient light …")
    samples = read_sample(ser, 5)
    if not samples:
        fail("No data received from Arduino"); return

    baseline = sum(s.get("ldr", 0) for s in samples) / len(samples)
    info(f"Baseline LDR value: {baseline:.0f} / 1023")

    prompt("Cover the LDR completely with your hand, then press ENTER")
    dark_samples = read_sample(ser, 5)
    dark_val = sum(s.get("ldr", 0) for s in dark_samples) / len(dark_samples) if dark_samples else baseline

    prompt("Shine a phone torch on the LDR, then press ENTER")
    bright_samples = read_sample(ser, 5)
    bright_val = sum(s.get("ldr", 0) for s in bright_samples) / len(bright_samples) if bright_samples else baseline

    delta = abs(bright_val - dark_val)
    info(f"Dark value: {dark_val:.0f}   Bright value: {bright_val:.0f}   Δ = {delta:.0f}")

    if delta > 100:
        ok(f"LDR responds correctly to light changes (Δ = {delta:.0f})")
    else:
        fail(
            f"LDR range too small (Δ = {delta:.0f}). "
            "Check: 10kΩ resistor to GND, 5V on other LDR leg, wiper to A0"
        )


def test_encoder_rotation(ser: serial.Serial):
    reset_arduino(ser)
    header("TEST 3 – Rotary Encoder (Rotation)")
    info("Encoder counter reset to 0 — ready to test …")
    samples = read_sample(ser, 3)
    if not samples:
        fail("No data received from Arduino"); return

    enc_start = samples[-1].get("enc", 0)
    info(f"Encoder counter at start: {enc_start} (should be 0 after reset)")

    prompt("Slowly turn the encoder about 5 steps CLOCKWISE, then press ENTER")
    samples_cw = read_sample(ser, 3)
    enc_cw = samples_cw[-1].get("enc", enc_start) if samples_cw else enc_start
    info(f"Encoder counter after clockwise turn: {enc_cw}")

    if enc_cw > enc_start:
        ok(f"Clockwise increases counter ({enc_start} → {enc_cw})")
    else:
        fail(
            f"Counter did not increase ({enc_start} → {enc_cw}). "
            "Try swapping the CLK (D2) and DT (D3) wires if direction is reversed."
        )

    prompt("Now turn the encoder about 5 steps COUNTER-CLOCKWISE, then press ENTER")
    samples_ccw = read_sample(ser, 3)
    enc_ccw = samples_ccw[-1].get("enc", enc_cw) if samples_ccw else enc_cw
    info(f"Encoder counter after counter-clockwise turn: {enc_ccw}")

    if enc_ccw < enc_cw:
        ok(f"Counter-clockwise decreases counter ({enc_cw} → {enc_ccw})")
    else:
        fail(
            f"Counter did not decrease ({enc_cw} → {enc_ccw}). "
            "Check D2 (CLK) and D3 (DT) wiring."
        )

    # Reset at end so the encoder trim doesn't carry over into the next test
    reset_arduino(ser)


def test_encoder_brightness(ser: serial.Serial):
    reset_arduino(ser)
    header("TEST 4 – Encoder Controls LED Brightness")
    info("Sending ALERT:1 so the LED is active …")
    send(ser, "ALERT:1")
    time.sleep(0.5)

    samples_before = read_sample(ser, 3)
    b_before = samples_before[-1].get("brightness", -1) if samples_before else -1
    info(f"Brightness before turning encoder: {b_before} / 255")

    prompt("Slowly turn the encoder CLOCKWISE — watch the LED brighten, then press ENTER")
    samples_after = read_sample(ser, 3)
    b_after = samples_after[-1].get("brightness", -1) if samples_after else -1
    info(f"Brightness after clockwise turn: {b_after} / 255")

    send(ser, "ALERT:0")

    if b_after > b_before:
        ok(f"Encoder clockwise increases LED brightness ({b_before} → {b_after})")
    elif b_before >= 255:
        warn("Already at max brightness (255) — turn counter-clockwise first to make room, then retest")
    else:
        fail(
            f"Brightness did not increase ({b_before} → {b_after}). "
            "Check ENC_STEP in sketch and encoder CLK/DT wiring."
        )


def test_encoder_click(ser: serial.Serial):
    reset_arduino(ser)
    header("TEST 5 – Encoder Click Button")
    info("Press and release the encoder shaft (push it in like a button) …")
    info("Waiting up to 10 seconds for a click event …")

    ser.reset_input_buffer()
    deadline = time.time() + 10
    detected = False

    while time.time() < deadline:
        try:
            raw = ser.readline()
            if not raw:
                continue
            text = raw.decode("utf-8", errors="replace").strip()
            if text.startswith("{"):
                data = json.loads(text)
                if data.get("click") == 1:
                    detected = True
                    break
        except (json.JSONDecodeError, UnicodeDecodeError, serial.SerialException):
            pass

    if detected:
        ok("Click event received correctly from Arduino")
    else:
        fail(
            "No click detected in 10 s. Check:\n"
            "    • SW pin from encoder → D4 on Arduino\n"
            "    • Other SW pin → GND\n"
            "    • INPUT_PULLUP is set in the sketch for D4"
        )


def test_ldr_brightness(ser: serial.Serial):
    reset_arduino(ser)
    header("TEST 6 – LDR Sets LED Base Brightness")
    info("Covering the LDR should dim the LED toward 0, torch should brighten it toward 255.")
    info("Sending ALERT:1 so the LED is active …")
    send(ser, "ALERT:1")
    time.sleep(0.5)

    info("Do NOT turn the encoder during this test.")

    prompt("Cover the LDR completely with your hand so it is DARK, then press ENTER")
    dark_s = read_sample(ser, 5)
    b_dark   = sum(s.get("brightness", 0) for s in dark_s) / len(dark_s) if dark_s else -1
    ldr_dark = sum(s.get("ldr",        0) for s in dark_s) / len(dark_s) if dark_s else -1
    info(f"Brightness in dark:   {b_dark:.0f} / 255   (raw LDR = {ldr_dark:.0f})")

    prompt("Shine a phone torch directly on the LDR, then press ENTER")
    bright_s  = read_sample(ser, 5)
    b_bright   = sum(s.get("brightness", 0) for s in bright_s) / len(bright_s) if bright_s else -1
    ldr_bright = sum(s.get("ldr",        0) for s in bright_s) / len(bright_s) if bright_s else -1
    info(f"Brightness with torch: {b_bright:.0f} / 255   (raw LDR = {ldr_bright:.0f})")

    send(ser, "ALERT:0")
    delta     = b_bright - b_dark
    ldr_delta = ldr_bright - ldr_dark
    info(f"Δ brightness = {delta:.0f}   Δ LDR raw = {ldr_delta:.0f}")

    if ldr_delta < 30:
        fail(
            f"LDR raw barely changed (Δ = {ldr_delta:.0f}) — sensor not responding.\n"
            "    Check wiring: one LDR leg → 5V, other leg → A1 + 10kΩ to GND."
        )
    elif delta > 15:
        ok(f"LDR correctly adjusts LED brightness (Δ = {delta:.0f})")
    else:
        fail(
            f"LDR raw changed (Δ ldr = {ldr_delta:.0f}) but brightness barely moved (Δ = {delta:.0f}).\n"
            "    Likely cause: encoder trim is pulling brightness down — try running RESET\n"
            "    and re-running this test without touching the encoder first."
        )


# ── Main menu ─────────────────────────────────────────────────────────────────

def main():
    print(f"\n{BOLD}{'═'*55}{RESET}")
    print(f"{BOLD}   EcoLux – Hardware Component Test Suite{RESET}")
    print(f"{BOLD}{'═'*55}{RESET}")

    info("Searching for Arduino …")
    port = find_port()
    if port is None:
        fail("Arduino not found. Connect via USB and try again.")
        sys.exit(1)
    info(f"Arduino found on {port}")

    ser = open_serial(port)

    if not test_connection(ser):
        ser.close()
        sys.exit(1)

    tests = [
        ("LED (force on/off)",                  lambda: test_led(ser)),
        ("LDR (light sensor range)",            lambda: test_ldr(ser)),
        ("Encoder rotation (CW / CCW)",         lambda: test_encoder_rotation(ser)),
        ("Encoder brightness control",          lambda: test_encoder_brightness(ser)),
        ("Encoder click button",                lambda: test_encoder_click(ser)),
        ("LDR sets LED base brightness",        lambda: test_ldr_brightness(ser)),
        ("Run ALL tests in sequence",           None),
        ("Quit",                                None),
    ]

    while True:
        print(f"\n{BOLD}  Select a test:{RESET}")
        for i, (name, _) in enumerate(tests, 1):
            print(f"    {CYAN}{i}{RESET}. {name}")

        choice = prompt("Enter number:")
        if not choice.isdigit():
            continue
        idx = int(choice) - 1

        if idx == len(tests) - 1:        # Quit
            print(f"\n{GREEN}  All done. Good luck with the demo! 🎉{RESET}\n")
            ser.close()
            break
        elif idx == len(tests) - 2:      # Run all
            test_led(ser)
            test_ldr(ser)
            test_encoder_rotation(ser)
            test_encoder_brightness(ser)
            test_encoder_click(ser)
            test_ldr_brightness(ser)
        elif 0 <= idx < len(tests) - 2:
            tests[idx][1]()
        else:
            warn("Invalid choice")


if __name__ == "__main__":
    main()
