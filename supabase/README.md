# Supabase 설정

이 디렉터리는 데이터베이스 스키마(마이그레이션 SQL)와 적용 방법을 담는다.
아직 실제 Supabase 프로젝트에는 아무것도 적용하지 않았다.

## 1. 환경변수

`.env.local` (Git 제외) 에 다음을 채운다. 값은 Supabase 대시보드 >
Project Settings > API 에서 확인한다.

| 변수 | 설명 |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | 프로젝트 URL. 공개되어도 되는 값 |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | 공개(anon) 키. 브라우저에 노출되며 RLS 로 통제됨 |

> **키 명칭에 대해:** Supabase 가 새 API 키 체계(`sb_publishable_...` / `sb_secret_...`)를
> 도입했지만, `@supabase/ssr` 기반 Next.js 공식 가이드와 `create-next-app` 예제는
> 여전히 `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY` 를 사용하며
> anon 키도 계속 유효하다. 그래서 기존 `.env.example` 이름을 그대로 둔다.
> publishable 키로 전환할 경우 `NEXT_PUBLIC_SUPABASE_ANON_KEY` 자리에 그 값을 넣으면 된다.

`service_role`(비밀) 키는 이 앱의 일반 코드에서 사용하지 않는다. RLS 를 우회하기 때문이다.

## 2. 마이그레이션 적용

### 방법 A — SQL Editor (권장, 프로젝트만 있으면 됨)

1. Supabase 대시보드 > SQL Editor
2. `migrations/0001_initial_schema.sql` 전체를 붙여넣고 실행
3. 이 스크립트는 여러 번 실행해도 안전하다(이미 있는 객체는 건너뜀).

### 방법 B — Supabase CLI

```bash
supabase link --project-ref <프로젝트 ref>
supabase db push
```

### 적용 후 타입 생성(선택)

```bash
supabase gen types typescript --linked > lib/types/database.generated.ts
```

현재 `lib/types/database.ts` 는 손으로 작성한 정의다. 생성 타입으로 교체하거나
병행할 수 있다.

## 3. 데이터 모델 요약

- `customers` 1 : N `trade_records`
- 모든 행은 `owner_id`(= `auth.users.id`) 에 묶인다. `owner_id` 기본값은 `auth.uid()`.
- 최근 방문일 / 리마인드 상태는 **컬럼으로 저장하지 않고 조회 시 계산**한다.
  - 최근 방문일 = 거래가 있으면 `max(trade_records.trade_date)`, 없으면 `customers.first_visit_date`
  - 리마인드 분류 = `next_event_date` 와 오늘 날짜(Asia/Seoul) 비교

## 4. 구매목적 저장 방식 — PostgreSQL enum 배열

`customers.purchase_purposes public.purchase_purpose[]` (별도 관계 테이블 아님).

이유:
- 선택지가 작고 고정적이며 고객에 완전히 종속된 값 집합이다.
- 단일 행 조회·수정이 간단하고, RLS 정책이 `customers` 하나로 끝난다.
  관계 테이블을 두면 그 테이블에도 별도 정책이 필요하다.
- 세그먼트 필터는 `purchase_purposes @> array['WEDDING']::purchase_purpose[]`
  (포함) 또는 `&&`(교집합) 로 표현할 수 있다.
- 관계 테이블은 목적별 통계가 매우 복잡하거나 목적에 속성(날짜·메모)이 붙을 때
  유리한데, MVP 범위가 아니다.

## 5. numeric 값 처리 (정밀도)

`amount`, `weight`, `purity` 는 PostgreSQL `numeric` 이다.

- PostgREST/`supabase-js` 는 기본적으로 `numeric` 을 **JSON 숫자**로 반환한다.
  JavaScript `number` 는 IEEE 754 배정밀도라 소수 세 자리 중량 등의 합산에서
  미세 오차가 생길 수 있다.
- **처리 원칙**
  1. TypeScript 타입에서 이 컬럼들을 `string`(`NumericString`) 으로 선언해,
     "숫자로 함부로 연산하지 말 것"을 신호한다.
  2. 조회 시 명시적 텍스트 캐스팅으로 문자열을 받는다. 예:
     `.select('id, amount::text, weight::text, purity::text, ...')`
     (데이터 접근 계층은 다음 단계에서 구현)
  3. 합계·평균 등 집계는 앱에서 float 로 더하지 말고 **DB 에서 계산**
     (`sum(amount)`, RPC/뷰)해 정확한 결과를 받는다.
  4. 화면 표시는 `Intl.NumberFormat('ko-KR')` 등으로 문자열을 포맷한다.
- `amount` 는 `numeric(15,0)`(정수 원)이라 최대값이 2^53 미만이므로 정수로는
  안전하지만, 위 원칙을 일관되게 적용한다.
- 이번 단계에서는 별도 십진 계산 라이브러리(decimal.js 등)를 설치하지 않는다.
  실제 계산이 필요한 단계에서 필요성을 재검토한다.

## 6. 인덱스 선택 근거

생성한 인덱스:

| 인덱스 | 대상 쿼리 |
| --- | --- |
| `idx_customers_owner_id` (owner_id) | 테넌트 범위 필터, 대시보드의 전체 고객 수 |
| `idx_customers_owner_name` (owner_id, name) | 이름 정렬·접두어 검색(내 고객 안에서) |
| `idx_customers_owner_phone` (owner_id, phone) | 전화번호 조회, 중복 번호 경고 |
| `idx_customers_owner_first_visit_date` (owner_id, first_visit_date) | 대시보드 신규 고객 집계, 최근 방문일 계산 보조 |
| `idx_customers_owner_next_event_date` (owner_id, next_event_date) | 리마인드 대상 목록 |
| `idx_trade_records_customer_id` (customer_id) | "이 고객의 거래 내역" |
| `idx_trade_records_owner_trade_date` (owner_id, trade_date desc) | 대시보드 기간별 집계, 내 거래 최근순 |

일부러 만들지 않은 인덱스:

- **`trade_records.owner_id` 단독** — `(owner_id, trade_date)` 복합 인덱스의
  왼쪽 접두어가 owner 단독 필터도 커버한다.
- **`trade_records.trade_type`** — 값이 `SALE`/`PURCHASE` 둘뿐이라 선택도가
  낮아 인덱스 이득이 없다. 거래구분으로 거르는 쿼리도 결국 owner 범위 전체를
  집계하는 형태다.
- **`customers.purchase_purposes` GIN** — 세그먼트 필터는 이미 한 사용자의
  작은 데이터 집합 안에서 일어난다. 데이터가 커지고 프로파일링으로 필요성이
  확인되면 `pg_trgm`/GIN 을 나중에 추가한다.
- **`customers.name` 단독(owner 접두어 없이)** — 모든 쿼리가 owner_id 를
  함께 걸기 때문에 플래너가 거의 선택하지 않는다.

부분 문자열 검색(`name ILIKE '%...%'`)까지 인덱스로 지원하려면 `pg_trgm`
확장이 필요하다. MVP 범위를 넘어서므로 지금은 넣지 않는다.

## 7. 롤백 (자동 실행하지 않음)

문제가 생겨 스키마를 되돌려야 하면 아래 SQL 을 **직접** 실행한다.
운영 데이터가 있으면 함께 삭제되므로 주의한다.

```sql
-- 정책·트리거는 테이블과 함께 삭제된다.
drop table if exists public.trade_records;
drop table if exists public.customers;
drop function if exists public.set_updated_at();
drop type if exists public.item_type;
drop type if exists public.trade_type;
drop type if exists public.purchase_purpose;
drop type if exists public.inflow_channel;
```

이 SQL 은 마이그레이션 파일에 넣지 않는다(실수 실행 방지).
