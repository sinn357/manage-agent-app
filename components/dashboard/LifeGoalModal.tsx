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
  '#8B5CF6', // purple
  '#3B82F6', // blue
  '#EC4899', // pink
  '#EF4444', // red
  '#F59E0B', // amber
  '#10B981', // green
  '#06B6D4', // cyan
  '#6366F1', // indigo
];

const PRESET_CATEGORIES = [
  { value: 'health', label: '건강 & 웰빙', icon: '💪' },
  { value: 'wealth', label: '재정 & 부', icon: '💰' },
  { value: 'learning', label: '학습 & 성장', icon: '🎓' },
  { value: 'career', label: '커리어 & 업적', icon: '💼' },
  { value: 'relationship', label: '인간관계 & 가족', icon: '👥' },
  { value: 'creativity', label: '창의성 & 취미', icon: '🎨' },
  { value: 'contribution', label: '기여 & 영향력', icon: '🌍' },
  { value: 'custom', label: '직접 입력', icon: '🌟' },
];

// LifeGoal 형식 스키마
const lifeGoalFormSchema = z.object({
  title: z.string()
    .min(1, '인생목표 제목을 입력하세요')
    .max(100, '인생목표 제목은 100자 이하여야 합니다'),
  description: z.string()
    .max(500, '설명은 500자 이하여야 합니다')
    .optional(),
  category: z.string(),
  icon: z.string().min(1, '아이콘을 선택하세요'),
  color: z.string()
    .regex(/^#[0-9A-F]{6}$/i, '유효한 색상 코드를 입력하세요'),
});

type LifeGoalFormValues = z.infer<typeof lifeGoalFormSchema>;

interface LifeGoal {
  id?: string;
  title: string;
  description: string | null;
  category: string;
  icon: string;
  color: string;
}

interface LifeGoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  lifeGoal?: LifeGoal | null;
}

export default function LifeGoalModal({
  isOpen,
  onClose,
  onSuccess,
  lifeGoal
}: LifeGoalModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const form = useForm<LifeGoalFormValues>({
    resolver: zodResolver(lifeGoalFormSchema),
    defaultValues: {
      title: '',
      description: '',
      category: 'custom',
      icon: '🌟',
      color: '#8B5CF6',
    },
  });

  // Modal이 열릴 때마다 폼 리셋 및 초기값 설정
  useEffect(() => {
    if (isOpen) {
      if (lifeGoal) {
        // 수정 모드
        form.reset({
          title: lifeGoal.title,
          description: lifeGoal.description || '',
          category: lifeGoal.category,
          icon: lifeGoal.icon,
          color: lifeGoal.color,
        });
      } else {
        // 생성 모드
        form.reset({
          title: '',
          description: '',
          category: 'custom',
          icon: '🌟',
          color: '#8B5CF6',
        });
      }
      setError('');
    }
  }, [isOpen, lifeGoal, form]);

  // 카테고리 변경 시 아이콘 자동 설정
  const handleCategoryChange = (category: string) => {
    const preset = PRESET_CATEGORIES.find((c) => c.value === category);
    if (preset) {
      form.setValue('icon', preset.icon);
    }
  };

  const onSubmit = async (data: LifeGoalFormValues) => {
    try {
      setLoading(true);
      setError('');

      const url = lifeGoal?.id
        ? `/api/life-goals/${lifeGoal.id}`
        : '/api/life-goals';
      const method = lifeGoal?.id ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (result.success) {
        onSuccess();
        onClose();
      } else {
        setError(result.error || '인생목표 저장에 실패했습니다');
      }
    } catch (err) {
      console.error('Submit error:', err);
      setError('네트워크 오류가 발생했습니다');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!lifeGoal?.id) return;
    if (!confirm('정말 이 인생목표를 삭제하시겠습니까?')) return;

    try {
      setLoading(true);
      setError('');

      const response = await fetch(`/api/life-goals/${lifeGoal.id}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (result.success) {
        onSuccess();
        onClose();
      } else {
        setError(result.error || '인생목표 삭제에 실패했습니다');
      }
    } catch (err) {
      console.error('Delete error:', err);
      setError('네트워크 오류가 발생했습니다');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {lifeGoal ? '인생목표 수정' : '새 인생목표 추가'}
          </DialogTitle>
          <DialogDescription>
            당신의 인생에서 중요한 목표를 설정하세요
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
                  <FormLabel>인생목표 제목 *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="예: 건강하고 활기찬 삶"
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
                      placeholder="이 인생목표가 나에게 왜 중요한가요?"
                      className="resize-none"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* 카테고리 */}
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>카테고리</FormLabel>
                  <FormControl>
                    <div className="grid grid-cols-2 gap-2">
                      {PRESET_CATEGORIES.map((cat) => (
                        <button
                          key={cat.value}
                          type="button"
                          onClick={() => {
                            field.onChange(cat.value);
                            handleCategoryChange(cat.value);
                          }}
                          className={cn(
                            'flex items-center gap-2 px-3 py-2 rounded-lg border-2 transition-colors text-sm',
                            field.value === cat.value
                              ? 'border-violet-500 bg-violet-50'
                              : 'border-gray-200 hover:border-gray-300'
                          )}
                        >
                          <span>{cat.icon}</span>
                          <span>{cat.label}</span>
                        </button>
                      ))}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* 아이콘 (커스텀인 경우) */}
            {form.watch('category') === 'custom' && (
              <FormField
                control={form.control}
                name="icon"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>아이콘 (이모지)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="🌟"
                        maxLength={2}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* 색상 */}
            <FormField
              control={form.control}
              name="color"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>색상</FormLabel>
                  <FormControl>
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        {PRESET_COLORS.map((color) => (
                          <button
                            key={color}
                            type="button"
                            onClick={() => field.onChange(color)}
                            className={cn(
                              'w-10 h-10 rounded-full border-2 transition-all',
                              field.value === color
                                ? 'border-gray-900 scale-110'
                                : 'border-transparent hover:scale-105'
                            )}
                            style={{ backgroundColor: color }}
                            title={color}
                          />
                        ))}
                      </div>
                      <Input
                        type="text"
                        placeholder="#8B5CF6"
                        maxLength={7}
                        {...field}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {error && (
              <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">
                {error}
              </div>
            )}

            <DialogFooter className="gap-2">
              {lifeGoal && (
                <Button
                  type="button"
                  variant="danger"
                  onClick={handleDelete}
                  disabled={loading}
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
              <Button type="submit" disabled={loading}>
                {loading ? '저장 중...' : lifeGoal ? '수정' : '추가'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
