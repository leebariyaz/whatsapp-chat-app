import { useState, type FormEvent } from 'react';
import { Loader2, Mail, Lock, User, AtSign, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import Logo from '@/components/Logo';

type Mode = 'login' | 'signup' | 'forgot' | 'verify';

export default function AuthPage() {
  const { signIn, signUp, resetPassword, resendVerification } = useAuth();
  const { toast } = useToast();
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (mode === 'forgot') {
      if (!email.trim()) { setError('Please enter your email.'); return; }
      setLoading(true);
      try {
        await resetPassword(email.trim());
        setSuccessMsg('Password reset link sent! Check your email.');
        toast('Reset link sent to your email', 'success');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to send reset link');
      } finally {
        setLoading(false);
      }
      return;
    }

    if (mode === 'verify') {
      if (!email.trim()) { setError('Please enter your email.'); return; }
      setLoading(true);
      try {
        await resendVerification(email.trim());
        setSuccessMsg('Verification email sent! Check your inbox.');
        toast('Verification email sent', 'success');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to resend verification');
      } finally {
        setLoading(false);
      }
      return;
    }

    if (!email.trim() || !password.trim()) {
      setError('Please fill in all fields.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (mode === 'signup') {
      if (!username.trim() || !fullName.trim()) {
        setError('Please fill in all fields.');
        return;
      }
      if (!/^[a-z0-9_]{3,20}$/i.test(username)) {
        setError('Username must be 3-20 characters (letters, numbers, underscore).');
        return;
      }
    }

    setLoading(true);
    try {
      if (mode === 'login') {
        await signIn(email.trim(), password);
        toast('Welcome back!', 'success');
      } else {
        await signUp(email.trim(), password, username.trim().toLowerCase(), fullName.trim());
        setSuccessMsg('Account created! Please check your email to verify, then sign in.');
        toast('Account created! Check your email to verify.', 'success');
        setMode('login');
        setUsername('');
        setFullName('');
        setPassword('');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Something went wrong';
      setError(message.replace(/\(.*?\)/g, '').trim() || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-100 via-blue-50 to-emerald-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 p-4">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <Logo size="lg" />
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white mt-4">Pulse</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            {mode === 'login' ? 'Welcome back' : mode === 'signup' ? 'Create your account' : mode === 'forgot' ? 'Reset your password' : 'Verify your email'}
          </p>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8 border border-slate-100 dark:border-slate-700">
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <>
                <Field icon={<User className="w-4 h-4" />} label="Full Name">
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Jane Doe"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900 transition"
                  />
                </Field>
                <Field icon={<AtSign className="w-4 h-4" />} label="Username">
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="jane_doe"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900 transition"
                  />
                </Field>
              </>
            )}

            {(mode === 'login' || mode === 'signup' || mode === 'forgot' || mode === 'verify') && (
              <Field icon={<Mail className="w-4 h-4" />} label="Email">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900 transition"
                />
              </Field>
            )}

            {(mode === 'login' || mode === 'signup') && (
              <Field icon={<Lock className="w-4 h-4" />} label="Password">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900 transition"
                />
              </Field>
            )}

            {error && (
              <p className="text-sm text-rose-500 dark:text-rose-400">{error}</p>
            )}
            {successMsg && (
              <div className="flex items-start gap-2 text-sm text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
                <p>{successMsg}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-emerald-500 text-white font-medium hover:opacity-90 disabled:opacity-50 transition flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {mode === 'login' ? 'Sign In' : mode === 'signup' ? 'Create Account' : mode === 'forgot' ? 'Send Reset Link' : 'Send Verification'}
            </button>
          </form>

          <div className="mt-6 space-y-2 text-center text-sm text-slate-500 dark:text-slate-400">
            {mode === 'login' && (
              <>
                <p>
                  Don't have an account?{' '}
                  <button onClick={() => { setMode('signup'); setError(''); setSuccessMsg(''); }} className="text-blue-500 hover:text-blue-600 font-medium">
                    Sign up
                  </button>
                </p>
                <p>
                  <button onClick={() => { setMode('forgot'); setError(''); setSuccessMsg(''); }} className="text-blue-500 hover:text-blue-600">
                    Forgot password?
                  </button>
                </p>
                <p>
                  <button onClick={() => { setMode('verify'); setError(''); setSuccessMsg(''); }} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                    Resend email verification
                  </button>
                </p>
              </>
            )}
            {mode === 'signup' && (
              <p>
                Already have an account?{' '}
                <button onClick={() => { setMode('login'); setError(''); setSuccessMsg(''); }} className="text-blue-500 hover:text-blue-600 font-medium">
                  Sign in
                </button>
              </p>
            )}
            {(mode === 'forgot' || mode === 'verify') && (
              <p>
                <button onClick={() => { setMode('login'); setError(''); setSuccessMsg(''); }} className="text-blue-500 hover:text-blue-600 font-medium flex items-center justify-center gap-1">
                  <ArrowLeft className="w-4 h-4" /> Back to sign in
                </button>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1.5">{label}</label>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">{icon}</span>
        {children}
      </div>
    </div>
  );
}
