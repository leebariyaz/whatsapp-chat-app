/*
# Premium platform expansion - schema v3

Adds: chat folders, reminders, scheduled messages, polls, events,
shared to-do lists, friend requests, link previews, chat themes,
login history, device sessions, chat lock, auto-reply settings.

All tables get RLS with owner/participant-scoped policies.
*/

-- ============ CHAT FOLDERS ============
CREATE TABLE IF NOT EXISTS chat_folders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  icon text DEFAULT 'folder',
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS chat_folders_user_id_idx ON chat_folders(user_id);

CREATE TABLE IF NOT EXISTS chat_folder_items (
  folder_id uuid NOT NULL REFERENCES chat_folders(id) ON DELETE CASCADE,
  conversation_id uuid NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  PRIMARY KEY (folder_id, conversation_id)
);

-- ============ REMINDERS ============
CREATE TABLE IF NOT EXISTS reminders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  message_id uuid REFERENCES messages(id) ON DELETE CASCADE,
  conversation_id uuid REFERENCES conversations(id) ON DELETE CASCADE,
  title text NOT NULL,
  remind_at timestamptz NOT NULL,
  completed boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS reminders_user_id_idx ON reminders(user_id);
CREATE INDEX IF NOT EXISTS reminders_remind_at_idx ON reminders(remind_at);

-- ============ SCHEDULED MESSAGES ============
CREATE TABLE IF NOT EXISTS scheduled_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  text text,
  media_url text,
  media_type text,
  media_name text,
  reply_to_id uuid REFERENCES messages(id) ON DELETE SET NULL,
  scheduled_for timestamptz NOT NULL,
  sent boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS scheduled_messages_sender_idx ON scheduled_messages(sender_id);
CREATE INDEX IF NOT EXISTS scheduled_messages_scheduled_for_idx ON scheduled_messages(scheduled_for);

-- ============ POLLS ============
CREATE TABLE IF NOT EXISTS polls (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  created_by uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  question text NOT NULL,
  anonymous boolean DEFAULT false,
  multiple_choice boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS polls_conversation_id_idx ON polls(conversation_id);

CREATE TABLE IF NOT EXISTS poll_options (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id uuid NOT NULL REFERENCES polls(id) ON DELETE CASCADE,
  text text NOT NULL,
  sort_order integer DEFAULT 0
);
CREATE INDEX IF NOT EXISTS poll_options_poll_id_idx ON poll_options(poll_id);

CREATE TABLE IF NOT EXISTS poll_votes (
  poll_id uuid NOT NULL REFERENCES polls(id) ON DELETE CASCADE,
  option_id uuid NOT NULL REFERENCES poll_options(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  voted_at timestamptz DEFAULT now(),
  PRIMARY KEY (option_id, user_id)
);
CREATE INDEX IF NOT EXISTS poll_votes_poll_id_idx ON poll_votes(poll_id);

-- ============ EVENTS ============
CREATE TABLE IF NOT EXISTS events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  created_by uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  event_date timestamptz NOT NULL,
  location text,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS events_conversation_id_idx ON events(conversation_id);

CREATE TABLE IF NOT EXISTS event_rsvps (
  event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'maybe',
  responded_at timestamptz DEFAULT now(),
  PRIMARY KEY (event_id, user_id)
);

-- ============ SHARED TO-DO LISTS ============
CREATE TABLE IF NOT EXISTS todos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  created_by uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  assigned_to uuid REFERENCES profiles(id) ON DELETE SET NULL,
  due_date timestamptz,
  completed boolean DEFAULT false,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS todos_conversation_id_idx ON todos(conversation_id);

-- ============ FRIEND REQUESTS ============
CREATE TABLE IF NOT EXISTS friend_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  receiver_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz DEFAULT now(),
  responded_at timestamptz,
  UNIQUE (sender_id, receiver_id)
);
CREATE INDEX IF NOT EXISTS friend_requests_receiver_idx ON friend_requests(receiver_id);
CREATE INDEX IF NOT EXISTS friend_requests_sender_idx ON friend_requests(sender_id);

CREATE TABLE IF NOT EXISTS friends (
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  friend_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (user_id, friend_id)
);
CREATE INDEX IF NOT EXISTS friends_user_id_idx ON friends(user_id);

-- ============ LINK PREVIEWS ============
CREATE TABLE IF NOT EXISTS link_previews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid UNIQUE REFERENCES messages(id) ON DELETE CASCADE,
  url text NOT NULL,
  title text,
  description text,
  thumbnail_url text,
  domain text,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS link_previews_message_id_idx ON link_previews(message_id);

-- ============ CHAT THEMES (per-conversation per-user) ============
CREATE TABLE IF NOT EXISTS chat_themes (
  conversation_id uuid NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  theme text DEFAULT 'default',
  wallpaper text,
  accent_color text DEFAULT 'blue',
  bubble_style text DEFAULT 'rounded',
  PRIMARY KEY (conversation_id, user_id)
);

-- ============ LOGIN HISTORY ============
CREATE TABLE IF NOT EXISTS login_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  device_name text,
  device_type text,
  browser text,
  ip_address text,
  location text,
  success boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS login_history_user_id_idx ON login_history(user_id);

-- ============ DEVICE SESSIONS ============
CREATE TABLE IF NOT EXISTS device_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  device_name text NOT NULL,
  device_type text DEFAULT 'web',
  last_active timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS device_sessions_user_id_idx ON device_sessions(user_id);

-- ============ CHAT LOCK ============
ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS chat_lock_pin text;
ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS chat_lock_enabled boolean DEFAULT false;

CREATE TABLE IF NOT EXISTS locked_chats (
  conversation_id uuid NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  PRIMARY KEY (conversation_id, user_id)
);

-- ============ AUTO-REPLY (AWAY MODE) ============
ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS away_mode_enabled boolean DEFAULT false;
ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS away_message text DEFAULT 'I''m currently unavailable and will reply later.';

-- ============ RLS ENABLE ============
ALTER TABLE chat_folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_folder_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduled_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE poll_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE poll_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_rsvps ENABLE ROW LEVEL SECURITY;
ALTER TABLE todos ENABLE ROW LEVEL SECURITY;
ALTER TABLE friend_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE friends ENABLE ROW LEVEL SECURITY;
ALTER TABLE link_previews ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_themes ENABLE ROW LEVEL SECURITY;
ALTER TABLE login_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE device_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE locked_chats ENABLE ROW LEVEL SECURITY;

-- ============ POLICIES ============

-- chat_folders
CREATE POLICY "folders_select_own" ON chat_folders FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "folders_insert_own" ON chat_folders FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "folders_update_own" ON chat_folders FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "folders_delete_own" ON chat_folders FOR DELETE TO authenticated USING (user_id = auth.uid());

-- chat_folder_items
CREATE POLICY "folder_items_select_own" ON chat_folder_items FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM chat_folders f WHERE f.id = folder_id AND f.user_id = auth.uid())
);
CREATE POLICY "folder_items_insert_own" ON chat_folder_items FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM chat_folders f WHERE f.id = folder_id AND f.user_id = auth.uid())
);
CREATE POLICY "folder_items_delete_own" ON chat_folder_items FOR DELETE TO authenticated USING (
  EXISTS (SELECT 1 FROM chat_folders f WHERE f.id = folder_id AND f.user_id = auth.uid())
);

-- reminders
CREATE POLICY "reminders_select_own" ON reminders FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "reminders_insert_own" ON reminders FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "reminders_update_own" ON reminders FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "reminders_delete_own" ON reminders FOR DELETE TO authenticated USING (user_id = auth.uid());

-- scheduled_messages
CREATE POLICY "scheduled_select_own" ON scheduled_messages FOR SELECT TO authenticated USING (sender_id = auth.uid());
CREATE POLICY "scheduled_insert_own" ON scheduled_messages FOR INSERT TO authenticated WITH CHECK (sender_id = auth.uid());
CREATE POLICY "scheduled_update_own" ON scheduled_messages FOR UPDATE TO authenticated USING (sender_id = auth.uid()) WITH CHECK (sender_id = auth.uid());
CREATE POLICY "scheduled_delete_own" ON scheduled_messages FOR DELETE TO authenticated USING (sender_id = auth.uid());

-- polls
CREATE POLICY "polls_select_participants" ON polls FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM conversation_participants cp WHERE cp.conversation_id = polls.conversation_id AND cp.user_id = auth.uid())
);
CREATE POLICY "polls_insert_participants" ON polls FOR INSERT TO authenticated WITH CHECK (
  created_by = auth.uid() AND EXISTS (SELECT 1 FROM conversation_participants cp WHERE cp.conversation_id = polls.conversation_id AND cp.user_id = auth.uid())
);
CREATE POLICY "polls_update_own" ON polls FOR UPDATE TO authenticated USING (created_by = auth.uid()) WITH CHECK (created_by = auth.uid());
CREATE POLICY "polls_delete_own" ON polls FOR DELETE TO authenticated USING (created_by = auth.uid());

-- poll_options
CREATE POLICY "poll_options_select_participants" ON poll_options FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM polls p JOIN conversation_participants cp ON cp.conversation_id = p.conversation_id WHERE p.id = poll_options.poll_id AND cp.user_id = auth.uid())
);
CREATE POLICY "poll_options_insert_own" ON poll_options FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM polls p WHERE p.id = poll_options.poll_id AND p.created_by = auth.uid())
);
CREATE POLICY "poll_options_delete_own" ON poll_options FOR DELETE TO authenticated USING (
  EXISTS (SELECT 1 FROM polls p WHERE p.id = poll_options.poll_id AND p.created_by = auth.uid())
);

-- poll_votes
CREATE POLICY "poll_votes_select_participants" ON poll_votes FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM polls p JOIN conversation_participants cp ON cp.conversation_id = p.conversation_id WHERE p.id = poll_votes.poll_id AND cp.user_id = auth.uid())
);
CREATE POLICY "poll_votes_insert_own" ON poll_votes FOR INSERT TO authenticated WITH CHECK (
  user_id = auth.uid() AND EXISTS (SELECT 1 FROM conversation_participants cp JOIN polls p ON p.conversation_id = cp.conversation_id WHERE p.id = poll_votes.poll_id AND cp.user_id = auth.uid())
);
CREATE POLICY "poll_votes_delete_own" ON poll_votes FOR DELETE TO authenticated USING (user_id = auth.uid());

-- events
CREATE POLICY "events_select_participants" ON events FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM conversation_participants cp WHERE cp.conversation_id = events.conversation_id AND cp.user_id = auth.uid())
);
CREATE POLICY "events_insert_participants" ON events FOR INSERT TO authenticated WITH CHECK (
  created_by = auth.uid() AND EXISTS (SELECT 1 FROM conversation_participants cp WHERE cp.conversation_id = events.conversation_id AND cp.user_id = auth.uid())
);
CREATE POLICY "events_update_own" ON events FOR UPDATE TO authenticated USING (created_by = auth.uid()) WITH CHECK (created_by = auth.uid());
CREATE POLICY "events_delete_own" ON events FOR DELETE TO authenticated USING (created_by = auth.uid());

-- event_rsvps
CREATE POLICY "rsvps_select_participants" ON event_rsvps FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM conversation_participants cp JOIN events e ON e.conversation_id = cp.conversation_id WHERE e.id = event_rsvps.event_id AND cp.user_id = auth.uid())
);
CREATE POLICY "rsvps_insert_own" ON event_rsvps FOR INSERT TO authenticated WITH CHECK (
  user_id = auth.uid() AND EXISTS (SELECT 1 FROM conversation_participants cp JOIN events e ON e.conversation_id = cp.conversation_id WHERE e.id = event_rsvps.event_id AND cp.user_id = auth.uid())
);
CREATE POLICY "rsvps_update_own" ON event_rsvps FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- todos
CREATE POLICY "todos_select_participants" ON todos FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM conversation_participants cp WHERE cp.conversation_id = todos.conversation_id AND cp.user_id = auth.uid())
);
CREATE POLICY "todos_insert_participants" ON todos FOR INSERT TO authenticated WITH CHECK (
  created_by = auth.uid() AND EXISTS (SELECT 1 FROM conversation_participants cp WHERE cp.conversation_id = todos.conversation_id AND cp.user_id = auth.uid())
);
CREATE POLICY "todos_update_participants" ON todos FOR UPDATE TO authenticated USING (
  EXISTS (SELECT 1 FROM conversation_participants cp WHERE cp.conversation_id = todos.conversation_id AND cp.user_id = auth.uid())
) WITH CHECK (
  EXISTS (SELECT 1 FROM conversation_participants cp WHERE cp.conversation_id = todos.conversation_id AND cp.user_id = auth.uid())
);
CREATE POLICY "todos_delete_own" ON todos FOR DELETE TO authenticated USING (created_by = auth.uid());

-- friend_requests
CREATE POLICY "friend_requests_select_own" ON friend_requests FOR SELECT TO authenticated USING (sender_id = auth.uid() OR receiver_id = auth.uid());
CREATE POLICY "friend_requests_insert_own" ON friend_requests FOR INSERT TO authenticated WITH CHECK (sender_id = auth.uid());
CREATE POLICY "friend_requests_update_own" ON friend_requests FOR UPDATE TO authenticated USING (receiver_id = auth.uid()) WITH CHECK (receiver_id = auth.uid());
CREATE POLICY "friend_requests_delete_own" ON friend_requests FOR DELETE TO authenticated USING (sender_id = auth.uid() OR receiver_id = auth.uid());

-- friends
CREATE POLICY "friends_select_own" ON friends FOR SELECT TO authenticated USING (user_id = auth.uid() OR friend_id = auth.uid());
CREATE POLICY "friends_insert_own" ON friends FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "friends_delete_own" ON friends FOR DELETE TO authenticated USING (user_id = auth.uid() OR friend_id = auth.uid());

-- link_previews
CREATE POLICY "link_previews_select_participants" ON link_previews FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM messages m JOIN conversation_participants cp ON cp.conversation_id = m.conversation_id WHERE m.id = link_previews.message_id AND cp.user_id = auth.uid())
);
CREATE POLICY "link_previews_insert_own" ON link_previews FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "link_previews_delete_own" ON link_previews FOR DELETE TO authenticated USING (true);

-- chat_themes
CREATE POLICY "chat_themes_select_own" ON chat_themes FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "chat_themes_insert_own" ON chat_themes FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "chat_themes_update_own" ON chat_themes FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "chat_themes_delete_own" ON chat_themes FOR DELETE TO authenticated USING (user_id = auth.uid());

-- login_history
CREATE POLICY "login_history_select_own" ON login_history FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "login_history_insert_own" ON login_history FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

-- device_sessions
CREATE POLICY "device_sessions_select_own" ON device_sessions FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "device_sessions_insert_own" ON device_sessions FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "device_sessions_update_own" ON device_sessions FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "device_sessions_delete_own" ON device_sessions FOR DELETE TO authenticated USING (user_id = auth.uid());

-- locked_chats
CREATE POLICY "locked_chats_select_own" ON locked_chats FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "locked_chats_insert_own" ON locked_chats FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "locked_chats_delete_own" ON locked_chats FOR DELETE TO authenticated USING (user_id = auth.uid());
