import { useEffect, useState } from 'react';
import { X, Palette, Check } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import type { ChatTheme } from '@/types';

interface ChatCustomizeModalProps {
  conversationId: string;
  onClose: () => void;
}

const THEMES = [
  { id: 'default', name: 'Default', bg: 'bg-slate-50 dark:bg-slate-900' },
  { id: 'warm', name: 'Warm', bg: 'bg-amber-50 dark:bg-amber-950' },
  { id: 'cool', name: 'Cool', bg: 'bg-cyan-50 dark:bg-cyan-950' },
  { id: 'forest', name: 'Forest', bg: 'bg-emerald-50 dark:bg-emerald-950' },
  { id: 'sunset', name: 'Sunset', bg: 'bg-rose-50 dark:bg-rose-950' },
  { id: 'midnight', name: 'Midnight', bg: 'bg-indigo-50 dark:bg-indigo-950' },
];

const ACCENTS = [
  { id: 'teal', color: 'bg-teal-500' },
  { id: 'blue', color: 'bg-blue-500' },
  { id: 'emerald', color: 'bg-emerald-500' },
  { id: 'rose', color: 'bg-rose-500' },
  { id: 'amber', color: 'bg-amber-500' },
  { id: 'violet', color: 'bg-violet-500' },
];

const BUBBLE_STYLES = [
  { id: 'rounded', name: 'Rounded' },
  { id: 'square', name: 'Square' },
  { id: 'tail', name: 'Tail' },
];

export default function ChatCustomizeModal({ conversationId, onClose }: ChatCustomizeModalProps) {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [theme, setTheme] = useState('default');
  const [accent, setAccent] = useState('teal');
  const [bubbleStyle, setBubbleStyle] = useState('rounded');
  const [wallpaper, setWallpaper] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!profile) return;
    supabase.from('chat_themes').select('*').eq('conversation_id', conversationId).eq('user_id', profile.id).maybeSingle().then(({ data }) => {
      if (data) {
        const t = data as ChatTheme;
        setTheme(t.theme);
        setAccent(t.accent_color);
        setBubbleStyle(t.bubble_style);
        setWallpaper(t.wallpaper);
      }
    });
  }, [conversationId, profile]);

  const handleSave = async () => {
    if (!profile) return;
    setSaving(true);
    try {
      const { error } = await supabase.from('chat_themes').upsert({
        conversation_id: conversationId,
        user_id: profile.id,
        theme,
        accent_color: accent,
        bubble_style: bubbleStyle,
        wallpaper,
      }, { onConflict: 'conversation_id,user_id' });
      if (error) throw error;
      toast('Chat customised', 'success');
      onClose();
    } catch (err) {
      console.error(err);
      toast('Failed to save', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-2xl shadow-2xl overflow-hidden max-h-[85vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-700">
          <div className="flex items-center gap-2">
            <Palette className="w-5 h-5 text-teal-500" />
            <h2 className="text-lg font-semibold text-slate-800 dark:text-white">Customise Chat</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {/* Theme */}
          <div>
            <p className="text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">Theme</p>
            <div className="grid grid-cols-3 gap-2">
              {THEMES.map((t) => (
                <button key={t.id} onClick={() => setTheme(t.id)} className={`relative p-3 rounded-xl border-2 transition ${theme === t.id ? 'border-teal-500' : 'border-slate-200 dark:border-slate-600'} ${t.bg}`}>
                  <span className="text-xs text-slate-600 dark:text-slate-300">{t.name}</span>
                  {theme === t.id && <Check className="absolute top-1 right-1 w-3.5 h-3.5 text-teal-500" />}
                </button>
              ))}
            </div>
          </div>

          {/* Accent */}
          <div>
            <p className="text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">Accent Colour</p>
            <div className="flex gap-3">
              {ACCENTS.map((a) => (
                <button key={a.id} onClick={() => setAccent(a.id)} className={`w-9 h-9 rounded-full ${a.color} transition relative ${accent === a.id ? 'ring-2 ring-offset-2 ring-teal-500 dark:ring-offset-slate-800' : ''}`}>
                  {accent === a.id && <Check className="w-4 h-4 text-white absolute inset-0 m-auto" />}
                </button>
              ))}
            </div>
          </div>

          {/* Bubble style */}
          <div>
            <p className="text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">Bubble Style</p>
            <div className="flex gap-2">
              {BUBBLE_STYLES.map((b) => (
                <button key={b.id} onClick={() => setBubbleStyle(b.id)} className={`flex-1 py-2.5 rounded-xl border-2 text-sm font-medium transition ${bubbleStyle === b.id ? 'border-teal-500 bg-teal-50 dark:bg-teal-900/20 text-teal-600 dark:text-teal-400' : 'border-slate-200 dark:border-slate-600 text-slate-500 dark:text-slate-300'}`}>
                  {b.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-slate-100 dark:border-slate-700">
          <button onClick={handleSave} disabled={saving} className="w-full py-2.5 rounded-xl bg-gradient-to-r from-teal-500 to-blue-500 text-white font-medium hover:opacity-90 disabled:opacity-50 transition">
            {saving ? 'Saving...' : 'Apply'}
          </button>
        </div>
      </div>
    </div>
  );
}
