'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';

interface ProfileSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ProfileSettingsModal({
  isOpen,
  onClose,
  onSuccess,
}: ProfileSettingsModalProps) {
  const [birthDate, setBirthDate] = useState('');
  const [targetLifespan, setTargetLifespan] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fetchLoading, setFetchLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchCurrentProfile();
    }
  }, [isOpen]);

  const fetchCurrentProfile = async () => {
    try {
      setFetchLoading(true);
      const response = await fetch('/api/user/profile');
      const data = await response.json();

      if (data.success && data.user) {
        // birthDate가 있으면 YYYY-MM-DD 형식으로 변환
        if (data.user.birthDate) {
          const date = new Date(data.user.birthDate);
          const formatted = date.toISOString().split('T')[0];
          setBirthDate(formatted);
        }
        if (data.user.targetLifespan) {
          setTargetLifespan(data.user.targetLifespan.toString());
        }
      }
    } catch (err) {
      console.error('Fetch profile error:', err);
    } finally {
      setFetchLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // 입력 검증
    if (!birthDate) {
      setError('생년월일을 입력해주세요');
      return;
    }

    if (!targetLifespan) {
      setError('목표 수명을 입력해주세요');
      return;
    }

    const lifespan = parseInt(targetLifespan);
    if (isNaN(lifespan) || lifespan < 1 || lifespan > 150) {
      setError('목표 수명은 1~150 사이여야 합니다');
      return;
    }

    try {
      setLoading(true);

      const response = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          birthDate,
          targetLifespan: lifespan,
        }),
      });

      const data = await response.json();

      if (data.success) {
        onSuccess();
        onClose();
      } else {
        setError(data.error || '저장에 실패했습니다');
      }
    } catch (err) {
      console.error('Update profile error:', err);
      setError('네트워크 오류가 발생했습니다');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-900">Life Timeline 설정</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            disabled={loading}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
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

        {fetchLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            {/* 생년월일 */}
            <div className="mb-4">
              <label htmlFor="birthDate" className="block text-sm font-medium text-gray-700 mb-2">
                생년월일
              </label>
              <input
                id="birthDate"
                type="date"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                max={new Date().toISOString().split('T')[0]} // 오늘 이후 선택 불가
              />
            </div>

            {/* 목표 수명 */}
            <div className="mb-6">
              <label
                htmlFor="targetLifespan"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                목표 수명 (나이)
              </label>
              <input
                id="targetLifespan"
                type="number"
                min="1"
                max="150"
                value={targetLifespan}
                onChange={(e) => setTargetLifespan(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="예: 80"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                목표하는 수명 나이를 입력하세요 (1-150세)
              </p>
            </div>

            {/* 에러 메시지 */}
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {/* 버튼 */}
            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="flex-1"
                disabled={loading}
              >
                취소
              </Button>
              <Button type="submit" className="flex-1" disabled={loading}>
                {loading ? '저장 중...' : '저장'}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
