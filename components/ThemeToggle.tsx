'use client';

import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { Button } from './ui/button';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // useEffect만 실행되도록 보장 (hydration 불일치 방지)
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Button variant="outline" size="sm" className="w-9 h-9 p-0">
        <span className="sr-only">테마 전환</span>
        <span>🌓</span>
      </Button>
    );
  }

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={toggleTheme}
      className="w-9 h-9 p-0"
      aria-label={`현재 테마: ${theme === 'dark' ? '다크' : '라이트'} 모드. 클릭하여 ${theme === 'dark' ? '라이트' : '다크'} 모드로 전환`}
    >
      {theme === 'dark' ? (
        <span className="text-lg">🌙</span>
      ) : (
        <span className="text-lg">☀️</span>
      )}
      <span className="sr-only">테마 전환</span>
    </Button>
  );
}
