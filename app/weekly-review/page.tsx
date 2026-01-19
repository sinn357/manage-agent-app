'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import {
  CalendarDays,
  Home,
  Calendar,
  LayoutGrid,
  Settings,
  LogOut,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  Save,
  CheckCircle2,
  Clock,
  Target,
  Smile,
  Meh,
  Frown,
  Trophy,
  AlertCircle,
  Lightbulb,
  ArrowRight,
} from 'lucide-react';
import { toast } from 'sonner';

interface GoalProgress {
  id: string;
  title: string;
  color: string;
  total: number;
  completed: number;
  rate: number;
}

interface TaskItem {
  id: string;
  title: string;
  status?: string;
  completedAt?: string;
  goalTitle: string | null;
  goalColor: string | null;
}

interface DailyCompletion {
  date: string;
  count: number;
}

interface WeeklyStats {
  completedTasks: number;
  totalTasks: number;
  completionRate: number;
  focusMinutes: number;
  focusHours: number;
  goalProgress: GoalProgress[];
  incompleteTasks: TaskItem[];
  completedTasksList: TaskItem[];
  dailyCompletion: DailyCompletion[];
}

interface WeeklyReviewData {
  id?: string;
  wins: string[];
  challenges: string[];
  insights: string;
  nextWeekPlan: string[];
  mood: number | null;
}

interface ApiResponse {
  weekStart: string;
  weekEnd: string;
  review: WeeklyReviewData | null;
  stats: WeeklyStats;
}

const DAYS_KR = ['월', '화', '수', '목', '금', '토', '일'];

export default function WeeklyReviewPage() {
  const { user, isLoading, isAuthenticated, logout } = useAuth();
  const router = useRouter();

  const [currentWeekStart, setCurrentWeekStart] = useState<Date | null>(null);
  const [data, setData] = useState<ApiResponse | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // 편집 상태
  const [wins, setWins] = useState<string[]>(['']);
  const [challenges, setChallenges] = useState<string[]>(['']);
  const [insights, setInsights] = useState('');
  const [nextWeekPlan, setNextWeekPlan] = useState<string[]>(['']);
  const [mood, setMood] = useState<number | null>(null);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  const fetchWeeklyReview = useCallback(async (weekStart?: Date) => {
    setIsLoadingData(true);
    try {
      const params = weekStart ? `?week=${weekStart.toISOString()}` : '';
      const response = await fetch(`/api/weekly-reviews${params}`);
      const result = await response.json();

      if (result.success) {
        setData(result.data);
        setCurrentWeekStart(new Date(result.data.weekStart));

        // 기존 리뷰 데이터가 있으면 로드
        if (result.data.review) {
          setWins(result.data.review.wins?.length > 0 ? result.data.review.wins : ['']);
          setChallenges(
            result.data.review.challenges?.length > 0 ? result.data.review.challenges : ['']
          );
          setInsights(result.data.review.insights || '');
          setNextWeekPlan(
            result.data.review.nextWeekPlan?.length > 0 ? result.data.review.nextWeekPlan : ['']
          );
          setMood(result.data.review.mood);
        } else {
          // 새 리뷰 초기화
          setWins(['']);
          setChallenges(['']);
          setInsights('');
          setNextWeekPlan(['']);
          setMood(null);
        }
      }
    } catch (error) {
      console.error('Failed to fetch weekly review:', error);
      toast.error('주간 리뷰를 불러오는데 실패했습니다.');
    } finally {
      setIsLoadingData(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      fetchWeeklyReview();
    }
  }, [isAuthenticated, fetchWeeklyReview]);

  const navigateWeek = (direction: 'prev' | 'next') => {
    if (!currentWeekStart) return;
    const newWeekStart = new Date(currentWeekStart);
    newWeekStart.setDate(newWeekStart.getDate() + (direction === 'prev' ? -7 : 7));
    fetchWeeklyReview(newWeekStart);
  };

  const handleSave = async () => {
    if (!currentWeekStart) return;

    setIsSaving(true);
    try {
      const response = await fetch('/api/weekly-reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          weekStart: currentWeekStart.toISOString(),
          wins: wins.filter((w) => w.trim()),
          challenges: challenges.filter((c) => c.trim()),
          insights,
          nextWeekPlan: nextWeekPlan.filter((p) => p.trim()),
          mood,
        }),
      });

      const result = await response.json();
      if (result.success) {
        toast.success('주간 리뷰가 저장되었습니다.');
      } else {
        toast.error('저장에 실패했습니다.');
      }
    } catch (error) {
      console.error('Failed to save weekly review:', error);
      toast.error('저장 중 오류가 발생했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  // 배열 항목 관리 헬퍼
  const addItem = (setter: React.Dispatch<React.SetStateAction<string[]>>) => {
    setter((prev) => [...prev, '']);
  };

  const updateItem = (
    setter: React.Dispatch<React.SetStateAction<string[]>>,
    index: number,
    value: string
  ) => {
    setter((prev) => prev.map((item, i) => (i === index ? value : item)));
  };

  const removeItem = (setter: React.Dispatch<React.SetStateAction<string[]>>, index: number) => {
    setter((prev) => (prev.length > 1 ? prev.filter((_, i) => i !== index) : prev));
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

  if (!user) return null;

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  const formatWeekRange = () => {
    if (!data) return '';
    const start = new Date(data.weekStart);
    const end = new Date(data.weekEnd);
    const startMonth = start.getMonth() + 1;
    const endMonth = end.getMonth() + 1;

    if (startMonth === endMonth) {
      return `${startMonth}월 ${start.getDate()}일 - ${end.getDate()}일`;
    }
    return `${startMonth}월 ${start.getDate()}일 - ${endMonth}월 ${end.getDate()}일`;
  };

  const isCurrentWeek = () => {
    if (!currentWeekStart) return false;
    const now = new Date();
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1);
    const thisWeekStart = new Date(now.setDate(diff));
    thisWeekStart.setHours(0, 0, 0, 0);

    return currentWeekStart.getTime() === thisWeekStart.getTime();
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
              <div className="p-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500">
                <CalendarDays className="w-6 h-6 text-white" />
              </div>
              <div className="hidden sm:block">
                <h1 className="text-2xl font-bold gradient-text">주간 리뷰</h1>
                <p className="text-sm text-foreground-secondary">이번 주 돌아보기</p>
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
              onClick={() => router.push('/reports')}
              className="gap-2"
            >
              <BarChart3 className="w-4 h-4" />
              <span className="hidden sm:inline">리포트</span>
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
            <Button variant="secondary" size="sm" onClick={handleLogout} className="gap-2">
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">로그아웃</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Week Navigation */}
        <div className="flex items-center justify-center gap-4 mb-8">
          <Button variant="secondary" size="sm" onClick={() => navigateWeek('prev')}>
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <div className="text-center">
            <h2 className="text-xl font-bold text-foreground">{formatWeekRange()}</h2>
            {isCurrentWeek() && (
              <span className="text-sm text-primary font-medium">이번 주</span>
            )}
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => navigateWeek('next')}
            disabled={isCurrentWeek()}
          >
            <ChevronRight className="w-5 h-5" />
          </Button>
        </div>

        {isLoadingData ? (
          <div className="flex justify-center items-center py-20">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-foreground-secondary">데이터 로딩 중...</p>
            </div>
          </div>
        ) : data ? (
          <div className="space-y-8">
            {/* Stats Overview */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="glass-card rounded-xl p-4 border border-border">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-success/10">
                    <CheckCircle2 className="w-5 h-5 text-success" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">
                      {data.stats.completedTasks}/{data.stats.totalTasks}
                    </p>
                    <p className="text-sm text-foreground-secondary">완료 작업</p>
                  </div>
                </div>
              </div>
              <div className="glass-card rounded-xl p-4 border border-border">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Target className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">
                      {data.stats.completionRate}%
                    </p>
                    <p className="text-sm text-foreground-secondary">달성률</p>
                  </div>
                </div>
              </div>
              <div className="glass-card rounded-xl p-4 border border-border">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-violet/10">
                    <Clock className="w-5 h-5 text-violet" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{data.stats.focusHours}h</p>
                    <p className="text-sm text-foreground-secondary">집중 시간</p>
                  </div>
                </div>
              </div>
              <div className="glass-card rounded-xl p-4 border border-border">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-warning/10">
                    <Target className="w-5 h-5 text-warning" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">
                      {data.stats.goalProgress.length}
                    </p>
                    <p className="text-sm text-foreground-secondary">진행 목표</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Daily Completion Chart */}
            <div className="glass-card rounded-xl p-6 border border-border">
              <h3 className="text-lg font-semibold text-foreground mb-4">일별 작업 완료</h3>
              <div className="flex items-end justify-between gap-2 h-32">
                {data.stats.dailyCompletion.map((day, i) => {
                  const maxCount = Math.max(...data.stats.dailyCompletion.map((d) => d.count), 1);
                  const height = (day.count / maxCount) * 100;
                  return (
                    <div key={day.date} className="flex-1 flex flex-col items-center gap-2">
                      <div className="w-full flex flex-col items-center justify-end h-24">
                        <span className="text-xs text-foreground-secondary mb-1">{day.count}</span>
                        <div
                          className="w-full max-w-[40px] bg-gradient-to-t from-primary to-violet rounded-t-md transition-all duration-300"
                          style={{ height: `${Math.max(height, 4)}%` }}
                        />
                      </div>
                      <span className="text-xs text-foreground-secondary">{DAYS_KR[i]}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Goal Progress */}
            {data.stats.goalProgress.length > 0 && (
              <div className="glass-card rounded-xl p-6 border border-border">
                <h3 className="text-lg font-semibold text-foreground mb-4">목표별 진척도</h3>
                <div className="space-y-4">
                  {data.stats.goalProgress.map((goal) => (
                    <div key={goal.id}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-foreground">{goal.title}</span>
                        <span className="text-sm text-foreground-secondary">
                          {goal.completed}/{goal.total} ({goal.rate}%)
                        </span>
                      </div>
                      <div className="h-2 bg-surface rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-300"
                          style={{ width: `${goal.rate}%`, backgroundColor: goal.color }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Mood Selection */}
            <div className="glass-card rounded-xl p-6 border border-border">
              <h3 className="text-lg font-semibold text-foreground mb-4">이번 주 기분은 어땠나요?</h3>
              <div className="flex items-center justify-center gap-4">
                {[1, 2, 3, 4, 5].map((value) => {
                  const Icon = value <= 2 ? Frown : value <= 3 ? Meh : Smile;
                  const colors =
                    value <= 2
                      ? 'text-error'
                      : value <= 3
                        ? 'text-warning'
                        : 'text-success';
                  return (
                    <button
                      key={value}
                      onClick={() => setMood(value)}
                      className={`p-3 rounded-xl border-2 transition-all ${
                        mood === value
                          ? 'border-primary bg-primary/10'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <Icon className={`w-8 h-8 ${colors}`} />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Reflection Sections */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Wins */}
              <div className="glass-card rounded-xl p-6 border border-border">
                <div className="flex items-center gap-2 mb-4">
                  <Trophy className="w-5 h-5 text-warning" />
                  <h3 className="text-lg font-semibold text-foreground">이번 주 잘한 점</h3>
                </div>
                <div className="space-y-2">
                  {wins.map((win, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={win}
                        onChange={(e) => updateItem(setWins, i, e.target.value)}
                        placeholder="잘한 점을 적어주세요..."
                        className="flex-1 px-3 py-2 bg-surface border border-border rounded-lg text-foreground placeholder:text-foreground-secondary focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                      {wins.length > 1 && (
                        <button
                          onClick={() => removeItem(setWins, i)}
                          className="p-2 text-foreground-secondary hover:text-error"
                        >
                          &times;
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    onClick={() => addItem(setWins)}
                    className="text-sm text-primary hover:underline"
                  >
                    + 항목 추가
                  </button>
                </div>
              </div>

              {/* Challenges */}
              <div className="glass-card rounded-xl p-6 border border-border">
                <div className="flex items-center gap-2 mb-4">
                  <AlertCircle className="w-5 h-5 text-error" />
                  <h3 className="text-lg font-semibold text-foreground">어려웠던 점</h3>
                </div>
                <div className="space-y-2">
                  {challenges.map((challenge, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={challenge}
                        onChange={(e) => updateItem(setChallenges, i, e.target.value)}
                        placeholder="어려웠던 점을 적어주세요..."
                        className="flex-1 px-3 py-2 bg-surface border border-border rounded-lg text-foreground placeholder:text-foreground-secondary focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                      {challenges.length > 1 && (
                        <button
                          onClick={() => removeItem(setChallenges, i)}
                          className="p-2 text-foreground-secondary hover:text-error"
                        >
                          &times;
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    onClick={() => addItem(setChallenges)}
                    className="text-sm text-primary hover:underline"
                  >
                    + 항목 추가
                  </button>
                </div>
              </div>
            </div>

            {/* Insights */}
            <div className="glass-card rounded-xl p-6 border border-border">
              <div className="flex items-center gap-2 mb-4">
                <Lightbulb className="w-5 h-5 text-warning" />
                <h3 className="text-lg font-semibold text-foreground">인사이트 & 교훈</h3>
              </div>
              <textarea
                value={insights}
                onChange={(e) => setInsights(e.target.value)}
                placeholder="이번 주에서 배운 점이나 깨달은 것을 적어주세요..."
                rows={3}
                className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-foreground placeholder:text-foreground-secondary focus:outline-none focus:ring-2 focus:ring-primary resize-none"
              />
            </div>

            {/* Next Week Plan */}
            <div className="glass-card rounded-xl p-6 border border-border">
              <div className="flex items-center gap-2 mb-4">
                <ArrowRight className="w-5 h-5 text-primary" />
                <h3 className="text-lg font-semibold text-foreground">다음 주 계획</h3>
              </div>
              <div className="space-y-2">
                {nextWeekPlan.map((plan, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={plan}
                      onChange={(e) => updateItem(setNextWeekPlan, i, e.target.value)}
                      placeholder="다음 주에 할 일을 적어주세요..."
                      className="flex-1 px-3 py-2 bg-surface border border-border rounded-lg text-foreground placeholder:text-foreground-secondary focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    {nextWeekPlan.length > 1 && (
                      <button
                        onClick={() => removeItem(setNextWeekPlan, i)}
                        className="p-2 text-foreground-secondary hover:text-error"
                      >
                        &times;
                      </button>
                    )}
                  </div>
                ))}
                <button
                  onClick={() => addItem(setNextWeekPlan)}
                  className="text-sm text-primary hover:underline"
                >
                  + 항목 추가
                </button>
              </div>
            </div>

            {/* Incomplete Tasks */}
            {data.stats.incompleteTasks.length > 0 && (
              <div className="glass-card rounded-xl p-6 border border-border">
                <h3 className="text-lg font-semibold text-foreground mb-4">
                  미완료 작업 ({data.stats.incompleteTasks.length}개)
                </h3>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {data.stats.incompleteTasks.map((task) => (
                    <div
                      key={task.id}
                      className="flex items-center gap-2 p-2 bg-surface rounded-lg"
                    >
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: task.goalColor || '#6B7280' }}
                      />
                      <span className="text-sm text-foreground">{task.title}</span>
                      {task.goalTitle && (
                        <span className="text-xs text-foreground-secondary ml-auto">
                          {task.goalTitle}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Save Button */}
            <div className="flex justify-center">
              <Button
                onClick={handleSave}
                disabled={isSaving}
                className="gap-2 px-8 py-3 bg-gradient-to-r from-primary to-violet hover:opacity-90"
              >
                <Save className="w-5 h-5" />
                {isSaving ? '저장 중...' : '주간 리뷰 저장'}
              </Button>
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
