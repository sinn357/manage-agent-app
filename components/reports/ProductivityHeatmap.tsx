'use client';

import { Flame } from 'lucide-react';

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

  // 색상 계산 (0 ~ maxMinutes 범위를 0 ~ 1로 정규화) - 새로운 그라데이션
  const getColor = (minutes: number) => {
    if (minutes === 0) return 'bg-surface border-border';
    const intensity = minutes / maxMinutes;

    if (intensity < 0.2) return 'bg-primary/20 border-primary/30';
    if (intensity < 0.4) return 'bg-primary/40 border-primary/50';
    if (intensity < 0.6) return 'bg-primary/60 border-primary/70';
    if (intensity < 0.8) return 'bg-primary/80 border-primary/90';
    return 'bg-gradient-to-br from-primary to-violet border-primary';
  };

  // 툴팁 텍스트
  const getTooltip = (cell: HeatmapCell) => {
    return `${dayNames[cell.day]} ${cell.hour}시: ${cell.hours}h`;
  };

  return (
    <div className="glass-card rounded-xl shadow-lg border border-border p-6 floating-card">
      <div className="flex items-center gap-2 mb-4">
        <div className="p-2 rounded-lg bg-gradient-to-r from-danger to-warning">
          <Flame className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="text-lg font-bold gradient-text">시간대별 집중력 히트맵</h2>
          <p className="text-sm text-foreground-secondary">
            어느 시간대에 가장 집중을 잘하는지 확인하세요
          </p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <div className="inline-block min-w-full">
          {/* 시간 헤더 */}
          <div className="flex mb-2">
            <div className="w-12"></div>
            {hours.map((hour) => (
              <div
                key={hour}
                className="w-8 h-8 flex items-center justify-center text-xs font-medium text-foreground-tertiary"
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
              <div className="w-12 h-8 flex items-center justify-end pr-2 text-xs text-foreground-secondary font-semibold">
                {dayNames[day]}
              </div>

              {/* 각 시간대 셀 */}
              {hours.map((hour) => {
                const cell = heatmap.find((c) => c.day === day && c.hour === hour);
                return (
                  <div
                    key={`${day}-${hour}`}
                    className={`w-8 h-8 m-0.5 rounded-md border ${
                      cell ? getColor(cell.minutes) : 'bg-surface border-border'
                    } cursor-pointer hover:ring-2 hover:ring-primary transition-all hover:scale-110`}
                    title={cell ? getTooltip(cell) : `${dayNames[day]} ${hour}시: 0h`}
                  ></div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* 범례 */}
      <div className="mt-6 flex items-center justify-center gap-3 text-xs font-medium text-foreground-secondary">
        <span>적음</span>
        <div className="flex gap-1.5">
          <div className="w-5 h-5 bg-surface border border-border rounded-md shadow-sm"></div>
          <div className="w-5 h-5 bg-primary/20 border border-primary/30 rounded-md shadow-sm"></div>
          <div className="w-5 h-5 bg-primary/40 border border-primary/50 rounded-md shadow-sm"></div>
          <div className="w-5 h-5 bg-primary/60 border border-primary/70 rounded-md shadow-sm"></div>
          <div className="w-5 h-5 bg-primary/80 border border-primary/90 rounded-md shadow-sm"></div>
          <div className="w-5 h-5 bg-gradient-to-br from-primary to-violet border border-primary rounded-md shadow-sm"></div>
        </div>
        <span>많음</span>
      </div>
    </div>
  );
}
