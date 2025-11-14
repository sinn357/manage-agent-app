'use client';

interface HeatmapCell {
  day: number;
  hour: number;
  minutes: number;
  hours: number;
}

interface ProductivityHeatmapProps {
  heatmap: HeatmapCell[];
}

export default function ProductivityHeatmap({ heatmap }: ProductivityHeatmapProps) {
  const dayNames = ['일', '월', '화', '수', '목', '금', '토'];
  const hours = Array.from({ length: 24 }, (_, i) => i);

  // 최대값 찾기 (색상 스케일용)
  const maxMinutes = Math.max(...heatmap.map((cell) => cell.minutes));

  // 색상 계산 (0 ~ maxMinutes 범위를 0 ~ 1로 정규화)
  const getColor = (minutes: number) => {
    if (minutes === 0) return 'bg-gray-100';
    const intensity = minutes / maxMinutes;

    if (intensity < 0.2) return 'bg-blue-200';
    if (intensity < 0.4) return 'bg-blue-300';
    if (intensity < 0.6) return 'bg-blue-400';
    if (intensity < 0.8) return 'bg-blue-500';
    return 'bg-blue-600';
  };

  // 툴팁 텍스트
  const getTooltip = (cell: HeatmapCell) => {
    return `${dayNames[cell.day]} ${cell.hour}시: ${cell.hours}h`;
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">시간대별 집중력 히트맵</h2>
      <p className="text-sm text-gray-600 mb-6">
        어느 시간대에 가장 집중을 잘하는지 확인하세요
      </p>

      <div className="overflow-x-auto">
        <div className="inline-block min-w-full">
          {/* 시간 헤더 */}
          <div className="flex mb-1">
            <div className="w-12"></div>
            {hours.map((hour) => (
              <div
                key={hour}
                className="w-8 h-8 flex items-center justify-center text-xs text-gray-600"
                title={`${hour}시`}
              >
                {hour % 3 === 0 ? hour : ''}
              </div>
            ))}
          </div>

          {/* 히트맵 그리드 */}
          {Array.from({ length: 7 }, (_, day) => (
            <div key={day} className="flex mb-1">
              {/* 요일 레이블 */}
              <div className="w-12 h-8 flex items-center justify-end pr-2 text-xs text-gray-600 font-medium">
                {dayNames[day]}
              </div>

              {/* 각 시간대 셀 */}
              {hours.map((hour) => {
                const cell = heatmap.find((c) => c.day === day && c.hour === hour);
                return (
                  <div
                    key={`${day}-${hour}`}
                    className={`w-8 h-8 m-0.5 rounded ${
                      cell ? getColor(cell.minutes) : 'bg-gray-100'
                    } cursor-pointer hover:ring-2 hover:ring-blue-400 transition-all`}
                    title={cell ? getTooltip(cell) : `${dayNames[day]} ${hour}시: 0h`}
                  ></div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* 범례 */}
      <div className="mt-6 flex items-center justify-center gap-2 text-xs text-gray-600">
        <span>적음</span>
        <div className="flex gap-1">
          <div className="w-4 h-4 bg-gray-100 rounded"></div>
          <div className="w-4 h-4 bg-blue-200 rounded"></div>
          <div className="w-4 h-4 bg-blue-300 rounded"></div>
          <div className="w-4 h-4 bg-blue-400 rounded"></div>
          <div className="w-4 h-4 bg-blue-500 rounded"></div>
          <div className="w-4 h-4 bg-blue-600 rounded"></div>
        </div>
        <span>많음</span>
      </div>
    </div>
  );
}
