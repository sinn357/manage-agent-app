'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import StatsOverview from '@/components/reports/StatsOverview';
import GoalProgressChart from '@/components/reports/GoalProgressChart';
import FocusTimeChart from '@/components/reports/FocusTimeChart';

interface ReportData {
  period: {
    type: string;
    startDate: string;
    endDate: string;
  };
  tasks: {
    total: number;
    completed: number;
    inProgress: number;
    todo: number;
    completionRate: number;
  };
  goals: Array<{
    id: string;
    title: string;
    color: string;
    total: number;
    completed: number;
    rate: number;
  }>;
  focus: {
    totalMinutes: number;
    totalHours: number;
    sessionsCount: number;
    completedSessions: number;
    dailyFocus: Array<{
      date: string;
      minutes: number;
      hours: number;
    }>;
  };
}

export default function ReportsPage() {
  const { user, isLoading, isAuthenticated, logout } = useAuth();
  const router = useRouter();
  const [viewType, setViewType] = useState<'week' | 'month'>('week');
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(true);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchReportData();
    }
  }, [isAuthenticated, viewType]);

  const fetchReportData = async () => {
    setIsLoadingData(true);
    try {
      const response = await fetch(`/api/reports?type=${viewType}`);
      const result = await response.json();
      if (result.success) {
        setReportData(result.data);
      }
    } catch (error) {
      console.error('Failed to fetch report data:', error);
    } finally {
      setIsLoadingData(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">로딩 중...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">리포트</h1>
            <p className="text-sm text-gray-600">생산성 분석 및 통계</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/dashboard')}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
            >
              🏠 대시보드
            </button>
            <button
              onClick={() => router.push('/calendar')}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
            >
              📅 캘린더
            </button>
            <button
              onClick={() => router.push('/kanban')}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
            >
              📋 칸반
            </button>
            <button
              onClick={() => router.push('/settings')}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
            >
              ⚙️ 설정
            </button>
            <button
              onClick={handleLogout}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
            >
              로그아웃
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* View Type Selector */}
        <div className="mb-6 flex justify-center">
          <div className="inline-flex rounded-lg border border-gray-300 bg-white p-1">
            <button
              onClick={() => setViewType('week')}
              className={`px-6 py-2 rounded-md text-sm font-medium transition-colors ${
                viewType === 'week'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-700 hover:text-gray-900'
              }`}
            >
              주간 리포트
            </button>
            <button
              onClick={() => setViewType('month')}
              className={`px-6 py-2 rounded-md text-sm font-medium transition-colors ${
                viewType === 'month'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-700 hover:text-gray-900'
              }`}
            >
              월간 리포트
            </button>
          </div>
        </div>

        {/* Report Content */}
        {isLoadingData ? (
          <div className="flex justify-center items-center py-20">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">리포트 로딩 중...</p>
            </div>
          </div>
        ) : reportData ? (
          <div className="space-y-6">
            {/* Stats Overview */}
            <StatsOverview tasks={reportData.tasks} focus={reportData.focus} />

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <GoalProgressChart goals={reportData.goals} />
              <FocusTimeChart dailyFocus={reportData.focus.dailyFocus} />
            </div>

            {/* Additional Stats */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">작업 상태</h2>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <p className="text-3xl font-bold text-yellow-600">{reportData.tasks.todo}</p>
                  <p className="text-sm text-gray-600 mt-1">할 일</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-blue-600">{reportData.tasks.inProgress}</p>
                  <p className="text-sm text-gray-600 mt-1">진행 중</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-green-600">{reportData.tasks.completed}</p>
                  <p className="text-sm text-gray-600 mt-1">완료</p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <p className="text-gray-600">데이터를 불러올 수 없습니다.</p>
          </div>
        )}
      </main>
    </div>
  );
}
