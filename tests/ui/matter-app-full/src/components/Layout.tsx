import { Outlet } from 'react-router';
import { mockHouseData, Floor } from '../data/mockData';
import { useState, useEffect } from 'react';
import { Device, getDevices, setPlacement } from '../api/devices';
import { SettingsOverlay } from './SettingsOverlay';
import { Settings } from 'lucide-react';

export function Layout() {
  const [currentFloorId, setCurrentFloorId] = useState(mockHouseData[0].id);
  const [selectedWasters, setSelectedWasters] = useState<Set<string>>(new Set());
  const [houseData, setHouseData] = useState<Floor[]>(mockHouseData);
  const [allDevices, setAllDevices] = useState<Device[]>([]);
  const [showSettings, setShowSettings] = useState(false);
  const [assigningDevice, setAssigningDevice] = useState<Device | null>(null);

  const currentFloor = houseData.find(f => f.id === currentFloorId);

  const fetchDevices = async () => {
    try {
      const data = await getDevices();
      setAllDevices(data);
    } catch {
      // silently fail
    }
  };

  useEffect(() => {
    fetchDevices();
    const interval = setInterval(fetchDevices, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleFloorChange = (floorId: string) => setCurrentFloorId(floorId);

  const handleAccept = () => {
    const updatedHouseData = houseData.map(floor => ({
      ...floor,
      rooms: floor.rooms.map(room => ({ ...room, energyWasters: [] })),
    }));
    setHouseData(updatedHouseData);
    setSelectedWasters(new Set());
  };

  const handleResetDemo = () => {
    setHouseData(mockHouseData);
    setSelectedWasters(new Set());
    setCurrentFloorId(mockHouseData[0].id);
  };

  const handleRoomAssign = async (floorId: string, roomId: string) => {
    if (!assigningDevice) return;
    await setPlacement(assigningDevice.id, floorId, roomId, 50, 50);
    await fetchDevices();
    setAssigningDevice(null);
    setShowSettings(false);
  };

  return (
    <div className="h-screen w-screen flex overflow-hidden bg-[#6B7280] select-none relative">

      {/* ── Gear button fixed top-right ── */}
      <button
        onClick={() => { setAssigningDevice(null); setShowSettings(true); }}
        className="fixed top-3 right-3 z-30 w-11 h-11 flex items-center justify-center rounded-xl bg-gray-700/80 hover:bg-gray-600 active:bg-gray-800 border border-gray-500/50 backdrop-blur-sm transition-all shadow-lg"
        aria-label="Instellingen"
      >
        <Settings className="w-5 h-5 text-white" />
      </button>

      {/* ── Main content ── */}
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
            onRoomAssign: handleRoomAssign,
          }}
        />
      </div>

      {/* ── Settings overlay ── */}
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
          onRoomAssign={handleRoomAssign}
        />
      )}
    </div>
  );
}
