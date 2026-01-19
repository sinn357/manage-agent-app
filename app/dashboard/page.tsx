'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useCallback, useRef } from 'react';
import { useTheme } from 'next-themes';
import dynamic from 'next/dynamic';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useKeyboardShortcuts } from '@/lib/hooks/useKeyboardShortcuts';
import { useQueryClient } from '@tanstack/react-query';
import TaskList from '@/components/dashboard/TaskList';
import FocusTimer from '@/components/dashboard/FocusTimer';
import FocusHistory from '@/components/dashboard/FocusHistory';
import ProfileSettingsModal from '@/components/dashboard/ProfileSettingsModal';
import TodayRoutines from '@/components/dashboard/TodayRoutines';
import LifeTimelineCompact from '@/components/dashboard/LifeTimelineCompact';
import LifeGoalsCompact from '@/components/dashboard/LifeGoalsCompact';
import GoalPanelCompact from '@/components/dashboard/GoalPanelCompact';
import { BarChart3, Calendar, CalendarDays, Kanban, Settings, LogOut, Sparkles, Search } from 'lucide-react';
import {
  scheduleMultipleTaskNotifications,
  restoreSchedule,
  setupVisibilityListener,
  cancelAllTaskNotifications,
} from '@/lib/taskNotificationScheduler';

// 모달 컴포넌트는 필요할 때만 로드
const GoalModal = dynamic(() => import('@/components/dashboard/GoalModal'), {
  ssr: false,
});

const TaskModal = dynamic(() => import('@/components/dashboard/TaskModal'), {
  ssr: false,
});

const LifeGoalModal = dynamic(() => import('@/components/dashboard/LifeGoalModal'), {
  ssr: false,
});

const SearchModal = dynamic(() => import('@/components/search/SearchModal'), {
  ssr: false,
});

interface Goal {
  id: string;
  title: string;
  description: string | null;
  targetDate: Date | null;
  color: string;
  progress: number;
  stats: {
    totalTasks: number;
    completedTasks: number;
    totalMilestones: number;
    completedMilestones: number;
  };
}

interface Task {
  id: string;
  title: string;
  description: string | null;
  scheduledDate: Date | null;
  priority: string;
  status: string;
  goalId: string | null;
  Goal: {
    id: string;
    title: string;
    color: string;
  } | null;
}

export default function DashboardPage() {
  const { user, isLoading, isAuthenticated, logout } = useAuth();
  const router = useRouter();
  const { setTheme, theme } = useTheme();
  const queryClient = useQueryClient();

  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  const [goalKey, setGoalKey] = useState(0);

  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [taskKey, setTaskKey] = useState(0);

  const [todayTasks, setTodayTasks] = useState<Task[]>([]);
  const [focusHistoryKey, setFocusHistoryKey] = useState(0);
  const [focusTaskTrigger, setFocusTaskTrigger] = useState<{ task: Task; minutes: number | 'custom' } | null>(null);
  const focusTimerRef = useRef<HTMLDivElement>(null);

  const [isProfileSettingsOpen, setIsProfileSettingsOpen] = useState(false);
  const [lifeTimelineKey, setLifeTimelineKey] = useState(0);

  const [isLifeGoalModalOpen, setIsLifeGoalModalOpen] = useState(false);
  const [selectedLifeGoal, setSelectedLifeGoal] = useState<any>(null);

  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);

  // 키보드 단축키 설정
  useKeyboardShortcuts([
    {
      key: 'k',
      ctrl: true,
      description: '검색',
      handler: () => {
        setIsSearchModalOpen(true);
      },
    },
    {
      key: 'n',
      ctrl: true,
      description: '새 작업 추가',
      handler: () => {
        setSelectedTask(null);
        setIsTaskModalOpen(true);
      },
    },
    {
      key: 'n',
      ctrl: true,
      shift: true,
      description: '새 목표 추가',
      handler: () => {
        setSelectedGoal(null);
        setIsGoalModalOpen(true);
      },
    },
    {
      key: 'd',
      ctrl: true,
      description: '다크 모드 전환',
      handler: () => {
        setTheme(theme === 'dark' ? 'light' : 'dark');
      },
    },
  ]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchTodayTasks();
    }
  }, [isAuthenticated, taskKey]);

  // 작업 시작 알림 스케줄러 초기화
  useEffect(() => {
    if (todayTasks.length > 0) {
      console.log('[Dashboard] Setting up task notifications for', todayTasks.length, 'tasks');
      scheduleMultipleTaskNotifications(todayTasks);

      // Page Visibility Listener 설정
      const cleanup = setupVisibilityListener(todayTasks);

      return () => {
        cleanup();
      };
    }
  }, [todayTasks]);

  // 컴포넌트 언마운트 시 모든 알림 취소
  useEffect(() => {
    return () => {
      cancelAllTaskNotifications();
    };
  }, []);

  const fetchTodayTasks = async () => {
    try {
      const response = await fetch('/api/tasks/today?includeUnscheduled=true');
      const data = await response.json();
      if (data.success) {
        // 완료되지 않은 작업만 필터링
        const incompleteTasks = data.tasks.filter(
          (task: Task) => task.status !== 'completed'
        );
        setTodayTasks(incompleteTasks);
      }
    } catch (error) {
      console.error('Failed to fetch today tasks:', error);
    }
  };

  // 모든 hook을 early return 이전에 호출
  const handleLogout = useCallback(async () => {
    await logout();
    router.push('/login');
  }, [logout, router]);

  const handleAddGoal = useCallback(() => {
    setSelectedGoal(null);
    setIsGoalModalOpen(true);
  }, []);

  const handleGoalClick = useCallback((goal: Goal) => {
    setSelectedGoal(goal);
    setIsGoalModalOpen(true);
  }, []);

  const handleGoalModalClose = useCallback(() => {
    setIsGoalModalOpen(false);
    setSelectedGoal(null);
  }, []);

  const handleGoalSuccess = useCallback(() => {
    // React Query 캐시 무효화
    queryClient.invalidateQueries({ queryKey: ['goals'] });
    queryClient.invalidateQueries({ queryKey: ['tasks'] });

    // GoalPanel을 리프레시하기 위해 key를 변경
    setGoalKey((prev) => prev + 1);
    // Task 목록도 리프레시 (목표 진행률 업데이트 때문에)
    setTaskKey((prev) => prev + 1);
  }, [queryClient]);

  const handleAddTask = useCallback(() => {
    setSelectedTask(null);
    setIsTaskModalOpen(true);
  }, []);

  const handleTaskClick = useCallback((task: Task) => {
    setSelectedTask(task);
    setIsTaskModalOpen(true);
  }, []);

  const handleTaskModalClose = useCallback(() => {
    setIsTaskModalOpen(false);
    setSelectedTask(null);
  }, []);

  const handleTaskSuccess = useCallback(() => {
    // React Query 캐시 무효화
    queryClient.invalidateQueries({ queryKey: ['tasks'] });
    queryClient.invalidateQueries({ queryKey: ['goals'] });

    // TaskList를 리프레시하기 위해 key를 변경
    setTaskKey((prev) => prev + 1);
    // 목표 진행률도 업데이트되므로 GoalPanel도 리프레시
    setGoalKey((prev) => prev + 1);
  }, [queryClient]);

  const handleStartFocus = useCallback((task: Task, minutes: number | 'custom') => {
    // 포커스 타이머에 작업 및 시간 전달
    setFocusTaskTrigger({ task, minutes });

    // 포커스 타이머로 스크롤
    setTimeout(() => {
      focusTimerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
  }, []);

  const handleProfileSettingsOpen = useCallback(() => {
    setIsProfileSettingsOpen(true);
  }, []);

  const handleProfileSettingsClose = useCallback(() => {
    setIsProfileSettingsOpen(false);
  }, []);

  const handleProfileSettingsSuccess = useCallback(() => {
    // LifeTimeline 리프레시
    setLifeTimelineKey((prev) => prev + 1);
  }, []);

  const handleAddLifeGoal = useCallback(() => {
    setSelectedLifeGoal(null);
    setIsLifeGoalModalOpen(true);
  }, []);

  const handleLifeGoalClick = useCallback((lifeGoal: any) => {
    setSelectedLifeGoal(lifeGoal);
    setIsLifeGoalModalOpen(true);
  }, []);

  const handleLifeGoalModalClose = useCallback(() => {
    setIsLifeGoalModalOpen(false);
    setSelectedLifeGoal(null);
  }, []);

  const handleLifeGoalSuccess = useCallback(() => {
    // LifeTimeline 리프레시
    setLifeTimelineKey((prev) => prev + 1);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <div className="text-center">
          <div className="relative w-16 h-16 mx-auto mb-6">
            <div className="absolute inset-0 rounded-full border-4 border-border"></div>
            <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
          </div>
          <p className="text-foreground-secondary font-medium">로딩 중...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-surface">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-xl shadow-sm">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-3 sm:py-4">
          <div className="flex justify-between items-center gap-2">
            {/* Logo & User Info */}
            <div
              onClick={() => router.push('/dashboard')}
              className="flex items-center gap-2 sm:gap-3 cursor-pointer group flex-shrink-0"
            >
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-primary to-violet flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow">
                <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <div className="hidden xs:block">
                <h1 className="text-base sm:text-xl font-bold text-foreground">Manage Agent</h1>
                <p className="text-xs text-foreground-secondary">
                  {user.name || user.username}님!
                </p>
              </div>
            </div>

            {/* Navigation */}
            <div className="flex items-center gap-0.5 sm:gap-2 flex-shrink-0">
              <ThemeToggle />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsSearchModalOpen(true)}
                className="gap-1 sm:gap-2 px-2 sm:px-3"
                title="검색 (Ctrl+K)"
              >
                <Search className="w-4 h-4" />
                <span className="hidden sm:inline">검색</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push('/reports')}
                className="gap-1 sm:gap-2 px-2 sm:px-3"
              >
                <BarChart3 className="w-4 h-4" />
                <span className="hidden sm:inline">리포트</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push('/weekly-review')}
                className="gap-1 sm:gap-2 px-2 sm:px-3"
              >
                <CalendarDays className="w-4 h-4" />
                <span className="hidden sm:inline">주간리뷰</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push('/calendar')}
                className="gap-1 sm:gap-2 px-2 sm:px-3"
              >
                <Calendar className="w-4 h-4" />
                <span className="hidden sm:inline">캘린더</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push('/kanban')}
                className="gap-1 sm:gap-2 px-2 sm:px-3"
              >
                <Kanban className="w-4 h-4" />
                <span className="hidden sm:inline">칸반</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push('/settings')}
                className="gap-1 sm:gap-2 px-2 sm:px-3"
              >
                <Settings className="w-4 h-4" />
                <span className="hidden sm:inline">설정</span>
              </Button>
              <div className="w-px h-6 bg-border mx-0.5 sm:mx-1 hidden xs:block"></div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="gap-1 sm:gap-2 px-2 sm:px-3 text-foreground-secondary hover:text-danger"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">로그아웃</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {/* 왼쪽: LifeTimeline + LifeGoals + Goals (콤팩트) */}
          <div className="lg:col-span-1 space-y-3">
            <LifeTimelineCompact
              key={`life-${lifeTimelineKey}`}
              onSettingsClick={handleProfileSettingsOpen}
            />
            <LifeGoalsCompact
              onLifeGoalClick={handleLifeGoalClick}
              onAddLifeGoalClick={handleAddLifeGoal}
            />
            <GoalPanelCompact
              key={`goal-${goalKey}`}
              onGoalClick={handleGoalClick}
              onAddClick={handleAddGoal}
            />
          </div>

          {/* 가운데: TaskList (확장) */}
          <div className="lg:col-span-2">
            <TaskList
              key={`task-${taskKey}`}
              onTaskClick={handleTaskClick}
              onAddClick={handleAddTask}
              onStartFocus={handleStartFocus}
            />
          </div>

          {/* 오른쪽: FocusTimer + TodayRoutines + FocusHistory */}
          <div className="lg:col-span-1 space-y-3">
            <div ref={focusTimerRef}>
              <FocusTimer
                tasks={todayTasks}
                onSessionComplete={() => setFocusHistoryKey((prev) => prev + 1)}
                taskTrigger={focusTaskTrigger}
                onTaskTriggerConsumed={() => setFocusTaskTrigger(null)}
              />
            </div>
            <TodayRoutines />
            <FocusHistory key={`focus-${focusHistoryKey}`} refreshKey={focusHistoryKey} />
          </div>
        </div>
      </main>

      {/* Goal Modal */}
      <GoalModal
        isOpen={isGoalModalOpen}
        onClose={handleGoalModalClose}
        onSuccess={handleGoalSuccess}
        goal={selectedGoal}
      />

      {/* Task Modal */}
      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={handleTaskModalClose}
        onSuccess={handleTaskSuccess}
        task={selectedTask}
      />

      {/* Profile Settings Modal */}
      <ProfileSettingsModal
        isOpen={isProfileSettingsOpen}
        onClose={handleProfileSettingsClose}
        onSuccess={handleProfileSettingsSuccess}
      />

      {/* Life Goal Modal */}
      <LifeGoalModal
        isOpen={isLifeGoalModalOpen}
        onClose={handleLifeGoalModalClose}
        onSuccess={handleLifeGoalSuccess}
        lifeGoal={selectedLifeGoal}
      />

      {/* Search Modal */}
      <SearchModal
        isOpen={isSearchModalOpen}
        onClose={() => setIsSearchModalOpen(false)}
      />
    </div>
  );
}
