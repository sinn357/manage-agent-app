'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import dynamic from 'next/dynamic';

// CalendarView는 react-big-calendar를 포함하므로 lazy load
const CalendarView = dynamic(() => import('@/components/calendar/CalendarView'), {
  loading: () => (
    <div className="animate-pulse bg-gray-200 rounded-lg h-[600px] flex items-center justify-center">
      <p className="text-gray-500">캘린더 로딩 중...</p>
    </div>
  ),
  ssr: false,
});

const TaskModal = dynamic(() => import('@/components/dashboard/TaskModal'), {
  ssr: false,
});

interface Task {
  id: string;
  title: string;
  description?: string | null;
  scheduledDate?: string | null;
  priority: string;
  status: string;
  goalId?: string | null;
  Goal?: {
    title: string;
    color: string;
  };
}

interface Goal {
  id: string;
  title: string;
  color: string;
}

export default function CalendarPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    if (user) {
      fetchTasks();
      fetchGoals();
    }
  }, [user]);

  const fetchTasks = async () => {
    try {
      const response = await fetch('/api/tasks');
      if (response.ok) {
        const data = await response.json();
        setTasks(data.tasks || []);
      }
    } catch (error) {
      console.error('Failed to fetch tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchGoals = async () => {
    try {
      const response = await fetch('/api/goals');
      if (response.ok) {
        const data = await response.json();
        setGoals(data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch goals:', error);
    }
  };

  const handleSelectEvent = (task: Task) => {
    setSelectedTask(task);
    setSelectedDate(null);
    setIsTaskModalOpen(true);
  };

  const handleSelectSlot = (slotInfo: { start: Date; end: Date }) => {
    setSelectedTask(null);
    setSelectedDate(slotInfo.start);
    setIsTaskModalOpen(true);
  };

  const handleTaskSaved = () => {
    fetchTasks();
    setIsTaskModalOpen(false);
    setSelectedTask(null);
    setSelectedDate(null);
  };

  const handleModalClose = () => {
    setIsTaskModalOpen(false);
    setSelectedTask(null);
    setSelectedDate(null);
  };

  if (isLoading || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-600">로딩 중...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-400 via-violet-400 to-purple-400 dark:from-slate-900 dark:via-purple-900 dark:to-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* 헤더 */}
        <div className="mb-6 flex items-center justify-between bg-white/20 dark:bg-slate-800/50 backdrop-blur-md rounded-lg p-6 border border-white/30 dark:border-slate-700">
          <div
            onClick={() => router.push('/dashboard')}
            className="cursor-pointer hover:opacity-80 transition-opacity"
          >
            <h1 className="text-3xl font-bold text-white">캘린더</h1>
            <p className="text-white/90 mt-1">일정을 한눈에 확인하세요</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => router.push('/dashboard')}
              className="px-4 py-2 text-white border border-white/50 rounded-lg hover:bg-white/20 transition-colors"
            >
              대시보드
            </button>
            <button
              onClick={() => {
                setSelectedTask(null);
                setSelectedDate(new Date());
                setIsTaskModalOpen(true);
              }}
              className="px-4 py-2 bg-gradient-to-r from-blue-500 to-violet-500 text-white rounded-lg hover:from-blue-600 hover:to-violet-600 transition-all shadow-lg"
            >
              + 새 작업
            </button>
          </div>
        </div>

        {/* 캘린더 */}
        {loading ? (
          <div className="bg-white/90 backdrop-blur-lg rounded-lg shadow-xl border border-white/20 p-6 h-[700px] flex items-center justify-center">
            <div className="text-gray-700">일정 불러오는 중...</div>
          </div>
        ) : (
          <CalendarView
            tasks={tasks}
            onSelectEvent={handleSelectEvent}
            onSelectSlot={handleSelectSlot}
          />
        )}
      </div>

      {/* 작업 모달 */}
      <TaskModal
        isOpen={isTaskModalOpen}
        task={selectedTask}
        goals={goals}
        initialDate={selectedDate}
        onClose={handleModalClose}
        onSuccess={handleTaskSaved}
      />
    </div>
  );
}
