import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import type { Profile } from '@/types';
import { AI_ASSISTANT_ID } from '@/types';

interface AuthContextValue {
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, username: string, fullName: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updatePassword: (newPassword: string) => Promise<void>;
  resendVerification: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = async (userId: string): Promise<Profile | null> => {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, username, full_name, avatar_url, bio, phone, last_seen, created_at, is_verified, is_official')
      .eq('id', userId)
      .maybeSingle();
    if (error) {
      console.error('Failed to load profile', error);
      return null;
    }
    return data as Profile | null;
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      if (data.session) {
        loadProfile(data.session.user.id).then((p) => {
          setProfile(p);
          setLoading(false);
        });
      } else {
        setLoading(false);
      }
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      if (newSession) {
        (async () => {
          const p = await loadProfile(newSession.user.id);
          setProfile(p);
        })();
      } else {
        setProfile(null);
      }
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  const setupNewUser = async (userId: string, fullName: string) => {
    // Create Message Yourself conversation
    const { data: selfConvo, error: convoErr } = await supabase
      .from('conversations')
      .insert({ is_group: false, created_by: userId })
      .select('id')
      .single();
    if (convoErr) { console.error('Failed to create self conversation', convoErr); return; }

    const { error: partErr } = await supabase
      .from('conversation_participants')
      .insert({ conversation_id: selfConvo.id, user_id: userId, is_self: true, pinned: true });
    if (partErr) console.error('Failed to join self conversation', partErr);

    // Create AI assistant conversation
    const { data: aiConvo, error: aiConvoErr } = await supabase
      .from('conversations')
      .insert({ is_group: false, created_by: userId })
      .select('id')
      .single();
    if (aiConvoErr) { console.error('Failed to create AI conversation', aiConvoErr); return; }

    const { error: aiPartErr } = await supabase
      .from('conversation_participants')
      .insert([
        { conversation_id: aiConvo.id, user_id: userId },
        { conversation_id: aiConvo.id, user_id: AI_ASSISTANT_ID },
      ]);
    if (aiPartErr) console.error('Failed to join AI conversation', aiPartErr);

    // Send welcome message from AI
    const welcomeText = `Welcome to Pulse, ${fullName}! 👋\n\nI'm your official Pulse Assistant. Here are a few things you can do:\n\n• Tap the pencil icon to start a new chat with anyone by their username\n• Send photos, documents, voice notes, and more\n• Try the emoji picker and react to messages\n• Check out Settings to customize your theme, privacy, and notifications\n• Use "Message Yourself" to save notes, links, and reminders\n• Explore Chat Tools for polls, events, and shared to-do lists\n• Generate your QR code to share your profile instantly\n\nFeel free to message me anytime — I'll share tips, updates, and privacy advice. Enjoy chatting! 🚀`;

    const { error: msgErr } = await supabase
      .from('messages')
      .insert({
        conversation_id: aiConvo.id,
        sender_id: AI_ASSISTANT_ID,
        text: welcomeText,
      });
    if (msgErr) console.error('Failed to send welcome message', msgErr);
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  const signUp = async (email: string, password: string, username: string, fullName: string) => {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
    if (!data.user) throw new Error('Sign up failed');

    const { error: profileError } = await supabase.from('profiles').insert({
      id: data.user.id,
      username,
      full_name: fullName,
    });
    if (profileError) throw profileError;

    // Set up Message Yourself + AI assistant conversation (best-effort)
    try {
      await setupNewUser(data.user.id, fullName);
    } catch (err) {
      console.error('New user setup failed (non-blocking)', err);
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setProfile(null);
  };

  const refreshProfile = async () => {
    if (session) {
      const p = await loadProfile(session.user.id);
      setProfile(p);
    }
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) throw error;
  };

  const updatePassword = async (newPassword: string) => {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) throw error;
  };

  const resendVerification = async (email: string) => {
    const { error } = await supabase.auth.resend({ type: 'signup', email });
    if (error) throw error;
  };

  return (
    <AuthContext.Provider value={{ session, profile, loading, signIn, signUp, signOut, refreshProfile, resetPassword, updatePassword, resendVerification }}>
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
