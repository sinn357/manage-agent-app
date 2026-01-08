'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatDate, getPriorityColor, getPriorityLabel, cn } from '@/lib/utils';
import { Trophy, XCircle, RotateCcw, Calendar, Flame } from 'lucide-react';
import toast from 'react-hot-toast';

interface Task {
  id: string;
  title: string;
  description: string | null;
  scheduledDate: Date | null;
  priority: string;
  status: string;
  completedAt: Date | null;
  Goal: {
    id: string;
    title: string;
    color: string;
  } | null;
  _count: {
    FocusSession: number;
  };
}

interface ArchiveStats {
  total: number;
  success: number;
  failed: number;
  successRate: number;
}

export default function ArchiveList() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [stats, setStats] = useState<ArchiveStats | null>(null);
  const [filter, setFilter] = useState<'all' | 'success' | 'failed'>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchArchived();
  }, [filter]);

  const fetchArchived = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/tasks/archived?type=${filter}`);
      const data = await response.json();

      if (data.success) {
        setTasks(data.tasks);
        setStats(data.stats);
      } else {
        toast.error(data.error || '아카이브 목록을 불러오지 못했습니다.');
      }
    } catch (error) {
      console.error('Fetch archived tasks error:', error);
      toast.error('네트워크 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleUnarchive = async (taskId: string) => {
    if (!confirm('이 작업을 아카이브에서 복구하시겠습니까?')) return;

    try {
      const response = await fetch(`/api/tasks/${taskId}/unarchive`, {
        method: 'PATCH',
      });

      const data = await response.json();

      if (data.success) {
        toast.success('작업이 복구되었습니다.');
        fetchArchived();
      } else {
        toast.error(data.error || '복구에 실패했습니다.');
      }
    } catch (error) {
      console.error('Unarchive task error:', error);
      toast.error('네트워크 오류가 발생했습니다.');
    }
  };

  if (loading) {
    return (
      <div className="glass-card rounded-xl shadow-lg border border-border p-8">
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="h-20 bg-surface rounded-lg"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 통계 카드 */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card variant="glass" className="p-6">
            <div className="text-sm text-foreground-secondary mb-1">전체 아카이브</div>
            <div className="text-3xl font-bold gradient-text">{stats.total}</div>
          </Card>
          <Card variant="glass" className="p-6">
            <div className="text-sm text-foreground-secondary mb-1 flex items-center gap-1">
              <Trophy className="w-4 h-4 text-success" />
              성공
            </div>
            <div className="text-3xl font-bold text-success">{stats.success}</div>
          </Card>
          <Card variant="glass" className="p-6">
            <div className="text-sm text-foreground-secondary mb-1 flex items-center gap-1">
              <XCircle className="w-4 h-4 text-danger" />
              실패
            </div>
            <div className="text-3xl font-bold text-danger">{stats.failed}</div>
          </Card>
          <Card variant="glass" className="p-6">
            <div className="text-sm text-foreground-secondary mb-1">성공률</div>
            <div className="text-3xl font-bold gradient-text">{stats.successRate}%</div>
          </Card>
        </div>
      )}

      {/* 필터 버튼 */}
      <div className="glass-card inline-flex rounded-xl p-1.5 border border-border shadow-sm">
        <button
          onClick={() => setFilter('all')}
          className={cn(
            'px-6 py-2.5 rounded-lg text-sm font-semibold transition-all duration-300',
            filter === 'all'
              ? 'bg-gradient-to-r from-primary to-violet text-white shadow-md'
              : 'text-foreground-secondary hover:text-foreground hover:bg-surface'
          )}
        >
          전체
        </button>
        <button
          onClick={() => setFilter('success')}
          className={cn(
            'px-6 py-2.5 rounded-lg text-sm font-semibold transition-all duration-300 flex items-center gap-2',
            filter === 'success'
              ? 'bg-gradient-to-r from-success to-success/80 text-white shadow-md'
              : 'text-foreground-secondary hover:text-foreground hover:bg-surface'
          )}
        >
          <Trophy className="w-4 h-4" />
          성공
        </button>
        <button
          onClick={() => setFilter('failed')}
          className={cn(
            'px-6 py-2.5 rounded-lg text-sm font-semibold transition-all duration-300 flex items-center gap-2',
            filter === 'failed'
              ? 'bg-gradient-to-r from-danger to-danger/80 text-white shadow-md'
              : 'text-foreground-secondary hover:text-foreground hover:bg-surface'
          )}
        >
          <XCircle className="w-4 h-4" />
          실패
        </button>
      </div>

      {/* 작업 목록 */}
      <div className="glass-card rounded-xl shadow-lg border border-border">
        {tasks.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-20 h-20 rounded-full bg-surface flex items-center justify-center mx-auto mb-4">
              {filter === 'all' && <Trophy className="w-10 h-10 text-foreground-tertiary" />}
              {filter === 'success' && <Trophy className="w-10 h-10 text-success" />}
              {filter === 'failed' && <XCircle className="w-10 h-10 text-danger" />}
            </div>
            <p className="text-foreground-secondary text-lg">
              {filter === 'all' && '아카이브된 작업이 없습니다'}
              {filter === 'success' && '성공한 작업이 없습니다'}
              {filter === 'failed' && '실패한 작업이 없습니다'}
            </p>
            <p className="text-foreground-tertiary text-sm mt-2">
              완료된 작업은 24시간 후 자동으로 아카이브됩니다
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {tasks.map((task) => {
              const priorityColor = getPriorityColor(task.priority);
              const isSuccess = task.status === 'archived_success';

              return (
                <div
                  key={task.id}
                  className="p-6 hover:bg-surface/50 transition-all group"
                >
                  <div className="flex items-start justify-between gap-4">
                    {/* 왼쪽: 작업 정보 */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        {isSuccess ? (
                          <Trophy className="w-5 h-5 text-success flex-shrink-0" />
                        ) : (
                          <XCircle className="w-5 h-5 text-danger flex-shrink-0" />
                        )}
                        <h3 className="font-semibold text-foreground truncate">
                          {task.title}
                        </h3>
                      </div>

                      {task.description && (
                        <p className="text-sm text-foreground-secondary mb-3 line-clamp-2">
                          {task.description}
                        </p>
                      )}

                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        {/* 우선순위 */}
                        <span
                          className={cn(
                            'px-2 py-0.5 rounded-lg font-medium border',
                            priorityColor.bg,
                            priorityColor.text,
                            priorityColor.border
                          )}
                        >
                          {getPriorityLabel(task.priority)}
                        </span>

                        {/* 목표 */}
                        {task.Goal && (
                          <span
                            className="px-2 py-0.5 rounded-lg text-white font-medium"
                            style={{ backgroundColor: task.Goal.color }}
                          >
                            {task.Goal.title}
                          </span>
                        )}

                        {/* 예정일 */}
                        {task.scheduledDate && (
                          <span className="flex items-center gap-1 text-foreground-secondary">
                            <Calendar className="w-3 h-3" />
                            {formatDate(task.scheduledDate, 'short')}
                          </span>
                        )}

                        {/* 완료일 */}
                        {task.completedAt && (
                          <span className="flex items-center gap-1 text-foreground-secondary">
                            ✓ {formatDate(task.completedAt, 'short')}
                          </span>
                        )}

                        {/* 포커스 세션 */}
                        {task._count.FocusSession > 0 && (
                          <span className="flex items-center gap-1 text-foreground-secondary">
                            <Flame className="w-3 h-3 text-warning" />
                            {task._count.FocusSession}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* 오른쪽: 액션 */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleUnarchive(task.id)}
                      className="gap-2 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <RotateCcw className="w-4 h-4" />
                      복구
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
