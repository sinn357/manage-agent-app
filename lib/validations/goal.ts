import { z } from 'zod'

export const goalSchema = z.object({
  title: z.string()
    .min(1, '목표 제목을 입력하세요')
    .max(100, '목표 제목은 100자 이하여야 합니다'),
  description: z.string()
    .max(500, '설명은 500자 이하여야 합니다')
    .optional()
    .nullable(),
  targetDate: z.date()
    .nullable()
    .optional(),
  color: z.string()
    .regex(/^#[0-9A-F]{6}$/i, '유효한 색상 코드를 입력하세요')
    .default('#3B82F6'),
  status: z.enum(['active', 'completed', 'archived'])
    .default('active'),
})

export type GoalInput = z.infer<typeof goalSchema>

// API 생성/수정용 스키마 (날짜를 문자열로 처리)
export const goalApiSchema = goalSchema.extend({
  targetDate: z.string()
    .nullable()
    .optional()
    .transform(val => val ? new Date(val) : null),
})

export type GoalApiInput = z.infer<typeof goalApiSchema>
