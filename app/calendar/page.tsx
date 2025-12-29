'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import dynamic from 'next/dynamic';
import { Button } from '@/components/ui/button';
import { CalendarDays, Home, Plus } from 'lucide-react';

// CalendarView는 react-big-calendar를 포함하므로 lazy load
const CalendarView = dynamic(() => import('@/components/calendar/CalendarView'), {
  loading: () => (
    <div className="animate-pulse bg-surface/50 backdrop-blur-sm rounded-xl h-[600px] border border-border flex items-center justify-center">
      <p className="text-foreground-secondary">캘린더 로딩 중...</p>
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
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-foreground-secondary">로딩 중...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-surface to-background">
      {/* Header */}
      <header className="glass-card border-b border-border/50 sticky top-0 z-10 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div
            onClick={() => router.push('/dashboard')}
            className="cursor-pointer hover:opacity-80 transition-opacity"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-r from-success to-info">
                <CalendarDays className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold gradient-text">캘린더</h1>
                <p className="text-sm text-foreground-secondary">일정을 한눈에 확인하세요</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => router.push('/dashboard')}
              className="gap-2"
            >
              <Home className="w-4 h-4" />
              대시보드
            </Button>
            <Button
              onClick={() => {
                setSelectedTask(null);
                setSelectedDate(new Date());
                setIsTaskModalOpen(true);
              }}
              className="gap-2"
            >
              <Plus className="w-4 h-4" />
              새 작업
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* 캘린더 */}
        {loading ? (
          <div className="glass-card rounded-xl shadow-lg border border-border p-6 h-[700px] flex items-center justify-center">
            <div className="text-foreground-secondary">일정 불러오는 중...</div>
          </div>
        ) : (
          <CalendarView
            tasks={tasks}
            onSelectEvent={handleSelectEvent}
            onSelectSlot={handleSelectSlot}
          />
        )}
      </main>

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
