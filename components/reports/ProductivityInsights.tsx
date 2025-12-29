'use client';

import { Lightbulb, Target, CalendarCheck2, BarChart2 } from 'lucide-react';

interface HourlyTotal {
  hour: number;
  minutes: number;
  hours: number;
}

interface Insights {
  bestHour: number;
  bestHourText: string;
  bestDay: number;
  bestDayText: string;
  totalSessions: number;
}

interface ProductivityInsightsProps {
  insights: Insights;
  hourlyTotals: HourlyTotal[];
}

export default function ProductivityInsights({ insights, hourlyTotals }: ProductivityInsightsProps) {
  // 상위 3개 시간대 찾기
  const sortedHours = [...hourlyTotals]
    .sort((a, b) => b.minutes - a.minutes)
    .slice(0, 3)
    .filter((h) => h.minutes > 0);

  // 시간대별 추천
  const getTimeRecommendation = (hour: number) => {
    if (hour >= 6 && hour < 9) return '아침형 인간이시네요!';
    if (hour >= 9 && hour < 12) return '오전 집중력이 좋습니다!';
    if (hour >= 12 && hour < 14) return '점심 시간 활용이 좋아요!';
    if (hour >= 14 && hour < 18) return '오후 집중력이 높습니다!';
    if (hour >= 18 && hour < 22) return '저녁 시간 활용이 좋아요!';
    if (hour >= 22 || hour < 6) return '야행성이시네요!';
    return '';
  };

  return (
    <div className="glass-card rounded-xl shadow-lg border border-border p-6 floating-card">
      <div className="flex items-center gap-2 mb-6">
        <div className="p-2 rounded-lg bg-gradient-to-r from-warning to-danger">
          <Lightbulb className="w-5 h-5 text-white" />
        </div>
        <h2 className="text-lg font-bold gradient-text">생산성 인사이트</h2>
      </div>

      <div className="space-y-4">
        {/* 최고 생산성 시간대 */}
        <div className="bg-gradient-to-r from-info/10 to-primary/10 rounded-xl p-5 border border-info/30 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2.5 rounded-lg bg-info shadow-md">
              <Target className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-xs font-medium text-foreground-tertiary">최고 집중 시간대</p>
              <p className="text-xl font-bold text-info">{insights.bestHourText}</p>
            </div>
          </div>
          <p className="text-sm text-foreground-secondary font-medium">
            {getTimeRecommendation(insights.bestHour)}
          </p>
        </div>

        {/* 최고 생산성 요일 */}
        <div className="bg-gradient-to-r from-success/10 to-emerald-500/10 rounded-xl p-5 border border-success/30 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2.5 rounded-lg bg-success shadow-md">
              <CalendarCheck2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-xs font-medium text-foreground-tertiary">최고 집중 요일</p>
              <p className="text-xl font-bold text-success">{insights.bestDayText}</p>
            </div>
          </div>
          <p className="text-sm text-foreground-secondary font-medium">
            이 요일에 중요한 작업을 배치해보세요!
          </p>
        </div>

        {/* 추천 시간대 */}
        {sortedHours.length > 0 && (
          <div className="bg-gradient-to-r from-violet/10 to-purple/10 rounded-xl p-5 border border-violet/30 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 rounded-lg bg-violet shadow-md">
                <BarChart2 className="w-5 h-5 text-white" />
              </div>
              <p className="text-sm font-bold text-violet">추천 작업 시간</p>
            </div>
            <div className="space-y-2">
              {sortedHours.map((hour, index) => (
                <div key={hour.hour} className="flex items-center justify-between p-2 rounded-lg hover:bg-surface/50 transition-colors">
                  <span className="text-sm font-medium text-foreground-secondary">
                    {index + 1}순위: {hour.hour}시 ~ {hour.hour + 1}시
                  </span>
                  <span className="text-sm text-violet font-bold">
                    {hour.hours.toFixed(1)}h
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 통계 요약 */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-surface rounded-xl p-5 text-center border border-border hover:shadow-md transition-shadow">
            <p className="text-xs font-medium text-foreground-tertiary mb-2">총 집중 세션</p>
            <p className="text-3xl font-bold text-foreground">{insights.totalSessions}</p>
          </div>
          <div className="bg-surface rounded-xl p-5 text-center border border-border hover:shadow-md transition-shadow">
            <p className="text-xs font-medium text-foreground-tertiary mb-2">활성 시간대</p>
            <p className="text-3xl font-bold text-foreground">
              {hourlyTotals.filter((h) => h.minutes > 0).length}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
