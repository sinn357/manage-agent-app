import { describe, it, expect } from 'vitest';
import { taskSchema } from '../task';

describe('taskSchema', () => {
  it('should validate valid task data', () => {
    const result = taskSchema.safeParse({
      title: '테스트 작업',
      description: '작업 설명',
      scheduledDate: '2025-11-16',
      scheduledTime: '14:00',
      scheduledEndTime: '15:00',
      priority: 'high',
      goalId: null,
    });

    expect(result.success).toBe(true);
  });

  it('should reject empty title', () => {
    const result = taskSchema.safeParse({
      title: '',
      priority: 'mid',
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('작업 제목을 입력하세요');
    }
  });

  it('should reject title longer than 200 characters', () => {
    const longTitle = 'a'.repeat(201);
    const result = taskSchema.safeParse({
      title: longTitle,
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('작업 제목은 200자 이하여야 합니다');
    }
  });

  it('should reject invalid time format', () => {
    const result = taskSchema.safeParse({
      title: '작업',
      scheduledTime: '25:00', // invalid hour
      scheduledEndTime: '14:00',
    });

    expect(result.success).toBe(false);
  });

  it('should reject end time before start time', () => {
    const result = taskSchema.safeParse({
      title: '작업',
      scheduledTime: '14:00',
      scheduledEndTime: '13:00', // before start
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      const endTimeError = result.error.issues.find((issue: { message: string }) => issue.message.includes('종료 시간'));
      expect(endTimeError).toBeDefined();
      expect(endTimeError?.message).toBe('종료 시간은 시작 시간보다 늦어야 합니다');
    }
  });

  it('should accept null values for optional fields', () => {
    const result = taskSchema.safeParse({
      title: '작업',
      description: null,
      scheduledDate: null,
      scheduledTime: null,
      scheduledEndTime: null,
      goalId: null,
    });

    expect(result.success).toBe(true);
  });

  it('should accept valid priority values', () => {
    const priorities = ['low', 'mid', 'high'];

    priorities.forEach(priority => {
      const result = taskSchema.safeParse({
        title: '작업',
        priority,
      });
      expect(result.success).toBe(true);
    });
  });

  it('should reject invalid priority values', () => {
    const result = taskSchema.safeParse({
      title: '작업',
      priority: 'invalid',
    });

    expect(result.success).toBe(false);
  });

  it('should handle scheduledTime without scheduledEndTime', () => {
    const result = taskSchema.safeParse({
      title: '작업',
      scheduledTime: '14:00',
      scheduledEndTime: '',
    });

    // 시작 시간이 있으면 종료 시간도 필요
    expect(result.success).toBe(false);
  });

  it('should allow same day start and end time crossing midnight', () => {
    const result = taskSchema.safeParse({
      title: '야간 작업',
      scheduledTime: '23:00',
      scheduledEndTime: '23:30',
    });

    expect(result.success).toBe(true);
  });
});
