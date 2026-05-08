from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import asyncio
import json
import os
from datetime import datetime, timezone
import websockets

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

MATTER_SERVER_URL = "ws://localhost:5580/ws"
PLACEMENT_FILE = "/home/ecolux/matter-data/placements.json"
SETTINGS_FILE  = "/home/ecolux/matter-data/settings.json"

# ── Storage helpers ───────────────────────────────────────────────────────────

def _load(path: str) -> dict:
    if os.path.exists(path):
        with open(path) as f:
            return json.load(f)
    return {}

def _save(path: str, data: dict):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w") as f:
        json.dump(data, f)

def load_placements() -> dict:  return _load(PLACEMENT_FILE)
def save_placements(d):          _save(PLACEMENT_FILE, d)
def load_settings() -> dict:    return _load(SETTINGS_FILE)
def save_settings(d):            _save(SETTINGS_FILE, d)

# ── Matter helpers ────────────────────────────────────────────────────────────

async def send_matter_command(command: dict):
    async with websockets.connect(MATTER_SERVER_URL) as ws:
        await ws.recv()
        await ws.send(json.dumps(command))
        return json.loads(await ws.recv())

async def get_nodes():
    async with websockets.connect(MATTER_SERVER_URL) as ws:
        await ws.recv()
        await ws.send(json.dumps({"message_id": "1", "command": "get_nodes", "args": {}}))
        return json.loads(await ws.recv())

# ── Models ────────────────────────────────────────────────────────────────────

class PlacementRequest(BaseModel):
    floor_id: str
    room_id: str
    x: float
    y: float

class SettingsRequest(BaseModel):
    problem_minutes: Optional[int] = None

class CommissionRequest(BaseModel):
    code: str

# ── Endpoints ─────────────────────────────────────────────────────────────────

@app.get("/devices")
async def get_devices():
    try:
        response   = await get_nodes()
        nodes      = response.get("result", [])
        placements = load_placements()
        settings   = load_settings()
        devices    = []

        for node in nodes:
            node_id   = node.get("node_id")
            attrs     = node.get("attributes", {})
            on_off    = attrs.get("1/6/0", None)
            key       = str(node_id)
            s         = settings.get(key, {})
            on_since  = s.get("on_since", None)

            # Track on_since: set when state transitions to True, clear when False
            # (state transitions are detected here on each poll)
            prev_state = s.get("last_known_state", None)
            if on_off is True and prev_state is not True:
                on_since = datetime.now(timezone.utc).isoformat()
                s["on_since"] = on_since
                s["last_known_state"] = True
                settings[key] = s
            elif on_off is False and prev_state is not False:
                on_since = None
                s["on_since"] = None
                s["last_known_state"] = False
                settings[key] = s

            devices.append({
                "id":              node_id,
                "name":            f"Plug {node_id}",
                "type":            "smart_plug",
                "online":          node.get("available", False),
                "state":           on_off,
                "placement":       placements.get(key),
                "problem_minutes": s.get("problem_minutes", None),
                "on_since":        on_since,
            })

        save_settings(settings)
        return {"devices": devices}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/devices/{node_id}/on")
async def turn_on(node_id: int):
    try:
        await send_matter_command({
            "message_id": "2", "command": "device_command",
            "args": {"node_id": node_id, "endpoint_id": 1, "cluster_id": 6,
                     "command_name": "On", "payload": {}}
        })
        # Record on_since immediately
        s = load_settings()
        key = str(node_id)
        s.setdefault(key, {})
        s[key]["on_since"] = datetime.now(timezone.utc).isoformat()
        s[key]["last_known_state"] = True
        save_settings(s)
        return {"status": "ok", "state": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/devices/{node_id}/off")
async def turn_off(node_id: int):
    try:
        await send_matter_command({
            "message_id": "3", "command": "device_command",
            "args": {"node_id": node_id, "endpoint_id": 1, "cluster_id": 6,
                     "command_name": "Off", "payload": {}}
        })
        s = load_settings()
        key = str(node_id)
        s.setdefault(key, {})
        s[key]["on_since"] = None
        s[key]["last_known_state"] = False
        save_settings(s)
        return {"status": "ok", "state": False}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/devices/{node_id}/toggle")
async def toggle(node_id: int):
    try:
        await send_matter_command({
            "message_id": "4", "command": "device_command",
            "args": {"node_id": node_id, "endpoint_id": 1, "cluster_id": 6,
                     "command_name": "Toggle", "payload": {}}
        })
        return {"status": "ok"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/devices/{node_id}/placement")
async def set_placement(node_id: int, body: PlacementRequest):
    try:
        p = load_placements()
        p[str(node_id)] = {"floor_id": body.floor_id, "room_id": body.room_id,
                           "x": body.x, "y": body.y}
        save_placements(p)
        return {"status": "ok"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.delete("/devices/{node_id}/placement")
async def remove_placement(node_id: int):
    try:
        p = load_placements()
        p.pop(str(node_id), None)
        save_placements(p)
        return {"status": "ok"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/devices/{node_id}/settings")
async def update_settings(node_id: int, body: SettingsRequest):
    try:
        s = load_settings()
        key = str(node_id)
        s.setdefault(key, {})
        s[key]["problem_minutes"] = body.problem_minutes
        save_settings(s)
        return {"status": "ok"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/commission")
async def commission(body: CommissionRequest):
    try:
        async with websockets.connect(MATTER_SERVER_URL) as ws:
            await ws.recv()
            await ws.send(json.dumps({
                "message_id": "commission-1",
                "command": "commission_with_code",
                "args": {"code": body.code, "network_only": True}
            }))
            response = await asyncio.wait_for(ws.recv(), timeout=60)
            result = json.loads(response)
            if "error" in result:
                raise HTTPException(status_code=400, detail=result["error"])
            return {"status": "ok", "result": result.get("result")}
    except asyncio.TimeoutError:
        raise HTTPException(status_code=504, detail="Commissioning timed out")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/health")
async def health():
    return {"status": "ok"}
