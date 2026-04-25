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
      <span className="text-base md:text-sm text-slate-600 font-medium">
        {currentFloor?.name}
      </span>
      <div className="flex flex-col gap-1">
        <button
          onClick={handleUp}
          disabled={currentIndex === 0}
          className="p-2 md:p-1 hover:bg-slate-100 rounded disabled:opacity-30 disabled:cursor-not-allowed transition-colors border border-slate-200"
          aria-label="Vorige verdieping"
        >
          <ChevronUp className="w-6 h-6 md:w-4 md:h-4 text-slate-700" />
        </button>
        <button
          onClick={handleDown}
          disabled={currentIndex === floors.length - 1}
          className="p-2 md:p-1 hover:bg-slate-100 rounded disabled:opacity-30 disabled:cursor-not-allowed transition-colors border border-slate-200"
          aria-label="Volgende verdieping"
        >
          <ChevronDown className="w-6 h-6 md:w-4 md:h-4 text-slate-700" />
        </button>
      </div>
    </div>
  );
}