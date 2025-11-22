'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { formatLifeTimeRemaining, formatSimpleDate } from '@/lib/lifeCalculations';
import type { LifeStats } from '@/lib/lifeCalculations';

interface LifeGoal {
  id: string;
  title: string;
  description: string | null;
  category: string;
  icon: string;
  color: string;
  progress: number;
  stats: {
    totalGoals: number;
    activeGoals: number;
  };
}

interface LifeTimelineProps {
  onSettingsClick: () => void;
  onLifeGoalClick?: (lifeGoal: LifeGoal) => void;
  onAddLifeGoalClick?: () => void;
}

export default function LifeTimeline({ onSettingsClick, onLifeGoalClick, onAddLifeGoalClick }: LifeTimelineProps) {
  const [lifeStats, setLifeStats] = useState<LifeStats | null>(null);
  const [lifeGoals, setLifeGoals] = useState<LifeGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [lifeGoalsLoading, setLifeGoalsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchLifeStats();
    fetchLifeGoals();
  }, []);

  const fetchLifeStats = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/user/profile');
      const data = await response.json();

      if (data.success) {
        setLifeStats(data.lifeStats);
      } else {
        setError(data.error || 'Failed to fetch life stats');
      }
    } catch (err) {
      console.error('Fetch life stats error:', err);
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  const fetchLifeGoals = async () => {
    try {
      setLifeGoalsLoading(true);
      const response = await fetch('/api/life-goals');
      const data = await response.json();

      if (data.success) {
        setLifeGoals(data.lifeGoals);
      } else {
        console.error('Failed to fetch life goals:', data.error);
      }
    } catch (err) {
      console.error('Fetch life goals error:', err);
    } finally {
      setLifeGoalsLoading(false);
    }
  };

  // 외부에서 새로고침할 수 있도록 expose
  // (프로필 설정 팝업에서 저장 후 호출)
  const refresh = () => {
    fetchLifeStats();
  };

  if (loading) {
    return (
      <div className="bg-white/90 backdrop-blur-lg rounded-lg shadow-xl border border-white/20 p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-900">🧬 Life Timeline</h2>
        </div>
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-full mb-2"></div>
          <div className="h-4 bg-gray-100 rounded w-3/4"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white/90 backdrop-blur-lg rounded-lg shadow-xl border border-white/20 p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-900">🧬 Life Timeline</h2>
        </div>
        <p className="text-red-600 text-sm">{error}</p>
      </div>
    );
  }

  // LifeStats가 없는 경우 (아직 설정하지 않음)
  if (!lifeStats) {
    return (
      <div className="bg-white/90 backdrop-blur-lg rounded-lg shadow-xl border border-white/20 p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-900">🧬 Life Timeline</h2>
          <button
            onClick={onSettingsClick}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            title="설정"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>
        <div className="text-center py-8">
          <p className="text-gray-500 text-sm mb-4">아직 Life Timeline을 설정하지 않았습니다</p>
          <Button onClick={onSettingsClick} size="sm">
            설정하기
          </Button>
        </div>
      </div>
    );
  }

  // LifeStats가 있는 경우
  const progressPercent = Math.min(100, Math.max(0, lifeStats.percentage));

  return (
    <div className="bg-white/90 backdrop-blur-lg rounded-lg shadow-xl border border-white/20 p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-gray-900">🧬 Life Timeline</h2>
        <button
          onClick={onSettingsClick}
          className="text-gray-400 hover:text-gray-600 transition-colors"
          title="설정"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      </div>

      {/* 게이지바 */}
      <div className="mb-3">
        <div className="flex justify-between items-baseline mb-2">
          <div className="text-2xl font-bold text-gray-900">
            {lifeStats.currentAge}세 / {lifeStats.targetAge}세
          </div>
          <div className="text-sm font-medium text-violet-600">
            {progressPercent.toFixed(1)}%
          </div>
        </div>
        <div className="w-full h-4 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-blue-500 via-violet-500 to-purple-500 transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        {/* 날짜 표시 */}
        {lifeStats.birthDate && lifeStats.targetDeathDate && (
          <div className="flex justify-between items-center mt-2 text-xs text-gray-500">
            <span title="생년월일">
              🎂 {formatSimpleDate(lifeStats.birthDate)}
            </span>
            <span title="현재">
              📍 {formatSimpleDate(new Date())}
            </span>
            <span title="목표 수명">
              🏁 {formatSimpleDate(lifeStats.targetDeathDate)}
            </span>
          </div>
        )}
      </div>

      {/* 남은 일수 */}
      <div className="grid grid-cols-2 gap-3 text-sm mb-6">
        <div className="bg-blue-50 rounded-lg p-3">
          <div className="text-gray-600 text-xs mb-1">남은 일수</div>
          <div className="text-blue-700 font-semibold">
            {lifeStats.daysLeft.toLocaleString()}일
          </div>
        </div>
        <div className="bg-violet-50 rounded-lg p-3">
          <div className="text-gray-600 text-xs mb-1">남은 시간</div>
          <div className="text-violet-700 font-semibold">
            {formatLifeTimeRemaining(lifeStats)}
          </div>
        </div>
      </div>

      {/* 인생목표 섹션 */}
      <div>
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-sm font-semibold text-gray-900">🌟 나의 인생목표</h3>
          {onAddLifeGoalClick && (
            <button
              onClick={onAddLifeGoalClick}
              className="text-xs text-violet-600 hover:text-violet-700 font-medium"
            >
              + 추가
            </button>
          )}
        </div>

        {lifeGoalsLoading ? (
          <div className="space-y-2">
            {[1, 2].map((i) => (
              <div key={i} className="animate-pulse bg-gray-100 rounded-lg h-16"></div>
            ))}
          </div>
        ) : lifeGoals.length === 0 ? (
          <div className="text-center py-6">
            <p className="text-gray-500 text-xs mb-2">아직 인생목표가 없습니다</p>
            {onAddLifeGoalClick && (
              <Button
                onClick={onAddLifeGoalClick}
                variant="ghost"
                size="sm"
                className="text-violet-600 hover:text-violet-700"
              >
                첫 인생목표를 추가해보세요
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {lifeGoals.map((lifeGoal) => (
              <div
                key={lifeGoal.id}
                onClick={() => onLifeGoalClick?.(lifeGoal)}
                className="bg-white border border-gray-200 rounded-lg p-3 hover:border-gray-300 transition-colors cursor-pointer"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{lifeGoal.icon}</span>
                    <span className="text-sm font-medium text-gray-900">
                      {lifeGoal.title}
                    </span>
                  </div>
                  <span className="text-xs font-semibold text-gray-600">
                    {lifeGoal.progress}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                  <div
                    className="h-2 rounded-full transition-all duration-300"
                    style={{
                      width: `${lifeGoal.progress}%`,
                      backgroundColor: lifeGoal.color,
                    }}
                  ></div>
                </div>
                <div className="text-xs text-gray-500">
                  {lifeGoal.stats.activeGoals}개 목표
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// refresh 함수를 외부에서 호출할 수 있도록 export
export type LifeTimelineRef = {
  refresh: () => void;
};
