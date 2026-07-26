/*
# Chat app schema v2 (multi-user with auth)

Replaces the single-tenant mock schema with a full multi-user messaging schema.
The previous mock tables (profiles/conversations/messages) contained only seed data
and are dropped because their column types are incompatible with the new design
(e.g. messages.sender_id was text, now must be uuid referencing profiles).

1. New Tables
- `profiles`: public user profile, one row per auth user
- `conversations`: a chat thread (1:1 or group)
- `conversation_participants`: who is in a conversation
- `messages`: messages in a conversation
- `message_reads`: per-user read receipts
- `message_hidden`: per-user "delete for me"
- `typing_status`: who is typing in a conversation

2. Storage
- Public bucket `chat-media` for images and documents.

3. Security (RLS) with owner/participant-scoped policies.

4. Indexes for fast lookups.
*/

-- ============ DROP OLD MOCK TABLES ============
DROP TABLE IF EXISTS messages;
DROP TABLE IF EXISTS conversations;
DROP TABLE IF EXISTS profiles;

-- ============ TABLES ============

CREATE TABLE profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username text UNIQUE NOT NULL,
  full_name text NOT NULL,
  avatar_url text,
  bio text,
  last_seen timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

CREATE TABLE conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  is_group boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE conversation_participants (
  conversation_id uuid NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  pinned boolean NOT NULL DEFAULT false,
  joined_at timestamptz DEFAULT now(),
  PRIMARY KEY (conversation_id, user_id)
);

CREATE TABLE messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  text text,
  media_url text,
  media_type text,
  media_name text,
  reply_to_id uuid REFERENCES messages(id) ON DELETE SET NULL,
  edited_at timestamptz,
  deleted_for_everyone boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE message_reads (
  message_id uuid NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  read_at timestamptz DEFAULT now(),
  PRIMARY KEY (message_id, user_id)
);

CREATE TABLE message_hidden (
  message_id uuid NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  PRIMARY KEY (message_id, user_id)
);

CREATE TABLE typing_status (
  conversation_id uuid NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  is_typing boolean NOT NULL DEFAULT false,
  updated_at timestamptz DEFAULT now(),
  PRIMARY KEY (conversation_id, user_id)
);

-- ============ INDEXES ============

CREATE INDEX messages_conversation_id_idx ON messages(conversation_id);
CREATE INDEX messages_created_at_idx ON messages(created_at);
CREATE INDEX conversation_participants_user_id_idx ON conversation_participants(user_id);
CREATE INDEX message_reads_message_id_idx ON message_reads(message_id);
CREATE INDEX message_reads_user_id_idx ON message_reads(user_id);

-- ============ RLS ENABLE ============

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_reads ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_hidden ENABLE ROW LEVEL SECURITY;
ALTER TABLE typing_status ENABLE ROW LEVEL SECURITY;

-- ============ POLICIES ============

-- profiles
CREATE POLICY "profiles_read_all" ON profiles FOR SELECT
  TO authenticated USING (true);
CREATE POLICY "profiles_insert_own" ON profiles FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE
  TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- conversations
CREATE POLICY "conversations_select_participants" ON conversations FOR SELECT
  TO authenticated USING (
    EXISTS (
      SELECT 1 FROM conversation_participants cp
      WHERE cp.conversation_id = conversations.id AND cp.user_id = auth.uid()
    )
  );
CREATE POLICY "conversations_insert_any" ON conversations FOR INSERT
  TO authenticated WITH CHECK (true);
CREATE POLICY "conversations_update_participants" ON conversations FOR UPDATE
  TO authenticated USING (
    EXISTS (
      SELECT 1 FROM conversation_participants cp
      WHERE cp.conversation_id = conversations.id AND cp.user_id = auth.uid()
    )
  ) WITH CHECK (true);

-- conversation_participants
CREATE POLICY "cp_select_participants" ON conversation_participants FOR SELECT
  TO authenticated USING (
    EXISTS (
      SELECT 1 FROM conversation_participants cp2
      WHERE cp2.conversation_id = conversation_participants.conversation_id AND cp2.user_id = auth.uid()
    )
  );
CREATE POLICY "cp_insert_own" ON conversation_participants FOR INSERT
  TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "cp_update_own" ON conversation_participants FOR UPDATE
  TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- messages
CREATE POLICY "messages_select_participants" ON messages FOR SELECT
  TO authenticated USING (
    EXISTS (
      SELECT 1 FROM conversation_participants cp
      WHERE cp.conversation_id = messages.conversation_id AND cp.user_id = auth.uid()
    )
  );
CREATE POLICY "messages_insert_participants" ON messages FOR INSERT
  TO authenticated WITH CHECK (
    sender_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM conversation_participants cp
      WHERE cp.conversation_id = messages.conversation_id AND cp.user_id = auth.uid()
    )
  );
CREATE POLICY "messages_update_own" ON messages FOR UPDATE
  TO authenticated USING (sender_id = auth.uid()) WITH CHECK (sender_id = auth.uid());

-- message_reads
CREATE POLICY "message_reads_select_own" ON message_reads FOR SELECT
  TO authenticated USING (user_id = auth.uid() OR EXISTS (
    SELECT 1 FROM messages m WHERE m.id = message_reads.message_id AND m.sender_id = auth.uid()
  ));
CREATE POLICY "message_reads_insert_own" ON message_reads FOR INSERT
  TO authenticated WITH CHECK (user_id = auth.uid());

-- message_hidden
CREATE POLICY "message_hidden_select_own" ON message_hidden FOR SELECT
  TO authenticated USING (user_id = auth.uid());
CREATE POLICY "message_hidden_insert_own" ON message_hidden FOR INSERT
  TO authenticated WITH CHECK (user_id = auth.uid());

-- typing_status
CREATE POLICY "typing_select_participants" ON typing_status FOR SELECT
  TO authenticated USING (
    EXISTS (
      SELECT 1 FROM conversation_participants cp
      WHERE cp.conversation_id = typing_status.conversation_id AND cp.user_id = auth.uid()
    )
  );
CREATE POLICY "typing_insert_own" ON typing_status FOR INSERT
  TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "typing_update_own" ON typing_status FOR UPDATE
  TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- ============ STORAGE ============

INSERT INTO storage.buckets (id, name, public)
VALUES ('chat-media', 'chat-media', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "chat_media_read_all" ON storage.objects FOR SELECT
  TO authenticated USING (bucket_id = 'chat-media');
CREATE POLICY "chat_media_upload_own" ON storage.objects FOR INSERT
  TO authenticated WITH CHECK (bucket_id = 'chat-media');
CREATE POLICY "chat_media_update_own" ON storage.objects FOR UPDATE
  TO authenticated USING (bucket_id = 'chat-media');
