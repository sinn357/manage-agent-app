'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import { useTheme } from 'next-themes';
import dynamic from 'next/dynamic';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useKeyboardShortcuts } from '@/lib/hooks/useKeyboardShortcuts';
import GoalPanel from '@/components/dashboard/GoalPanel';
import TaskList from '@/components/dashboard/TaskList';
import FocusTimer from '@/components/dashboard/FocusTimer';
import FocusHistory from '@/components/dashboard/FocusHistory';
import LifeTimeline from '@/components/dashboard/LifeTimeline';
import ProfileSettingsModal from '@/components/dashboard/ProfileSettingsModal';

// 모달 컴포넌트는 필요할 때만 로드
const GoalModal = dynamic(() => import('@/components/dashboard/GoalModal'), {
  ssr: false,
});

const TaskModal = dynamic(() => import('@/components/dashboard/TaskModal'), {
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

  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  const [goalKey, setGoalKey] = useState(0);

  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [taskKey, setTaskKey] = useState(0);

  const [todayTasks, setTodayTasks] = useState<Task[]>([]);
  const [focusHistoryKey, setFocusHistoryKey] = useState(0);

  const [isProfileSettingsOpen, setIsProfileSettingsOpen] = useState(false);
  const [lifeTimelineKey, setLifeTimelineKey] = useState(0);

  // 키보드 단축키 설정
  useKeyboardShortcuts([
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
    // GoalPanel을 리프레시하기 위해 key를 변경
    setGoalKey((prev) => prev + 1);
    // Task 목록도 리프레시 (목표 진행률 업데이트 때문에)
    setTaskKey((prev) => prev + 1);
  }, []);

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
    // TaskList를 리프레시하기 위해 key를 변경
    setTaskKey((prev) => prev + 1);
    // 목표 진행률도 업데이트되므로 GoalPanel도 리프레시
    setGoalKey((prev) => prev + 1);
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

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">로딩 중...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-400 via-violet-400 to-purple-400 dark:from-slate-900 dark:via-purple-900 dark:to-slate-900">
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-500 to-violet-500 dark:from-slate-800 dark:to-purple-800 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div
            onClick={() => router.push('/dashboard')}
            className="cursor-pointer hover:opacity-80 transition-opacity"
          >
            <h1 className="text-2xl font-bold text-white">Manage Agent</h1>
            <p className="text-sm text-white/90">안녕하세요, {user.name || user.username}님!</p>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push('/reports')}
              className="border-white/30 bg-white/10 text-white hover:bg-white/20"
            >
              📊 리포트
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push('/calendar')}
              className="border-white/30 bg-white/10 text-white hover:bg-white/20"
            >
              📅 캘린더
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push('/kanban')}
              className="border-white/30 bg-white/10 text-white hover:bg-white/20"
            >
              📋 칸반
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push('/settings')}
              className="border-white/30 bg-white/10 text-white hover:bg-white/20"
            >
              ⚙️ 설정
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="border-white/30 bg-white/10 text-white hover:bg-white/20"
            >
              로그아웃
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* 왼쪽: LifeTimeline + Goals */}
          <div className="lg:col-span-1 space-y-6">
            <LifeTimeline
              key={`life-${lifeTimelineKey}`}
              onSettingsClick={handleProfileSettingsOpen}
            />
            <GoalPanel
              key={`goal-${goalKey}`}
              onGoalClick={handleGoalClick}
              onAddClick={handleAddGoal}
            />
          </div>

          {/* 가운데: TaskList */}
          <div className="lg:col-span-2">
            <TaskList
              key={`task-${taskKey}`}
              onTaskClick={handleTaskClick}
              onAddClick={handleAddTask}
            />
          </div>

          {/* 오른쪽: FocusTimer + FocusHistory */}
          <div className="lg:col-span-1 space-y-6">
            <FocusTimer
              tasks={todayTasks}
              onSessionComplete={() => setFocusHistoryKey((prev) => prev + 1)}
            />
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
    </div>
  );
}
