'use client';

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
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      icon: '✓',
    },
    {
      label: '작업 달성률',
      value: `${tasks.completionRate}%`,
      total: null,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      icon: '📊',
    },
    {
      label: '총 집중 시간',
      value: `${focus.totalHours}h`,
      total: null,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      icon: '⏱️',
    },
    {
      label: '완료한 세션',
      value: focus.completedSessions,
      total: focus.sessionsCount,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      icon: '🎯',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {stats.map((stat, index) => (
        <div key={index} className={`${stat.bgColor} rounded-lg p-5 shadow`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-2xl">{stat.icon}</span>
            <span className={`text-2xl font-bold ${stat.color}`}>
              {stat.value}
              {stat.total !== null && (
                <span className="text-sm text-gray-500 font-normal ml-1">
                  / {stat.total}
                </span>
              )}
            </span>
          </div>
          <p className="text-sm text-gray-700 font-medium">{stat.label}</p>
        </div>
      ))}
    </div>
  );
}
