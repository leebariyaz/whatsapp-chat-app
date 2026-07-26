import { useEffect, useRef, useState } from 'react';
import { Send, Paperclip, Smile, Image as ImageIcon, FileText, Loader2, ArrowLeft, Phone, Video } from 'lucide-react';
import type { Conversation, Message, Profile } from '@/types';
import { formatLastSeen } from '@/utils';
import Avatar from '@/components/Avatar';
import MessageBubble, { ReplyPreviewBar } from '@/components/MessageBubble';
import EmojiPicker from '@/components/EmojiPicker';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';

interface ChatAreaProps {
  conversation: Conversation | null;
  messages: Message[];
  loadingMessages: boolean;
  participants: Record<string, Profile>;
  typingUserIds: string[];
  onBack: () => void;
  onSendMessage: (payload: { text?: string; mediaUrl?: string; mediaType?: string; mediaName?: string; replyToId?: string }) => Promise<void>;
  onEditMessage: (message: Message, newText: string) => Promise<void>;
  onDeleteForMe: (message: Message) => Promise<void>;
  onDeleteForEveryone: (message: Message) => Promise<void>;
  onMarkRead: (messages: Message[]) => Promise<void>;
  onSetTyping: (isTyping: boolean) => Promise<void>;
}

export default function ChatArea({
  conversation, messages, loadingMessages, participants, typingUserIds,
  onBack, onSendMessage, onEditMessage, onDeleteForMe, onDeleteForEveryone, onMarkRead, onSetTyping,
}: ChatAreaProps) {
  const { profile } = useAuth();
  const [text, setText] = useState('');
  const [showEmoji, setShowEmoji] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const [editing, setEditing] = useState<Message | null>(null);
  const [copied, setCopied] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const imageRef = useRef<HTMLInputElement>(null);
  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const otherUser = conversation?.participants.find((p) => p.id !== profile?.id);
  const isGroup = conversation?.is_group ?? false;

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

  const uploadMedia = async (file: File, type: 'image' | 'document') => {
    if (!profile || !conversation) return;
    setUploading(true);
    try {
      const ext = file.name.split('.').pop();
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
    } finally {
      setUploading(false);
    }
  };

  const handleCopy = (t: string) => {
    navigator.clipboard.writeText(t);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  if (!conversation) {
    return (
      <div className="flex-1 hidden md:flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <div className="text-center max-w-sm px-8">
          <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-blue-100 to-emerald-100 dark:from-slate-700 dark:to-slate-800 flex items-center justify-center">
            <Send className="w-10 h-10 text-blue-400" />
          </div>
          <h2 className="text-xl font-semibold text-slate-700 dark:text-slate-200 mb-2">ChatWave Web</h2>
          <p className="text-slate-400 text-sm leading-relaxed">
            Select a conversation from the left to start messaging, or begin a new chat. Your messages are end-to-end secured and synced in real time.
          </p>
        </div>
      </div>
    );
  }

  const typingNames = typingUserIds
    .filter((id) => id !== profile?.id)
    .map((id) => participants[id]?.full_name?.split(' ')[0])
    .filter(Boolean);

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-50 dark:bg-slate-900 relative">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 bg-white dark:bg-slate-800 border-b border-slate-100 dark:border-slate-700">
        <button onClick={onBack} className="md:hidden p-1.5 -ml-1 text-slate-500 dark:text-slate-300">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <Avatar src={otherUser?.avatar_url} name={otherUser?.full_name ?? 'Unknown'} id={otherUser?.id ?? 'x'} size="sm" />
        <div className="flex-1 min-w-0">
          <h2 className="font-semibold text-slate-800 dark:text-white truncate">
            {isGroup ? 'Group chat' : otherUser?.full_name ?? 'Unknown'}
          </h2>
          <p className="text-xs text-slate-400 truncate">
            {typingNames.length > 0 ? (
              <span className="text-emerald-500">{typingNames.join(', ')} {typingNames.length === 1 ? 'is' : 'are'} typing...</span>
            ) : isGroup ? `${conversation.participants.length} members` : otherUser ? formatLastSeen(otherUser.last_seen) : ''}
          </p>
        </div>
        <button className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400">
          <Video className="w-5 h-5" />
        </button>
        <button className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400">
          <Phone className="w-5 h-5" />
        </button>
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
          />
        ))}
      </div>

      {/* Reply / edit bar */}
      {(replyTo || editing) && (
        <ReplyPreviewBar
          replyTo={(replyTo ?? editing)!}
          senderName={participants[(replyTo ?? editing)!.sender_id]?.full_name ?? 'Someone'}
          onCancel={() => { setReplyTo(null); setEditing(null); setText(''); }}
        />
      )}

      {/* Image preview modal */}
      {previewImage && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={() => setPreviewImage(null)}>
          <img src={previewImage} alt="Preview" className="max-w-full max-h-full rounded-lg" />
        </div>
      )}

      {/* Input */}
      <div className="px-4 py-3 bg-white dark:bg-slate-800 border-t border-slate-100 dark:border-slate-700">
        <div className="flex items-end gap-2 relative">
          {showEmoji && (
            <EmojiPicker
              onSelect={(e) => setText((t) => t + e)}
              onClose={() => setShowEmoji(false)}
            />
          )}

          <button
            onClick={() => setShowEmoji((v) => !v)}
            className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400"
          >
            <Smile className="w-5 h-5" />
          </button>

          <div className="relative">
            <button className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400">
              <Paperclip className="w-5 h-5" />
            </button>
            <div className="absolute bottom-full mb-1 left-0 hidden group-hover:block">
              <div className="flex flex-col gap-1 bg-white dark:bg-slate-700 rounded-xl shadow-lg p-1 border border-slate-100 dark:border-slate-600">
                <button onClick={() => imageRef.current?.click()} className="flex items-center gap-2 px-3 py-1.5 text-sm text-slate-600 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-600 rounded-lg">
                  <ImageIcon className="w-4 h-4" /> Photo
                </button>
                <button onClick={() => fileRef.current?.click()} className="flex items-center gap-2 px-3 py-1.5 text-sm text-slate-600 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-600 rounded-lg">
                  <FileText className="w-4 h-4" /> Document
                </button>
              </div>
            </div>
          </div>

          <input ref={imageRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadMedia(f, 'image'); e.target.value = ''; }} />
          <input ref={fileRef} type="file" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadMedia(f, 'document'); e.target.value = ''; }} />

          <textarea
            value={text}
            onChange={(e) => handleTyping(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
            placeholder={editing ? 'Edit message...' : 'Type a message...'}
            rows={1}
            className="flex-1 max-h-32 px-4 py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800 resize-none"
          />

          <button
            onClick={handleSend}
            disabled={!text.trim() || uploading}
            className="p-3 rounded-full bg-gradient-to-br from-blue-500 to-emerald-500 text-white hover:opacity-90 disabled:opacity-40 transition shrink-0"
          >
            {uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
          </button>
        </div>
        {copied && <p className="absolute -top-6 right-4 text-xs text-emerald-500">Copied!</p>}
      </div>
    </div>
  );
}
