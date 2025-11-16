import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UIStore {
  // 사이드바
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;

  // 테마
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;

  // 뷰 모드
  viewMode: 'list' | 'grid' | 'calendar' | 'kanban';
  setViewMode: (mode: 'list' | 'grid' | 'calendar' | 'kanban') => void;

  // 필터
  selectedGoalId: string | null;
  setSelectedGoalId: (goalId: string | null) => void;

  priorityFilter: string[];
  setPriorityFilter: (priorities: string[]) => void;

  statusFilter: string[];
  setStatusFilter: (statuses: string[]) => void;

  // 태스크 모달 상태
  showTaskModal: boolean;
  setShowTaskModal: (show: boolean) => void;

  // 목표 모달 상태
  showGoalModal: boolean;
  setShowGoalModal: (show: boolean) => void;
}

export const useUIStore = create<UIStore>()(
  persist(
    (set) => ({
      // 사이드바
      sidebarOpen: true,
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      setSidebarOpen: (open) => set({ sidebarOpen: open }),

      // 테마
      theme: 'light',
      setTheme: (theme) => set({ theme }),

      // 뷰 모드
      viewMode: 'list',
      setViewMode: (mode) => set({ viewMode: mode }),

      // 필터
      selectedGoalId: null,
      setSelectedGoalId: (goalId) => set({ selectedGoalId: goalId }),

      priorityFilter: [],
      setPriorityFilter: (priorities) => set({ priorityFilter: priorities }),

      statusFilter: [],
      setStatusFilter: (statuses) => set({ statusFilter: statuses }),

      // 모달 상태
      showTaskModal: false,
      setShowTaskModal: (show) => set({ showTaskModal: show }),

      showGoalModal: false,
      setShowGoalModal: (show) => set({ showGoalModal: show }),
    }),
    {
      name: 'manage-agent-ui', // localStorage key
      // 모달 상태는 persist하지 않음 (페이지 새로고침 시 닫혀있어야 함)
      partialize: (state) => ({
        sidebarOpen: state.sidebarOpen,
        theme: state.theme,
        viewMode: state.viewMode,
        selectedGoalId: state.selectedGoalId,
        priorityFilter: state.priorityFilter,
        statusFilter: state.statusFilter,
      }),
    }
  )
);
