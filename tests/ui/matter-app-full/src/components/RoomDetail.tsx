import { useNavigate, useParams, useOutletContext } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, AlertTriangle, Zap, Flame, Wind, Lightbulb, Droplet, ChevronLeft, ChevronRight, Check, ChevronDown, Save, X } from 'lucide-react';
import { EnergyWaster } from '../data/mockData';
import { Device, turnOff } from '../api/devices';
import { useState, useRef } from 'react';
import { PlacingState } from './Layout';

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
  setSelectedWasters: (fn: (prev: Set<string>) => Set<string>) => void;
  handleAccept: () => void;
  houseData: any[];
  handleResetDemo: () => void;
  allDevices: Device[];
  fetchDevices: () => Promise<void>;
  assigningDevice: Device | null;
  onRoomAssign: (floorId: string, roomId: string) => void;
  problemRoomIds: Set<string>;
  isDeviceProblem: (device: Device) => boolean;
  placingState: PlacingState | null;
  onSavePlacement: (x: number, y: number) => Promise<void>;
  onCancelPlacement: () => void;
}

const SVG_X = 50, SVG_Y = 50, SVG_W = 700, SVG_H = 500;

function deviceToWaster(device: Device, isProblem: boolean) {
  return {
    id: `matter-${device.id}`,
    name: device.name,
    type: 'Smart apparaat',
    consumption: device.state ? 'Aan' : 'Uit',
    impact: 'medium' as const,
    x: device.placement?.x ?? 50,
    y: device.placement?.y ?? 50,
    isProblem,
    isMatterDevice: true as const,
    deviceId: device.id,
  };
}

export function RoomDetail() {
  const navigate = useNavigate();
  const { floorId, roomId } = useParams();
  const {
    selectedWasters, setSelectedWasters, houseData,
    allDevices, fetchDevices, handleAccept: originalHandleAccept,
    isDeviceProblem, placingState, onSavePlacement, onCancelPlacement,
  } = useOutletContext<ContextType>();

  const [hoveredWaster, setHoveredWaster] = useState<string | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [isDeviceListExpanded, setIsDeviceListExpanded] = useState(false);
  const [isTurningOff, setIsTurningOff] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  // pendingPos: where the user has clicked to place the device (before saving)
  const [pendingPos, setPendingPos] = useState<{ x: number; y: number } | null>(null);

  const svgRef = useRef<SVGSVGElement>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);

  if (!houseData || houseData.length === 0) {
    return <div className="flex items-center justify-center h-full text-white">Laden...</div>;
  }

  const floor = houseData.find((f: any) => f.id === floorId);
  const room = floor?.rooms.find((r: any) => r.id === roomId);

  // Is this the room where we're currently placing a device?
  const isPlacingInThisRoom =
    placingState?.floorId === floorId && placingState?.roomId === roomId;

  const roomsWithWasters = floor?.rooms.filter(
    (r: any) => r.energyWasters.length > 0 ||
    allDevices.some(d => d.placement?.room_id === r.id && d.placement?.floor_id === floorId)
  ) || [];
  const currentRoomIndex = roomsWithWasters.findIndex((r: any) => r.id === roomId);

  const roomDevices = allDevices.filter(
    d => d.placement?.room_id === roomId && d.placement?.floor_id === floorId
      // hide the device being placed from its old position while placing
      && !(isPlacingInThisRoom && d.id === placingState?.device.id)
  );

  const matterWasters = roomDevices.map(d => deviceToWaster(d, isDeviceProblem(d)));
  const allWasters = [...(room?.energyWasters ?? []), ...matterWasters];

  if (!floor || !room) {
    return <div className="flex items-center justify-center h-full text-white">Ruimte niet gevonden</div>;
  }

  const screenToSvgPercent = (clientX: number, clientY: number) => {
    const svg = svgRef.current;
    if (!svg) return null;
    const rect = svg.getBoundingClientRect();
    const vb = svg.viewBox.baseVal;
    const svgX = (clientX - rect.left) * (vb.width / rect.width);
    const svgY = (clientY - rect.top) * (vb.height / rect.height);
    return {
      x: Math.max(5, Math.min(95, ((svgX - SVG_X) / SVG_W) * 100)),
      y: Math.max(5, Math.min(95, ((svgY - SVG_Y) / SVG_H) * 100)),
    };
  };

  const handleSvgClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!isPlacingInThisRoom) return;
    const pos = screenToSvgPercent(e.clientX, e.clientY);
    if (pos) setPendingPos(pos);
  };

  const handleSvgTouch = (e: React.TouchEvent<SVGSVGElement>) => {
    if (!isPlacingInThisRoom) return;
    const t = e.changedTouches[0];
    const pos = screenToSvgPercent(t.clientX, t.clientY);
    if (pos) setPendingPos(pos);
  };

  const handleSave = async () => {
    if (!pendingPos) return;
    setIsSaving(true);
    try {
      await onSavePlacement(pendingPos.x, pendingPos.y);
      setPendingPos(null);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelPlace = () => {
    setPendingPos(null);
    onCancelPlacement();
  };

  const toggleWaster = (wasterId: string) => {
    if (isPlacingInThisRoom) return; // no selection while placing
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
      const n = new Set(prev);
      if (n.has(category)) n.delete(category); else n.add(category);
      return n;
    });
  };

  const toggleAllInCategory = (wasters: any[]) => {
    const allSelected = wasters.every(w => selectedWasters.has(w.id));
    setSelectedWasters(prev => {
      const n = new Set(prev);
      if (allSelected) wasters.forEach(w => n.delete(w.id));
      else wasters.forEach(w => n.add(w.id));
      return n;
    });
  };

  const handleAccept = async () => {
    setIsTurningOff(true);
    try {
      const selected = matterWasters.filter(w => selectedWasters.has(w.id));
      await Promise.all(selected.map(w => turnOff(w.deviceId)));
      await fetchDevices();
    } catch (e) {
      console.error('Failed to turn off devices:', e);
    } finally {
      setIsTurningOff(false);
    }
    originalHandleAccept();
  };

  const groupedWasters = allWasters.reduce((acc: any, w) => {
    if (!acc[w.type]) acc[w.type] = [];
    acc[w.type].push(w);
    return acc;
  }, {});

  // SVG coords for pending position
  const pendingSvgX = pendingPos ? SVG_X + (pendingPos.x / 100) * SVG_W : null;
  const pendingSvgY = pendingPos ? SVG_Y + (pendingPos.y / 100) * SVG_H : null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 1.1 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.4 }}
      className="h-full flex flex-col bg-[#212226]"
    >
      {/* ── Placing mode banner ── */}
      <AnimatePresence>
        {isPlacingInThisRoom && (
          <motion.div
            initial={{ y: -40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -40, opacity: 0 }}
            className="flex-shrink-0 bg-indigo-600/90 backdrop-blur-sm border-b border-indigo-400/50 px-4 py-2.5 flex items-center justify-between z-10"
          >
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
              <span className="text-white text-sm font-medium">
                Tik op de plattegrond om <strong>{placingState?.device.name}</strong> te plaatsen
              </span>
            </div>
            <button onClick={handleCancelPlace}
              className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 active:bg-white/30 transition-colors">
              <X className="w-4 h-4 text-white" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 md:px-8 md:py-4 border-b border-gray-500/50 flex-shrink-0 backdrop-blur-sm">
        <div className="flex items-center gap-2 md:gap-4">
          <button onClick={handleBack}
            className="flex items-center gap-1 md:gap-2 p-2 md:px-4 md:py-2.5 rounded-xl hover:bg-gray-600/50 text-white transition-all border border-gray-500/30">
            <ArrowLeft className="w-4 h-4 md:w-5 md:h-5" />
            <span className="hidden md:inline font-medium">Terug</span>
          </button>
          <div>
            <h2 className="text-sm md:text-2xl font-medium text-white">{room.name}</h2>
            <p className="text-xs md:text-base text-gray-300 hidden md:block">{floor.name}</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <button onClick={goToPreviousRoom} disabled={currentRoomIndex === 0}
            className="p-2 md:p-2.5 hover:bg-gray-600/50 rounded-xl disabled:opacity-30 transition-all border border-gray-400/30">
            <ChevronLeft className="w-4 h-4 md:w-5 md:h-5 text-white" />
          </button>
          <span className="text-xs md:text-base text-white font-medium min-w-[60px] md:min-w-[100px] text-center">
            {currentRoomIndex + 1}/{roomsWithWasters.length}
          </span>
          <button onClick={goToNextRoom} disabled={currentRoomIndex === roomsWithWasters.length - 1}
            className="p-2 md:p-2.5 hover:bg-gray-600/50 rounded-xl disabled:opacity-30 transition-all border border-gray-400/30">
            <ChevronRight className="w-4 h-4 md:w-5 md:h-5 text-white" />
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-hidden">
        <motion.div
          key={roomId}
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="h-full flex flex-col"
        >
          <div className="flex flex-col md:flex-row gap-2 md:gap-8 flex-1 overflow-hidden p-2 md:p-4">

            {/* Blueprint */}
            <div className={`flex-1 relative rounded-2xl border overflow-hidden min-h-0 shadow-2xl transition-all ${
              isPlacingInThisRoom
                ? 'border-indigo-400/60 bg-gradient-to-br from-[#3d4a5c] to-[#2d3a4a]'
                : 'border-gray-400/40 bg-[#212226]'
            }`}>
              <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-10">
                <defs>
                  <pattern id="room-grid" width="20" height="20" patternUnits="userSpaceOnUse">
                    <path d="M 20 0 L 0 0 0 20" fill="none" stroke="white" strokeWidth="0.5" />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#room-grid)" />
              </svg>

              <svg
                ref={svgRef}
                viewBox="0 0 800 600"
                className={`w-full h-full ${isPlacingInThisRoom ? 'cursor-crosshair' : ''}`}
                preserveAspectRatio="xMidYMid meet"
                onClick={handleSvgClick}
                onTouchEnd={handleSvgTouch}
              >
                <rect x={SVG_X} y={SVG_Y} width={SVG_W} height={SVG_H}
                  fill={isPlacingInThisRoom ? '#3d4a5c' : '#708491'} />
                <rect x={SVG_X} y={SVG_Y} width={SVG_W} height={SVG_H}
                  fill="none"
                  stroke={isPlacingInThisRoom ? 'rgb(129,140,248)' : 'white'}
                  strokeWidth="4"
                  strokeDasharray={isPlacingInThisRoom ? '10,5' : undefined}
                />
                <line x1="50" y1="270" x2="50" y2="330" stroke="#708491" strokeWidth="5" />
                <path d="M 50 270 Q 90 280 90 330" fill="none" stroke="white" strokeWidth="2" strokeDasharray="8,4" opacity="0.6" />

                {/* Hint text */}
                {isPlacingInThisRoom && (
                  <text x="400" y="570" textAnchor="middle" fill="rgb(165,180,252)" fontSize="14" opacity="0.8"
                    style={{ pointerEvents: 'none', userSelect: 'none' }}>
                    {pendingPos ? 'Positie geselecteerd — klik ergens anders om te wijzigen' : 'Tik op de gewenste locatie'}
                  </text>
                )}

                {/* Existing wasters */}
                {allWasters.map((waster, index) => {
                  const isSelected = selectedWasters.has(waster.id);
                  const isHovered = hoveredWaster === waster.id;
                  const Icon = typeIcons[waster.type] || Zap;
                  const x = SVG_X + (waster.x / 100) * SVG_W;
                  const y = SVG_Y + (waster.y / 100) * SVG_H;
                  const isMatter = (waster as any).isMatterDevice === true;
                  const isProblem = waster.isProblem;

                  return (
                    <motion.g
                      key={waster.id}
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: isPlacingInThisRoom ? 0.4 : 1 }}
                      transition={{ delay: 0.3 + index * 0.08 }}
                      style={{ cursor: isPlacingInThisRoom ? 'crosshair' : 'pointer' }}
                      onMouseEnter={() => !isPlacingInThisRoom && setHoveredWaster(waster.id)}
                      onMouseLeave={() => setHoveredWaster(null)}
                      onClick={e => { e.stopPropagation(); toggleWaster(waster.id); }}
                    >
                      <rect x={x - 35} y={y - 35} width="70" height="70" fill="white"
                        stroke={isSelected ? '#1f2937' : isProblem ? '#ef4444' : isMatter ? '#575757' : '#9ca3af'}
                        strokeWidth={isSelected ? '3' : '2.5'} rx="12"
                        style={{ filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.3))' }} />
                      {isMatter && (
                        <circle cx={x + 25} cy={y - 25} r="8" fill={isProblem ? '#ef4444' : '#575757'} />
                      )}
                      <g transform={`translate(${x}, ${y})`}>
                        <Icon x={-16} y={-16} width={32} height={32}
                          color={isProblem ? '#dc2626' : isMatter ? '#575757' : '#374151'} />
                      </g>
                      {isSelected && (
                        <g>
                          <circle cx={x + 25} cy={y - 25} r="12" fill="#1f2937" />
                          <path d={`M ${x + 20} ${y - 25} L ${x + 23} ${y - 22} L ${x + 30} ${y - 28}`}
                            stroke="white" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                        </g>
                      )}
                      {isHovered && !isSelected && (
                        <motion.circle cx={x} cy={y} r="35" fill="none" stroke="#9ca3af" strokeWidth="2"
                          initial={{ opacity: 0.5, scale: 0.8 }}
                          animate={{ opacity: 0, scale: 1.2 }}
                          transition={{ duration: 1, repeat: Infinity }} />
                      )}
                      {isMatter && (
                        <text x={x} y={y + 50} textAnchor="middle" dominantBaseline="middle"
                          fill="white" fontSize="11" fontWeight="500"
                          style={{ pointerEvents: 'none', userSelect: 'none', filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.8))' }}>
                          {waster.name.length > 14 ? waster.name.slice(0, 13) + '…' : waster.name}
                        </text>
                      )}
                    </motion.g>
                  );
                })}

                {/* Pending placement preview */}
                {isPlacingInThisRoom && pendingSvgX != null && pendingSvgY != null && (
                  <motion.g
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    style={{ pointerEvents: 'none' }}
                  >
                    {/* Pulse ring */}
                    <motion.circle cx={pendingSvgX} cy={pendingSvgY} r="45"
                      fill="none" stroke="rgb(129,140,248)" strokeWidth="2"
                      animate={{ r: [40, 55], opacity: [0.6, 0] }}
                      transition={{ duration: 1.2, repeat: Infinity }} />
                    <rect x={pendingSvgX - 35} y={pendingSvgY - 35} width="70" height="70"
                      fill="white" stroke="rgb(99,102,241)" strokeWidth="3" rx="12"
                      style={{ filter: 'drop-shadow(0 4px 12px rgba(99,102,241,0.5))' }} />
                    <circle cx={pendingSvgX + 25} cy={pendingSvgY - 25} r="8" fill="rgb(99,102,241)" />
                    <Zap x={pendingSvgX - 16} y={pendingSvgY - 16} width={32} height={32} color="#6366f1" />
                    <text x={pendingSvgX} y={pendingSvgY + 50} textAnchor="middle" dominantBaseline="middle"
                      fill="white" fontSize="11" fontWeight="500"
                      style={{ userSelect: 'none', filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.8))' }}>
                      {placingState?.device.name}
                    </text>
                  </motion.g>
                )}

                {/* Crosshair hint when no position selected yet */}
                {isPlacingInThisRoom && !pendingPos && (
                  <g style={{ pointerEvents: 'none' }} opacity="0.3">
                    <line x1="385" y1="290" x2="415" y2="290" stroke="rgb(165,180,252)" strokeWidth="2" />
                    <line x1="400" y1="275" x2="400" y2="305" stroke="rgb(165,180,252)" strokeWidth="2" />
                    <circle cx="400" cy="290" r="15" fill="none" stroke="rgb(165,180,252)" strokeWidth="2" />
                  </g>
                )}
              </svg>

              {/* Legend */}
              {matterWasters.length > 0 && !isPlacingInThisRoom && (
                <div className="absolute bottom-3 left-3 flex items-center gap-3 bg-black/40 backdrop-blur-sm px-3 py-1.5 rounded-full pointer-events-none">
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-[#575757]" />
                    <span className="text-white text-xs">staat aan</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-500" />
                    <span className="text-white text-xs">Probleem</span>
                  </div>
                </div>
              )}
            </div>

            {/* Device list panel — hidden while placing */}
            {!isPlacingInThisRoom && (
              <motion.div
                initial={false}
                animate={{ width: isDeviceListExpanded ? 'auto' : '48px' }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
                className="flex-shrink-0 overflow-hidden border border-gray-400/40 rounded-2xl bg-gradient-to-br from-[#4B5563] to-[#374151] shadow-2xl"
              >
                <div className="flex flex-row h-full">
                  <button
                    onClick={() => setIsDeviceListExpanded(!isDeviceListExpanded)}
                    className="flex-shrink-0 w-12 flex items-center justify-center p-3 hover:bg-gray-600/50 transition-all border-r border-gray-500/40 h-full"
                  >
                    <motion.div animate={{ rotate: isDeviceListExpanded ? -90 : 90 }} transition={{ duration: 0.2 }}>
                      <ChevronDown className="w-5 h-5 text-white" />
                    </motion.div>
                  </button>

                  <AnimatePresence>
                    {isDeviceListExpanded && (
                      <motion.div
                        initial={{ width: 0, opacity: 0 }}
                        animate={{ width: '256px', opacity: 1 }}
                        exit={{ width: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-y-auto overflow-x-hidden"
                      >
                        <div className="p-2 space-y-2 w-64">
                          {Object.entries(groupedWasters).map(([category, wasters]: [string, any], categoryIndex) => {
                            const Icon = typeIcons[category] || Zap;
                            const isExp = expandedCategories.has(category);
                            const isMatterCat = category === 'Staat aan';
                            const selectedCount = wasters.filter((w: any) => selectedWasters.has(w.id)).length;
                            const allSel = wasters.every((w: any) => selectedWasters.has(w.id));

                            return (
                              <div key={category} className={`border rounded-xl overflow-hidden shadow-lg ${
                                isMatterCat
                                  ? 'border-[#575757]/40 bg-gradient-to-br from-[#575757]/20 to-[#575757]/10'
                                  : 'border-gray-500/40 bg-gradient-to-br from-[#374151] to-[#2d3748]'
                              }`}>
                                <motion.div
                                  initial={{ x: 20, opacity: 0 }}
                                  animate={{ x: 0, opacity: 1 }}
                                  transition={{ delay: 0.1 + categoryIndex * 0.05 }}
                                  className="flex items-center"
                                >
                                  <button onClick={() => toggleAllInCategory(wasters)}
                                    className="flex-shrink-0 p-3 hover:bg-gray-700 transition-colors">
                                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all ${
                                      allSel ? 'border-white bg-white' : 'border-gray-400 bg-transparent'
                                    }`}>
                                      {allSel && <Check className="w-2.5 h-2.5 text-gray-900" />}
                                    </div>
                                  </button>
                                  <button onClick={() => toggleCategory(category)}
                                    className="flex-1 flex items-center justify-between p-3 hover:bg-gray-700/50 transition-colors">
                                    <div className="flex items-center gap-2">
                                      <Icon className={`w-4 h-4 ${isMatterCat ? 'text-[#575757]' : 'text-white'}`} />
                                      <span className={`text-sm font-medium ${isMatterCat ? 'text-[#575757]' : 'text-white'}`}>{category}</span>
                                      <span className="text-xs text-gray-400">({selectedCount}/{wasters.length})</span>
                                    </div>
                                    <motion.div animate={{ rotate: isExp ? 180 : 0 }} transition={{ duration: 0.2 }}>
                                      <ChevronDown className="w-4 h-4 text-white" />
                                    </motion.div>
                                  </button>
                                </motion.div>

                                <AnimatePresence>
                                  {isExp && (
                                    <motion.div
                                      initial={{ height: 0, opacity: 0 }}
                                      animate={{ height: 'auto', opacity: 1 }}
                                      exit={{ height: 0, opacity: 0 }}
                                      transition={{ duration: 0.2 }}
                                      className="border-t border-gray-600"
                                    >
                                      <div className="p-2 space-y-1">
                                        {wasters.map((waster: any, idx: number) => {
                                          const isSel = selectedWasters.has(waster.id);
                                          const isMatter = waster.isMatterDevice === true;
                                          return (
                                            <motion.button key={waster.id}
                                              initial={{ x: 10, opacity: 0 }}
                                              animate={{ x: 0, opacity: 1 }}
                                              exit={{ x: 10, opacity: 0 }}
                                              transition={{ delay: idx * 0.05 }}
                                              onClick={() => toggleWaster(waster.id)}
                                              onMouseEnter={() => setHoveredWaster(waster.id)}
                                              onMouseLeave={() => setHoveredWaster(null)}
                                              className={`w-full text-left p-2.5 rounded-xl transition-all ${
                                                isSel ? 'bg-gray-700/60 shadow-inner' : 'hover:bg-gray-600/40'
                                              }`}>
                                              <div className="flex items-center gap-2">
                                                <div className={`flex-shrink-0 w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all ${
                                                  isSel ? 'border-white bg-white'
                                                  : waster.isProblem ? 'border-red-500 bg-transparent'
                                                  : isMatter ? 'border-[#575757] bg-transparent'
                                                  : 'border-gray-400 bg-transparent'
                                                }`}>
                                                  {isSel && <Check className="w-2.5 h-2.5 text-gray-900" />}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                  <span className={`text-sm transition-all block truncate ${
                                                    isSel ? 'text-gray-400 line-through'
                                                    : waster.isProblem ? 'text-red-400 font-medium'
                                                    : isMatter ? 'text-white font-medium'
                                                    : 'text-white'
                                                  }`}>{waster.name}</span>
                                                  {isMatter && (
                                                    <span className="text-[10px] text-gray-400">{waster.consumption}</span>
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
            )}
          </div>
        </motion.div>
      </div>

      {/* Accept button — only on FloorView */}
      {selectedWasters.size > 0 && (
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={() => setShowConfirmation(true)}
          className="fixed bottom-6 right-6 flex items-center gap-2 px-6 py-3 md:px-8 md:py-4 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 hover:from-slate-700 hover:to-slate-800 text-white text-sm md:text-lg font-semibold transition-all shadow-2xl z-40 border border-slate-600"
        >
          <Check className="w-5 h-5 md:w-6 md:h-6" />
          <span>Accepteren ({selectedWasters.size})</span>
        </motion.button>
      )}

      {/* Confirmation dialog */}
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
                onClick={() => setShowConfirmation(false)}
                className="px-6 py-3 md:px-8 md:py-3.5 bg-gray-700 hover:bg-gray-600 text-white rounded-xl transition-all font-semibold border border-gray-600"
              >
                Annuleren
              </button>
              <button
                disabled={isTurningOff}
                onClick={async () => {
                  setIsTurningOff(true);
                  try {
                    const matterIds = Array.from(selectedWasters)
                      .filter(id => id.startsWith('matter-'))
                      .map(id => parseInt(id.replace('matter-', '')));
                    await Promise.all(matterIds.map(id => turnOff(id)));
                    await fetchDevices();
                  } catch (e) {
                    console.error('Uitzetten mislukt:', e);
                  } finally {
                    setIsTurningOff(false);
                  }
                  handleAccept();
                  setShowConfirmation(false);
                }}
                className="px-6 py-3 md:px-8 md:py-3.5 bg-gradient-to-br from-slate-800 to-slate-900 hover:from-slate-700 hover:to-slate-800 text-white rounded-xl transition-all font-semibold border border-slate-600 shadow-lg disabled:opacity-60"
              >
                {isTurningOff ? 'Uitzetten...' : 'Bevestigen'}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* ── Save placement button ── */}
      <AnimatePresence>
        {isPlacingInThisRoom && pendingPos && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-3 z-40"
          >
            <button
              onClick={handleCancelPlace}
              className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-gray-700/90 hover:bg-gray-600 text-white text-sm font-medium border border-gray-500 shadow-xl transition-all active:scale-95"
            >
              <X className="w-4 h-4" />
              Annuleren
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold border border-indigo-400 shadow-xl transition-all active:scale-95 disabled:opacity-60"
            >
              <Save className="w-4 h-4" />
              {isSaving ? 'Opslaan...' : 'Opslaan'}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
