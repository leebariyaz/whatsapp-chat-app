/*
# Fix conversation_participants INSERT for multi-row inserts

## Problem
The previous policy allowed inserting other users only if the conversation
had NO participants yet. But with multi-row INSERT (inserting both me and
the other user in one statement), the first row is visible to the second
row's CHECK, so the NOT EXISTS check fails for the second row.

## Fix
Allow inserting any user_id if the conversation was created by the current
user (created_by = auth.uid()). This covers the NewChatModal flow where
the current user creates a conversation and adds both participants.
*/

DROP POLICY IF EXISTS "cp_insert_own" ON conversation_participants;

CREATE POLICY "cp_insert_own" ON conversation_participants FOR INSERT
  TO authenticated WITH CHECK (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM conversations c
      WHERE c.id = conversation_participants.conversation_id
        AND c.created_by = auth.uid()
    )
  );
