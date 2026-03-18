import { useNavigate, useOutletContext } from 'react-router';
import { motion } from 'motion/react';
import { Floor } from '../data/mockData';
import { Zap, ChevronUp, ChevronDown, Check } from 'lucide-react';
import { mockHouseData } from '../data/mockData';
import { useState } from 'react';

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
  houseData: Floor[];
}

export function FloorView({ floor }: FloorViewProps) {
  const navigate = useNavigate();
  const { currentFloorId, handleFloorChange, selectedWasters, handleAccept, houseData } = useOutletContext<ContextType>();
  const [showConfirmation, setShowConfirmation] = useState(false);

  // Safety check for houseData
  if (!houseData || houseData.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-slate-600">
        Loading...
      </div>
    );
  }

  const handleRoomClick = (roomId: string) => {
    navigate(`/room/${floor.id}/${roomId}`);
  };

  const currentIndex = houseData.findIndex(f => f.id === currentFloorId);
  const currentFloor = houseData[currentIndex];

  const handleUp = () => {
    if (currentIndex > 0) {
      handleFloorChange(houseData[currentIndex - 1].id);
    }
  };

  const handleDown = () => {
    if (currentIndex < houseData.length - 1) {
      handleFloorChange(houseData[currentIndex + 1].id);
    }
  };

  const handleAcceptClick = () => {
    setShowConfirmation(true);
  };

  const handleConfirmAccept = () => {
    handleAccept();
    setShowConfirmation(false);
  };

  const handleCancelAccept = () => {
    setShowConfirmation(false);
  };

  return (
    <div className="w-full h-full flex items-center justify-center p-1 md:p-8 bg-white overflow-hidden">
      <div className="flex flex-col md:flex-row items-center gap-1 md:gap-8 w-full h-full max-w-md md:max-w-none">
        {/* Floor Plan and Accept Button */}
        <div className="flex flex-col items-center gap-1 md:gap-6 w-full h-full justify-between">
          {/* Floor Navigation - Mobile Top */}
          <div className="flex md:hidden gap-1 justify-center flex-shrink-0">
            {houseData.map((floorItem, index) => (
              <button
                key={floorItem.id}
                onClick={() => handleFloorChange(floorItem.id)}
                className={`w-7 h-7 text-xs rounded-lg border transition-colors ${
                  floorItem.id === currentFloorId
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                {houseData.length - index}
              </button>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="relative w-full flex-1 flex flex-col items-center justify-center max-w-sm md:max-w-none"
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
            <div className="mt-2 md:mt-6 flex items-center justify-center gap-2 text-xs md:text-sm text-slate-600">
              {/* Removed legend text */}
            </div>
          </motion.div>

          {/* Accept Button */}
          {selectedWasters.size > 0 && (
            <motion.button
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              onClick={handleAcceptClick}
              className="flex items-center gap-1.5 px-4 py-1.5 md:px-8 md:py-3 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs md:text-base font-medium transition-colors flex-shrink-0"
            >
              <Check className="w-3.5 h-3.5 md:w-5 md:h-5" />
              <span>Accept ({selectedWasters.size})</span>
            </motion.button>
          )}
        </div>

        {/* Floor Navigation */}
        <div className="hidden md:flex flex-col gap-2">
          {houseData.map((floorItem, index) => (
            <button
              key={floorItem.id}
              onClick={() => handleFloorChange(floorItem.id)}
              className={`w-12 h-12 rounded-lg border transition-colors ${
                floorItem.id === currentFloorId
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              {houseData.length - index}
            </button>
          ))}
        </div>
      </div>

      {/* Confirmation Dialog */}
      {showConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white p-6 md:p-8 rounded-lg shadow-xl max-w-md mx-4"
          >
            <h3 className="text-lg md:text-xl font-medium mb-2 text-slate-900">Confirm Acceptance</h3>
            <p className="text-sm md:text-base text-slate-600 mb-6">
              Are you sure you want to accept {selectedWasters.size} selected energy waster{selectedWasters.size !== 1 ? 's' : ''}?
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={handleCancelAccept}
                className="px-4 py-2 md:px-6 md:py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmAccept}
                className="px-4 py-2 md:px-6 md:py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg transition-colors font-medium"
              >
                Confirm
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}