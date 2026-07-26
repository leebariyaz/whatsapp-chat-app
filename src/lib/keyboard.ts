import { useEffect } from 'react';

interface ShortcutHandler {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  handler: () => void;
}

export function useKeyboardShortcuts(shortcuts: ShortcutHandler[]) {
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      for (const s of shortcuts) {
        if (e.key === s.key && !!e.ctrlKey === !!s.ctrl && !!e.shiftKey === !!s.shift) {
          // Don't trigger when typing in inputs (except for ctrl-based shortcuts)
          if (!s.ctrl && (e.target as HTMLElement)?.tagName?.match(/INPUT|TEXTAREA|SELECT/)) return;
          e.preventDefault();
          s.handler();
          return;
        }
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [shortcuts]);
}

export const KEYBOARD_SHORTCUTS = [
  { keys: 'Ctrl+K', desc: 'Search' },
  { keys: 'Ctrl+N', desc: 'New chat' },
  { keys: 'Ctrl+B', desc: 'Toggle sidebar' },
  { keys: 'Ctrl+D', desc: 'Dashboard' },
  { keys: 'Ctrl+,', desc: 'Settings' },
  { keys: 'Esc', desc: 'Close modal' },
  { keys: 'Ctrl+/', desc: 'Show shortcuts' },
];
