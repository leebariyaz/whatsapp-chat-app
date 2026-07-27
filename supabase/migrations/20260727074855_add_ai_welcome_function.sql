/*
# Add function to create AI welcome message as the AI user

The messages INSERT RLS policy requires sender_id = auth.uid(), so the
client cannot insert a message from the AI assistant. This function uses
SECURITY DEFINER to insert the welcome message as the AI assistant.
*/

CREATE OR REPLACE FUNCTION create_ai_welcome_message(
  p_conversation_id uuid,
  p_user_name text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO messages (conversation_id, sender_id, text)
  VALUES (
    p_conversation_id,
    '12f8a30b-8b9a-41c2-b6db-ad57f37eab9a',
    'Hi ' || COALESCE(split_part(p_user_name, ' ', 1), 'there') || '! I''m your Pulse Assistant. Ask me anything about the app, tech tips, or just chat. How can I help you today?'
  );
END;
$$;
