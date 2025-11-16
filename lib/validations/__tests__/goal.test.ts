import { describe, it, expect } from 'vitest';
import { goalSchema } from '../goal';

describe('goalSchema', () => {
  it('should validate valid goal data', () => {
    const result = goalSchema.safeParse({
      title: '목표 제목',
      description: '목표 설명',
      targetDate: '2025-12-31',
      color: '#3b82f6',
    });

    expect(result.success).toBe(true);
  });

  it('should reject empty title', () => {
    const result = goalSchema.safeParse({
      title: '',
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('목표 제목을 입력하세요');
    }
  });

  it('should reject title longer than 100 characters', () => {
    const longTitle = 'a'.repeat(101);
    const result = goalSchema.safeParse({
      title: longTitle,
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('목표 제목은 100자 이하여야 합니다');
    }
  });

  it('should reject description longer than 500 characters', () => {
    const longDescription = 'a'.repeat(501);
    const result = goalSchema.safeParse({
      title: '목표',
      description: longDescription,
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('설명은 500자 이하여야 합니다');
    }
  });

  it('should accept null values for optional fields', () => {
    const result = goalSchema.safeParse({
      title: '목표',
      description: null,
      targetDate: null,
      color: '#3b82f6',
    });

    expect(result.success).toBe(true);
  });

  it('should validate color format', () => {
    const validColors = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b'];

    validColors.forEach(color => {
      const result = goalSchema.safeParse({
        title: '목표',
        color,
      });
      expect(result.success).toBe(true);
    });
  });

  it('should reject invalid color format', () => {
    const invalidColors = ['red', 'rgb(255,0,0)', '#fff', '#12345', 'not-a-color'];

    invalidColors.forEach(color => {
      const result = goalSchema.safeParse({
        title: '목표',
        color,
      });
      expect(result.success).toBe(false);
    });
  });

  it('should validate ISO date format for targetDate', () => {
    const result = goalSchema.safeParse({
      title: '목표',
      targetDate: '2025-12-31',
    });

    expect(result.success).toBe(true);
  });

  it('should reject invalid date format', () => {
    const result = goalSchema.safeParse({
      title: '목표',
      targetDate: '31/12/2025', // wrong format
    });

    expect(result.success).toBe(false);
  });

  it('should use default color if not provided', () => {
    const result = goalSchema.safeParse({
      title: '목표',
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.color).toBe('#3b82f6');
    }
  });
});
