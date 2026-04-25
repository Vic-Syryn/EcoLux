import { Outlet } from 'react-router';
import { mockHouseData, Floor } from '../data/mockData';
import { useState } from 'react';
import { DevicePanel } from './DevicePanel';

export function Layout() {
  const [currentFloorId, setCurrentFloorId] = useState(mockHouseData[0].id);
  const [selectedWasters, setSelectedWasters] = useState<Set<string>>(new Set());
  const [houseData, setHouseData] = useState<Floor[]>(mockHouseData);

  const currentFloor = houseData.find(f => f.id === currentFloorId);

  const handleFloorChange = (floorId: string) => setCurrentFloorId(floorId);

  const handleAccept = () => {
    const updatedHouseData = houseData.map(floor => ({
      ...floor,
      rooms: floor.rooms.map(room => ({
        ...room,
        energyWasters: [],
      })),
    }));
    setHouseData(updatedHouseData);
    setSelectedWasters(new Set());
  };

  const handleResetDemo = () => {
    setHouseData(mockHouseData);
    setSelectedWasters(new Set());
    setCurrentFloorId(mockHouseData[0].id);
  };

  return (
    <div className="h-screen w-screen flex overflow-hidden bg-slate-50 select-none">
      {/* Main content */}
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
          }}
        />
      </div>

      {/* Device panel sidebar */}
      <div className="w-64 flex-shrink-0 bg-white border-l border-slate-200 overflow-y-auto">
        <DevicePanel />
      </div>
    </div>
  );
}