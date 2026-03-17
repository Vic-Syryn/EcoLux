import { useState, useEffect } from 'react';
import { Outlet, useSearchParams } from 'react-router';
import { Home } from 'lucide-react';
import { mockHouseData } from '../data/mockData';

export function Layout() {
  const [searchParams, setSearchParams] = useSearchParams();
  const floorParam = searchParams.get('floor');
  const [currentFloorId, setCurrentFloorId] = useState(
    floorParam || mockHouseData[0].id
  );
  const [selectedWasters, setSelectedWasters] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (floorParam && floorParam !== currentFloorId) {
      setCurrentFloorId(floorParam);
    }
  }, [floorParam]);

  const handleFloorChange = (floorId: string) => {
    setCurrentFloorId(floorId);
    setSearchParams({ floor: floorId });
  };

  const currentFloor = mockHouseData.find(f => f.id === currentFloorId);

  const handleAccept = () => {
    console.log('Accepted selections:', Array.from(selectedWasters));
    // Reset selections after accepting
    setSelectedWasters(new Set());
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <header className="border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center">
              <Home className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-lg font-medium text-slate-900">
              Energy Monitor
            </h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <Outlet context={{ 
          currentFloor, 
          currentFloorId,
          handleFloorChange,
          selectedWasters,
          setSelectedWasters,
          handleAccept
        }} />
      </main>
    </div>
  );
}
