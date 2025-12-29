'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp } from 'lucide-react';

interface DailyTotal {
  day: number;
  dayName: string;
  minutes: number;
  hours: number;
}

interface WeeklyProductivityProps {
  dailyTotals: DailyTotal[];
}

export default function WeeklyProductivity({ dailyTotals }: WeeklyProductivityProps) {
  // 월요일부터 시작하도록 재정렬
  const reordered = [
    dailyTotals[1], // 월
    dailyTotals[2], // 화
    dailyTotals[3], // 수
    dailyTotals[4], // 목
    dailyTotals[5], // 금
    dailyTotals[6], // 토
    dailyTotals[0], // 일
  ];

  const chartData = reordered.map((item) => ({
    요일: item.dayName,
    집중시간: item.hours,
  }));

  const totalHours = dailyTotals.reduce((sum, item) => sum + item.hours, 0);
  const avgHours = dailyTotals.length > 0 ? totalHours / 7 : 0;

  return (
    <div className="glass-card rounded-xl shadow-lg border border-border p-6 floating-card">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-gradient-to-r from-info to-primary">
            <TrendingUp className="w-5 h-5 text-white" />
          </div>
          <h2 className="text-lg font-bold gradient-text">요일별 생산성</h2>
        </div>
        <div className="text-sm text-foreground-secondary">
          평균 <span className="font-bold text-info">{avgHours.toFixed(1)}h/일</span>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData}>
          <defs>
            <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0ea5e9" stopOpacity={1}/>
              <stop offset="100%" stopColor="#4f46e5" stopOpacity={0.8}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
          <XAxis
            dataKey="요일"
            tick={{ fill: 'hsl(var(--foreground-secondary))' }}
            stroke="hsl(var(--border))"
          />
          <YAxis
            label={{ value: '시간 (h)', angle: -90, position: 'insideLeft', fill: 'hsl(var(--foreground-secondary))' }}
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
          <Bar dataKey="집중시간" fill="url(#barGradient)" radius={[12, 12, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
