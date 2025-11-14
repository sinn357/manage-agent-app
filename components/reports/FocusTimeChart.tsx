'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

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
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-gray-900">일별 집중 시간</h2>
        <div className="flex gap-4 text-sm">
          <span className="text-gray-600">
            총 <span className="font-semibold text-blue-600">{totalHours.toFixed(1)}h</span>
          </span>
          <span className="text-gray-600">
            평균 <span className="font-semibold text-green-600">{avgHours.toFixed(1)}h</span>
          </span>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis label={{ value: '시간 (h)', angle: -90, position: 'insideLeft' }} />
          <Tooltip />
          <Legend />
          <Line
            type="monotone"
            dataKey="집중시간"
            stroke="#3B82F6"
            strokeWidth={2}
            dot={{ fill: '#3B82F6', r: 4 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
