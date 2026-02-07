// components/ai/AIRecommendWidget.tsx

'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface Task {
  id: string;
  title: string;
  scheduledDate: string | null;
  priority: string;
  Goal?: {
    title: string;
    LifeGoal?: {
      title: string;
    } | null;
  } | null;
}

interface Reason {
  type: 'deadline' | 'longterm' | 'priority' | 'time_fitness';
  description: string;
}

interface RecommendResponse {
  recommended: {
    taskId: string;
    task: Task;
  };
  reasons: Reason[];
  alternatives: Array<{
    taskId: string;
    task: Task;
  }>;
  confidence: number;
  decisionLogId: string;
}

interface AIRecommendWidgetProps {
  taskIds: string[];
  onTaskSelect?: (taskId: string) => void;
}

export function AIRecommendWidget({
  taskIds,
  onTaskSelect,
}: AIRecommendWidgetProps) {
  const queryClient = useQueryClient();
  const [showFeedback, setShowFeedback] = useState(false);
  const [selectedFeedback, setSelectedFeedback] = useState<string>('');
  const [selectedAlternativeId, setSelectedAlternativeId] = useState<string>('');

  // 추천 조회
  const { data, isLoading, error } = useQuery<RecommendResponse>({
    queryKey: ['ai-recommend', taskIds],
    queryFn: async () => {
      const res = await fetch('/api/ai/recommend-next', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskIds }),
      });
      if (!res.ok) throw new Error('추천 실패');
      return res.json();
    },
    enabled: taskIds.length >= 2,
    staleTime: 1000 * 60 * 5, // 5분
  });

  // 피드백 저장
  const feedbackMutation = useMutation({
    mutationFn: async ({
      decisionLogId,
      userChoice,
      feedback,
    }: {
      decisionLogId: string;
      userChoice: string;
      feedback?: string;
    }) => {
      const res = await fetch('/api/ai/decision-feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ decisionLogId, userChoice, feedback }),
      });
      if (!res.ok) throw new Error('피드백 저장 실패');
      return res.json();
    },
    onSuccess: () => {
      setShowFeedback(false);
      setSelectedFeedback('');
      setSelectedAlternativeId('');
      queryClient.invalidateQueries({ queryKey: ['ai-recommend'] });
    },
  });

  // 작업 선택 핸들러
  const handleSelectTask = (taskId: string, isRecommended: boolean) => {
    if (!isRecommended) {
      // AI 추천과 다른 선택 → 피드백 요청
      const fallbackAlt = data?.alternatives[0]?.taskId || '';
      setSelectedAlternativeId(taskId || fallbackAlt);
      setShowFeedback(true);
      return;
    }

    if (data?.decisionLogId) {
      // AI 추천 수락
      feedbackMutation.mutate({
        decisionLogId: data.decisionLogId,
        userChoice: taskId,
      });
    }

    onTaskSelect?.(taskId);
  };

  // 피드백 제출
  const handleFeedbackSubmit = (chosenTaskId: string) => {
    if (!chosenTaskId) return;
    onTaskSelect?.(chosenTaskId);
    if (data?.decisionLogId) {
      feedbackMutation.mutate({
        decisionLogId: data.decisionLogId,
        userChoice: chosenTaskId,
        feedback: selectedFeedback || undefined,
      });
    }
  };

  // 로딩 상태
  if (isLoading) {
    return (
      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 animate-pulse">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-2"></div>
        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
      </div>
    );
  }

  // 에러 상태
  if (error || !data) {
    return null; // 조용히 숨김
  }

  // 피드백 모달
  if (showFeedback) {
    return (
      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
        <p className="text-sm text-blue-800 dark:text-blue-200 mb-3">
          다른 작업을 선택하셨네요. 이유가 있으신가요?
        </p>
        <div className="space-y-2 mb-3">
          {[
            { value: 'urgent', label: '급한 요청이 왔어요' },
            { value: 'condition', label: '지금 컨디션에 맞아요' },
            { value: 'mood', label: '기분이 그래요' },
            { value: 'other', label: '기타' },
          ].map((option) => (
            <label
              key={option.value}
              className="flex items-center gap-2 cursor-pointer"
            >
              <input
                type="radio"
                name="feedback"
                value={option.value}
                checked={selectedFeedback === option.value}
                onChange={(e) => setSelectedFeedback(e.target.value)}
                className="text-blue-600"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                {option.label}
              </span>
            </label>
          ))}
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => {
              const chosenId =
                selectedAlternativeId || data.alternatives[0]?.taskId;
              if (chosenId) {
                onTaskSelect?.(chosenId);
              }
              setShowFeedback(false);
              setSelectedFeedback('');
              setSelectedAlternativeId('');
            }}
            className="px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
          >
            건너뛰기
          </button>
          <button
            onClick={() => {
              const chosenId = selectedAlternativeId || data.alternatives[0]?.taskId;
              if (chosenId) handleFeedbackSubmit(chosenId);
            }}
            type="button"
            disabled={!selectedAlternativeId && !data.alternatives[0]?.taskId}
            className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            저장
          </button>
        </div>
      </div>
    );
  }

  // 추천 표시
  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg p-4 border border-blue-100 dark:border-blue-800">
      {/* 헤더 */}
      <div className="flex items-center gap-2 mb-3">
        <span className="text-lg">🤖</span>
        <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
          다음 작업 추천
        </span>
        <span className="text-xs text-blue-600 dark:text-blue-400 ml-auto">
          신뢰도 {Math.round(data.confidence * 100)}%
        </span>
      </div>

      {/* 추천 작업 */}
      <div className="mb-3">
        <h3 className="font-medium text-gray-900 dark:text-white mb-1">
          {data.recommended.task.title}
        </h3>

        {/* 이유 */}
        <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-0.5">
          {data.reasons.map((reason, idx) => (
            <li key={idx} className="flex items-start gap-1.5">
              <span className="text-blue-500 mt-0.5">•</span>
              <span>{reason.description}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* 액션 버튼 */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => handleSelectTask(data.recommended.taskId, true)}
          className="flex-1 px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          시작하기
        </button>
        <button
          type="button"
          onClick={() =>
            handleSelectTask(data.alternatives[0]?.taskId || '', false)
          }
          className="px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
        >
          다른 작업
        </button>
      </div>
    </div>
  );
}
