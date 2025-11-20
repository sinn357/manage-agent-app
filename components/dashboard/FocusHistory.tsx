'use client';

import { useState, useEffect } from 'react';
import { formatDuration, formatRelativeTime } from '@/lib/utils';

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
      <div className="bg-white/90 backdrop-blur-lg rounded-lg shadow-xl border border-white/20 p-4">
        <h2 className="text-base font-semibold text-gray-900 mb-3">포커스 히스토리</h2>
        <div className="space-y-2">
          {[1, 2].map((i) => (
            <div key={i} className="animate-pulse flex gap-2">
              <div className="flex-1">
                <div className="h-3 bg-gray-200 rounded w-3/4 mb-1"></div>
                <div className="h-2 bg-gray-100 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white/90 backdrop-blur-lg rounded-lg shadow-xl border border-white/20 p-4">
        <h2 className="text-base font-semibold text-gray-900 mb-3">포커스 히스토리</h2>
        <p className="text-red-600 text-xs">{error}</p>
      </div>
    );
  }

  const displaySessions = expanded ? sessions : sessions.slice(0, 2);
  const hasMore = sessions.length > 2;

  return (
    <div className="bg-white/90 backdrop-blur-lg rounded-lg shadow-xl border border-white/20 p-4">
      <div className="mb-3">
        <h2 className="text-base font-semibold text-gray-900 mb-2">포커스 히스토리</h2>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="bg-gray-50 rounded px-2 py-1">
            <span className="text-gray-600">세션:</span>{' '}
            <span className="font-medium text-gray-900">{stats.total}</span>
          </div>
          <div className="bg-gray-50 rounded px-2 py-1">
            <span className="text-gray-600">완료:</span>{' '}
            <span className="font-medium text-green-600">{stats.completed}</span>
          </div>
        </div>
      </div>

      {sessions.length === 0 ? (
        <div className="text-center py-4">
          <p className="text-gray-500 text-xs">아직 세션이 없습니다</p>
        </div>
      ) : (
        <>
          <div className="space-y-2">
            {displaySessions.map((session) => (
              <div
                key={session.id}
                className="flex items-start justify-between p-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors group"
              >
                <div className="flex-1 min-w-0">
                  {session.task ? (
                    <div className="font-medium text-gray-900 text-xs truncate">
                      {session.task.title}
                    </div>
                  ) : (
                    <div className="font-medium text-gray-500 text-xs">일반 포커스</div>
                  )}
                  <div className="flex items-center gap-1 mt-0.5 text-xs text-gray-500">
                    <span className="text-[10px]">{formatRelativeTime(session.createdAt)}</span>
                    <span>•</span>
                    <span className="text-[10px]">
                      {formatDuration(session.actualTime)} / {formatDuration(session.duration)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1 flex-shrink-0 ml-2">
                  {session.completed && (
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-green-100 text-green-800">
                      완료
                    </span>
                  )}
                  {session.interrupted && (
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-yellow-100 text-yellow-800">
                      중단
                    </span>
                  )}
                  <button
                    onClick={() => handleDelete(session.id)}
                    className="opacity-0 group-hover:opacity-100 p-0.5 text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-all"
                    title="삭제"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* 더보기 버튼 */}
          {hasMore && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="w-full mt-2 py-1.5 text-xs text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded transition-colors"
            >
              {expanded ? '접기 ▲' : `더보기 (${sessions.length - 2}개) ▼`}
            </button>
          )}
        </>
      )}
    </div>
  );
}
