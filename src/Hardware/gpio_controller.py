"""
EcoLux – GPIO / Arduino Controller
------------------------------------
Runs as a background service alongside main.py (FastAPI).

Responsibilities:
  • Read JSON telemetry from Arduino over USB serial
  • Detect pot-click events → toggle screen wake/sleep state
  • Poll main.py /devices endpoint to detect energy-loss alerts
    (plug ON longer than problem_minutes)
  • Send ALERT:1 / ALERT:0 commands back to Arduino → controls LED brightness

Serial port:  /dev/ttyUSB0  or  /dev/ttyACM0  (auto-detected)
Baud rate:    115200

Usage:
  python3 gpio_controller.py

Dependencies:
  pip install pyserial requests
"""

import serial
import serial.tools.list_ports
import json
import time
import threading
import requests
import logging
from datetime import datetime, timezone

# ── Config ────────────────────────────────────────────────────────────────────
BAUD_RATE         = 115200
API_BASE          = "http://localhost:8000"
POLL_INTERVAL     = 10         # seconds between energy-loss checks
SCREEN_WAKE_FILE  = "/tmp/ecolux_screen_wake"   # flag file read by Kiosk app

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
)
log = logging.getLogger("gpio_controller")

# ── State (shared between threads) ───────────────────────────────────────────
state = {
    "screen_on":    True,
    "energy_alert": False,
    "ldr":          0,
    "enc":          0,
    "brightness":   0,
}
state_lock = threading.Lock()


# ── Serial port auto-detection ────────────────────────────────────────────────

def find_arduino_port() -> str | None:
    """Return the first USB serial port that looks like an Arduino."""
    candidates = ["/dev/ttyUSB0", "/dev/ttyUSB1", "/dev/ttyACM0", "/dev/ttyACM1"]
    for port in candidates:
        try:
            s = serial.Serial(port, BAUD_RATE, timeout=0.5)
            s.close()
            log.info(f"Arduino found on {port}")
            return port
        except serial.SerialException:
            continue

    # Fallback: scan all ports for CH340 / ATmega descriptors
    for info in serial.tools.list_ports.comports():
        desc = (info.description or "").lower()
        if any(k in desc for k in ("arduino", "ch340", "atmega", "usb serial")):
            log.info(f"Arduino found via scan: {info.device} ({info.description})")
            return info.device

    return None


# ── Screen wake/sleep ─────────────────────────────────────────────────────────

def set_screen(on: bool):
    """
    Toggle the simulated screen state.
    Writes a flag file that the Kiosk app can poll.
    Also uses xdotool / vcgencmd if available.
    """
    with state_lock:
        if state["screen_on"] == on:
            return
        state["screen_on"] = on

    if on:
        log.info("Screen → ON")
        with open(SCREEN_WAKE_FILE, "w") as f:
            f.write("on")
        # Try hardware blanking (works on Pi with HDMI)
        import subprocess
        subprocess.run(["xdotool", "key", "ctrl"], capture_output=True)
        subprocess.run(["vcgencmd", "display_power", "1"], capture_output=True)
    else:
        log.info("Screen → OFF (simulated black)")
        with open(SCREEN_WAKE_FILE, "w") as f:
            f.write("off")
        import subprocess
        subprocess.run(["vcgencmd", "display_power", "0"], capture_output=True)


# ── Energy-loss polling (calls main.py API) ───────────────────────────────────

def check_energy_alert() -> bool:
    """
    Returns True if ANY device has been ON longer than its problem_minutes.
    """
    try:
        r = requests.get(f"{API_BASE}/devices", timeout=5)
        r.raise_for_status()
        devices = r.json().get("devices", [])

        now = datetime.now(timezone.utc)
        for dev in devices:
            if not dev.get("state"):          # device is off → no problem
                continue
            problem_min = dev.get("problem_minutes")
            on_since    = dev.get("on_since")
            if problem_min is None or on_since is None:
                continue
            on_since_dt = datetime.fromisoformat(on_since)
            minutes_on  = (now - on_since_dt).total_seconds() / 60
            if minutes_on >= problem_min:
                log.warning(
                    f"Device {dev['id']} has been ON for "
                    f"{minutes_on:.1f} min (limit {problem_min} min)"
                )
                return True
        return False
    except Exception as e:
        log.error(f"Energy check failed: {e}")
        return False


# ── Background thread: energy polling ────────────────────────────────────────

def energy_poll_thread(ser: serial.Serial):
    while True:
        alert = check_energy_alert()
        with state_lock:
            changed = alert != state["energy_alert"]
            state["energy_alert"] = alert

        if changed:
            cmd = "ALERT:1\n" if alert else "ALERT:0\n"
            try:
                ser.write(cmd.encode())
                log.info(f"Sent to Arduino: {cmd.strip()}")
            except serial.SerialException as e:
                log.error(f"Serial write error: {e}")

        time.sleep(POLL_INTERVAL)


# ── Serial connection with boot handshake ────────────────────────────────────

def open_serial(port: str) -> serial.Serial:
    """
    Open serial port and wait until the Arduino is actually sending data.
    Fixes: 'device reports readiness to read but returned no data'
    """
    log.info(f"Opening {port} at {BAUD_RATE} baud …")
    ser = serial.Serial()
    ser.port     = port
    ser.baudrate = BAUD_RATE
    ser.timeout  = 2      # 2 s read timeout — avoids blocking forever
    ser.open()

    # Arduino resets on DTR toggle when serial opens — wait for it to boot
    log.info("Waiting for Arduino to boot (3 s) …")
    time.sleep(3)
    ser.reset_input_buffer()   # discard boot garbage / partial lines

    # Handshake: wait for first valid JSON frame (up to 10 s)
    log.info("Waiting for first valid JSON frame …")
    deadline = time.time() + 10
    while time.time() < deadline:
        try:
            raw = ser.readline()
            if not raw:
                continue
            text = raw.decode("utf-8", errors="replace").strip()
            if text.startswith("{"):
                json.loads(text)   # confirm it parses cleanly
                log.info(f"Arduino ready — first frame: {text}")
                return ser
        except (json.JSONDecodeError, UnicodeDecodeError):
            pass   # still booting, keep waiting

    log.warning("Handshake timed out — continuing anyway")
    return ser


# ── Main serial read loop ─────────────────────────────────────────────────────

def run(port: str):
    ser = open_serial(port)

    # Start energy polling in background
    t = threading.Thread(target=energy_poll_thread, args=(ser,), daemon=True)
    t.start()

    log.info("Listening for Arduino telemetry …")
    consecutive_empty = 0

    while True:
        try:
            raw = ser.readline()

            # Empty bytes = timeout with no data (not an error — just wait)
            if not raw:
                consecutive_empty += 1
                if consecutive_empty >= 5:
                    log.warning("No data from Arduino for ~10 s — check USB connection")
                    consecutive_empty = 0
                continue
            consecutive_empty = 0

            text = raw.decode("utf-8", errors="replace").strip()
            if not text:
                continue

            data = json.loads(text)

            with state_lock:
                state["ldr"]        = data.get("ldr", 0)
                state["enc"]        = data.get("enc", 0)
                state["brightness"] = data.get("brightness", 0)

            # Handle click → toggle screen
            if data.get("click") == 1:
                with state_lock:
                    current = state["screen_on"]
                set_screen(not current)

            log.debug(
                f"ldr={data.get('ldr')} enc={data.get('enc')} "
                f"brightness={data.get('brightness')} "
                f"click={data.get('click')} alert={data.get('energy_alert')}"
            )

        except json.JSONDecodeError:
            log.debug(f"Non-JSON line from Arduino: {text!r}")
        except serial.SerialException as e:
            log.error(f"Serial read error: {e}")
            log.info("Attempting reconnect in 5 s …")
            time.sleep(5)
            try:
                ser.close()
                ser = open_serial(port)
            except Exception as reconnect_err:
                log.error(f"Reconnect failed: {reconnect_err}")
                break
        except KeyboardInterrupt:
            log.info("Shutting down.")
            ser.close()
            break


# ── Entry point ───────────────────────────────────────────────────────────────

if __name__ == "__main__":
    port = find_arduino_port()
    if port is None:
        log.error(
            "No Arduino found. Check USB connection and try again.\n"
            "Expected ports: /dev/ttyUSB0, /dev/ttyUSB1, /dev/ttyACM0, /dev/ttyACM1"
        )
        raise SystemExit(1)

    run(port)
