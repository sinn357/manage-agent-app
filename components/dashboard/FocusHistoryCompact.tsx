'use client';

import { useState, useEffect } from 'react';
import { formatDuration } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { History, ArrowRight, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import FocusHistoryDetailModal from './FocusHistoryDetailModal';

interface FocusSession {
  id: string;
  duration: number;
  actualTime: number;
  completed: boolean;
  interrupted: boolean;
  createdAt: Date;
  task: {
    id: string;
    title: string;
  } | null;
}

interface FocusHistoryCompactProps {
  refreshKey?: number;
}

export default function FocusHistoryCompact({ refreshKey = 0 }: FocusHistoryCompactProps) {
  const [sessions, setSessions] = useState<FocusSession[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    completed: 0,
    interrupted: 0,
    totalMinutes: 0,
  });
  const [todayStats, setTodayStats] = useState({
    sessions: 0,
    minutes: 0,
    completed: 0,
  });
  const [loading, setLoading] = useState(true);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  useEffect(() => {
    fetchSessions();
  }, [refreshKey]);

  const fetchSessions = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/focus-sessions?limit=10');
      const data = await response.json();

      if (data.success) {
        setSessions(data.sessions);
        setStats(data.stats);

        // 오늘 통계 계산
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todaySessions = data.sessions.filter((s: FocusSession) => {
          const sessionDate = new Date(s.createdAt);
          sessionDate.setHours(0, 0, 0, 0);
          return sessionDate.getTime() === today.getTime();
        });

        setTodayStats({
          sessions: todaySessions.length,
          minutes: todaySessions.reduce((sum: number, s: FocusSession) => sum + s.actualTime, 0),
          completed: todaySessions.filter((s: FocusSession) => s.completed).length,
        });
      }
    } catch (err) {
      console.error('Fetch sessions error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="glass-card rounded-xl p-4 border border-border">
        <div className="animate-pulse">
          <div className="flex items-center justify-between mb-3">
            <div className="h-5 bg-surface rounded w-20"></div>
            <div className="h-6 w-6 bg-surface rounded"></div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="h-12 bg-surface rounded"></div>
            <div className="h-12 bg-surface rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="glass-card rounded-xl p-4 border border-border hover:border-primary/30 transition-colors">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-primary" />
            <span className="font-semibold text-foreground text-sm">히스토리</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsDetailOpen(true)}
            className="h-7 w-7 p-0 hover:bg-primary/10"
          >
            <ArrowRight className="w-4 h-4 text-primary" />
          </Button>
        </div>

        {/* 오늘 요약 */}
        <div className="space-y-2">
          <div className="text-xs text-foreground-secondary mb-2">오늘</div>
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-surface rounded-lg px-3 py-2">
              <div className="flex items-center gap-1.5 text-foreground-secondary mb-0.5">
                <Clock className="w-3 h-3" />
                <span className="text-[10px]">집중 시간</span>
              </div>
              <div className="text-sm font-bold text-primary">
                {formatDuration(todayStats.minutes)}
              </div>
            </div>
            <div className="bg-surface rounded-lg px-3 py-2">
              <div className="flex items-center gap-1.5 text-foreground-secondary mb-0.5">
                <CheckCircle2 className="w-3 h-3" />
                <span className="text-[10px]">완료</span>
              </div>
              <div className="text-sm font-bold text-success">
                {todayStats.completed}회
              </div>
            </div>
          </div>

          {/* 전체 요약 */}
          <div className="flex items-center justify-between text-xs text-foreground-tertiary pt-2 border-t border-border">
            <span>전체 {stats.total}회</span>
            <span>•</span>
            <span>{formatDuration(stats.totalMinutes)}</span>
            <span>•</span>
            <span className="text-success">{stats.completed} 완료</span>
          </div>
        </div>

        {/* 세션 없을 때 */}
        {stats.total === 0 && (
          <div className="text-center py-2 mt-2">
            <p className="text-xs text-foreground-tertiary">아직 세션이 없습니다</p>
          </div>
        )}
      </div>

      <FocusHistoryDetailModal
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        sessions={sessions}
        stats={stats}
        onRefresh={fetchSessions}
      />
    </>
  );
}
