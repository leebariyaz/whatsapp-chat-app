import { X, Sparkles, CheckCircle2, Clock, Rocket } from 'lucide-react';

interface WhatsNewModalProps {
  onClose: () => void;
}

const UPDATES = [
  { version: '3.0', date: 'Latest', type: 'new', title: 'Brand New Identity', desc: 'We\'ve reimagined Pulse with a unique design system, custom logo, and stunning animations.' },
  { version: '3.0', date: 'Latest', type: 'new', title: 'QR Code Sharing', desc: 'Share your profile via QR code, scan to connect instantly, and join groups with a scan.' },
  { version: '3.0', date: 'Latest', type: 'new', title: 'Chat Folders', desc: 'Organize your chats into custom folders — Friends, Work, Family, and more.' },
  { version: '3.0', date: 'Latest', type: 'new', title: 'Polls, Events & To-Do Lists', desc: 'Create live polls, schedule events with RSVP, and manage shared task lists in group chats.' },
  { version: '3.0', date: 'Latest', type: 'new', title: 'Smart Reminders & Scheduled Messages', desc: 'Convert messages to reminders, schedule messages for later, and set up auto-reply.' },
  { version: '3.0', date: 'Latest', type: 'new', title: 'Friend Requests', desc: 'Connect with people through friend requests instead of instant messaging.' },
  { version: '3.0', date: 'Latest', type: 'new', title: 'Personal Dashboard', desc: 'View your messaging stats, weekly activity, and most contacted people.' },
  { version: '3.0', date: 'Latest', type: 'new', title: 'Message Formatting', desc: 'Use bold, italic, code, lists, and more in your messages.' },
  { version: '3.0', date: 'Latest', type: 'new', title: 'Accessibility Suite', desc: 'High contrast mode, dyslexia-friendly font, larger text, and keyboard shortcuts.' },
];

const UPCOMING = [
  { title: 'Video Calls', desc: 'HD video calling with group support', eta: 'Soon' },
  { title: 'Custom Stickers', desc: 'Create and share your own sticker packs', eta: 'Soon' },
  { title: 'Message Translation', desc: 'Auto-translate messages in real time', eta: 'Planned' },
  { title: 'Disappearing Messages', desc: 'Messages that auto-delete after a set time', eta: 'Planned' },
];

export default function WhatsNewModal({ onClose }: WhatsNewModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="w-full max-w-lg bg-white dark:bg-slate-800 rounded-2xl shadow-2xl overflow-hidden max-h-[85vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-700">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-teal-500" />
            <h2 className="text-lg font-semibold text-slate-800 dark:text-white">What's New</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <Rocket className="w-4 h-4 text-teal-500" />
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200 uppercase tracking-wide">New Features</h3>
            </div>
            <div className="space-y-3">
              {UPDATES.map((u, i) => (
                <div key={i} className="flex gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-700/50 border border-slate-100 dark:border-slate-700">
                  <CheckCircle2 className="w-5 h-5 text-teal-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-slate-800 dark:text-white text-sm">{u.title}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{u.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-3">
              <Clock className="w-4 h-4 text-blue-500" />
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200 uppercase tracking-wide">Coming Soon</h3>
            </div>
            <div className="space-y-2">
              {UPCOMING.map((u, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-xl border border-dashed border-slate-200 dark:border-slate-600">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center">
                    <Clock className="w-4 h-4 text-blue-400" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-slate-700 dark:text-slate-200 text-sm">{u.title}</p>
                    <p className="text-xs text-slate-400">{u.desc}</p>
                  </div>
                  <span className="text-xs text-blue-400 font-medium">{u.eta}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="px-5 py-3 border-t border-slate-100 dark:border-slate-700 text-center">
          <p className="text-xs text-slate-400">Pulse v3.0 · Released July 2026</p>
        </div>
      </div>
    </div>
  );
}
