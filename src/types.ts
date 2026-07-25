export interface Profile {
  id: string;
  name: string;
  avatar: string | null;
  online: boolean;
}

export interface Conversation {
  id: string;
  profile_id: string;
  profile: Profile;
  created_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  text: string;
  created_at: string;
}
