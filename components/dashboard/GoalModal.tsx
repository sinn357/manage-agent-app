'use client';

import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface Goal {
  id?: string;
  title: string;
  description: string | null;
  targetDate: Date | null;
  color: string;
}

interface GoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  goal?: Goal | null;
}

const PRESET_COLORS = [
  '#3B82F6', // blue
  '#8B5CF6', // purple
  '#EC4899', // pink
  '#EF4444', // red
  '#F59E0B', // amber
  '#10B981', // green
  '#06B6D4', // cyan
  '#6366F1', // indigo
];

export default function GoalModal({ isOpen, onClose, onSuccess, goal }: GoalModalProps) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    targetDate: '',
    color: '#3B82F6',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen && goal) {
      // 수정 모드
      setFormData({
        title: goal.title,
        description: goal.description || '',
        targetDate: goal.targetDate
          ? new Date(goal.targetDate).toISOString().split('T')[0]
          : '',
        color: goal.color,
      });
    } else if (isOpen) {
      // 생성 모드
      setFormData({
        title: '',
        description: '',
        targetDate: '',
        color: '#3B82F6',
      });
    }
    setError('');
  }, [isOpen, goal]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const url = goal?.id ? `/api/goals/${goal.id}` : '/api/goals';
      const method = goal?.id ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description || null,
          targetDate: formData.targetDate || null,
          color: formData.color,
        }),
      });

      const data = await response.json();

      if (data.success) {
        onSuccess();
        onClose();
      } else {
        setError(data.error || 'Failed to save goal');
      }
    } catch (err) {
      console.error('Save goal error:', err);
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!goal?.id) return;
    if (!confirm('정말 이 목표를 삭제하시겠습니까?')) return;

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`/api/goals/${goal.id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        onSuccess();
        onClose();
      } else {
        setError(data.error || 'Failed to delete goal');
      }
    } catch (err) {
      console.error('Delete goal error:', err);
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
            {goal?.id ? '목표 수정' : '새 목표'}
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
              placeholder="예: 토익 900점 달성"
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
              placeholder="목표에 대한 설명 (선택)"
              rows={3}
            />
          </div>

          {/* 목표 날짜 */}
          <div>
            <label htmlFor="targetDate" className="block text-sm font-medium text-gray-700 mb-1">
              목표 날짜
            </label>
            <input
              id="targetDate"
              type="date"
              value={formData.targetDate}
              onChange={(e) => setFormData({ ...formData, targetDate: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* 색상 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">색상</label>
            <div className="grid grid-cols-8 gap-2">
              {PRESET_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setFormData({ ...formData, color })}
                  className={cn(
                    'w-8 h-8 rounded-full transition-transform',
                    formData.color === color ? 'ring-2 ring-offset-2 ring-gray-400 scale-110' : ''
                  )}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>

          {/* 에러 메시지 */}
          {error && (
            <div className="text-red-600 text-sm bg-red-50 py-2 px-3 rounded">{error}</div>
          )}

          {/* 버튼 */}
          <div className="flex gap-2 pt-4">
            {goal?.id && (
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
              className="px-4 py-2 text-sm font-medium text-white bg-blue-500 hover:bg-blue-600 rounded-md disabled:opacity-50 transition-colors"
            >
              {loading ? '저장 중...' : goal?.id ? '수정' : '생성'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
