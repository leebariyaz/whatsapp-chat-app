-- Fix the RETURNING clause in generate_ai_response
CREATE OR REPLACE FUNCTION generate_ai_response(
  p_conversation_id uuid,
  p_user_id uuid
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_msg text;
  v_user_name text;
  v_response text;
  v_lower_msg text;
  v_convo_count int;
  v_inserted json;
  v_num1 numeric;
  v_num2 numeric;
  v_math_result text;
  v_jokes text[];
  v_fallbacks text[];
BEGIN
  SELECT text INTO v_user_msg
  FROM messages
  WHERE conversation_id = p_conversation_id
    AND sender_id = p_user_id
    AND deleted_for_everyone = false
    AND text IS NOT NULL
  ORDER BY created_at DESC
  LIMIT 1;

  IF v_user_msg IS NULL THEN
    RETURN json_build_object('error', 'No user message found');
  END IF;

  SELECT full_name INTO v_user_name FROM profiles WHERE id = p_user_id;

  SELECT count(*) INTO v_convo_count
  FROM messages
  WHERE conversation_id = p_conversation_id
    AND deleted_for_everyone = false;

  v_lower_msg := lower(v_user_msg);

  IF v_lower_msg ~ '^(hi|hello|hey|yo|sup|howdy|greetings)' AND v_convo_count <= 2 THEN
    v_response := 'Hi ' || split_part(coalesce(v_user_name, 'there'), ' ', 1) || '! 👋 Welcome to Pulse! I''m your AI assistant. I can help you with:

• **Messaging** — chats, voice notes, media sharing
• **Groups** — create and manage group chats
• **Stories** — share moments that disappear in 24h
• **Settings** — privacy, themes, notifications
• **QR Code** — share your profile instantly

What would you like to know more about?';

  ELSIF v_lower_msg ~ '(how|what|tell me|explain|guide).*(message|chat|text|send)' THEN
    v_response := '**Messaging in Pulse** 📱

• **Send a text** — Type in the message box and press Enter (or the send button)
• **Send media** — Tap the paperclip to share photos, videos, documents, or audio
• **Voice notes** — Tap the mic icon to record a voice message
• **Reply** — Hover over a message and tap the menu → Reply
• **Edit/Delete** — Your own messages can be edited or deleted
• **Reactions** — React to any message with emojis
• **Forward** — Forward messages to other chats

You can also search messages using the search icon at the top. Want to know about any other feature?';
  ELSIF v_lower_msg ~ '(how|what|tell me).*(group|groups)' THEN
    v_response := '**Group Chats** 👥

• **Create** — Tap the pencil icon → search for users → start a group
• **Add members** — Use Chat Tools (wrench icon) → Add Member
• **Group name** — Customize in Chat Tools
• **Leave** — Open Chat Tools → Leave Group

Groups support all the same features as 1:1 chats — media, voice notes, reactions, polls, and more!';
  ELSIF v_lower_msg ~ '(how|what|tell me).*(stor)' THEN
    v_response := '**Stories** 📸

• Stories are photos or text that disappear after 24 hours
• Tap the camera icon on the Stories bar to create one
• Your friends can view and react to your stories
• You can see who viewed your story

Stories are a fun way to share moments without cluttering your chats!';
  ELSIF v_lower_msg ~ '(how|what|tell me).*(qr)' THEN
    v_response := '**QR Code** 📱

• Tap the QR icon in the sidebar to generate your personal QR code
• Share it with friends so they can add you instantly
• Scan someone else''s QR code to start chatting
• No need to search by username — just scan and connect!

It''s the fastest way to add new contacts on Pulse.';
  ELSIF v_lower_msg ~ '(how|what|tell me).*(setting|privacy|theme|dark|notif)' THEN
    v_response := '**Settings & Customization** ⚙️

• **Theme** — Switch between light and dark mode
• **Accent color** — Choose your favorite color scheme
• **Font size** — Small, Medium, or Large
• **Privacy** — Control last seen, online status, read receipts, and profile photo visibility
• **Notifications** — Mute all, or customize per type (messages, groups, stories)
• **Chat lock** — Set a PIN to protect sensitive chats
• **Away mode** — Auto-reply when you''re unavailable

Open Settings from the gear icon in the sidebar!';
  ELSIF v_lower_msg ~ '(how|what|tell me).*(friend|contact|add)' THEN
    v_response := '**Adding Friends** 👥

• **Search** — Use the pencil icon to search by name or username
• **QR Code** — Scan or share QR codes for instant connection
• **Friend Requests** — Send and accept requests from the Users icon

Once connected, you can start chatting immediately!';
  ELSIF v_lower_msg ~ '(how|what|tell me).*(call|video|voice call)' THEN
    v_response := '**Voice & Video Calls** 📞

• Tap the phone icon for a voice call
• Tap the video icon for a video call
• Calls work in both 1:1 and group chats

Note: Calls require both users to be online.';
  ELSIF v_lower_msg ~ '(how|what|tell me).*(poll|vote)' THEN
    v_response := '**Polls** 📊

• Open Chat Tools (wrench icon) → Create Poll
• Add your question and options
• Choose anonymous or public voting
• Support multiple choice or single answer
• Everyone in the chat can vote in real-time

Great for making group decisions!';
  ELSIF v_lower_msg ~ '(how|what|tell me).*(event|calendar)' THEN
    v_response := '**Events** 📅

• Open Chat Tools → Create Event
• Set title, date, location, and description
• Members can RSVP: Going, Maybe, or Not Going
• See who''s attending at a glance

Perfect for planning meetups!';
  ELSIF v_lower_msg ~ '(how|what|tell me).*(todo|task|reminder)' THEN
    v_response := '**To-Do Lists & Reminders** ✅

• **To-Dos** — Create tasks in Chat Tools, assign to members, set due dates
• **Reminders** — Set reminders for yourself or pin to messages
• **Scheduled Messages** — Schedule messages to send later

Stay organized right from your chats!';
  ELSIF v_lower_msg ~ '(how|what|tell me).*(block|report|spam)' THEN
    v_response := '**Blocking & Safety** 🛡️

• **Block** — Open a chat → Chat Tools → Block Contact
• **Manage blocked** — Settings → Blocked Contacts
• **Report** — Report inappropriate behavior from Chat Tools

Blocked users cannot send you messages or see your profile.';
  ELSIF v_lower_msg ~ '(how|what|tell me).*(export|backup|download)' THEN
    v_response := '**Exporting Chats** 📥

• Open Chat Tools (wrench icon) → Export Chat
• Download your conversation as a text file
• Includes all messages, media references, and timestamps

Great for keeping records of important conversations!';
  ELSIF v_lower_msg ~ '(how|what|tell me).*(forward)' THEN
    v_response := '**Forwarding Messages** ➡️

• Hover over a message → menu icon → Forward
• Select one or more conversations to forward to
• The recipient will see it''s a forwarded message

Forward media, text, and documents with one tap!';

  ELSIF v_lower_msg ~ '(code|programming|javascript|python|react|typescript|html|css)' THEN
    v_response := 'I can help with code! Here''s a quick example:

```typescript
// A simple React component
function Greeting({ name }: { name: string }) {
  return <h1>Hello, {name}!</h1>;
}
```

Ask me about specific programming concepts and I''ll do my best to explain. For complex coding tasks, I recommend using a dedicated AI coding assistant, but I can help with basics and explain concepts! 🚀';
  ELSIF v_lower_msg ~ '(what can you do|help me|who are you|what are you)' THEN
    v_response := 'I''m your **Pulse Assistant** 🤖 — an AI built into your messaging app!

I can help you:
• Discover and learn about Pulse features
• Get tips on privacy, messaging, and customization
• Answer general questions
• Provide formatting examples (code, lists, bold/italic)
• Chat casually!

Just type your question and I''ll do my best to help. What''s on your mind?';

  ELSIF v_lower_msg ~ '^(how are you|how''s it going|what''s up|how do you do)' THEN
    v_response := 'I''m doing great, thanks for asking! 😊 I''m always here and ready to help you with anything Pulse-related. How about you? Is there anything you''d like to know about the app?';
  ELSIF v_lower_msg ~ '^(thanks|thank you|thx|ty)' THEN
    v_response := 'You''re welcome! 😊 Feel free to ask me anything else anytime. I''m always here to help!';
  ELSIF v_lower_msg ~ '^(bye|goodbye|see you|cya|gtg)' THEN
    v_response := 'See you later! 👋 Come back anytime you have questions or just want to chat. I''ll be here!';
  ELSIF v_lower_msg ~ '(good|nice|cool|awesome|great|love it|amazing)' AND length(v_lower_msg) < 30 THEN
    v_response := 'Glad you think so! 😊 Pulse is designed to be a great messaging experience. Is there anything else you''d like to explore?';
  ELSIF v_lower_msg ~ '^(yes|yeah|yep|sure|ok|okay)' AND v_convo_count <= 4 THEN
    v_response := 'Great! What would you like to know more about? I can tell you about messaging, groups, stories, settings, calls, QR codes, and more!';

  ELSIF v_lower_msg ~ '^\s*\d+\s*[\+\-\*\/x]\s*\d+\s*\??\s*$' THEN
    BEGIN
      v_num1 := (regexp_match(v_user_msg, '(\d+)'))[1]::numeric;
      v_num2 := (regexp_match(v_user_msg, '\d+\s*[\+\-\*\/x]\s*(\d+)'))[1]::numeric;
      IF v_lower_msg ~ '\+' THEN
        v_math_result := (v_num1 + v_num2)::text;
      ELSIF v_lower_msg ~ '\-' THEN
        v_math_result := (v_num1 - v_num2)::text;
      ELSIF v_lower_msg ~ '[\*x]' THEN
        v_math_result := (v_num1 * v_num2)::text;
      ELSIF v_lower_msg ~ '/' THEN
        v_math_result := (v_num1 / v_num2)::text;
      END IF;
      v_response := 'The answer is ' || v_math_result || ' 🔢';
    EXCEPTION WHEN OTHERS THEN
      v_response := 'I can help with basic math! Try asking me something like "What is 2+2?"';
    END;

  ELSIF v_lower_msg ~ '(what.*time|what.*date|what.*day)' THEN
    v_response := 'It''s currently ' || to_char(now(), 'YYYY-MM-DD HH:MI AM') || ' (UTC). ⏰

Note: Your local time may differ. Check your device clock for the exact time in your timezone!';

  ELSIF v_lower_msg ~ '(joke|funny|make me laugh)' THEN
    v_jokes := ARRAY[
      'Why don''t programmers like nature? It has too many bugs! 🐛',
      'Why do programmers prefer dark mode? Because light attracts bugs! 🌙',
      'How many programmers does it take to change a light bulb? None — that''s a hardware problem! 💡',
      'Why did the developer go broke? Because he used up all his cache! 💰'
    ];
    v_response := v_jokes[1 + (extract(epoch from now())::int % 4)];

  ELSIF v_lower_msg ~ '^(emoji|emoticon|smiley)' THEN
    v_response := 'Here are some fun emojis you can use in your chats! 😊🎉🚀💬📸❤️👍

In Pulse, you can:
• Use the emoji picker (smiley icon) in the chat
• React to messages with quick reactions
• Send emojis in any message

Express yourself freely! 🎨';

  ELSE
    v_fallbacks := ARRAY[
      'That''s an interesting question! I''m primarily designed to help with Pulse features and general chat. Here''s what I can help with:

• **Messaging** — sending texts, media, voice notes
• **Groups** — creating and managing group chats
• **Stories** — sharing moments that disappear
• **Settings** — privacy, themes, notifications
• **QR Code** — sharing your profile

Is there a specific feature you''d like to know more about? 😊',
      'I''m not sure I fully understand, but I''m here to help! 🤔

I can assist with Pulse app features, answer general questions, or just chat. Try asking me about messaging, groups, stories, settings, or any other feature!

What would you like to explore?',
      'Great question! While I specialize in Pulse features, I''m happy to chat about anything. Here are some things I can help with:

• App features and tips
• Messaging and privacy settings
• Group chats and calls
• Stories and QR codes

What''s on your mind? 😊',
      'I''d love to help with that! I''m best at answering questions about Pulse features and general chat. Try asking me:

• "How do I send a message?"
• "What are groups?"
• "How do stories work?"
• "Tell me about settings"

What can I help you discover? 🚀'
    ];
    v_response := v_fallbacks[1 + (extract(epoch from now())::int % 4)];
  END IF;

  INSERT INTO messages (conversation_id, sender_id, text)
  VALUES (p_conversation_id, '12f8a30b-8b9a-41c2-b6db-ad57f37eab9a', v_response)
  RETURNING jsonb_build_object(
    'id', id,
    'conversation_id', conversation_id,
    'sender_id', sender_id,
    'text', text,
    'media_url', media_url,
    'media_type', media_type,
    'media_name', media_name,
    'reply_to_id', reply_to_id,
    'edited_at', edited_at,
    'deleted_for_everyone', deleted_for_everyone,
    'created_at', created_at,
    'forwarded_from_id', forwarded_from_id,
    'duration', duration,
    'location_lat', location_lat,
    'location_lng', location_lng,
    'contact_name', contact_name,
    'contact_phone', contact_phone
  ) INTO v_inserted;

  RETURN v_inserted;
END;
$$;

GRANT EXECUTE ON FUNCTION generate_ai_response TO authenticated;
