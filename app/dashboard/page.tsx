'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import GoalPanel from '@/components/dashboard/GoalPanel';
import GoalModal from '@/components/dashboard/GoalModal';
import TaskList from '@/components/dashboard/TaskList';
import TaskModal from '@/components/dashboard/TaskModal';
import FocusTimer from '@/components/dashboard/FocusTimer';
import FocusHistory from '@/components/dashboard/FocusHistory';

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
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  const [goalKey, setGoalKey] = useState(0);

  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [taskKey, setTaskKey] = useState(0);

  const [todayTasks, setTodayTasks] = useState<Task[]>([]);
  const [focusHistoryKey, setFocusHistoryKey] = useState(0);

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

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  const handleAddGoal = () => {
    setSelectedGoal(null);
    setIsGoalModalOpen(true);
  };

  const handleGoalClick = (goal: Goal) => {
    setSelectedGoal(goal);
    setIsGoalModalOpen(true);
  };

  const handleGoalModalClose = () => {
    setIsGoalModalOpen(false);
    setSelectedGoal(null);
  };

  const handleGoalSuccess = () => {
    // GoalPanel을 리프레시하기 위해 key를 변경
    setGoalKey((prev) => prev + 1);
    // Task 목록도 리프레시 (목표 진행률 업데이트 때문에)
    setTaskKey((prev) => prev + 1);
  };

  const handleAddTask = () => {
    setSelectedTask(null);
    setIsTaskModalOpen(true);
  };

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
    setIsTaskModalOpen(true);
  };

  const handleTaskModalClose = () => {
    setIsTaskModalOpen(false);
    setSelectedTask(null);
  };

  const handleTaskSuccess = () => {
    // TaskList를 리프레시하기 위해 key를 변경
    setTaskKey((prev) => prev + 1);
    // 목표 진행률도 업데이트되므로 GoalPanel도 리프레시
    setGoalKey((prev) => prev + 1);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div
            onClick={() => router.push('/dashboard')}
            className="cursor-pointer hover:opacity-80 transition-opacity"
          >
            <h1 className="text-2xl font-bold text-gray-900">Manage Agent</h1>
            <p className="text-sm text-gray-600">안녕하세요, {user.name || user.username}님!</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/reports')}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
            >
              📊 리포트
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Goal Panel */}
          <div className="lg:col-span-1 space-y-6">
            <GoalPanel
              key={`goal-${goalKey}`}
              onGoalClick={handleGoalClick}
              onAddClick={handleAddGoal}
            />
            <FocusHistory key={`focus-${focusHistoryKey}`} refreshKey={focusHistoryKey} />
          </div>

          {/* Task Panel */}
          <div className="lg:col-span-2">
            <div className="mb-6">
              <TaskList
                key={`task-${taskKey}`}
                onTaskClick={handleTaskClick}
                onAddClick={handleAddTask}
              />
            </div>

            {/* Focus Timer */}
            <FocusTimer
              tasks={todayTasks}
              onSessionComplete={() => setFocusHistoryKey((prev) => prev + 1)}
            />
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
    </div>
  );
}
