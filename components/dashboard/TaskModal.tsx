'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';

// Task 형식 스키마
const taskFormSchema = z.object({
  title: z.string()
    .min(1, '작업 제목을 입력하세요')
    .max(200, '작업 제목은 200자 이하여야 합니다'),
  description: z.string()
    .max(1000, '설명은 1000자 이하여야 합니다')
    .optional(),
  scheduledDate: z.string()
    .optional(),
  scheduledTime: z.string()
    .regex(/^([01]\d|2[0-3]):([0-5]\d)$|^$/, '유효한 시간 형식이 아닙니다 (HH:MM)')
    .optional(),
  scheduledEndTime: z.string()
    .regex(/^([01]\d|2[0-3]):([0-5]\d)$|^$/, '유효한 시간 형식이 아닙니다 (HH:MM)')
    .optional(),
  priority: z.enum(['low', 'mid', 'high']),
  goalId: z.string().optional(),
})
.refine((data) => {
  // 시작 시간이 있으면 종료 시간도 있어야 함
  if (data.scheduledTime && data.scheduledTime !== '' && (!data.scheduledEndTime || data.scheduledEndTime === '')) {
    return false;
  }
  return true;
}, {
  message: '종료 시간을 입력하세요',
  path: ['scheduledEndTime'],
})
.refine((data) => {
  // 종료 시간이 시작 시간보다 늦어야 함
  if (data.scheduledTime && data.scheduledEndTime && data.scheduledTime !== '' && data.scheduledEndTime !== '') {
    const [startHour, startMin] = data.scheduledTime.split(':').map(Number);
    const [endHour, endMin] = data.scheduledEndTime.split(':').map(Number);
    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;
    return endMinutes > startMinutes;
  }
  return true;
}, {
  message: '종료 시간은 시작 시간보다 늦어야 합니다',
  path: ['scheduledEndTime'],
});

type TaskFormValues = z.infer<typeof taskFormSchema>;

interface Task {
  id?: string;
  title: string;
  description?: string | null;
  scheduledDate?: Date | string | null;
  scheduledTime?: string | null;
  scheduledEndTime?: string | null;
  priority: string;
  status: string;
  goalId?: string | null;
}

interface Goal {
  id: string;
  title: string;
  color: string;
}

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  task?: Task | null;
  goals?: Goal[];
  initialDate?: Date | null;
}

export default function TaskModal({
  isOpen,
  onClose,
  onSuccess,
  task,
  goals: externalGoals,
  initialDate
}: TaskModalProps) {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // 날짜를 YYYY-MM-DD 형식으로 변환하는 헬퍼 함수
  const formatDateForInput = (date: Date | string | null | undefined): string => {
    if (!date) {
      const d = new Date();
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }

    const d = typeof date === 'string' ? new Date(date) : date;
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const form = useForm<TaskFormValues>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: {
      title: '',
      description: '',
      scheduledDate: formatDateForInput(initialDate),
      scheduledTime: '',
      scheduledEndTime: '',
      priority: 'mid',
      goalId: '',
    },
  });

  // Modal이 열릴 때마다 폼 리셋 및 초기값 설정
  useEffect(() => {
    if (isOpen) {
      // 외부에서 goals를 전달하지 않은 경우만 fetch
      if (!externalGoals) {
        fetchGoals();
      } else {
        setGoals(externalGoals);
      }

      if (task) {
        // 수정 모드
        form.reset({
          title: task.title,
          description: task.description || '',
          scheduledDate: formatDateForInput(task.scheduledDate),
          scheduledTime: task.scheduledTime || '',
          scheduledEndTime: task.scheduledEndTime || '',
          priority: task.priority as 'low' | 'mid' | 'high',
          goalId: task.goalId || '',
        });
      } else {
        // 생성 모드
        form.reset({
          title: '',
          description: '',
          scheduledDate: formatDateForInput(initialDate),
          scheduledTime: '',
          scheduledEndTime: '',
          priority: 'mid',
          goalId: '',
        });
      }

      setError('');
    }
  }, [isOpen, task, initialDate, externalGoals, form]);

  const fetchGoals = async () => {
    try {
      const response = await fetch('/api/goals?status=active');
      const data = await response.json();

      if (data.success) {
        setGoals(data.goals);
      }
    } catch (err) {
      console.error('Fetch goals error:', err);
    }
  };

  const onSubmit = async (values: TaskFormValues) => {
    setLoading(true);
    setError('');

    try {
      const url = task?.id ? `/api/tasks/${task.id}` : '/api/tasks';
      const method = task?.id ? 'PATCH' : 'POST';

      console.log('Submitting task:', values);

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: values.title,
          description: values.description || null,
          scheduledDate: values.scheduledDate || null,
          scheduledTime: values.scheduledTime || null,
          scheduledEndTime: values.scheduledEndTime || null,
          priority: values.priority,
          goalId: values.goalId || null,
        }),
      });

      const data = await response.json();
      console.log('Task response:', data);

      if (data.success) {
        console.log('Task saved successfully, calling onSuccess');
        onSuccess();
        onClose();
      } else {
        setError(data.error || 'Failed to save task');
      }
    } catch (err) {
      console.error('Save task error:', err);
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!task?.id) return;
    if (!confirm('정말 이 작업을 삭제하시겠습니까?')) return;

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`/api/tasks/${task.id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        onSuccess();
        onClose();
      } else {
        setError(data.error || 'Failed to delete task');
      }
    } catch (err) {
      console.error('Delete task error:', err);
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{task?.id ? '작업 수정' : '새 작업'}</DialogTitle>
          <DialogDescription>
            {task?.id ? '작업 정보를 수정하세요' : '새로운 작업을 생성하세요'}
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
                      placeholder="예: 영어 단어 30개 외우기"
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
                      placeholder="작업에 대한 추가 설명 (선택)"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* 날짜 */}
            <FormField
              control={form.control}
              name="scheduledDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>날짜</FormLabel>
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

            {/* 시작 시간 & 종료 시간 */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="scheduledTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>시작 시간</FormLabel>
                    <FormControl>
                      <Input
                        type="time"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="scheduledEndTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>종료 시간</FormLabel>
                    <FormControl>
                      <Input
                        type="time"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* 우선순위 */}
            <FormField
              control={form.control}
              name="priority"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>우선순위</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="우선순위 선택" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="high">높음</SelectItem>
                      <SelectItem value="mid">보통</SelectItem>
                      <SelectItem value="low">낮음</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* 목표 선택 */}
            <FormField
              control={form.control}
              name="goalId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>목표</FormLabel>
                  <Select
                    onValueChange={(value) => {
                      field.onChange(value === 'none' ? null : value);
                    }}
                    defaultValue={field.value || 'none'}
                    value={field.value || 'none'}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="목표 선택 (선택사항)" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">목표 없음 (일회성 작업)</SelectItem>
                      {goals.map((goal) => (
                        <SelectItem key={goal.id} value={goal.id}>
                          {goal.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* 에러 메시지 */}
            {error && (
              <div className="text-danger text-sm bg-danger/10 py-3 px-4 rounded-xl border border-danger/20">
                {error}
              </div>
            )}

            <DialogFooter className="gap-2">
              {task?.id && (
                <Button
                  type="button"
                  variant="danger"
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
                {loading ? '저장 중...' : task?.id ? '수정' : '생성'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
