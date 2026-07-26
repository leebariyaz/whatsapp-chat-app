import { useEffect, useState } from 'react';
import { X, Search, User, MessageSquare, FileText, Image as ImageIcon, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import type { Profile, Message } from '@/types';
import Avatar from '@/components/Avatar';

interface SearchModalProps {
  onClose: () => void;
  onUserSelect: (user: Profile) => void;
  onMessageSelect: (conversationId: string) => void;
}

type Tab = 'all' | 'users' | 'messages' | 'files';

export default function SearchModal({ onClose, onUserSelect, onMessageSelect }: SearchModalProps) {
  const { profile } = useAuth();
  const [query, setQuery] = useState('');
  const [tab, setTab] = useState<Tab>('all');
  const [users, setUsers] = useState<Profile[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!query.trim()) {
      setUsers([]);
      setMessages([]);
      return;
    }
    setLoading(true);
    const t = setTimeout(async () => {
      // Search users
      if (tab === 'all' || tab === 'users') {
        const { data } = await supabase
          .from('profiles')
          .select('id, username, full_name, avatar_url, bio, phone, last_seen, created_at, is_verified, is_official')
          .or(`username.ilike.%${query}%,full_name.ilike.%${query}%`)
          .neq('id', profile?.id ?? '')
          .limit(15);
        setUsers((data ?? []) as Profile[]);
      }
      // Search messages
      if (tab === 'all' || tab === 'messages' || tab === 'files') {
        const { data: myConvos } = await supabase
          .from('conversation_participants')
          .select('conversation_id')
          .eq('user_id', profile?.id ?? '');
        const convoIds = (myConvos ?? []).map((c) => c.conversation_id);
        if (convoIds.length) {
          let q = supabase
            .from('messages')
            .select('id, conversation_id, sender_id, text, media_url, media_type, media_name, reply_to_id, edited_at, deleted_for_everyone, created_at, forwarded_from_id, duration, location_lat, location_lng, contact_name, contact_phone')
            .in('conversation_id', convoIds)
            .eq('deleted_for_everyone', false)
            .order('created_at', { ascending: false })
            .limit(30);
          if (tab === 'messages') q = q.ilike('text', `%${query}%`);
          else if (tab === 'files') q = q.or(`media_name.ilike.%${query}%,media_type.in.(document,image,video,audio)`);
          else q = q.or(`text.ilike.%${query}%,media_name.ilike.%${query}%`);
          const { data } = await q;
          setMessages((data ?? []) as Message[]);
        }
      }
      setLoading(false);
    }, 250);
    return () => clearTimeout(t);
  }, [query, tab, profile?.id]);

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: 'all', label: 'All', icon: <Search className="w-4 h-4" /> },
    { key: 'users', label: 'People', icon: <User className="w-4 h-4" /> },
    { key: 'messages', label: 'Messages', icon: <MessageSquare className="w-4 h-4" /> },
    { key: 'files', label: 'Files', icon: <FileText className="w-4 h-4" /> },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="w-full max-w-lg bg-white dark:bg-slate-800 rounded-2xl shadow-2xl overflow-hidden max-h-[85vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-700">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-white">Search</h2>
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
              placeholder="Search people, messages, files..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900 transition"
            />
          </div>
          <div className="flex gap-1 mt-3">
            {tabs.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                  tab === t.key
                    ? 'bg-blue-500 text-white'
                    : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                }`}
              >
                {t.icon} {t.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-2 pb-2">
          {loading && (
            <div className="flex justify-center py-8">
              <Loader2 className="w-5 h-5 text-slate-400 animate-spin" />
            </div>
          )}
          {!loading && !query.trim() && (
            <p className="text-center text-sm text-slate-400 py-8">Start typing to search</p>
          )}
          {!loading && query.trim() && users.length === 0 && messages.length === 0 && (
            <p className="text-center text-sm text-slate-400 py-8">No results found</p>
          )}

          {(tab === 'all' || tab === 'users') && users.length > 0 && (
            <div className="mb-2">
              <p className="text-xs font-medium text-slate-400 px-3 py-1.5">People</p>
              {users.map((u) => (
                <button key={u.id} onClick={() => onUserSelect(u)} className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition text-left">
                  <Avatar src={u.avatar_url} name={u.full_name} id={u.id} size="md" verified={u.is_verified} />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-800 dark:text-white truncate">{u.full_name}</p>
                    <p className="text-sm text-slate-400 truncate">@{u.username}</p>
                  </div>
                </button>
              ))}
            </div>
          )}

          {(tab === 'all' || tab === 'messages' || tab === 'files') && messages.length > 0 && (
            <div>
              <p className="text-xs font-medium text-slate-400 px-3 py-1.5">{tab === 'files' ? 'Files' : 'Messages'}</p>
              {messages.map((m) => (
                <button key={m.id} onClick={() => onMessageSelect(m.conversation_id)} className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition text-left">
                  <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center shrink-0">
                    {m.media_type === 'image' ? <ImageIcon className="w-5 h-5 text-blue-500" /> : <MessageSquare className="w-5 h-5 text-blue-500" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-700 dark:text-slate-200 truncate">
                      {m.text ?? m.media_name ?? 'Media message'}
                    </p>
                    <p className="text-xs text-slate-400">{new Date(m.created_at).toLocaleString()}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
