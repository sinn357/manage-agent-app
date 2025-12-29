'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import dynamic from 'next/dynamic';
import { Button } from '@/components/ui/button';
import { LayoutGrid, Home, Calendar, Plus } from 'lucide-react';

// KanbanBoard는 드래그앤드롭 라이브러리(@dnd-kit)를 포함하므로 lazy load
const KanbanBoard = dynamic(() => import('@/components/kanban/KanbanBoard'), {
  loading: () => (
    <div className="animate-pulse bg-surface/50 backdrop-blur-sm rounded-xl h-[600px] border border-border flex items-center justify-center">
      <p className="text-foreground-secondary">칸반 보드 로딩 중...</p>
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

export default function KanbanPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
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
      console.log('fetchTasks: Starting to fetch tasks...');
      const response = await fetch('/api/tasks');
      console.log('fetchTasks: Response status:', response.status, response.ok);

      if (response.ok) {
        const data = await response.json();
        console.log('fetchTasks: Received data:', data);
        console.log('fetchTasks: Number of tasks:', data.tasks?.length || 0);
        setTasks(data.tasks || []);
        console.log('fetchTasks: State updated with tasks');
      } else {
        console.error('fetchTasks: Response not OK:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('fetchTasks: Error caught:', error);
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

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
    setIsTaskModalOpen(true);
  };

  const handleTaskStatusChange = async (taskId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        // 낙관적 업데이트
        setTasks(prevTasks =>
          prevTasks.map(task =>
            task.id === taskId ? { ...task, status: newStatus } : task
          )
        );
      } else {
        console.error('Failed to update task status');
        // 실패 시 다시 불러오기
        fetchTasks();
      }
    } catch (error) {
      console.error('Error updating task status:', error);
      fetchTasks();
    }
  };

  const handleTaskSaved = () => {
    console.log('handleTaskSaved called, refetching tasks...');
    fetchTasks();
    setIsTaskModalOpen(false);
    setSelectedTask(null);
  };

  const handleModalClose = () => {
    setIsTaskModalOpen(false);
    setSelectedTask(null);
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
              <div className="p-2 rounded-xl bg-gradient-to-r from-violet to-purple">
                <LayoutGrid className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold gradient-text">칸반 보드</h1>
                <p className="text-sm text-foreground-secondary">작업 상태를 드래그하여 변경하세요</p>
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
              variant="secondary"
              size="sm"
              onClick={() => router.push('/calendar')}
              className="gap-2"
            >
              <Calendar className="w-4 h-4" />
              캘린더
            </Button>
            <Button
              onClick={() => {
                setSelectedTask(null);
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
        {/* 칸반 보드 */}
        {loading ? (
          <div className="glass-card rounded-xl shadow-lg border border-border p-6 min-h-[500px] flex items-center justify-center">
            <div className="text-foreground-secondary">작업 불러오는 중...</div>
          </div>
        ) : (
          <KanbanBoard
            tasks={tasks}
            onTaskClick={handleTaskClick}
            onTaskStatusChange={handleTaskStatusChange}
          />
        )}
      </main>

      {/* 작업 모달 */}
      <TaskModal
        isOpen={isTaskModalOpen}
        task={selectedTask}
        goals={goals}
        onClose={handleModalClose}
        onSuccess={handleTaskSaved}
      />
    </div>
  );
}
