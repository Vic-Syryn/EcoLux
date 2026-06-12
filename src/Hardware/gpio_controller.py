"""
EcoLux – GPIO / Arduino Controller
------------------------------------
Runs as a background service alongside main.py (FastAPI).

Responsibilities:
  • Read JSON telemetry from Arduino over USB serial
  • Poll main.py /devices endpoint to detect energy-loss alerts
    (plug ON longer than problem_minutes)
  • Send ALERT:1 / ALERT:0 commands back to Arduino → controls LED strip

FIX: on_since is now tracked IN MEMORY here, not read from the API.
     This prevents stale timestamps in settings.json from causing
     instant false alerts after a restart.
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
BAUD_RATE     = 115200
API_BASE      = "http://localhost:8000"
POLL_INTERVAL = 2

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
)
log = logging.getLogger("gpio_controller")

# ── State ─────────────────────────────────────────────────────────────────────
state = {
    "energy_alert": False,
    "ldr":          0,
    "brightness":   0,
}
state_lock = threading.Lock()

# Track when each device turned on — keyed by device id (int)
# Only set when WE see the transition, so never stale across restarts
device_on_since: dict[int, datetime] = {}
device_on_since_lock = threading.Lock()


# ── Serial port auto-detection ────────────────────────────────────────────────

def find_arduino_port() -> str | None:
    candidates = ["/dev/ttyUSB0", "/dev/ttyUSB1", "/dev/ttyACM0", "/dev/ttyACM1"]
    for port in candidates:
        try:
            s = serial.Serial(port, BAUD_RATE, timeout=0.5)
            s.close()
            log.info(f"Arduino found on {port}")
            return port
        except serial.SerialException:
            continue
    for info in serial.tools.list_ports.comports():
        desc = (info.description or "").lower()
        if any(k in desc for k in ("arduino", "ch340", "atmega", "usb serial")):
            log.info(f"Arduino found via scan: {info.device} ({info.description})")
            return info.device
    return None


# ── Energy-loss polling ───────────────────────────────────────────────────────

# Remember last known state per device so we can detect transitions
_last_device_state: dict[int, bool] = {}
_last_on_since: dict[int, str] = {}

def check_energy_alert() -> bool:
    global _last_device_state
    try:
        r = requests.get(f"{API_BASE}/devices", timeout=5)
        r.raise_for_status()
        devices = r.json().get("devices", [])

        now = datetime.now(timezone.utc)
        alert = False

        for dev in devices:
            dev_id  = dev.get("id")
            state_on = dev.get("state", False)
            online   = dev.get("online", False)
            problem_min = dev.get("problem_minutes")

            # Skip offline devices or devices without a problem_minutes limit
            if not online or not state_on or problem_min is None:
                # If device turned off, clear our local on_since
                if not state_on and dev_id in device_on_since:
                    with device_on_since_lock:
                        del device_on_since[dev_id]
                    log.info(f"Device {dev_id} turned off — timer cleared")
                _last_device_state[dev_id] = state_on
                continue

            # Detect on-transition: device just turned on
            # Also reset if prev was already True — handles the case where
            # the plug was turned off and back on between two polls
            prev = _last_device_state.get(dev_id, None)
            if prev is not True:
                with device_on_since_lock:
                    device_on_since[dev_id] = now
                log.info(f"Device {dev_id} turned on — timer started")
            elif dev.get("on_since") != _last_on_since.get(dev_id):
                # on_since changed in the API → plug was cycled between polls
                with device_on_since_lock:
                    device_on_since[dev_id] = now
                log.info(f"Device {dev_id} was power-cycled — timer reset")

            _last_device_state[dev_id] = state_on
            _last_on_since[dev_id] = dev.get('on_since')

            # Check how long it has been on according to OUR timer
            with device_on_since_lock:
                on_since = device_on_since.get(dev_id)

            if on_since is None:
                continue

            minutes_on = (now - on_since).total_seconds() / 60
            if minutes_on >= problem_min:
                log.warning(
                    f"Device {dev_id} has been ON for "
                    f"{minutes_on:.1f} min (limit {problem_min} min)"
                )
                alert = True

        return alert

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


# ── Serial connection ─────────────────────────────────────────────────────────

def open_serial(port: str) -> serial.Serial:
    log.info(f"Opening {port} at {BAUD_RATE} baud …")
    ser = serial.Serial()
    ser.port     = port
    ser.baudrate = BAUD_RATE
    ser.timeout  = 2
    ser.open()

    log.info("Waiting for Arduino to boot (3 s) …")
    time.sleep(3)
    ser.reset_input_buffer()

    log.info("Waiting for first valid JSON frame …")
    deadline = time.time() + 10
    while time.time() < deadline:
        try:
            raw = ser.readline()
            if not raw:
                continue
            text = raw.decode("utf-8", errors="replace").strip()
            if text.startswith("{"):
                json.loads(text)
                log.info(f"Arduino ready — first frame: {text}")
                return ser
        except (json.JSONDecodeError, UnicodeDecodeError):
            pass

    log.warning("Handshake timed out — continuing anyway")
    return ser


# ── Main serial read loop ─────────────────────────────────────────────────────

def run(port: str):
    ser = open_serial(port)

    t = threading.Thread(target=energy_poll_thread, args=(ser,), daemon=True)
    t.start()

    log.info("Listening for Arduino telemetry …")
    consecutive_empty = 0

    while True:
        try:
            raw = ser.readline()

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
                state["brightness"] = data.get("brightness", 0)

            log.debug(
                f"ldr={data.get('ldr')} "
                f"brightness={data.get('brightness')} "
                f"alert={data.get('energy_alert')}"
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
