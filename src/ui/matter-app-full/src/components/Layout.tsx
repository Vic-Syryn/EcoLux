import { Outlet, useNavigate } from 'react-router';
import { mockHouseData, Floor } from '../data/mockData';
import { useState, useEffect } from 'react';
import { Device, getDevices, setPlacement } from '../api/devices';
import { SettingsOverlay } from './SettingsOverlay';
import { Settings } from 'lucide-react';

function isDeviceProblem(device: Device): boolean {
  if (!device.state) return false;
  if (device.problem_minutes == null) return false;
  if (!device.on_since) return false;
  const elapsedMinutes = (Date.now() - new Date(device.on_since).getTime()) / 60000;
  return elapsedMinutes >= device.problem_minutes;
}

export interface PlacingState {
  device: Device;
  floorId: string;
  roomId: string;
}

export function Layout() {
  const navigate = useNavigate();
  const [currentFloorId, setCurrentFloorId] = useState(mockHouseData[0].id);
  const [selectedWasters, setSelectedWasters] = useState<Set<string>>(new Set());
  const [houseData, setHouseData] = useState<Floor[]>(mockHouseData);
  const [allDevices, setAllDevices] = useState<Device[]>([]);
  const [showSettings, setShowSettings] = useState(false);
  const [assigningDevice, setAssigningDevice] = useState<Device | null>(null);
  // placingDevice: device being positioned in RoomDetail
  const [placingState, setPlacingState] = useState<PlacingState | null>(null);

  const currentFloor = houseData.find(f => f.id === currentFloorId);

  const fetchDevices = async () => {
    try {
      const data = await getDevices();
      setAllDevices(data);
    } catch { /* silently fail */ }
  };

  useEffect(() => {
    fetchDevices();
    const interval = setInterval(fetchDevices, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleFloorChange = (floorId: string) => setCurrentFloorId(floorId);

  const handleAccept = () => {
    setHouseData(houseData.map(floor => ({
      ...floor,
      rooms: floor.rooms.map(room => ({ ...room, energyWasters: [] })),
    })));
    setSelectedWasters(new Set());
  };

  const handleResetDemo = () => {
    setHouseData(mockHouseData);
    setSelectedWasters(new Set());
    setCurrentFloorId(mockHouseData[0].id);
  };

  // Called from SettingsOverlay when user picks a room for a device
  // → close settings, navigate to that room, enter placing mode
  const handleRoomSelectedForPlacement = (floorId: string, roomId: string) => {
    if (!assigningDevice) return;
    setPlacingState({ device: assigningDevice, floorId, roomId });
    setCurrentFloorId(floorId);
    setShowSettings(false);
    setAssigningDevice(null);
    navigate(`/room/${floorId}/${roomId}`);
  };

  // Called from RoomDetail when user confirms position
  const handleSavePlacement = async (x: number, y: number) => {
    if (!placingState) return;
    await setPlacement(placingState.device.id, placingState.floorId, placingState.roomId, x, y);
    await fetchDevices();
    setPlacingState(null);
  };

  const handleCancelPlacement = () => setPlacingState(null);

  const problemRoomIds = new Set<string>(
    allDevices
      .filter(isDeviceProblem)
      .map(d => d.placement?.room_id)
      .filter(Boolean) as string[]
  );

  return (
    <div className="h-screen w-screen flex overflow-hidden bg-[#708491] select-none relative">

      {/* Gear button */}
      <button
        onClick={() => { setAssigningDevice(null); setShowSettings(true); }}
        className="fixed top-3 right-3 z-30 w-11 h-11 flex items-center justify-center rounded-xl bg-gray-700/80 hover:bg-gray-600 active:bg-gray-800 border border-gray-500/50 backdrop-blur-sm transition-all shadow-lg"
        aria-label="Instellingen"
      >
        <Settings className="w-5 h-5 text-white" />
      </button>

      <div className="flex-1 overflow-hidden">
        <Outlet
          context={{
            currentFloor,
            currentFloorId,
            handleFloorChange,
            selectedWasters,
            setSelectedWasters,
            handleAccept,
            houseData,
            handleResetDemo,
            allDevices,
            fetchDevices,
            assigningDevice,
            onRoomAssign: handleRoomSelectedForPlacement,
            problemRoomIds,
            isDeviceProblem,
            placingState,
            onSavePlacement: handleSavePlacement,
            onCancelPlacement: handleCancelPlacement,
          }}
        />
      </div>

      {showSettings && (
        <SettingsOverlay
          devices={allDevices}
          houseData={houseData}
          assigningDevice={assigningDevice}
          onStartAssign={device => setAssigningDevice(device)}
          onCancelAssign={() => setAssigningDevice(null)}
          onClose={() => { setShowSettings(false); setAssigningDevice(null); }}
          onDevicesChanged={fetchDevices}
          currentFloorId={currentFloorId}
          onFloorChange={setCurrentFloorId}
          onRoomAssign={handleRoomSelectedForPlacement}
        />
      )}
    </div>
  );
}
