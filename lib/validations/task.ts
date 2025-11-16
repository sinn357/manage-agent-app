import { z } from 'zod'

export const taskSchema = z.object({
  title: z.string()
    .min(1, '작업 제목을 입력하세요')
    .max(200, '작업 제목은 200자 이하여야 합니다'),
  description: z.string()
    .max(1000, '설명은 1000자 이하여야 합니다')
    .optional()
    .nullable(),
  scheduledDate: z.date()
    .nullable()
    .optional(),
  scheduledTime: z.string()
    .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, '유효한 시간 형식이 아닙니다 (HH:MM)')
    .nullable()
    .optional(),
  scheduledEndTime: z.string()
    .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, '유효한 시간 형식이 아닙니다 (HH:MM)')
    .nullable()
    .optional(),
  priority: z.enum(['low', 'mid', 'high'])
    .default('mid'),
  status: z.enum(['todo', 'in_progress', 'completed'])
    .default('todo'),
  goalId: z.string()
    .cuid()
    .nullable()
    .optional(),
})
.refine((data) => {
  // 시작 시간이 있으면 종료 시간도 있어야 함
  if (data.scheduledTime && !data.scheduledEndTime) {
    return false
  }
  return true
}, {
  message: '종료 시간을 입력하세요',
  path: ['scheduledEndTime'],
})
.refine((data) => {
  // 종료 시간이 시작 시간보다 늦어야 함
  if (data.scheduledTime && data.scheduledEndTime) {
    const [startHour, startMin] = data.scheduledTime.split(':').map(Number)
    const [endHour, endMin] = data.scheduledEndTime.split(':').map(Number)
    const startMinutes = startHour * 60 + startMin
    const endMinutes = endHour * 60 + endMin
    return endMinutes > startMinutes
  }
  return true
}, {
  message: '종료 시간은 시작 시간보다 늦어야 합니다',
  path: ['scheduledEndTime'],
})

export type TaskInput = z.infer<typeof taskSchema>

// API 생성/수정용 스키마 (날짜를 문자열로 처리)
export const taskApiSchema = taskSchema.extend({
  scheduledDate: z.string()
    .nullable()
    .optional()
    .transform(val => val ? new Date(val) : null),
})

export type TaskApiInput = z.infer<typeof taskApiSchema>
