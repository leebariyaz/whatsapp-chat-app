import { useState } from 'react';
import { Search, Plus, Pin, MessageCircle, Loader2, MoreVertical, LogOut, Moon, Sun, User, Settings as SettingsIcon, Archive, Star, BellOff, Check, CheckCheck, LayoutDashboard, Users, Sparkles, QrCode } from 'lucide-react';
import type { Conversation } from '@/types';
import { formatRelative } from '@/utils';
import Avatar from '@/components/Avatar';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { StoriesBar } from '@/components/Stories';
import { FolderBar } from '@/components/ChatFolders';
import Logo from '@/components/Logo';

interface SidebarProps {
  conversations: Conversation[];
  activeId: string | null;
  loading: boolean;
  onSelect: (id: string) => void;
  onNewChat: () => void;
  onOpenSearch: () => void;
  onOpenSettings: () => void;
  onOpenProfile: () => void;
  onOpenStory: (userId: string) => void;
  onOpenDashboard: () => void;
  onOpenFriendRequests: () => void;
  friendRequestCount: number;
  activeFolder: string | null;
  onSelectFolder: (id: string | null) => void;
  onManageFolders: () => void;
  onOpenQR: () => void;
  onOpenWhatsNew: () => void;
}

export default function Sidebar({ conversations, activeId, loading, onSelect, onNewChat, onOpenSearch, onOpenSettings, onOpenProfile, onOpenStory, onOpenDashboard, onOpenFriendRequests, friendRequestCount, activeFolder, onSelectFolder, onManageFolders, onOpenQR, onOpenWhatsNew }: SidebarProps) {
  const { profile, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [query, setQuery] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [showArchived, setShowArchived] = useState(false);

  const filtered = conversations.filter((c) => {
    if (showArchived !== !!c.archived) return false;
    if (!query.trim()) return true;
    const other = c.participants.find((p) => p.id !== profile?.id);
    const name = c.is_self ? 'Message Yourself' : c.is_group ? (c.name ?? '') : (other?.full_name ?? '');
    return name.toLowerCase().includes(query.toLowerCase());
  });

  const sorted = [...filtered].sort((a, b) => {
    if (a.is_self && !b.is_self) return -1;
    if (!a.is_self && b.is_self) return 1;
    if (!!b.pinned !== !!a.pinned) return b.pinned ? 1 : -1;
    const aTime = a.last_message ? new Date(a.last_message.created_at).getTime() : 0;
    const bTime = b.last_message ? new Date(b.last_message.created_at).getTime() : 0;
    return bTime - aTime;
  });

  const archivedCount = conversations.filter((c) => c.archived).length;

  return (
    <aside className="w-full md:w-96 shrink-0 border-r border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Logo size="md" showText />
        </div>
        <div className="flex items-center gap-1">
          <button onClick={onOpenQR} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-300" title="QR Code">
            <QrCode className="w-5 h-5" />
          </button>
          <button onClick={onOpenSearch} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-300">
            <Search className="w-5 h-5" />
          </button>
          <div className="relative">
            <button onClick={() => setMenuOpen((v) => !v)} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-300">
              <MoreVertical className="w-5 h-5" />
            </button>
            {menuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                <div className="absolute right-0 top-full mt-1 z-20 w-56 bg-white dark:bg-slate-700 rounded-xl shadow-lg border border-slate-100 dark:border-slate-600 py-1">
                  <button onClick={() => { setMenuOpen(false); onOpenProfile(); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-600 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-600">
                    <User className="w-4 h-4" /> Profile
                  </button>
                  <button onClick={() => { setMenuOpen(false); onOpenDashboard(); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-600 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-600">
                    <LayoutDashboard className="w-4 h-4" /> Dashboard
                  </button>
                  <button onClick={() => { setMenuOpen(false); onOpenFriendRequests(); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-600 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-600">
                    <Users className="w-4 h-4" /> Friend Requests {friendRequestCount > 0 && <span className="ml-auto px-1.5 py-0.5 rounded-full bg-teal-500 text-white text-xs">{friendRequestCount}</span>}
                  </button>
                  <button onClick={() => { setMenuOpen(false); onOpenWhatsNew(); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-600 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-600">
                    <Sparkles className="w-4 h-4" /> What's New
                  </button>
                  <button onClick={() => { setMenuOpen(false); onOpenSettings(); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-600 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-600">
                    <SettingsIcon className="w-4 h-4" /> Settings
                  </button>
                  <button onClick={() => { setMenuOpen(false); toggleTheme(); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-600 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-600">
                    {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
                    {theme === 'light' ? 'Dark mode' : 'Light mode'}
                  </button>
                  <div className="border-t border-slate-100 dark:border-slate-600 my-1" />
                  <button onClick={() => { setMenuOpen(false); signOut(); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20">
                    <LogOut className="w-4 h-4" /> Sign out
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Stories */}
      <StoriesBar onOpenStory={onOpenStory} />

      {/* Folders */}
      <FolderBar activeFolder={activeFolder} onSelectFolder={onSelectFolder} onManageFolders={onManageFolders} />

      {/* Search */}
      <div className="px-4 py-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search chats..."
            className="w-full pl-10 pr-4 py-2 rounded-lg bg-slate-100 dark:bg-slate-700 text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800 transition"
          />
        </div>
      </div>

      {/* Archive toggle */}
      {archivedCount > 0 && (
        <button onClick={() => setShowArchived((v) => !v)} className="flex items-center gap-3 px-4 py-2 text-sm text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 transition">
          <Archive className="w-4 h-4" />
          {showArchived ? 'Active chats' : `Archived (${archivedCount})`}
        </button>
      )}

      {/* Conversation list */}
      <div className="flex-1 overflow-y-auto">
        {loading && (
          <div className="px-2 py-2 space-y-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 p-3 animate-pulse">
                <div className="w-12 h-12 rounded-full bg-slate-200 dark:bg-slate-700" />
                <div className="flex-1 space-y-2">
                  <div className="h-3.5 w-2/3 rounded bg-slate-200 dark:bg-slate-700" />
                  <div className="h-3 w-3/4 rounded bg-slate-200 dark:bg-slate-700" />
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && sorted.length === 0 && (
          <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
            <MessageCircle className="w-12 h-12 text-slate-300 dark:text-slate-600 mb-3" />
            <p className="text-slate-400 font-medium">{showArchived ? 'No archived chats' : 'No conversations yet'}</p>
            <p className="text-sm text-slate-400 mt-1">Start a new chat to get going</p>
          </div>
        )}

        {!loading && sorted.map((c) => {
          const other = c.participants.find((p) => p.id !== profile?.id) ?? c.participants[0];
          const last = c.last_message;
          const isActive = c.id === activeId;
          const preview = last
            ? last.deleted_for_everyone
              ? 'This message was deleted'
              : last.media_type === 'image'
                ? 'Photo'
                : last.media_type === 'video'
                  ? 'Video'
                  : last.media_type === 'voice'
                    ? 'Voice note'
                    : last.media_type === 'audio'
                      ? 'Audio'
                      : last.media_type === 'document'
                        ? last.media_name ?? 'Document'
                        : last.location_lat != null
                          ? 'Location'
                          : last.contact_name
                            ? 'Contact'
                            : last.text ?? ''
            : 'No messages yet';
          const previewPrefix = last && last.sender_id === profile?.id ? 'You: ' : '';

          return (
            <button
              key={c.id}
              onClick={() => onSelect(c.id)}
              className={`w-full flex items-center gap-3 px-3 py-3 text-left transition-colors border-l-2 ${
                isActive
                  ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-500'
                  : 'border-transparent hover:bg-slate-50 dark:hover:bg-slate-700/50'
              }`}
            >
              <Avatar src={other?.avatar_url} name={other?.full_name ?? 'Unknown'} id={other?.id ?? 'x'} size="md" verified={other?.is_verified} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 min-w-0">
                    {c.pinned && <Pin className="w-3 h-3 text-slate-400 shrink-0" />}
                    {c.muted && <BellOff className="w-3 h-3 text-slate-400 shrink-0" />}
                    <span className="font-medium text-slate-800 dark:text-white truncate">
                      {c.is_self ? 'Message Yourself' : c.is_group ? (c.name ?? 'Group') : other?.full_name ?? 'Unknown'}
                    </span>
                  </div>
                  {last && (
                    <span className="text-xs text-slate-400 shrink-0">{formatRelative(last.created_at)}</span>
                  )}
                </div>
                <div className="flex items-center justify-between gap-2 mt-0.5">
                  <p className="text-sm text-slate-500 dark:text-slate-400 truncate">
                    {previewPrefix}{preview}
                  </p>
                  {c.unread_count && c.unread_count > 0 ? (
                    <span className="shrink-0 min-w-5 h-5 px-1.5 rounded-full bg-emerald-500 text-white text-xs font-semibold flex items-center justify-center">
                      {c.unread_count}
                    </span>
                  ) : last && last.sender_id === profile?.id && !last.deleted_for_everyone ? (
                    last.read_by && last.read_by.length > 0
                      ? <CheckCheck className="w-4 h-4 text-sky-500 shrink-0" />
                      : <Check className="w-4 h-4 text-slate-300 shrink-0" />
                  ) : null}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* New chat button */}
      <div className="p-4 border-t border-slate-100 dark:border-slate-700">
        <button
          onClick={onNewChat}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-emerald-500 text-white font-medium hover:opacity-90 transition"
        >
          <Plus className="w-5 h-5" />
          New Chat
        </button>
      </div>
    </aside>
  );
}
