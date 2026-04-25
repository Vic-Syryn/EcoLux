const API_BASE = 'http://ecolux.local:8000';

export interface Device {
  id: number;
  name: string;
  type: string;
  online: boolean;
  state: boolean | null;
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