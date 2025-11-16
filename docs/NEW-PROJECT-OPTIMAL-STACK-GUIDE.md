# 새 프로젝트 최적 스택 가이드

**작성일**: 2025-11-16
**목적**: 자유도, 개발속도, 프로덕션 품질을 모두 만족하는 최적의 웹 애플리케이션 스택 구성

## 평가 기준

각 접근법은 다음 네 가지 기준으로 평가됩니다:

- **자유도** (0-100): 커스터마이징 가능성, 벤더 종속성 회피
- **개발속도** (0-100): 초기 설정 시간, 보일러플레이트 코드 절감
- **프로덕션 품질** (0-100): 타입 안정성, 테스팅, 성능 최적화
- **확장성** (0-100): 사용자 증가, 데이터 증가, 기능 확장 대응력

---

## 접근법 A: Supabase 올인원 스택

### 📊 점수
- 자유도: **70/100** (벤더 종속성 있음, 하지만 오픈소스)
- 개발속도: **95/100** (가장 빠른 MVP 구축)
- 프로덕션 품질: **85/100** (검증된 솔루션)
- 확장성: **75/100** (중소규모 앱에 최적, 대규모는 비용 증가)

### 🎯 적합한 경우
- 빠른 MVP 출시가 중요한 스타트업
- 백엔드 인프라 관리를 최소화하고 싶은 경우
- 월 사용자 10만 명 이하 규모
- B2C SaaS 제품 (인증, 실시간 기능 필요)

### 🚫 부적합한 경우
- 월 사용자 100만 명 이상 예상
- 복잡한 비즈니스 로직이 많은 경우
- 특정 데이터베이스 최적화가 필요한 경우
- 멀티 클라우드 전략이 필요한 경우

### 🛠️ 기술 스택

```typescript
// 핵심 스택
{
  "프레임워크": "Next.js 15 (App Router)",
  "언어": "TypeScript",
  "스타일링": "Tailwind CSS + shadcn/ui",
  "백엔드": "Supabase (Database + Auth + Storage + Realtime)",
  "타입 안정성": "Supabase-js + TypeScript",
  "유효성 검증": "Zod",
  "상태 관리": "Zustand (클라이언트) + React Query (서버)",
  "폼 관리": "React Hook Form",
  "테스팅": "Playwright (E2E) + Vitest (Unit)",
  "배포": "Vercel"
}
```

### 📦 프로젝트 설정

#### 1단계: 프로젝트 생성 (5분)

```bash
# Next.js 프로젝트 생성
npx create-next-app@latest my-app --typescript --tailwind --app --src-dir

cd my-app

# shadcn/ui 초기화
npx shadcn-ui@latest init
# ✓ TypeScript 선택
# ✓ 기본 스타일 선택 (Default)
# ✓ CSS 변수 사용
```

#### 2단계: Supabase 설정 (10분)

```bash
# Supabase 클라이언트 설치
npm install @supabase/supabase-js @supabase/ssr

# 환경 변수 설정 (.env.local)
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

**lib/supabase/client.ts**:
```typescript
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

**lib/supabase/server.ts**:
```typescript
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

export function createClient() {
  const cookieStore = cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
      },
    }
  )
}
```

#### 3단계: 유효성 검증 및 상태 관리 (15분)

```bash
# 필수 패키지 설치
npm install zod react-hook-form @hookform/resolvers
npm install zustand @tanstack/react-query
```

**lib/validations/auth.ts**:
```typescript
import { z } from 'zod'

export const signUpSchema = z.object({
  email: z.string().email('유효한 이메일을 입력하세요'),
  password: z.string().min(8, '비밀번호는 최소 8자 이상이어야 합니다'),
  name: z.string().min(2, '이름은 최소 2자 이상이어야 합니다'),
})

export type SignUpInput = z.infer<typeof signUpSchema>
```

**lib/stores/user-store.ts**:
```typescript
import { create } from 'zustand'
import { User } from '@supabase/supabase-js'

interface UserStore {
  user: User | null
  setUser: (user: User | null) => void
}

export const useUserStore = create<UserStore>((set) => ({
  user: null,
  setUser: (user) => set({ user }),
}))
```

#### 4단계: UI 컴포넌트 설치 (10분)

```bash
# 필수 shadcn/ui 컴포넌트
npx shadcn-ui@latest add button
npx shadcn-ui@latest add form
npx shadcn-ui@latest add input
npx shadcn-ui@latest add card
npx shadcn-ui@latest add dialog
npx shadcn-ui@latest add dropdown-menu
npx shadcn-ui@latest add toast
```

#### 5단계: 인증 구현 예시 (20분)

**app/auth/sign-up/page.tsx**:
```typescript
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { createClient } from '@/lib/supabase/client'
import { signUpSchema, SignUpInput } from '@/lib/validations/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'

export default function SignUpPage() {
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const form = useForm<SignUpInput>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      email: '',
      password: '',
      name: '',
    },
  })

  const onSubmit = async (data: SignUpInput) => {
    try {
      setLoading(true)
      const { error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            name: data.name,
          },
        },
      })

      if (error) throw error

      router.push('/dashboard')
    } catch (error) {
      console.error('Sign up error:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-md space-y-6 p-8">
        <h1 className="text-2xl font-bold">회원가입</h1>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>이름</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>이메일</FormLabel>
                  <FormControl>
                    <Input type="email" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>비밀번호</FormLabel>
                  <FormControl>
                    <Input type="password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? '처리 중...' : '가입하기'}
            </Button>
          </form>
        </Form>
      </div>
    </div>
  )
}
```

#### 6단계: 테스팅 설정 (20분)

```bash
npm install -D @playwright/test vitest @testing-library/react @testing-library/jest-dom
npx playwright install
```

**playwright.config.ts**:
```typescript
import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  use: {
    baseURL: 'http://localhost:3000',
  },
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
})
```

**e2e/auth.spec.ts**:
```typescript
import { test, expect } from '@playwright/test'

test('user can sign up', async ({ page }) => {
  await page.goto('/auth/sign-up')

  await page.fill('input[name="name"]', 'Test User')
  await page.fill('input[name="email"]', 'test@example.com')
  await page.fill('input[name="password"]', 'password123')

  await page.click('button[type="submit"]')

  await expect(page).toHaveURL('/dashboard')
})
```

### 📈 확장성 고려사항

**장점**:
- Supabase는 PostgreSQL 기반으로 수평 확장 가능
- Edge Functions로 서버리스 로직 실행
- Realtime 기능으로 WebSocket 관리 불필요
- 내장 CDN으로 글로벌 배포 용이

**단점**:
- 월 사용자 100만 명 이상 시 비용 급증 ($2,000+/month)
- 복잡한 쿼리 최적화 제한
- 커스텀 백엔드 로직 구현 시 Edge Functions 제약

**비용 예상**:
- Free tier: 월 사용자 5만 명, DB 500MB
- Pro tier ($25/month): 월 사용자 10만 명, DB 8GB
- Team tier ($599/month): 월 사용자 50만 명, DB 100GB

---

## 접근법 B: 커스텀 백엔드 스택 (NeonDB + Next.js)

### 📊 점수
- 자유도: **95/100** (완전한 제어, 벤더 종속성 최소)
- 개발속도: **70/100** (초기 설정 시간 더 필요)
- 프로덕션 품질: **95/100** (엔터프라이즈급 타입 안정성)
- 확장성: **95/100** (무제한 확장, 비용 최적화 가능)

### 🎯 적합한 경우
- 월 사용자 100만 명 이상 목표
- 복잡한 비즈니스 로직 다수
- 비용 최적화가 중요한 경우
- 엔터프라이즈 B2B SaaS
- 멀티 테넌시 아키텍처 필요

### 🚫 부적합한 경우
- 1-2주 내 빠른 MVP 필요
- 소규모 팀 (1-2명 개발자)
- 백엔드 인프라 관리 경험 부족
- 간단한 CRUD 애플리케이션

### 🛠️ 기술 스택

```typescript
{
  "프레임워크": "Next.js 15 (App Router)",
  "언어": "TypeScript",
  "스타일링": "Tailwind CSS + shadcn/ui",
  "데이터베이스": "NeonDB (Serverless PostgreSQL)",
  "ORM": "Prisma",
  "인증": "NextAuth.js v5 (Auth.js)",
  "API 레이어": "tRPC (타입 안전 API)",
  "유효성 검증": "Zod",
  "상태 관리": "Zustand + TanStack Query",
  "폼 관리": "React Hook Form",
  "캐싱": "Upstash Redis (선택)",
  "테스팅": "Playwright + Vitest",
  "배포": "Vercel + NeonDB"
}
```

### 📦 프로젝트 설정

#### 1단계: T3 Stack으로 시작 (10분)

```bash
# T3 Stack 생성 (모든 기능 포함)
npm create t3-app@latest my-app

# 선택 옵션:
# ✓ TypeScript
# ✓ tRPC
# ✓ Prisma
# ✓ NextAuth.js
# ✓ Tailwind CSS
# ✓ App Router

cd my-app
```

#### 2단계: NeonDB 설정 (10분)

1. [Neon Console](https://console.neon.tech)에서 프로젝트 생성
2. 연결 문자열 복사

**.env**:
```bash
DATABASE_URL="postgresql://user:password@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require"
DIRECT_URL="postgresql://user:password@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require"
```

**prisma/schema.prisma**:
```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}

model User {
  id            String    @id @default(cuid())
  name          String?
  email         String    @unique
  emailVerified DateTime?
  image         String?
  accounts      Account[]
  sessions      Session[]
  tasks         Task[]
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
}

model Task {
  id          String   @id @default(cuid())
  title       String
  description String?
  status      String   @default("todo")
  userId      String
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([userId])
}

// NextAuth 필수 모델
model Account {
  id                String  @id @default(cuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String?
  access_token      String?
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String?
  session_state     String?
  user              User    @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
  @@index([userId])
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
}
```

```bash
# Prisma 마이그레이션
npx prisma migrate dev --name init
npx prisma generate
```

#### 3단계: NextAuth.js 설정 (15분)

**lib/auth.ts**:
```typescript
import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { PrismaAdapter } from '@auth/prisma-adapter'
import { prisma } from './db'
import bcrypt from 'bcryptjs'
import { z } from 'zod'

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
})

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: 'jwt',
  },
  pages: {
    signIn: '/auth/sign-in',
  },
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        const validated = loginSchema.safeParse(credentials)

        if (!validated.success) {
          return null
        }

        const user = await prisma.user.findUnique({
          where: { email: validated.data.email },
        })

        if (!user || !user.password) {
          return null
        }

        const isValid = await bcrypt.compare(
          validated.data.password,
          user.password
        )

        if (!isValid) {
          return null
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
      }
      return session
    },
  },
}
```

**app/api/auth/[...nextauth]/route.ts**:
```typescript
import NextAuth from 'next-auth'
import { authOptions } from '@/lib/auth'

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }
```

#### 4단계: tRPC 라우터 설정 (20분)

**server/api/routers/task.ts**:
```typescript
import { z } from 'zod'
import { createTRPCRouter, protectedProcedure } from '../trpc'

export const taskRouter = createTRPCRouter({
  getAll: protectedProcedure.query(async ({ ctx }) => {
    return ctx.prisma.task.findMany({
      where: {
        userId: ctx.session.user.id,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })
  }),

  create: protectedProcedure
    .input(
      z.object({
        title: z.string().min(1).max(200),
        description: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.task.create({
        data: {
          title: input.title,
          description: input.description,
          userId: ctx.session.user.id,
        },
      })
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        title: z.string().min(1).max(200).optional(),
        description: z.string().optional(),
        status: z.enum(['todo', 'in_progress', 'completed']).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input

      return ctx.prisma.task.update({
        where: {
          id,
          userId: ctx.session.user.id, // 보안: 본인 작업만 수정
        },
        data,
      })
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.task.delete({
        where: {
          id: input.id,
          userId: ctx.session.user.id, // 보안: 본인 작업만 삭제
        },
      })
    }),
})
```

**server/api/root.ts**:
```typescript
import { createTRPCRouter } from './trpc'
import { taskRouter } from './routers/task'

export const appRouter = createTRPCRouter({
  task: taskRouter,
})

export type AppRouter = typeof appRouter
```

#### 5단계: 클라이언트에서 tRPC 사용 (10분)

**app/dashboard/page.tsx**:
```typescript
'use client'

import { useState } from 'react'
import { api } from '@/trpc/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export default function DashboardPage() {
  const [title, setTitle] = useState('')

  // tRPC 쿼리 - 자동 캐싱 및 재검증
  const { data: tasks, isLoading } = api.task.getAll.useQuery()

  // tRPC 뮤테이션 - 낙관적 업데이트 지원
  const createTask = api.task.create.useMutation({
    onSuccess: () => {
      setTitle('')
      // 자동으로 getAll 쿼리 무효화 및 재조회
    },
  })

  const handleCreate = () => {
    createTask.mutate({ title })
  }

  if (isLoading) return <div>Loading...</div>

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">작업 목록</h1>

      <div className="flex gap-2 mb-6">
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="새 작업 추가"
        />
        <Button onClick={handleCreate} disabled={createTask.isLoading}>
          추가
        </Button>
      </div>

      <div className="space-y-2">
        {tasks?.map((task) => (
          <div key={task.id} className="p-4 border rounded">
            <h3 className="font-medium">{task.title}</h3>
            {task.description && (
              <p className="text-sm text-gray-600">{task.description}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
```

#### 6단계: shadcn/ui 설치 (10분)

```bash
npx shadcn-ui@latest init

# 필수 컴포넌트
npx shadcn-ui@latest add button form input card dialog toast
```

#### 7단계: E2E 테스팅 (20분)

```bash
npm install -D @playwright/test
npx playwright install
```

**e2e/task-flow.spec.ts**:
```typescript
import { test, expect } from '@playwright/test'

test.describe('Task Management', () => {
  test.beforeEach(async ({ page }) => {
    // 로그인
    await page.goto('/auth/sign-in')
    await page.fill('input[name="email"]', 'test@example.com')
    await page.fill('input[name="password"]', 'password123')
    await page.click('button[type="submit"]')
    await expect(page).toHaveURL('/dashboard')
  })

  test('create and complete task', async ({ page }) => {
    // 작업 생성
    await page.fill('input[placeholder*="새 작업"]', 'Test Task')
    await page.click('button:has-text("추가")')

    // 작업 표시 확인
    await expect(page.locator('text=Test Task')).toBeVisible()

    // 작업 완료
    await page.click('text=Test Task >> .. >> button:has-text("완료")')
    await expect(page.locator('text=완료됨')).toBeVisible()
  })
})
```

### 📈 확장성 고려사항

**장점**:
- NeonDB는 사용량 기반 과금으로 비용 효율적
- Prisma로 복잡한 쿼리 최적화 가능
- tRPC로 API 레이어 완전 제어
- Upstash Redis 추가로 고성능 캐싱 구현
- 멀티 테넌시 구조 쉽게 구현

**비용 예상**:
- Free tier: 월 사용자 10만 명 가능 (DB 512MB)
- Launch tier ($19/month): 월 사용자 100만 명, DB 10GB
- Scale tier ($69/month): 월 사용자 1000만 명, DB 50GB

**성능 최적화**:
1. Prisma Accelerate 추가 ($25/month) - 글로벌 쿼리 캐싱
2. Upstash Redis ($10/month) - 세션, 실시간 데이터 캐싱
3. Vercel Pro ($20/month) - Edge Functions, Image Optimization

**월 사용자 100만 명 기준 총 비용**:
- Supabase: $2,000+/month
- 커스텀 스택: $140/month (NeonDB $69 + Upstash $10 + Vercel $20 + Prisma Accelerate $25 + 기타 $16)

**절감 비용**: ~$1,860/month (93% 절감)

---

## 🎯 최종 권장사항

### 프로젝트 규모별 추천

| 프로젝트 유형 | 예상 사용자 | 추천 스택 | 이유 |
|------------|-----------|---------|------|
| MVP / 프로토타입 | < 1만 | **Supabase** | 가장 빠른 출시, 검증 우선 |
| 스타트업 초기 | 1만 ~ 10만 | **Supabase** | 빠른 반복 개발, 기능 집중 |
| 성장 단계 | 10만 ~ 100만 | **커스텀 스택** | 비용 최적화 시작 시점 |
| 엔터프라이즈 | > 100만 | **커스텀 스택** | 완전한 제어, 비용 효율성 |

### 마이그레이션 전략

Supabase로 시작했다가 커스텀 스택으로 전환하는 경우:

1. **인증 마이그레이션**: Supabase Auth → NextAuth.js (사용자 데이터 export)
2. **데이터베이스**: PostgreSQL 덤프 → NeonDB로 import
3. **API 레이어**: Supabase-js → tRPC (점진적 전환 가능)
4. **스토리지**: Supabase Storage → Cloudflare R2 (저렴한 대안)

**예상 마이그레이션 시간**: 2-3주 (기능 복잡도에 따라)

### 체크리스트

#### 프로젝트 시작 전 질문

- [ ] 6개월 내 예상 사용자 수는?
- [ ] 개발 기간이 촉박한가? (< 1개월)
- [ ] 팀 규모는? (백엔드 개발자 포함 여부)
- [ ] 복잡한 비즈니스 로직이 많은가?
- [ ] 실시간 기능(채팅, 알림)이 필수인가?
- [ ] 비용 최적화가 얼마나 중요한가?

#### Supabase 선택 기준

3개 이상 해당 시 Supabase 추천:
- [ ] 빠른 MVP 출시 (< 1개월)
- [ ] 소규모 팀 (1-2명 개발자)
- [ ] 예상 사용자 < 10만 명
- [ ] 실시간 기능 필수
- [ ] 백엔드 인프라 관리 경험 부족

#### 커스텀 스택 선택 기준

3개 이상 해당 시 커스텀 스택 추천:
- [ ] 예상 사용자 > 10만 명
- [ ] 복잡한 비즈니스 로직 다수
- [ ] 비용 최적화 중요
- [ ] 엔터프라이즈 B2B SaaS
- [ ] 개발 기간 여유 (> 2개월)

---

## 📚 추가 리소스

- [T3 Stack 문서](https://create.t3.gg/)
- [Supabase 문서](https://supabase.com/docs)
- [NeonDB 문서](https://neon.tech/docs)
- [tRPC 문서](https://trpc.io/docs)
- [shadcn/ui](https://ui.shadcn.com/)
- [Prisma 문서](https://www.prisma.io/docs)
- [NextAuth.js v5](https://authjs.dev/)
- [Playwright 문서](https://playwright.dev/)

---

**최종 업데이트**: 2025-11-16
**작성자**: Claude Code Assistant
