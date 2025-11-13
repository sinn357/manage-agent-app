'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import CalendarView from '@/components/calendar/CalendarView';
import TaskModal from '@/components/dashboard/TaskModal';

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
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* 헤더 */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">캘린더</h1>
            <p className="text-gray-600 mt-1">일정을 한눈에 확인하세요</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => router.push('/dashboard')}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              대시보드
            </button>
            <button
              onClick={() => {
                setSelectedTask(null);
                setSelectedDate(new Date());
                setIsTaskModalOpen(true);
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              + 새 작업
            </button>
          </div>
        </div>

        {/* 캘린더 */}
        {loading ? (
          <div className="bg-white rounded-lg shadow-md p-6 h-[700px] flex items-center justify-center">
            <div className="text-gray-600">일정 불러오는 중...</div>
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
