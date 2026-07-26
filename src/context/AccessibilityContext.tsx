import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

interface AccessibilityContextValue {
  highContrast: boolean;
  dyslexiaFont: boolean;
  largeText: boolean;
  toggleHighContrast: () => void;
  toggleDyslexiaFont: () => void;
  toggleLargeText: () => void;
}

const AccessibilityContext = createContext<AccessibilityContextValue | undefined>(undefined);

export function AccessibilityProvider({ children }: { children: ReactNode }) {
  const [highContrast, setHighContrast] = useState(() => localStorage.getItem('a11y-contrast') === 'true');
  const [dyslexiaFont, setDyslexiaFont] = useState(() => localStorage.getItem('a11y-dyslexia') === 'true');
  const [largeText, setLargeText] = useState(() => localStorage.getItem('a11y-large') === 'true');

  useEffect(() => {
    const root = document.documentElement;
    if (highContrast) root.classList.add('high-contrast'); else root.classList.remove('high-contrast');
    localStorage.setItem('a11y-contrast', String(highContrast));
  }, [highContrast]);

  useEffect(() => {
    const root = document.documentElement;
    if (dyslexiaFont) root.classList.add('dyslexia-font'); else root.classList.remove('dyslexia-font');
    localStorage.setItem('a11y-dyslexia', String(dyslexiaFont));
  }, [dyslexiaFont]);

  useEffect(() => {
    const root = document.documentElement;
    if (largeText) root.classList.add('large-text'); else root.classList.remove('large-text');
    localStorage.setItem('a11y-large', String(largeText));
  }, [largeText]);

  return (
    <AccessibilityContext.Provider value={{
      highContrast, dyslexiaFont, largeText,
      toggleHighContrast: () => setHighContrast((v) => !v),
      toggleDyslexiaFont: () => setDyslexiaFont((v) => !v),
      toggleLargeText: () => setLargeText((v) => !v),
    }}>
      {children}
    </AccessibilityContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAccessibility() {
  const ctx = useContext(AccessibilityContext);
  if (!ctx) throw new Error('useAccessibility must be used within AccessibilityProvider');
  return ctx;
}
