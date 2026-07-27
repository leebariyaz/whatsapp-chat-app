/*
# Fix friends INSERT policy for reciprocal friend acceptance

## Problem
The friends INSERT policy only allows `user_id = auth.uid()`, but when
accepting a friend request the app inserts TWO rows:
  { user_id: me, friend_id: them }   -- allowed (user_id = auth.uid())
  { user_id: them, friend_id: me }   -- BLOCKED (user_id != auth.uid())

This makes friend request acceptance fail silently — only one direction
of the friendship gets recorded.

## Fix
Allow inserting a row where user_id is the OTHER party, as long as the
current user (auth.uid()) is the friend_id AND there exists an accepted
friend request from that other user to the current user. This is the
reciprocal row created during friend acceptance.
*/

DROP POLICY IF EXISTS "friends_insert_own" ON friends;

CREATE POLICY "friends_insert_own" ON friends FOR INSERT
  TO authenticated WITH CHECK (
    user_id = auth.uid()
    OR (
      friend_id = auth.uid()
      AND EXISTS (
        SELECT 1 FROM friend_requests fr
        WHERE fr.sender_id = user_id
          AND fr.receiver_id = auth.uid()
          AND fr.status = 'accepted'
      )
    )
  );
