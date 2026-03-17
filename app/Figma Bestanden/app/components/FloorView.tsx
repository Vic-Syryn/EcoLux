import { useNavigate, useOutletContext } from 'react-router';
import { motion } from 'motion/react';
import { Floor } from '../data/mockData';
import { Zap, ChevronUp, ChevronDown, Check } from 'lucide-react';
import { mockHouseData } from '../data/mockData';

interface FloorViewProps {
  floor: Floor;
}

interface ContextType {
  currentFloor: Floor | undefined;
  currentFloorId: string;
  handleFloorChange: (floorId: string) => void;
  selectedWasters: Set<string>;
  setSelectedWasters: (wasters: Set<string>) => void;
  handleAccept: () => void;
}

export function FloorView({ floor }: FloorViewProps) {
  const navigate = useNavigate();
  const { currentFloorId, handleFloorChange, selectedWasters, handleAccept } = useOutletContext<ContextType>();

  const handleRoomClick = (roomId: string) => {
    navigate(`/room/${floor.id}/${roomId}`);
  };

  const currentIndex = mockHouseData.findIndex(f => f.id === currentFloorId);
  const currentFloor = mockHouseData[currentIndex];

  const handleUp = () => {
    if (currentIndex > 0) {
      handleFloorChange(mockHouseData[currentIndex - 1].id);
    }
  };

  const handleDown = () => {
    if (currentIndex < mockHouseData.length - 1) {
      handleFloorChange(mockHouseData[currentIndex + 1].id);
    }
  };

  return (
    <div className="w-full h-full flex items-center justify-center p-8 bg-white">
      <div className="flex items-center gap-8">
        {/* Floor Plan and Accept Button */}
        <div className="flex flex-col items-center gap-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="relative"
          >
            {/* Blueprint Grid Background */}
            <svg
              width="400"
              height="280"
              className="absolute inset-0 pointer-events-none opacity-20"
              style={{ zIndex: 0 }}
            >
              <defs>
                <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                  <path
                    d="M 20 0 L 0 0 0 20"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="0.5"
                    className="text-slate-300"
                  />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />
            </svg>

            {/* Floor Plan Container */}
            <svg width="400" height="280" className="relative" style={{ zIndex: 1 }}>
              {/* Outer boundary */}
              <rect
                x="10"
                y="10"
                width="380"
                height="260"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                className="text-slate-400"
              />

              {/* Rooms */}
              {floor.rooms.map((room) => (
                <g key={room.id}>
                  {/* Room rectangle */}
                  <motion.rect
                    x={room.x}
                    y={room.y}
                    width={room.width}
                    height={room.height}
                    fill="rgb(241, 245, 249)"
                    stroke="rgb(148, 163, 184)"
                    strokeWidth="2"
                    className="cursor-pointer"
                    whileHover={{
                      fill: 'rgb(203, 213, 225)',
                    }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleRoomClick(room.id)}
                  />

                  {/* Room label */}
                  <text
                    x={room.x + room.width / 2}
                    y={room.y + room.height / 2 - 10}
                    textAnchor="middle"
                    className="fill-slate-700 text-sm font-medium pointer-events-none select-none"
                    style={{ fontSize: '14px' }}
                  >
                    {room.name}
                  </text>

                  {/* Energy wasters count badge */}
                  {room.energyWasters.length > 0 && (
                    <g>
                      <circle
                        cx={room.x + room.width / 2}
                        cy={room.y + room.height / 2 + 15}
                        r="16"
                        className="fill-slate-900"
                      />
                      <text
                        x={room.x + room.width / 2}
                        y={room.y + room.height / 2 + 20}
                        textAnchor="middle"
                        className="fill-white text-xs font-bold pointer-events-none select-none"
                        style={{ fontSize: '12px' }}
                      >
                        {room.energyWasters.length}
                      </text>
                    </g>
                  )}
                </g>
              ))}
            </svg>

            {/* Legend */}
            <div className="mt-6 flex items-center justify-center gap-2 text-sm text-slate-600">
              <Zap className="w-4 h-4" />
              <span>Tap rooms to view energy wasters</span>
            </div>
          </motion.div>

          {/* Accept Button */}
          {selectedWasters.size > 0 && (
            <motion.button
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              onClick={handleAccept}
              className="flex items-center gap-2 px-8 py-3 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-medium transition-colors"
            >
              <Check className="w-5 h-5" />
              <span>Accept ({selectedWasters.size})</span>
            </motion.button>
          )}
        </div>

        {/* Floor Navigation */}
        <div className="flex flex-col gap-2">
          {mockHouseData.map((floorItem, index) => (
            <button
              key={floorItem.id}
              onClick={() => handleFloorChange(floorItem.id)}
              className={`w-12 h-12 rounded-lg border transition-colors ${
                floorItem.id === currentFloorId
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              {mockHouseData.length - index}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}