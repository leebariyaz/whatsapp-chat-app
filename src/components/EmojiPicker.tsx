import { useState } from 'react';

const EMOJI_CATEGORIES: { name: string; emojis: string[] }[] = [
  {
    name: 'Smileys',
    emojis: ['😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🥳', '🤩', '😏'],
  },
  {
    name: 'Gestures',
    emojis: ['👍', '👎', '👌', '✌️', '🤞', '🤟', '🤙', '👈', '👉', '👆', '👇', '☝️', '✋', '🤚', '🖐️', '👋', '🤝', '🙏', '💪', '✊', '👊', '🤛', '🤜', '👏', '🙌', '🤲', '🫶', '❤️', '🧡', '💛', '💚', '💙'],
  },
  {
    name: 'Objects',
    emojis: ['🎉', '🎊', '🎁', '🎈', '🎂', '🍰', '☕', '🍵', '🍺', '🍻', '🥂', '🍷', '🍕', '🍔', '🍟', '🌮', '🍣', '🍜', '🍦', '🍩', '🍪', '⚽', '🏀', '🏈', '⚾', '🎾', '🎮', '🎲', '🎵', '🎶', '🎸', '🎹'],
  },
  {
    name: 'Nature',
    emojis: ['🌸', '🌺', '🌻', '🌹', '🌷', '🌼', '🍀', '🌿', '🌱', '🌳', '🌲', '🌴', '🌵', '🍁', '🍂', '🌊', '⛰️', '🏔️', '🌋', '🏝️', '🏖️', '🌅', '🌄', '🌞', '🌝', '🌚', '⭐', '🌟', '✨', '💫', '🔥', '🌈'],
  },
];

interface EmojiPickerProps {
  onSelect: (emoji: string) => void;
  onClose: () => void;
}

export default function EmojiPicker({ onSelect, onClose }: EmojiPickerProps) {
  const [active, setActive] = useState(0);

  return (
    <div className="absolute bottom-full mb-2 left-0 z-30 w-80 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-700 overflow-hidden">
      <div className="flex border-b border-slate-100 dark:border-slate-700">
        {EMOJI_CATEGORIES.map((cat, i) => (
          <button
            key={cat.name}
            onClick={() => setActive(i)}
            className={`flex-1 py-2 text-xs font-medium transition ${
              active === i
                ? 'text-blue-500 border-b-2 border-blue-500'
                : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>
      <div className="p-2 grid grid-cols-8 gap-1 max-h-56 overflow-y-auto">
        {EMOJI_CATEGORIES[active].emojis.map((e, i) => (
          <button
            key={i}
            onClick={() => onSelect(e)}
            className="w-9 h-9 flex items-center justify-center text-xl rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition"
          >
            {e}
          </button>
        ))}
      </div>
      <button
        onClick={onClose}
        className="w-full py-2 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 border-t border-slate-100 dark:border-slate-700"
      >
        Close
      </button>
    </div>
  );
}
