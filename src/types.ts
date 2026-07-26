export interface Profile {
  id: string;
  username: string;
  full_name: string;
  avatar_url: string | null;
  bio: string | null;
  phone: string | null;
  last_seen: string;
  created_at: string;
  is_verified: boolean;
  is_official: boolean;
}

export interface UserSettings {
  user_id: string;
  last_seen_visible: boolean;
  online_visible: boolean;
  photo_visible: boolean;
  about_visible: boolean;
  read_receipts: boolean;
  typing_visible: boolean;
  group_notifications: boolean;
  story_notifications: boolean;
  message_notifications: boolean;
  notification_sound: boolean;
  notification_vibration: boolean;
  notification_preview: boolean;
  mute_all: boolean;
  theme: string;
  accent_color: string;
  font_size: string;
  enter_to_send: boolean;
  auto_download_media: boolean;
  media_quality: string;
  wallpaper: string | null;
  two_factor_enabled: boolean;
  assistant_muted: boolean;
}

export interface Conversation {
  id: string;
  is_group: boolean;
  name: string | null;
  avatar_url: string | null;
  created_by: string | null;
  created_at: string;
  participants: Profile[];
  last_message?: Message;
  unread_count?: number;
  pinned?: boolean;
  muted?: boolean;
  archived?: boolean;
  favorite?: boolean;
  is_self?: boolean;
}

export interface MessageReaction {
  emoji: string;
  user_id: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  text: string | null;
  media_url: string | null;
  media_type: string | null;
  media_name: string | null;
  reply_to_id: string | null;
  edited_at: string | null;
  deleted_for_everyone: boolean;
  created_at: string;
  forwarded_from_id: string | null;
  duration: number | null;
  location_lat: number | null;
  location_lng: number | null;
  contact_name: string | null;
  contact_phone: string | null;
  read_by?: string[];
  reactions?: MessageReaction[];
  starred?: boolean;
}

export interface TypingStatus {
  conversation_id: string;
  user_id: string;
  is_typing: boolean;
  updated_at: string;
}

export interface Story {
  id: string;
  user_id: string;
  media_url: string | null;
  media_type: string | null;
  text_content: string | null;
  bg_color: string;
  created_at: string;
  expires_at: string;
  views_count?: number;
  likes_count?: number;
  viewed_by_me?: boolean;
  liked_by_me?: boolean;
}

export interface Call {
  id: string;
  conversation_id: string;
  caller_id: string;
  call_type: string;
  status: string;
  started_at: string;
  ended_at: string | null;
  duration: number | null;
}

export const AI_ASSISTANT_ID = '12f8a30b-8b9a-41c2-b6db-ad57f37eab9a';
