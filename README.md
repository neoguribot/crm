# 고객관리 CRM

금은방 고객·거래·세그먼트·리마인드를 관리하는 CRM MVP. Next.js + Supabase.

> 이전 Spring Boot 구현은 `archive/spring-boot-mvp` 브랜치와 `spring-boot-mvp` 태그에 보존되어 있다.

## 기술 스택

| 항목 | 내용 |
| --- | --- |
| 프레임워크 | Next.js 16 (App Router) |
| 언어 | TypeScript |
| 데이터베이스 | Supabase PostgreSQL |
| 인증 | Supabase Auth (이메일·비밀번호) |
| UI | Tailwind CSS v4, shadcn/ui |
| 검증 | zod |
| 테스트 | Vitest |
| 배포 | Vercel |
| 패키지 매니저 | npm |
| Node.js | 20.9 이상 |

## 설치 · 환경변수

```bash
npm install
cp .env.example .env.local   # 값 채우기
```

`.env.local` 은 Git 에 커밋되지 않는다(`.gitignore`). 필요한 변수:

| 변수명 | 설명 |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase 프로젝트 URL (Project Settings > API) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | 공개(anon) 키 — 브라우저 노출 OK, RLS 로 통제 |

`service_role` 키는 사용하지 않는다. Supabase 클라이언트는 실제 호출 시에만 환경변수를 검사하며, 없으면 명확한 오류를 던진다.

## 실행 · 검사

```bash
npm run dev            # 개발 서버 http://localhost:3000
npx tsc --noEmit       # 타입 검사
npm run lint           # 린트
npm run test           # 단위 테스트 (Vitest)
npm run build          # 프로덕션 빌드
```

## 데이터베이스 (Supabase)

적용 방법·RLS·인덱스·numeric 처리 근거는 [`supabase/README.md`](./supabase/README.md).

- `supabase/migrations/0001_initial_schema.sql` — 테이블·enum·인덱스·트리거·RLS
- `supabase/migrations/0002_dashboard_summary.sql` — 대시보드 집계 RPC
- `supabase/migrations/0003_customer_delete.sql` — 고객 삭제 정책 + 거래 FK cascade
- `supabase/migrations/0004_customer_stage.sql` — 고객 영업 단계(stage) 컬럼 — 파이프라인
- SQL Editor 에 번호 순서대로 붙여넣어 적용한다.

발표용 가상 샘플 데이터: [`docs/DEMO_DATA.md`](./docs/DEMO_DATA.md), `supabase/seed/demo_data.sql`.

## 인증

이메일·비밀번호 로그인만 사용한다. 회원가입·비밀번호 재설정은 미구현.

- `proxy.ts` (Next.js 16, 구 `middleware.ts`) 가 매 요청 세션을 갱신하고 보호 경로를 통제한다.
- 각 보호 페이지는 서버에서 `supabase.auth.getUser()` 로 인증을 다시 확인한다.
- 로그인 성공 → `/pipeline`(기본 화면), 로그아웃 → `/login`, 미인증 보호 경로 → `/login`,
  로그인 상태로 `/login`/`/` 접근 → `/pipeline`.
- 사용자별 데이터 분리(`owner_id`). 로그인한 사용자는 자기 고객·거래만 본다.

### 테스트 사용자 만들기

Supabase 대시보드 > Authentication > Users > **Add user** > 이메일·비밀번호 입력, **Auto Confirm User** 체크.
회원가입은 **Sign In / Providers** 에서 끄는 것을 권장(직원만 사용).

## 기능 범위 (MVP)

1. 고객 등록·조회·수정
2. 고객별 거래 기록 (고객 상세 화면 안)
3. 고객 검색 및 세그먼트 필터 (고객 목록 상단)
4. 대시보드 요약
5. 리마인드 대상 고객 표시

## 경로

| 경로 | 설명 | 인증 |
| --- | --- | --- |
| `/` | 홈 (로그인 시 `/pipeline` 로) | - |
| `/login` | 로그인 | - |
| `/dashboard` | CRM 현황 요약 | 필요 |
| `/customers` | 고객 목록 + 검색·세그먼트 필터 + 삭제 | 필요 |
| `/pipeline` | 영업 파이프라인 보드 (드래그·버튼으로 단계 이동) | 필요 |
| `/customers/new` | 신규 고객 등록 | 필요 |
| `/customers/[id]` | 고객 상세 + 거래 이력 | 필요 |
| `/customers/[id]/edit` | 고객 수정 | 필요 |
| `/customers/[id]/trades/new` | 거래 기록 추가 | 필요 |
| `/reminders` | 리마인드 대상 (상태 필터) | 필요 |

## 프로젝트 구조

```
app/
  layout.tsx            루트 레이아웃 + 공통 네비게이션(AppNav)
  page.tsx  login/  logout/
  dashboard/  customers/  reminders/   (+ 각 loading.tsx)
  error.tsx  not-found.tsx  global-error.tsx  icon.svg
components/
  app-nav.tsx  page-loading.tsx
  ui/                    shadcn/ui (button, card, input, label, select,
                         checkbox, textarea, badge, skeleton)
lib/
  constants.ts labels.ts date.ts number.ts phone.ts
  supabase/    env·client·server·middleware·require-user·auth-errors
  customers/   queries·filters·recent-visit·match
  trades/      queries
  reminders/   queries·filters·status
  dashboard/   queries·summary
  validation/  customer·trade-record·flatten
  types/database.ts
supabase/
  migrations/  0001_initial_schema.sql  0002_dashboard_summary.sql
  seed/        demo_data.sql
  README.md
docs/
  DEMO_DATA.md  INTEGRATION_CHECKLIST.md  DEMO_SCENARIO.md  DEPLOY.md
proxy.ts               세션 갱신 + 보호 경로 통제
```

## 배포

Vercel 배포 준비(환경변수 이름, Supabase Redirect URL, 스모크 테스트)는
[`docs/DEPLOY.md`](./docs/DEPLOY.md).
