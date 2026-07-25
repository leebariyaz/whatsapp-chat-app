import type { Conversation, Message } from '@/types';
import { formatRelative } from '@/utils';

interface SidebarProps {
  conversations: (Conversation & { lastMessage?: Message })[];
  activeId: string | null;
  onSelect: (id: string) => void;
}

export default function Sidebar({ conversations, activeId, onSelect }: SidebarProps) {
  return (
    <aside className="w-80 shrink-0 border-r border-slate-200 bg-white flex flex-col h-full">
      <div className="px-5 py-4 border-b border-slate-200">
        <h1 className="text-lg font-semibold text-slate-800">Messages</h1>
        <p className="text-sm text-slate-400">{conversations.length} conversations</p>
      </div>
      <div className="flex-1 overflow-y-auto">
        {conversations.map((c) => {
          const last = c.lastMessage;
          const isActive = c.id === activeId;
          return (
            <button
              key={c.id}
              onClick={() => onSelect(c.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors border-l-2 ${
                isActive
                  ? 'bg-blue-50 border-blue-500'
                  : 'bg-white border-transparent hover:bg-slate-50'
              }`}
            >
              <div className="relative shrink-0">
                <img
                  src={c.profile.avatar ?? ''}
                  alt={c.profile.name}
                  className="w-12 h-12 rounded-full object-cover"
                />
                {c.profile.online && (
                  <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium text-slate-800 truncate">{c.profile.name}</span>
                  {last && (
                    <span className="text-xs text-slate-400 shrink-0">{formatRelative(last.created_at)}</span>
                  )}
                </div>
                <p className="text-sm text-slate-500 truncate">{last?.text ?? 'No messages yet'}</p>
              </div>
            </button>
          );
        })}
      </div>
    </aside>
  );
}
