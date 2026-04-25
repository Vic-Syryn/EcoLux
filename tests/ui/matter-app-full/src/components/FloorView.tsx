import { useNavigate, useOutletContext } from 'react-router';
import { motion } from 'motion/react';
import { Floor } from '../data/mockData';
import { Zap, ChevronUp, ChevronDown, Check, RotateCcw } from 'lucide-react';
import { mockHouseData } from '../data/mockData';
import { useState, useEffect, useRef } from 'react';

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
  handleResetDemo: () => void;
}

export function FloorView({ floor }: FloorViewProps) {
  const navigate = useNavigate();
  const { currentFloorId, handleFloorChange, selectedWasters, handleAccept, houseData, handleResetDemo } = useOutletContext<ContextType>();
  const [showConfirmation, setShowConfirmation] = useState(false);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const touchStartY = useRef<number>(0);
  const touchEndY = useRef<number>(0);

  // Safety check for houseData
  if (!houseData || houseData.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-slate-600">
        Laden...
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

  // Scroll handler for changing floors
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      // Prevent default scrolling
      e.preventDefault();

      // Clear any existing timeout
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }

      // Set a timeout to debounce the scroll action
      scrollTimeoutRef.current = setTimeout(() => {
        if (e.deltaY > 0) {
          // Scrolling down - go to next floor (lower)
          handleDown();
        } else if (e.deltaY < 0) {
          // Scrolling up - go to previous floor (higher)
          handleUp();
        }
      }, 50); // 50ms debounce
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener('wheel', handleWheel, { passive: false });
    }

    return () => {
      if (container) {
        container.removeEventListener('wheel', handleWheel);
      }
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, [currentIndex, houseData]);

  // Touch handler for changing floors
  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      touchStartY.current = e.touches[0].clientY;
    };

    const handleTouchEnd = (e: TouchEvent) => {
      touchEndY.current = e.changedTouches[0].clientY;
      const deltaY = touchStartY.current - touchEndY.current;

      if (deltaY > 50) {
        // Swiping down - go to next floor (lower)
        handleDown();
      } else if (deltaY < -50) {
        // Swiping up - go to previous floor (higher)
        handleUp();
      }
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener('touchstart', handleTouchStart, { passive: false });
      container.addEventListener('touchend', handleTouchEnd, { passive: false });
    }

    return () => {
      if (container) {
        container.removeEventListener('touchstart', handleTouchStart);
        container.removeEventListener('touchend', handleTouchEnd);
      }
    };
  }, [currentIndex, houseData]);

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

  // Check if all energy wasters have been removed
  const totalEnergyWasters = houseData.reduce((total, floor) => {
    return total + floor.rooms.reduce((roomTotal, room) => {
      return roomTotal + room.energyWasters.length;
    }, 0);
  }, 0);

  // Door opening visualization data
  const doorLines: Record<string, Array<{x1: number, y1: number, x2: number, y2: number}>> = {
    bureau: [
      { x1: 105.7, y1: 301.8, x2: 121.8, y2: 331.7 },
    ],
    Living: [
      { x1: 219, y1: 285.1, x2: 219 + 16.1, y2: 285.1 + 29.9 },
    ],
    keuken: [
      { x1: 243.1, y1: 181.4, x2: 243.1 + 29.6, y2: 181.41 + 16.7 },
    ],
    Garage: [
      { x1: 325.1, y1: 155.8 + 29.9, x2: 325.1 + 16.1, y2:155.8 },
    ],
  };

  return (
    <div
      ref={containerRef}
      className="w-full h-full flex items-center justify-center p-1 md:p-8 bg-[#6B7280] overflow-hidden relative"
    >
      <div className="flex flex-col md:flex-row items-center gap-1 md:gap-8 w-full h-full max-w-md md:max-w-none">
        {/* Floor Plan and Accept Button */}
        <div className="flex flex-col items-center gap-1 md:gap-6 w-full h-full justify-between">
          {/* Floor Navigation - Mobile Top - 3D Stack */}
          <div className="flex md:hidden justify-center flex-shrink-0">
            <svg width="70" height="85" viewBox="0 0 100 120" className="overflow-visible">
              {[...houseData].reverse().map((floorItem, index) => {
                const isSelected = floorItem.id === currentFloorId;
                const reverseIndex = houseData.length - 1 - index;
                const yOffset = reverseIndex * 25;
                const hasProblemDevices = floorItem.rooms.some(room =>
                  room.energyWasters.some(w => w.isProblem)
                );

                return (
                  <g
                    key={floorItem.id}
                    onClick={() => handleFloorChange(floorItem.id)}
                    style={{ cursor: 'pointer' }}
                    className="transition-all"
                  >
                    {/* Simple isometric diamond layer */}
                    <path
                      d={`M 50,${10 + yOffset} L 80,${25 + yOffset} L 50,${40 + yOffset} L 20,${25 + yOffset} Z`}
                      fill={isSelected ? '#4B5563' : '#374151'}
                      stroke={hasProblemDevices && !isSelected ? '#ef4444' : '#D1D5DB'}
                      strokeWidth="2"
                      className="transition-all"
                    />
                  </g>
                );
              })}
            </svg>
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="relative w-full flex-1 flex flex-col items-center justify-center max-w-sm md:max-w-none"
          >
            {/* Blueprint Grid Background */}
          <svg
            width="500"
            height="380"
            viewBox="0 0 500 380"
            className="relative max-h-[280px] md:max-h-[600px]"
            style={{ zIndex: 1 }}
            preserveAspectRatio="xMidYMid meet"
          >
            {/* Blueprint grid background pattern */}
            <defs>
              <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="0.5"/>
              </pattern>
            </defs>
            <rect x="0" y="0" width="500" height="380" fill="url(#grid)" />
            
            {/* Outer boundary */}
              <rect
                x="0"
                y="0"
                width="480"
                height="360"
                fill="none"
                stroke="white"
                strokeWidth="3"
                rx="20"
                className=""
              />
            
              {/* Rooms */}
              {floor.rooms.map((room) => {
                const hasProblemDevices = room.energyWasters.some(w => w.isProblem);

                /*schrijf hieronder de ruimtes die niet kunnen worden aangeklikt*/
                const unclickableRooms = ['trap', 'keuken'];
                return (
                  <g key={room.id}>
                    {/* Room floor */}
                    <motion.rect
                      x={room.x}
                      y={room.y}
                      width={room.width}
                      height={room.height}
                      fill="#6B7280"
                      className="cursor-pointer"
                      whileHover={{
                        fill: "#4B5563",
                      }}
                      whileTap={{ scale: 0.98 }}
                      onClick={unclickableRooms.includes(room.id) ? undefined : () => handleRoomClick(room.id)}
                    />

                    {/* Simple white outline */}
                    <rect
                      x={room.x}
                      y={room.y}
                      width={room.width}
                      height={room.height}
                      fill="none"
                      stroke="white"
                      strokeWidth="3"
                      className="pointer-events-none"
                    />

                    {/* Stairs */}
                    {(room.id === 'trap' || room.id === '') && (
                      <g className="pointer-events-none" opacity="0.7">
                        {[...Array(Math.floor(room.height / 8))].map((_, i) => (
                          <line
                            key={i}
                            x1={room.x}
                            y1={room.y + 7 + i * 8}
                            x2={room.x + room.width}
                            y2={room.y + 7 + i * 8}
                            stroke="white"
                            strokeWidth="4"
                          />
                        ))}
                      </g>
                    )}

                    {/* Door opening visualization */}
                    {(doorLines[room.id] || []).map((line, i) => (
                      <line
                        key={i}
                        x1={line.x1}
                        y1={line.y1}
                        x2={line.x2}
                        y2={line.y2}
                        stroke="white"
                        strokeWidth="4"
                        opacity="0.6"
                        strokeLinecap="round"
                        className="pointer-events-none"
                      />
                    ))}
                    {/* Room label */}
                    <text
                      x={room.x + room.width / 2}
                      y={room.y + room.height / 2}
                      textAnchor="middle"
                      className={hasProblemDevices ? "fill-red-500 text-sm font-medium pointer-events-none select-none" : "fill-white text-sm font-medium pointer-events-none select-none"}
                      style={{ fontSize: '18px' }}
                    >
                      {room.name}
                    </text>
                  </g>
                );
              })}
            </svg>

            {/* Legend */}
            <div className="mt-2 md:mt-6 flex items-center justify-center gap-2 text-xs md:text-sm text-slate-600">
              {/* Removed legend text */}
            </div>
          </motion.div>
        </div>

        {/* Floor Navigation - 3D Stack */}
        <div className="hidden md:flex flex-col items-center">
          <svg width="100" height="120" viewBox="0 0 100 120" className="overflow-visible">
            {[...houseData].reverse().map((floorItem, index) => {
              const isSelected = floorItem.id === currentFloorId;
              const reverseIndex = houseData.length - 1 - index;
              const yOffset = reverseIndex * 25;
              const hasProblemDevices = floorItem.rooms.some(room =>
                room.energyWasters.some(w => w.isProblem)
              );

              return (
                <g
                  key={floorItem.id}
                  onClick={() => handleFloorChange(floorItem.id)}
                  style={{ cursor: 'pointer' }}
                  className="transition-all"
                >
                  {/* Simple isometric diamond layer */}
                  <path
                    d={`M 50,${10 + yOffset} L 80,${25 + yOffset} L 50,${40 + yOffset} L 20,${25 + yOffset} Z`}
                    fill={isSelected ? '#4B5563' : '#374151'}
                    stroke={hasProblemDevices && !isSelected ? '#ef4444' : '#D1D5DB'}
                    strokeWidth="2"
                    className="transition-all"
                  />
                </g>
              );
            })}
          </svg>
        </div>
      </div>

      {/* Fixed Accept Button - Bottom Right for all devices */}
      {selectedWasters.size > 0 && (
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={handleAcceptClick}
          className="fixed bottom-6 right-6 flex items-center gap-2 px-6 py-3 md:px-8 md:py-4 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 hover:from-slate-700 hover:to-slate-800 text-white text-sm md:text-lg font-semibold transition-all shadow-2xl hover:shadow-3xl z-40 border border-slate-600"
        >
          <Check className="w-5 h-5 md:w-6 md:h-6" />
          <span>Accepteren ({selectedWasters.size})</span>
        </motion.button>
      )}

      {/* Fixed Reset Demo Button - Bottom Right for all devices when all wasters are removed */}
      {totalEnergyWasters === 0 && (
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={handleResetDemo}
          className="fixed bottom-6 right-6 flex items-center gap-2 px-6 py-3 md:px-8 md:py-4 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white text-sm md:text-lg font-semibold transition-all shadow-2xl hover:shadow-3xl z-40 border border-blue-500"
        >
          <RotateCcw className="w-5 h-5 md:w-6 md:h-6" />
          <span>Demo opnieuw starten</span>
        </motion.button>
      )}

      {/* Confirmation Dialog */}
      {showConfirmation && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-gradient-to-br from-gray-800 to-gray-900 p-8 md:p-10 rounded-3xl shadow-2xl max-w-md mx-4 border border-gray-600/50"
          >
            <h3 className="text-xl md:text-2xl font-bold mb-3 text-white">Bevestig acceptatie</h3>
            <p className="text-sm md:text-base text-gray-300 mb-8 leading-relaxed">
              Weet u zeker dat u {selectedWasters.size} geselecteerde energieverspiller{selectedWasters.size !== 1 ? 's' : ''} wilt accepteren?
            </p>
            <div className="flex gap-4 justify-end">
              <button
                onClick={handleCancelAccept}
                className="px-6 py-3 md:px-8 md:py-3.5 bg-gray-700 hover:bg-gray-600 text-white rounded-xl transition-all font-semibold border border-gray-600 hover:border-gray-500"
              >
                Annuleren
              </button>
              <button
                onClick={handleConfirmAccept}
                className="px-6 py-3 md:px-8 md:py-3.5 bg-gradient-to-br from-slate-800 to-slate-900 hover:from-slate-700 hover:to-slate-800 text-white rounded-xl transition-all font-semibold border border-slate-600 shadow-lg"
              >
                Bevestigen
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}