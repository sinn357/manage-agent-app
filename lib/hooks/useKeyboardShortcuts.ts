import { useEffect } from 'react';

interface ShortcutHandler {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  handler: () => void;
  description: string;
}

export function useKeyboardShortcuts(shortcuts: ShortcutHandler[]) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      for (const shortcut of shortcuts) {
        const ctrlMatch = shortcut.ctrl ? (event.ctrlKey || event.metaKey) : true;
        const shiftMatch = shortcut.shift ? event.shiftKey : !event.shiftKey;
        const altMatch = shortcut.alt ? event.altKey : !event.altKey;
        const keyMatch = event.key.toLowerCase() === shortcut.key.toLowerCase();

        if (ctrlMatch && shiftMatch && altMatch && keyMatch) {
          event.preventDefault();
          shortcut.handler();
          break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [shortcuts]);
}

// 전역 단축키 목록 (도움말용)
export const GLOBAL_SHORTCUTS = [
  { key: 'Cmd/Ctrl + N', description: '새 작업 추가' },
  { key: 'Cmd/Ctrl + Shift + N', description: '새 목표 추가' },
  { key: 'Cmd/Ctrl + D', description: '다크 모드 전환' },
  { key: 'Cmd/Ctrl + K', description: '검색 (예정)' },
  { key: 'Cmd/Ctrl + /', description: '단축키 도움말 (예정)' },
];
