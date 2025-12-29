'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Clock } from 'lucide-react';

interface DailyFocus {
  date: string;
  minutes: number;
  hours: number;
}

interface FocusTimeChartProps {
  dailyFocus: DailyFocus[];
}

export default function FocusTimeChart({ dailyFocus }: FocusTimeChartProps) {
  const chartData = dailyFocus.map((day) => {
    const date = new Date(day.date);
    const dayName = ['일', '월', '화', '수', '목', '금', '토'][date.getDay()];
    const monthDay = `${date.getMonth() + 1}/${date.getDate()}`;

    return {
      date: `${monthDay}(${dayName})`,
      집중시간: day.hours,
    };
  });

  const totalHours = dailyFocus.reduce((sum, day) => sum + day.hours, 0);
  const avgHours = dailyFocus.length > 0 ? totalHours / dailyFocus.length : 0;

  return (
    <div className="glass-card rounded-xl shadow-lg border border-border p-6 floating-card">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-gradient-to-r from-violet to-purple">
            <Clock className="w-5 h-5 text-white" />
          </div>
          <h2 className="text-lg font-bold gradient-text">일별 집중 시간</h2>
        </div>
        <div className="flex gap-4 text-sm">
          <span className="text-foreground-secondary">
            총 <span className="font-bold text-info">{totalHours.toFixed(1)}h</span>
          </span>
          <span className="text-foreground-secondary">
            평균 <span className="font-bold text-success">{avgHours.toFixed(1)}h</span>
          </span>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData}>
          <defs>
            <linearGradient id="focusGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.1}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
          <XAxis
            dataKey="date"
            tick={{ fill: 'hsl(var(--foreground-secondary))', fontSize: 12 }}
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
          <Line
            type="monotone"
            dataKey="집중시간"
            stroke="#8b5cf6"
            strokeWidth={3}
            dot={{ fill: '#8b5cf6', r: 5, strokeWidth: 2, stroke: '#fff' }}
            activeDot={{ r: 7 }}
            fill="url(#focusGradient)"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
