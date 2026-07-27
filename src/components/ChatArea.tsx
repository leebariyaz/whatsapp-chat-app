import { useEffect, useRef, useState } from 'react';
import { Send, Paperclip, Smile, Image as ImageIcon, FileText, Loader2, ArrowLeft, Phone, Video, Mic, MapPin, Contact, Star, Trash2, Archive, BellOff, Pin, Download, X, Bold, Italic, Code, List, ListOrdered, Strikethrough, Wrench, Palette, Clock, Sparkles, AlertCircle, RotateCcw } from 'lucide-react';
import type { Conversation, Message, Profile } from '@/types';
import { AI_ASSISTANT_ID } from '@/types';
import { formatLastSeen } from '@/utils';
import Avatar from '@/components/Avatar';
import MessageBubble, { ReplyPreviewBar } from '@/components/MessageBubble';
import EmojiPicker from '@/components/EmojiPicker';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';

interface ChatAreaProps {
  conversation: Conversation | null;
  messages: Message[];
  loadingMessages: boolean;
  participants: Record<string, Profile>;
  typingUserIds: string[];
  onBack: () => void;
  onSendMessage: (payload: { text?: string; mediaUrl?: string; mediaType?: string; mediaName?: string; replyToId?: string; duration?: number; forwardedFromId?: string; locationLat?: number; locationLng?: number; contactName?: string; contactPhone?: string }) => Promise<void>;
  onEditMessage: (message: Message, newText: string) => Promise<void>;
  onDeleteForMe: (message: Message) => Promise<void>;
  onDeleteForEveryone: (message: Message) => Promise<void>;
  onMarkRead: (messages: Message[]) => Promise<void>;
  onSetTyping: (isTyping: boolean) => Promise<void>;
  onReact: (messageId: string, emoji: string) => Promise<void>;
  onStar: (message: Message) => Promise<void>;
  onTogglePin: () => Promise<void>;
  onToggleMute: () => Promise<void>;
  onToggleArchive: () => Promise<void>;
  onClearChat: () => Promise<void>;
  onExportChat: () => void;
  onForward: (message: Message) => void;
  onCall: (type: 'voice' | 'video') => void;
  onOpenTools: () => void;
  onOpenCustomize: () => void;
  onOpenScheduled: () => void;
  aiThinking?: boolean;
  aiError?: string | null;
  onRetryAi?: () => void;
}

export default function ChatArea({
  conversation, messages, loadingMessages, participants, typingUserIds,
  onBack, onSendMessage, onEditMessage, onDeleteForMe, onDeleteForEveryone, onMarkRead, onSetTyping,
  onReact, onStar, onTogglePin, onToggleMute, onToggleArchive, onClearChat, onExportChat, onForward, onCall, onOpenTools, onOpenCustomize, onOpenScheduled,
  aiThinking, aiError, onRetryAi,
}: ChatAreaProps) {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [text, setText] = useState('');
  const [showEmoji, setShowEmoji] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const [editing, setEditing] = useState<Message | null>(null);
  const [copied, setCopied] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showFormat, setShowFormat] = useState(false);
  const [recording, setRecording] = useState(false);
  const [recordTime, setRecordTime] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const imageRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLInputElement>(null);
  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const otherUser = conversation?.participants.find((p) => p.id !== profile?.id);
  const isGroup = conversation?.is_group ?? false;
  const isSelf = conversation?.is_self ?? false;
  const isAiChat = conversation?.participants.some((p) => p.id === AI_ASSISTANT_ID) ?? false;

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages.length]);

  useEffect(() => {
    if (conversation && messages.length) {
      const unread = messages.filter((m) => m.sender_id !== profile?.id && !(m.read_by ?? []).includes(profile?.id ?? ''));
      if (unread.length) onMarkRead(unread);
    }
  }, [conversation?.id, messages.length]);

  useEffect(() => {
    setText('');
    setReplyTo(null);
    setEditing(null);
    setShowEmoji(false);
    setShowMenu(false);
  }, [conversation?.id]);

  const handleSend = async () => {
    const trimmed = text.trim();
    if (!trimmed || !conversation) return;
    if (editing) {
      await onEditMessage(editing, trimmed);
      setEditing(null);
    } else {
      await onSendMessage({ text: trimmed, replyToId: replyTo?.id });
      setReplyTo(null);
    }
    setText('');
    onSetTyping(false);
  };

  const handleTyping = (value: string) => {
    setText(value);
    if (!conversation) return;
    onSetTyping(true);
    if (typingTimer.current) clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => onSetTyping(false), 2500);
  };

  const uploadMedia = async (file: File, type: 'image' | 'video' | 'audio' | 'voice' | 'document') => {
    if (!profile || !conversation) return;
    setUploading(true);
    try {
      const ext = file.name.split('.').pop() || 'bin';
      const path = `${profile.id}/${type}-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from('chat-media').upload(path, file);
      if (upErr) throw upErr;
      await onSendMessage({
        mediaUrl: path,
        mediaType: type,
        mediaName: type === 'document' ? file.name : undefined,
        text: text.trim() || undefined,
        replyToId: replyTo?.id,
      });
      setReplyTo(null);
      setText('');
    } catch (err) {
      console.error('Upload failed', err);
      toast('Failed to upload file', 'error');
    } finally {
      setUploading(false);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];
      recorder.ondataavailable = (e) => audioChunksRef.current.push(e.data);
      recorder.onstop = async () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const file = new File([blob], `voice-${Date.now()}.webm`, { type: 'audio/webm' });
        await uploadMedia(file, 'voice');
        stream.getTracks().forEach((t) => t.stop());
      };
      recorder.start();
      setRecording(true);
      setRecordTime(0);
      recordTimerRef.current = setInterval(() => setRecordTime((t) => t + 1), 1000);
    } catch (err) {
      console.error('Microphone access denied', err);
      toast('Microphone access denied', 'error');
    }
  };

  const stopRecording = (cancel: boolean) => {
    if (recordTimerRef.current) clearInterval(recordTimerRef.current);
    if (recording && mediaRecorderRef.current) {
      if (cancel) {
        mediaRecorderRef.current.ondataavailable = null;
        mediaRecorderRef.current.onstop = () => {
          mediaRecorderRef.current?.stream.getTracks().forEach((t) => t.stop());
        };
      }
      mediaRecorderRef.current.stop();
    }
    setRecording(false);
    setRecordTime(0);
  };

  const handleCopy = (t: string) => {
    navigator.clipboard.writeText(t);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
    toast('Copied to clipboard', 'success');
  };

  const sendLocation = () => {
    if (!navigator.geolocation) { toast('Geolocation not supported', 'error'); return; }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        onSendMessage({ locationLat: pos.coords.latitude, locationLng: pos.coords.longitude });
      },
      () => toast('Could not get your location', 'error')
    );
  };

  if (!conversation) {
    return (
      <div className="flex-1 hidden md:flex items-center justify-center bg-slate-50 dark:bg-slate-900 chat-bg">
        <div className="text-center max-w-sm px-8">
          <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-blue-100 to-emerald-100 dark:from-slate-700 dark:to-slate-800 flex items-center justify-center">
            <Send className="w-10 h-10 text-blue-400" />
          </div>
          <h2 className="text-xl font-semibold text-slate-700 dark:text-slate-200 mb-2">Pulse</h2>
          <p className="text-slate-400 text-sm leading-relaxed">
            Select a conversation to start messaging, or begin a new chat. Your messages are synced in real time.
          </p>
        </div>
      </div>
    );
  }

  const typingNames = typingUserIds
    .filter((id) => id !== profile?.id)
    .map((id) => participants[id]?.full_name?.split(' ')[0])
    .filter(Boolean);

  const headerName = isSelf ? 'Message Yourself' : isGroup ? (conversation.name ?? 'Group chat') : (otherUser?.full_name ?? 'Unknown');
  const headerSub = isSelf ? 'Your private notes space'
    : isAiChat ? (aiThinking ? <span className="text-blue-500">thinking...</span> : 'AI Assistant')
    : typingNames.length > 0
      ? <span className="text-emerald-500">{typingNames.join(', ')} {typingNames.length === 1 ? 'is' : 'are'} typing...</span>
      : isGroup ? `${conversation.participants.length} members` : otherUser ? formatLastSeen(otherUser.last_seen) : '';

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-50 dark:bg-slate-900 chat-bg relative">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 bg-white dark:bg-slate-800 border-b border-slate-100 dark:border-slate-700">
        <button onClick={onBack} className="md:hidden p-1.5 -ml-1 text-slate-500 dark:text-slate-300">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="relative shrink-0">
          <Avatar src={otherUser?.avatar_url} name={headerName} id={otherUser?.id ?? 'x'} size="sm" verified={otherUser?.is_verified} />
          {isAiChat && (
            <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-gradient-to-br from-violet-500 to-fuchsia-500 rounded-full flex items-center justify-center border-2 border-white dark:border-slate-800">
              <Sparkles className="w-2.5 h-2.5 text-white" />
            </span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <h2 className="font-semibold text-slate-800 dark:text-white truncate">{headerName}</h2>
            {isAiChat && (
              <span className="shrink-0 px-1.5 py-0.5 rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white text-[10px] font-semibold">AI</span>
            )}
          </div>
          <p className="text-xs text-slate-400 truncate">{headerSub}</p>
        </div>
        {conversation.pinned && <Pin className="w-4 h-4 text-slate-400" />}
        {conversation.muted && <BellOff className="w-4 h-4 text-slate-400" />}
        <button onClick={() => onCall('voice')} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400">
          <Phone className="w-5 h-5" />
        </button>
        <button onClick={() => onCall('video')} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400">
          <Video className="w-5 h-5" />
        </button>
        <button onClick={onOpenTools} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400" title="Chat tools">
          <Wrench className="w-5 h-5" />
        </button>
        <button onClick={onOpenCustomize} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400" title="Customise">
          <Palette className="w-5 h-5" />
        </button>
        <button onClick={onOpenScheduled} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400" title="Scheduled messages">
          <Clock className="w-5 h-5" />
        </button>
        <div className="relative">
          <button onClick={() => setShowMenu((v) => !v)} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400">
            <Paperclip className="w-5 h-5" />
          </button>
          {showMenu && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
              <div className="absolute right-0 top-full mt-1 z-20 w-48 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-100 dark:border-slate-600 py-1">
                <button onClick={() => { imageRef.current?.click(); setShowMenu(false); }} className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-slate-600 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700">
                  <ImageIcon className="w-4 h-4" /> Photo
                </button>
                <button onClick={() => { videoRef.current?.click(); setShowMenu(false); }} className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-slate-600 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700">
                  <Video className="w-4 h-4" /> Video
                </button>
                <button onClick={() => { audioRef.current?.click(); setShowMenu(false); }} className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-slate-600 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700">
                  <Mic className="w-4 h-4" /> Audio file
                </button>
                <button onClick={() => { fileRef.current?.click(); setShowMenu(false); }} className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-slate-600 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700">
                  <FileText className="w-4 h-4" /> Document
                </button>
                <button onClick={() => { sendLocation(); setShowMenu(false); }} className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-slate-600 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700">
                  <MapPin className="w-4 h-4" /> Location
                </button>
                <div className="border-t border-slate-100 dark:border-slate-600 my-1" />
                <button onClick={() => { onTogglePin(); setShowMenu(false); }} className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-slate-600 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700">
                  <Pin className="w-4 h-4" /> {conversation.pinned ? 'Unpin' : 'Pin'}
                </button>
                <button onClick={() => { onToggleMute(); setShowMenu(false); }} className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-slate-600 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700">
                  <BellOff className="w-4 h-4" /> {conversation.muted ? 'Unmute' : 'Mute'}
                </button>
                <button onClick={() => { onToggleArchive(); setShowMenu(false); }} className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-slate-600 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700">
                  <Archive className="w-4 h-4" /> {conversation.archived ? 'Unarchive' : 'Archive'}
                </button>
                <button onClick={() => { onExportChat(); setShowMenu(false); }} className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-slate-600 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700">
                  <Download className="w-4 h-4" /> Export chat
                </button>
                <button onClick={() => { onClearChat(); setShowMenu(false); }} className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20">
                  <Trash2 className="w-4 h-4" /> Clear chat
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-2">
        {loadingMessages && (
          <div className="flex justify-center py-8">
            <Loader2 className="w-6 h-6 text-slate-300 animate-spin" />
          </div>
        )}
        {!loadingMessages && messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <p className="text-slate-400 text-sm">No messages yet. Say hello!</p>
          </div>
        )}
        {messages.map((m) => (
          <MessageBubble
            key={m.id}
            message={m}
            sender={participants[m.sender_id]}
            isMine={m.sender_id === profile?.id}
            isGroup={isGroup}
            replyTo={messages.find((x) => x.id === m.reply_to_id)}
            onReply={(msg) => setReplyTo(msg)}
            onEdit={(msg) => { setEditing(msg); setText(msg.text ?? ''); }}
            onDeleteForMe={onDeleteForMe}
            onDeleteForEveryone={onDeleteForEveryone}
            onCopy={handleCopy}
            onReact={onReact}
            onStar={onStar}
            onForward={onForward}
          />
        ))}

        {/* AI typing indicator */}
        {aiThinking && (
          <div className="flex gap-2 justify-start">
            <Avatar src={otherUser?.avatar_url} name={headerName} id={otherUser?.id ?? 'x'} size="sm" />
            <div className="px-4 py-3 rounded-2xl rounded-bl-sm bg-white dark:bg-slate-700 shadow-sm border border-slate-100 dark:border-slate-600">
              <div className="flex gap-1">
                <span className="w-2 h-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}

        {/* AI error with retry */}
        {aiError && (
          <div className="flex justify-center">
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
              <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
              <span className="text-sm text-amber-700 dark:text-amber-300">{aiError}</span>
              <button onClick={onRetryAi} className="flex items-center gap-1 px-2 py-1 rounded-lg bg-amber-100 dark:bg-amber-800/40 text-amber-700 dark:text-amber-200 text-xs font-medium hover:bg-amber-200 dark:hover:bg-amber-800/60 transition">
                <RotateCcw className="w-3 h-3" /> Retry
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Reply / edit bar */}
      {(replyTo || editing) && (
        <ReplyPreviewBar
          replyTo={(replyTo ?? editing)!}
          senderName={participants[(replyTo ?? editing)!.sender_id]?.full_name ?? 'Someone'}
          onCancel={() => { setReplyTo(null); setEditing(null); setText(''); }}
        />
      )}

      {/* Input */}
      <div className="px-4 py-3 bg-white dark:bg-slate-800 border-t border-slate-100 dark:border-slate-700">
        {recording ? (
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 flex-1">
              <span className="w-3 h-3 rounded-full bg-rose-500 animate-pulse" />
              <span className="text-sm text-slate-500 dark:text-slate-300">Recording... {recordTime}s</span>
            </div>
            <button onClick={() => stopRecording(true)} className="p-2 rounded-full text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20">
              <X className="w-5 h-5" />
            </button>
            <button onClick={() => stopRecording(false)} className="p-3 rounded-full bg-gradient-to-br from-blue-500 to-emerald-500 text-white">
              <Send className="w-5 h-5" />
            </button>
          </div>
        ) : (
          <div className="flex items-end gap-2 relative">
            {showEmoji && (
              <EmojiPicker onSelect={(e) => setText((t) => t + e)} onClose={() => setShowEmoji(false)} />
            )}
            <button onClick={() => setShowEmoji((v) => !v)} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400">
              <Smile className="w-5 h-5" />
            </button>
            <button onClick={() => setShowFormat((v) => !v)} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400" title="Formatting">
              <Bold className="w-5 h-5" />
            </button>
            {showFormat && (
              <div className="absolute bottom-full mb-2 left-0 flex items-center gap-1 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-100 dark:border-slate-600 p-1.5 z-30">
                <button onClick={() => setText((t) => `**${t}**`)} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-300"><Bold className="w-4 h-4" /></button>
                <button onClick={() => setText((t) => `*${t}*`)} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-300"><Italic className="w-4 h-4" /></button>
                <button onClick={() => setText((t) => `~~${t}~~`)} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-300"><Strikethrough className="w-4 h-4" /></button>
                <button onClick={() => setText((t) => '`' + t + '`')} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-300"><Code className="w-4 h-4" /></button>
                <button onClick={() => setText((t) => `- ${t}`)} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-300"><List className="w-4 h-4" /></button>
                <button onClick={() => setText((t) => `1. ${t}`)} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-300"><ListOrdered className="w-4 h-4" /></button>
              </div>
            )}
            <input ref={imageRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadMedia(f, 'image'); e.target.value = ''; }} />
            <input ref={videoRef} type="file" accept="video/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadMedia(f, 'video'); e.target.value = ''; }} />
            <input ref={audioRef} type="file" accept="audio/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadMedia(f, 'audio'); e.target.value = ''; }} />
            <input ref={fileRef} type="file" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadMedia(f, 'document'); e.target.value = ''; }} />

            <textarea
              value={text}
              onChange={(e) => handleTyping(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
              placeholder={editing ? 'Edit message...' : 'Type a message...'}
              rows={1}
              className="flex-1 max-h-32 px-4 py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800 resize-none"
            />
            {text.trim() ? (
              <button onClick={handleSend} disabled={uploading} className="p-3 rounded-full bg-gradient-to-br from-blue-500 to-emerald-500 text-white hover:opacity-90 disabled:opacity-40 transition shrink-0">
                {uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
              </button>
            ) : (
              <button onClick={startRecording} className="p-3 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 transition shrink-0">
                <Mic className="w-5 h-5" />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
