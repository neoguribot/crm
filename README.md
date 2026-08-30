# 금거래소 CRM

제일금거래소 일루이 대전관저점을 위한 고객·거래·시세·일정 관리 CRM. Next.js + Supabase.

클라이언트 원본 요구사항 문서를 기준으로 구현했다(요구사항이 확정되기 전 만들어진
초기 프로토타입에서 출발했으며, 코드와 요구사항이 다를 경우 항상 요구사항을 따른다).

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
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | 공개(anon/publishable) 키 — 브라우저 노출 OK, RLS 로 통제 |

`service_role` 키는 사용하지 않는다.

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
마이그레이션은 `supabase/migrations/0001` ~ `0018` 을 번호 순서대로 SQL Editor 에
붙여넣어 적용한다. 각 파일 상단 주석에 목적이 적혀 있다.

핵심만 요약하면:
- `0001`~`0008` — 초기 스키마와 고객/거래 항목 개편(프로토타입 단계)
- `0009`~`0011` — 요구사항 확정본 반영: 성별·등급·완료여부 필드, 거래구분·거래품목
  정수 코드화, 파이프라인(구 기능) 제거
- `0012`~`0014` — 고객 일정(`customer_events`, 여러 건 동시 관리, 거래 연동), 사용자
  프로필(`users`, 월 매출 목표값), 마지막 연락일 자동 갱신 트리거
- `0015`, `0018` — 홈 대시보드·종합분석용 집계 RPC
- `0016` — 거래 삭제 RLS 정책
- `0017` — 시세를 "하루 1건 덮어쓰기"가 아닌 "등록마다 쌓이는 이력"으로 전환

발표·시연용 가상 샘플 데이터: [`docs/DEMO_DATA.md`](./docs/DEMO_DATA.md), `supabase/seed/demo_data.sql`.

## 인증

이메일·비밀번호 로그인만 사용한다. 회원가입·비밀번호 재설정 UI는 미구현(계정은
Supabase 대시보드에서 직접 생성 — 아래 참고). `auth.users` 에 계정이 생성되면
트리거가 `public.users` 프로필 행을 자동으로 만든다.

- `proxy.ts` (Next.js 16, 구 `middleware.ts`) 가 매 요청 세션을 갱신하고 보호 경로를 통제한다.
- 각 보호 페이지는 서버에서 `supabase.auth.getUser()` 로 인증을 다시 확인한다.
- 로그인 성공 → `/home`(기본 화면), 로그아웃 → `/login`, 미인증 보호 경로 → `/login`,
  로그인 상태로 `/login`/`/` 접근 → `/home`.
- 사용자별 데이터 분리(`owner_id`). 로그인한 사용자는 자기 고객·거래만 본다.

### 테스트 사용자 만들기

Supabase 대시보드 > Authentication > Users > **Add user** > 이메일·비밀번호 입력, **Auto Confirm User** 체크.
회원가입은 **Sign In / Providers** 에서 끄는 것을 권장(직원만 사용).

## 기능 범위

1. 고객 정보 관리 — 조회·등록·수정·삭제, 성별·등급·유입경로·방문목적 등
2. 거래 정보 관리 — 조회·등록·수정·삭제(`/transactions`), 고객 상세 안에서도 등록 가능
3. 시세 정보 관리 — 시세 이력 등록·수정·삭제, 목표가 도달 알림(`/prices`)
4. 홈 대시보드 — 오늘의 고객 관리 일정(필터 탭), 거래 고객 수(어제/오늘/주/월/년),
   매출 지표, 목표 도달 현황(월 매출 목표 인라인 수정), 최근 거래, 방문목적별 통계
5. 캘린더 — 월 단위로 고객 일정 보기(`/calendar`)
6. 종합 분석 — 성별·등급·연령대·유입경로 분포, 누적 거래액 상위 고객(`/analytics`)
7. 고객 상세의 일정 섹션 — 문의/예약/맞춤주문/재방문/시세알림/생일/안부 등 여러 건
   동시 관리, 진행 중인 거래와 연동 가능

### 다음 단계로 미룬 기능

- 엑셀·PDF 내보내기
- 사용자 설정 화면(비밀번호 변경 UI, 지금은 Supabase 대시보드에서 직접 변경)

## 경로

| 경로 | 설명 | 인증 |
| --- | --- | --- |
| `/` | 랜딩 (로그인 시 `/home` 로) | - |
| `/login` | 로그인 | - |
| `/home` | 홈 대시보드(일정·매출지표·목표·최근거래) | 필요 |
| `/customers` | 고객 목록 + 검색·세그먼트 필터 | 필요 |
| `/customers/new` | 신규 고객 등록 | 필요 |
| `/customers/[id]` | 고객 상세 + 거래 이력 + 일정 | 필요 |
| `/customers/[id]/edit` | 고객 수정 | 필요 |
| `/customers/[id]/trades/new` | 거래 기록 추가 | 필요 |
| `/transactions` | 거래 관리(검색·신규등록·수정·삭제) | 필요 |
| `/transactions/new` | 신규 거래 등록(고객 선택) | 필요 |
| `/transactions/[id]` | 거래 상세·수정·삭제 | 필요 |
| `/prices` | 시세 관리(등록·이력·알림) | 필요 |
| `/calendar` | 캘린더(월 단위 일정) | 필요 |
| `/analytics` | 종합 분석 | 필요 |

## 프로젝트 구조

```
app/
  layout.tsx            루트 레이아웃 + 공통 네비게이션(AppNav)
  page.tsx  login/  logout/
  home/  customers/  transactions/  prices/  calendar/  analytics/
    (+ 각 loading.tsx)
  error.tsx  not-found.tsx  global-error.tsx  icon.svg
components/
  app-nav.tsx  copyable-phone.tsx  ...
  ui/                    shadcn/ui (button, card, input, label, select,
                         checkbox, textarea, badge, skeleton, money-input, date-input)
lib/
  constants.ts labels.ts date.ts calendar.ts number.ts phone.ts
  supabase/    env·client·server·middleware·require-user·auth-errors
  customers/   queries·filters·recent-visit·match·grade-suggestion
  trades/      queries·holdings
  events/      queries (고객 일정)
  prices/      queries·actions·target
  users/       queries·actions (프로필·목표값)
  dashboard/   queries·summary·period
  analytics/   queries·summary
  reminders/   queries·filters·status (홈 대시보드 일정 위젯에 통합됨)
  validation/  customer·trade-record·customer-event·flatten
  types/       database.ts (앱 레벨 타입) codes.ts (DB 정수 코드 변환)
supabase/
  migrations/  0001 ~ 0018
  seed/        demo_data.sql
  README.md
docs/
  DEMO_DATA.md  INTEGRATION_CHECKLIST.md  DEMO_SCENARIO.md  DEPLOY.md
proxy.ts               세션 갱신 + 보호 경로 통제
```

## 배포

Vercel 배포 준비(환경변수 이름, Supabase Redirect URL, 스모크 테스트)는
[`docs/DEPLOY.md`](./docs/DEPLOY.md).
