export interface Profile {
  id: string;
  username: string;
  full_name: string;
  avatar_url: string | null;
  bio: string | null;
  last_seen: string;
  created_at: string;
}

export interface Conversation {
  id: string;
  is_group: boolean;
  created_at: string;
  participants: Profile[];
  last_message?: Message;
  unread_count?: number;
  pinned?: boolean;
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
  reply_to?: Message | null;
  edited_at: string | null;
  deleted_for_everyone: boolean;
  created_at: string;
  read_by?: string[];
}

export interface TypingStatus {
  conversation_id: string;
  user_id: string;
  is_typing: boolean;
  updated_at: string;
}
