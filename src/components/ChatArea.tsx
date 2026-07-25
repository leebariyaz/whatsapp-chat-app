import { useEffect, useRef, useState } from 'react';
import { Send } from 'lucide-react';
import type { Conversation, Message } from '@/types';
import { formatTime } from '@/utils';

interface ChatAreaProps {
  conversation: Conversation | null;
  messages: Message[];
  onSend: (text: string) => void;
}

export default function ChatArea({ conversation, messages, onSend }: ChatAreaProps) {
  const [text, setText] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages.length]);

  if (!conversation) {
    return (
      <div className="flex-1 flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <p className="text-slate-400 text-lg">Select a conversation to start chatting</p>
        </div>
      </div>
    );
  }

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    onSend(trimmed);
    setText('');
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-50">
      <div className="flex items-center gap-3 px-6 py-4 bg-white border-b border-slate-200">
        <img
          src={conversation.profile.avatar ?? ''}
          alt={conversation.profile.name}
          className="w-10 h-10 rounded-full object-cover"
        />
        <div>
          <h2 className="font-semibold text-slate-800">{conversation.profile.name}</h2>
          <p className={`text-xs ${conversation.profile.online ? 'text-green-500' : 'text-slate-400'}`}>
            {conversation.profile.online ? 'Online' : 'Offline'}
          </p>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
        {messages.map((m) => {
          const mine = m.sender_id === 'me';
          return (
            <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[70%] ${mine ? 'order-2' : ''}`}>
                <div
                  className={`px-4 py-2 rounded-2xl text-sm ${
                    mine
                      ? 'bg-blue-500 text-white rounded-br-sm'
                      : 'bg-white text-slate-700 rounded-bl-sm shadow-sm border border-slate-100'
                  }`}
                >
                  {m.text}
                </div>
                <p className={`text-[11px] text-slate-400 mt-1 ${mine ? 'text-right' : 'text-left'}`}>
                  {formatTime(m.created_at)}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="px-6 py-4 bg-white border-t border-slate-200">
        <div className="flex items-center gap-3">
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Type a message..."
            className="flex-1 px-4 py-2.5 rounded-full border border-slate-200 focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 text-sm"
          />
          <button
            onClick={handleSend}
            disabled={!text.trim()}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-blue-500 text-white text-sm font-medium hover:bg-blue-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="w-4 h-4" />
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
