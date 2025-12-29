'use client';

import { CheckCircle2, TrendingUp, Clock, Target } from 'lucide-react';

interface TaskStats {
  total: number;
  completed: number;
  inProgress: number;
  todo: number;
  completionRate: number;
}

interface FocusStats {
  totalMinutes: number;
  totalHours: number;
  sessionsCount: number;
  completedSessions: number;
}

interface StatsOverviewProps {
  tasks: TaskStats;
  focus: FocusStats;
}

export default function StatsOverview({ tasks, focus }: StatsOverviewProps) {
  const stats = [
    {
      label: '완료한 작업',
      value: tasks.completed,
      total: tasks.total,
      color: 'text-success',
      bgColor: 'bg-success/10',
      borderColor: 'border-success/20',
      iconBg: 'bg-success',
      Icon: CheckCircle2,
    },
    {
      label: '작업 달성률',
      value: `${tasks.completionRate}%`,
      total: null,
      color: 'text-info',
      bgColor: 'bg-info/10',
      borderColor: 'border-info/20',
      iconBg: 'bg-info',
      Icon: TrendingUp,
    },
    {
      label: '총 집중 시간',
      value: `${focus.totalHours}h`,
      total: null,
      color: 'text-violet',
      bgColor: 'bg-violet/10',
      borderColor: 'border-violet/20',
      iconBg: 'bg-violet',
      Icon: Clock,
    },
    {
      label: '완료한 세션',
      value: focus.completedSessions,
      total: focus.sessionsCount,
      color: 'text-warning',
      bgColor: 'bg-warning/10',
      borderColor: 'border-warning/20',
      iconBg: 'bg-warning',
      Icon: Target,
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat, index) => {
        const Icon = stat.Icon;
        return (
          <div
            key={index}
            className={`glass-card rounded-xl p-6 border ${stat.borderColor} ${stat.bgColor} floating-card transition-all duration-300`}
          >
            <div className="flex items-start justify-between mb-4">
              <div className={`p-3 rounded-xl ${stat.iconBg} shadow-md`}>
                <Icon className="w-6 h-6 text-white" />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-baseline gap-2">
                <span className={`text-3xl font-bold ${stat.color}`}>{stat.value}</span>
                {stat.total !== null && (
                  <span className="text-sm text-foreground-tertiary font-medium">
                    / {stat.total}
                  </span>
                )}
              </div>
              <p className="text-sm font-semibold text-foreground-secondary">{stat.label}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
