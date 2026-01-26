'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { formatDuration, formatRelativeTime } from '@/lib/utils';
import { History, Trash2, Clock, CheckCircle2, AlertCircle, Timer } from 'lucide-react';

interface FocusSession {
  id: string;
  duration: number;
  actualTime: number;
  completed: boolean;
  interrupted: boolean;
  createdAt: Date;
  task: {
    id: string;
    title: string;
  } | null;
}

interface FocusHistoryDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessions: FocusSession[];
  stats: {
    total: number;
    completed: number;
    interrupted: number;
    totalMinutes: number;
  };
  onRefresh: () => void;
}

export default function FocusHistoryDetailModal({
  isOpen,
  onClose,
  sessions,
  stats,
  onRefresh,
}: FocusHistoryDetailModalProps) {
  const handleDelete = async (sessionId: string) => {
    if (!confirm('이 세션을 삭제하시겠습니까?')) return;

    try {
      const response = await fetch(`/api/focus-sessions?id=${sessionId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        onRefresh();
      } else {
        alert(data.error || '삭제 실패');
      }
    } catch (err) {
      console.error('Delete session error:', err);
      alert('삭제 중 오류가 발생했습니다');
    }
  };

  // 완료율 계산
  const completionRate = stats.total > 0
    ? Math.round((stats.completed / stats.total) * 100)
    : 0;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <History className="w-5 h-5 text-primary" />
            포커스 히스토리
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4 pr-2">
          {/* 통계 카드 */}
          <div className="grid grid-cols-4 gap-2">
            <div className="bg-primary/10 rounded-xl p-3 text-center">
              <div className="flex items-center justify-center gap-1 text-foreground-secondary mb-1">
                <Timer className="w-3 h-3" />
                <span className="text-[10px]">세션</span>
              </div>
              <div className="text-lg font-bold text-primary">{stats.total}</div>
            </div>
            <div className="bg-success/10 rounded-xl p-3 text-center">
              <div className="flex items-center justify-center gap-1 text-foreground-secondary mb-1">
                <CheckCircle2 className="w-3 h-3" />
                <span className="text-[10px]">완료</span>
              </div>
              <div className="text-lg font-bold text-success">{stats.completed}</div>
            </div>
            <div className="bg-warning/10 rounded-xl p-3 text-center">
              <div className="flex items-center justify-center gap-1 text-foreground-secondary mb-1">
                <AlertCircle className="w-3 h-3" />
                <span className="text-[10px]">중단</span>
              </div>
              <div className="text-lg font-bold text-warning">{stats.interrupted}</div>
            </div>
            <div className="bg-violet/10 rounded-xl p-3 text-center">
              <div className="flex items-center justify-center gap-1 text-foreground-secondary mb-1">
                <Clock className="w-3 h-3" />
                <span className="text-[10px]">총 시간</span>
              </div>
              <div className="text-lg font-bold text-violet">
                {formatDuration(stats.totalMinutes)}
              </div>
            </div>
          </div>

          {/* 완료율 프로그레스 */}
          {stats.total > 0 && (
            <div className="bg-surface rounded-xl p-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-foreground">완료율</span>
                <span className="text-sm font-bold text-primary">{completionRate}%</span>
              </div>
              <div className="w-full h-2 bg-background rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-primary to-violet transition-all duration-500 rounded-full"
                  style={{ width: `${completionRate}%` }}
                />
              </div>
            </div>
          )}

          {/* 세션 목록 */}
          {sessions.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 rounded-full bg-surface flex items-center justify-center mx-auto mb-4">
                <History className="w-8 h-8 text-foreground-tertiary" />
              </div>
              <p className="text-foreground-secondary text-sm">아직 세션이 없습니다</p>
              <p className="text-foreground-tertiary text-xs mt-1">
                포커스 타이머를 시작해보세요
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="text-sm font-medium text-foreground mb-2">최근 세션</div>
              {sessions.map((session) => (
                <div
                  key={session.id}
                  className="flex items-start justify-between p-3 rounded-xl border border-border hover:bg-surface transition-all group"
                >
                  <div className="flex-1 min-w-0">
                    {/* 작업명 또는 일반 포커스 */}
                    {session.task ? (
                      <div className="font-medium text-foreground text-sm truncate mb-1">
                        {session.task.title}
                      </div>
                    ) : (
                      <div className="font-medium text-foreground-secondary text-sm mb-1">
                        일반 포커스
                      </div>
                    )}

                    {/* 시간 정보 */}
                    <div className="flex items-center gap-2 text-xs text-foreground-tertiary">
                      <span>{formatRelativeTime(session.createdAt)}</span>
                      <span>•</span>
                      <span>
                        {formatDuration(session.actualTime)} / {formatDuration(session.duration)}
                      </span>
                    </div>
                  </div>

                  {/* 상태 뱃지 & 삭제 버튼 */}
                  <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                    {session.completed && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-success/10 text-success">
                        완료
                      </span>
                    )}
                    {session.interrupted && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-warning/10 text-warning">
                        중단
                      </span>
                    )}
                    {!session.completed && !session.interrupted && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-primary/10 text-primary">
                        진행중
                      </span>
                    )}
                    <button
                      onClick={() => handleDelete(session.id)}
                      className="opacity-0 group-hover:opacity-100 p-1.5 text-danger hover:bg-danger/10 rounded-lg transition-all"
                      title="삭제"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
