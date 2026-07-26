import { useEffect, useState } from 'react';
import { X, Clock, Send, Trash2, Edit2, Loader2, Calendar } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import type { ScheduledMessage } from '@/types';

interface ScheduledMessagesModalProps {
  conversationId: string;
  onClose: () => void;
  onSendNow: (scheduled: ScheduledMessage) => void;
}

export default function ScheduledMessagesModal({ conversationId, onClose, onSendNow }: ScheduledMessagesModalProps) {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [messages, setMessages] = useState<ScheduledMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const loadMessages = async () => {
    if (!profile) return;
    const { data } = await supabase.from('scheduled_messages').select('*').eq('conversation_id', conversationId).eq('sent', false).order('scheduled_for', { ascending: true });
    setMessages((data ?? []) as ScheduledMessage[]);
    setLoading(false);
  };

  useEffect(() => { loadMessages(); }, [conversationId]);

  const handleCreate = async () => {
    if (!profile || !text.trim() || !date || !time) { toast('Fill in all fields', 'error'); return; }
    setCreating(true);
    try {
      const scheduledFor = new Date(`${date}T${time}`).toISOString();
      if (editingId) {
        const { error } = await supabase.from('scheduled_messages').update({ text: text.trim(), scheduled_for: scheduledFor }).eq('id', editingId);
        if (error) throw error;
        toast('Scheduled message updated', 'success');
        setEditingId(null);
      } else {
        const { error } = await supabase.from('scheduled_messages').insert({
          conversation_id: conversationId,
          sender_id: profile.id,
          text: text.trim(),
          scheduled_for: scheduledFor,
        });
        if (error) throw error;
        toast('Message scheduled', 'success');
      }
      setText(''); setDate(''); setTime('');
      loadMessages();
    } catch (err) {
      console.error(err);
      toast('Failed to schedule message', 'error');
    } finally {
      setCreating(false);
    }
  };

  const handleEdit = (msg: ScheduledMessage) => {
    setEditingId(msg.id);
    setText(msg.text ?? '');
    const d = new Date(msg.scheduled_for);
    setDate(d.toISOString().slice(0, 10));
    setTime(d.toTimeString().slice(0, 5));
  };

  const handleDelete = async (id: string) => {
    await supabase.from('scheduled_messages').delete().eq('id', id);
    setMessages((prev) => prev.filter((m) => m.id !== id));
    toast('Scheduled message cancelled', 'success');
  };

  const handleSendNow = async (msg: ScheduledMessage) => {
    if (!profile) return;
    const { error: msgErr } = await supabase.from('messages').insert({
      conversation_id: msg.conversation_id,
      sender_id: profile.id,
      text: msg.text,
    });
    if (msgErr) { toast('Failed to send', 'error'); return; }
    await supabase.from('scheduled_messages').update({ sent: true }).eq('id', msg.id);
    setMessages((prev) => prev.filter((m) => m.id !== msg.id));
    onSendNow(msg);
    toast('Message sent', 'success');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-2xl shadow-2xl overflow-hidden max-h-[80vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-700">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-teal-500" />
            <h2 className="text-lg font-semibold text-slate-800 dark:text-white">Scheduled Messages</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 border-b border-slate-100 dark:border-slate-700 space-y-3">
          <textarea value={text} onChange={(e) => setText(e.target.value)} placeholder="Message to schedule..." rows={2} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white text-sm focus:outline-none focus:border-teal-400 transition resize-none" />
          <div className="grid grid-cols-2 gap-3">
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white text-sm focus:outline-none focus:border-teal-400 transition" />
            <input type="time" value={time} onChange={(e) => setTime(e.target.value)} className="px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white text-sm focus:outline-none focus:border-teal-400 transition" />
          </div>
          <button onClick={handleCreate} disabled={creating} className="w-full py-2.5 rounded-xl bg-gradient-to-r from-teal-500 to-blue-500 text-white font-medium hover:opacity-90 disabled:opacity-50 transition flex items-center justify-center gap-2">
            {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Calendar className="w-4 h-4" />}
            {editingId ? 'Update Schedule' : 'Schedule Message'}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          {loading && <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 text-slate-400 animate-spin" /></div>}
          {!loading && messages.length === 0 && <p className="text-center text-sm text-slate-400 py-8">No scheduled messages</p>}
          {messages.map((m) => (
            <div key={m.id} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-700/50 mb-2">
              <p className="text-sm text-slate-700 dark:text-slate-200 mb-1">{m.text}</p>
              <p className="text-xs text-slate-400 mb-2 flex items-center gap-1"><Calendar className="w-3 h-3" /> {new Date(m.scheduled_for).toLocaleString()}</p>
              <div className="flex gap-2">
                <button onClick={() => handleSendNow(m)} className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-teal-500 text-white text-xs hover:opacity-90 transition"><Send className="w-3 h-3" /> Send now</button>
                <button onClick={() => handleEdit(m)} className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-200 dark:bg-slate-600 text-slate-600 dark:text-slate-200 text-xs hover:opacity-90 transition"><Edit2 className="w-3 h-3" /> Edit</button>
                <button onClick={() => handleDelete(m.id)} className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 text-xs transition"><Trash2 className="w-3 h-3" /> Cancel</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
