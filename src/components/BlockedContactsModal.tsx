import { useEffect, useState } from 'react';
import { X, Search, Ban, Loader2, UserX } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import type { Profile } from '@/types';
import Avatar from '@/components/Avatar';

interface BlockedContactsModalProps {
  onClose: () => void;
}

export default function BlockedContactsModal({ onClose }: BlockedContactsModalProps) {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [blocked, setBlocked] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');

  const loadBlocked = async () => {
    if (!profile) return;
    const { data } = await supabase
      .from('blocked_contacts')
      .select('blocked:blocked_id')
      .eq('blocker_id', profile.id);
    const blockedIds = (data ?? []).map((r: Record<string, string>) => r.blocked);
    if (blockedIds.length) {
      const { data: profs } = await supabase
        .from('profiles')
        .select('id, username, full_name, avatar_url, bio, phone, last_seen, created_at, is_verified, is_official')
        .in('id', blockedIds);
      setBlocked((profs ?? []) as Profile[]);
    } else {
      setBlocked([]);
    }
    setLoading(false);
  };

  useEffect(() => { loadBlocked(); }, [profile]);

  const unblock = async (userId: string) => {
    if (!profile) return;
    await supabase.from('blocked_contacts').delete().eq('blocker_id', profile.id).eq('blocked_id', userId);
    setBlocked((prev) => prev.filter((u) => u.id !== userId));
    toast('User unblocked', 'success');
  };

  const filtered = blocked.filter((u) =>
    u.full_name.toLowerCase().includes(query.toLowerCase()) ||
    u.username.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-2xl shadow-2xl overflow-hidden max-h-[80vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-700">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-white">Blocked Contacts</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-4 py-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search blocked users..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900 transition"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          {loading && <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 text-slate-400 animate-spin" /></div>}
          {!loading && blocked.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <UserX className="w-10 h-10 text-slate-300 dark:text-slate-600 mb-2" />
              <p className="text-slate-400 text-sm">No blocked contacts</p>
            </div>
          )}
          {filtered.map((u) => (
            <div key={u.id} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition">
              <Avatar src={u.avatar_url} name={u.full_name} id={u.id} size="md" verified={u.is_verified} />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-slate-800 dark:text-white truncate">{u.full_name}</p>
                <p className="text-sm text-slate-400 truncate">@{u.username}</p>
              </div>
              <button onClick={() => unblock(u.id)} className="px-3 py-1.5 rounded-lg text-sm font-medium text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition">
                Unblock
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
