import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface Task {
  id: string;
  title: string;
  description: string | null;
  scheduledDate: Date | null;
  scheduledTime: string | null;
  scheduledEndTime: string | null;
  priority: string;
  status: string;
  order: number;
  completedAt: Date | null;
  goalId: string | null;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
  Goal: {
    id: string;
    title: string;
    color: string;
  } | null;
  _count: {
    FocusSession: number;
  };
}

interface TaskStats {
  total: number;
  completed: number;
  inProgress: number;
  todo: number;
}

interface TasksResponse {
  success: boolean;
  tasks: Task[];
  stats: TaskStats;
  error?: string;
}

interface CreateTaskInput {
  title: string;
  description?: string | null;
  scheduledDate?: string | null;
  scheduledTime?: string | null;
  scheduledEndTime?: string | null;
  priority?: string;
  goalId?: string | null;
}

interface UpdateTaskInput extends Partial<CreateTaskInput> {
  status?: string;
}

// 모든 작업 조회
export function useTasks() {
  return useQuery<Task[], Error>({
    queryKey: ['tasks'],
    queryFn: async () => {
      const response = await fetch('/api/tasks');
      const data: TasksResponse = await response.json();
      if (!data.success) throw new Error(data.error || 'Failed to fetch tasks');
      return data.tasks;
    },
  });
}

// 오늘 할 일 조회
export function useTodayTasks() {
  return useQuery<Task[], Error>({
    queryKey: ['tasks', 'today'],
    queryFn: async () => {
      const response = await fetch('/api/tasks/today?includeUnscheduled=true');
      const data: TasksResponse = await response.json();
      if (!data.success) throw new Error(data.error || 'Failed to fetch today tasks');
      return data.tasks;
    },
  });
}

// 작업 생성
export function useCreateTask() {
  const queryClient = useQueryClient();

  return useMutation<Task, Error, CreateTaskInput>({
    mutationFn: async (input) => {
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      const data = await response.json();
      if (!data.success) throw new Error(data.error || 'Failed to create task');
      return data.task;
    },
    onSuccess: () => {
      // 모든 작업 목록 무효화 및 재조회
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['goals'] }); // 목표 진행률 업데이트
    },
  });
}

// 작업 수정
export function useUpdateTask() {
  const queryClient = useQueryClient();

  return useMutation<Task, Error, { id: string } & UpdateTaskInput>({
    mutationFn: async ({ id, ...input }) => {
      const response = await fetch(`/api/tasks/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      const data = await response.json();
      if (!data.success) throw new Error(data.error || 'Failed to update task');
      return data.task;
    },
    // 낙관적 업데이트
    onMutate: async (updatedTask) => {
      // 진행 중인 쿼리 취소
      await queryClient.cancelQueries({ queryKey: ['tasks'] });

      // 이전 값 백업
      const previousTasks = queryClient.getQueryData(['tasks']);

      // 낙관적 업데이트
      queryClient.setQueryData(['tasks'], (old: Task[] | undefined) => {
        if (!old) return old;
        return old.map((task) =>
          task.id === updatedTask.id ? { ...task, ...updatedTask } : task
        );
      });

      return { previousTasks };
    },
    onError: (err, updatedTask, context) => {
      // 에러 발생 시 롤백
      if (context?.previousTasks) {
        queryClient.setQueryData(['tasks'], context.previousTasks);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['goals'] });
    },
  });
}

// 작업 삭제
export function useDeleteTask() {
  const queryClient = useQueryClient();

  return useMutation<{ id: string }, Error, string>({
    mutationFn: async (id) => {
      const response = await fetch(`/api/tasks/${id}`, { method: 'DELETE' });
      const data = await response.json();
      if (!data.success) throw new Error(data.error || 'Failed to delete task');
      return { id };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['goals'] });
    },
  });
}

// 작업 완료 토글
export function useToggleTaskComplete() {
  const queryClient = useQueryClient();

  return useMutation<Task, Error, string>({
    mutationFn: async (id) => {
      const response = await fetch(`/api/tasks/${id}/complete`, { method: 'PATCH' });
      const data = await response.json();
      if (!data.success) throw new Error(data.error || 'Failed to toggle task');
      return data.task;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['goals'] });
    },
  });
}
