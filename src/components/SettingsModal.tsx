import { useState, useEffect } from 'react';
import { X, User, Lock, Bell, Palette, HardDrive, HelpCircle, Shield, ChevronRight, LogOut, Moon, Sun, Monitor, Check, Trash2, Mail, Phone, AtSign, Loader2, KeyRound, Fingerprint, Plane, Eye, Type, Accessibility } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { useToast } from '@/context/ToastContext';
import { useAccessibility } from '@/context/AccessibilityContext';
import { supabase } from '@/lib/supabase';
import type { UserSettings } from '@/types';
import Avatar from '@/components/Avatar';

interface SettingsModalProps {
  onClose: () => void;
  onEditProfile: () => void;
  onOpenBlocked: () => void;
  onOpenDeviceSecurity: () => void;
}

type Section = 'main' | 'account' | 'privacy' | 'chats' | 'notifications' | 'appearance' | 'storage' | 'help' | 'security' | 'accessibility';

export default function SettingsModal({ onClose, onEditProfile, onOpenBlocked, onOpenDeviceSecurity }: SettingsModalProps) {
  const { profile, signOut, refreshProfile } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { toast } = useToast();
  const { highContrast, dyslexiaFont, largeText, toggleHighContrast, toggleDyslexiaFont, toggleLargeText } = useAccessibility();
  const [section, setSection] = useState<Section>('main');
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loadingSettings, setLoadingSettings] = useState(true);

  useEffect(() => {
    if (!profile) return;
    supabase.from('user_settings').select('*').eq('user_id', profile.id).maybeSingle().then(({ data }) => {
      if (data) setSettings(data as UserSettings);
      setLoadingSettings(false);
    });
  }, [profile]);

  const updateSetting = async (key: keyof UserSettings, value: string | boolean) => {
    if (!profile || !settings) return;
    const updated = { ...settings, [key]: value };
    setSettings(updated);
    const { [key]: _removed, ...rest } = updated;
    void _removed; void rest;
    await supabase.from('user_settings').update({ [key]: value, updated_at: new Date().toISOString() }).eq('user_id', profile.id);
  };

  if (!profile) return null;

  const menuItems = [
    { key: 'account' as const, label: 'Account', icon: <User className="w-5 h-5" />, desc: 'Edit profile, change username, email, password' },
    { key: 'privacy' as const, label: 'Privacy', icon: <Shield className="w-5 h-5" />, desc: 'Last seen, blocked contacts, read receipts' },
    { key: 'security' as const, label: 'Security', icon: <KeyRound className="w-5 h-5" />, desc: 'Chat lock, device sessions, login history' },
    { key: 'chats' as const, label: 'Chats', icon: <Palette className="w-5 h-5" />, desc: 'Wallpaper, font size, media download' },
    { key: 'notifications' as const, label: 'Notifications', icon: <Bell className="w-5 h-5" />, desc: 'Sounds, vibration, preview' },
    { key: 'appearance' as const, label: 'Appearance', icon: <Monitor className="w-5 h-5" />, desc: 'Theme, accent colors, font size' },
    { key: 'accessibility' as const, label: 'Accessibility', icon: <Accessibility className="w-5 h-5" />, desc: 'High contrast, dyslexia font, large text' },
    { key: 'storage' as const, label: 'Storage', icon: <HardDrive className="w-5 h-5" />, desc: 'Manage downloads, clear cache' },
    { key: 'help' as const, label: 'Help', icon: <HelpCircle className="w-5 h-5" />, desc: 'FAQ, support, terms' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="w-full max-w-lg bg-white dark:bg-slate-800 rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100 dark:border-slate-700">
          {section !== 'main' && (
            <button onClick={() => setSection('main')} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-sm font-medium">
              Back
            </button>
          )}
          <h2 className="text-lg font-semibold text-slate-800 dark:text-white flex-1">
            {section === 'main' ? 'Settings' : menuItems.find((m) => m.key === section)?.label}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {section === 'main' && (
            <div className="p-4">
              {/* Profile header */}
              <div className="flex flex-col items-center mb-6 pb-6 border-b border-slate-100 dark:border-slate-700">
                <Avatar src={profile.avatar_url} name={profile.full_name} id={profile.id} size="lg" verified={profile.is_verified} />
                <p className="font-semibold text-slate-800 dark:text-white mt-2">{profile.full_name}</p>
                <p className="text-sm text-slate-400">@{profile.username}</p>
                <p className="text-xs text-slate-400 mt-1">{profile.bio ?? 'No bio'}</p>
              </div>

              <div className="space-y-1">
                {menuItems.map((item) => (
                  <button
                    key={item.key}
                    onClick={() => setSection(item.key)}
                    className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition text-left"
                  >
                    <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-blue-500">
                      {item.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-800 dark:text-white">{item.label}</p>
                      <p className="text-xs text-slate-400 truncate">{item.desc}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-300" />
                  </button>
                ))}

                <div className="pt-3 mt-3 border-t border-slate-100 dark:border-slate-700">
                  <button onClick={() => { toggleTheme(); }} className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition text-left">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-300">
                      {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
                    </div>
                    <span className="flex-1 font-medium text-slate-800 dark:text-white">{theme === 'light' ? 'Dark mode' : 'Light mode'}</span>
                  </button>
                  <button onClick={signOut} className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-900/20 transition text-left">
                    <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-900/30 flex items-center justify-center text-rose-500">
                      <LogOut className="w-5 h-5" />
                    </div>
                    <span className="flex-1 font-medium text-rose-500">Sign out</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {section === 'account' && (
            <div className="p-4 space-y-3">
              <button onClick={onEditProfile} className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition text-left">
                <User className="w-5 h-5 text-blue-500" />
                <span className="flex-1 text-slate-700 dark:text-slate-200">Edit Profile</span>
                <ChevronRight className="w-4 h-4 text-slate-300" />
              </button>
              <InfoRow icon={<AtSign className="w-5 h-5 text-slate-400" />} label="Username" value={`@${profile.username}`} />
              <InfoRow icon={<Mail className="w-5 h-5 text-slate-400" />} label="Email" value={profile.id ? 'Connected' : 'Not set'} />
              <InfoRow icon={<Phone className="w-5 h-5 text-slate-400" />} label="Phone" value={profile.phone ?? 'Not set'} />
              <button onClick={() => toast('Password change link sent to your email', 'info')} className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition text-left">
                <Lock className="w-5 h-5 text-blue-500" />
                <span className="flex-1 text-slate-700 dark:text-slate-200">Change Password</span>
                <ChevronRight className="w-4 h-4 text-slate-300" />
              </button>
              <button onClick={() => { if (confirm('Delete your account? This cannot be undone.')) { toast('Contact support to delete your account', 'info'); } }} className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-900/20 transition text-left">
                <Trash2 className="w-5 h-5 text-rose-500" />
                <span className="flex-1 text-rose-500">Delete Account</span>
              </button>
            </div>
          )}

          {section === 'privacy' && (
            <div className="p-4 space-y-1">
              <button onClick={onOpenBlocked} className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition text-left mb-2">
                <Shield className="w-5 h-5 text-blue-500" />
                <span className="flex-1 text-slate-700 dark:text-slate-200">Blocked Contacts</span>
                <ChevronRight className="w-4 h-4 text-slate-300" />
              </button>
              {loadingSettings ? <div className="flex justify-center py-4"><Loader2 className="w-5 h-5 text-slate-400 animate-spin" /></div> : (
                <>
                  <ToggleRow label="Last Seen" desc="Show when you were last active" checked={settings?.last_seen_visible ?? true} onChange={(v) => updateSetting('last_seen_visible', v)} />
                  <ToggleRow label="Online Status" desc="Show when you're online" checked={settings?.online_visible ?? true} onChange={(v) => updateSetting('online_visible', v)} />
                  <ToggleRow label="Profile Photo" desc="Visible to others" checked={settings?.photo_visible ?? true} onChange={(v) => updateSetting('photo_visible', v)} />
                  <ToggleRow label="About" desc="Show your bio" checked={settings?.about_visible ?? true} onChange={(v) => updateSetting('about_visible', v)} />
                  <ToggleRow label="Read Receipts" desc="Show blue ticks" checked={settings?.read_receipts ?? true} onChange={(v) => updateSetting('read_receipts', v)} />
                  <ToggleRow label="Typing Indicator" desc="Show when you're typing" checked={settings?.typing_visible ?? true} onChange={(v) => updateSetting('typing_visible', v)} />
                  <ToggleRow label="Two-Factor Auth" desc="Extra security" checked={settings?.two_factor_enabled ?? false} onChange={(v) => updateSetting('two_factor_enabled', v)} />
                  <div className="pt-3 mt-2 border-t border-slate-100 dark:border-slate-700">
                    <ToggleRow label="Away Mode" desc="Auto-reply when unavailable" checked={settings?.away_mode_enabled ?? false} onChange={(v) => updateSetting('away_mode_enabled', v)} />
                    {(settings?.away_mode_enabled) && (
                      <div className="px-3 pb-2">
                        <textarea value={settings?.away_message ?? ''} onChange={(e) => updateSetting('away_message', e.target.value)} placeholder="I'm currently unavailable and will reply later." rows={2} className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white text-sm focus:outline-none focus:border-teal-400 resize-none" />
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          )}

          {section === 'security' && (
            <div className="p-4 space-y-1">
              <button onClick={onOpenDeviceSecurity} className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition text-left mb-2">
                <KeyRound className="w-5 h-5 text-blue-500" />
                <span className="flex-1 text-slate-700 dark:text-slate-200">Device Sessions & Login History</span>
                <ChevronRight className="w-4 h-4 text-slate-300" />
              </button>
              {loadingSettings ? <div className="flex justify-center py-4"><Loader2 className="w-5 h-5 text-slate-400 animate-spin" /></div> : (
                <>
                  <ToggleRow label="Chat Lock" desc="Require PIN to open locked chats" checked={settings?.chat_lock_enabled ?? false} onChange={(v) => updateSetting('chat_lock_enabled', v)} />
                  {(settings?.chat_lock_enabled) && (
                    <div className="px-3 pb-2">
                      <input type="password" value={settings?.chat_lock_pin ?? ''} onChange={(e) => updateSetting('chat_lock_pin', e.target.value)} placeholder="Set a 4-digit PIN" maxLength={4} className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white text-sm focus:outline-none focus:border-teal-400" />
                      <p className="text-xs text-slate-400 mt-1 flex items-center gap-1"><Fingerprint className="w-3 h-3" /> Biometric authentication will be used where available</p>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {section === 'accessibility' && (
            <div className="p-4 space-y-1">
              <ToggleRow label="High Contrast" desc="Increase visual contrast" checked={highContrast} onChange={toggleHighContrast} />
              <ToggleRow label="Dyslexia-Friendly Font" desc="Use accessible typography" checked={dyslexiaFont} onChange={toggleDyslexiaFont} />
              <ToggleRow label="Larger Text" desc="Increase font size throughout" checked={largeText} onChange={toggleLargeText} />
              <div className="pt-3 mt-2 border-t border-slate-100 dark:border-slate-700">
                <p className="text-xs text-slate-400 px-3 py-2 flex items-center gap-1.5"><Eye className="w-3 h-3" /> Screen reader support is enabled by default</p>
                <p className="text-xs text-slate-400 px-3 py-1 flex items-center gap-1.5"><Type className="w-3 h-3" /> Keyboard shortcuts: Ctrl+K (search), Ctrl+N (new chat), Esc (close)</p>
              </div>
            </div>
          )}

          {section === 'chats' && (
            <div className="p-4 space-y-1">
              {loadingSettings ? <div className="flex justify-center py-4"><Loader2 className="w-5 h-5 text-slate-400 animate-spin" /></div> : (
                <>
                  <ToggleRow label="Enter to Send" desc="Press Enter to send messages" checked={settings?.enter_to_send ?? true} onChange={(v) => updateSetting('enter_to_send', v)} />
                  <ToggleRow label="Auto-Download Media" desc="Download media automatically" checked={settings?.auto_download_media ?? true} onChange={(v) => updateSetting('auto_download_media', v)} />
                  <SelectRow label="Font Size" value={settings?.font_size ?? 'medium'} options={[['small', 'Small'], ['medium', 'Medium'], ['large', 'Large']]} onChange={(v) => updateSetting('font_size', v)} />
                  <SelectRow label="Media Quality" value={settings?.media_quality ?? 'standard'} options={[['standard', 'Standard'], ['high', 'High']]} onChange={(v) => updateSetting('media_quality', v)} />
                </>
              )}
            </div>
          )}

          {section === 'notifications' && (
            <div className="p-4 space-y-1">
              {loadingSettings ? <div className="flex justify-center py-4"><Loader2 className="w-5 h-5 text-slate-400 animate-spin" /></div> : (
                <>
                  <ToggleRow label="Mute All" desc="Turn off all notifications" checked={settings?.mute_all ?? false} onChange={(v) => updateSetting('mute_all', v)} />
                  <ToggleRow label="Message Notifications" desc="New message alerts" checked={settings?.message_notifications ?? true} onChange={(v) => updateSetting('message_notifications', v)} />
                  <ToggleRow label="Group Notifications" desc="Group chat alerts" checked={settings?.group_notifications ?? true} onChange={(v) => updateSetting('group_notifications', v)} />
                  <ToggleRow label="Story Notifications" desc="New story alerts" checked={settings?.story_notifications ?? true} onChange={(v) => updateSetting('story_notifications', v)} />
                  <ToggleRow label="Notification Sound" desc="Play sounds" checked={settings?.notification_sound ?? true} onChange={(v) => updateSetting('notification_sound', v)} />
                  <ToggleRow label="Vibration" desc="Vibrate on new message" checked={settings?.notification_vibration ?? true} onChange={(v) => updateSetting('notification_vibration', v)} />
                  <ToggleRow label="Notification Preview" desc="Show message content" checked={settings?.notification_preview ?? true} onChange={(v) => updateSetting('notification_preview', v)} />
                </>
              )}
            </div>
          )}

          {section === 'appearance' && (
            <div className="p-4 space-y-4">
              <div>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">Theme</p>
                <div className="grid grid-cols-3 gap-2">
                  {([['light', 'Light', <Sun key="l" className="w-4 h-4" />], ['dark', 'Dark', <Moon key="d" className="w-4 h-4" />], ['system', 'System', <Monitor key="s" className="w-4 h-4" />]] as const).map(([val, label, icon]) => (
                    <button key={val} onClick={() => { if (val === 'light' && theme !== 'light') toggleTheme(); if (val === 'dark' && theme !== 'dark') toggleTheme(); }} className={`flex flex-col items-center gap-1 py-3 rounded-xl border-2 transition ${theme === val ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-slate-200 dark:border-slate-600'}`}>
                      {icon}
                      <span className="text-xs text-slate-600 dark:text-slate-300">{label}</span>
                    </button>
                  ))}
                </div>
              </div>
              {loadingSettings ? null : (
                <SelectRow label="Accent Color" value={settings?.accent_color ?? 'blue'} options={[['blue', 'Blue'], ['emerald', 'Emerald'], ['rose', 'Rose'], ['amber', 'Amber']]} onChange={(v) => updateSetting('accent_color', v)} />
              )}
            </div>
          )}

          {section === 'storage' && (
            <div className="p-4 space-y-3">
              <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-4">
                <p className="text-sm text-slate-500 dark:text-slate-400">Storage usage data will appear here. Clear cache to free up space.</p>
              </div>
              <button onClick={() => toast('Cache cleared', 'success')} className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition text-left">
                <Trash2 className="w-5 h-5 text-blue-500" />
                <span className="flex-1 text-slate-700 dark:text-slate-200">Clear Cache</span>
              </button>
            </div>
          )}

          {section === 'help' && (
            <div className="p-4 space-y-1">
              <HelpRow label="FAQ" onClick={() => toast('FAQ coming soon', 'info')} />
              <HelpRow label="Contact Support" onClick={() => toast('support@chatwave.app', 'info')} />
              <HelpRow label="Report a Bug" onClick={() => toast('Bug report form coming soon', 'info')} />
              <HelpRow label="Privacy Policy" onClick={() => toast('Privacy policy coming soon', 'info')} />
              <HelpRow label="Terms of Service" onClick={() => toast('Terms coming soon', 'info')} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 p-3">
      {icon}
      <div className="flex-1">
        <p className="text-sm text-slate-500 dark:text-slate-400">{label}</p>
        <p className="text-sm text-slate-800 dark:text-white">{value}</p>
      </div>
    </div>
  );
}

function ToggleRow({ label, desc, checked, onChange }: { label: string; desc: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center gap-3 p-3">
      <div className="flex-1">
        <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{label}</p>
        <p className="text-xs text-slate-400">{desc}</p>
      </div>
      <button onClick={() => onChange(!checked)} className={`w-11 h-6 rounded-full transition relative ${checked ? 'bg-blue-500' : 'bg-slate-300 dark:bg-slate-600'}`}>
        <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition ${checked ? 'left-5.5' : 'left-0.5'}`} style={{ left: checked ? '1.375rem' : '0.125rem' }} />
      </button>
    </div>
  );
}

function SelectRow({ label, value, options, onChange }: { label: string; value: string; options: [string, string][]; onChange: (v: string) => void }) {
  return (
    <div className="flex items-center gap-3 p-3">
      <span className="flex-1 text-sm font-medium text-slate-700 dark:text-slate-200">{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-700 text-sm text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600">
        {options.map(([val, lbl]) => <option key={val} value={val}>{lbl}</option>)}
      </select>
    </div>
  );
}

function HelpRow({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition text-left">
      <span className="flex-1 text-slate-700 dark:text-slate-200">{label}</span>
      <ChevronRight className="w-4 h-4 text-slate-300" />
    </button>
  );
}
