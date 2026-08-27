# 고객관리 CRM

금은방 고객 관리를 위한 CRM MVP. Next.js + Supabase 로 구성한다.

> 이전 Spring Boot 구현은 `archive/spring-boot-mvp` 브랜치와 `spring-boot-mvp` 태그에 보존되어 있다.

## 기술 스택

| 항목 | 내용 |
| --- | --- |
| 프레임워크 | Next.js 16 (App Router) |
| 언어 | TypeScript |
| 데이터베이스 | Supabase PostgreSQL |
| 인증 | Supabase Auth |
| UI | Tailwind CSS v4, shadcn/ui |
| 배포 | Vercel |
| 패키지 매니저 | npm |
| Node.js | 20 이상 |

## 로컬 개발

```bash
npm install
npm run dev
```

http://localhost:3000 접속.

환경변수는 `.env.local` 에 둔다(Git 에 커밋하지 않음). 필요한 키 이름은 `.env.example` 참고.
Supabase 연동 후 `vercel env pull .env.local` 로 받을 수 있다.

## 검사

```bash
npx tsc --noEmit       # 타입 검사
npm run lint           # 린트
npm run build          # 빌드
```

## 기능 범위 (MVP)

1. 고객 등록·조회·수정
2. 고객별 거래 기록
3. 고객 검색 및 세그먼트 필터
4. 대시보드 요약
5. 리마인드 대상 고객 표시

## 프로젝트 구조 (예정)

```
app/                 App Router 페이지
  login/             로그인
  auth/callback/     인증 콜백 (Route Handler)
  (app)/             인증 필요 구역 — 대시보드, 고객, 거래, 리마인드
components/
  ui/                shadcn/ui
lib/
  supabase/          브라우저·서버 클라이언트
  validation/        zod 스키마
  domain/            최근 방문일·리마인드·미방문 계산
  money/             Decimal 파싱·포맷
supabase/
  migrations/        SQL 마이그레이션
```
