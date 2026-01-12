'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Search, CheckCircle2, Target, RefreshCw, Calendar, Loader2 } from 'lucide-react';
import { cn, formatDate } from '@/lib/utils';
import { useDebounce } from '@/lib/hooks/useDebounce';

interface Task {
  id: string;
  title: string;
  description: string | null;
  scheduledDate: Date | null;
  status: string;
  isFromRoutine?: boolean;
  Goal: {
    id: string;
    title: string;
    color: string;
  } | null;
}

interface Goal {
  id: string;
  title: string;
  description: string | null;
  status: string;
  color: string;
  _count: {
    Task: number;
  };
}

interface Routine {
  id: string;
  title: string;
  description: string | null;
  active: boolean;
  recurrenceType: string;
}

interface SearchResults {
  tasks: Task[];
  goals: Goal[];
  routines: Routine[];
}

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResults>({
    tasks: [],
    goals: [],
    routines: [],
  });
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const debouncedQuery = useDebounce(query, 300);

  // 전체 결과 리스트 (순서: Tasks → Goals → Routines)
  const allResults = [
    ...results.tasks.map((item) => ({ type: 'task' as const, item })),
    ...results.goals.map((item) => ({ type: 'goal' as const, item })),
    ...results.routines.map((item) => ({ type: 'routine' as const, item })),
  ];

  // 검색 실행
  const performSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults({ tasks: [], goals: [], routines: [] });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`);
      const data = await response.json();

      if (data.success) {
        setResults(data.results);
      }
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 디바운스된 검색
  useEffect(() => {
    performSearch(debouncedQuery);
  }, [debouncedQuery, performSearch]);

  // 모달 열릴 때 입력창 포커스
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
      setQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // 키보드 네비게이션
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => Math.min(prev + 1, allResults.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter' && allResults.length > 0) {
      e.preventDefault();
      handleSelect(allResults[selectedIndex]);
    }
  };

  // 결과 선택
  const handleSelect = (result: { type: string; item: any }) => {
    if (result.type === 'task') {
      router.push(`/dashboard?taskId=${result.item.id}`);
    } else if (result.type === 'goal') {
      router.push(`/dashboard?goalId=${result.item.id}`);
    } else if (result.type === 'routine') {
      router.push(`/settings?tab=routines&routineId=${result.item.id}`);
    }
    onClose();
  };

  // 검색어 하이라이트
  const highlightQuery = (text: string) => {
    if (!query.trim()) return text;

    const regex = new RegExp(`(${query.trim()})`, 'gi');
    const parts = text.split(regex);

    return parts.map((part, index) =>
      regex.test(part) ? (
        <mark key={index} className="bg-primary/20 text-foreground font-semibold">
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  const totalResults = allResults.length;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] p-0 gap-0 overflow-hidden">
        <DialogHeader className="px-6 py-4 border-b">
          <DialogTitle className="sr-only">검색</DialogTitle>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground-tertiary" />
            <Input
              ref={inputRef}
              type="text"
              placeholder="작업, 목표, 루틴 검색... (Ctrl+K)"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              className="pl-11 pr-4 py-6 text-base border-none focus-visible:ring-0 focus-visible:ring-offset-0"
            />
            {isLoading && (
              <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground-tertiary animate-spin" />
            )}
          </div>
        </DialogHeader>

        <div className="overflow-y-auto max-h-[calc(80vh-100px)] p-2">
          {!query.trim() && (
            <div className="px-4 py-12 text-center text-foreground-secondary">
              <Search className="w-12 h-12 mx-auto mb-3 text-foreground-tertiary" />
              <p className="text-sm">검색어를 입력하세요</p>
              <p className="text-xs mt-1">작업, 목표, 루틴을 검색할 수 있습니다</p>
            </div>
          )}

          {query.trim() && totalResults === 0 && !isLoading && (
            <div className="px-4 py-12 text-center text-foreground-secondary">
              <p className="text-sm">검색 결과가 없습니다</p>
              <p className="text-xs mt-1">&quot;{query}&quot;에 대한 결과를 찾을 수 없습니다</p>
            </div>
          )}

          {/* Tasks */}
          {results.tasks.length > 0 && (
            <div className="mb-4">
              <div className="px-4 py-2 text-xs font-semibold text-foreground-secondary uppercase tracking-wide">
                작업 ({results.tasks.length})
              </div>
              <div className="space-y-1">
                {results.tasks.map((task, index) => {
                  const globalIndex = allResults.findIndex(
                    (r) => r.type === 'task' && r.item.id === task.id
                  );
                  return (
                    <button
                      key={task.id}
                      onClick={() => handleSelect({ type: 'task', item: task })}
                      className={cn(
                        'w-full text-left px-4 py-3 rounded-lg transition-colors',
                        globalIndex === selectedIndex
                          ? 'bg-primary/10 border border-primary/30'
                          : 'hover:bg-surface border border-transparent'
                      )}
                    >
                      <div className="flex items-start gap-3">
                        {task.status === 'completed' ? (
                          <CheckCircle2 className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                        ) : (
                          <div className="w-5 h-5 rounded-full border-2 border-border flex-shrink-0 mt-0.5" />
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-foreground mb-1">
                            {highlightQuery(task.title)}
                          </div>
                          {task.description && (
                            <div className="text-sm text-foreground-secondary line-clamp-1">
                              {highlightQuery(task.description)}
                            </div>
                          )}
                          <div className="flex items-center gap-2 mt-2">
                            {task.isFromRoutine && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs bg-violet/10 text-violet border border-violet/30 rounded-lg">
                                <RefreshCw className="w-3 h-3" />
                                루틴
                              </span>
                            )}
                            {task.Goal && (
                              <span
                                className="px-2 py-0.5 text-xs text-white rounded-lg"
                                style={{ backgroundColor: task.Goal.color }}
                              >
                                {task.Goal.title}
                              </span>
                            )}
                            {task.scheduledDate && (
                              <span className="inline-flex items-center gap-1 text-xs text-foreground-secondary">
                                <Calendar className="w-3 h-3" />
                                {formatDate(task.scheduledDate, 'short')}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Goals */}
          {results.goals.length > 0 && (
            <div className="mb-4">
              <div className="px-4 py-2 text-xs font-semibold text-foreground-secondary uppercase tracking-wide">
                목표 ({results.goals.length})
              </div>
              <div className="space-y-1">
                {results.goals.map((goal) => {
                  const globalIndex = allResults.findIndex(
                    (r) => r.type === 'goal' && r.item.id === goal.id
                  );
                  return (
                    <button
                      key={goal.id}
                      onClick={() => handleSelect({ type: 'goal', item: goal })}
                      className={cn(
                        'w-full text-left px-4 py-3 rounded-lg transition-colors',
                        globalIndex === selectedIndex
                          ? 'bg-primary/10 border border-primary/30'
                          : 'hover:bg-surface border border-transparent'
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <Target
                          className="w-5 h-5 flex-shrink-0 mt-0.5"
                          style={{ color: goal.color }}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-foreground mb-1">
                            {highlightQuery(goal.title)}
                          </div>
                          {goal.description && (
                            <div className="text-sm text-foreground-secondary line-clamp-1">
                              {highlightQuery(goal.description)}
                            </div>
                          )}
                          <div className="flex items-center gap-2 mt-2">
                            <span className="text-xs text-foreground-secondary">
                              {goal._count.Task}개 작업
                            </span>
                            <span
                              className={cn(
                                'px-2 py-0.5 text-xs rounded-lg',
                                goal.status === 'active'
                                  ? 'bg-success/10 text-success'
                                  : 'bg-foreground-tertiary/10 text-foreground-tertiary'
                              )}
                            >
                              {goal.status === 'active' ? '진행중' : '완료'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Routines */}
          {results.routines.length > 0 && (
            <div className="mb-4">
              <div className="px-4 py-2 text-xs font-semibold text-foreground-secondary uppercase tracking-wide">
                루틴 ({results.routines.length})
              </div>
              <div className="space-y-1">
                {results.routines.map((routine) => {
                  const globalIndex = allResults.findIndex(
                    (r) => r.type === 'routine' && r.item.id === routine.id
                  );
                  return (
                    <button
                      key={routine.id}
                      onClick={() => handleSelect({ type: 'routine', item: routine })}
                      className={cn(
                        'w-full text-left px-4 py-3 rounded-lg transition-colors',
                        globalIndex === selectedIndex
                          ? 'bg-primary/10 border border-primary/30'
                          : 'hover:bg-surface border border-transparent'
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <RefreshCw className="w-5 h-5 text-violet flex-shrink-0 mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-foreground mb-1">
                            {highlightQuery(routine.title)}
                          </div>
                          {routine.description && (
                            <div className="text-sm text-foreground-secondary line-clamp-1">
                              {highlightQuery(routine.description)}
                            </div>
                          )}
                          <div className="flex items-center gap-2 mt-2">
                            <span className="text-xs text-foreground-secondary">
                              {routine.recurrenceType === 'daily' && '매일'}
                              {routine.recurrenceType === 'weekly' && '매주'}
                              {routine.recurrenceType === 'monthly' && '매월'}
                            </span>
                            <span
                              className={cn(
                                'px-2 py-0.5 text-xs rounded-lg',
                                routine.active
                                  ? 'bg-success/10 text-success'
                                  : 'bg-foreground-tertiary/10 text-foreground-tertiary'
                              )}
                            >
                              {routine.active ? '활성' : '비활성'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {totalResults > 0 && (
          <div className="px-6 py-3 border-t bg-surface/50 text-xs text-foreground-secondary flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <kbd className="px-2 py-1 bg-background border rounded text-foreground-tertiary">↑</kbd>
                <kbd className="px-2 py-1 bg-background border rounded text-foreground-tertiary">↓</kbd>
                <span>이동</span>
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-2 py-1 bg-background border rounded text-foreground-tertiary">Enter</kbd>
                <span>선택</span>
              </span>
            </div>
            <span>{totalResults}개 결과</span>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
