@AGENTS.md

# CLAUDE.md

고객관리 CRM (금은방). 이전 Spring Boot MVP 를 Next.js 스택으로 전환 중이다.
과거 구현은 `archive/spring-boot-mvp` 브랜치와 `spring-boot-mvp` 태그에 보존되어 있다.

## 기술 스택 (확정)

- Next.js 16 App Router + TypeScript
- Supabase (PostgreSQL + Auth)
- Tailwind CSS v4 + shadcn/ui
- 배포: Vercel
- 패키지 매니저: npm

> Next.js 16 은 학습 데이터와 다른 breaking change 가 있다. 코드 작성 전 `node_modules/next/dist/docs/` 의 관련 가이드를 확인한다(AGENTS.md 참고).

## 개발 원칙

- App Router 와 TypeScript 를 사용한다.
- 가능한 한 Server Component 를 기본으로 한다. 사용자 상호작용이 필요한 부분만 Client Component 로 만든다.
- 데이터 변경은 Server Action, 외부·프로토콜 진입점(인증 콜백 등)은 Route Handler 로 한다.
- 데이터베이스는 Supabase PostgreSQL, 인증은 Supabase Auth 를 사용한다.
- Supabase 클라이언트는 브라우저용(`createBrowserClient`, anon key)과 서버용(`createServerClient`, cookies)을 구분한다.
- `service_role` 키는 브라우저 코드/클라이언트 번들에 절대 포함하지 않는다. `NEXT_PUBLIC_` 접두사를 붙이지 않는다.
- 모든 테이블에 Row Level Security 를 적용한다.
- UI 는 Tailwind CSS 와 shadcn/ui 로 구성한다. React 등 외의 별도 프론트엔드 프레임워크를 추가하지 않는다.
- 금액·중량·순도는 JavaScript 부동소수점 계산에 의존하지 않는다. PostgreSQL `numeric` 에 저장하고, 앱에서는 문자열로 받아 Decimal 라이브러리로 다룬다.
- 날짜/시간대 기준은 `Asia/Seoul` 고정이다. 순수 날짜는 `date`, 타임스탬프는 `timestamptz`(UTC 저장).
- 환경변수와 비밀키를 Git 에 커밋하지 않는다. `.env.example` 에는 키 이름만 둔다.
- 한 번에 하나의 작은 기능만 구현한다. MVP 범위 밖 기능을 임의로 추가하지 않는다.
- 기존에 정상 작동하는 기능을 깨뜨리지 않는다.
- 구현 후 타입 검사(`npx tsc --noEmit`), 린트(`npm run lint`), 빌드(`npm run build`), 관련 테스트를 실행한다.
- 정상 작동이 확인된 단계마다 Git 커밋한다. 단, 사용자가 직접 확인하기 전에는 커밋하지 않는다.

## MVP 기능 범위 (단계별로 하나씩)

1. 고객 등록·조회·수정
2. 고객별 거래 기록
3. 고객 검색 및 세그먼트 필터
4. 대시보드 요약
5. 리마인드 대상 고객 표시

제외: 문자·카카오톡 자동발송, 결제·재고 연동, 복잡한 통계·그래프, 거래 수정·삭제.

## MVP 이후 추가 기능 (사용자 요청, 2026-08-28)

- **고객 삭제** — 고객 목록의 각 행에서 삭제. **거래 기록이 있어도 삭제되고**, 그 고객의
  거래 기록은 FK `on delete cascade` 로 함께 삭제된다(되돌릴 수 없음). `trade_records` 를
  따로 삭제하는 정책은 없다. DB: `supabase/migrations/0003_customer_delete.sql`.
- **영업 파이프라인** (`/pipeline`) — 고객을 영업 단계(신규 문의 → 상담 중 → 견적 발송 →
  구매 확정 → 사후 관리)별 칸반 컬럼으로 본다. 카드 드래그(@dnd-kit) 또는 이전·다음 버튼,
  고객 상세의 Select 로 단계를 옮긴다. DB: `customers.stage` (`supabase/migrations/0004_customer_stage.sql`).

## 데이터 모델

- `customers` 1 : N `trade_records` (`trade_records.customer_id` FK)
- id 는 UUID (`gen_random_uuid()`)
- 구매목적 복수 선택은 PostgreSQL enum 배열 `purchase_purpose[]` (별도 관계 테이블 아님)
- 금액 `numeric(15,0)`, 순도 `numeric(5,2)`, 중량 `numeric(10,3)`
- 최근 방문일 / 리마인드 상태는 저장하지 않고 조회 시 계산
  - 최근 방문일 = `max(trade_records.trade_date)` ∨ `customers.first_visit_date`
  - 미방문 구간: 30 / 90 / 180 / 365일
  - 리마인드 분류: 이벤트 지남 / 7일 이내 / 30일 이내 / 예정 없음

enum 값: 유입경로(DAANGN, NAVER_PLACE, ACQUAINTANCE_REFERRAL, WALK_IN, OTHER),
구매목적(WEDDING_GIFT, FIRST_BIRTHDAY_RING, INVESTMENT_GOLD_BAR, BUY_BACK, OTHER),
거래구분(SALE, PURCHASE), 품목(GOLD_BAR, JEWELRY_24K, GOLD_18K, GOLD_14K, SILVER, OTHER).
코드값과 한국어 표시명을 분리한다.

## 명령

```bash
npm run dev            # 개발 서버 (http://localhost:3000)
npm run build          # 프로덕션 빌드
npx tsc --noEmit       # 타입 검사
npm run lint           # 린트
```

## 진행 상황

- Next.js 16 스캐폴딩 완료 (`migrate/nextjs` 브랜치). 다음: shadcn/ui 초기화 + Supabase 클라이언트 유틸.
