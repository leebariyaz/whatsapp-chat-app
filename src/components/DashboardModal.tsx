import { useEffect, useState } from 'react';
import { X, MessageCircle, Send, Users, HardDrive, TrendingUp, Activity, Calendar, Image, FileText, Mic } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import type { Conversation, Profile } from '@/types';
import Avatar from '@/components/Avatar';

interface DashboardModalProps {
  conversations: Conversation[];
  participants: Record<string, Profile>;
  onClose: () => void;
}

export default function DashboardModal({ conversations, participants, onClose }: DashboardModalProps) {
  const { profile } = useAuth();
  const [stats, setStats] = useState({ totalMessages: 0, totalChats: 0, mostContacted: '', mostContactedCount: 0, weeklyActivity: 0, mediaCount: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile) return;
    (async () => {
      const { data: myConvos } = await supabase.from('conversation_participants').select('conversation_id').eq('user_id', profile.id);
      const convoIds = (myConvos ?? []).map((c) => c.conversation_id);

      let totalMessages = 0;
      const contactCounts: Record<string, number> = {};
      let mediaCount = 0;

      for (const cid of convoIds) {
        const { count } = await supabase.from('messages').select('*', { count: 'exact', head: true }).eq('conversation_id', cid);
        totalMessages += count ?? 0;

        const { data: mediaMsgs } = await supabase.from('messages').select('media_type').eq('conversation_id', cid).not('media_type', 'is', null);
        mediaCount += mediaMsgs?.length ?? 0;

        const convo = conversations.find((c) => c.id === cid);
        if (convo && !convo.is_self) {
          const other = convo.participants.find((p) => p.id !== profile.id);
          if (other) contactCounts[other.full_name] = (contactCounts[other.full_name] ?? 0) + (count ?? 0);
        }
      }

      const mostContacted = Object.entries(contactCounts).sort((a, b) => b[1] - a[1])[0];
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

      let weeklyActivity = 0;
      if (convoIds.length) {
        const { count: weekCount } = await supabase.from('messages').select('*', { count: 'exact', head: true }).in('conversation_id', convoIds).gte('created_at', weekAgo);
        weeklyActivity = weekCount ?? 0;
      }

      setStats({
        totalMessages,
        totalChats: conversations.filter((c) => !c.is_self).length,
        mostContacted: mostContacted?.[0] ?? 'No one yet',
        mostContactedCount: mostContacted?.[1] ?? 0,
        weeklyActivity,
        mediaCount,
      });
      setLoading(false);
    })();
  }, [profile, conversations]);

  const statCards = [
    { icon: <MessageCircle className="w-5 h-5" />, label: 'Total Chats', value: stats.totalChats, color: 'from-teal-500 to-cyan-500' },
    { icon: <Send className="w-5 h-5" />, label: 'Total Messages', value: stats.totalMessages, color: 'from-blue-500 to-indigo-500' },
    { icon: <Activity className="w-5 h-5" />, label: 'This Week', value: stats.weeklyActivity, color: 'from-emerald-500 to-green-500' },
    { icon: <HardDrive className="w-5 h-5" />, label: 'Media Shared', value: stats.mediaCount, color: 'from-amber-500 to-orange-500' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="w-full max-w-lg bg-white dark:bg-slate-800 rounded-2xl shadow-2xl overflow-hidden max-h-[85vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-700">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-white">Your Dashboard</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {loading ? (
            <div className="flex justify-center py-12"><div className="w-6 h-6 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" /></div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3 mb-6">
                {statCards.map((s) => (
                  <div key={s.label} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-700/50 border border-slate-100 dark:border-slate-700">
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center text-white mb-2`}>
                      {s.icon}
                    </div>
                    <p className="text-2xl font-bold text-slate-800 dark:text-white">{s.value}</p>
                    <p className="text-xs text-slate-400">{s.label}</p>
                  </div>
                ))}
              </div>

              <div className="p-4 rounded-2xl bg-gradient-to-br from-teal-50 to-blue-50 dark:from-slate-700 dark:to-slate-700/50 border border-teal-100 dark:border-slate-600">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-4 h-4 text-teal-500" />
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-200">Most Contacted</p>
                </div>
                <p className="text-lg font-semibold text-slate-800 dark:text-white">{stats.mostContacted}</p>
                <p className="text-xs text-slate-400">{stats.mostContactedCount} messages exchanged</p>
              </div>

              <div className="mt-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-700/50 border border-slate-100 dark:border-slate-700">
                <div className="flex items-center gap-2 mb-3">
                  <Calendar className="w-4 h-4 text-blue-500" />
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-200">Weekly Activity</p>
                </div>
                <div className="flex items-end gap-1.5 h-24">
                  {Array.from({ length: 7 }).map((_, i) => {
                    const height = i === 2 || i === 4 ? 60 : i === 5 ? 80 : i === 3 ? 40 : 30;
                    return <div key={i} className="flex-1 rounded-t-lg bg-gradient-to-t from-teal-400 to-blue-400" style={{ height: `${height}%` }} />;
                  })}
                </div>
                <div className="flex justify-between mt-1 text-xs text-slate-400">
                  {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => <span key={i}>{d}</span>)}
                </div>
              </div>

              <div className="mt-4 grid grid-cols-3 gap-3">
                <div className="text-center p-3 rounded-xl bg-slate-50 dark:bg-slate-700/50">
                  <Image className="w-5 h-5 text-blue-400 mx-auto mb-1" />
                  <p className="text-xs text-slate-400">Photos</p>
                </div>
                <div className="text-center p-3 rounded-xl bg-slate-50 dark:bg-slate-700/50">
                  <FileText className="w-5 h-5 text-emerald-400 mx-auto mb-1" />
                  <p className="text-xs text-slate-400">Documents</p>
                </div>
                <div className="text-center p-3 rounded-xl bg-slate-50 dark:bg-slate-700/50">
                  <Mic className="w-5 h-5 text-amber-400 mx-auto mb-1" />
                  <p className="text-xs text-slate-400">Voice Notes</p>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
