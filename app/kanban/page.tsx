'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import KanbanBoard from '@/components/kanban/KanbanBoard';
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
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-600">로딩 중...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-400 via-violet-400 to-purple-400 p-6">
      <div className="max-w-7xl mx-auto">
        {/* 헤더 */}
        <div className="mb-6 flex items-center justify-between bg-white/20 backdrop-blur-md rounded-lg p-6 border border-white/30">
          <div
            onClick={() => router.push('/dashboard')}
            className="cursor-pointer hover:opacity-80 transition-opacity"
          >
            <h1 className="text-3xl font-bold text-white">칸반 보드</h1>
            <p className="text-white/90 mt-1">작업 상태를 드래그하여 변경하세요</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => router.push('/dashboard')}
              className="px-4 py-2 text-white border border-white/50 rounded-lg hover:bg-white/20 transition-colors"
            >
              대시보드
            </button>
            <button
              onClick={() => router.push('/calendar')}
              className="px-4 py-2 text-white border border-white/50 rounded-lg hover:bg-white/20 transition-colors"
            >
              캘린더
            </button>
            <button
              onClick={() => {
                setSelectedTask(null);
                setIsTaskModalOpen(true);
              }}
              className="px-4 py-2 bg-gradient-to-r from-blue-500 to-violet-500 text-white rounded-lg hover:from-blue-600 hover:to-violet-600 transition-all shadow-lg"
            >
              + 새 작업
            </button>
          </div>
        </div>

        {/* 칸반 보드 */}
        {loading ? (
          <div className="bg-white/90 backdrop-blur-lg rounded-lg shadow-xl border border-white/20 p-6 min-h-[500px] flex items-center justify-center">
            <div className="text-gray-700">작업 불러오는 중...</div>
          </div>
        ) : (
          <KanbanBoard
            tasks={tasks}
            onTaskClick={handleTaskClick}
            onTaskStatusChange={handleTaskStatusChange}
          />
        )}
      </div>

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
