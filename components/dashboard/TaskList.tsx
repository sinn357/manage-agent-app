'use client';

import { useState, useEffect } from 'react';
import { getPriorityColor, getPriorityLabel, formatDate, cn } from '@/lib/utils';

interface Task {
  id: string;
  title: string;
  description: string | null;
  scheduledDate: Date | null;
  priority: string;
  status: string;
  goalId: string | null;
  Goal: {
    id: string;
    title: string;
    color: string;
  } | null;
  _count: {
    FocusSession: number;
  };
}

interface TaskListProps {
  onTaskClick?: (task: Task) => void;
  onAddClick?: () => void;
}

export default function TaskList({ onTaskClick, onAddClick }: TaskListProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({ total: 0, completed: 0, inProgress: 0, todo: 0 });

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      console.log('TaskList: Fetching tasks...');
      setLoading(true);
      const response = await fetch('/api/tasks/today?includeUnscheduled=true');
      const data = await response.json();
      console.log('TaskList: Received tasks:', data);

      if (data.success) {
        console.log('TaskList: Setting', data.tasks.length, 'tasks');
        setTasks(data.tasks);
        setStats(data.stats);
      } else {
        setError(data.error || 'Failed to fetch tasks');
      }
    } catch (err) {
      console.error('Fetch tasks error:', err);
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleComplete = async (taskId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // 부모 클릭 이벤트 방지

    try {
      const response = await fetch(`/api/tasks/${taskId}/complete`, {
        method: 'PATCH',
      });

      const data = await response.json();

      if (data.success) {
        // 전체 목록 리프레시
        fetchTasks();
      }
    } catch (err) {
      console.error('Toggle complete error:', err);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">오늘 할 일</h2>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse flex gap-3">
              <div className="h-5 w-5 bg-gray-200 rounded"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-100 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">오늘 할 일</h2>
        <p className="text-red-600 text-sm">{error}</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">오늘 할 일</h2>
          <p className="text-sm text-gray-500">
            {stats.completed}/{stats.total} 완료
          </p>
        </div>
        <button
          onClick={onAddClick}
          className="text-sm text-violet-500 hover:text-violet-600 font-medium"
        >
          + 추가
        </button>
      </div>

      {tasks.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500 text-sm mb-3">오늘 할 일이 없습니다</p>
          <button
            onClick={onAddClick}
            className="text-violet-500 hover:text-violet-600 text-sm font-medium"
          >
            첫 작업을 추가해보세요
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {tasks.map((task) => {
            const priorityColor = getPriorityColor(task.priority);
            const isCompleted = task.status === 'completed';

            return (
              <div
                key={task.id}
                onClick={() => onTaskClick?.(task)}
                className={cn(
                  'flex items-start gap-3 p-3 rounded-lg border transition-colors cursor-pointer',
                  isCompleted
                    ? 'bg-gray-50 border-gray-200'
                    : 'bg-white border-gray-200 hover:border-gray-300'
                )}
              >
                {/* 체크박스 */}
                <button
                  onClick={(e) => handleToggleComplete(task.id, e)}
                  className={cn(
                    'flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors',
                    isCompleted
                      ? 'bg-blue-500 border-blue-500'
                      : 'border-gray-300 hover:border-blue-500'
                  )}
                >
                  {isCompleted && (
                    <svg
                      className="w-3 h-3 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={3}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  )}
                </button>

                {/* 내용 */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3
                      className={cn(
                        'font-medium text-gray-900',
                        isCompleted && 'line-through text-gray-500'
                      )}
                    >
                      {task.title}
                    </h3>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    {/* 우선순위 */}
                    <span
                      className={cn(
                        'px-2 py-0.5 rounded border',
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
                        className="px-2 py-0.5 rounded text-white"
                        style={{ backgroundColor: task.Goal.color }}
                      >
                        {task.Goal.title}
                      </span>
                    )}

                    {/* 날짜 */}
                    {task.scheduledDate && (
                      <span className="text-gray-500">
                        {formatDate(task.scheduledDate, 'short')}
                      </span>
                    )}

                    {/* 포커스 세션 */}
                    {task._count.FocusSession > 0 && (
                      <span className="text-gray-500">
                        🔥 {task._count.FocusSession}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
