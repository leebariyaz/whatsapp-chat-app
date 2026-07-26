import { useCallback, useEffect, useMemo, useState } from 'react';
import Sidebar from '@/components/Sidebar';
import ChatArea from '@/components/ChatArea';
import AuthPage from '@/components/AuthPage';
import ProfileModal from '@/components/ProfileModal';
import NewChatModal from '@/components/NewChatModal';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { supabase } from '@/lib/supabase';
import type { Conversation, Message, Profile } from '@/types';

function ChatApp() {
  const { session, profile, loading } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingConvos, setLoadingConvos] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [participants, setParticipants] = useState<Record<string, Profile>>({});
  const [typingUserIds, setTypingUserIds] = useState<string[]>([]);
  const [showProfile, setShowProfile] = useState(false);
  const [showNewChat, setShowNewChat] = useState(false);

  const activeConversation = useMemo(
    () => conversations.find((c) => c.id === activeId) ?? null,
    [conversations, activeId]
  );

  // Load conversations
  const loadConversations = useCallback(async () => {
    if (!profile) return;
    setLoadingConvos(true);
    try {
      const { data: parts, error } = await supabase
        .from('conversation_participants')
        .select('conversation_id, pinned, conversation:conversations(id, is_group, created_at)')
        .eq('user_id', profile.id);
      if (error) throw error;

      const convoList: Conversation[] = [];
      const allUserIds = new Set<string>();

      for (const p of parts ?? []) {
        const c = (p as unknown as { conversation: Conversation }).conversation;
        const { data: cpRows } = await supabase
          .from('conversation_participants')
          .select('user_id, pinned')
          .eq('conversation_id', c.id);
        const userIds = (cpRows ?? []).map((r) => r.user_id);
        userIds.forEach((id) => allUserIds.add(id));

        const { data: profRows } = await supabase
          .from('profiles')
          .select('id, username, full_name, avatar_url, bio, last_seen, created_at')
          .in('id', userIds);
        const profs = (profRows ?? []) as Profile[];
        const myPinned = (cpRows ?? []).find((r) => r.user_id === profile.id)?.pinned ?? false;

        const { data: lastMsgRow } = await supabase
          .from('messages')
          .select('id, conversation_id, sender_id, text, media_url, media_type, media_name, reply_to_id, edited_at, deleted_for_everyone, created_at')
          .eq('conversation_id', c.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        // Unread count: messages not sent by me and not in message_reads for me
        const { data: allConvoMsgs } = await supabase
          .from('messages')
          .select('id, sender_id')
          .eq('conversation_id', c.id)
          .neq('sender_id', profile.id);
        const otherMsgIds = (allConvoMsgs ?? []).map((m) => m.id);
        let unread = 0;
        if (otherMsgIds.length) {
          const { data: readRows } = await supabase
            .from('message_reads')
            .select('message_id')
            .eq('user_id', profile.id)
            .in('message_id', otherMsgIds);
          const readSet = new Set((readRows ?? []).map((r) => r.message_id));
          unread = otherMsgIds.filter((id) => !readSet.has(id)).length;
        }

        convoList.push({
          ...c,
          participants: profs,
          last_message: lastMsgRow as Message | undefined,
          unread_count: unread,
          pinned: myPinned,
        });
      }

      setConversations(convoList);

      // Cache all participant profiles
      const { data: allProfs } = await supabase
        .from('profiles')
        .select('id, username, full_name, avatar_url, bio, last_seen, created_at')
        .in('id', Array.from(allUserIds));
      const profMap: Record<string, Profile> = {};
      (allProfs ?? []).forEach((p) => { profMap[p.id] = p as Profile; });
      setParticipants(profMap);
    } catch (err) {
      console.error('Failed to load conversations', err);
    } finally {
      setLoadingConvos(false);
    }
  }, [profile]);

  useEffect(() => {
    if (profile) loadConversations();
  }, [profile, loadConversations]);

  // Load messages for active conversation
  const loadMessages = useCallback(async () => {
    if (!activeId || !profile) return;
    setLoadingMessages(true);
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('id, conversation_id, sender_id, text, media_url, media_type, media_name, reply_to_id, edited_at, deleted_for_everyone, created_at')
        .eq('conversation_id', activeId)
        .order('created_at', { ascending: true });
      if (error) throw error;
      const msgList = (data ?? []) as Message[];

      // Filter out hidden messages
      const { data: hidden } = await supabase
        .from('message_hidden')
        .select('message_id')
        .eq('user_id', profile.id);
      const hiddenSet = new Set((hidden ?? []).map((h) => h.message_id));
      const visible = msgList.filter((m) => !hiddenSet.has(m.id));

      // Load read receipts
      const { data: reads } = await supabase
        .from('message_reads')
        .select('message_id, user_id')
        .in('message_id', visible.map((m) => m.id));
      const readMap: Record<string, string[]> = {};
      (reads ?? []).forEach((r) => {
        if (!readMap[r.message_id]) readMap[r.message_id] = [];
        readMap[r.message_id].push(r.user_id);
      });
      const withReads = visible.map((m) => ({ ...m, read_by: readMap[m.id] ?? [] }));

      setMessages(withReads);
    } catch (err) {
      console.error('Failed to load messages', err);
    } finally {
      setLoadingMessages(false);
    }
  }, [activeId, profile]);

  useEffect(() => {
    if (activeId) loadMessages();
    else setMessages([]);
  }, [activeId, loadMessages]);

  // Real-time: new messages in active conversation
  useEffect(() => {
    if (!activeId || !profile) return;
    const channel = supabase
      .channel(`messages:${activeId}`)
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${activeId}` },
        (payload) => {
          const newMsg = payload.new as Message;
          setMessages((prev) => {
            if (prev.find((m) => m.id === newMsg.id)) return prev;
            return [...prev, { ...newMsg, read_by: [] }];
          });
        }
      )
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'messages', filter: `conversation_id=eq.${activeId}` },
        (payload) => {
          const updated = payload.new as Message;
          setMessages((prev) => prev.map((m) => (m.id === updated.id ? { ...m, ...updated } : m)));
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [activeId, profile]);

  // Real-time: typing status
  useEffect(() => {
    if (!activeId || !profile) return;
    const channel = supabase
      .channel(`typing:${activeId}`)
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'typing_status', filter: `conversation_id=eq.${activeId}` },
        (payload) => {
          const row = (payload.new ?? payload.old) as { user_id: string; is_typing: boolean };
          setTypingUserIds((prev) => {
            if (row.is_typing) return prev.includes(row.user_id) ? prev : [...prev, row.user_id];
            return prev.filter((id) => id !== row.user_id);
          });
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [activeId, profile]);

  // Real-time: conversation list updates (new messages, new conversations)
  useEffect(() => {
    if (!profile) return;
    const channel = supabase
      .channel('conversations-update')
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        () => { loadConversations(); }
      )
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'messages' },
        () => { loadConversations(); }
      )
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'conversation_participants', filter: `user_id=eq.${profile.id}` },
        () => { loadConversations(); }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [profile, loadConversations]);

  // Update last_seen periodically
  useEffect(() => {
    if (!profile) return;
    const update = () => supabase.from('profiles').update({ last_seen: new Date().toISOString() }).eq('id', profile.id);
    update();
    const interval = setInterval(update, 60000);
    return () => clearInterval(interval);
  }, [profile]);

  // Browser notifications
  useEffect(() => {
    if (!('Notification' in window)) return;
    if (Notification.permission === 'default') Notification.requestPermission();
  }, []);

  // Send message
  const handleSendMessage = async (payload: { text?: string; mediaUrl?: string; mediaType?: string; mediaName?: string; replyToId?: string }) => {
    if (!profile || !activeId) return;
    const { data, error } = await supabase
      .from('messages')
      .insert({
        conversation_id: activeId,
        sender_id: profile.id,
        text: payload.text ?? null,
        media_url: payload.mediaUrl ?? null,
        media_type: payload.mediaType ?? null,
        media_name: payload.mediaName ?? null,
        reply_to_id: payload.replyToId ?? null,
      })
      .select('id, conversation_id, sender_id, text, media_url, media_type, media_name, reply_to_id, edited_at, deleted_for_everyone, created_at')
      .single();
    if (error) { console.error('Send failed', error); return; }
    setMessages((prev) => [...prev, { ...(data as Message), read_by: [] }]);
  };

  const handleEditMessage = async (message: Message, newText: string) => {
    const { error } = await supabase
      .from('messages')
      .update({ text: newText, edited_at: new Date().toISOString() })
      .eq('id', message.id);
    if (error) { console.error('Edit failed', error); return; }
    setMessages((prev) => prev.map((m) => (m.id === message.id ? { ...m, text: newText, edited_at: new Date().toISOString() } : m)));
  };

  const handleDeleteForMe = async (message: Message) => {
    if (!profile) return;
    const { error } = await supabase.from('message_hidden').insert({ message_id: message.id, user_id: profile.id });
    if (error) { console.error('Delete for me failed', error); return; }
    setMessages((prev) => prev.filter((m) => m.id !== message.id));
  };

  const handleDeleteForEveryone = async (message: Message) => {
    const { error } = await supabase
      .from('messages')
      .update({ deleted_for_everyone: true, text: null, media_url: null, media_type: null, media_name: null })
      .eq('id', message.id);
    if (error) { console.error('Delete for everyone failed', error); return; }
    setMessages((prev) => prev.map((m) => (m.id === message.id ? { ...m, deleted_for_everyone: true, text: null, media_url: null, media_type: null, media_name: null } : m)));
  };

  const handleMarkRead = async (msgs: Message[]) => {
    if (!profile) return;
    const rows = msgs.map((m) => ({ message_id: m.id, user_id: profile.id }));
    if (!rows.length) return;
    const { error } = await supabase.from('message_reads').upsert(rows, { onConflict: 'message_id,user_id' });
    if (error) console.error('Mark read failed', error);
    setMessages((prev) => prev.map((m) => msgs.find((x) => x.id === m.id) ? { ...m, read_by: [...(m.read_by ?? []), profile.id] } : m));
  };

  const handleSetTyping = async (isTyping: boolean) => {
    if (!profile || !activeId) return;
    const { error } = await supabase
      .from('typing_status')
      .upsert({ conversation_id: activeId, user_id: profile.id, is_typing: isTyping, updated_at: new Date().toISOString() }, { onConflict: 'conversation_id,user_id' });
    if (error) console.error('Typing update failed', error);
  };

  // Browser notification on new incoming message
  useEffect(() => {
    if (!profile || !activeConversation) return;
    const last = messages[messages.length - 1];
    if (!last || last.sender_id === profile.id) return;
    if (Notification.permission === 'granted' && document.hidden) {
      const sender = participants[last.sender_id];
      new Notification(`New message from ${sender?.full_name ?? 'Unknown'}`, {
        body: last.text ?? (last.media_type === 'image' ? 'Sent a photo' : 'Sent a document'),
      });
    }
  }, [messages.length, profile, activeConversation, participants]);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-100 dark:bg-slate-900">
        <p className="text-slate-400">Loading...</p>
      </div>
    );
  }

  if (!session || !profile) {
    return <AuthPage />;
  }

  return (
    <div className="h-screen flex bg-slate-100 dark:bg-slate-900 overflow-hidden">
      <div className={`${activeId ? 'hidden md:flex' : 'flex'} w-full md:w-auto`}>
        <Sidebar
          conversations={conversations}
          activeId={activeId}
          loading={loadingConvos}
          onSelect={setActiveId}
          onNewChat={() => setShowNewChat(true)}
        />
      </div>
      <div className={`${activeId ? 'flex' : 'hidden md:flex'} flex-1`}>
        <ChatArea
          conversation={activeConversation}
          messages={messages}
          loadingMessages={loadingMessages}
          participants={participants}
          typingUserIds={typingUserIds}
          onBack={() => setActiveId(null)}
          onSendMessage={handleSendMessage}
          onEditMessage={handleEditMessage}
          onDeleteForMe={handleDeleteForMe}
          onDeleteForEveryone={handleDeleteForEveryone}
          onMarkRead={handleMarkRead}
          onSetTyping={handleSetTyping}
        />
      </div>

      {showProfile && <ProfileModal onClose={() => setShowProfile(false)} />}
      {showNewChat && (
        <NewChatModal
          onClose={() => setShowNewChat(false)}
          onChatCreated={(id) => { setShowNewChat(false); setActiveId(id); loadConversations(); }}
        />
      )}

      {/* Profile button floating */}
      <button
        onClick={() => setShowProfile(true)}
        className="fixed bottom-4 left-4 z-40 p-3 rounded-full bg-white dark:bg-slate-800 shadow-lg border border-slate-100 dark:border-slate-700 hover:scale-105 transition"
        title="My Profile"
      >
        <img
          src={profile.avatar_url ?? ''}
          alt={profile.full_name}
          className="w-8 h-8 rounded-full object-cover"
          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
        />
      </button>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ChatApp />
      </AuthProvider>
    </ThemeProvider>
  );
}
