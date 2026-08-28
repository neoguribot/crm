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

## 설치

```bash
npm install
```

## 환경변수

```bash
cp .env.example .env.local
```

`.env.local` 에 실제 값을 채운다. 이 파일은 Git 에 커밋되지 않는다(`.gitignore` 처리).
필요한 변수 이름은 `.env.example` 참고. Supabase 연동 후에는 `vercel env pull .env.local` 로 받을 수도 있다.

- `NEXT_PUBLIC_SUPABASE_URL` — Supabase 프로젝트 URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — 공개(anon) 키

> 아직 Supabase 프로젝트를 연결하지 않았으므로 값이 없어도 시작 화면·빌드는 동작한다.
> Supabase 클라이언트는 실제로 호출될 때만 환경변수를 검사하며, 없으면 명확한 오류를 던진다.

## 데이터베이스 (Supabase)

스키마 마이그레이션 SQL 과 적용 방법, RLS 정책, 인덱스·numeric 처리 근거는
[`supabase/README.md`](./supabase/README.md) 에 정리했다.

- `supabase/migrations/0001_initial_schema.sql` — 테이블·enum·인덱스·트리거·RLS
- Supabase 대시보드 SQL Editor 에 붙여넣어 적용한다. **(적용 완료됨)**

## 인증 (Supabase Auth)

이메일·비밀번호 로그인만 사용한다. 회원가입·비밀번호 재설정은 아직 구현하지 않았다.

- `proxy.ts` (Next.js 16, 구 `middleware.ts`) 가 매 요청 세션을 갱신하고
  보호 경로 접근을 통제한다.
- 각 보호 페이지는 서버에서 `supabase.auth.getUser()` 로 인증을 다시 확인한다.
- 로그인 성공 → `/dashboard`, 로그아웃 → `/login`, 미인증 보호 경로 → `/login`.
- 로그인 상태로 `/login` 접근 시 `/dashboard` 로 보낸다.

### 공개 회원가입 정책 (대시보드에서 확인)

Supabase 대시보드 > Authentication > Sign In / Providers 에서
**"Allow new users to sign up"** 를 **끄는 것**을 권장한다(매장 직원만 사용).

### 테스트 사용자 만들기

앱에 회원가입 화면이 없으므로 대시보드에서 직접 만든다.

1. Supabase 대시보드 > Authentication > Users > **Add user** > **Create new user**
2. 이메일·비밀번호 입력, **Auto Confirm User** 체크(이메일 인증 생략)
3. 이 계정으로 `/login` 에서 로그인 → `/dashboard` 접근 확인

> 사용자별 데이터 분리(`owner_id`)라서, 로그인한 사용자마다 자기 고객·거래만 보인다.

## 실행

```bash
npm run dev            # 개발 서버 (http://localhost:3000)
```

## 검사

```bash
npx tsc --noEmit       # 타입 검사
npm run lint           # 린트
npm run build          # 프로덕션 빌드
```

## shadcn/ui

컴포넌트는 `components/ui/` 에 소스로 추가된다. 필요한 것만 그때그때 설치한다.

```bash
npx shadcn@latest add <컴포넌트>
```

현재 설치됨: `button`, `card`.

## 기능 범위 (MVP)

1. 고객 등록·조회·수정
2. 고객별 거래 기록
3. 고객 검색 및 세그먼트 필터
4. 대시보드 요약
5. 리마인드 대상 고객 표시

## 프로젝트 구조

현재 존재:

```
app/                 App Router (현재: / 시작 화면)
components/ui/        shadcn/ui — button, card
lib/
  constants.ts       APP_NAME 등
  labels.ts          DB 코드값 → 한국어 표시명
  supabase/
    env.ts           공개 환경변수 안전 접근
    client.ts        브라우저용 클라이언트
    server.ts        서버용 클라이언트 (쿠키)
  types/database.ts  Customer/TradeRecord/enum/입력 타입
supabase/
  migrations/         SQL 마이그레이션
  README.md           적용 방법·RLS·인덱스 근거
```

예정:

```
app/login/           로그인
app/auth/callback/    인증 콜백 (Route Handler)
app/(app)/            인증 필요 구역 — 대시보드·고객·거래·리마인드
lib/validation/       zod 스키마
lib/domain/           최근 방문일·리마인드·미방문 계산
middleware.ts         세션 갱신
```
