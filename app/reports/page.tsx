'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { Button } from '@/components/ui/button';
import { BarChart3, Home, Calendar, LayoutGrid, Settings, LogOut } from 'lucide-react';

// 차트 컴포넌트들은 lazy load (recharts 번들이 크기 때문)
const StatsOverview = dynamic(() => import('@/components/reports/StatsOverview'), {
  loading: () => (
    <div className="animate-pulse bg-surface/50 backdrop-blur-sm rounded-xl h-48 border border-border" />
  ),
});

const GoalProgressChart = dynamic(() => import('@/components/reports/GoalProgressChart'), {
  loading: () => (
    <div className="animate-pulse bg-surface/50 backdrop-blur-sm rounded-xl h-96 border border-border" />
  ),
});

const FocusTimeChart = dynamic(() => import('@/components/reports/FocusTimeChart'), {
  loading: () => (
    <div className="animate-pulse bg-surface/50 backdrop-blur-sm rounded-xl h-96 border border-border" />
  ),
});

const ProductivityHeatmap = dynamic(() => import('@/components/reports/ProductivityHeatmap'), {
  loading: () => (
    <div className="animate-pulse bg-surface/50 backdrop-blur-sm rounded-xl h-96 border border-border" />
  ),
});

const WeeklyProductivity = dynamic(() => import('@/components/reports/WeeklyProductivity'), {
  loading: () => (
    <div className="animate-pulse bg-surface/50 backdrop-blur-sm rounded-xl h-96 border border-border" />
  ),
});

const ProductivityInsights = dynamic(() => import('@/components/reports/ProductivityInsights'), {
  loading: () => (
    <div className="animate-pulse bg-surface/50 backdrop-blur-sm rounded-xl h-48 border border-border" />
  ),
});

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

interface HeatmapData {
  heatmap: Array<{
    day: number;
    hour: number;
    minutes: number;
    hours: number;
  }>;
  dailyTotals: Array<{
    day: number;
    dayName: string;
    minutes: number;
    hours: number;
  }>;
  hourlyTotals: Array<{
    hour: number;
    minutes: number;
    hours: number;
  }>;
  insights: {
    bestHour: number;
    bestHourText: string;
    bestDay: number;
    bestDayText: string;
    totalSessions: number;
  };
}

export default function ReportsPage() {
  const { user, isLoading, isAuthenticated, logout } = useAuth();
  const router = useRouter();
  const [tabType, setTabType] = useState<'report' | 'analysis'>('report');
  const [viewType, setViewType] = useState<'week' | 'month'>('week');
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [heatmapData, setHeatmapData] = useState<HeatmapData | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(true);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  useEffect(() => {
    if (isAuthenticated) {
      if (tabType === 'report') {
        fetchReportData();
      } else {
        fetchHeatmapData();
      }
    }
  }, [isAuthenticated, viewType, tabType]);

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

  const fetchHeatmapData = async () => {
    setIsLoadingData(true);
    try {
      const weeks = viewType === 'week' ? 4 : 12;
      const response = await fetch(`/api/analytics/heatmap?weeks=${weeks}`);
      const result = await response.json();
      if (result.success) {
        setHeatmapData(result.data);
      }
    } catch (error) {
      console.error('Failed to fetch heatmap data:', error);
    } finally {
      setIsLoadingData(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-foreground-secondary">로딩 중...</p>
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
    <div className="min-h-screen bg-gradient-to-br from-background via-surface to-background">
      {/* Header */}
      <header className="glass-card border-b border-border/50 sticky top-0 z-10 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div
            onClick={() => router.push('/dashboard')}
            className="cursor-pointer hover:opacity-80 transition-opacity"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-r from-primary to-violet">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <div className="hidden sm:block">
                <h1 className="text-2xl font-bold gradient-text">리포트</h1>
                <p className="text-sm text-foreground-secondary">생산성 분석 및 통계</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1 sm:gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => router.push('/dashboard')}
              className="gap-2"
            >
              <Home className="w-4 h-4" />
              <span className="hidden sm:inline">대시보드</span>
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => router.push('/calendar')}
              className="gap-2"
            >
              <Calendar className="w-4 h-4" />
              <span className="hidden sm:inline">캘린더</span>
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => router.push('/kanban')}
              className="gap-2"
            >
              <LayoutGrid className="w-4 h-4" />
              <span className="hidden sm:inline">칸반</span>
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => router.push('/settings')}
              className="gap-2"
            >
              <Settings className="w-4 h-4" />
              <span className="hidden sm:inline">설정</span>
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleLogout}
              className="gap-2"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">로그아웃</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tab Selector */}
        <div className="mb-8 flex justify-center gap-4">
          <div className="glass-card inline-flex rounded-xl p-1.5 border border-border shadow-sm">
            <button
              onClick={() => setTabType('report')}
              className={`px-6 py-2.5 rounded-lg text-sm font-semibold transition-all duration-300 ${
                tabType === 'report'
                  ? 'bg-gradient-to-r from-primary to-violet text-white shadow-md'
                  : 'text-foreground-secondary hover:text-foreground hover:bg-surface'
              }`}
            >
              리포트
            </button>
            <button
              onClick={() => setTabType('analysis')}
              className={`px-6 py-2.5 rounded-lg text-sm font-semibold transition-all duration-300 ${
                tabType === 'analysis'
                  ? 'bg-gradient-to-r from-primary to-violet text-white shadow-md'
                  : 'text-foreground-secondary hover:text-foreground hover:bg-surface'
              }`}
            >
              패턴 분석
            </button>
          </div>

          <div className="glass-card inline-flex rounded-xl p-1.5 border border-border shadow-sm">
            <button
              onClick={() => setViewType('week')}
              className={`px-6 py-2.5 rounded-lg text-sm font-semibold transition-all duration-300 ${
                viewType === 'week'
                  ? 'bg-gradient-to-r from-primary to-violet text-white shadow-md'
                  : 'text-foreground-secondary hover:text-foreground hover:bg-surface'
              }`}
            >
              주간
            </button>
            <button
              onClick={() => setViewType('month')}
              className={`px-6 py-2.5 rounded-lg text-sm font-semibold transition-all duration-300 ${
                viewType === 'month'
                  ? 'bg-gradient-to-r from-primary to-violet text-white shadow-md'
                  : 'text-foreground-secondary hover:text-foreground hover:bg-surface'
              }`}
            >
              월간
            </button>
          </div>
        </div>

        {/* Content */}
        {isLoadingData ? (
          <div className="flex justify-center items-center py-20">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-foreground-secondary">데이터 로딩 중...</p>
            </div>
          </div>
        ) : tabType === 'report' && reportData ? (
          <div className="space-y-8">
            {/* Stats Overview */}
            <StatsOverview tasks={reportData.tasks} focus={reportData.focus} />

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <GoalProgressChart goals={reportData.goals} />
              <FocusTimeChart dailyFocus={reportData.focus.dailyFocus} />
            </div>

            {/* Additional Stats - Bento Grid Style */}
            <div className="glass-card rounded-xl shadow-lg border border-border p-6 floating-card">
              <h2 className="text-lg font-bold text-foreground mb-6 gradient-text">작업 상태</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center p-6 bg-warning/10 rounded-xl border border-warning/20 hover:shadow-md transition-shadow">
                  <p className="text-4xl font-bold text-warning mb-2">{reportData.tasks.todo}</p>
                  <p className="text-sm font-medium text-foreground-secondary">할 일</p>
                </div>
                <div className="text-center p-6 bg-info/10 rounded-xl border border-info/20 hover:shadow-md transition-shadow">
                  <p className="text-4xl font-bold text-info mb-2">{reportData.tasks.inProgress}</p>
                  <p className="text-sm font-medium text-foreground-secondary">진행 중</p>
                </div>
                <div className="text-center p-6 bg-success/10 rounded-xl border border-success/20 hover:shadow-md transition-shadow">
                  <p className="text-4xl font-bold text-success mb-2">{reportData.tasks.completed}</p>
                  <p className="text-sm font-medium text-foreground-secondary">완료</p>
                </div>
              </div>
            </div>
          </div>
        ) : tabType === 'analysis' && heatmapData ? (
          <div className="space-y-8">
            {/* Heatmap */}
            <ProductivityHeatmap heatmap={heatmapData.heatmap} />

            {/* Weekly Productivity & Insights */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <WeeklyProductivity dailyTotals={heatmapData.dailyTotals} />
              <ProductivityInsights
                insights={heatmapData.insights}
                hourlyTotals={heatmapData.hourlyTotals}
              />
            </div>
          </div>
        ) : (
          <div className="glass-card rounded-xl shadow-lg border border-border p-6 text-center">
            <p className="text-foreground-secondary">데이터를 불러올 수 없습니다.</p>
          </div>
        )}
      </main>
    </div>
  );
}
