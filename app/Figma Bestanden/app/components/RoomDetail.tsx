import { useNavigate, useParams, useOutletContext } from 'react-router';
import { motion } from 'motion/react';
import { ArrowLeft, AlertTriangle, Zap, Flame, Wind, Lightbulb, Droplet, ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { mockHouseData, EnergyWaster } from '../data/mockData';
import * as React from 'react';

const typeIcons: Record<string, any> = {
  'Climate Control': Wind,
  'Lighting': Lightbulb,
  'Electronics': Zap,
  'Insulation': AlertTriangle,
  'Appliance': Flame,
  'Water Heating': Droplet,
  'Heating': Flame,
  'Ventilation': Wind,
  'Utility': Zap,
};

interface ContextType {
  currentFloor: any;
  currentFloorId: string;
  handleFloorChange: (floorId: string) => void;
  selectedWasters: Set<string>;
  setSelectedWasters: (wasters: Set<string>) => void;
  handleAccept: () => void;
}

export function RoomDetail() {
  const navigate = useNavigate();
  const { floorId, roomId } = useParams();
  const { selectedWasters, setSelectedWasters } = useOutletContext<ContextType>();
  const [hoveredWaster, setHoveredWaster] = React.useState<string | null>(null);

  const floor = mockHouseData.find(f => f.id === floorId);
  const room = floor?.rooms.find(r => r.id === roomId);

  // Get all rooms with energy wasters on this floor
  const roomsWithWasters = floor?.rooms.filter(r => r.energyWasters.length > 0) || [];
  const currentRoomIndex = roomsWithWasters.findIndex(r => r.id === roomId);

  if (!floor || !room) {
    return (
      <div className="flex items-center justify-center h-full text-slate-600">
        Room not found
      </div>
    );
  }

  const toggleWaster = (wasterId: string) => {
    setSelectedWasters(prev => {
      const newSet = new Set(prev);
      if (newSet.has(wasterId)) {
        newSet.delete(wasterId);
      } else {
        newSet.add(wasterId);
      }
      return newSet;
    });
  };

  const handleBack = () => {
    navigate(`/?floor=${floorId}`);
  };

  const goToPreviousRoom = () => {
    if (currentRoomIndex > 0) {
      const prevRoom = roomsWithWasters[currentRoomIndex - 1];
      navigate(`/room/${floorId}/${prevRoom.id}`);
    }
  };

  const goToNextRoom = () => {
    if (currentRoomIndex < roomsWithWasters.length - 1) {
      const nextRoom = roomsWithWasters[currentRoomIndex + 1];
      navigate(`/room/${floorId}/${nextRoom.id}`);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 1.1 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.4 }}
      className="h-full flex flex-col bg-white"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-slate-200">
        <div className="flex items-center gap-4">
          <button
            onClick={handleBack}
            className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-100 text-slate-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </button>
          <div>
            <h2 className="text-xl font-medium text-slate-900">{room.name}</h2>
            <p className="text-sm text-slate-500">{floor.name}</p>
          </div>
        </div>
      </div>

      {/* Room Blueprint and Devices */}
      <div className="flex-1 overflow-auto p-8">
        <div className="max-w-6xl mx-auto">
          <motion.div
            key={roomId}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="relative"
          >
            {/* Room Navigation Above Blueprint */}
            <div className="flex items-center justify-center gap-3 mb-6">
              <button
                onClick={goToPreviousRoom}
                disabled={currentRoomIndex === 0}
                className="p-2 hover:bg-slate-100 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-colors border border-slate-200"
                aria-label="Previous room"
              >
                <ChevronLeft className="w-5 h-5 text-slate-700" />
              </button>
              <span className="text-sm text-slate-600 min-w-[100px] text-center">
                Room {currentRoomIndex + 1} of {roomsWithWasters.length}
              </span>
              <button
                onClick={goToNextRoom}
                disabled={currentRoomIndex === roomsWithWasters.length - 1}
                className="p-2 hover:bg-slate-100 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-colors border border-slate-200"
                aria-label="Next room"
              >
                <ChevronRight className="w-5 h-5 text-slate-700" />
              </button>
            </div>

            <div className="flex gap-8">
              {/* Blueprint Container */}
              <div className="flex-1 relative bg-slate-50 rounded-xl border border-slate-200 p-12">
                {/* Grid Background */}
                <svg
                  className="absolute inset-0 w-full h-full pointer-events-none opacity-30"
                  style={{ zIndex: 0 }}
                >
                  <defs>
                    <pattern id="room-grid" width="20" height="20" patternUnits="userSpaceOnUse">
                      <path
                        d="M 20 0 L 0 0 0 20"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="0.5"
                        className="text-slate-300"
                      />
                    </pattern>
                  </defs>
                  <rect width="100%" height="100%" fill="url(#room-grid)" />
                </svg>

                {/* Room SVG Blueprint */}
                <svg
                  viewBox="0 0 600 400"
                  className="w-full h-auto relative"
                  style={{ minHeight: '400px', maxHeight: '500px', zIndex: 1 }}
                >
                  {/* Room Outline */}
                  <rect
                    x="50"
                    y="50"
                    width="500"
                    height="300"
                    fill="white"
                    stroke="currentColor"
                    strokeWidth="3"
                    className="text-slate-400"
                  />

                  {/* Door */}
                  <g>
                    <line
                      x1="50"
                      y1="200"
                      x2="50"
                      y2="250"
                      stroke="currentColor"
                      strokeWidth="4"
                      className="text-slate-600"
                    />
                    <path
                      d="M 50 200 Q 80 200 80 250"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeDasharray="4,4"
                      className="text-slate-400"
                    />
                  </g>

                  {/* Energy Wasters as Devices */}
                  {room.energyWasters.map((waster, index) => {
                    const isSelected = selectedWasters.has(waster.id);
                    const isHovered = hoveredWaster === waster.id;
                    const Icon = typeIcons[waster.type] || Zap;
                    
                    // Calculate position within room bounds
                    const x = 50 + (waster.x / 100) * 500;
                    const y = 50 + (waster.y / 100) * 300;

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
                        {/* Device Box */}
                        <rect
                          x={x - 30}
                          y={y - 30}
                          width="60"
                          height="60"
                          fill="white"
                          stroke="currentColor"
                          strokeWidth={isSelected ? "3" : "2"}
                          className={isSelected ? "text-slate-900" : "text-slate-300"}
                          rx="6"
                        />
                        
                        {/* Icon */}
                        <g transform={`translate(${x}, ${y})`}>
                          <Icon 
                            x={-12}
                            y={-12}
                            width={24}
                            height={24}
                            className="text-slate-600"
                          />
                        </g>

                        {/* Selection Checkmark */}
                        {isSelected && (
                          <g>
                            <circle
                              cx={x + 20}
                              cy={y - 20}
                              r="10"
                              fill="currentColor"
                              className="text-slate-900"
                            />
                            <path
                              d={`M ${x + 16} ${y - 20} L ${x + 19} ${y - 17} L ${x + 24} ${y - 23}`}
                              stroke="white"
                              strokeWidth="2"
                              fill="none"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </g>
                        )}

                        {/* Pulse effect when hovered */}
                        {isHovered && !isSelected && (
                          <motion.circle
                            cx={x}
                            cy={y}
                            r="35"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            className="text-slate-400"
                            initial={{ opacity: 0.5, scale: 0.8 }}
                            animate={{ opacity: 0, scale: 1.2 }}
                            transition={{ duration: 1, repeat: Infinity }}
                          />
                        )}
                      </motion.g>
                    );
                  })}
                </svg>
              </div>

              {/* Device List on Right */}
              <div className="w-64 flex-shrink-0">
                <h3 className="text-sm font-medium text-slate-900 mb-4">Devices</h3>
                <div className="space-y-2">
                  {room.energyWasters.map((waster, index) => {
                    const isSelected = selectedWasters.has(waster.id);

                    return (
                      <motion.button
                        key={waster.id}
                        initial={{ x: 20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 0.5 + index * 0.1 }}
                        onClick={() => toggleWaster(waster.id)}
                        onMouseEnter={() => setHoveredWaster(waster.id)}
                        onMouseLeave={() => setHoveredWaster(null)}
                        className={`w-full text-left p-3 rounded-lg border transition-all ${
                          isSelected
                            ? 'border-slate-900 bg-slate-50'
                            : 'border-slate-200 hover:border-slate-300 bg-white'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          {/* Selection Indicator */}
                          <div
                            className={`flex-shrink-0 w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all ${
                              isSelected
                                ? 'border-slate-900 bg-slate-900'
                                : 'border-slate-300 bg-white'
                            }`}
                          >
                            {isSelected && <Check className="w-2.5 h-2.5 text-white" />}
                          </div>

                          {/* Device Name */}
                          <span
                            className={`text-sm transition-all ${
                              isSelected ? 'text-slate-500 line-through' : 'text-slate-900'
                            }`}
                          >
                            {waster.name}
                          </span>
                        </div>
                      </motion.button>
                    );
                  })}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
