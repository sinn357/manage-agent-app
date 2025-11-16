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
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">포커스 히스토리</h2>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse flex gap-3">
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-100 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white/90 backdrop-blur-lg rounded-lg shadow-xl border border-white/20 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">포커스 히스토리</h2>
        <p className="text-red-600 text-sm">{error}</p>
      </div>
    );
  }

  return (
    <div className="bg-white/90 backdrop-blur-lg rounded-lg shadow-xl border border-white/20 p-6">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-gray-900">포커스 히스토리</h2>
        <div className="flex gap-4 mt-2 text-sm">
          <div>
            <span className="text-gray-600">총 세션:</span>{' '}
            <span className="font-medium text-gray-900">{stats.total}</span>
          </div>
          <div>
            <span className="text-gray-600">완료:</span>{' '}
            <span className="font-medium text-green-600">{stats.completed}</span>
          </div>
          <div>
            <span className="text-gray-600">중단:</span>{' '}
            <span className="font-medium text-yellow-600">{stats.interrupted}</span>
          </div>
          <div>
            <span className="text-gray-600">총 시간:</span>{' '}
            <span className="font-medium text-violet-500">{formatDuration(stats.totalMinutes)}</span>
          </div>
        </div>
      </div>

      {sessions.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500 text-sm">아직 포커스 세션이 없습니다</p>
          <p className="text-gray-400 text-xs mt-1">타이머를 시작해보세요!</p>
        </div>
      ) : (
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {sessions.map((session) => (
            <div
              key={session.id}
              className="flex items-start justify-between p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors group"
            >
              <div className="flex-1 min-w-0">
                {session.task ? (
                  <div className="font-medium text-gray-900 text-sm truncate">
                    {session.task.title}
                  </div>
                ) : (
                  <div className="font-medium text-gray-500 text-sm">일반 포커스</div>
                )}
                <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                  <span>{formatRelativeTime(session.createdAt)}</span>
                  <span>•</span>
                  <span>
                    {formatDuration(session.actualTime)} / {formatDuration(session.duration)}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                {session.completed && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    완료
                  </span>
                )}
                {session.interrupted && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                    중단
                  </span>
                )}
                {!session.completed && !session.interrupted && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                    진행중
                  </span>
                )}
                <button
                  onClick={() => handleDelete(session.id)}
                  className="opacity-0 group-hover:opacity-100 p-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-all"
                  title="삭제"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
