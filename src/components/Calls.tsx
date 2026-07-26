import { useEffect, useState } from 'react';
import { Phone, Video, X, PhoneMissed, PhoneOutgoing, PhoneIncoming, Loader2, Mic } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import type { Call, Conversation, Profile } from '@/types';
import Avatar from '@/components/Avatar';

interface CallModalProps {
  conversation: Conversation | null;
  callType: 'voice' | 'video';
  onClose: () => void;
  participants: Record<string, Profile>;
}

export function CallModal({ conversation, callType, onClose, participants }: CallModalProps) {
  const { profile } = useAuth();
  const [status, setStatus] = useState<'calling' | 'connected' | 'ended'>('calling');
  const [duration, setDuration] = useState(0);
  const otherUser = conversation?.participants.find((p) => p.id !== profile?.id);

  useEffect(() => {
    if (!conversation || !profile) return;
    // Log the call
    supabase.from('calls').insert({
      conversation_id: conversation.id,
      caller_id: profile.id,
      call_type: callType,
      status: 'initiated',
    }).then(({ data }) => {
      if (data) setStatus('connected');
    });

    // Simulate connection after 2s
    const t = setTimeout(() => setStatus('connected'), 2000);
    return () => clearTimeout(t);
  }, [conversation, profile, callType]);

  useEffect(() => {
    if (status === 'connected') {
      const interval = setInterval(() => setDuration((d) => d + 1), 1000);
      return () => clearInterval(interval);
    }
  }, [status]);

  const handleEnd = () => {
    setStatus('ended');
    setTimeout(onClose, 300);
  };

  if (!conversation) return null;

  const formatDuration = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-[60] bg-gradient-to-br from-slate-900 via-blue-950 to-emerald-950 flex flex-col items-center justify-between p-8">
      <div className="flex flex-col items-center mt-12">
        <Avatar src={otherUser?.avatar_url} name={otherUser?.full_name ?? 'Unknown'} id={otherUser?.id ?? 'x'} size="lg" verified={otherUser?.is_verified} />
        <h2 className="text-white text-xl font-semibold mt-4">{otherUser?.full_name ?? 'Unknown'}</h2>
        <p className="text-white/60 text-sm mt-1">
          {status === 'calling' ? `${callType === 'video' ? 'Video' : 'Voice'} calling...` : status === 'connected' ? formatDuration(duration) : 'Call ended'}
        </p>
      </div>

      {callType === 'video' && status === 'connected' && (
        <div className="flex-1 flex items-center justify-center w-full">
          <div className="w-full max-w-md aspect-video rounded-2xl bg-slate-800 flex items-center justify-center">
            <p className="text-white/40 text-sm">Video stream</p>
          </div>
        </div>
      )}

      <div className="flex items-center gap-6 mb-8">
        {status === 'connected' && (
          <>
            <button className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition">
              <Mic className="w-5 h-5" />
            </button>
            {callType === 'video' && (
              <button className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition">
                <Video className="w-5 h-5" />
              </button>
            )}
          </>
        )}
        <button onClick={handleEnd} className="w-16 h-16 rounded-full bg-rose-500 flex items-center justify-center text-white hover:bg-rose-600 transition shadow-lg">
          <Phone className="w-7 h-7 rotate-[135deg]" />
        </button>
      </div>
    </div>
  );
}

interface CallHistoryProps {
  conversationId: string;
  participants: Record<string, Profile>;
}

export function CallHistory({ conversationId, participants }: CallHistoryProps) {
  const { profile } = useAuth();
  const [calls, setCalls] = useState<Call[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from('calls')
      .select('id, conversation_id, caller_id, call_type, status, started_at, ended_at, duration')
      .eq('conversation_id', conversationId)
      .order('started_at', { ascending: false })
      .limit(20)
      .then(({ data }) => {
        setCalls((data ?? []) as Call[]);
        setLoading(false);
      });
  }, [conversationId]);

  if (loading) return <div className="flex justify-center py-4"><Loader2 className="w-5 h-5 text-slate-400 animate-spin" /></div>;
  if (calls.length === 0) return null;

  return (
    <div className="space-y-1">
      {calls.map((call) => {
        const isOutgoing = call.caller_id === profile?.id;
        const isMissed = call.status === 'missed';
        return (
          <div key={call.id} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isMissed ? 'bg-rose-100 dark:bg-rose-900/30' : 'bg-blue-100 dark:bg-blue-900/30'}`}>
              {isMissed ? <PhoneMissed className="w-5 h-5 text-rose-500" /> : isOutgoing ? <PhoneOutgoing className="w-5 h-5 text-blue-500" /> : <PhoneIncoming className="w-5 h-5 text-blue-500" />}
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
                {call.call_type === 'video' ? 'Video' : 'Voice'} call {isOutgoing ? 'outgoing' : 'incoming'}
              </p>
              <p className="text-xs text-slate-400">
                {new Date(call.started_at).toLocaleString()} {call.duration ? `· ${Math.round(call.duration)}s` : ''}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
