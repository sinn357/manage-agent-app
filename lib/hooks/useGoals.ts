import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface Goal {
  id: string;
  title: string;
  description: string | null;
  targetDate: Date | null;
  status: string;
  color: string;
  order: number;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
  progress: number;
  stats: {
    totalTasks: number;
    completedTasks: number;
    totalMilestones: number;
    completedMilestones: number;
  };
}

interface GoalsResponse {
  success: boolean;
  goals: Goal[];
  error?: string;
}

interface CreateGoalInput {
  title: string;
  description?: string | null;
  targetDate?: string | null;
  color?: string;
}

interface UpdateGoalInput extends Partial<CreateGoalInput> {
  status?: string;
  order?: number;
}

// 모든 목표 조회
export function useGoals() {
  return useQuery<Goal[], Error>({
    queryKey: ['goals'],
    queryFn: async () => {
      const response = await fetch('/api/goals');
      const data: GoalsResponse = await response.json();
      if (!data.success) throw new Error(data.error || 'Failed to fetch goals');
      return data.goals;
    },
  });
}

// 활성 목표만 조회
export function useActiveGoals() {
  return useQuery<Goal[], Error>({
    queryKey: ['goals', 'active'],
    queryFn: async () => {
      const response = await fetch('/api/goals?status=active');
      const data: GoalsResponse = await response.json();
      if (!data.success) throw new Error(data.error || 'Failed to fetch active goals');
      return data.goals;
    },
  });
}

// 목표 생성
export function useCreateGoal() {
  const queryClient = useQueryClient();

  return useMutation<Goal, Error, CreateGoalInput>({
    mutationFn: async (input) => {
      const response = await fetch('/api/goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      const data = await response.json();
      if (!data.success) throw new Error(data.error || 'Failed to create goal');
      return data.goal;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
    },
  });
}

// 목표 수정
export function useUpdateGoal() {
  const queryClient = useQueryClient();

  return useMutation<Goal, Error, { id: string } & UpdateGoalInput>({
    mutationFn: async ({ id, ...input }) => {
      const response = await fetch(`/api/goals/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      const data = await response.json();
      if (!data.success) throw new Error(data.error || 'Failed to update goal');
      return data.goal;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
    },
  });
}

// 목표 삭제
export function useDeleteGoal() {
  const queryClient = useQueryClient();

  return useMutation<{ id: string }, Error, string>({
    mutationFn: async (id) => {
      const response = await fetch(`/api/goals/${id}`, { method: 'DELETE' });
      const data = await response.json();
      if (!data.success) throw new Error(data.error || 'Failed to delete goal');
      return { id };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
    },
  });
}
