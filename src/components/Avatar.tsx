import { avatarColor, getInitials } from '@/utils';
import { BadgeCheck } from 'lucide-react';

interface AvatarProps {
  src: string | null | undefined;
  name: string;
  id: string;
  size?: 'sm' | 'md' | 'lg';
  online?: boolean;
  verified?: boolean;
}

const sizeMap = {
  sm: 'w-9 h-9 text-xs',
  md: 'w-12 h-12 text-sm',
  lg: 'w-24 h-24 text-2xl',
};

const dotSize = {
  sm: 'w-2.5 h-2.5',
  md: 'w-3 h-3',
  lg: 'w-5 h-5',
};

const badgeSize = {
  sm: 'w-3.5 h-3.5',
  md: 'w-4 h-4',
  lg: 'w-6 h-6',
};

export default function Avatar({ src, name, id, size = 'md', online, verified }: AvatarProps) {
  return (
    <div className="relative shrink-0">
      {src ? (
        <img
          src={src}
          alt={name}
          className={`${sizeMap[size]} rounded-full object-cover`}
        />
      ) : (
        <div
          className={`${sizeMap[size]} rounded-full flex items-center justify-center text-white font-semibold ${avatarColor(id)}`}
        >
          {getInitials(name)}
        </div>
      )}
      {online !== undefined && online && (
        <span
          className={`absolute bottom-0 right-0 ${dotSize[size]} bg-emerald-500 rounded-full border-2 border-white dark:border-slate-800`}
        />
      )}
      {verified && (
        <span className={`absolute -bottom-0.5 -right-0.5 ${badgeSize[size]} bg-white dark:bg-slate-800 rounded-full flex items-center justify-center`}>
          <BadgeCheck className={`${badgeSize[size]} text-blue-500`} />
        </span>
      )}
    </div>
  );
}
