import { MessageCircle, Sparkles } from 'lucide-react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
}

const sizeMap = {
  sm: { box: 'w-8 h-8', icon: 'w-5 h-5', text: 'text-base' },
  md: { box: 'w-10 h-10', icon: 'w-6 h-6', text: 'text-lg' },
  lg: { box: 'w-16 h-16', icon: 'w-9 h-9', text: 'text-2xl' },
  xl: { box: 'w-20 h-20', icon: 'w-12 h-12', text: 'text-3xl' },
};

export default function Logo({ size = 'md', showText = false }: LogoProps) {
  const s = sizeMap[size];
  return (
    <div className="flex items-center gap-2.5">
      <div className={`${s.box} rounded-2xl bg-gradient-to-br from-teal-500 via-cyan-500 to-blue-500 flex items-center justify-center relative shadow-lg shadow-cyan-500/20`}>
        <MessageCircle className={`${s.icon} text-white`} strokeWidth={2.5} />
        <Sparkles className="w-3 h-3 text-amber-300 absolute -top-1 -right-1" />
      </div>
      {showText && (
        <span className={`${s.text} font-bold bg-gradient-to-r from-teal-600 to-blue-600 dark:from-teal-400 dark:to-blue-400 bg-clip-text text-transparent`}>
          Pulse
        </span>
      )}
    </div>
  );
}
