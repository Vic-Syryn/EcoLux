import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Zap, Wifi, WifiOff, Loader } from 'lucide-react';
import { Device, getDevices, toggleDevice } from '../api/devices';

export function DevicePanel() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDevices = async () => {
    try {
      const data = await getDevices();
      setDevices(data);
      setError(null);
    } catch (e) {
      setError('Cannot reach Matter API');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDevices();
    // Poll every 5 seconds for live state updates
    const interval = setInterval(fetchDevices, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleToggle = async (device: Device) => {
    try {
      await toggleDevice(device.id);
      // Optimistically update the UI
      setDevices(prev =>
        prev.map(d => d.id === device.id ? { ...d, state: !d.state } : d)
      );
    } catch (e) {
      setError('Failed to control device');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full gap-2 text-slate-400">
        <Loader className="w-5 h-5 animate-spin" />
        <span>Connecting to Matter...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full text-red-400 text-sm">
        {error}
      </div>
    );
  }

  if (devices.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-2 text-slate-400 text-sm text-center p-4">
        <Zap className="w-8 h-8 opacity-30" />
        <p>No devices paired yet</p>
        <p className="text-xs opacity-60">Power on your smart plug and commission it to get started</p>
      </div>
    );
  }

  return (
    <div className="p-3 space-y-2">
      <h3 className="text-sm font-semibold text-slate-700 mb-3">Matter Devices</h3>
      {devices.map((device, index) => (
        <motion.button
          key={device.id}
          initial={{ x: 20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: index * 0.08 }}
          onClick={() => handleToggle(device)}
          className={`w-full min-h-[64px] px-3 py-3 rounded-xl border-2 transition-all active:scale-[0.98] flex items-center gap-3 ${
            device.state
              ? 'border-slate-900 bg-slate-50'
              : 'border-slate-100 bg-white'
          }`}
        >
          {/* Icon */}
          <div className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center ${
            device.state ? 'bg-slate-900' : 'bg-slate-100'
          }`}>
            <Zap className={`w-5 h-5 ${device.state ? 'text-white' : 'text-slate-400'}`} />
          </div>

          {/* Info */}
          <div className="flex-1 text-left">
            <p className={`text-sm font-medium ${device.state ? 'text-slate-900' : 'text-slate-500'}`}>
              {device.name}
            </p>
            <p className="text-xs text-slate-400 mt-0.5">
              {device.state ? 'Aan' : 'Uit'}
            </p>
          </div>

          {/* Online indicator */}
          <div className="flex-shrink-0">
            {device.online
              ? <Wifi className="w-4 h-4 text-green-400" />
              : <WifiOff className="w-4 h-4 text-red-300" />
            }
          </div>
        </motion.button>
      ))}
    </div>
  );
}