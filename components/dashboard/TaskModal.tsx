'use client';

import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface Task {
  id?: string;
  title: string;
  description: string | null;
  scheduledDate: Date | null;
  priority: string;
  status: string;
  goalId: string | null;
}

interface Goal {
  id: string;
  title: string;
  color: string;
}

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  task?: Task | null;
  goals?: Goal[];
  initialDate?: Date | null;
}

export default function TaskModal({ isOpen, onClose, onSuccess, task, goals: externalGoals, initialDate }: TaskModalProps) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    scheduledDate: '',
    priority: 'mid',
    goalId: '',
  });
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      // 외부에서 goals를 전달하지 않은 경우만 fetch
      if (!externalGoals) {
        fetchGoals();
      } else {
        setGoals(externalGoals);
      }

      if (task) {
        // 수정 모드
        setFormData({
          title: task.title,
          description: task.description || '',
          scheduledDate: task.scheduledDate
            ? new Date(task.scheduledDate).toISOString().split('T')[0]
            : '',
          priority: task.priority,
          goalId: task.goalId || '',
        });
      } else {
        // 생성 모드 - initialDate 또는 오늘 날짜 기본값
        const dateValue = initialDate
          ? new Date(initialDate).toISOString().split('T')[0]
          : new Date().toISOString().split('T')[0];
        setFormData({
          title: '',
          description: '',
          scheduledDate: dateValue,
          priority: 'mid',
          goalId: '',
        });
      }
    }
    setError('');
  }, [isOpen, task, initialDate, externalGoals]);

  const fetchGoals = async () => {
    try {
      const response = await fetch('/api/goals?status=active');
      const data = await response.json();

      if (data.success) {
        setGoals(data.goals);
      }
    } catch (err) {
      console.error('Fetch goals error:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const url = task?.id ? `/api/tasks/${task.id}` : '/api/tasks';
      const method = task?.id ? 'PATCH' : 'POST';

      console.log('Submitting task:', {
        title: formData.title,
        scheduledDate: formData.scheduledDate,
        priority: formData.priority,
        goalId: formData.goalId,
      });

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description || null,
          scheduledDate: formData.scheduledDate || null,
          priority: formData.priority,
          goalId: formData.goalId || null,
        }),
      });

      const data = await response.json();
      console.log('Task response:', data);

      if (data.success) {
        console.log('Task created successfully, calling onSuccess');
        onSuccess();
        onClose();
      } else {
        setError(data.error || 'Failed to save task');
      }
    } catch (err) {
      console.error('Save task error:', err);
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!task?.id) return;
    if (!confirm('정말 이 작업을 삭제하시겠습니까?')) return;

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`/api/tasks/${task.id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        onSuccess();
        onClose();
      } else {
        setError(data.error || 'Failed to delete task');
      }
    } catch (err) {
      console.error('Delete task error:', err);
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            {task?.id ? '작업 수정' : '새 작업'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* 제목 */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
              제목 *
            </label>
            <input
              id="title"
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="예: 영어 단어 30개 외우기"
            />
          </div>

          {/* 설명 */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              설명
            </label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="작업에 대한 추가 설명 (선택)"
              rows={3}
            />
          </div>

          {/* 날짜 & 우선순위 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="scheduledDate" className="block text-sm font-medium text-gray-700 mb-1">
                날짜
              </label>
              <input
                id="scheduledDate"
                type="date"
                value={formData.scheduledDate}
                onChange={(e) => setFormData({ ...formData, scheduledDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-1">
                우선순위
              </label>
              <select
                id="priority"
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="high">높음</option>
                <option value="mid">보통</option>
                <option value="low">낮음</option>
              </select>
            </div>
          </div>

          {/* 목표 선택 */}
          <div>
            <label htmlFor="goalId" className="block text-sm font-medium text-gray-700 mb-1">
              목표
            </label>
            <select
              id="goalId"
              value={formData.goalId}
              onChange={(e) => setFormData({ ...formData, goalId: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">목표 없음 (일회성 작업)</option>
              {goals.map((goal) => (
                <option key={goal.id} value={goal.id}>
                  {goal.title}
                </option>
              ))}
            </select>
          </div>

          {/* 에러 메시지 */}
          {error && (
            <div className="text-red-600 text-sm bg-red-50 py-2 px-3 rounded">{error}</div>
          )}

          {/* 버튼 */}
          <div className="flex gap-2 pt-4">
            {task?.id && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={loading}
                className="px-4 py-2 text-sm font-medium text-red-600 hover:text-red-700 disabled:opacity-50"
              >
                삭제
              </button>
            )}
            <div className="flex-1" />
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 disabled:opacity-50"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md disabled:opacity-50 transition-colors"
            >
              {loading ? '저장 중...' : task?.id ? '수정' : '생성'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
