'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

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
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-gray-900">요일별 생산성</h2>
        <div className="text-sm text-gray-600">
          평균 <span className="font-semibold text-blue-500">{avgHours.toFixed(1)}h/일</span>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="요일" />
          <YAxis label={{ value: '시간 (h)', angle: -90, position: 'insideLeft' }} />
          <Tooltip />
          <Legend />
          <Bar dataKey="집중시간" fill="#3B82F6" radius={[8, 8, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
