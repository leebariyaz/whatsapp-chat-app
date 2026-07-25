import { useEffect, useState } from 'react';
import Sidebar from '@/components/Sidebar';
import ChatArea from '@/components/ChatArea';
import { supabase } from '@/lib/supabase';
import type { Conversation, Message } from '@/types';

type SidebarConversation = Conversation & { lastMessage?: Message };

export default function App() {
  const [conversations, setConversations] = useState<SidebarConversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from('conversations')
        .select('id, profile_id, created_at, profile:profiles(id, name, avatar, online)')
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Failed to load conversations', error);
        setLoading(false);
        return;
      }

      const convos = (data ?? []) as unknown as Conversation[];

      const { data: allMessages } = await supabase
        .from('messages')
        .select('id, conversation_id, sender_id, text, created_at')
        .order('created_at', { ascending: true });

      const msgList = (allMessages ?? []) as Message[];

      const withLast: SidebarConversation[] = convos.map((c) => {
        const convoMsgs = msgList.filter((m) => m.conversation_id === c.id);
        return { ...c, lastMessage: convoMsgs[convoMsgs.length - 1] };
      });

      setConversations(withLast);
      setLoading(false);
      if (withLast.length) setActiveId(withLast[0].id);
    })();
  }, []);

  useEffect(() => {
    if (!activeId) {
      setMessages([]);
      return;
    }
    (async () => {
      const { data, error } = await supabase
        .from('messages')
        .select('id, conversation_id, sender_id, text, created_at')
        .eq('conversation_id', activeId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Failed to load messages', error);
        return;
      }
      setMessages((data ?? []) as Message[]);
    })();
  }, [activeId]);

  const handleSend = async (text: string) => {
    if (!activeId) return;
    const { data, error } = await supabase
      .from('messages')
      .insert({ conversation_id: activeId, sender_id: 'me', text })
      .select('id, conversation_id, sender_id, text, created_at')
      .single();

    if (error) {
      console.error('Failed to send message', error);
      return;
    }

    const newMessage = data as Message;
    setMessages((prev) => [...prev, newMessage]);
    setConversations((prev) =>
      prev.map((c) => (c.id === activeId ? { ...c, lastMessage: newMessage } : c))
    );
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-100">
        <p className="text-slate-400">Loading conversations...</p>
      </div>
    );
  }

  const activeConversation = conversations.find((c) => c.id === activeId) ?? null;

  return (
    <div className="h-screen flex bg-slate-100 overflow-hidden">
      <Sidebar conversations={conversations} activeId={activeId} onSelect={setActiveId} />
      <ChatArea conversation={activeConversation} messages={messages} onSend={handleSend} />
    </div>
  );
}
