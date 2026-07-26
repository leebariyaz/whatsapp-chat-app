import { useEffect, useState } from 'react';
import { X, Search, UserPlus, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import type { Profile } from '@/types';
import Avatar from '@/components/Avatar';

interface NewChatModalProps {
  onClose: () => void;
  onChatCreated: (conversationId: string) => void;
}

export default function NewChatModal({ onClose, onChatCreated }: NewChatModalProps) {
  const { profile } = useAuth();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState<string | null>(null);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    setLoading(true);
    const t = setTimeout(async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, full_name, avatar_url, bio, last_seen, created_at')
        .or(`username.ilike.%${query}%,full_name.ilike.%${query}%`)
        .neq('id', profile?.id ?? '')
        .limit(20);
      if (error) console.error('Search failed', error);
      setResults((data ?? []) as Profile[]);
      setLoading(false);
    }, 250);
    return () => clearTimeout(t);
  }, [query, profile?.id]);

  const startChat = async (otherUser: Profile) => {
    if (!profile) return;
    setCreating(otherUser.id);
    try {
      // Find existing 1:1 conversation
      const { data: myConvos } = await supabase
        .from('conversation_participants')
        .select('conversation_id')
        .eq('user_id', profile.id);

      const convoIds = (myConvos ?? []).map((c) => c.conversation_id);
      let existingId: string | null = null;

      if (convoIds.length) {
        const { data: otherConvos } = await supabase
          .from('conversation_participants')
          .select('conversation_id, user_id')
          .in('conversation_id', convoIds)
          .eq('user_id', otherUser.id);

        for (const oc of otherConvos ?? []) {
          const { data: parts } = await supabase
            .from('conversation_participants')
            .select('user_id')
            .eq('conversation_id', oc.conversation_id);
          if (parts && parts.length === 2) {
            existingId = oc.conversation_id;
            break;
          }
        }
      }

      if (existingId) {
        onChatCreated(existingId);
        return;
      }

      // Create new conversation
      const { data: convo, error: convoErr } = await supabase
        .from('conversations')
        .insert({ is_group: false })
        .select('id')
        .single();
      if (convoErr) throw convoErr;

      const { error: partErr } = await supabase
        .from('conversation_participants')
        .insert([
          { conversation_id: convo.id, user_id: profile.id },
          { conversation_id: convo.id, user_id: otherUser.id },
        ]);
      if (partErr) throw partErr;

      onChatCreated(convo.id);
    } catch (err) {
      console.error('Failed to start chat', err);
    } finally {
      setCreating(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div
        className="w-full max-w-md bg-white dark:bg-slate-800 rounded-2xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-700">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-white">New Chat</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name or username..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900 transition"
            />
          </div>

          <div className="mt-4 max-h-80 overflow-y-auto space-y-1">
            {loading && (
              <div className="flex justify-center py-6">
                <Loader2 className="w-5 h-5 text-slate-400 animate-spin" />
              </div>
            )}
            {!loading && query.trim() && results.length === 0 && (
              <p className="text-center text-sm text-slate-400 py-6">No users found</p>
            )}
            {!loading && !query.trim() && (
              <p className="text-center text-sm text-slate-400 py-6">Search to start a new conversation</p>
            )}
            {results.map((u) => (
              <button
                key={u.id}
                onClick={() => startChat(u)}
                disabled={creating !== null}
                className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition text-left disabled:opacity-50"
              >
                <Avatar src={u.avatar_url} name={u.full_name} id={u.id} size="md" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-slate-800 dark:text-white truncate">{u.full_name}</p>
                  <p className="text-sm text-slate-400 truncate">@{u.username}</p>
                </div>
                {creating === u.id ? (
                  <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
                ) : (
                  <UserPlus className="w-5 h-5 text-slate-400" />
                )}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
