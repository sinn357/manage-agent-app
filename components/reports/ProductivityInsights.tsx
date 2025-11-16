'use client';

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
    if (hour >= 6 && hour < 9) return '아침형 인간이시네요! 🌅';
    if (hour >= 9 && hour < 12) return '오전 집중력이 좋습니다! ☕';
    if (hour >= 12 && hour < 14) return '점심 시간 활용이 좋아요! 🍱';
    if (hour >= 14 && hour < 18) return '오후 집중력이 높습니다! 💪';
    if (hour >= 18 && hour < 22) return '저녁 시간 활용이 좋아요! 🌆';
    if (hour >= 22 || hour < 6) return '야행성이시네요! 🌙';
    return '';
  };

  return (
    <div className="bg-white/90 backdrop-blur-lg rounded-lg shadow-xl border border-white/20 p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">생산성 인사이트</h2>

      <div className="space-y-6">
        {/* 최고 생산성 시간대 */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-200">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-3xl">🎯</span>
            <div>
              <p className="text-sm text-gray-600">최고 집중 시간대</p>
              <p className="text-2xl font-bold text-blue-500">{insights.bestHourText}</p>
            </div>
          </div>
          <p className="text-sm text-gray-700 mt-2">
            {getTimeRecommendation(insights.bestHour)}
          </p>
        </div>

        {/* 최고 생산성 요일 */}
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-4 border border-green-200">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-3xl">📅</span>
            <div>
              <p className="text-sm text-gray-600">최고 집중 요일</p>
              <p className="text-2xl font-bold text-green-600">{insights.bestDayText}</p>
            </div>
          </div>
          <p className="text-sm text-gray-700 mt-2">
            이 요일에 중요한 작업을 배치해보세요!
          </p>
        </div>

        {/* 추천 시간대 */}
        {sortedHours.length > 0 && (
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-4 border border-purple-200">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-3xl">💡</span>
              <div>
                <p className="text-sm text-gray-600">추천 작업 시간</p>
              </div>
            </div>
            <div className="space-y-2">
              {sortedHours.map((hour, index) => (
                <div key={hour.hour} className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">
                    {index + 1}순위: {hour.hour}시 ~ {hour.hour + 1}시
                  </span>
                  <span className="text-sm text-purple-600 font-semibold">
                    {hour.hours.toFixed(1)}h
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 통계 요약 */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-50 rounded-lg p-4 text-center">
            <p className="text-sm text-gray-600 mb-1">총 집중 세션</p>
            <p className="text-2xl font-bold text-gray-900">{insights.totalSessions}</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-4 text-center">
            <p className="text-sm text-gray-600 mb-1">활성 시간대</p>
            <p className="text-2xl font-bold text-gray-900">
              {hourlyTotals.filter((h) => h.minutes > 0).length}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
