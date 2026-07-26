import { useState, useEffect } from 'react';
import { X, BarChart3, Calendar, CheckSquare, Bell, Clock, Plus, Trash2, Check, Loader2, MapPin } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import type { Poll, PollOption, ChatEvent, Todo, Profile } from '@/types';
import Avatar from '@/components/Avatar';

interface ChatToolsModalProps {
  conversationId: string;
  participants: Record<string, Profile>;
  onClose: () => void;
}

type Tab = 'poll' | 'event' | 'todo' | 'reminder';

export default function ChatToolsModal({ conversationId, participants, onClose }: ChatToolsModalProps) {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [tab, setTab] = useState<Tab>('poll');

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: 'poll', label: 'Poll', icon: <BarChart3 className="w-4 h-4" /> },
    { key: 'event', label: 'Event', icon: <Calendar className="w-4 h-4" /> },
    { key: 'todo', label: 'To-Do', icon: <CheckSquare className="w-4 h-4" /> },
    { key: 'reminder', label: 'Reminder', icon: <Bell className="w-4 h-4" /> },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-2xl shadow-2xl overflow-hidden max-h-[85vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-700">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-white">Chat Tools</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex border-b border-slate-100 dark:border-slate-700">
          {tabs.map((t) => (
            <button key={t.key} onClick={() => setTab(t.key)} className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-sm font-medium ${tab === t.key ? 'text-teal-500 border-b-2 border-teal-500' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'}`}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {tab === 'poll' && <PollCreator conversationId={conversationId} onClose={onClose} />}
          {tab === 'event' && <EventCreator conversationId={conversationId} onClose={onClose} />}
          {tab === 'todo' && <TodoManager conversationId={conversationId} participants={participants} onClose={onClose} />}
          {tab === 'reminder' && <ReminderCreator conversationId={conversationId} onClose={onClose} />}
        </div>
      </div>
    </div>
  );
}

// ============ POLL CREATOR ============
function PollCreator({ conversationId, onClose }: { conversationId: string; onClose: () => void }) {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '']);
  const [anonymous, setAnonymous] = useState(false);
  const [multipleChoice, setMultipleChoice] = useState(false);
  const [creating, setCreating] = useState(false);

  const addOption = () => setOptions((o) => [...o, '']);
  const removeOption = (i: number) => setOptions((o) => o.filter((_, idx) => idx !== i));
  const updateOption = (i: number, val: string) => setOptions((o) => o.map((v, idx) => idx === i ? val : v));

  const handleCreate = async () => {
    if (!profile || !question.trim()) { toast('Enter a question', 'error'); return; }
    const validOptions = options.filter((o) => o.trim());
    if (validOptions.length < 2) { toast('Add at least 2 options', 'error'); return; }
    setCreating(true);
    try {
      const { data: poll, error } = await supabase.from('polls').insert({
        conversation_id: conversationId,
        created_by: profile.id,
        question: question.trim(),
        anonymous,
        multiple_choice: multipleChoice,
      }).select('id').single();
      if (error) throw error;

      const optRows = validOptions.map((text, i) => ({ poll_id: poll.id, text, sort_order: i }));
      const { error: optErr } = await supabase.from('poll_options').insert(optRows);
      if (optErr) throw optErr;

      // Send a message referencing the poll
      await supabase.from('messages').insert({
        conversation_id: conversationId,
        sender_id: profile.id,
        text: `📊 Poll: ${question.trim()}`,
      });

      toast('Poll created', 'success');
      onClose();
    } catch (err) {
      console.error(err);
      toast('Failed to create poll', 'error');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1.5">Question</label>
        <input type="text" value={question} onChange={(e) => setQuestion(e.target.value)} placeholder="What's everyone's favorite?" className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white text-sm focus:outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-100 dark:focus:ring-teal-900 transition" />
      </div>
      <div className="space-y-2">
        {options.map((opt, i) => (
          <div key={i} className="flex items-center gap-2">
            <input type="text" value={opt} onChange={(e) => updateOption(i, e.target.value)} placeholder={`Option ${i + 1}`} className="flex-1 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white text-sm focus:outline-none focus:border-teal-400 transition" />
            {options.length > 2 && <button onClick={() => removeOption(i)} className="p-1.5 text-slate-400 hover:text-rose-500"><Trash2 className="w-4 h-4" /></button>}
          </div>
        ))}
        <button onClick={addOption} className="flex items-center gap-1.5 text-sm text-teal-500 hover:text-teal-600"><Plus className="w-4 h-4" /> Add option</button>
      </div>
      <div className="space-y-2">
        <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300"><input type="checkbox" checked={anonymous} onChange={(e) => setAnonymous(e.target.checked)} className="accent-teal-500" /> Anonymous poll</label>
        <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300"><input type="checkbox" checked={multipleChoice} onChange={(e) => setMultipleChoice(e.target.checked)} className="accent-teal-500" /> Allow multiple choices</label>
      </div>
      <button onClick={handleCreate} disabled={creating} className="w-full py-2.5 rounded-xl bg-gradient-to-r from-teal-500 to-blue-500 text-white font-medium hover:opacity-90 disabled:opacity-50 transition flex items-center justify-center gap-2">
        {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <BarChart3 className="w-4 h-4" />}
        Create Poll
      </button>
    </div>
  );
}

// ============ EVENT CREATOR ============
function EventCreator({ conversationId, onClose }: { conversationId: string; onClose: () => void }) {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [location, setLocation] = useState('');
  const [creating, setCreating] = useState(false);

  const handleCreate = async () => {
    if (!profile || !title.trim() || !date || !time) { toast('Fill in title, date and time', 'error'); return; }
    setCreating(true);
    try {
      const eventDate = new Date(`${date}T${time}`).toISOString();
      const { error } = await supabase.from('events').insert({
        conversation_id: conversationId,
        created_by: profile.id,
        title: title.trim(),
        description: description.trim() || null,
        event_date: eventDate,
        location: location.trim() || null,
      });
      if (error) throw error;
      toast('Event created', 'success');
      onClose();
    } catch (err) {
      console.error(err);
      toast('Failed to create event', 'error');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1.5">Event Title</label>
        <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Team Meeting" className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white text-sm focus:outline-none focus:border-teal-400 transition" />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1.5">Description</label>
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} placeholder="What's this about?" className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white text-sm focus:outline-none focus:border-teal-400 transition resize-none" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1.5">Date</label>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white text-sm focus:outline-none focus:border-teal-400 transition" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1.5">Time</label>
          <input type="time" value={time} onChange={(e) => setTime(e.target.value)} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white text-sm focus:outline-none focus:border-teal-400 transition" />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1.5">Location</label>
        <div className="relative">
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input type="text" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Conference Room A" className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white text-sm focus:outline-none focus:border-teal-400 transition" />
        </div>
      </div>
      <button onClick={handleCreate} disabled={creating} className="w-full py-2.5 rounded-xl bg-gradient-to-r from-teal-500 to-blue-500 text-white font-medium hover:opacity-90 disabled:opacity-50 transition flex items-center justify-center gap-2">
        {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Calendar className="w-4 h-4" />}
        Create Event
      </button>
    </div>
  );
}

// ============ TODO MANAGER ============
function TodoManager({ conversationId, participants, onClose }: { conversationId: string; participants: Record<string, Profile>; onClose: () => void }) {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [todos, setTodos] = useState<Todo[]>([]);
  const [title, setTitle] = useState('');
  const [assignTo, setAssignTo] = useState('');
  const [loading, setLoading] = useState(true);

  const loadTodos = async () => {
    const { data } = await supabase.from('todos').select('*').eq('conversation_id', conversationId).order('created_at', { ascending: false });
    setTodos((data ?? []) as Todo[]);
    setLoading(false);
  };

  useEffect(() => { loadTodos(); }, [conversationId]);

  const addTodo = async () => {
    if (!profile || !title.trim()) return;
    const { data, error } = await supabase.from('todos').insert({
      conversation_id: conversationId,
      created_by: profile.id,
      title: title.trim(),
      assigned_to: assignTo || null,
    }).select('*').single();
    if (error) { toast('Failed to add task', 'error'); return; }
    setTodos((prev) => [data as Todo, ...prev]);
    setTitle('');
    setAssignTo('');
  };

  const toggleTodo = async (todo: Todo) => {
    const completed = !todo.completed;
    await supabase.from('todos').update({ completed, completed_at: completed ? new Date().toISOString() : null }).eq('id', todo.id);
    setTodos((prev) => prev.map((t) => t.id === todo.id ? { ...t, completed, completed_at: completed ? new Date().toISOString() : null } : t));
  };

  const deleteTodo = async (id: string) => {
    await supabase.from('todos').delete().eq('id', id);
    setTodos((prev) => prev.filter((t) => t.id !== id));
  };

  const participantList = Object.values(participants).filter((p) => p.id !== profile?.id);

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="New task..." className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white text-sm focus:outline-none focus:border-teal-400 transition" />
        <select value={assignTo} onChange={(e) => setAssignTo(e.target.value)} className="px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white text-sm">
          <option value="">Unassigned</option>
          {participantList.map((p) => <option key={p.id} value={p.id}>{p.full_name}</option>)}
        </select>
        <button onClick={addTodo} className="p-2.5 rounded-xl bg-teal-500 text-white hover:opacity-90 transition"><Plus className="w-5 h-5" /></button>
      </div>

      {loading && <div className="flex justify-center py-4"><Loader2 className="w-5 h-5 text-slate-400 animate-spin" /></div>}

      <div className="space-y-2">
        {todos.map((t) => {
          const assignee = t.assigned_to ? participants[t.assigned_to] : null;
          return (
            <div key={t.id} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-700/50">
              <button onClick={() => toggleTodo(t)} className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 ${t.completed ? 'bg-teal-500 border-teal-500' : 'border-slate-300 dark:border-slate-600'}`}>
                {t.completed && <Check className="w-3 h-3 text-white" />}
              </button>
              <div className="flex-1 min-w-0">
                <p className={`text-sm ${t.completed ? 'line-through text-slate-400' : 'text-slate-700 dark:text-slate-200'}`}>{t.title}</p>
                {assignee && <p className="text-xs text-slate-400">Assigned to {assignee.full_name}</p>}
              </div>
              <button onClick={() => deleteTodo(t.id)} className="p-1 text-slate-400 hover:text-rose-500"><Trash2 className="w-4 h-4" /></button>
            </div>
          );
        })}
        {!loading && todos.length === 0 && <p className="text-center text-sm text-slate-400 py-4">No tasks yet</p>}
      </div>
    </div>
  );
}

// ============ REMINDER CREATOR ============
function ReminderCreator({ conversationId, onClose }: { conversationId: string; onClose: () => void }) {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [creating, setCreating] = useState(false);

  const handleCreate = async () => {
    if (!profile || !title.trim() || !date || !time) { toast('Fill in all fields', 'error'); return; }
    setCreating(true);
    try {
      const remindAt = new Date(`${date}T${time}`).toISOString();
      const { error } = await supabase.from('reminders').insert({
        user_id: profile.id,
        conversation_id: conversationId,
        title: title.trim(),
        remind_at: remindAt,
      });
      if (error) throw error;
      toast('Reminder set', 'success');
      onClose();
    } catch (err) {
      console.error(err);
      toast('Failed to set reminder', 'error');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-4">
    <div>
      <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1.5">Reminder Title</label>
      <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Follow up with team" className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white text-sm focus:outline-none focus:border-teal-400 transition" />
    </div>
    <div className="grid grid-cols-2 gap-3">
      <div>
        <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1.5">Date</label>
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white text-sm focus:outline-none focus:border-teal-400 transition" />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1.5">Time</label>
        <input type="time" value={time} onChange={(e) => setTime(e.target.value)} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white text-sm focus:outline-none focus:border-teal-400 transition" />
      </div>
    </div>
    <div className="flex items-center gap-2 text-sm text-slate-400">
      <Clock className="w-4 h-4" />
      You'll get a browser notification at the scheduled time
    </div>
    <button onClick={handleCreate} disabled={creating} className="w-full py-2.5 rounded-xl bg-gradient-to-r from-teal-500 to-blue-500 text-white font-medium hover:opacity-90 disabled:opacity-50 transition flex items-center justify-center gap-2">
      {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Bell className="w-4 h-4" />}
      Set Reminder
    </button>
  </div>
  );
}
