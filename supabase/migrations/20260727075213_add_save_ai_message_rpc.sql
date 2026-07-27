/*
# Add save_ai_message RPC

Allows the client to save an AI assistant message. The messages INSERT
RLS policy requires sender_id = auth.uid(), so the client cannot insert
a message from the AI assistant directly. This SECURITY DEFINER function
bypasses RLS to insert the AI's response.

Returns the inserted message row.
*/

CREATE OR REPLACE FUNCTION save_ai_message(
  p_conversation_id uuid,
  p_text text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  inserted_row json;
BEGIN
  INSERT INTO messages (conversation_id, sender_id, text)
  VALUES (p_conversation_id, '12f8a30b-8b9a-41c2-b6db-ad57f37eab9a', p_text)
  RETURNING to_jsonb(t.*) INTO inserted_row;
  RETURN inserted_row;
END;
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION save_ai_message TO authenticated;
