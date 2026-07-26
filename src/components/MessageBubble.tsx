import { useState, useRef, useEffect } from 'react';
import { Reply, Edit2, Trash2, Copy, Check, CheckCheck, Download, FileText, MoreVertical, X, Star, Forward, MapPin, Phone, Mic, Play, Video, File } from 'lucide-react';
import type { Message, Profile, MessageReaction } from '@/types';
import { formatTime } from '@/utils';
import { formatMessage } from '@/lib/messageFormat';
import { useLinkPreview, LinkPreviewCard } from '@/lib/linkPreview';
import Avatar from '@/components/Avatar';

interface MessageBubbleProps {
  message: Message;
  sender: Profile | undefined;
  isMine: boolean;
  isGroup: boolean;
  replyTo?: Message | null;
  onReply: (m: Message) => void;
  onEdit: (m: Message) => void;
  onDeleteForMe: (m: Message) => void;
  onDeleteForEveryone: (m: Message) => void;
  onCopy: (text: string) => void;
  onReact: (messageId: string, emoji: string) => void;
  onStar: (message: Message) => void;
  onForward: (message: Message) => void;
}

const QUICK_REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '🙏'];

export default function MessageBubble({
  message, sender, isMine, isGroup, replyTo,
  onReply, onEdit, onDeleteForMe, onDeleteForEveryone, onCopy, onReact, onStar, onForward,
}: MessageBubbleProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [showReactions, setShowReactions] = useState(false);
  const [copied, setCopied] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const linkPreview = useLinkPreview(message.text);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
        setShowReactions(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleCopy = () => {
    if (message.text) {
      onCopy(message.text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
    setMenuOpen(false);
  };

  const baseUrl = import.meta.env.VITE_SUPABASE_URL;
  const mediaUrl = message.media_url
    ? (message.media_url.startsWith('http') ? message.media_url : `${baseUrl}/storage/v1/object/public/chat-media/${message.media_url}`)
    : null;

  const reactions = message.reactions ?? [];
  const reactionCounts = reactions.reduce<Record<string, number>>((acc, r) => {
    acc[r.emoji] = (acc[r.emoji] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div className={`flex gap-2 group ${isMine ? 'justify-end' : 'justify-start'}`}>
      {!isMine && sender && (
        <Avatar src={sender.avatar_url} name={sender.full_name} id={sender.id} size="sm" verified={sender.is_verified} />
      )}
      <div className={`max-w-[75%] ${isMine ? 'items-end' : 'items-start'} flex flex-col`}>
        {isGroup && !isMine && sender && (
          <span className="text-xs font-medium text-blue-500 mb-0.5 px-1">{sender.full_name}</span>
        )}

        <div
          className={`relative px-3 py-2 rounded-2xl text-sm ${
            isMine
              ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-br-sm'
              : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-100 rounded-bl-sm shadow-sm border border-slate-100 dark:border-slate-600'
          }`}
        >
          {/* Reply preview */}
          {replyTo && (
            <div className={`mb-1.5 pl-2 border-l-2 ${isMine ? 'border-white/50' : 'border-blue-400'} text-xs opacity-80`}>
              <p className="font-medium">
                {replyTo.sender_id === message.sender_id ? 'You' : (sender?.full_name ?? 'Someone')}
              </p>
              <p className="truncate max-w-48">
                {replyTo.deleted_for_everyone ? 'Deleted message' : replyTo.text ?? (replyTo.media_type === 'image' ? 'Photo' : replyTo.media_type === 'video' ? 'Video' : replyTo.media_type === 'audio' ? 'Audio' : 'Document')}
              </p>
            </div>
          )}

          {/* Forwarded indicator */}
          {message.forwarded_from_id && !message.deleted_for_everyone && (
            <p className={`text-xs italic mb-1 ${isMine ? 'text-white/60' : 'text-slate-400'}`}>Forwarded</p>
          )}

          {/* Media content */}
          {message.deleted_for_everyone ? (
            <p className="italic opacity-70 text-xs">This message was deleted</p>
          ) : message.media_type === 'image' && mediaUrl ? (
            <div className="relative">
              <img src={mediaUrl} alt="Shared" className="max-w-64 max-h-64 rounded-lg cursor-pointer" onClick={() => window.open(mediaUrl, '_blank')} />
              {message.text && <p className="mt-1">{message.text}</p>}
            </div>
          ) : message.media_type === 'video' && mediaUrl ? (
            <div className="relative">
              <video src={mediaUrl} controls className="max-w-64 max-h-64 rounded-lg" />
              {message.text && <p className="mt-1">{message.text}</p>}
            </div>
          ) : message.media_type === 'audio' && mediaUrl ? (
            <div className="flex items-center gap-2 py-1 min-w-40">
              <div className={`w-9 h-9 rounded-full flex items-center justify-center ${isMine ? 'bg-white/20' : 'bg-blue-100 dark:bg-blue-900/40'}`}>
                <Play className={`w-4 h-4 ${isMine ? 'text-white' : 'text-blue-500'}`} />
              </div>
              <div className="flex-1">
                <audio src={mediaUrl} controls className="h-8 max-w-48" />
                {message.duration && <p className={`text-xs ${isMine ? 'text-white/60' : 'text-slate-400'}`}>{Math.round(message.duration)}s</p>}
              </div>
            </div>
          ) : message.media_type === 'voice' && mediaUrl ? (
            <div className="flex items-center gap-2 py-1 min-w-40">
              <div className={`w-9 h-9 rounded-full flex items-center justify-center ${isMine ? 'bg-white/20' : 'bg-blue-100 dark:bg-blue-900/40'}`}>
                <Mic className={`w-4 h-4 ${isMine ? 'text-white' : 'text-blue-500'}`} />
              </div>
              <div className="flex-1">
                <audio src={mediaUrl} controls className="h-8 max-w-48" />
                {message.duration && <p className={`text-xs ${isMine ? 'text-white/60' : 'text-slate-400'}`}>{message.duration}s</p>}
              </div>
            </div>
          ) : message.media_type === 'document' && mediaUrl ? (
            <a href={mediaUrl} target="_blank" rel="noreferrer" download={message.media_name ?? undefined} className="flex items-center gap-3 py-1">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isMine ? 'bg-white/20' : 'bg-blue-100 dark:bg-blue-900/40'}`}>
                <FileText className={`w-5 h-5 ${isMine ? 'text-white' : 'text-blue-500'}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate text-sm">{message.media_name ?? 'Document'}</p>
                <p className={`text-xs ${isMine ? 'text-white/70' : 'text-slate-400'}`}>Tap to download</p>
              </div>
              <Download className={`w-4 h-4 ${isMine ? 'text-white/70' : 'text-slate-400'}`} />
            </a>
          ) : message.location_lat != null ? (
            <a href={`https://www.google.com/maps?q=${message.location_lat},${message.location_lng}`} target="_blank" rel="noreferrer" className="flex items-center gap-2 py-1">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isMine ? 'bg-white/20' : 'bg-emerald-100 dark:bg-emerald-900/40'}`}>
                <MapPin className={`w-5 h-5 ${isMine ? 'text-white' : 'text-emerald-500'}`} />
              </div>
              <div>
                <p className="text-sm font-medium">Location</p>
                <p className={`text-xs ${isMine ? 'text-white/70' : 'text-slate-400'}`}>{message.location_lat?.toFixed(4)}, {message.location_lng?.toFixed(4)}</p>
              </div>
            </a>
          ) : message.contact_name ? (
            <div className="flex items-center gap-2 py-1">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isMine ? 'bg-white/20' : 'bg-blue-100 dark:bg-blue-900/40'}`}>
                <Phone className={`w-5 h-5 ${isMine ? 'text-white' : 'text-blue-500'}`} />
              </div>
              <div>
                <p className="text-sm font-medium">{message.contact_name}</p>
                <p className={`text-xs ${isMine ? 'text-white/70' : 'text-slate-400'}`}>{message.contact_phone}</p>
              </div>
            </div>
          ) : (
            <>
              <div className="whitespace-pre-wrap break-words">{formatMessage(message.text ?? '')}</div>
              {linkPreview && <LinkPreviewCard preview={linkPreview} />}
            </>
          )}

          {/* Footer: time + receipts + star */}
          <div className={`flex items-center gap-1 mt-0.5 ${isMine ? 'justify-end text-white/70' : 'text-slate-400'}`}>
            {message.starred && <Star className="w-3 h-3 fill-amber-400 text-amber-400" />}
            {message.edited_at && <span className="text-[10px] italic">edited</span>}
            <span className="text-[10px]">{formatTime(message.created_at)}</span>
            {isMine && !message.deleted_for_everyone && (
              message.read_by && message.read_by.length > 0
                ? <CheckCheck className="w-3.5 h-3.5 text-sky-200" />
                : <Check className="w-3.5 h-3.5" />
            )}
          </div>

          {/* Actions menu trigger */}
          {!message.deleted_for_everyone && (
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className={`absolute -top-2 ${isMine ? '-left-7' : '-right-7'} p-1 rounded-full bg-white dark:bg-slate-800 shadow-md opacity-0 group-hover:opacity-100 transition`}
            >
              <MoreVertical className="w-3.5 h-3.5 text-slate-400" />
            </button>
          )}
        </div>

        {/* Reactions display */}
        {Object.keys(reactionCounts).length > 0 && (
          <div className={`flex gap-1 mt-0.5 ${isMine ? 'justify-end' : 'justify-start'}`}>
            {Object.entries(reactionCounts).map(([emoji, count]) => (
              <span key={emoji} className="px-1.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-xs flex items-center gap-1 border border-slate-200 dark:border-slate-600">
                {emoji} {count > 1 && <span className="text-slate-400">{count}</span>}
              </span>
            ))}
          </div>
        )}

        {menuOpen && (
          <div ref={menuRef} className={`relative z-20 ${isMine ? 'ml-auto' : ''}`}>
            {showReactions && (
              <div className={`absolute bottom-full mb-1 ${isMine ? 'right-0' : 'left-0'} flex gap-1 bg-white dark:bg-slate-800 rounded-full shadow-lg border border-slate-100 dark:border-slate-600 p-1.5`}>
                {QUICK_REACTIONS.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => { onReact(message.id, emoji); setShowReactions(false); setMenuOpen(false); }}
                    className="w-8 h-8 flex items-center justify-center text-lg rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition hover:scale-125"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            )}
            <div className={`absolute top-full mt-1 ${isMine ? 'right-0' : 'left-0'} w-44 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-100 dark:border-slate-600 py-1`}>
              <button onClick={() => { setShowReactions(true); }} className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-slate-600 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700">
                <span className="text-base">😀</span> React
              </button>
              <button onClick={() => { onReply(message); setMenuOpen(false); }} className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-slate-600 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700">
                <Reply className="w-4 h-4" /> Reply
              </button>
              <button onClick={() => { onStar(message); setMenuOpen(false); }} className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-slate-600 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700">
                <Star className="w-4 h-4" /> {message.starred ? 'Unstar' : 'Star'}
              </button>
              <button onClick={() => { onForward(message); setMenuOpen(false); }} className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-slate-600 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700">
                <Forward className="w-4 h-4" /> Forward
              </button>
              {message.text && (
                <button onClick={handleCopy} className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-slate-600 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700">
                  {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />} Copy
                </button>
              )}
              {isMine && message.text && !message.edited_at && message.media_type == null && (
                <button onClick={() => { onEdit(message); setMenuOpen(false); }} className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-slate-600 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700">
                  <Edit2 className="w-4 h-4" /> Edit
                </button>
              )}
              <button onClick={() => { onDeleteForMe(message); setMenuOpen(false); }} className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-slate-600 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700">
                <Trash2 className="w-4 h-4" /> Delete for me
              </button>
              {isMine && (
                <button onClick={() => { onDeleteForEveryone(message); setMenuOpen(false); }} className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20">
                  <Trash2 className="w-4 h-4" /> Delete for everyone
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export function ReplyPreviewBar({ replyTo, senderName, onCancel }: { replyTo: Message; senderName: string; onCancel: () => void }) {
  return (
    <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 dark:bg-slate-700/50 border-l-4 border-blue-500 rounded">
      <Reply className="w-4 h-4 text-blue-500 shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-blue-500">{replyTo.sender_id === 'me' ? 'You' : senderName}</p>
        <p className="text-sm text-slate-500 dark:text-slate-300 truncate">
          {replyTo.deleted_for_everyone ? 'Deleted message' : replyTo.text ?? (replyTo.media_type === 'image' ? 'Photo' : 'Document')}
        </p>
      </div>
      <button onClick={onCancel} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
