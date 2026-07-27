-- Add UPDATE policy for friends table so upsert works during friend acceptance
CREATE POLICY "friends_update_own" ON friends FOR UPDATE
  TO authenticated USING (user_id = auth.uid() OR friend_id = auth.uid())
  WITH CHECK (user_id = auth.uid() OR friend_id = auth.uid());
