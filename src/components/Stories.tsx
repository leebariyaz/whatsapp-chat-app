import { useEffect, useState, useRef } from 'react';
import { X, Plus, Loader2, Heart, Eye, Send, Camera } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import type { Story, Profile } from '@/types';
import Avatar from '@/components/Avatar';

interface StoriesBarProps {
  onOpenStory: (userId: string) => void;
}

export function StoriesBar({ onOpenStory }: StoriesBarProps) {
  const { profile } = useAuth();
  const [stories, setStories] = useState<Record<string, Story[]>>({});
  const [users, setUsers] = useState<Record<string, Profile>>({});

  useEffect(() => {
    if (!profile) return;
    (async () => {
      const { data } = await supabase
        .from('stories')
        .select('id, user_id, media_url, media_type, text_content, bg_color, created_at, expires_at')
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false });
      const storyList = (data ?? []) as Story[];
      const byUser: Record<string, Story[]> = {};
      storyList.forEach((s) => {
        if (!byUser[s.user_id]) byUser[s.user_id] = [];
        if (!byUser[s.user_id].find((x) => x.id === s.id)) byUser[s.user_id].push(s);
      });
      setStories(byUser);

      const userIds = Object.keys(byUser);
      if (userIds.length) {
        const { data: profs } = await supabase
          .from('profiles')
          .select('id, username, full_name, avatar_url, bio, phone, last_seen, created_at, is_verified, is_official')
          .in('id', userIds);
        const map: Record<string, Profile> = {};
        (profs ?? []).forEach((p) => { map[p.id] = p as Profile; });
        setUsers(map);
      }
    })();
  }, [profile]);

  const userIds = Object.keys(stories);
  if (!userIds.length && !profile) return null;

  return (
    <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700 flex gap-3 overflow-x-auto">
      {/* My status / Add */}
      <button onClick={() => onOpenStory(profile?.id ?? '')} className="flex flex-col items-center gap-1 shrink-0">
        <div className="relative">
          <Avatar src={profile?.avatar_url} name={profile?.full_name ?? 'Me'} id={profile?.id ?? 'me'} size="md" />
          <span className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full bg-blue-500 border-2 border-white dark:border-slate-800 flex items-center justify-center">
            <Plus className="w-3 h-3 text-white" />
          </span>
        </div>
        <span className="text-xs text-slate-500 dark:text-slate-400 max-w-12 truncate">My status</span>
      </button>

      {userIds.filter((id) => id !== profile?.id).map((uid) => {
        const user = users[uid];
        if (!user) return null;
        return (
          <button key={uid} onClick={() => onOpenStory(uid)} className="flex flex-col items-center gap-1 shrink-0">
            <div className="rounded-full p-0.5 bg-gradient-to-tr from-blue-500 to-emerald-500">
              <div className="rounded-full p-0.5 bg-white dark:bg-slate-800">
                <Avatar src={user.avatar_url} name={user.full_name} id={user.id} size="md" verified={user.is_verified} />
              </div>
            </div>
            <span className="text-xs text-slate-500 dark:text-slate-400 max-w-12 truncate">{user.full_name.split(' ')[0]}</span>
          </button>
        );
      })}
    </div>
  );
}

interface StoryViewerProps {
  userId: string;
  onClose: () => void;
}

export function StoryViewer({ userId, onClose }: StoryViewerProps) {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [userStories, setUserStories] = useState<Story[]>([]);
  const [user, setUser] = useState<Profile | null>(null);
  const [index, setIndex] = useState(0);
  const [reply, setReply] = useState('');
  const [liked, setLiked] = useState(false);
  const [views, setViews] = useState(0);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('stories')
        .select('id, user_id, media_url, media_type, text_content, bg_color, created_at, expires_at')
        .eq('user_id', userId)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: true });
      setUserStories((data ?? []) as Story[]);

      const { data: prof } = await supabase
        .from('profiles')
        .select('id, username, full_name, avatar_url, bio, phone, last_seen, created_at, is_verified, is_official')
        .eq('id', userId)
        .maybeSingle();
      setUser(prof as Profile | null);

      // Mark as viewed
      if (profile && data && data.length) {
        const current = (data as Story[])[0];
        await supabase.from('story_views').upsert({ story_id: current.id, user_id: profile.id }, { onConflict: 'story_id,user_id' });
        const { count } = await supabase.from('story_views').select('*', { count: 'exact', head: true }).eq('story_id', current.id);
        setViews(count ?? 0);
      }
    })();
  }, [userId, profile]);

  const current = userStories[index];

  const handleLike = async () => {
    if (!profile || !current) return;
    setLiked((v) => !v);
    if (liked) {
      await supabase.from('story_likes').delete().eq('story_id', current.id).eq('user_id', profile.id);
    } else {
      await supabase.from('story_likes').insert({ story_id: current.id, user_id: profile.id });
    }
  };

  const handleReply = async () => {
    if (!profile || !current || !reply.trim()) return;
    await supabase.from('story_replies').insert({ story_id: current.id, user_id: profile.id, text: reply.trim() });
    setReply('');
    toast('Reply sent', 'success');
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profile) return;
    setUploading(true);
    try {
      const path = `${profile.id}/story-${Date.now()}.${file.name.split('.').pop()}`;
      await supabase.storage.from('chat-media').upload(path, file);
      await supabase.from('stories').insert({ user_id: profile.id, media_url: path, media_type: file.type.startsWith('video') ? 'video' : 'image' });
      toast('Story posted', 'success');
      onClose();
    } catch (err) {
      console.error(err);
      toast('Failed to upload story', 'error');
    } finally {
      setUploading(false);
    }
  };

  const isMyStory = userId === profile?.id;

  if (!current && !isMyStory) return null;

  if (isMyStory && userStories.length === 0) {
    return (
      <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center" onClick={onClose}>
        <div className="text-center" onClick={(e) => e.stopPropagation()}>
          <button onClick={() => fileRef.current?.click()} disabled={uploading} className="w-20 h-20 rounded-full bg-blue-500 flex items-center justify-center mx-auto mb-4 hover:opacity-90 transition">
            {uploading ? <Loader2 className="w-8 h-8 text-white animate-spin" /> : <Camera className="w-8 h-8 text-white" />}
          </button>
          <p className="text-white text-sm">Tap to add a story</p>
          <input ref={fileRef} type="file" accept="image/*,video/*" className="hidden" onChange={handleUpload} />
        </div>
      </div>
    );
  }

  const mediaUrl = current?.media_url
    ? (current.media_url.startsWith('http') ? current.media_url : `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/chat-media/${current.media_url}`)
    : null;

  return (
    <div className="fixed inset-0 z-50 bg-black/95 flex flex-col" onClick={onClose}>
      {/* Progress bars */}
      <div className="flex gap-1 p-2" onClick={(e) => e.stopPropagation()}>
        {userStories.map((_, i) => (
          <div key={i} className="flex-1 h-1 rounded-full bg-white/30">
            <div className={`h-full rounded-full bg-white transition-all ${i <= index ? 'w-full' : 'w-0'}`} />
          </div>
        ))}
      </div>

      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-2" onClick={(e) => e.stopPropagation()}>
        <Avatar src={user?.avatar_url} name={user?.full_name ?? 'Unknown'} id={user?.id ?? 'x'} size="sm" verified={user?.is_verified} />
        <div className="flex-1">
          <p className="text-white font-medium text-sm">{user?.full_name}</p>
          <p className="text-white/60 text-xs">{current ? new Date(current.created_at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : ''}</p>
        </div>
        <button onClick={onClose} className="text-white/80 hover:text-white">
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center relative" onClick={(e) => e.stopPropagation()}>
        {current?.media_type === 'image' && mediaUrl && (
          <img src={mediaUrl} alt="Story" className="max-w-full max-h-full object-contain" />
        )}
        {current?.media_type === 'video' && mediaUrl && (
          <video src={mediaUrl} controls autoPlay className="max-w-full max-h-full" />
        )}
        {current?.text_content && !current?.media_url && (
          <div className="flex items-center justify-center w-full h-full" style={{ backgroundColor: current.bg_color }}>
            <p className="text-white text-2xl font-semibold text-center px-8">{current.text_content}</p>
          </div>
        )}

        {/* Navigation */}
        {index > 0 && (
          <button onClick={() => setIndex((i) => i - 1)} className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white">
            ‹
          </button>
        )}
        {index < userStories.length - 1 && (
          <button onClick={() => setIndex((i) => i + 1)} className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white">
            ›
          </button>
        )}
      </div>

      {/* Footer */}
      {!isMyStory && current && (
        <div className="flex items-center gap-2 p-4" onClick={(e) => e.stopPropagation()}>
          <input
            type="text"
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleReply(); }}
            placeholder="Reply to story..."
            className="flex-1 px-4 py-2.5 rounded-full bg-white/10 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/30"
          />
          <button onClick={handleReply} className="p-2.5 rounded-full bg-white/10 text-white hover:bg-white/20">
            <Send className="w-5 h-5" />
          </button>
          <button onClick={handleLike} className="p-2.5 rounded-full bg-white/10 text-white hover:bg-white/20">
            <Heart className={`w-5 h-5 ${liked ? 'fill-rose-500 text-rose-500' : ''}`} />
          </button>
        </div>
      )}
      {isMyStory && (
        <div className="flex items-center justify-center gap-4 p-4 text-white/60 text-sm" onClick={(e) => e.stopPropagation()}>
          <span className="flex items-center gap-1"><Eye className="w-4 h-4" /> {views} views</span>
        </div>
      )}
    </div>
  );
}
