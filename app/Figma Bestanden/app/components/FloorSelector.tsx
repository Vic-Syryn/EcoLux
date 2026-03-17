import { ChevronUp, ChevronDown } from 'lucide-react';
import { Floor } from '../data/mockData';

interface FloorSelectorProps {
  floors: Floor[];
  currentFloorId: string;
  onFloorChange: (floorId: string) => void;
}

export function FloorSelector({ floors, currentFloorId, onFloorChange }: FloorSelectorProps) {
  const currentIndex = floors.findIndex(f => f.id === currentFloorId);
  const currentFloor = floors[currentIndex];

  const handleUp = () => {
    if (currentIndex > 0) {
      onFloorChange(floors[currentIndex - 1].id);
    }
  };

  const handleDown = () => {
    if (currentIndex < floors.length - 1) {
      onFloorChange(floors[currentIndex + 1].id);
    }
  };

  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-slate-600">
        {currentFloor?.name}
      </span>
      <div className="flex flex-col gap-0.5">
        <button
          onClick={handleUp}
          disabled={currentIndex === 0}
          className="p-1 hover:bg-slate-100 rounded disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          aria-label="Previous floor"
        >
          <ChevronUp className="w-4 h-4 text-slate-700" />
        </button>
        <button
          onClick={handleDown}
          disabled={currentIndex === floors.length - 1}
          className="p-1 hover:bg-slate-100 rounded disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          aria-label="Next floor"
        >
          <ChevronDown className="w-4 h-4 text-slate-700" />
        </button>
      </div>
    </div>
  );
}
