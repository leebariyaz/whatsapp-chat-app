import { useEffect, useState } from 'react';
import { Sparkles, MessageCircle, Shield, Zap, Users } from 'lucide-react';
import Logo from '@/components/Logo';

interface SplashScreenProps {
  onComplete: () => void;
}

export default function SplashScreen({ onComplete }: SplashScreenProps) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) { clearInterval(interval); setTimeout(onComplete, 300); return 100; }
        return p + 4;
      });
    }, 30);
    return () => clearInterval(interval);
  }, [onComplete]);

  return (
    <div className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 via-teal-950 to-blue-950">
      <div className="animate-fade-in">
        <Logo size="xl" />
      </div>
      <h1 className="text-3xl font-bold text-white mt-6 tracking-tight">Pulse</h1>
      <p className="text-teal-300/70 text-sm mt-1">Messaging, reimagined.</p>
      <div className="w-48 h-1 bg-white/10 rounded-full mt-8 overflow-hidden">
        <div className="h-full bg-gradient-to-r from-teal-400 to-blue-400 rounded-full transition-all duration-75" style={{ width: `${progress}%` }} />
      </div>
    </div>
  );
}

interface OnboardingProps {
  onComplete: () => void;
}

const SLIDES = [
  { icon: <MessageCircle className="w-10 h-10 text-teal-400" />, title: 'Real-time messaging', desc: 'Send text, photos, videos, voice notes, documents, and more — delivered instantly with read receipts.' },
  { icon: <Users className="w-10 h-10 text-blue-400" />, title: 'Groups, polls & events', desc: 'Create group chats with shared to-do lists, live polls, and events with RSVP tracking.' },
  { icon: <Shield className="w-10 h-10 text-emerald-400" />, title: 'Private & secure', desc: 'End-to-end encrypted, friend requests, chat lock, blocked contacts, and full privacy control.' },
  { icon: <Zap className="w-10 h-10 text-amber-400" />, title: 'Productivity built-in', desc: 'Reminders, scheduled messages, auto-reply, folders, and your personal dashboard — all in one place.' },
  { icon: <Sparkles className="w-10 h-10 text-violet-400" />, title: 'Your AI Assistant', desc: 'An official verified assistant welcomes you, shares tips, and announces new features.' },
];

export function Onboarding({ onComplete }: OnboardingProps) {
  const [step, setStep] = useState(0);
  const slide = SLIDES[step];

  const next = () => {
    if (step < SLIDES.length - 1) setStep((s) => s + 1);
    else onComplete();
  };

  return (
    <div className="fixed inset-0 z-[150] flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 to-teal-50 dark:from-slate-900 dark:to-slate-800 p-8">
      <div className="max-w-md w-full text-center">
        <div className="w-24 h-24 mx-auto rounded-3xl bg-white dark:bg-slate-800 shadow-xl flex items-center justify-center mb-8 animate-fade-in">
          {slide.icon}
        </div>
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-3">{slide.title}</h2>
        <p className="text-slate-500 dark:text-slate-400 leading-relaxed mb-8">{slide.desc}</p>

        <div className="flex justify-center gap-2 mb-8">
          {SLIDES.map((_, i) => (
            <span key={i} className={`h-2 rounded-full transition-all ${i === step ? 'w-8 bg-teal-500' : 'w-2 bg-slate-300 dark:bg-slate-600'}`} />
          ))}
        </div>

        <div className="flex gap-3">
          {step > 0 && (
            <button onClick={() => setStep((s) => s - 1)} className="px-6 py-2.5 rounded-xl text-slate-500 dark:text-slate-300 font-medium hover:bg-slate-100 dark:hover:bg-slate-700 transition">
              Back
            </button>
          )}
          <button onClick={next} className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-teal-500 to-blue-500 text-white font-medium hover:opacity-90 transition">
            {step < SLIDES.length - 1 ? 'Next' : 'Get Started'}
          </button>
        </div>
        {step < SLIDES.length - 1 && (
          <button onClick={onComplete} className="mt-4 text-sm text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
            Skip
          </button>
        )}
      </div>
    </div>
  );
}
