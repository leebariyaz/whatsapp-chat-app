import { useEffect, useState } from 'react';
import { X, Smartphone, Monitor, Tablet, LogOut, Shield, Clock, MapPin, Loader2, AlertCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import type { DeviceSession, LoginHistoryEntry } from '@/types';

interface DeviceSecurityModalProps {
  onClose: () => void;
}

export default function DeviceSecurityModal({ onClose }: DeviceSecurityModalProps) {
  const { profile, signOut } = useAuth();
  const { toast } = useToast();
  const [devices, setDevices] = useState<DeviceSession[]>([]);
  const [history, setHistory] = useState<LoginHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile) return;
    (async () => {
      const { data: devData } = await supabase.from('device_sessions').select('*').eq('user_id', profile.id).order('last_active', { ascending: false });
      setDevices((devData ?? []) as DeviceSession[]);

      const { data: histData } = await supabase.from('login_history').select('*').eq('user_id', profile.id).order('created_at', { ascending: false }).limit(10);
      setHistory((histData ?? []) as LoginHistoryEntry[]);
      setLoading(false);
    })();
  }, [profile]);

  const logoutDevice = async (deviceId: string) => {
    await supabase.from('device_sessions').delete().eq('id', deviceId);
    setDevices((prev) => prev.filter((d) => d.id !== deviceId));
    toast('Device logged out', 'success');
  };

  const logoutAll = async () => {
    if (!confirm('Log out from all devices? This will sign you out everywhere.')) return;
    if (profile) {
      await supabase.from('device_sessions').delete().neq('id', '00000000-0000-0000-0000-000000000000').eq('user_id', profile.id);
    }
    await signOut();
    toast('Logged out from all devices', 'success');
  };

  const deviceIcon = (type: string) => {
    if (type === 'mobile') return <Smartphone className="w-5 h-5" />;
    if (type === 'tablet') return <Tablet className="w-5 h-5" />;
    return <Monitor className="w-5 h-5" />;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-2xl shadow-2xl overflow-hidden max-h-[85vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-700">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-teal-500" />
            <h2 className="text-lg font-semibold text-slate-800 dark:text-white">Device Security</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 text-slate-400 animate-spin" /></div>
          ) : (
            <>
              {/* Active sessions */}
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-3">Active Sessions</h3>
                <div className="space-y-2">
                  {devices.map((d, i) => (
                    <div key={d.id} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-700/50">
                      <div className="w-10 h-10 rounded-xl bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center text-teal-500">
                        {deviceIcon(d.device_type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate">{d.device_name} {i === 0 && <span className="text-xs text-teal-500">(This device)</span>}</p>
                        <p className="text-xs text-slate-400">Last active: {new Date(d.last_active).toLocaleString()}</p>
                      </div>
                      {i !== 0 && (
                        <button onClick={() => logoutDevice(d.id)} className="p-2 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition">
                          <LogOut className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                  {devices.length === 0 && <p className="text-sm text-slate-400 text-center py-4">No active sessions</p>}
                </div>
                {devices.length > 1 && (
                  <button onClick={logoutAll} className="w-full mt-3 py-2.5 rounded-xl bg-rose-500 text-white text-sm font-medium hover:opacity-90 transition">
                    Log out from all devices
                  </button>
                )}
              </div>

              {/* Login history */}
              <div>
                <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-3">Login History</h3>
                <div className="space-y-2">
                  {history.map((h) => (
                    <div key={h.id} className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-700/50">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${h.success ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-500' : 'bg-rose-100 dark:bg-rose-900/30 text-rose-500'}`}>
                        {h.success ? <Shield className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-slate-700 dark:text-slate-200 truncate">{h.device_name ?? 'Unknown device'}</p>
                        <p className="text-xs text-slate-400 flex items-center gap-2">
                          <Clock className="w-3 h-3" /> {new Date(h.created_at).toLocaleString()}
                          {h.location && <><MapPin className="w-3 h-3" /> {h.location}</>}
                        </p>
                      </div>
                    </div>
                  ))}
                  {history.length === 0 && <p className="text-sm text-slate-400 text-center py-4">No login history</p>}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
