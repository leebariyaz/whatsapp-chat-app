import { useEffect, useState } from 'react';
import { X, UserPlus, Check, XCircle, Loader2, Users, Clock } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import type { FriendRequest, Profile } from '@/types';
import Avatar from '@/components/Avatar';

interface FriendRequestsModalProps {
  onClose: () => void;
  onAccept: (userId: string) => void;
}

export default function FriendRequestsModal({ onClose, onAccept }: FriendRequestsModalProps) {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [requests, setRequests] = useState<FriendRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);

  const loadRequests = async () => {
    if (!profile) return;
    const { data, error } = await supabase
      .from('friend_requests')
      .select('id, sender_id, receiver_id, status, created_at, responded_at, sender:profiles!friend_requests_sender_id_fkey(id, username, full_name, avatar_url, bio, phone, last_seen, created_at, is_verified, is_official)')
      .eq('receiver_id', profile.id)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });
    if (error) console.error(error);
    setRequests((data ?? []) as unknown as FriendRequest[]);
    setLoading(false);
  };

  useEffect(() => { loadRequests(); }, [profile]);

  const accept = async (req: FriendRequest) => {
    if (!profile) return;
    setProcessing(req.id);
    try {
      await supabase.from('friend_requests').update({ status: 'accepted', responded_at: new Date().toISOString() }).eq('id', req.id);
      await supabase.from('friends').insert([
        { user_id: profile.id, friend_id: req.sender_id },
        { user_id: req.sender_id, friend_id: profile.id },
      ]);
      setRequests((prev) => prev.filter((r) => r.id !== req.id));
      toast('Friend request accepted', 'success');
      onAccept(req.sender_id);
    } catch (err) {
      console.error(err);
      toast('Failed to accept request', 'error');
    } finally {
      setProcessing(null);
    }
  };

  const decline = async (req: FriendRequest) => {
    setProcessing(req.id);
    try {
      await supabase.from('friend_requests').update({ status: 'declined', responded_at: new Date().toISOString() }).eq('id', req.id);
      setRequests((prev) => prev.filter((r) => r.id !== req.id));
      toast('Request declined', 'success');
    } catch (err) {
      console.error(err);
    } finally {
      setProcessing(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-2xl shadow-2xl overflow-hidden max-h-[80vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-700">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-white">Friend Requests</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          {loading && <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 text-slate-400 animate-spin" /></div>}
          {!loading && requests.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Users className="w-10 h-10 text-slate-300 dark:text-slate-600 mb-2" />
              <p className="text-slate-400 text-sm">No pending requests</p>
            </div>
          )}
          {requests.map((req) => {
            const sender = req.sender as unknown as Profile;
            return (
              <div key={req.id} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition">
                <Avatar src={sender?.avatar_url} name={sender?.full_name ?? 'Unknown'} id={sender?.id ?? 'x'} size="md" verified={sender?.is_verified} />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-slate-800 dark:text-white truncate">{sender?.full_name}</p>
                  <p className="text-sm text-slate-400 truncate">@{sender?.username}</p>
                </div>
                <button onClick={() => accept(req)} disabled={processing === req.id} className="p-2 rounded-lg bg-teal-500 text-white hover:opacity-90 disabled:opacity-50 transition">
                  {processing === req.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                </button>
                <button onClick={() => decline(req)} disabled={processing === req.id} className="p-2 rounded-lg text-slate-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition">
                  <XCircle className="w-4 h-4" />
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// Hook to check if two users are friends
export async function checkFriendship(userId: string, otherId: string): Promise<boolean> {
  const { data } = await supabase.from('friends').select('user_id').eq('user_id', userId).eq('friend_id', otherId).maybeSingle();
  return !!data;
}

// Send a friend request
export async function sendFriendRequest(senderId: string, receiverId: string): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase.from('friend_requests').insert({ sender_id: senderId, receiver_id: receiverId });
  if (error) return { success: false, error: error.message };
  return { success: true };
}
