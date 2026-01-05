'use client';

import { useState } from 'react';
import { useDeletedTasks, useRestoreTask, usePermanentDeleteTask } from '@/lib/hooks/useTasks';
import { formatDate, formatRelativeTime, getPriorityColor, getPriorityLabel, cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Trash2, RotateCcw, AlertTriangle, Calendar as CalendarIcon, Flame } from 'lucide-react';
import toast from 'react-hot-toast';

interface Task {
  id: string;
  title: string;
  description: string | null;
  scheduledDate: Date | null;
  priority: string;
  deletedAt: Date | null;
  Goal: {
    id: string;
    title: string;
    color: string;
  } | null;
  _count: {
    FocusSession: number;
  };
}

export default function TrashList() {
  // 데이터 fetching
  const { data: deletedTasks = [], isLoading, error } = useDeletedTasks();
  const restoreTask = useRestoreTask();
  const permanentDeleteTask = usePermanentDeleteTask();

  // 확인 다이얼로그 상태
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    type: 'restore' | 'permanent';
    taskId: string | null;
    taskTitle: string | null;
  }>({
    open: false,
    type: 'restore',
    taskId: null,
    taskTitle: null,
  });

  const handleRestoreClick = (task: Task) => {
    setConfirmDialog({
      open: true,
      type: 'restore',
      taskId: task.id,
      taskTitle: task.title,
    });
  };

  const handlePermanentDeleteClick = (task: Task) => {
    setConfirmDialog({
      open: true,
      type: 'permanent',
      taskId: task.id,
      taskTitle: task.title,
    });
  };

  const handleConfirm = async () => {
    if (!confirmDialog.taskId) return;

    try {
      if (confirmDialog.type === 'restore') {
        await restoreTask.mutateAsync(confirmDialog.taskId);
        toast.success('작업이 복구되었습니다');
      } else {
        await permanentDeleteTask.mutateAsync(confirmDialog.taskId);
        toast.success('작업이 영구적으로 삭제되었습니다');
      }
    } catch (error) {
      toast.error(
        confirmDialog.type === 'restore'
          ? '복구에 실패했습니다'
          : '영구 삭제에 실패했습니다'
      );
    } finally {
      setConfirmDialog({
        open: false,
        type: 'restore',
        taskId: null,
        taskTitle: null,
      });
    }
  };

  const handleCancel = () => {
    setConfirmDialog({
      open: false,
      type: 'restore',
      taskId: null,
      taskTitle: null,
    });
  };

  // 로딩 상태
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="animate-pulse glass-card rounded-xl p-6 border border-border">
            <div className="space-y-3">
              <div className="h-5 bg-surface rounded-lg w-3/4"></div>
              <div className="h-4 bg-surface rounded-lg w-1/2"></div>
              <div className="flex gap-2">
                <div className="h-8 bg-surface rounded-lg w-20"></div>
                <div className="h-8 bg-surface rounded-lg w-20"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // 에러 상태
  if (error) {
    return (
      <div className="glass-card rounded-xl p-8 border border-danger/30 text-center">
        <AlertTriangle className="w-12 h-12 text-danger mx-auto mb-4" />
        <p className="text-danger font-medium">{error.message}</p>
      </div>
    );
  }

  // 빈 상태
  if (deletedTasks.length === 0) {
    return (
      <div className="glass-card rounded-xl p-12 text-center border border-border floating-card">
        <div className="w-20 h-20 rounded-full bg-surface flex items-center justify-center mx-auto mb-6">
          <Trash2 className="w-10 h-10 text-foreground-tertiary" />
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-2">휴지통이 비어 있습니다</h3>
        <p className="text-sm text-foreground-secondary">
          삭제된 작업이 없습니다
        </p>
      </div>
    );
  }

  // 작업 목록
  return (
    <>
      <div className="space-y-4">
        {/* 안내 메시지 */}
        <div className="glass-card rounded-xl p-4 border border-warning/30 bg-warning/5">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="text-foreground font-medium mb-1">휴지통 안내</p>
              <p className="text-foreground-secondary">
                삭제된 작업은 복구하거나 영구적으로 삭제할 수 있습니다.
                영구 삭제된 작업은 복구할 수 없으니 주의하세요.
              </p>
            </div>
          </div>
        </div>

        {/* 삭제된 작업 목록 */}
        {deletedTasks.map((task) => {
          const priorityColor = getPriorityColor(task.priority);

          return (
            <div
              key={task.id}
              className="glass-card rounded-xl p-6 border border-border floating-card"
            >
              {/* 작업 정보 */}
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  {task.title}
                </h3>
                {task.description && (
                  <p className="text-sm text-foreground-secondary mb-3">
                    {task.description}
                  </p>
                )}

                {/* 메타 정보 */}
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

                  {/* 일정 */}
                  {task.scheduledDate && (
                    <span className="flex items-center gap-1 text-foreground-secondary">
                      <CalendarIcon className="w-3 h-3" />
                      {formatDate(task.scheduledDate, 'short')}
                    </span>
                  )}

                  {/* 포커스 세션 */}
                  {task._count.FocusSession > 0 && (
                    <span className="flex items-center gap-1 text-foreground-secondary">
                      <Flame className="w-3 h-3 text-warning" />
                      {task._count.FocusSession}회
                    </span>
                  )}

                  {/* 삭제 시간 */}
                  {task.deletedAt && (
                    <span className="text-foreground-tertiary">
                      삭제됨: {formatRelativeTime(task.deletedAt)}
                    </span>
                  )}
                </div>
              </div>

              {/* 액션 버튼 */}
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => handleRestoreClick(task)}
                  disabled={restoreTask.isPending}
                  className="gap-2"
                >
                  <RotateCcw className="w-4 h-4" />
                  복구
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => handlePermanentDeleteClick(task)}
                  disabled={permanentDeleteTask.isPending}
                  className="gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  영구 삭제
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      {/* 확인 다이얼로그 */}
      {confirmDialog.open && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-card rounded-2xl border border-border max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-start gap-4 mb-6">
              <div
                className={cn(
                  'w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0',
                  confirmDialog.type === 'restore'
                    ? 'bg-primary/10'
                    : 'bg-danger/10'
                )}
              >
                {confirmDialog.type === 'restore' ? (
                  <RotateCcw className="w-6 h-6 text-primary" />
                ) : (
                  <Trash2 className="w-6 h-6 text-danger" />
                )}
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-foreground mb-2">
                  {confirmDialog.type === 'restore'
                    ? '작업을 복구하시겠습니까?'
                    : '영구적으로 삭제하시겠습니까?'}
                </h3>
                <p className="text-sm text-foreground-secondary">
                  <span className="font-medium text-foreground">
                    {confirmDialog.taskTitle}
                  </span>
                  {confirmDialog.type === 'restore'
                    ? '을(를) 작업 목록으로 복구합니다.'
                    : '을(를) 완전히 삭제합니다. 이 작업은 되돌릴 수 없습니다.'}
                </p>
              </div>
            </div>

            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCancel}
              >
                취소
              </Button>
              <Button
                variant={confirmDialog.type === 'restore' ? 'default' : 'danger'}
                size="sm"
                onClick={handleConfirm}
                disabled={restoreTask.isPending || permanentDeleteTask.isPending}
              >
                {confirmDialog.type === 'restore' ? '복구' : '영구 삭제'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
