import { useNavigate, useParams, useOutletContext } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, AlertTriangle, Zap, Flame, Wind, Lightbulb, Droplet, ChevronLeft, ChevronRight, Check, ChevronDown } from 'lucide-react';
import { mockHouseData, EnergyWaster } from '../data/mockData';
import { Device, turnOff } from '../api/devices';
import { useState } from 'react';

const typeIcons: Record<string, any> = {
  'Klimaatbeheersing': Wind,
  'Verlichting': Lightbulb,
  'Elektronica': Zap,
  'Isolatie': AlertTriangle,
  'Apparatuur': Flame,
  'Waterverwarming': Droplet,
  'Verwarming': Flame,
  'Ventilatie': Wind,
  'Utiliteit': Zap,
  'Smart apparaat': Zap,
};

interface ContextType {
  currentFloor: any;
  currentFloorId: string;
  handleFloorChange: (floorId: string) => void;
  selectedWasters: Set<string>;
  setSelectedWasters: (wasters: Set<string>) => void;
  handleAccept: () => void;
  houseData: any[];
  handleResetDemo: () => void;
  allDevices: Device[];
  fetchDevices: () => void;
  assigningDevice: Device | null;
  onRoomAssign: (floorId: string, roomId: string) => void;
}

// Convert a Matter device to an EnergyWaster-like object for unified rendering
function deviceToWaster(device: Device): EnergyWaster & { isMatterDevice: true; deviceId: number } {
  return {
    id: `matter-${device.id}`,
    name: device.name,
    type: 'Smart apparaat',
    consumption: device.state ? 'Aan' : 'Uit',
    impact: 'medium',
    x: device.placement?.x ?? 50,
    y: device.placement?.y ?? 50,
    isProblem: device.state === true, // on = potentially wasting energy
    isMatterDevice: true,
    deviceId: device.id,
  };
}

export function RoomDetail() {
  const navigate = useNavigate();
  const { floorId, roomId } = useParams();
  const { selectedWasters, setSelectedWasters, houseData, allDevices, fetchDevices, handleAccept: originalHandleAccept } =
    useOutletContext<ContextType>();

  const [hoveredWaster, setHoveredWaster] = useState<string | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [isDeviceListExpanded, setIsDeviceListExpanded] = useState(false);
  const [isTurningOff, setIsTurningOff] = useState(false);

  if (!houseData || houseData.length === 0) {
    return <div className="flex items-center justify-center h-full text-white">Laden...</div>;
  }

  const floor = houseData.find((f: any) => f.id === floorId);
  const room = floor?.rooms.find((r: any) => r.id === roomId);
  const roomsWithWasters = floor?.rooms.filter((r: any) => r.energyWasters.length > 0) || [];
  const currentRoomIndex = roomsWithWasters.findIndex((r: any) => r.id === roomId);

  // Matter devices placed in this room
  const roomDevices = allDevices.filter(
    d => d.placement?.room_id === roomId && d.placement?.floor_id === floorId
  );

  // Convert Matter devices to waster-like objects and merge with room wasters
  const matterWasters = roomDevices.map(deviceToWaster);
  const allWasters: (EnergyWaster | ReturnType<typeof deviceToWaster>)[] = [
    ...room?.energyWasters ?? [],
    ...matterWasters,
  ];

  if (!floor || !room) {
    return <div className="flex items-center justify-center h-full text-white">Ruimte niet gevonden</div>;
  }

  const toggleWaster = (wasterId: string) => {
    setSelectedWasters(prev => {
      const newSet = new Set(prev);
      if (newSet.has(wasterId)) newSet.delete(wasterId);
      else newSet.add(wasterId);
      return newSet;
    });
  };

  const handleBack = () => navigate(`/?floor=${floorId}`);

  const goToPreviousRoom = () => {
    if (currentRoomIndex > 0)
      navigate(`/room/${floorId}/${roomsWithWasters[currentRoomIndex - 1].id}`);
  };

  const goToNextRoom = () => {
    if (currentRoomIndex < roomsWithWasters.length - 1)
      navigate(`/room/${floorId}/${roomsWithWasters[currentRoomIndex + 1].id}`);
  };

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(category)) newSet.delete(category);
      else newSet.add(category);
      return newSet;
    });
  };

  const toggleAllInCategory = (category: string, wasters: EnergyWaster[]) => {
    const allSelected = wasters.every(w => selectedWasters.has(w.id));
    setSelectedWasters(prev => {
      const newSet = new Set(prev);
      if (allSelected) wasters.forEach(w => newSet.delete(w.id));
      else wasters.forEach(w => newSet.add(w.id));
      return newSet;
    });
  };

  // Handle accept: turn off selected Matter devices via API, then call original accept
  const handleAccept = async () => {
    setIsTurningOff(true);
    try {
      const selectedMatterDevices = matterWasters.filter(w => selectedWasters.has(w.id));
      await Promise.all(selectedMatterDevices.map(w => turnOff(w.deviceId)));
      await fetchDevices();
    } catch (e) {
      console.error('Failed to turn off devices:', e);
    } finally {
      setIsTurningOff(false);
    }
    originalHandleAccept();
  };

  // Group ALL wasters (energy + matter) by type
  const groupedWasters = allWasters.reduce((acc: any, waster) => {
    if (!acc[waster.type]) acc[waster.type] = [];
    acc[waster.type].push(waster);
    return acc;
  }, {} as Record<string, (EnergyWaster | ReturnType<typeof deviceToWaster>)[]>);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 1.1 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.4 }}
      className="h-full flex flex-col bg-gradient-to-br from-[#6B7280] to-[#5a6575] overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 md:px-8 md:py-4 border-b border-gray-500/50 flex-shrink-0 backdrop-blur-sm">
        <div className="flex items-center gap-2 md:gap-4">
          <button
            onClick={handleBack}
            className="flex items-center gap-1 md:gap-2 p-2 md:px-4 md:py-2.5 rounded-xl hover:bg-gray-600/50 text-white transition-all border border-gray-500/30"
          >
            <ArrowLeft className="w-4 h-4 md:w-5 md:h-5" />
            <span className="hidden md:inline font-medium">Terug</span>
          </button>
          <div>
            <h2 className="text-sm md:text-2xl font-medium text-white">{room.name}</h2>
            <p className="text-xs md:text-base text-gray-300 hidden md:block">{floor.name}</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={goToPreviousRoom}
            disabled={currentRoomIndex === 0}
            className="p-2 md:p-2.5 hover:bg-gray-600/50 rounded-xl disabled:opacity-30 transition-all border border-gray-400/30"
          >
            <ChevronLeft className="w-4 h-4 md:w-5 md:h-5 text-white" />
          </button>
          <span className="text-xs md:text-base text-white font-medium min-w-[60px] md:min-w-[100px] text-center">
            {currentRoomIndex + 1}/{roomsWithWasters.length}
          </span>
          <button
            onClick={goToNextRoom}
            disabled={currentRoomIndex === roomsWithWasters.length - 1}
            className="p-2 md:p-2.5 hover:bg-gray-600/50 rounded-xl disabled:opacity-30 transition-all border border-gray-400/30"
          >
            <ChevronRight className="w-4 h-4 md:w-5 md:h-5 text-white" />
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full">
          <motion.div
            key={roomId}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="h-full flex flex-col"
          >
            <div className="flex flex-col md:flex-row gap-2 md:gap-8 flex-1 overflow-hidden">

              {/* Blueprint */}
              <div className="flex-1 relative bg-gradient-to-br from-[#6B7280] to-[#5a6575] rounded-2xl border border-gray-400/40 overflow-hidden min-h-0 shadow-2xl">
                <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-10" style={{ zIndex: 0 }}>
                  <defs>
                    <pattern id="room-grid" width="20" height="20" patternUnits="userSpaceOnUse">
                      <path d="M 20 0 L 0 0 0 20" fill="none" stroke="white" strokeWidth="0.5" />
                    </pattern>
                  </defs>
                  <rect width="100%" height="100%" fill="url(#room-grid)" />
                </svg>

                <svg
                  viewBox="0 0 800 600"
                  className="w-full h-full"
                  preserveAspectRatio="xMidYMid meet"
                  style={{ zIndex: 1 }}
                >
                  {/* Room floor */}
                  <rect x="50" y="50" width="700" height="500" fill="#6B7280" />
                  <rect x="50" y="50" width="700" height="500" fill="none" stroke="white" strokeWidth="4" />

                  {/* Door */}
                  <line x1="50" y1="270" x2="50" y2="330" stroke="#6B7280" strokeWidth="5" />
                  <path d="M 50 270 Q 90 280 90 330" fill="none" stroke="white" strokeWidth="2" strokeDasharray="8,4" opacity="0.6" />

                  {/* All wasters (energy + matter) rendered uniformly */}
                  {allWasters.map((waster, index) => {
                    const isSelected = selectedWasters.has(waster.id);
                    const isHovered = hoveredWaster === waster.id;
                    const Icon = typeIcons[waster.type] || Zap;
                    const x = 50 + (waster.x / 100) * 700;
                    const y = 50 + (waster.y / 100) * 500;
                    const isMatter = (waster as any).isMatterDevice === true;
                    const isProblem = (waster as any).isProblem;

                    return (
                      <motion.g
                        key={waster.id}
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.3 + index * 0.1 }}
                        style={{ cursor: 'pointer' }}
                        onMouseEnter={() => setHoveredWaster(waster.id)}
                        onMouseLeave={() => setHoveredWaster(null)}
                        onClick={() => toggleWaster(waster.id)}
                      >
                        <rect
                          x={x - 35} y={y - 35} width="70" height="70"
                          fill="white"
                          stroke={isSelected ? '#1f2937' : isProblem ? '#ef4444' : isMatter ? '#f59e0b' : '#9ca3af'}
                          strokeWidth={isSelected ? '3' : '2.5'}
                          rx="12"
                          style={{ filter: 'drop-shadow(0 2px 8px rgba(0, 0, 0, 0.3))' }}
                        />
                        {/* Matter device indicator */}
                        {isMatter && (
                          <circle cx={x + 25} cy={y - 25} r="8" fill="rgb(245,158,11)" />
                        )}
                        <g transform={`translate(${x}, ${y})`}>
                          <Icon x={-16} y={-16} width={32} height={32}
                            className={isProblem ? 'text-red-600' : isMatter ? 'text-amber-500' : 'text-gray-700'} />
                        </g>
                        {isSelected && (
                          <g>
                            <circle cx={x + 25} cy={y - 25} r="12" fill="currentColor" className="text-slate-900" />
                            <path
                              d={`M ${x + 20} ${y - 25} L ${x + 23} ${y - 22} L ${x + 30} ${y - 28}`}
                              stroke="white" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"
                            />
                          </g>
                        )}
                        {isHovered && !isSelected && (
                          <motion.circle
                            cx={x} cy={y} r="35"
                            fill="none" stroke="currentColor" strokeWidth="2" className="text-slate-400"
                            initial={{ opacity: 0.5, scale: 0.8 }}
                            animate={{ opacity: 0, scale: 1.2 }}
                            transition={{ duration: 1, repeat: Infinity }}
                          />
                        )}
                        {/* Device name label */}
                        {isMatter && (
                          <text
                            x={x} y={y + 48}
                            textAnchor="middle" dominantBaseline="middle"
                            fill="white" fontSize="11" fontWeight="500"
                            style={{ pointerEvents: 'none', userSelect: 'none', filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.8))' }}
                          >
                            {waster.name.length > 14 ? waster.name.slice(0, 13) + '…' : waster.name}
                          </text>
                        )}
                      </motion.g>
                    );
                  })}
                </svg>

                {/* Legend */}
                {matterWasters.length > 0 && (
                  <div className="absolute bottom-3 left-3 flex items-center gap-2 bg-black/40 backdrop-blur-sm px-3 py-1.5 rounded-full pointer-events-none">
                    <div className="w-3 h-3 rounded-full bg-amber-400" />
                    <span className="text-white text-xs">Smart apparaat</span>
                  </div>
                )}
              </div>

              {/* Device list panel */}
              <motion.div
                initial={false}
                animate={{ width: isDeviceListExpanded ? 'auto' : '48px' }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
                className="flex-shrink-0 overflow-hidden border border-gray-400/40 rounded-2xl bg-gradient-to-br from-[#4B5563] to-[#374151] h-full md:h-auto shadow-2xl"
              >
                <div className="flex flex-row md:flex-row h-full">
                  <button
                    onClick={() => setIsDeviceListExpanded(!isDeviceListExpanded)}
                    className="flex-shrink-0 w-12 flex items-center justify-center p-2 md:p-3 hover:bg-gray-600/50 transition-all border-r border-gray-500/40 h-full backdrop-blur-sm"
                  >
                    <motion.div animate={{ rotate: isDeviceListExpanded ? -90 : 90 }} transition={{ duration: 0.2 }}>
                      <ChevronDown className="w-5 h-5 md:w-6 md:h-6 text-white" />
                    </motion.div>
                  </button>

                  <AnimatePresence>
                    {isDeviceListExpanded && (
                      <motion.div
                        initial={{ width: 0, opacity: 0 }}
                        animate={{ width: '256px', opacity: 1 }}
                        exit={{ width: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-y-auto overflow-x-hidden h-full md:max-h-[500px]"
                      >
                        <div className="p-2 space-y-1.5 md:space-y-2 w-64">
                          {Object.entries(groupedWasters).map(([category, wasters], categoryIndex) => {
                            const Icon = typeIcons[category] || Zap;
                            const isExpanded = expandedCategories.has(category);
                            const isMatterCategory = category === 'Smart apparaat';
                            const categorySelectedCount = (wasters as any[]).filter(w => selectedWasters.has(w.id)).length;
                            const allCategorySelected = (wasters as any[]).every(w => selectedWasters.has(w.id));

                            return (
                              <div key={category} className={`border rounded-xl overflow-hidden shadow-lg ${
                                isMatterCategory
                                  ? 'border-amber-500/40 bg-gradient-to-br from-amber-900/30 to-amber-800/20'
                                  : 'border-gray-500/40 bg-gradient-to-br from-[#374151] to-[#2d3748]'
                              }`}>
                                <motion.div
                                  initial={{ x: 20, opacity: 0 }}
                                  animate={{ x: 0, opacity: 1 }}
                                  transition={{ delay: 0.1 + categoryIndex * 0.05 }}
                                  className="flex items-center"
                                >
                                  <button
                                    onClick={e => { e.stopPropagation(); toggleAllInCategory(category, wasters as EnergyWaster[]); }}
                                    className="flex-shrink-0 p-2 md:p-3 hover:bg-gray-700 transition-colors"
                                  >
                                    <div className={`w-3.5 h-3.5 md:w-4 md:h-4 rounded-full border-2 flex items-center justify-center transition-all ${
                                      allCategorySelected ? 'border-white bg-white' : 'border-gray-400 bg-transparent'
                                    }`}>
                                      {allCategorySelected && <Check className="w-2 h-2 md:w-2.5 md:h-2.5 text-gray-900" />}
                                    </div>
                                  </button>
                                  <button
                                    onClick={() => toggleCategory(category)}
                                    className="flex-1 flex items-center justify-between p-2 md:p-3 hover:bg-gray-700/50 transition-colors"
                                  >
                                    <div className="flex items-center gap-2">
                                      <Icon className={`w-3.5 h-3.5 md:w-4 md:h-4 ${isMatterCategory ? 'text-amber-400' : 'text-white'}`} />
                                      <span className={`text-xs md:text-sm font-medium ${isMatterCategory ? 'text-amber-300' : 'text-white'}`}>{category}</span>
                                      <span className="text-xs text-gray-400">({categorySelectedCount}/{(wasters as any[]).length})</span>
                                    </div>
                                    <motion.div animate={{ rotate: isExpanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
                                      <ChevronDown className="w-3.5 h-3.5 md:w-4 md:h-4 text-white" />
                                    </motion.div>
                                  </button>
                                </motion.div>

                                <AnimatePresence>
                                  {isExpanded && (
                                    <motion.div
                                      initial={{ height: 0, opacity: 0 }}
                                      animate={{ height: 'auto', opacity: 1 }}
                                      exit={{ height: 0, opacity: 0 }}
                                      transition={{ duration: 0.2 }}
                                      className="border-t border-gray-600"
                                    >
                                      <div className="p-1 md:p-2 space-y-1">
                                        {(wasters as any[]).map((waster, index) => {
                                          const isSelected = selectedWasters.has(waster.id);
                                          const isMatter = waster.isMatterDevice === true;
                                          return (
                                            <motion.button
                                              key={waster.id}
                                              initial={{ x: 10, opacity: 0 }}
                                              animate={{ x: 0, opacity: 1 }}
                                              exit={{ x: 10, opacity: 0 }}
                                              transition={{ delay: index * 0.05 }}
                                              onClick={() => toggleWaster(waster.id)}
                                              onMouseEnter={() => setHoveredWaster(waster.id)}
                                              onMouseLeave={() => setHoveredWaster(null)}
                                              className={`w-full text-left p-2.5 rounded-xl transition-all ${
                                                isSelected ? 'bg-gray-700/60 shadow-inner' : 'hover:bg-gray-600/40'
                                              }`}
                                            >
                                              <div className="flex items-center gap-2">
                                                <div className={`flex-shrink-0 w-3.5 h-3.5 md:w-4 md:h-4 rounded-full border-2 flex items-center justify-center transition-all ${
                                                  isSelected ? 'border-white bg-white' : waster.isProblem ? 'border-red-500 bg-transparent' : isMatter ? 'border-amber-400 bg-transparent' : 'border-gray-400 bg-transparent'
                                                }`}>
                                                  {isSelected && <Check className="w-2 h-2 md:w-2.5 md:h-2.5 text-gray-900" />}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                  <span className={`text-xs md:text-sm transition-all block truncate ${
                                                    isSelected ? 'text-gray-400 line-through' : waster.isProblem ? 'text-red-400 font-medium' : isMatter ? 'text-amber-300' : 'text-white'
                                                  }`}>
                                                    {waster.name}
                                                  </span>
                                                  {isMatter && (
                                                    <span className="text-[10px] text-gray-400">
                                                      {waster.consumption}
                                                    </span>
                                                  )}
                                                </div>
                                              </div>
                                            </motion.button>
                                          );
                                        })}
                                      </div>
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </div>
                            );
                          })}

                          {allWasters.length === 0 && (
                            <div className="text-center py-8 text-gray-400 text-sm">
                              Geen apparaten in deze ruimte
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Accept button — shown when items are selected */}
      <AnimatePresence>
        {selectedWasters.size > 0 && (
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            onClick={handleAccept}
            disabled={isTurningOff}
            className="fixed bottom-6 right-6 flex items-center gap-2 px-6 py-3 md:px-8 md:py-4 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 hover:from-slate-700 hover:to-slate-800 text-white text-sm md:text-lg font-semibold transition-all shadow-2xl z-40 border border-slate-600 disabled:opacity-60"
          >
            <Check className="w-5 h-5 md:w-6 md:h-6" />
            <span>
              {isTurningOff ? 'Uitzetten...' : `Accepteren (${selectedWasters.size})`}
            </span>
          </motion.button>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
