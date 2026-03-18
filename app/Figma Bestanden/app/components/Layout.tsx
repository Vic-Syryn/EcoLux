import { Outlet } from 'react-router';
import { Home } from 'lucide-react';
import { mockHouseData, Floor } from '../data/mockData';
import { useState } from 'react';

export function Layout() {
  const [currentFloorId, setCurrentFloorId] = useState(mockHouseData[0].id);
  const [selectedWasters, setSelectedWasters] = useState<Set<string>>(new Set());
  const [houseData, setHouseData] = useState<Floor[]>(mockHouseData);
  
  const currentFloor = houseData.find(f => f.id === currentFloorId);

  const handleFloorChange = (floorId: string) => {
    setCurrentFloorId(floorId);
  };

  const handleAccept = () => {
    console.log('Accepted wasters:', Array.from(selectedWasters));
    
    // Remove ALL energy wasters from the data (not just selected ones)
    const updatedHouseData = houseData.map(floor => ({
      ...floor,
      rooms: floor.rooms.map(room => ({
        ...room,
        energyWasters: [] // Clear all energy wasters
      }))
    }));
    
    setHouseData(updatedHouseData);
    setSelectedWasters(new Set());
  };

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-white">
      {/* Main Content */}
      <main className="flex-1 overflow-hidden">
        <Outlet context={{ 
          currentFloor, 
          currentFloorId, 
          handleFloorChange, 
          selectedWasters, 
          setSelectedWasters,
          handleAccept,
          houseData
        }} />
      </main>
    </div>
  );
}