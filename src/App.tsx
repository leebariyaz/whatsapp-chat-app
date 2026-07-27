import { useCallback, useEffect, useMemo, useState, lazy, Suspense } from 'react';
import Sidebar from '@/components/Sidebar';
import ChatArea from '@/components/ChatArea';
import AuthPage from '@/components/AuthPage';
import ProfileModal from '@/components/ProfileModal';
import NewChatModal from '@/components/NewChatModal';
import SplashScreen, { Onboarding } from '@/components/SplashScreen';
import QRModal from '@/components/QRModal';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { ToastProvider, useToast } from '@/context/ToastContext';
import { AccessibilityProvider } from '@/context/AccessibilityContext';
import { supabase } from '@/lib/supabase';
import { useKeyboardShortcuts } from '@/lib/keyboard';
import type { Conversation, Message, Profile } from '@/types';
import { AI_ASSISTANT_ID } from '@/types';

// Lazy-loaded modals (code splitting)
const SearchModal = lazy(() => import('@/components/SearchModal'));
const SettingsModal = lazy(() => import('@/components/SettingsModal'));
const BlockedContactsModal = lazy(() => import('@/components/BlockedContactsModal'));
const ForwardModal = lazy(() => import('@/components/ForwardModal'));
import { CallModal } from '@/components/Calls';
import { StoryViewer } from '@/components/Stories';
const ChatToolsModal = lazy(() => import('@/components/ChatToolsModal'));
const ChatCustomizeModal = lazy(() => import('@/components/ChatCustomizeModal'));
const ScheduledMessagesModal = lazy(() => import('@/components/ScheduledMessagesModal'));
const DashboardModal = lazy(() => import('@/components/DashboardModal'));
const WhatsNewModal = lazy(() => import('@/components/WhatsNewModal'));
const FriendRequestsModal = lazy(() => import('@/components/FriendRequestsModal'));
const DeviceSecurityModal = lazy(() => import('@/components/DeviceSecurityModal'));
import { FolderManager } from '@/components/ChatFolders';

function ModalFallback() {
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30"><div className="w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" /></div>;
}

function ChatApp() {
  const { session, profile, loading } = useAuth();
  const { toast } = useToast();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingConvos, setLoadingConvos] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [participants, setParticipants] = useState<Record<string, Profile>>({});
  const [typingUserIds, setTypingUserIds] = useState<string[]>([]);
  const [aiThinking, setAiThinking] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  // Modal states
  const [showProfile, setShowProfile] = useState(false);
  const [showNewChat, setShowNewChat] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showBlocked, setShowBlocked] = useState(false);
  const [forwardMessage, setForwardMessage] = useState<Message | null>(null);
  const [callState, setCallState] = useState<{ conversation: Conversation; type: 'voice' | 'video' } | null>(null);
  const [storyUserId, setStoryUserId] = useState<string | null>(null);
  const [showSplash, setShowSplash] = useState(() => !sessionStorage.getItem('pulse-splash-seen'));
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [showTools, setShowTools] = useState(false);
  const [showCustomize, setShowCustomize] = useState(false);
  const [showScheduled, setShowScheduled] = useState(false);
  const [showDashboard, setShowDashboard] = useState(false);
  const [showWhatsNew, setShowWhatsNew] = useState(false);
  const [showFriendRequests, setShowFriendRequests] = useState(false);
  const [showDeviceSecurity, setShowDeviceSecurity] = useState(false);
  const [showFolderManager, setShowFolderManager] = useState(false);
  const [activeFolder, setActiveFolder] = useState<string | null>(null);
  const [friendRequestCount, setFriendRequestCount] = useState(0);

  const activeConversation = useMemo(
    () => conversations.find((c) => c.id === activeId) ?? null,
    [conversations, activeId]
  );

  // Splash screen
  useEffect(() => {
    if (!showSplash) return;
    const t = setTimeout(() => {
      setShowSplash(false);
      sessionStorage.setItem('pulse-splash-seen', 'true');
      // Show onboarding for first-time users
      if (session && profile && !localStorage.getItem('pulse-onboarded')) {
        setShowOnboarding(true);
      }
    }, 2500);
    return () => clearTimeout(t);
  }, [showSplash, session, profile]);

  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
    localStorage.setItem('pulse-onboarded', 'true');
  };

  // Keyboard shortcuts
  useKeyboardShortcuts([
    { key: 'k', ctrl: true, handler: () => setShowSearch(true) },
    { key: 'n', ctrl: true, handler: () => setShowNewChat(true) },
    { key: 'd', ctrl: true, handler: () => setShowDashboard(true) },
    { key: ',', ctrl: true, handler: () => setShowSettings(true) },
    { key: 'Escape', handler: () => {
      setShowSearch(false); setShowNewChat(false); setShowSettings(false);
      setShowProfile(false); setShowBlocked(false); setShowQR(false);
      setShowTools(false); setShowCustomize(false); setShowScheduled(false);
      setShowDashboard(false); setShowWhatsNew(false); setShowFriendRequests(false);
      setShowDeviceSecurity(false); setShowFolderManager(false);
    }},
  ]);

  // Friend request count (real-time + polling fallback)
  useEffect(() => {
    if (!profile) return;
    const loadCount = async () => {
      const { count } = await supabase.from('friend_requests')
        .select('*', { count: 'exact', head: true })
        .eq('receiver_id', profile.id)
        .eq('status', 'pending');
      setFriendRequestCount(count ?? 0);
    };
    loadCount();
    const channel = supabase
      .channel('friend-requests')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'friend_requests', filter: `receiver_id=eq.${profile.id}` }, () => loadCount())
      .subscribe();
    const interval = setInterval(loadCount, 30000);
    return () => { supabase.removeChannel(channel); clearInterval(interval); };
  }, [profile]);

  const loadConversations = useCallback(async () => {
    if (!profile) return;
    setLoadingConvos(true);
    try {
      const { data: parts, error } = await supabase
        .from('conversation_participants')
        .select('conversation_id, pinned, muted, archived, favorite, is_self, conversation:conversations(id, is_group, name, avatar_url, created_by, created_at)')
        .eq('user_id', profile.id);
      if (error) throw error;

      const convoList: Conversation[] = [];
      const allUserIds = new Set<string>();

      for (const p of parts ?? []) {
        const c = (p as unknown as { conversation: Conversation }).conversation;
        const { data: cpRows } = await supabase
          .from('conversation_participants')
          .select('user_id, pinned, muted, archived, favorite, is_self')
          .eq('conversation_id', c.id);
        const userIds = (cpRows ?? []).map((r) => r.user_id);
        userIds.forEach((id) => allUserIds.add(id));

        const { data: profRows } = await supabase
          .from('profiles')
          .select('id, username, full_name, avatar_url, bio, phone, last_seen, created_at, is_verified, is_official')
          .in('id', userIds);
        const profs = (profRows ?? []) as Profile[];
        const myRow = (cpRows ?? []).find((r) => r.user_id === profile.id);

        const { data: lastMsgRow } = await supabase
          .from('messages')
          .select('id, conversation_id, sender_id, text, media_url, media_type, media_name, reply_to_id, edited_at, deleted_for_everyone, created_at, forwarded_from_id, duration, location_lat, location_lng, contact_name, contact_phone')
          .eq('conversation_id', c.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

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
          pinned: myRow?.pinned ?? false,
          muted: myRow?.muted ?? false,
          archived: myRow?.archived ?? false,
          favorite: myRow?.favorite ?? false,
          is_self: myRow?.is_self ?? false,
        });
      }

      setConversations(convoList);

      const { data: allProfs } = await supabase
        .from('profiles')
        .select('id, username, full_name, avatar_url, bio, phone, last_seen, created_at, is_verified, is_official')
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

  // Ensure every user has an AI assistant conversation
  useEffect(() => {
    if (!profile || !conversations.length) return;
    const hasAiConvo = conversations.some((c) => c.participants.some((p) => p.id === AI_ASSISTANT_ID));
    if (hasAiConvo) return;
    (async () => {
      try {
        const { data: convo, error: convoErr } = await supabase
          .from('conversations')
          .insert({ is_group: false, created_by: profile.id })
          .select('id')
          .single();
        if (convoErr) throw convoErr;
        const { error: partErr } = await supabase
          .from('conversation_participants')
          .insert([
            { conversation_id: convo.id, user_id: profile.id, pinned: true },
            { conversation_id: convo.id, user_id: AI_ASSISTANT_ID },
          ]);
        if (partErr) throw partErr;
        await supabase.rpc('create_ai_welcome_message', { p_conversation_id: convo.id, p_user_name: profile.full_name });
        loadConversations();
      } catch (err) {
        console.error('Failed to create AI conversation', err);
      }
    })();
  }, [profile, conversations, loadConversations]);

  const loadMessages = useCallback(async () => {
    if (!activeId || !profile) return;
    setLoadingMessages(true);
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('id, conversation_id, sender_id, text, media_url, media_type, media_name, reply_to_id, edited_at, deleted_for_everyone, created_at, forwarded_from_id, duration, location_lat, location_lng, contact_name, contact_phone')
        .eq('conversation_id', activeId)
        .order('created_at', { ascending: true });
      if (error) throw error;
      const msgList = (data ?? []) as Message[];

      const { data: hidden } = await supabase
        .from('message_hidden')
        .select('message_id')
        .eq('user_id', profile.id);
      const hiddenSet = new Set((hidden ?? []).map((h) => h.message_id));
      const visible = msgList.filter((m) => !hiddenSet.has(m.id));

      const { data: reads } = await supabase
        .from('message_reads')
        .select('message_id, user_id')
        .in('message_id', visible.map((m) => m.id));
      const readMap: Record<string, string[]> = {};
      (reads ?? []).forEach((r) => {
        if (!readMap[r.message_id]) readMap[r.message_id] = [];
        readMap[r.message_id].push(r.user_id);
      });

      const { data: reactions } = await supabase
        .from('message_reactions')
        .select('message_id, user_id, emoji')
        .in('message_id', visible.map((m) => m.id));
      const reactionMap: Record<string, { emoji: string; user_id: string }[]> = {};
      (reactions ?? []).forEach((r) => {
        if (!reactionMap[r.message_id]) reactionMap[r.message_id] = [];
        reactionMap[r.message_id].push({ emoji: r.emoji, user_id: r.user_id });
      });

      const { data: starred } = await supabase
        .from('starred_messages')
        .select('message_id')
        .eq('user_id', profile.id);
      const starredSet = new Set((starred ?? []).map((s) => s.message_id));

      const withMeta = visible.map((m) => ({
        ...m,
        read_by: readMap[m.id] ?? [],
        reactions: reactionMap[m.id] ?? [],
        starred: starredSet.has(m.id),
      }));

      setMessages(withMeta);
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

  // Real-time: messages
  useEffect(() => {
    if (!activeId || !profile) return;
    const channel = supabase
      .channel(`messages:${activeId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${activeId}` }, (payload) => {
        const newMsg = payload.new as Message;
        setMessages((prev) => {
          if (prev.find((m) => m.id === newMsg.id)) return prev;
          return [...prev, { ...newMsg, read_by: [], reactions: [] }];
        });
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'messages', filter: `conversation_id=eq.${activeId}` }, (payload) => {
        const updated = payload.new as Message;
        setMessages((prev) => prev.map((m) => (m.id === updated.id ? { ...m, ...updated } : m)));
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [activeId, profile]);

  // Real-time: typing
  useEffect(() => {
    if (!activeId || !profile) return;
    const channel = supabase
      .channel(`typing:${activeId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'typing_status', filter: `conversation_id=eq.${activeId}` }, (payload) => {
        const row = (payload.new ?? payload.old) as { user_id: string; is_typing: boolean };
        setTypingUserIds((prev) => {
          if (row.is_typing) return prev.includes(row.user_id) ? prev : [...prev, row.user_id];
          return prev.filter((id) => id !== row.user_id);
        });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [activeId, profile]);

  // Real-time: conversation list updates
  useEffect(() => {
    if (!profile) return;
    const channel = supabase
      .channel('conversations-update')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, () => loadConversations())
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'messages' }, () => loadConversations())
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'conversation_participants', filter: `user_id=eq.${profile.id}` }, () => loadConversations())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [profile, loadConversations]);

  // Update last_seen
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

  // Reminder checker
  useEffect(() => {
    if (!profile) return;
    const checkReminders = async () => {
      const now = new Date().toISOString();
      const { data: due } = await supabase.from('reminders')
        .select('id, title')
        .eq('user_id', profile.id)
        .eq('completed', false)
        .lte('remind_at', now)
        .limit(5);
      if (due && due.length) {
        due.forEach((r) => {
          if (Notification.permission === 'granted') {
            new Notification('Reminder', { body: r.title });
          }
          toast(`Reminder: ${r.title}`, 'info');
        });
        await supabase.from('reminders').update({ completed: true }).in('id', due.map((r) => r.id));
      }
    };
    const interval = setInterval(checkReminders, 30000);
    return () => clearInterval(interval);
  }, [profile, toast]);

  // Scheduled message checker
  useEffect(() => {
    if (!profile) return;
    const checkScheduled = async () => {
      const now = new Date().toISOString();
      const { data: due } = await supabase.from('scheduled_messages')
        .select('id, conversation_id, text')
        .eq('sender_id', profile.id)
        .eq('sent', false)
        .lte('scheduled_for', now)
        .limit(5);
      if (due && due.length) {
        for (const s of due) {
          await supabase.from('messages').insert({
            conversation_id: s.conversation_id,
            sender_id: profile.id,
            text: s.text,
          });
          await supabase.from('scheduled_messages').update({ sent: true }).eq('id', s.id);
        }
        toast('Scheduled message sent', 'success');
        loadConversations();
      }
    };
    const interval = setInterval(checkScheduled, 30000);
    return () => clearInterval(interval);
  }, [profile, toast, loadConversations]);

  // Handlers
  const handleSendMessage = async (payload: { text?: string; mediaUrl?: string; mediaType?: string; mediaName?: string; replyToId?: string; duration?: number; forwardedFromId?: string; locationLat?: number; locationLng?: number; contactName?: string; contactPhone?: string }) => {
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
        forwarded_from_id: payload.forwardedFromId ?? null,
        duration: payload.duration ?? null,
        location_lat: payload.locationLat ?? null,
        location_lng: payload.locationLng ?? null,
        contact_name: payload.contactName ?? null,
        contact_phone: payload.contactPhone ?? null,
      })
      .select('id, conversation_id, sender_id, text, media_url, media_type, media_name, reply_to_id, edited_at, deleted_for_everyone, created_at, forwarded_from_id, duration, location_lat, location_lng, contact_name, contact_phone')
      .single();
    if (error) { console.error('Send failed', error); toast('Failed to send message', 'error'); return; }
    setMessages((prev) => [...prev, { ...(data as Message), read_by: [], reactions: [] }]);

    // If this is an AI conversation, trigger the AI response
    const convo = conversations.find((c) => c.id === activeId);
    const isAiConvo = convo?.participants.some((p) => p.id === AI_ASSISTANT_ID);
    if (isAiConvo && payload.text) {
      triggerAiResponse(activeId);
    }
  };

  const triggerAiResponse = async (conversationId: string) => {
    if (!profile) return;
    setAiThinking(true);
    setAiError(null);
    try {
      const { data: savedMsg, error } = await supabase
        .rpc('generate_ai_response', { p_conversation_id: conversationId, p_user_id: profile.id });

      if (error) throw error;
      if (savedMsg) {
        const aiMsg = savedMsg as Message;
        setMessages((prev) => {
          if (prev.find((m) => m.id === aiMsg.id)) return prev;
          return [...prev, { ...aiMsg, read_by: [], reactions: [] }];
        });
      }
    } catch (err) {
      console.error('AI response failed', err);
      setAiError('The assistant is having trouble responding. Please try again.');
    } finally {
      setAiThinking(false);
    }
  };

  const handleEditMessage = async (message: Message, newText: string) => {
    const { error } = await supabase.from('messages').update({ text: newText, edited_at: new Date().toISOString() }).eq('id', message.id);
    if (error) { toast('Edit failed', 'error'); return; }
    setMessages((prev) => prev.map((m) => (m.id === message.id ? { ...m, text: newText, edited_at: new Date().toISOString() } : m)));
  };

  const handleDeleteForMe = async (message: Message) => {
    if (!profile) return;
    const { error } = await supabase.from('message_hidden').insert({ message_id: message.id, user_id: profile.id });
    if (error) { toast('Delete failed', 'error'); return; }
    setMessages((prev) => prev.filter((m) => m.id !== message.id));
    toast('Message deleted', 'success');
  };

  const handleDeleteForEveryone = async (message: Message) => {
    const { error } = await supabase.from('messages').update({ deleted_for_everyone: true, text: null, media_url: null, media_type: null, media_name: null }).eq('id', message.id);
    if (error) { toast('Delete failed', 'error'); return; }
    setMessages((prev) => prev.map((m) => (m.id === message.id ? { ...m, deleted_for_everyone: true, text: null, media_url: null, media_type: null, media_name: null } : m)));
    toast('Message deleted for everyone', 'success');
  };

  const handleMarkRead = async (msgs: Message[]) => {
    if (!profile) return;
    const rows = msgs.map((m) => ({ message_id: m.id, user_id: profile.id }));
    if (!rows.length) return;
    await supabase.from('message_reads').upsert(rows, { onConflict: 'message_id,user_id' });
    setMessages((prev) => prev.map((m) => msgs.find((x) => x.id === m.id) ? { ...m, read_by: [...(m.read_by ?? []), profile.id] } : m));
  };

  const handleSetTyping = async (isTyping: boolean) => {
    if (!profile || !activeId) return;
    await supabase.from('typing_status').upsert({ conversation_id: activeId, user_id: profile.id, is_typing: isTyping, updated_at: new Date().toISOString() }, { onConflict: 'conversation_id,user_id' });
  };

  const handleReact = async (messageId: string, emoji: string) => {
    if (!profile) return;
    const existing = messages.find((m) => m.id === messageId)?.reactions?.find((r) => r.user_id === profile.id);
    if (existing) {
      await supabase.from('message_reactions').delete().eq('message_id', messageId).eq('user_id', profile.id);
    } else {
      await supabase.from('message_reactions').insert({ message_id: messageId, user_id: profile.id, emoji });
    }
    setMessages((prev) => prev.map((m) => {
      if (m.id !== messageId) return m;
      const reactions = m.reactions ?? [];
      const filtered = reactions.filter((r) => r.user_id !== profile.id);
      if (!existing) filtered.push({ emoji, user_id: profile.id });
      return { ...m, reactions: filtered };
    }));
  };

  const handleStar = async (message: Message) => {
    if (!profile) return;
    if (message.starred) {
      await supabase.from('starred_messages').delete().eq('message_id', message.id).eq('user_id', profile.id);
      setMessages((prev) => prev.map((m) => (m.id === message.id ? { ...m, starred: false } : m)));
      toast('Message unstarred', 'success');
    } else {
      await supabase.from('starred_messages').insert({ message_id: message.id, user_id: profile.id });
      setMessages((prev) => prev.map((m) => (m.id === message.id ? { ...m, starred: true } : m)));
      toast('Message starred', 'success');
    }
  };

  const handleTogglePin = async () => {
    if (!profile || !activeId) return;
    const newVal = !activeConversation?.pinned;
    await supabase.from('conversation_participants').update({ pinned: newVal }).eq('conversation_id', activeId).eq('user_id', profile.id);
    setConversations((prev) => prev.map((c) => (c.id === activeId ? { ...c, pinned: newVal } : c)));
    toast(newVal ? 'Chat pinned' : 'Chat unpinned', 'success');
  };

  const handleToggleMute = async () => {
    if (!profile || !activeId) return;
    const newVal = !activeConversation?.muted;
    await supabase.from('conversation_participants').update({ muted: newVal }).eq('conversation_id', activeId).eq('user_id', profile.id);
    setConversations((prev) => prev.map((c) => (c.id === activeId ? { ...c, muted: newVal } : c)));
    toast(newVal ? 'Chat muted' : 'Chat unmuted', 'success');
  };

  const handleToggleArchive = async () => {
    if (!profile || !activeId) return;
    const newVal = !activeConversation?.archived;
    await supabase.from('conversation_participants').update({ archived: newVal }).eq('conversation_id', activeId).eq('user_id', profile.id);
    setConversations((prev) => prev.map((c) => (c.id === activeId ? { ...c, archived: newVal } : c)));
    toast(newVal ? 'Chat archived' : 'Chat unarchived', 'success');
  };

  const handleClearChat = async () => {
    if (!profile || !activeId) return;
    if (!confirm('Clear all messages in this chat? This cannot be undone.')) return;
    const rows = messages.map((m) => ({ message_id: m.id, user_id: profile.id }));
    if (rows.length) await supabase.from('message_hidden').upsert(rows, { onConflict: 'message_id,user_id' });
    setMessages([]);
    toast('Chat cleared', 'success');
  };

  const handleExportChat = () => {
    const lines = messages.map((m) => {
      const sender = participants[m.sender_id]?.full_name ?? 'Unknown';
      const time = new Date(m.created_at).toLocaleString();
      const content = m.deleted_for_everyone ? '[deleted]' : m.text ?? `[${m.media_type ?? 'media'}]`;
      return `[${time}] ${sender}: ${content}`;
    });
    const blob = new Blob([lines.join('\n')], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chat-export-${activeId}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast('Chat exported', 'success');
  };

  const handleCall = (type: 'voice' | 'video') => {
    if (activeConversation) setCallState({ conversation: activeConversation, type });
  };

  // Browser notification on new incoming message
  useEffect(() => {
    if (!profile || !activeConversation) return;
    const last = messages[messages.length - 1];
    if (!last || last.sender_id === profile.id) return;
    if (Notification.permission === 'granted' && document.hidden && !activeConversation.muted) {
      const sender = participants[last.sender_id];
      new Notification(`New message from ${sender?.full_name ?? 'Unknown'}`, {
        body: last.text ?? (last.media_type === 'image' ? 'Sent a photo' : last.media_type === 'voice' ? 'Sent a voice note' : 'Sent a file'),
      });
    }
  }, [messages.length, profile, activeConversation, participants]);

  if (showSplash) {
    return <SplashScreen onComplete={() => { setShowSplash(false); sessionStorage.setItem('pulse-splash-seen', 'true'); }} />;
  }

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

  if (showOnboarding) {
    return <Onboarding onComplete={handleOnboardingComplete} />;
  }

  // Folder-filtered conversations for sidebar
  const folderConversations = activeFolder
    ? conversations // filtering by folder is handled inside Sidebar via the folder bar
    : conversations;

  return (
    <div className="h-screen flex bg-slate-100 dark:bg-slate-900 overflow-hidden">
      <div className={`${activeId ? 'hidden md:flex' : 'flex'} w-full md:w-auto`}>
        <Sidebar
          conversations={folderConversations}
          activeId={activeId}
          loading={loadingConvos}
          onSelect={setActiveId}
          onNewChat={() => setShowNewChat(true)}
          onOpenSearch={() => setShowSearch(true)}
          onOpenSettings={() => setShowSettings(true)}
          onOpenProfile={() => setShowProfile(true)}
          onOpenStory={(uid) => setStoryUserId(uid)}
          onOpenDashboard={() => setShowDashboard(true)}
          onOpenFriendRequests={() => setShowFriendRequests(true)}
          friendRequestCount={friendRequestCount}
          activeFolder={activeFolder}
          onSelectFolder={setActiveFolder}
          onManageFolders={() => setShowFolderManager(true)}
          onOpenQR={() => setShowQR(true)}
          onOpenWhatsNew={() => setShowWhatsNew(true)}
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
          onReact={handleReact}
          onStar={handleStar}
          onTogglePin={handleTogglePin}
          onToggleMute={handleToggleMute}
          onToggleArchive={handleToggleArchive}
          onClearChat={handleClearChat}
          onExportChat={handleExportChat}
          onForward={(m) => setForwardMessage(m)}
          onCall={handleCall}
          onOpenTools={() => setShowTools(true)}
          onOpenCustomize={() => setShowCustomize(true)}
          onOpenScheduled={() => setShowScheduled(true)}
          aiThinking={aiThinking}
          aiError={aiError}
          onRetryAi={() => activeId && triggerAiResponse(activeId)}
        />
      </div>

      {/* Modals */}
      {showProfile && <ProfileModal onClose={() => setShowProfile(false)} />}
      {showNewChat && (
        <NewChatModal
          onClose={() => setShowNewChat(false)}
          onChatCreated={(id) => { setShowNewChat(false); setActiveId(id); loadConversations(); }}
        />
      )}
      <Suspense fallback={<ModalFallback />}>
        {showSearch && (
          <SearchModal
            onClose={() => setShowSearch(false)}
            onUserSelect={() => { setShowSearch(false); setShowNewChat(true); }}
            onMessageSelect={(id) => { setShowSearch(false); setActiveId(id); }}
          />
        )}
        {showSettings && (
          <SettingsModal
            onClose={() => setShowSettings(false)}
            onEditProfile={() => { setShowSettings(false); setShowProfile(true); }}
            onOpenBlocked={() => { setShowSettings(false); setShowBlocked(true); }}
            onOpenDeviceSecurity={() => { setShowSettings(false); setShowDeviceSecurity(true); }}
          />
        )}
        {showBlocked && <BlockedContactsModal onClose={() => setShowBlocked(false)} />}
        {forwardMessage && (
          <ForwardModal
            message={forwardMessage}
            onClose={() => setForwardMessage(null)}
            onForwarded={(id) => { setForwardMessage(null); setActiveId(id); toast('Message forwarded', 'success'); }}
          />
        )}
        {callState && (
          <CallModal
            conversation={callState.conversation}
            callType={callState.type}
            onClose={() => setCallState(null)}
            participants={participants}
          />
        )}
        {storyUserId && <StoryViewer userId={storyUserId} onClose={() => setStoryUserId(null)} />}
        {showQR && profile && <QRModal profile={profile} onClose={() => setShowQR(false)} />}
        {showTools && activeId && (
          <ChatToolsModal conversationId={activeId} participants={participants} onClose={() => setShowTools(false)} />
        )}
        {showCustomize && activeId && <ChatCustomizeModal conversationId={activeId} onClose={() => setShowCustomize(false)} />}
        {showScheduled && activeId && (
          <ScheduledMessagesModal conversationId={activeId} onClose={() => setShowScheduled(false)} onSendNow={() => loadMessages()} />
        )}
        {showDashboard && (
          <DashboardModal conversations={conversations} participants={participants} onClose={() => setShowDashboard(false)} />
        )}
        {showWhatsNew && <WhatsNewModal onClose={() => setShowWhatsNew(false)} />}
        {showFriendRequests && (
          <FriendRequestsModal onClose={() => setShowFriendRequests(false)} onAccept={() => loadConversations()} />
        )}
        {showDeviceSecurity && <DeviceSecurityModal onClose={() => setShowDeviceSecurity(false)} />}
        {showFolderManager && (
          <FolderManager
            conversations={conversations.map((c) => ({
              id: c.id,
              name: c.is_self ? 'Message Yourself' : c.is_group ? (c.name ?? 'Group') : (c.participants.find((p) => p.id !== profile?.id)?.full_name ?? 'Unknown'),
            }))}
            onClose={() => setShowFolderManager(false)}
          />
        )}
      </Suspense>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AccessibilityProvider>
        <ToastProvider>
          <AuthProvider>
            <ChatApp />
          </AuthProvider>
        </ToastProvider>
      </AccessibilityProvider>
    </ThemeProvider>
  );
}
