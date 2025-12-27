'use client';

import { useState, useEffect } from 'react';
import { formatDuration, formatRelativeTime, cn } from '@/lib/utils';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { History, Trash2, ChevronDown, ChevronUp } from 'lucide-react';

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

interface FocusHistoryProps {
  refreshKey?: number;
}

export default function FocusHistory({ refreshKey = 0 }: FocusHistoryProps) {
  const [sessions, setSessions] = useState<FocusSession[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    completed: 0,
    interrupted: 0,
    totalMinutes: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);

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
      } else {
        setError(data.error || 'Failed to fetch sessions');
      }
    } catch (err) {
      console.error('Fetch sessions error:', err);
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (sessionId: string) => {
    if (!confirm('이 세션을 삭제하시겠습니까?')) return;

    try {
      const response = await fetch(`/api/focus-sessions?id=${sessionId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        fetchSessions(); // 목록 새로고침
      } else {
        alert(data.error || '삭제 실패');
      }
    } catch (err) {
      console.error('Delete session error:', err);
      alert('삭제 중 오류가 발생했습니다');
    }
  };

  if (loading) {
    return (
      <Card variant="glass">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="w-5 h-5 text-primary" />
            포커스 히스토리
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="animate-pulse space-y-2">
                <div className="h-4 bg-surface rounded-lg w-3/4"></div>
                <div className="h-3 bg-surface rounded-lg w-1/2"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card variant="glass">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="w-5 h-5 text-primary" />
            포커스 히스토리
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-danger text-sm">{error}</p>
        </CardContent>
      </Card>
    );
  }

  const displaySessions = expanded ? sessions : sessions.slice(0, 2);
  const hasMore = sessions.length > 2;

  return (
    <Card variant="glass">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2">
          <History className="w-5 h-5 text-primary" />
          포커스 히스토리
        </CardTitle>
        <div className="grid grid-cols-2 gap-3 mt-4">
          <div className="bg-surface rounded-xl px-4 py-3">
            <div className="text-xs text-foreground-secondary mb-1">세션</div>
            <div className="text-lg font-bold text-foreground">{stats.total}</div>
          </div>
          <div className="bg-surface rounded-xl px-4 py-3">
            <div className="text-xs text-foreground-secondary mb-1">완료</div>
            <div className="text-lg font-bold text-success">{stats.completed}</div>
          </div>
        </div>
      </CardHeader>

      <CardContent>

      {sessions.length === 0 ? (
        <div className="text-center py-8">
          <div className="w-16 h-16 rounded-full bg-surface flex items-center justify-center mx-auto mb-4">
            <History className="w-8 h-8 text-foreground-tertiary" />
          </div>
          <p className="text-foreground-secondary text-sm">아직 세션이 없습니다</p>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {displaySessions.map((session) => (
              <div
                key={session.id}
                className="flex items-start justify-between p-4 rounded-xl border border-border hover:bg-surface transition-all group hover:shadow-sm"
              >
                <div className="flex-1 min-w-0">
                  {session.task ? (
                    <div className="font-semibold text-foreground text-sm truncate mb-1">
                      {session.task.title}
                    </div>
                  ) : (
                    <div className="font-semibold text-foreground-secondary text-sm mb-1">일반 포커스</div>
                  )}
                  <div className="flex items-center gap-2 text-xs text-foreground-tertiary">
                    <span>{formatRelativeTime(session.createdAt)}</span>
                    <span>•</span>
                    <span>
                      {formatDuration(session.actualTime)} / {formatDuration(session.duration)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                  {session.completed && (
                    <span className="inline-flex items-center px-3 py-1 rounded-lg text-xs font-semibold bg-success/10 text-success">
                      완료
                    </span>
                  )}
                  {session.interrupted && (
                    <span className="inline-flex items-center px-3 py-1 rounded-lg text-xs font-semibold bg-warning/10 text-warning">
                      중단
                    </span>
                  )}
                  <button
                    onClick={() => handleDelete(session.id)}
                    className="opacity-0 group-hover:opacity-100 p-2 text-danger hover:bg-danger/10 rounded-lg transition-all"
                    title="삭제"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* 더보기 버튼 */}
          {hasMore && (
            <Button
              onClick={() => setExpanded(!expanded)}
              variant="ghost"
              size="sm"
              className="w-full mt-3 gap-1.5"
            >
              {expanded ? (
                <>
                  접기 <ChevronUp className="w-4 h-4" />
                </>
              ) : (
                <>
                  더보기 ({sessions.length - 2}개) <ChevronDown className="w-4 h-4" />
                </>
              )}
            </Button>
          )}
        </>
      )}
      </CardContent>
    </Card>
  );
}
