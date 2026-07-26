import { useEffect, useState } from 'react';
import { X, Forward, Loader2, Check } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import type { Conversation, Message } from '@/types';
import Avatar from '@/components/Avatar';

interface ForwardModalProps {
  message: Message | null;
  onClose: () => void;
  onForwarded: (conversationId: string) => void;
}

export default function ForwardModal({ message, onClose, onForwarded }: ForwardModalProps) {
  const { profile } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [forwarding, setForwarding] = useState(false);

  useEffect(() => {
    if (!profile) return;
    (async () => {
      const { data: parts } = await supabase
        .from('conversation_participants')
        .select('conversation_id, conversation:conversations(id, is_group, name, created_at)')
        .eq('user_id', profile.id);
      const convos: Conversation[] = [];
      for (const p of parts ?? []) {
        const c = (p as unknown as { conversation: Conversation }).conversation;
        const { data: cpRows } = await supabase
          .from('conversation_participants')
          .select('user_id')
          .eq('conversation_id', c.id);
        const userIds = (cpRows ?? []).map((r) => r.user_id);
        const { data: profRows } = await supabase
          .from('profiles')
          .select('id, username, full_name, avatar_url, bio, phone, last_seen, created_at, is_verified, is_official')
          .in('id', userIds);
        convos.push({ ...c, participants: (profRows ?? []) as typeof c.participants });
      }
      setConversations(convos);
      setLoading(false);
    })();
  }, [profile]);

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleForward = async () => {
    if (!message || !profile || selected.size === 0) return;
    setForwarding(true);
    try {
      for (const convoId of selected) {
        await supabase.from('messages').insert({
          conversation_id: convoId,
          sender_id: profile.id,
          text: message.text,
          media_url: message.media_url,
          media_type: message.media_type,
          media_name: message.media_name,
          forwarded_from_id: message.sender_id,
          location_lat: message.location_lat,
          location_lng: message.location_lng,
          contact_name: message.contact_name,
          contact_phone: message.contact_phone,
        });
      }
      const first = Array.from(selected)[0];
      onForwarded(first);
    } catch (err) {
      console.error('Forward failed', err);
    } finally {
      setForwarding(false);
    }
  };

  if (!message) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-2xl shadow-2xl overflow-hidden max-h-[80vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-700">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-white">Forward to...</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          {loading && <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 text-slate-400 animate-spin" /></div>}
          {conversations.map((c) => {
            const other = c.participants.find((p) => p.id !== profile?.id) ?? c.participants[0];
            const name = c.is_self ? 'Message Yourself' : c.is_group ? (c.name ?? 'Group') : other?.full_name ?? 'Unknown';
            return (
              <button
                key={c.id}
                onClick={() => toggle(c.id)}
                className={`w-full flex items-center gap-3 p-2.5 rounded-xl transition text-left ${selected.has(c.id) ? 'bg-blue-50 dark:bg-blue-900/20' : 'hover:bg-slate-50 dark:hover:bg-slate-700'}`}
              >
                <Avatar src={other?.avatar_url} name={name} id={other?.id ?? 'x'} size="md" verified={other?.is_verified} />
                <span className="flex-1 font-medium text-slate-800 dark:text-white truncate">{name}</span>
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${selected.has(c.id) ? 'bg-blue-500 border-blue-500' : 'border-slate-300 dark:border-slate-600'}`}>
                  {selected.has(c.id) && <Check className="w-3 h-3 text-white" />}
                </div>
              </button>
            );
          })}
        </div>

        <div className="p-4 border-t border-slate-100 dark:border-slate-700">
          <button
            onClick={handleForward}
            disabled={selected.size === 0 || forwarding}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-emerald-500 text-white font-medium hover:opacity-90 disabled:opacity-50 transition"
          >
            {forwarding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Forward className="w-4 h-4" />}
            Forward {selected.size > 0 ? `(${selected.size})` : ''}
          </button>
        </div>
      </div>
    </div>
  );
}
