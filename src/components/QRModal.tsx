import { useState } from 'react';
import { X, QrCode, Scan, Copy, Check } from 'lucide-react';
import { useToast } from '@/context/ToastContext';
import type { Profile } from '@/types';
import Avatar from '@/components/Avatar';

interface QRModalProps {
  profile: Profile;
  onClose: () => void;
  onScanResult?: (username: string) => void;
}

export default function QRModal({ profile, onClose, onScanResult }: QRModalProps) {
  const { toast } = useToast();
  const [mode, setMode] = useState<'show' | 'scan'>('show');
  const [scanInput, setScanInput] = useState('');
  const [copied, setCopied] = useState(false);

  const profileUrl = `${window.location.origin}/u/${profile.username}`;
  const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(profileUrl)}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(profileUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
    toast('Link copied', 'success');
  };

  const handleScan = () => {
    if (!scanInput.trim()) return;
    // Parse username from URL or direct input
    const match = scanInput.match(/\/u\/(.+)/);
    const username = match ? match[1] : scanInput.trim().replace('@', '');
    if (onScanResult) onScanResult(username);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="w-full max-w-sm bg-white dark:bg-slate-800 rounded-2xl shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-700">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-white">QR Code</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex border-b border-slate-100 dark:border-slate-700">
          <button onClick={() => setMode('show')} className={`flex-1 py-2.5 text-sm font-medium ${mode === 'show' ? 'text-teal-500 border-b-2 border-teal-500' : 'text-slate-400'}`}>
            My Code
          </button>
          <button onClick={() => setMode('scan')} className={`flex-1 py-2.5 text-sm font-medium ${mode === 'scan' ? 'text-teal-500 border-b-2 border-teal-500' : 'text-slate-400'}`}>
            Scan
          </button>
        </div>

        <div className="p-6">
          {mode === 'show' ? (
            <div className="flex flex-col items-center">
              <div className="p-4 bg-white rounded-2xl shadow-sm border border-slate-100">
                <img src={qrApiUrl} alt="Profile QR" className="w-60 h-60" />
              </div>
              <div className="flex items-center gap-3 mt-4">
                <Avatar src={profile.avatar_url} name={profile.full_name} id={profile.id} size="sm" verified={profile.is_verified} />
                <div>
                  <p className="font-medium text-slate-800 dark:text-white">{profile.full_name}</p>
                  <p className="text-sm text-slate-400">@{profile.username}</p>
                </div>
              </div>
              <button onClick={handleCopy} className="mt-4 flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-700 text-sm text-slate-600 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-600 transition">
                {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Copied!' : 'Copy share link'}
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <div className="w-60 h-60 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-600 flex flex-col items-center justify-center text-slate-400">
                <Scan className="w-12 h-12 mb-2" />
                <p className="text-sm text-center px-4">Paste a profile link or username to connect</p>
              </div>
              <input
                type="text"
                value={scanInput}
                onChange={(e) => setScanInput(e.target.value)}
                placeholder="https://pulse.app/u/username"
                className="w-full mt-4 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white text-sm focus:outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-100 dark:focus:ring-teal-900 transition"
              />
              <button onClick={handleScan} disabled={!scanInput.trim()} className="w-full mt-3 py-2.5 rounded-xl bg-gradient-to-r from-teal-500 to-blue-500 text-white font-medium hover:opacity-90 disabled:opacity-50 transition flex items-center justify-center gap-2">
                <QrCode className="w-4 h-4" />
                Connect
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
