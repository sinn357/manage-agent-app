'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Target } from 'lucide-react';

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
      <div className="glass-card rounded-xl shadow-lg border border-border p-6 floating-card">
        <div className="flex items-center gap-2 mb-4">
          <div className="p-2 rounded-lg bg-gradient-to-r from-primary to-violet">
            <Target className="w-5 h-5 text-white" />
          </div>
          <h2 className="text-lg font-bold gradient-text">목표별 달성률</h2>
        </div>
        <p className="text-foreground-secondary text-center py-8">활성 목표가 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="glass-card rounded-xl shadow-lg border border-border p-6 floating-card">
      <div className="flex items-center gap-2 mb-6">
        <div className="p-2 rounded-lg bg-gradient-to-r from-primary to-violet">
          <Target className="w-5 h-5 text-white" />
        </div>
        <h2 className="text-lg font-bold gradient-text">목표별 달성률</h2>
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
          <XAxis
            dataKey="name"
            tick={{ fill: 'hsl(var(--foreground-secondary))' }}
            stroke="hsl(var(--border))"
          />
          <YAxis
            tick={{ fill: 'hsl(var(--foreground-secondary))' }}
            stroke="hsl(var(--border))"
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'hsl(var(--surface))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '12px',
              color: 'hsl(var(--foreground))'
            }}
          />
          <Legend />
          <Bar dataKey="완료" stackId="a" fill="#10B981" radius={[8, 8, 0, 0]} />
          <Bar dataKey="미완료" stackId="a" fill="#CBD5E1" radius={[8, 8, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
      <div className="mt-6 grid grid-cols-2 md:grid-cols-3 gap-3">
        {goals.map((goal) => (
          <div key={goal.id} className="flex items-center gap-2 p-2 rounded-lg hover:bg-surface transition-colors">
            <div
              className="w-3 h-3 rounded-full shadow-sm"
              style={{ backgroundColor: goal.color }}
            ></div>
            <span className="text-sm font-medium text-foreground-secondary">
              {goal.title}: <span className="text-foreground font-semibold">{Math.round(goal.rate)}%</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
