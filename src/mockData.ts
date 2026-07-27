import type { Conversation, Message, Profile } from '@/types';
import { AI_ASSISTANT_ID } from '@/types';

// ── Helpers ──────────────────────────────────────────────────────────────────

const now = new Date();
function ago(days: number, hours = 0, mins = 0): string {
  const d = new Date(now);
  d.setDate(d.getDate() - days);
  d.setHours(d.getHours() - hours);
  d.setMinutes(d.getMinutes() - mins);
  return d.toISOString();
}

let _id = 0;
const uid = (p: string) => `${p}-mock-${++_id}`;

// ── Mock Profiles ─────────────────────────────────────────────────────────────

export const MOCK_PROFILES: Record<string, Profile> = {
  'mock-p-01': { id: 'mock-p-01', username: 'sarah_connor', full_name: 'Sarah Connor', avatar_url: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=200', bio: 'Software engineer @ TechCorp. Coffee enthusiast.', phone: '+1 555-0101', last_seen: ago(0, 0, 2), created_at: ago(200), is_verified: false, is_official: false },
  'mock-p-02': { id: 'mock-p-02', username: 'mike_chen', full_name: 'Mike Chen', avatar_url: 'https://images.pexels.com/photos/220457/pexels-photo-220457.jpeg?auto=compress&cs=tinysrgb&w=200', bio: 'Product designer. Pizza lover.', phone: '+1 555-0102', last_seen: ago(0, 0, 45), created_at: ago(180), is_verified: false, is_official: false },
  'mock-p-03': { id: 'mock-p-03', username: 'emma_w', full_name: 'Emma Wilson', avatar_url: 'https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=200', bio: 'Marketing lead. Travel addict.', phone: '+1 555-0103', last_seen: ago(1, 3), created_at: ago(150), is_verified: true, is_official: false },
  'mock-p-04': { id: 'mock-p-04', username: 'david_k', full_name: 'David Kim', avatar_url: 'https://images.pexels.com/photos/614810/pexels-photo-614810.jpeg?auto=compress&cs=tinysrgb&w=200', bio: 'DevOps engineer. Gamer.', phone: '+1 555-0104', last_seen: ago(0, 0, 0), created_at: ago(120), is_verified: false, is_official: false },
  'mock-p-05': { id: 'mock-p-05', username: 'lisa_m', full_name: 'Lisa Martinez', avatar_url: 'https://images.pexels.com/photos/733872/pexels-photo-733872.jpeg?auto=compress&cs=tinysrgb&w=200', bio: 'UX researcher. Dog mom.', phone: '+1 555-0105', last_seen: ago(0, 1), created_at: ago(100), is_verified: false, is_official: false },
  'mock-p-06': { id: 'mock-p-06', username: 'tom_b', full_name: 'Tom Brown', avatar_url: 'https://images.pexels.com/photos/91227/pexels-photo-91227.jpeg?auto=compress&cs=tinysrgb&w=200', bio: 'Backend dev. Hiker.', phone: '+1 555-0106', last_seen: ago(2), created_at: ago(90), is_verified: false, is_official: false },
  'mock-p-07': { id: 'mock-p-07', username: 'jenny_l', full_name: 'Jenny Lee', avatar_url: 'https://images.pexels.com/photos/1462637/pexels-photo-1462637.jpeg?auto=compress&cs=tinysrgb&w=200', bio: 'Data scientist. Bookworm.', phone: '+1 555-0107', last_seen: ago(0, 0, 10), created_at: ago(80), is_verified: false, is_official: false },
  'mock-p-08': { id: 'mock-p-08', username: 'alex_j', full_name: 'Alex Johnson', avatar_url: 'https://images.pexels.com/photos/1681010/pexels-photo-1681010.jpeg?auto=compress&cs=tinysrgb&w=200', bio: 'Full-stack dev. Photographer.', phone: '+1 555-0108', last_seen: ago(0, 5), created_at: ago(70), is_verified: false, is_official: false },
  'mock-p-09': { id: 'mock-p-09', username: 'rachel_g', full_name: 'Rachel Green', avatar_url: 'https://images.pexels.com/photos/5905056/pexels-photo-5905056.jpeg?auto=compress&cs=tinysrgb&w=200', bio: 'Product manager. Yoga enthusiast.', phone: '+1 555-0109', last_seen: ago(0, 0, 1), created_at: ago(60), is_verified: false, is_official: false },
  'mock-p-10': { id: 'mock-p-10', username: 'kevin_z', full_name: 'Kevin Zhang', avatar_url: 'https://images.pexels.com/photos/7621374/pexels-photo-7621374.jpeg?auto=compress&cs=tinysrgb&w=200', bio: 'iOS developer. Foodie.', phone: '+1 555-0110', last_seen: ago(3), created_at: ago(50), is_verified: false, is_official: false },
  'mock-p-11': { id: 'mock-p-11', username: 'amy_t', full_name: 'Amy Thompson', avatar_url: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=200', bio: 'Sales director. Wine collector.', phone: '+1 555-0111', last_seen: ago(1), created_at: ago(40), is_verified: false, is_official: false },
  'mock-p-12': { id: 'mock-p-12', username: 'carl_s', full_name: 'Carl Smith', avatar_url: 'https://images.pexels.com/photos/697509/pexels-photo-697509.jpeg?auto=compress&cs=tinysrgb&w=200', bio: 'CTO @ StartupX. Mentor.', phone: '+1 555-0112', last_seen: ago(0, 0, 0), created_at: ago(30), is_verified: true, is_official: false },
  'mock-p-13': { id: 'mock-p-13', username: 'nina_p', full_name: 'Nina Patel', avatar_url: 'https://images.pexels.com/photos/7184465/pexels-photo-7184465.jpeg?auto=compress&cs=tinysrgb&w=200', bio: 'Graphic designer. Plant lover.', phone: '+1 555-0113', last_seen: ago(0, 2), created_at: ago(25), is_verified: false, is_official: false },
  'mock-p-14': { id: 'mock-p-14', username: 'olivia_w', full_name: 'Olivia White', avatar_url: 'https://images.pexels.com/photos/789822/pexels-photo-789822.jpeg?auto=compress&cs=tinysrgb&w=200', bio: 'Content creator. Coffee addict.', phone: '+1 555-0114', last_seen: ago(0, 0, 30), created_at: ago(20), is_verified: false, is_official: false },
  'mock-p-15': { id: 'mock-p-15', username: 'james_r', full_name: 'James Rodriguez', avatar_url: 'https://images.pexels.com/photos/1043471/pexels-photo-1043471.jpeg?auto=compress&cs=tinysrgb&w=200', bio: 'Engineering manager. Runner.', phone: '+1 555-0115', last_seen: ago(0, 0, 0), created_at: ago(15), is_verified: false, is_official: false },
  'mock-p-16': { id: 'mock-p-16', username: 'sophie_d', full_name: 'Sophie Davis', avatar_url: 'https://images.pexels.com/photos/1462630/pexels-photo-1462630.jpeg?auto=compress&cs=tinysrgb&w=200', bio: 'HR lead. Cat person.', phone: '+1 555-0116', last_seen: ago(4), created_at: ago(10), is_verified: false, is_official: false },
  'mock-p-17': { id: 'mock-p-17', username: 'ryan_m', full_name: 'Ryan Murphy', avatar_url: 'https://images.pexels.com/photos/834863/pexels-photo-834863.jpeg?auto=compress&cs=tinysrgb&w=200', bio: 'QA engineer. Musician.', phone: '+1 555-0117', last_seen: ago(1, 6), created_at: ago(8), is_verified: false, is_official: false },
  'mock-p-18': { id: 'mock-p-18', username: 'chloe_b', full_name: 'Chloe Bennett', avatar_url: 'https://images.pexels.com/photos/7621377/pexels-photo-7621377.jpeg?auto=compress&cs=tinysrgb&w=200', bio: 'Frontend dev. Dancer.', phone: '+1 555-0118', last_seen: ago(0, 0, 5), created_at: ago(5), is_verified: false, is_official: false },
  'mock-p-19': { id: 'mock-p-19', username: 'marc_w', full_name: 'Marc Williams', avatar_url: 'https://images.pexels.com/photos/834854/pexels-photo-834854.jpeg?auto=compress&cs=tinysrgb&w=200', bio: 'Security engineer. Biker.', phone: '+1 555-0119', last_seen: ago(0, 0, 0), created_at: ago(3), is_verified: false, is_official: false },
  'mock-p-20': { id: 'mock-p-20', username: 'helen_k', full_name: 'Helen Kennedy', avatar_url: 'https://images.pexels.com/photos/789821/pexels-photo-789821.jpeg?auto=compress&cs=tinysrgb&w=200', bio: 'Finance lead. Gardener.', phone: '+1 555-0120', last_seen: ago(2), created_at: ago(2), is_verified: false, is_official: false },
  AI_ASSISTANT_ID: { id: AI_ASSISTANT_ID, username: 'chatwave_ai', full_name: 'ChatWave Assistant', avatar_url: null, bio: 'Your official Pulse AI assistant.', phone: null, last_seen: ago(0, 0, 0), created_at: ago(300), is_verified: true, is_official: true },
};

// ── Mock Message Builder ──────────────────────────────────────────────────────

type MsgSeed = Partial<Pick<Message, 'text' | 'media_type' | 'media_name' | 'duration' | 'location_lat' | 'location_lng' | 'contact_name' | 'contact_phone' | 'reply_to_id' | 'forwarded_from_id' | 'deleted_for_everyone'>> & {
  fromMe?: boolean;
  ts: string;
  read?: boolean;
  reactions?: { emoji: string; user_id: string }[];
  starred?: boolean;
  edited?: boolean;
};

function buildMessages(conversationId: string, myId: string, otherId: string, seeds: MsgSeed[]): Message[] {
  return seeds.map((s) => {
    const id = uid('msg');
    const fromMe = s.fromMe ?? false;
    return {
      id,
      conversation_id: conversationId,
      sender_id: fromMe ? myId : otherId,
      text: s.text ?? null,
      media_url: s.media_type ? `mock://${conversationId}/${id}` : null,
      media_type: s.media_type ?? null,
      media_name: s.media_name ?? null,
      reply_to_id: s.reply_to_id ?? null,
      edited_at: s.edited ? s.ts : null,
      deleted_for_everyone: s.deleted_for_everyone ?? false,
      created_at: s.ts,
      forwarded_from_id: s.forwarded_from_id ?? null,
      duration: s.duration ?? null,
      location_lat: s.location_lat ?? null,
      location_lng: s.location_lng ?? null,
      contact_name: s.contact_name ?? null,
      contact_phone: s.contact_phone ?? null,
      read_by: s.read && fromMe ? [otherId] : [],
      reactions: s.reactions ?? [],
      starred: s.starred ?? false,
    };
  });
}

// ── Mock Conversations Builder ──────────────────────────────────────────────────

export function getMockConversations(myId: string): Conversation[] {
  _id = 0;
  const me: Profile = MOCK_PROFILES[myId] ?? {
    id: myId, username: 'me', full_name: 'You', avatar_url: null, bio: '', phone: null, last_seen: ago(0), created_at: ago(0), is_verified: false, is_official: false,
  };

  const convos: Conversation[] = [];

  // Helper to create a 1:1 conversation
  const oneOnOne = (id: string, otherId: string, seeds: MsgSeed[], opts: { pinned?: boolean; muted?: boolean; unread?: number } = {}): Conversation => {
    const other = MOCK_PROFILES[otherId];
    const msgs = buildMessages(id, myId, otherId, seeds);
    const last = msgs[msgs.length - 1];
    return {
      id, is_group: false, name: null, avatar_url: null, created_by: myId, created_at: msgs[0]?.created_at ?? ago(30),
      participants: [me, other],
      last_message: last,
      unread_count: opts.unread ?? 0,
      pinned: opts.pinned ?? false,
      muted: opts.muted ?? false,
      archived: false,
      favorite: false,
      is_self: false,
    };
  };

  // Helper to create a group conversation
  const group = (id: string, name: string, memberIds: string[], seeds: MsgSeed[], opts: { pinned?: boolean; muted?: boolean; unread?: number } = {}): Conversation => {
    const members = memberIds.map((mid) => MOCK_PROFILES[mid]);
    const msgs = buildMessages(id, myId, memberIds[0], seeds);
    const last = msgs[msgs.length - 1];
    return {
      id, is_group: true, name, avatar_url: null, created_by: myId, created_at: msgs[0]?.created_at ?? ago(30),
      participants: [me, ...members],
      last_message: last,
      unread_count: opts.unread ?? 0,
      pinned: opts.pinned ?? false,
      muted: opts.muted ?? false,
      archived: false,
      favorite: false,
      is_self: false,
    };
  };

  // 1. AI Assistant (pinned)
  convos.push(oneOnOne('mock-c-ai', AI_ASSISTANT_ID, [
    { fromMe: false, ts: ago(0, 2), text: 'Hi! I\'m your Pulse Assistant. Ask me anything about the app or just chat! 😊' },
    { fromMe: true, ts: ago(0, 1, 50), text: 'Hey! What can you do?' },
    { fromMe: false, ts: ago(0, 1, 45), text: 'I can help you discover features, answer questions, and provide tips! Try asking me about messaging, groups, or stories. 🚀' },
  ], { pinned: true, unread: 1 }));

  // 2. Sarah Connor — best friend, very active
  convos.push(oneOnOne('mock-c-01', 'mock-p-01', [
    { fromMe: false, ts: ago(1, 5), text: 'Hey! Are we still on for lunch tomorrow? 🍕' },
    { fromMe: true, ts: ago(1, 4, 50), text: 'Yes! 12:30 at the usual place?' },
    { fromMe: false, ts: ago(1, 4, 45), text: 'Perfect! Can\'t wait 😄' },
    { fromMe: false, ts: ago(0, 3), text: 'Also, did you see the new deploy? Looks great!' },
    { fromMe: true, ts: ago(0, 2, 55), text: 'Yeah! The team did an amazing job 🎉' },
    { fromMe: false, ts: ago(0, 2, 50), text: 'Agreed. BTW check this out 👀', media_type: 'image', media_name: 'screenshot.png' },
    { fromMe: true, ts: ago(0, 2, 40), text: 'Whoa that\'s awesome! Where did you find that?' },
    { fromMe: false, ts: ago(0, 0, 15), text: 'Stumbled on it while testing. Thought you\'d love it 😂' },
  ], { pinned: true, unread: 2 }));

  // 3. Mike Chen — work colleague
  convos.push(oneOnOne('mock-c-02', 'mock-p-02', [
    { fromMe: false, ts: ago(0, 8), text: 'The design files are ready for review' },
    { fromMe: true, ts: ago(0, 7, 30), text: 'Great! I\'ll take a look this afternoon' },
    { fromMe: false, ts: ago(0, 1), text: 'Take your time — no rush. The deadline moved to Friday 🙌' },
  ], { unread: 1 }));

  // 4. Emma Wilson — muted group chat friend
  convos.push(oneOnOne('mock-c-03', 'mock-p-03', [
    { fromMe: false, ts: ago(2, 6), text: 'The marketing campaign results are in! 📊' },
    { fromMe: true, ts: ago(2, 5, 50), text: 'How did we do?' },
    { fromMe: false, ts: ago(2, 5, 45), text: 'Conversion is up 34%! The team killed it 💪' },
    { fromMe: true, ts: ago(2, 5, 30), text: 'That\'s incredible! 🎉🎉' },
    { fromMe: false, ts: ago(0, 4), text: 'Coffee chat next week? ☕' },
  ], { muted: true }));

  // 5. David Kim — online, quick chat
  convos.push(oneOnOne('mock-c-04', 'mock-p-04', [
    { fromMe: false, ts: ago(0, 6), text: 'Yo! Server is back up ✅' },
    { fromMe: true, ts: ago(0, 5, 55), text: 'Nice! What was the issue?' },
    { fromMe: false, ts: ago(0, 5, 50), text: 'Just a config drift. All sorted now 👍' },
  ]));

  // 6. Lisa Martinez — typing status
  convos.push(oneOnOne('mock-c-05', 'mock-p-05', [
    { fromMe: false, ts: ago(0, 4), text: 'I\'m working on the research report 📝' },
    { fromMe: true, ts: ago(0, 3, 55), text: 'Sounds good! Let me know if you need help' },
    { fromMe: false, ts: ago(0, 0, 2), text: 'Actually, can you review the survey questions? Almost done typing them up...' },
  ], { unread: 1 }));

  // 7. Tom Brown — voice note exchange
  convos.push(oneOnOne('mock-c-06', 'mock-p-06', [
    { fromMe: false, ts: ago(1, 8), text: 'Check out this trail I found! 🥾', media_type: 'voice', duration: 12 },
    { fromMe: true, ts: ago(1, 7, 50), text: 'Sounds amazing! How long was the hike?' },
    { fromMe: false, ts: ago(1, 7, 45), text: 'About 6 miles. The view at the top was unreal 🏔️', media_type: 'image', media_name: 'trail.jpg' },
  ]));

  // 8. Jenny Lee — document share
  convos.push(oneOnOne('mock-c-07', 'mock-p-07', [
    { fromMe: false, ts: ago(0, 10), text: 'Here\'s the data analysis report', media_type: 'document', media_name: 'Q4_analysis.pdf' },
    { fromMe: true, ts: ago(0, 9, 55), text: 'Thanks! I\'ll review it tonight 📚' },
    { fromMe: false, ts: ago(0, 0, 30), text: 'No rush. Let me know your thoughts when you can!' },
  ], { unread: 1 }));

  // 9. Alex Johnson — photo sharing
  convos.push(oneOnOne('mock-c-08', 'mock-p-08', [
    { fromMe: false, ts: ago(3, 5), text: 'Took some shots this weekend 📷', media_type: 'image', media_name: 'sunset.jpg' },
    { fromMe: true, ts: ago(3, 4, 50), text: 'Stunning! You\'ve got a great eye 🌅' },
    { fromMe: false, ts: ago(3, 4, 45), text: 'Thanks! Working on a portfolio site soon' },
    { fromMe: true, ts: ago(3, 4, 40), text: 'Can\'t wait to see it!' },
  ]));

  // 10. Rachel Green — location share
  convos.push(oneOnOne('mock-c-09', 'mock-p-09', [
    { fromMe: false, ts: ago(0, 12), text: 'Yoga class starts in 10! Joining?', location_lat: 37.7749, location_lng: -122.4194 },
    { fromMe: true, ts: ago(0, 11, 55), text: 'On my way! 🧘‍♀️' },
  ]));

  // 11. Kevin Zhang — foodie chat
  convos.push(oneOnOne('mock-c-10', 'mock-p-10', [
    { fromMe: false, ts: ago(1, 2), text: 'Tried that new ramen place 🍜' },
    { fromMe: true, ts: ago(1, 1, 55), text: 'How was it??' },
    { fromMe: false, ts: ago(1, 1, 50), text: 'Life-changing. We need to go together ASAP 😭🍜' },
    { fromMe: true, ts: ago(1, 1, 45), text: 'Say less. This weekend?' },
    { fromMe: false, ts: ago(1, 1, 40), text: 'Saturday 7pm? 🙌' },
  ]));

  // 12. Amy Thompson — starred message
  convos.push(oneOnOne('mock-c-11', 'mock-p-11', [
    { fromMe: false, ts: ago(4, 3), text: 'Q3 sales numbers are looking strong 💼' },
    { fromMe: true, ts: ago(4, 2, 55), text: 'That\'s great to hear!' },
    { fromMe: false, ts: ago(4, 2, 50), text: 'Reminder: client meeting next Tuesday 2pm', starred: true },
    { fromMe: true, ts: ago(4, 2, 45), text: 'Got it on my calendar ✅' },
  ]));

  // 13. Carl Smith — verified, official-looking
  convos.push(oneOnOne('mock-c-12', 'mock-p-12', [
    { fromMe: false, ts: ago(0, 20), text: 'Great work on the architecture review today 👏' },
    { fromMe: true, ts: ago(0, 19, 55), text: 'Thank you! Learned a lot from your feedback' },
    { fromMe: false, ts: ago(0, 0, 5), text: 'Happy to help. Let\'s sync next week on the roadmap 🚀' },
  ], { unread: 1 }));

  // 14. Nina Patel — contact share
  convos.push(oneOnOne('mock-c-13', 'mock-p-13', [
    { fromMe: false, ts: ago(2, 1), text: 'Here\'s the contact for the print shop', contact_name: 'PrintCo', contact_phone: '+1 555-0999' },
    { fromMe: true, ts: ago(2, 0, 55), text: 'Perfect, thanks! 🎨' },
  ]));

  // 15. Olivia White — deleted message
  convos.push(oneOnOne('mock-c-14', 'mock-p-14', [
    { fromMe: false, ts: ago(0, 16), text: 'Did you see the latest newsletter?' },
    { fromMe: true, ts: ago(0, 15, 55), text: 'Not yet, is it good?' },
    { fromMe: false, ts: ago(0, 15, 50), deleted_for_everyone: true },
    { fromMe: false, ts: ago(0, 15, 45), text: 'Oops, wrong chat 😅 Anyway, it\'s worth a read!' },
  ]));

  // 16. James Rodriguez — edited message
  convos.push(oneOnOne('mock-c-15', 'mock-p-15', [
    { fromMe: false, ts: ago(0, 7), text: 'Sprint planning at 3pm' },
    { fromMe: false, ts: ago(0, 6, 55), text: 'Sprint planning at 3:30pm (moved)', edited: true },
    { fromMe: true, ts: ago(0, 6, 50), text: 'Got it, thanks for the update! 👍' },
  ]));

  // 17. Sophie Davis — archived
  convos.push(oneOnOne('mock-c-16', 'mock-p-16', [
    { fromMe: false, ts: ago(5, 2), text: 'The HR portal is now live! 🎉' },
    { fromMe: true, ts: ago(5, 1, 55), text: 'Awesome, thanks for the heads up!' },
  ], { muted: true }));

  // 18. Ryan Murphy — older conversation
  convos.push(oneOnOne('mock-c-17', 'mock-p-17', [
    { fromMe: false, ts: ago(6, 4), text: 'Found the bug! It was a race condition 🐛' },
    { fromMe: true, ts: ago(6, 3, 55), text: 'Classic! Nice catch 🎯' },
    { fromMe: false, ts: ago(6, 3, 50), text: 'Adding more tests to prevent it in the future ✅' },
  ]));

  // 19. Chloe Bennett — new friend
  convos.push(oneOnOne('mock-c-18', 'mock-p-18', [
    { fromMe: false, ts: ago(0, 1), text: 'Hi! We met at the meetup yesterday 😊' },
    { fromMe: true, ts: ago(0, 0, 55), text: 'Hey Chloe! Yes, great to connect 👋' },
    { fromMe: false, ts: ago(0, 0, 50), text: 'Would love to chat about frontend stuff sometime!' },
  ], { unread: 1 }));

  // 20. Marc Williams — quick exchange
  convos.push(oneOnOne('mock-c-19', 'mock-p-19', [
    { fromMe: false, ts: ago(0, 0, 8), text: 'Security audit passed! No critical issues 🔒' },
    { fromMe: true, ts: ago(0, 0, 3), text: 'Excellent! Great work 🎉' },
  ]));

  // ── Group Chats ───────────────────────────────────────────────────────────────

  // Group 1: Dev Team
  convos.push(group('mock-g-01', 'Dev Team 🚀', ['mock-p-01', 'mock-p-04', 'mock-p-08', 'mock-p-12'], [
    { fromMe: false, ts: ago(1, 6), text: 'Deploy is live! 🎉 Everyone please test the new features' },
    { fromMe: true, ts: ago(1, 5, 55), text: 'On it! Testing now 🧪' },
    { fromMe: false, ts: ago(1, 5, 50), text: 'Found a small UI glitch on mobile', media_type: 'image', media_name: 'bug.png' },
    { fromMe: false, ts: ago(1, 5, 45), text: 'I\'ll hotfix it right away' },
    { fromMe: false, ts: ago(0, 3), text: 'Hotfix deployed. All clear! ✅' },
    { fromMe: true, ts: ago(0, 2, 55), text: 'Nice work team! 🙌' },
    { fromMe: false, ts: ago(0, 0, 20), text: 'Sprint retro tomorrow at 4pm. Add your notes to the doc 📝' },
  ], { unread: 3 }));

  // Group 2: Family ❤️
  convos.push(group('mock-g-02', 'Family ❤️', ['mock-p-03', 'mock-p-11', 'mock-p-16'], [
    { fromMe: false, ts: ago(2, 8), text: 'Don\'t forget Sunday dinner at mom\'s! 🍽️' },
    { fromMe: true, ts: ago(2, 7, 55), text: 'Wouldn\'t miss it! What time?' },
    { fromMe: false, ts: ago(2, 7, 50), text: '6pm. Bring dessert 😊' },
    { fromMe: false, ts: ago(0, 5), text: 'I\'m making my famous cheesecake! 🍰' },
    { fromMe: true, ts: ago(0, 4, 55), text: 'Can\'t wait! 😋' },
  ], { pinned: true }));

  // Group 3: Study Group
  convos.push(group('mock-g-03', 'CS Study Group 📚', ['mock-p-07', 'mock-p-10', 'mock-p-17', 'mock-p-18'], [
    { fromMe: false, ts: ago(1, 10), text: 'Has everyone finished chapter 7? 📖' },
    { fromMe: true, ts: ago(1, 9, 55), text: 'Almost! Just the exercises left' },
    { fromMe: false, ts: ago(1, 9, 50), text: 'Same here. Let\'s meet Thursday to review?' },
    { fromMe: false, ts: ago(1, 9, 45), text: 'Thursday works for me 👍' },
    { fromMe: true, ts: ago(1, 9, 40), text: 'Thursday 7pm? Library study room?' },
    { fromMe: false, ts: ago(0, 2), text: 'Sounds perfect! I\'ll book the room 📚' },
  ], { muted: true }));

  // Group 4: Weekend Plans
  convos.push(group('mock-g-04', 'Weekend Trip 🏔️', ['mock-p-01', 'mock-p-06', 'mock-p-09'], [
    { fromMe: false, ts: ago(0, 14), text: 'Finalizing the itinerary! Check the doc 🗺️' },
    { fromMe: true, ts: ago(0, 13, 55), text: 'Looks great! Can we add a stop at the lake? 🏞️' },
    { fromMe: false, ts: ago(0, 13, 50), text: 'Great idea! Adding it now' },
    { fromMe: false, ts: ago(0, 0, 10), text: 'Done! We leave Friday 8am sharp ⏰ Don\'t forget snacks!' },
  ], { unread: 2 }));

  return convos;
}

// ── Mock Messages Per Conversation ──────────────────────────────────────────────

export function getMockMessages(conversationId: string, myId: string): Message[] | null {
  const convos = getMockConversations(myId);
  const convo = convos.find((c) => c.id === conversationId);
  if (!convo) return null;
  // The conversation's last_message is the last in the array, but we need all messages.
  // Rebuild from the seeds by calling getMockConversations and extracting.
  // Since buildMessages is internal, we reconstruct from the conversation's participants.
  // Actually, we stored all messages in the conversation object implicitly.
  // Let's return the messages we built.
  // We need to re-run the builder to get all messages for this conversation.
  return getMockMessagesForConvo(conversationId, myId);
}

// Rebuild messages for a specific conversation
function getMockMessagesForConvo(conversationId: string, myId: string): Message[] | null {
  const allConvos = getMockConversations(myId);
  const convo = allConvos.find((c) => c.id === conversationId);
  if (!convo) return null;

  // We need to get the full message list. Since getMockConversations rebuilds
  // messages each time, and the last_message is the last one, we can find
  // all messages by looking at the conversation's message IDs.
  // However, the Conversation type only stores last_message.
  // So we need a different approach: store messages separately.

  // This is handled by the MOCK_MESSAGES map below.
  return MOCK_MESSAGES[conversationId] ?? null;
}

// Build and store all mock messages
const MOCK_MESSAGES: Record<string, Message[]> = {};

function buildAllMockMessages(myId: string) {
  _id = 0;
  const me: Profile = MOCK_PROFILES[myId] ?? {
    id: myId, username: 'me', full_name: 'You', avatar_url: null, bio: '', phone: null, last_seen: ago(0), created_at: ago(0), is_verified: false, is_official: false,
  };

  const store = (convoId: string, otherId: string, seeds: MsgSeed[]) => {
    MOCK_MESSAGES[convoId] = buildMessages(convoId, myId, otherId, seeds);
  };

  // AI Assistant
  store('mock-c-ai', AI_ASSISTANT_ID, [
    { fromMe: false, ts: ago(0, 2), text: 'Hi! I\'m your Pulse Assistant. Ask me anything about the app or just chat! 😊' },
    { fromMe: true, ts: ago(0, 1, 50), text: 'Hey! What can you do?' },
    { fromMe: false, ts: ago(0, 1, 45), text: 'I can help you discover features, answer questions, and provide tips! Try asking me about messaging, groups, or stories. 🚀' },
  ]);

  // Sarah Connor
  store('mock-c-01', 'mock-p-01', [
    { fromMe: false, ts: ago(1, 5), text: 'Hey! Are we still on for lunch tomorrow? 🍕' },
    { fromMe: true, ts: ago(1, 4, 50), text: 'Yes! 12:30 at the usual place?' },
    { fromMe: false, ts: ago(1, 4, 45), text: 'Perfect! Can\'t wait 😄' },
    { fromMe: false, ts: ago(0, 3), text: 'Also, did you see the new deploy? Looks great!' },
    { fromMe: true, ts: ago(0, 2, 55), text: 'Yeah! The team did an amazing job 🎉' },
    { fromMe: false, ts: ago(0, 2, 50), text: 'Agreed. BTW check this out 👀', media_type: 'image', media_name: 'screenshot.png' },
    { fromMe: true, ts: ago(0, 2, 40), text: 'Whoa that\'s awesome! Where did you find that?' },
    { fromMe: false, ts: ago(0, 0, 15), text: 'Stumbled on it while testing. Thought you\'d love it 😂' },
  ]);

  // Mike Chen
  store('mock-c-02', 'mock-p-02', [
    { fromMe: false, ts: ago(0, 8), text: 'The design files are ready for review' },
    { fromMe: true, ts: ago(0, 7, 30), text: 'Great! I\'ll take a look this afternoon' },
    { fromMe: false, ts: ago(0, 1), text: 'Take your time — no rush. The deadline moved to Friday 🙌' },
  ]);

  // Emma Wilson
  store('mock-c-03', 'mock-p-03', [
    { fromMe: false, ts: ago(2, 6), text: 'The marketing campaign results are in! 📊' },
    { fromMe: true, ts: ago(2, 5, 50), text: 'How did we do?' },
    { fromMe: false, ts: ago(2, 5, 45), text: 'Conversion is up 34%! The team killed it 💪' },
    { fromMe: true, ts: ago(2, 5, 30), text: 'That\'s incredible! 🎉🎉' },
    { fromMe: false, ts: ago(0, 4), text: 'Coffee chat next week? ☕' },
  ]);

  // David Kim
  store('mock-c-04', 'mock-p-04', [
    { fromMe: false, ts: ago(0, 6), text: 'Yo! Server is back up ✅' },
    { fromMe: true, ts: ago(0, 5, 55), text: 'Nice! What was the issue?' },
    { fromMe: false, ts: ago(0, 5, 50), text: 'Just a config drift. All sorted now 👍' },
  ]);

  // Lisa Martinez
  store('mock-c-05', 'mock-p-05', [
    { fromMe: false, ts: ago(0, 4), text: 'I\'m working on the research report 📝' },
    { fromMe: true, ts: ago(0, 3, 55), text: 'Sounds good! Let me know if you need help' },
    { fromMe: false, ts: ago(0, 0, 2), text: 'Actually, can you review the survey questions? Almost done typing them up...' },
  ]);

  // Tom Brown
  store('mock-c-06', 'mock-p-06', [
    { fromMe: false, ts: ago(1, 8), text: 'Check out this trail I found! 🥾', media_type: 'voice', duration: 12 },
    { fromMe: true, ts: ago(1, 7, 50), text: 'Sounds amazing! How long was the hike?' },
    { fromMe: false, ts: ago(1, 7, 45), text: 'About 6 miles. The view at the top was unreal 🏔️', media_type: 'image', media_name: 'trail.jpg' },
  ]);

  // Jenny Lee
  store('mock-c-07', 'mock-p-07', [
    { fromMe: false, ts: ago(0, 10), text: 'Here\'s the data analysis report', media_type: 'document', media_name: 'Q4_analysis.pdf' },
    { fromMe: true, ts: ago(0, 9, 55), text: 'Thanks! I\'ll review it tonight 📚' },
    { fromMe: false, ts: ago(0, 0, 30), text: 'No rush. Let me know your thoughts when you can!' },
  ]);

  // Alex Johnson
  store('mock-c-08', 'mock-p-08', [
    { fromMe: false, ts: ago(3, 5), text: 'Took some shots this weekend 📷', media_type: 'image', media_name: 'sunset.jpg' },
    { fromMe: true, ts: ago(3, 4, 50), text: 'Stunning! You\'ve got a great eye 🌅' },
    { fromMe: false, ts: ago(3, 4, 45), text: 'Thanks! Working on a portfolio site soon' },
    { fromMe: true, ts: ago(3, 4, 40), text: 'Can\'t wait to see it!' },
  ]);

  // Rachel Green
  store('mock-c-09', 'mock-p-09', [
    { fromMe: false, ts: ago(0, 12), text: 'Yoga class starts in 10! Joining?', location_lat: 37.7749, location_lng: -122.4194 },
    { fromMe: true, ts: ago(0, 11, 55), text: 'On my way! 🧘‍♀️' },
  ]);

  // Kevin Zhang
  store('mock-c-10', 'mock-p-10', [
    { fromMe: false, ts: ago(1, 2), text: 'Tried that new ramen place 🍜' },
    { fromMe: true, ts: ago(1, 1, 55), text: 'How was it??' },
    { fromMe: false, ts: ago(1, 1, 50), text: 'Life-changing. We need to go together ASAP 😭🍜' },
    { fromMe: true, ts: ago(1, 1, 45), text: 'Say less. This weekend?' },
    { fromMe: false, ts: ago(1, 1, 40), text: 'Saturday 7pm? 🙌' },
  ]);

  // Amy Thompson
  store('mock-c-11', 'mock-p-11', [
    { fromMe: false, ts: ago(4, 3), text: 'Q3 sales numbers are looking strong 💼' },
    { fromMe: true, ts: ago(4, 2, 55), text: 'That\'s great to hear!' },
    { fromMe: false, ts: ago(4, 2, 50), text: 'Reminder: client meeting next Tuesday 2pm', starred: true },
    { fromMe: true, ts: ago(4, 2, 45), text: 'Got it on my calendar ✅' },
  ]);

  // Carl Smith
  store('mock-c-12', 'mock-p-12', [
    { fromMe: false, ts: ago(0, 20), text: 'Great work on the architecture review today 👏' },
    { fromMe: true, ts: ago(0, 19, 55), text: 'Thank you! Learned a lot from your feedback' },
    { fromMe: false, ts: ago(0, 0, 5), text: 'Happy to help. Let\'s sync next week on the roadmap 🚀' },
  ]);

  // Nina Patel
  store('mock-c-13', 'mock-p-13', [
    { fromMe: false, ts: ago(2, 1), text: 'Here\'s the contact for the print shop', contact_name: 'PrintCo', contact_phone: '+1 555-0999' },
    { fromMe: true, ts: ago(2, 0, 55), text: 'Perfect, thanks! 🎨' },
  ]);

  // Olivia White
  store('mock-c-14', 'mock-p-14', [
    { fromMe: false, ts: ago(0, 16), text: 'Did you see the latest newsletter?' },
    { fromMe: true, ts: ago(0, 15, 55), text: 'Not yet, is it good?' },
    { fromMe: false, ts: ago(0, 15, 50), deleted_for_everyone: true },
    { fromMe: false, ts: ago(0, 15, 45), text: 'Oops, wrong chat 😅 Anyway, it\'s worth a read!' },
  ]);

  // James Rodriguez
  store('mock-c-15', 'mock-p-15', [
    { fromMe: false, ts: ago(0, 7), text: 'Sprint planning at 3pm' },
    { fromMe: false, ts: ago(0, 6, 55), text: 'Sprint planning at 3:30pm (moved)', edited: true },
    { fromMe: true, ts: ago(0, 6, 50), text: 'Got it, thanks for the update! 👍' },
  ]);

  // Sophie Davis
  store('mock-c-16', 'mock-p-16', [
    { fromMe: false, ts: ago(5, 2), text: 'The HR portal is now live! 🎉' },
    { fromMe: true, ts: ago(5, 1, 55), text: 'Awesome, thanks for the heads up!' },
  ]);

  // Ryan Murphy
  store('mock-c-17', 'mock-p-17', [
    { fromMe: false, ts: ago(6, 4), text: 'Found the bug! It was a race condition 🐛' },
    { fromMe: true, ts: ago(6, 3, 55), text: 'Classic! Nice catch 🎯' },
    { fromMe: false, ts: ago(6, 3, 50), text: 'Adding more tests to prevent it in the future ✅' },
  ]);

  // Chloe Bennett
  store('mock-c-18', 'mock-p-18', [
    { fromMe: false, ts: ago(0, 1), text: 'Hi! We met at the meetup yesterday 😊' },
    { fromMe: true, ts: ago(0, 0, 55), text: 'Hey Chloe! Yes, great to connect 👋' },
    { fromMe: false, ts: ago(0, 0, 50), text: 'Would love to chat about frontend stuff sometime!' },
  ]);

  // Marc Williams
  store('mock-c-19', 'mock-p-19', [
    { fromMe: false, ts: ago(0, 0, 8), text: 'Security audit passed! No critical issues 🔒' },
    { fromMe: true, ts: ago(0, 0, 3), text: 'Excellent! Great work 🎉' },
  ]);

  // Group: Dev Team
  store('mock-g-01', 'mock-p-01', [
    { fromMe: false, ts: ago(1, 6), text: 'Deploy is live! 🎉 Everyone please test the new features' },
    { fromMe: true, ts: ago(1, 5, 55), text: 'On it! Testing now 🧪' },
    { fromMe: false, ts: ago(1, 5, 50), text: 'Found a small UI glitch on mobile', media_type: 'image', media_name: 'bug.png' },
    { fromMe: false, ts: ago(1, 5, 45), text: 'I\'ll hotfix it right away' },
    { fromMe: false, ts: ago(0, 3), text: 'Hotfix deployed. All clear! ✅' },
    { fromMe: true, ts: ago(0, 2, 55), text: 'Nice work team! 🙌' },
    { fromMe: false, ts: ago(0, 0, 20), text: 'Sprint retro tomorrow at 4pm. Add your notes to the doc 📝' },
  ]);

  // Group: Family
  store('mock-g-02', 'mock-p-03', [
    { fromMe: false, ts: ago(2, 8), text: 'Don\'t forget Sunday dinner at mom\'s! 🍽️' },
    { fromMe: true, ts: ago(2, 7, 55), text: 'Wouldn\'t miss it! What time?' },
    { fromMe: false, ts: ago(2, 7, 50), text: '6pm. Bring dessert 😊' },
    { fromMe: false, ts: ago(0, 5), text: 'I\'m making my famous cheesecake! 🍰' },
    { fromMe: true, ts: ago(0, 4, 55), text: 'Can\'t wait! 😋' },
  ]);

  // Group: CS Study Group
  store('mock-g-03', 'mock-p-07', [
    { fromMe: false, ts: ago(1, 10), text: 'Has everyone finished chapter 7? 📖' },
    { fromMe: true, ts: ago(1, 9, 55), text: 'Almost! Just the exercises left' },
    { fromMe: false, ts: ago(1, 9, 50), text: 'Same here. Let\'s meet Thursday to review?' },
    { fromMe: false, ts: ago(1, 9, 45), text: 'Thursday works for me 👍' },
    { fromMe: true, ts: ago(1, 9, 40), text: 'Thursday 7pm? Library study room?' },
    { fromMe: false, ts: ago(0, 2), text: 'Sounds perfect! I\'ll book the room 📚' },
  ]);

  // Group: Weekend Trip
  store('mock-g-04', 'mock-p-01', [
    { fromMe: false, ts: ago(0, 14), text: 'Finalizing the itinerary! Check the doc 🗺️' },
    { fromMe: true, ts: ago(0, 13, 55), text: 'Looks great! Can we add a stop at the lake? 🏞️' },
    { fromMe: false, ts: ago(0, 13, 50), text: 'Great idea! Adding it now' },
    { fromMe: false, ts: ago(0, 0, 10), text: 'Done! We leave Friday 8am sharp ⏰ Don\'t forget snacks!' },
  ]);
}

// Initialize mock messages
buildAllMockMessages('me');

// ── Typing status for mock users ──────────────────────────────────────────────────

export const MOCK_TYPING_USERS: string[] = ['mock-p-05']; // Lisa Martinez is typing

// ── Online status for mock users ─────────────────────────────────────────────────

export function isMockUserOnline(userId: string): boolean {
  const p = MOCK_PROFILES[userId];
  if (!p) return false;
  const diff = Date.now() - new Date(p.last_seen).getTime();
  return diff < 5 * 60 * 1000; // online if seen within 5 minutes
}
