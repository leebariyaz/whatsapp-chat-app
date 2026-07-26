/*
# Premium messaging platform - schema expansion

Adds: phone number, message reactions, starred messages, stories,
calls, blocked contacts, chat settings, archived/muted/favorite flags,
message forwarding, voice notes metadata, AI assistant flags.

All tables get RLS with owner/participant-scoped policies.
*/

-- ============ ALTER EXISTING TABLES ============

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_verified boolean NOT NULL DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_official boolean NOT NULL DEFAULT false;

ALTER TABLE conversations ADD COLUMN IF NOT EXISTS name text;
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS avatar_url text;
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES profiles(id) ON DELETE SET NULL;

ALTER TABLE conversation_participants ADD COLUMN IF NOT EXISTS muted boolean NOT NULL DEFAULT false;
ALTER TABLE conversation_participants ADD COLUMN IF NOT EXISTS archived boolean NOT NULL DEFAULT false;
ALTER TABLE conversation_participants ADD COLUMN IF NOT EXISTS favorite boolean NOT NULL DEFAULT false;
ALTER TABLE conversation_participants ADD COLUMN IF NOT EXISTS is_self boolean NOT NULL DEFAULT false;

ALTER TABLE messages ADD COLUMN IF NOT EXISTS forwarded_from_id uuid REFERENCES profiles(id) ON DELETE SET NULL;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS duration integer;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS location_lat double precision;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS location_lng double precision;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS contact_name text;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS contact_phone text;

-- ============ NEW TABLES ============

CREATE TABLE IF NOT EXISTS message_reactions (
  message_id uuid NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  emoji text NOT NULL,
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (message_id, user_id)
);

CREATE TABLE IF NOT EXISTS starred_messages (
  message_id uuid NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  starred_at timestamptz DEFAULT now(),
  PRIMARY KEY (message_id, user_id)
);

CREATE TABLE IF NOT EXISTS stories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  media_url text,
  media_type text,
  text_content text,
  bg_color text DEFAULT '#3b82f6',
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz DEFAULT (now() + interval '24 hours')
);
CREATE INDEX IF NOT EXISTS stories_user_id_idx ON stories(user_id);
CREATE INDEX IF NOT EXISTS stories_expires_at_idx ON stories(expires_at);

CREATE TABLE IF NOT EXISTS story_views (
  story_id uuid NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  viewed_at timestamptz DEFAULT now(),
  PRIMARY KEY (story_id, user_id)
);

CREATE TABLE IF NOT EXISTS story_replies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id uuid NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  text text NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS story_likes (
  story_id uuid NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (story_id, user_id)
);

CREATE TABLE IF NOT EXISTS calls (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  caller_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  call_type text NOT NULL DEFAULT 'voice',
  status text NOT NULL DEFAULT 'completed',
  started_at timestamptz DEFAULT now(),
  ended_at timestamptz,
  duration integer
);
CREATE INDEX IF NOT EXISTS calls_conversation_id_idx ON calls(conversation_id);

CREATE TABLE IF NOT EXISTS blocked_contacts (
  blocker_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  blocked_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  blocked_at timestamptz DEFAULT now(),
  PRIMARY KEY (blocker_id, blocked_id)
);

CREATE TABLE IF NOT EXISTS user_settings (
  user_id uuid PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  last_seen_visible boolean NOT NULL DEFAULT true,
  online_visible boolean NOT NULL DEFAULT true,
  photo_visible boolean NOT NULL DEFAULT true,
  about_visible boolean NOT NULL DEFAULT true,
  read_receipts boolean NOT NULL DEFAULT true,
  typing_visible boolean NOT NULL DEFAULT true,
  group_notifications boolean NOT NULL DEFAULT true,
  story_notifications boolean NOT NULL DEFAULT true,
  message_notifications boolean NOT NULL DEFAULT true,
  notification_sound boolean NOT NULL DEFAULT true,
  notification_vibration boolean NOT NULL DEFAULT true,
  notification_preview boolean NOT NULL DEFAULT true,
  mute_all boolean NOT NULL DEFAULT false,
  theme text NOT NULL DEFAULT 'system',
  accent_color text NOT NULL DEFAULT 'blue',
  font_size text NOT NULL DEFAULT 'medium',
  enter_to_send boolean NOT NULL DEFAULT true,
  auto_download_media boolean NOT NULL DEFAULT true,
  media_quality text NOT NULL DEFAULT 'standard',
  wallpaper text,
  two_factor_enabled boolean NOT NULL DEFAULT false,
  assistant_muted boolean NOT NULL DEFAULT false,
  updated_at timestamptz DEFAULT now()
);

-- ============ INDEXES ============

CREATE INDEX IF NOT EXISTS message_reactions_message_id_idx ON message_reactions(message_id);
CREATE INDEX IF NOT EXISTS starred_messages_user_id_idx ON starred_messages(user_id);
CREATE INDEX IF NOT EXISTS calls_conversation_id_idx ON calls(conversation_id);
CREATE INDEX IF NOT EXISTS blocked_contacts_blocker_id_idx ON blocked_contacts(blocker_id);

-- ============ RLS ENABLE ============

ALTER TABLE message_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE starred_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE story_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE story_replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE story_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE blocked_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- ============ POLICIES ============

CREATE POLICY "reactions_select_participants" ON message_reactions FOR SELECT
  TO authenticated USING (
    EXISTS (
      SELECT 1 FROM messages m
      JOIN conversation_participants cp ON cp.conversation_id = m.conversation_id
      WHERE m.id = message_reactions.message_id AND cp.user_id = auth.uid()
    )
  );
CREATE POLICY "reactions_insert_own" ON message_reactions FOR INSERT
  TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "reactions_delete_own" ON message_reactions FOR DELETE
  TO authenticated USING (user_id = auth.uid());

CREATE POLICY "starred_select_own" ON starred_messages FOR SELECT
  TO authenticated USING (user_id = auth.uid());
CREATE POLICY "starred_insert_own" ON starred_messages FOR INSERT
  TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "starred_delete_own" ON starred_messages FOR DELETE
  TO authenticated USING (user_id = auth.uid());

CREATE POLICY "stories_select_all" ON stories FOR SELECT
  TO authenticated USING (true);
CREATE POLICY "stories_insert_own" ON stories FOR INSERT
  TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "stories_update_own" ON stories FOR UPDATE
  TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "stories_delete_own" ON stories FOR DELETE
  TO authenticated USING (user_id = auth.uid());

CREATE POLICY "story_views_select_own" ON story_views FOR SELECT
  TO authenticated USING (
    user_id = auth.uid() OR EXISTS (
      SELECT 1 FROM stories s WHERE s.id = story_views.story_id AND s.user_id = auth.uid()
    )
  );
CREATE POLICY "story_views_insert_own" ON story_views FOR INSERT
  TO authenticated WITH CHECK (user_id = auth.uid());

CREATE POLICY "story_replies_select_own" ON story_replies FOR SELECT
  TO authenticated USING (
    user_id = auth.uid() OR EXISTS (
      SELECT 1 FROM stories s WHERE s.id = story_replies.story_id AND s.user_id = auth.uid()
    )
  );
CREATE POLICY "story_replies_insert_own" ON story_replies FOR INSERT
  TO authenticated WITH CHECK (user_id = auth.uid());

CREATE POLICY "story_likes_select_own" ON story_likes FOR SELECT
  TO authenticated USING (
    user_id = auth.uid() OR EXISTS (
      SELECT 1 FROM stories s WHERE s.id = story_likes.story_id AND s.user_id = auth.uid()
    )
  );
CREATE POLICY "story_likes_insert_own" ON story_likes FOR INSERT
  TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "story_likes_delete_own" ON story_likes FOR DELETE
  TO authenticated USING (user_id = auth.uid());

CREATE POLICY "calls_select_participants" ON calls FOR SELECT
  TO authenticated USING (
    EXISTS (
      SELECT 1 FROM conversation_participants cp
      WHERE cp.conversation_id = calls.conversation_id AND cp.user_id = auth.uid()
    )
  );
CREATE POLICY "calls_insert_own" ON calls FOR INSERT
  TO authenticated WITH CHECK (caller_id = auth.uid());
CREATE POLICY "calls_update_own" ON calls FOR UPDATE
  TO authenticated USING (caller_id = auth.uid()) WITH CHECK (caller_id = auth.uid());

CREATE POLICY "blocked_select_own" ON blocked_contacts FOR SELECT
  TO authenticated USING (blocker_id = auth.uid());
CREATE POLICY "blocked_insert_own" ON blocked_contacts FOR INSERT
  TO authenticated WITH CHECK (blocker_id = auth.uid());
CREATE POLICY "blocked_delete_own" ON blocked_contacts FOR DELETE
  TO authenticated USING (blocker_id = auth.uid());

CREATE POLICY "settings_select_own" ON user_settings FOR SELECT
  TO authenticated USING (user_id = auth.uid());
CREATE POLICY "settings_insert_own" ON user_settings FOR INSERT
  TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "settings_update_own" ON user_settings FOR UPDATE
  TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- ============ AUTO-CREATE USER SETTINGS ON SIGNUP ============

CREATE OR REPLACE FUNCTION handle_new_profile() RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_settings (user_id) VALUES (NEW.id) ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_profile_created ON profiles;
CREATE TRIGGER on_profile_created AFTER INSERT ON profiles
  FOR EACH ROW EXECUTE FUNCTION handle_new_profile();
