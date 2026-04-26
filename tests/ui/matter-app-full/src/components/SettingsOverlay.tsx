import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Zap, Wifi, WifiOff, MapPin, Trash2, ChevronUp, ChevronDown, Plus, Loader, CheckCircle, AlertCircle } from 'lucide-react';
import { Device, removePlacement, pairDevice } from '../api/devices';
import { Floor } from '../data/mockData';

interface SettingsOverlayProps {
  devices: Device[];
  houseData: Floor[];
  assigningDevice: Device | null;
  onStartAssign: (device: Device) => void;
  onCancelAssign: () => void;
  onClose: () => void;
  onDevicesChanged: () => void;
  currentFloorId: string;
  onFloorChange: (id: string) => void;
  onRoomAssign: (floorId: string, roomId: string) => void;
}

type PairStatus = 'idle' | 'loading' | 'success' | 'error';

// Formats a raw digit string as a Matter setup code: XXXXX-XXXXXXX or XXX-XX-XXXXXXX
function formatMatterCode(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 4) return digits;
  if (digits.length <= 7) return `${digits.slice(0, 4)}-${digits.slice(4)}`;
  return `${digits.slice(0, 4)}-${digits.slice(4, 7)}-${digits.slice(7)}`;
}

export function SettingsOverlay({
  devices,
  houseData,
  assigningDevice,
  onStartAssign,
  onCancelAssign,
  onClose,
  onDevicesChanged,
  currentFloorId,
  onFloorChange,
  onRoomAssign,
}: SettingsOverlayProps) {
  const currentIndex = houseData.findIndex(f => f.id === currentFloorId);
  const currentFloor = houseData[currentIndex];

  // Pairing state
  const [showPairForm, setShowPairForm] = useState(false);
  const [pairCode, setPairCode] = useState('');
  const [pairStatus, setPairStatus] = useState<PairStatus>('idle');
  const [pairError, setPairError] = useState('');

  const handleRemovePlacement = async (device: Device) => {
    await removePlacement(device.id);
    onDevicesChanged();
  };

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatMatterCode(e.target.value);
    setPairCode(formatted);
    if (pairStatus === 'error') setPairStatus('idle');
  };

  const rawDigits = pairCode.replace(/\D/g, '');
  const isCodeComplete = rawDigits.length === 11;

  const handlePair = async () => {
    if (!isCodeComplete) return;
    setPairStatus('loading');
    setPairError('');
    try {
      await pairDevice(rawDigits);
      setPairStatus('success');
      setPairCode('');
      await onDevicesChanged();
      setTimeout(() => {
        setPairStatus('idle');
        setShowPairForm(false);
      }, 2500);
    } catch (e: any) {
      setPairStatus('error');
      setPairError(e.message || 'Koppelen mislukt');
    }
  };

  const handleCancelPair = () => {
    setShowPairForm(false);
    setPairCode('');
    setPairStatus('idle');
    setPairError('');
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 bg-black/60 backdrop-blur-sm z-50 flex"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 28, stiffness: 280 }}
        className="absolute right-0 top-0 bottom-0 w-80 bg-gradient-to-br from-[#374151] to-[#2d3748] flex flex-col shadow-2xl border-l border-gray-600/50"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-600/50 flex-shrink-0">
          <h2 className="text-base font-semibold text-white">Instellingen</h2>
          <button
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center rounded-xl bg-gray-600/50 hover:bg-gray-500/50 active:bg-gray-700 transition-colors"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Assigning banner */}
        <AnimatePresence>
          {assigningDevice && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden flex-shrink-0"
            >
              <div className="bg-indigo-600/80 text-white px-4 py-3 flex items-center justify-between border-b border-indigo-500/50">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider opacity-70">Ruimte kiezen voor</p>
                  <p className="text-sm font-medium mt-0.5">{assigningDevice.name}</p>
                </div>
                <button onClick={onCancelAssign} className="p-1.5 rounded-lg bg-white/10 active:bg-white/20">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex-1 overflow-y-auto">

          {/* ── Pair new device section ── */}
          <div className="p-4 border-b border-gray-600/40">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Nieuw apparaat koppelen
              </p>
              {!showPairForm && (
                <button
                  onClick={() => setShowPairForm(true)}
                  className="flex items-center gap-1.5 h-8 px-3 rounded-lg bg-indigo-600/70 hover:bg-indigo-500/70 border border-indigo-400/40 text-white text-xs font-medium transition-all active:scale-95"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Koppelen
                </button>
              )}
            </div>

            <AnimatePresence>
              {showPairForm && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  className="overflow-hidden"
                >
                  <div className="bg-gray-800/60 rounded-xl border border-gray-600/40 p-3 space-y-3">

                    {/* Instruction */}
                    <p className="text-xs text-gray-400 leading-relaxed">
                      Voer de 11-cijferige Matter setupcode in. Deze staat op het apparaat of in de verpakking.
                    </p>

                    {/* Code input */}
                    <div className="space-y-1.5">
                      <label className="text-xs text-gray-400 font-medium">Setupcode</label>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={pairCode}
                        onChange={handleCodeChange}
                        placeholder="XXXX-XXX-XXXX"
                        maxLength={14} /* 11 digits + 2 dashes + 1 buffer */
                        disabled={pairStatus === 'loading' || pairStatus === 'success'}
                        className="w-full h-11 px-3 rounded-xl bg-gray-700/80 border border-gray-500/50 text-white text-base font-mono tracking-widest placeholder-gray-600 focus:outline-none focus:border-indigo-400/70 focus:bg-gray-700 transition-all disabled:opacity-50"
                      />
                      {/* Progress dots */}
                      <div className="flex gap-1 justify-center pt-0.5">
                        {Array.from({ length: 11 }).map((_, i) => (
                          <div
                            key={i}
                            className={`w-1.5 h-1.5 rounded-full transition-all duration-150 ${
                              i < rawDigits.length
                                ? 'bg-indigo-400'
                                : 'bg-gray-600'
                            }`}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Status feedback */}
                    <AnimatePresence>
                      {pairStatus === 'error' && (
                        <motion.div
                          initial={{ opacity: 0, y: -4 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0 }}
                          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-900/40 border border-red-500/30"
                        >
                          <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                          <p className="text-xs text-red-300">{pairError}</p>
                        </motion.div>
                      )}
                      {pairStatus === 'success' && (
                        <motion.div
                          initial={{ opacity: 0, y: -4 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0 }}
                          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-green-900/40 border border-green-500/30"
                        >
                          <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
                          <p className="text-xs text-green-300">Apparaat gekoppeld!</p>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Action buttons */}
                    <div className="flex gap-2">
                      <button
                        onClick={handleCancelPair}
                        disabled={pairStatus === 'loading'}
                        className="flex-1 h-10 rounded-xl bg-gray-700/60 border border-gray-500/40 text-gray-300 text-xs font-medium hover:bg-gray-600/60 transition-all active:scale-95 disabled:opacity-40"
                      >
                        Annuleren
                      </button>
                      <button
                        onClick={handlePair}
                        disabled={!isCodeComplete || pairStatus === 'loading' || pairStatus === 'success'}
                        className="flex-1 h-10 rounded-xl bg-indigo-600/80 border border-indigo-400/40 text-white text-xs font-semibold hover:bg-indigo-500/80 transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
                      >
                        {pairStatus === 'loading' ? (
                          <>
                            <Loader className="w-3.5 h-3.5 animate-spin" />
                            Koppelen...
                          </>
                        ) : (
                          'Koppelen'
                        )}
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* ── Device list ── */}
          <div className="p-4 border-b border-gray-600/40">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
              Gekoppelde apparaten
            </p>

            {devices.length === 0 ? (
              <div className="text-center py-6">
                <Zap className="w-8 h-8 mx-auto mb-2 text-gray-500 opacity-50" />
                <p className="text-sm text-gray-400">Nog geen apparaten</p>
                <p className="text-xs text-gray-500 mt-1 opacity-70">
                  Gebruik de knop hierboven om een apparaat te koppelen
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {devices.map(device => {
                  const isAssigning = assigningDevice?.id === device.id;
                  const hasPlacement = !!device.placement;

                  let roomName = '';
                  if (hasPlacement) {
                    const floor = houseData.find(f => f.id === device.placement!.floor_id);
                    const room = floor?.rooms.find(r => r.id === device.placement!.room_id);
                    roomName = room ? `${floor?.name} · ${room.name}` : '';
                  }

                  return (
                    <div
                      key={device.id}
                      className={`rounded-xl border p-3 transition-all ${
                        isAssigning
                          ? 'border-indigo-400/60 bg-indigo-600/20'
                          : 'border-gray-600/40 bg-gray-700/30'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                          device.state ? 'bg-amber-500/30' : 'bg-gray-600/50'
                        }`}>
                          <Zap className={`w-4 h-4 ${device.state ? 'text-amber-400' : 'text-gray-400'}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-white truncate">{device.name}</p>
                          {hasPlacement ? (
                            <p className="text-xs text-gray-400 truncate mt-0.5">📍 {roomName}</p>
                          ) : (
                            <p className="text-xs text-gray-500 mt-0.5">Nog niet geplaatst</p>
                          )}
                        </div>
                        <div className="flex-shrink-0">
                          {device.online
                            ? <Wifi className="w-4 h-4 text-green-400" />
                            : <WifiOff className="w-4 h-4 text-red-400" />
                          }
                        </div>
                      </div>

                      <div className="flex gap-2 mt-2.5">
                        <button
                          onClick={() => isAssigning ? onCancelAssign() : onStartAssign(device)}
                          className={`flex-1 h-9 rounded-lg flex items-center justify-center gap-1.5 text-xs font-medium transition-all active:scale-95 ${
                            isAssigning
                              ? 'bg-indigo-500/60 text-white border border-indigo-400/50'
                              : 'bg-gray-600/50 text-gray-200 border border-gray-500/40 hover:bg-gray-500/50'
                          }`}
                        >
                          <MapPin className="w-3.5 h-3.5" />
                          {isAssigning ? 'Annuleren' : hasPlacement ? 'Verplaatsen' : 'Plaatsen'}
                        </button>
                        {hasPlacement && (
                          <button
                            onClick={() => handleRemovePlacement(device)}
                            className="w-9 h-9 rounded-lg bg-red-900/40 border border-red-500/30 flex items-center justify-center active:scale-95"
                          >
                            <Trash2 className="w-4 h-4 text-red-400" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* ── Mini floor plan — shown when assigning ── */}
          <AnimatePresence>
            {assigningDevice && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                className="p-4"
              >
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                  Tik op een ruimte
                </p>

                {/* Floor navigation */}
                <div className="flex items-center gap-2 mb-3">
                  <button
                    onClick={() => currentIndex > 0 && onFloorChange(houseData[currentIndex - 1].id)}
                    disabled={currentIndex === 0}
                    className="w-8 h-8 rounded-lg border border-gray-600/50 bg-gray-700/50 flex items-center justify-center disabled:opacity-30 active:bg-gray-600"
                  >
                    <ChevronUp className="w-4 h-4 text-white" />
                  </button>
                  <span className="flex-1 text-center text-sm font-medium text-white">
                    {currentFloor?.name}
                  </span>
                  <button
                    onClick={() => currentIndex < houseData.length - 1 && onFloorChange(houseData[currentIndex + 1].id)}
                    disabled={currentIndex === houseData.length - 1}
                    className="w-8 h-8 rounded-lg border border-gray-600/50 bg-gray-700/50 flex items-center justify-center disabled:opacity-30 active:bg-gray-600"
                  >
                    <ChevronDown className="w-4 h-4 text-white" />
                  </button>
                </div>

                {/* Mini SVG floor plan */}
                <svg
                  viewBox="0 0 500 360"
                  className="w-full rounded-xl border border-gray-600/40 bg-[#6B7280]/40"
                  preserveAspectRatio="xMidYMid meet"
                >
                  <rect x="0" y="0" width="480" height="360" fill="none" stroke="white" strokeWidth="3" rx="10" />

                  {currentFloor?.rooms.map(room => (
                    <g
                      key={room.id}
                      onClick={() => onRoomAssign(currentFloor.id, room.id)}
                      style={{ cursor: 'pointer' }}
                    >
                      <motion.rect
                        x={room.x} y={room.y}
                        width={room.width} height={room.height}
                        fill="rgba(99,102,241,0.2)"
                        stroke="rgb(129,140,248)"
                        strokeWidth="2"
                        strokeDasharray="5,3"
                        rx="4"
                        whileTap={{ fill: 'rgba(99,102,241,0.5)' }}
                      />
                      <text
                        x={room.x + room.width / 2}
                        y={room.y + room.height / 2}
                        textAnchor="middle" dominantBaseline="middle"
                        fill="white" fontSize="13" fontWeight="500"
                        style={{ pointerEvents: 'none', userSelect: 'none' }}
                      >
                        {room.name}
                      </text>
                    </g>
                  ))}
                </svg>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  );
}
