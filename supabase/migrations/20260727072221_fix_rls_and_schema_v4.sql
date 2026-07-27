/*
# Fix critical RLS policies and missing columns (v4)

## Problem
Several RLS policies were too restrictive or missing entirely, breaking core messaging features:
1. conversation_participants INSERT only allowed user_id = auth.uid(), making it impossible
   to add the other user when creating a 1:1 chat. This broke ALL new conversation creation.
2. message_reads had no UPDATE policy, so upsert (used for read receipts) failed silently.
3. message_hidden had no UPDATE/DELETE policy, so "clear chat" upsert failed.
4. messages had no DELETE policy, preventing message deletion.
5. conversation_participants had no DELETE policy, preventing group member removal.
6. user_settings was missing high_contrast and dyslexia_font columns that the TypeScript
   types reference, causing settings load/save to fail.
7. friend_requests UNIQUE(sender_id, receiver_id) prevented re-sending a request after
   a previous one was declined.

## Changes

### RLS Policy Fixes
- conversation_participants: REPLACE INSERT policy to allow adding others to brand-new
  conversations (where no participants exist yet). This lets the current user insert both
  themselves and the other participant in a single INSERT statement.
- conversation_participants: ADD DELETE policy for leaving conversations / removing members.
- message_reads: ADD UPDATE policy so upsert works for read receipts.
- message_hidden: ADD UPDATE and DELETE policies so clear-chat upsert and unhide work.
- messages: ADD DELETE policy so messages can be deleted (not just soft-deleted).

### Schema Fixes
- user_settings: ADD high_contrast boolean DEFAULT false
- user_settings: ADD dyslexia_font boolean DEFAULT false
- friend_requests: DROP the UNIQUE(sender_id, receiver_id) constraint and replace with a
  UNIQUE index on (sender_id, receiver_id) WHERE status = 'pending' so that only one
  PENDING request can exist per pair, but declined requests can be re-sent.

### Security
All new/modified policies maintain ownership or participant-scoping:
- conversation_participants INSERT: user_id = auth.uid() OR conversation is empty (brand new)
- conversation_participants DELETE: user_id = auth.uid() (leaving) OR conversation created_by = auth.uid() (admin removing)
- message_reads UPDATE: user_id = auth.uid()
- message_hidden UPDATE/DELETE: user_id = auth.uid()
- messages DELETE: sender_id = auth.uid()
*/

-- ============ FIX: conversation_participants INSERT policy ============
-- Drop the old overly-restrictive policy and replace with one that allows
-- adding other users to brand-new conversations.
DROP POLICY IF EXISTS "cp_insert_own" ON conversation_participants;
CREATE POLICY "cp_insert_own" ON conversation_participants FOR INSERT
  TO authenticated WITH CHECK (
    user_id = auth.uid()
    OR NOT EXISTS (
      SELECT 1 FROM conversation_participants cp
      WHERE cp.conversation_id = conversation_participants.conversation_id
    )
  );

-- ============ ADD: conversation_participants DELETE policy ============
DROP POLICY IF EXISTS "cp_delete_own" ON conversation_participants;
CREATE POLICY "cp_delete_own" ON conversation_participants FOR DELETE
  TO authenticated USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM conversations c
      WHERE c.id = conversation_participants.conversation_id AND c.created_by = auth.uid()
    )
  );

-- ============ FIX: message_reads UPDATE policy ============
DROP POLICY IF EXISTS "message_reads_update_own" ON message_reads;
CREATE POLICY "message_reads_update_own" ON message_reads FOR UPDATE
  TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- ============ FIX: message_hidden UPDATE + DELETE policies ============
DROP POLICY IF EXISTS "message_hidden_update_own" ON message_hidden;
CREATE POLICY "message_hidden_update_own" ON message_hidden FOR UPDATE
  TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "message_hidden_delete_own" ON message_hidden;
CREATE POLICY "message_hidden_delete_own" ON message_hidden FOR DELETE
  TO authenticated USING (user_id = auth.uid());

-- ============ ADD: messages DELETE policy ============
DROP POLICY IF EXISTS "messages_delete_own" ON messages;
CREATE POLICY "messages_delete_own" ON messages FOR DELETE
  TO authenticated USING (sender_id = auth.uid());

-- ============ FIX: user_settings missing columns ============
ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS high_contrast boolean NOT NULL DEFAULT false;
ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS dyslexia_font boolean NOT NULL DEFAULT false;

-- ============ FIX: friend_requests unique constraint ============
-- Drop the old UNIQUE constraint that blocks re-sending after decline
ALTER TABLE friend_requests DROP CONSTRAINT IF EXISTS friend_requests_sender_id_receiver_id_key;

-- Add a partial unique index: only one PENDING request per (sender, receiver) pair
DROP INDEX IF EXISTS friend_requests_pending_unique;
CREATE UNIQUE INDEX friend_requests_pending_unique
  ON friend_requests (sender_id, receiver_id)
  WHERE status = 'pending';
