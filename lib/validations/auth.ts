import { z } from 'zod'

export const registerSchema = z.object({
  email: z.string()
    .email('유효한 이메일을 입력하세요'),
  username: z.string()
    .min(3, '사용자명은 최소 3자 이상이어야 합니다')
    .max(20, '사용자명은 20자 이하여야 합니다')
    .regex(/^[a-zA-Z0-9_]+$/, '사용자명은 영문, 숫자, 밑줄만 가능합니다'),
  password: z.string()
    .min(8, '비밀번호는 최소 8자 이상이어야 합니다')
    .regex(/[A-Z]/, '비밀번호는 대문자를 포함해야 합니다')
    .regex(/[a-z]/, '비밀번호는 소문자를 포함해야 합니다')
    .regex(/[0-9]/, '비밀번호는 숫자를 포함해야 합니다'),
  name: z.string()
    .min(2, '이름은 최소 2자 이상이어야 합니다')
    .max(50, '이름은 50자 이하여야 합니다'),
})

export const loginSchema = z.object({
  emailOrUsername: z.string()
    .min(1, '이메일 또는 사용자명을 입력하세요'),
  password: z.string()
    .min(1, '비밀번호를 입력하세요'),
})

export type RegisterInput = z.infer<typeof registerSchema>
export type LoginInput = z.infer<typeof loginSchema>
