'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface GoalProgress {
  id: string;
  title: string;
  color: string;
  total: number;
  completed: number;
  rate: number;
}

interface GoalProgressChartProps {
  goals: GoalProgress[];
}

export default function GoalProgressChart({ goals }: GoalProgressChartProps) {
  const chartData = goals.map((goal) => ({
    name: goal.title.length > 15 ? goal.title.substring(0, 15) + '...' : goal.title,
    완료: goal.completed,
    미완료: goal.total - goal.completed,
    달성률: Math.round(goal.rate),
  }));

  if (goals.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">목표별 달성률</h2>
        <p className="text-gray-500 text-center py-8">활성 목표가 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">목표별 달성률</h2>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="완료" stackId="a" fill="#10B981" />
          <Bar dataKey="미완료" stackId="a" fill="#D1D5DB" />
        </BarChart>
      </ResponsiveContainer>
      <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-3">
        {goals.map((goal) => (
          <div key={goal.id} className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: goal.color }}
            ></div>
            <span className="text-sm text-gray-700">
              {goal.title}: {Math.round(goal.rate)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
