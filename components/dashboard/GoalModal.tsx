'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';

const PRESET_COLORS = [
  '#3B82F6', // blue
  '#8B5CF6', // purple
  '#EC4899', // pink
  '#EF4444', // red
  '#F59E0B', // amber
  '#10B981', // green
  '#06B6D4', // cyan
  '#6366F1', // indigo
];

// Goal 형식 스키마
const goalFormSchema = z.object({
  title: z.string()
    .min(1, '목표 제목을 입력하세요')
    .max(100, '목표 제목은 100자 이하여야 합니다'),
  description: z.string()
    .max(500, '설명은 500자 이하여야 합니다')
    .optional(),
  targetDate: z.string()
    .optional(),
  color: z.string()
    .regex(/^#[0-9A-F]{6}$/i, '유효한 색상 코드를 입력하세요'),
  lifeGoalId: z.string().optional(),
});

type GoalFormValues = z.infer<typeof goalFormSchema>;

interface Goal {
  id?: string;
  title: string;
  description: string | null;
  targetDate: Date | null;
  color: string;
  lifeGoalId?: string | null;
}

interface LifeGoal {
  id: string;
  title: string;
  icon: string;
  color: string;
}

interface GoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  goal?: Goal | null;
}

export default function GoalModal({
  isOpen,
  onClose,
  onSuccess,
  goal
}: GoalModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [lifeGoals, setLifeGoals] = useState<LifeGoal[]>([]);

  // 날짜를 YYYY-MM-DD 형식으로 변환하는 헬퍼 함수
  const formatDateForInput = (date: Date | string | null | undefined): string => {
    if (!date) return '';

    const d = typeof date === 'string' ? new Date(date) : date;
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const form = useForm<GoalFormValues>({
    resolver: zodResolver(goalFormSchema),
    defaultValues: {
      title: '',
      description: '',
      targetDate: '',
      color: '#3B82F6',
      lifeGoalId: '',
    },
  });

  // LifeGoal 목록 가져오기
  useEffect(() => {
    const fetchLifeGoals = async () => {
      try {
        const response = await fetch('/api/life-goals');
        const data = await response.json();
        if (data.success) {
          setLifeGoals(data.lifeGoals);
        }
      } catch (err) {
        console.error('Failed to fetch life goals:', err);
      }
    };

    if (isOpen) {
      fetchLifeGoals();
    }
  }, [isOpen]);

  // Modal이 열릴 때마다 폼 리셋 및 초기값 설정
  useEffect(() => {
    if (isOpen) {
      if (goal) {
        // 수정 모드
        form.reset({
          title: goal.title,
          description: goal.description || '',
          targetDate: formatDateForInput(goal.targetDate),
          color: goal.color,
          lifeGoalId: goal.lifeGoalId || '',
        });
      } else {
        // 생성 모드
        form.reset({
          title: '',
          description: '',
          targetDate: '',
          color: '#3B82F6',
          lifeGoalId: '',
        });
      }

      setError('');
    }
  }, [isOpen, goal, form]);

  const onSubmit = async (values: GoalFormValues) => {
    setLoading(true);
    setError('');

    try {
      const url = goal?.id ? `/api/goals/${goal.id}` : '/api/goals';
      const method = goal?.id ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: values.title,
          description: values.description || null,
          targetDate: values.targetDate || null,
          color: values.color,
          lifeGoalId: values.lifeGoalId || null,
        }),
      });

      const data = await response.json();

      if (data.success) {
        onSuccess();
        onClose();
      } else {
        setError(data.error || 'Failed to save goal');
      }
    } catch (err) {
      console.error('Save goal error:', err);
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!goal?.id) return;
    if (!confirm('정말 이 목표를 삭제하시겠습니까?')) return;

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`/api/goals/${goal.id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        onSuccess();
        onClose();
      } else {
        setError(data.error || 'Failed to delete goal');
      }
    } catch (err) {
      console.error('Delete goal error:', err);
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{goal?.id ? '목표 수정' : '새 목표'}</DialogTitle>
          <DialogDescription>
            {goal?.id ? '목표 정보를 수정하세요' : '새로운 목표를 생성하세요'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* 제목 */}
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>제목 *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="예: 토익 900점 달성"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* 설명 */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>설명</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="목표에 대한 설명 (선택)"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* 인생목표 연결 */}
            {lifeGoals.length > 0 && (
              <FormField
                control={form.control}
                name="lifeGoalId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>인생목표 연결 (선택)</FormLabel>
                    <FormControl>
                      <select
                        {...field}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <option value="">연결 안함</option>
                        {lifeGoals.map((lifeGoal) => (
                          <option key={lifeGoal.id} value={lifeGoal.id}>
                            {lifeGoal.icon} {lifeGoal.title}
                          </option>
                        ))}
                      </select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* 목표 날짜 */}
            <FormField
              control={form.control}
              name="targetDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>목표 날짜</FormLabel>
                  <FormControl>
                    <Input
                      type="date"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* 색상 */}
            <FormField
              control={form.control}
              name="color"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>색상</FormLabel>
                  <FormControl>
                    <div className="grid grid-cols-8 gap-2">
                      {PRESET_COLORS.map((color) => (
                        <button
                          key={color}
                          type="button"
                          onClick={() => field.onChange(color)}
                          className={cn(
                            'w-8 h-8 rounded-full transition-transform focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500',
                            field.value === color ? 'ring-2 ring-offset-2 ring-gray-400 scale-110' : ''
                          )}
                          style={{ backgroundColor: color }}
                          aria-label={`색상 ${color}`}
                        />
                      ))}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* 에러 메시지 */}
            {error && (
              <div className="text-red-600 text-sm bg-red-50 py-2 px-3 rounded">
                {error}
              </div>
            )}

            <DialogFooter className="gap-2">
              {goal?.id && (
                <Button
                  type="button"
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={loading}
                  className="mr-auto"
                >
                  삭제
                </Button>
              )}
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={loading}
              >
                취소
              </Button>
              <Button
                type="submit"
                disabled={loading}
              >
                {loading ? '저장 중...' : goal?.id ? '수정' : '생성'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
