# 🚀 Deployment Guide

## Vercel 배포를 위한 환경 변수 설정

### 1. Cloudinary 설정 (파일 업로드용)

1. [Cloudinary 콘솔](https://cloudinary.com/console)에서 계정 생성
2. Dashboard에서 다음 정보 확인:
   - Cloud Name
   - API Key  
   - API Secret

3. Vercel 프로젝트 Settings → Environment Variables에서 추가:
   ```
   CLOUDINARY_CLOUD_NAME=your_actual_cloud_name
   CLOUDINARY_API_KEY=your_actual_api_key
   CLOUDINARY_API_SECRET=your_actual_api_secret
   ```

### 2. 데이터베이스 설정

현재 프로젝트는 PostgreSQL을 사용합니다. Vercel에서는 다음 중 하나를 사용:

#### Option A: Neon (권장)
1. [Neon Console](https://console.neon.tech)에서 프로젝트 생성
2. 연결 문자열 복사
3. Vercel 환경 변수에 추가:
   ```
   DATABASE_URL=postgresql://username:password@host/dbname?sslmode=require
   ```

#### Option B: Supabase
1. [Supabase](https://supabase.com/dashboard)에서 프로젝트 생성
2. Settings → Database에서 연결 문자열 확인
3. Vercel 환경 변수에 추가

### 3. 기타 환경 변수

```
ADMIN_PASSWORD=your_secure_password
NEXT_PUBLIC_EMAILJS_SERVICE_ID=your_service_id
NEXT_PUBLIC_EMAILJS_TEMPLATE_ID=your_template_id
NEXT_PUBLIC_EMAILJS_PUBLIC_KEY=your_public_key
```

### 4. 자동 배포

GitHub에 푸시하면 Vercel이 자동으로 배포합니다:

```bash
git add .
git commit -m "Update deployment configuration"
git push origin main
```

## 🔧 파일 업로드 동작 방식

- **로컬 개발**: `public/uploads` 폴더에 저장
- **Vercel 배포**: Cloudinary 클라우드 스토리지 사용
- **자동 전환**: 환경에 따라 자동으로 적절한 스토리지 선택

## 🐛 문제 해결

### 파일 업로드 500 에러
- Cloudinary 환경 변수가 올바르게 설정되었는지 확인
- Vercel 함수 로그에서 상세 에러 확인

### 데이터베이스 연결 실패
- DATABASE_URL 형식이 올바른지 확인
- 데이터베이스 서버가 외부 접속을 허용하는지 확인

---

## ⏰ Vercel Cron 제한 (Hobby 플랜)

- Hobby 플랜은 **하루 1회 초과 Cron 스케줄을 허용하지 않음**
- `0 * * * *` 같은 매시 스케줄은 Import/연결 과정에서 차단될 수 있음

**대안**
- 하루 1회로 스케줄 낮추기
- GitHub Actions/외부 스케줄러로 Cron 호출
- Pro 플랜 업그레이드
