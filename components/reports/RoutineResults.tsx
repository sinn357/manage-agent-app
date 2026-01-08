'use client';

interface RoutineStats {
  total: number;
  success: number;
  failed: number;
  successRate: number;
}

interface RoutineResultsProps {
  routine: RoutineStats;
}

export default function RoutineResults({ routine }: RoutineResultsProps) {
  return (
    <div className="glass-card rounded-xl p-6 border border-border floating-card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-foreground">루틴 성공/실패</h3>
        <span className="text-sm text-foreground-secondary">기간 합계</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-success/10 border border-success/20">
          <p className="text-sm text-foreground-secondary mb-1">성공</p>
          <p className="text-2xl font-bold text-success">{routine.success}</p>
        </div>
        <div className="p-4 rounded-xl bg-danger/10 border border-danger/20">
          <p className="text-sm text-foreground-secondary mb-1">실패</p>
          <p className="text-2xl font-bold text-danger">{routine.failed}</p>
        </div>
        <div className="p-4 rounded-xl bg-info/10 border border-info/20">
          <p className="text-sm text-foreground-secondary mb-1">성공률</p>
          <p className="text-2xl font-bold text-info">{routine.successRate}%</p>
        </div>
      </div>
      <p className="text-xs text-foreground-tertiary mt-4">
        총 {routine.total}건 기준
      </p>
    </div>
  );
}
