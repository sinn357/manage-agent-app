import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface FocusSession {
  id: string;
  duration: number;
  actualTime: number;
  startedAt: Date;
  endedAt: Date | null;
  completed: boolean;
  interrupted: boolean;
  taskId: string | null;
  userId: string;
  createdAt: Date;
  Task: {
    id: string;
    title: string;
  } | null;
}

interface FocusSessionsResponse {
  success: boolean;
  sessions: FocusSession[];
  stats: {
    total: number;
    completed: number;
    interrupted: number;
    totalMinutes: number;
  };
  error?: string;
}

interface CreateSessionInput {
  duration: number;
  taskId?: string | null;
}

interface UpdateSessionInput {
  actualTime?: number;
  completed?: boolean;
  interrupted?: boolean;
}

// 포커스 세션 목록 조회
export function useFocusSessions(limit?: number) {
  return useQuery<FocusSession[], Error>({
    queryKey: ['focus-sessions', limit],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (limit) params.append('limit', limit.toString());

      const response = await fetch(`/api/focus-sessions?${params.toString()}`);
      const data: FocusSessionsResponse = await response.json();
      if (!data.success) throw new Error(data.error || 'Failed to fetch sessions');
      return data.sessions;
    },
  });
}

// 특정 작업의 포커스 세션 조회
export function useTaskFocusSessions(taskId: string) {
  return useQuery<FocusSession[], Error>({
    queryKey: ['focus-sessions', 'task', taskId],
    queryFn: async () => {
      const response = await fetch(`/api/focus-sessions?taskId=${taskId}`);
      const data: FocusSessionsResponse = await response.json();
      if (!data.success) throw new Error(data.error || 'Failed to fetch task sessions');
      return data.sessions;
    },
    enabled: !!taskId,
  });
}

// 포커스 세션 생성
export function useCreateFocusSession() {
  const queryClient = useQueryClient();

  return useMutation<FocusSession, Error, CreateSessionInput>({
    mutationFn: async (input) => {
      const response = await fetch('/api/focus-sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      const data = await response.json();
      if (!data.success) throw new Error(data.error || 'Failed to create session');
      return data.session;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['focus-sessions'] });
    },
  });
}

// 포커스 세션 업데이트 (완료/중단)
export function useUpdateFocusSession() {
  const queryClient = useQueryClient();

  return useMutation<FocusSession, Error, { id: string } & UpdateSessionInput>({
    mutationFn: async ({ id, ...input }) => {
      const response = await fetch(`/api/focus-sessions/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      const data = await response.json();
      if (!data.success) throw new Error(data.error || 'Failed to update session');
      return data.session;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['focus-sessions'] });
    },
  });
}

// 포커스 세션 삭제
export function useDeleteFocusSession() {
  const queryClient = useQueryClient();

  return useMutation<{ id: string }, Error, string>({
    mutationFn: async (id) => {
      const response = await fetch(`/api/focus-sessions/${id}`, { method: 'DELETE' });
      const data = await response.json();
      if (!data.success) throw new Error(data.error || 'Failed to delete session');
      return { id };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['focus-sessions'] });
    },
  });
}
