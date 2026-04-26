const API_BASE = 'http://ecolux.local:8000';

export interface DevicePlacement {
  floor_id: string;
  room_id: string;
  x: number;
  y: number;
}

export interface Device {
  id: number;
  name: string;
  type: string;
  online: boolean;
  state: boolean | null;
  placement: DevicePlacement | null;
}

export async function getDevices(): Promise<Device[]> {
  const response = await fetch(`${API_BASE}/devices`);
  const data = await response.json();
  return data.devices;
}

export async function turnOn(nodeId: number): Promise<void> {
  await fetch(`${API_BASE}/devices/${nodeId}/on`, { method: 'POST' });
}

export async function turnOff(nodeId: number): Promise<void> {
  await fetch(`${API_BASE}/devices/${nodeId}/off`, { method: 'POST' });
}

export async function toggleDevice(nodeId: number): Promise<void> {
  await fetch(`${API_BASE}/devices/${nodeId}/toggle`, { method: 'POST' });
}

export async function setPlacement(
  nodeId: number,
  floorId: string,
  roomId: string,
  x: number,
  y: number
): Promise<void> {
  await fetch(`${API_BASE}/devices/${nodeId}/placement`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ floor_id: floorId, room_id: roomId, x, y }),
  });
}

export async function removePlacement(nodeId: number): Promise<void> {
  await fetch(`${API_BASE}/devices/${nodeId}/placement`, { method: 'DELETE' });
}

// TODO: Replace with your actual pairing endpoint path and request body shape.
// Current assumption: POST /commission  with body { "code": "XXXXXXXXXXX" }
// If your endpoint is different (e.g. POST /pair, body { setup_code: "..." }),
// update the fetch call below accordingly.
export async function pairDevice(code: string): Promise<void> {
  const response = await fetch(`${API_BASE}/commission`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code }),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(text || `Pairing failed (${response.status})`);
  }
}
