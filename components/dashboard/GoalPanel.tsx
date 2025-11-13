'use client';

import { useState, useEffect } from 'react';
import { calculateDDay, cn } from '@/lib/utils';

interface Goal {
  id: string;
  title: string;
  description: string | null;
  targetDate: Date | null;
  status: string;
  color: string;
  progress: number;
  stats: {
    totalTasks: number;
    completedTasks: number;
    totalMilestones: number;
    completedMilestones: number;
  };
}

interface GoalPanelProps {
  onGoalClick?: (goal: Goal) => void;
  onAddClick?: () => void;
}

export default function GoalPanel({ onGoalClick, onAddClick }: GoalPanelProps) {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchGoals();
  }, []);

  const fetchGoals = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/goals');
      const data = await response.json();

      if (data.success) {
        setGoals(data.goals);
      } else {
        setError(data.error || 'Failed to fetch goals');
      }
    } catch (err) {
      console.error('Fetch goals error:', err);
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">목표</h2>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-2 bg-gray-100 rounded w-full"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">목표</h2>
        <p className="text-red-600 text-sm">{error}</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-gray-900">목표</h2>
        <button
          onClick={onAddClick}
          className="text-sm text-blue-600 hover:text-blue-700 font-medium"
        >
          + 추가
        </button>
      </div>

      {goals.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500 text-sm mb-3">아직 목표가 없습니다</p>
          <button
            onClick={onAddClick}
            className="text-blue-600 hover:text-blue-700 text-sm font-medium"
          >
            첫 목표를 추가해보세요
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {goals.map((goal) => {
            const dday = goal.targetDate ? calculateDDay(goal.targetDate) : null;

            return (
              <div
                key={goal.id}
                onClick={() => onGoalClick?.(goal)}
                className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors cursor-pointer"
                style={{ borderLeftWidth: '4px', borderLeftColor: goal.color }}
              >
                {/* 제목 & D-day */}
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-medium text-gray-900 flex-1">{goal.title}</h3>
                  {dday && (
                    <span
                      className={cn(
                        'text-xs font-semibold px-2 py-1 rounded',
                        dday.isOverdue
                          ? 'bg-red-100 text-red-700'
                          : dday.daysLeft <= 7
                          ? 'bg-orange-100 text-orange-700'
                          : 'bg-blue-100 text-blue-700'
                      )}
                    >
                      {dday.display}
                    </span>
                  )}
                </div>

                {/* 진행률 */}
                <div className="mb-2">
                  <div className="flex justify-between items-center text-xs text-gray-600 mb-1">
                    <span>진행률</span>
                    <span className="font-semibold">{goal.progress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="h-2 rounded-full transition-all duration-300"
                      style={{
                        width: `${goal.progress}%`,
                        backgroundColor: goal.color,
                      }}
                    ></div>
                  </div>
                </div>

                {/* 통계 */}
                <div className="flex gap-3 text-xs text-gray-500">
                  {goal.stats.totalTasks > 0 && (
                    <span>
                      작업 {goal.stats.completedTasks}/{goal.stats.totalTasks}
                    </span>
                  )}
                  {goal.stats.totalMilestones > 0 && (
                    <span>
                      마일스톤 {goal.stats.completedMilestones}/{goal.stats.totalMilestones}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
