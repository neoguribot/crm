# 발표용 샘플 데이터 (DEMO_DATA)

> ⚠️ **이 문서와 `supabase/seed/demo_data.sql` 의 모든 데이터는 완전한 가상 정보입니다.**
> 실제 사람·연락처·거래가 아닙니다. 이름은 전부 `데모 `로 시작하고, 모든 비고는
> `[DEMO]` 로 시작합니다. 민감정보·실제 고객정보는 포함하지 않습니다.

- **파일**: `supabase/seed/demo_data.sql`
- **규모**: 고객 **18명**, 거래 **24건**, 일정(`customer_events`) **6건** (총 삽입 48행)
- **스키마 기준**: `supabase/migrations/0001` ~ `0025` 전부 적용된 상태 (성별·완료여부 필드,
  거래구분·거래품목 정수 코드, `customer_events` 테이블, 빈도·매출 2축 라벨, 추천인 FK,
  유입경로/방문목적 기타 세부내용, 첫 거래일자 자동 갱신 트리거, 홈 거래 수 현황(건수
  기준)·방문목적 기간별 보기·최근 거래 단가/중량/완료여부, 종합분석 방문빈도·품목분포·
  거래수 랭킹 포함).

---

## 1. 대상 테스트 사용자 지정 방법

샘플 데이터는 **한 명의 로그인 사용자**(`auth.users.id`)에게 귀속됩니다.

1. Supabase 대시보드 > **Authentication > Users** 에서 발표에 쓸 계정의 행을 연다.
2. 그 사용자의 **UID(UUID)** 를 복사한다. *(이 값을 채팅·문서·Git 에 붙여넣지 마세요.)*
3. `supabase/seed/demo_data.sql` 을 열고 맨 위:

   ```sql
   v_raw text := 'PUT-YOUR-TEST-USER-UUID-HERE';
   ```

   의 `PUT-YOUR-TEST-USER-UUID-HERE` 를 복사한 UUID 로 바꾼다.

테스트 사용자가 없다면: **Authentication > Users > Add user > Create new user**,
이메일·비밀번호 입력, **Auto Confirm User** 체크.

## 2. 적용 방법

1. 위 1번대로 `v_raw` 를 채운다.
2. Supabase 대시보드 > **SQL Editor > New query** 에 `demo_data.sql` **전체**를 붙여넣는다.
3. **Run**.
4. 성공 시 `NOTICE: 샘플 적용 완료 — 이 사용자의 [DEMO] 고객 18 명, 거래 24 건, 일정 6 건.`

### 안전장치

| 상황 | 동작 |
| --- | --- |
| `v_raw` 가 자리표시자 그대로 / 빈 값 | `raise exception` 으로 **중단** |
| `v_raw` 가 UUID 형식이 아님 | **중단** |
| 해당 UUID 사용자가 `auth.users` 에 없음 | **중단** |
| 스크립트 재실행 | 고객·거래·일정 id 가 `md5(사용자UUID + 슬러그)` 라 **`ON CONFLICT DO NOTHING`** → 중복 생성 안 됨 |
| 다른 사용자에게 실행 | 다른 해시 → 충돌 없음, 그 사용자에게만 별도 생성 |

- `DROP` / `TRUNCATE` / 전체 `DELETE` **없음**. 기존 데이터를 절대 건드리지 않습니다.
- 날짜는 전부 "오늘(Asia/Seoul)" 기준 상대값이라 **시간이 지나도 시나리오가 유지**됩니다
  (단, 일정 6건의 리마인드 상태는 시간이 지나면 지남/N일 이내 구간이 바뀔 수 있습니다).
- 사용자 프로필(`public.users`)의 월 매출 목표값도 5,000만원으로 함께 채워집니다(upsert).

## 3. 예상 삽입 건수

| 대상 | 건수 |
| --- | --- |
| `customers` | 18 |
| `trade_records` | 24 |
| `customer_events` | 6 |
| **합계** | **48** |

재실행 시 삽입 0건(전부 conflict).

## 4. 적용 후 검증 (읽기 전용)

SQL Editor 에서 `'<UUID>'` 자리에 대상 사용자 UUID 를 넣고 실행:

```sql
-- (1) 샘플 건수
select
  (select count(*) from customers       where owner_id = '<UUID>' and memo like '[DEMO]%') as demo_customers,
  (select count(*) from trade_records   where owner_id = '<UUID>' and memo like '[DEMO]%') as demo_trades,
  (select count(*) from customer_events where owner_id = '<UUID>' and memo like '[DEMO]%') as demo_events;
-- 기대: 18, 24, 6

-- (2) 이번 달(Asia/Seoul) 판매/매입 합계 (trade_type: 1=판매, 2=매입)
select trade_type, sum(amount) as total
from trade_records
where owner_id = '<UUID>' and memo like '[DEMO]%'
  and trade_date >= date_trunc('month', (now() at time zone 'Asia/Seoul'))::date
  and trade_date <  (date_trunc('month', (now() at time zone 'Asia/Seoul')) + interval '1 month')::date
group by trade_type order by trade_type;
-- 기대: 1(판매) 5920000 / 2(매입) 1030000

-- (3) 방문목적별 고객 수 (복수 목적이면 각각 카운트)
select p as purpose, count(*)
from customers c, unnest(c.purchase_purposes) p
where c.owner_id = '<UUID>' and c.memo like '[DEMO]%'
group by p order by p;
-- 기대: CUSTOM_JEWELRY 4 / GOLD_BAR 7 / OTHER 2 / PURCHASE 6 / STONE_PRODUCT 5

-- (4) 빈도·매출 라벨 분포
select frequency_label, count(*)
from customers where owner_id = '<UUID>' and memo like '[DEMO]%'
group by frequency_label order by frequency_label;
-- 기대: 단골 8 / 신규 10

select revenue_label, count(*)
from customers where owner_id = '<UUID>' and memo like '[DEMO]%'
group by revenue_label order by revenue_label;
-- 기대: VIP 3 / 우수 3 / 일반 12

-- (5) 홈 대시보드 RPC 결과 (로그인 세션에서만 owner 스코프가 맞음.
--     SQL Editor 에서는 0 이 나올 수 있으니 실제 검증은 브라우저로 한다.)
select public.dashboard_summary();
select public.customer_analytics();
```

## 5. 페르소나별 구성

이름은 슬러그(c01…c18)로 식별. "일" 은 **적용일(Asia/Seoul) 기준 상대값**.

| # | 이름 | 성별 | 빈도 라벨 | 매출 라벨 | 유입경로 | 방문목적 | 최초거래일 | 마지막연락 | 거래 | 추천인 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| c01 | 데모 강토리 | 여성 | 신규 | VIP | 지인추천 | 돌제품 | 30일 전 | 30일 전 | 1 | - |
| c02 | 데모 남해린 | 여성 | 신규 | 일반 | 네이버플레이스 | 돌제품 | 190일 전 | 190일 전 | **0** | - |
| c03 | 데모 도하준 | 남성 | 단골 | 우수 | 당근마켓 | 돌제품·골드바 | **없음** | **없음** | 2 (같은 날) | - |
| c04 | 데모 류가온 | 모름 | 신규 | 일반 | 워크인 | 돌제품·기타 | 95일 전 | 95일 전 | 1 | - |
| c05 | 데모 문서아 | 여성 | 신규 | 일반 | 기타 | 돌제품·주얼리맞춤 | 20일 전 | 20일 전 | 1 | - |
| c06 | 데모 박도윤 | 남성 | 단골 | VIP | 네이버플레이스 | 골드바 | 100일 전 | 100일 전 | 2 | - |
| c07 | 데모 서지호 | 남성 | 신규 | 일반 | 지인추천 | 골드바 | 10일 전 | 10일 전 | 1 | c01 강토리 |
| c08 | 데모 안유찬 | 남성 | 단골 | 일반 | 당근마켓 | 골드바·매입 | **없음** | **없음** | 2 | - |
| c09 | 데모 오세라 | 여성 | 신규 | 일반 | 워크인 | 골드바 | 5일 전 | 5일 전 | 1 | - |
| c10 | 데모 유하람 | 모름 | 신규 | 일반 | 기타 | 골드바 | **없음** | **없음** | **0** | - |
| c11 | 데모 이준서 | 남성 | 신규 | 일반 | 당근마켓 | 매입 | 40일 전 | 40일 전 | 1 | c03 도하준 |
| c12 | 데모 임채원 | 여성 | 단골 | 우수 | 네이버플레이스 | 매입 | 60일 전 | 60일 전 | 2 | - |
| c13 | 데모 장시우 | 남성 | 단골 | 일반 | 지인추천 | 매입 | **없음** | **없음** | 2 | - |
| c14 | 데모 전보름 | 여성 | 신규 | 일반 | 워크인 | 매입·기타 | 35일 전 | 35일 전 | 1 | c05 문서아 |
| c15 | 데모 정해원 | 남성 | 단골 | VIP | 기타 | 매입 | 380일 전 | 380일 전 | 2 | - |
| c16 | 데모 조가율 | 여성 | 단골 | 우수 | 네이버플레이스 | 주얼리맞춤 | 15일 전 | 15일 전 | 2 (같은 날) | - |
| c17 | 데모 채민재 | 남성 | 신규 | 일반 | 지인추천 | 주얼리맞춤 | 55일 전 | 55일 전 | 1 | - |
| c18 | 데모 한소율 | 여성 | 단골 | 일반 | 당근마켓 | 주얼리맞춤·골드바 | **없음** | **없음** | 2 | - |

구성 요약:
- 방문목적: 돌제품 5 / 골드바 7 / 매입 6 / 주얼리맞춤 4 / 기타 2 (복수 목적 6명: c03,c04,c05,c08,c14,c18)
- 유입경로: 당근마켓 4 / 네이버플레이스 4 / 지인추천 4 / 워크인 3 / 기타 3
- 빈도 라벨: 신규 10 / 단골 8 (거래 건수 2건 이상인 고객이 단골 — 실제 거래 건수와 일치하도록 배정)
- 매출 라벨: VIP 3 / 우수 3 / 일반 12 (수동 지정값. 자동 추천은 최근 3개월 거래액 기준이라
  데모 데이터의 개별 거래액 규모상 대부분 "일반"으로 추천된다 — 정상 동작)
- 성별: 남성 8 / 여성 8 / 모름 2
- **거래 없음 2명** (c02, c10)
- **최초거래일·마지막연락일 없음 5명** (c03, c08, c10, c13, c18)
- **추천인 3건**: c07←c01, c11←c03, c14←c05 (자기참조 FK, 고객 상세에서 링크로 표시됨)

## 6. 일정(customer_events) 6건

| # | 고객 | 종류 | 날짜 | 리마인드 상태 |
| --- | --- | --- | --- | --- |
| e01 | c01 강토리 | 문의 | +5일 | 7일 이내 |
| e02 | c03 도하준 | 재방문 | 오늘 | 오늘 |
| e03 | c05 문서아 | 맞춤주문 | +25일 | 7일 이후(탭에 표시 안 됨) |
| e04 | c08 안유찬 | 재방문 | -10일 | 기한 지남 |
| e05 | c16 조가율 | 생일 | +2일 | 7일 이내 |
| e06 | c17 채민재 | 안부 | -20일 | 기한 지남 |

탭은 **오늘(기본)/기한 지남/7일 이내** 3개다. 오늘 1(e02) / 기한 지남 2(e04, e06) /
7일 이내 2(e01, e05). `e03`(+25일)은 세 탭 어디에도 나오지 않는다(7일 이후는 별도
탭이 없음 — 의도된 동작). 각 일정 항목에는 고객명·종류·날짜·남은(지난) 일자·메모
미리보기(15자 초과 시 `…`)가 표시된다.
`e03`(c05, 맞춤주문)에는 연결된 거래(`trade_id`)가 없다 — 화면에서 직접 거래를 연동해
보여줄 때는 고객 상세에서 새 일정을 등록하며 관련 거래를 선택하면 된다.

## 7. 예상 대시보드 값 (검증 기준)

| 항목 | 기대값 | 비고 |
| --- | --- | --- |
| 전체 고객 수 | **18** | |
| 이번 달 판매 금액 | **5,920,000원** | t01,t05,t08,t11,t20,t21,t24 |
| 이번 달 매입 금액 | **1,030,000원** | t12,t17 |
| 방문목적별(전체 보기) | 돌제품 5 · 골드바 7 · 매입 6 · 주얼리맞춤 4 · 기타 2 | 합계 24 ≠ 18 (복수 목적) |
| 홈 일정 위젯(기본, 오늘 탭) | **1건**(e02) | §6 참고. 기한 지남 2 · 7일 이내 2 |
| 거래 수 현황(오늘/어제/진행중/완료) | 적용일 기준 값(거래 건수, 고객 수 아님) | 적용일에 따라 달라짐 |
| 최근 거래 내역 5건 | 거래일·구분·이름·품목·단가·중량·총 금액·완료 여부, 거래일 내림차순 | |

> **이번 달 합계 ≠ 전체 거래 합계.** 홈 대시보드는 이번 달만 집계합니다.
> 전체 거래 합계(참고, 적용일 무관): 판매 **15,035,000** / 매입 **9,555,000**.

## 8. 샘플 데이터만 제거하는 방법 (자동 실행 안 함)

필요할 때 **직접** SQL Editor 에서 실행. `[DEMO]` 비고로 샘플만 식별해 제거하므로
실제 데이터는 영향받지 않습니다.

```sql
do $$
declare v_uid uuid := 'PUT-YOUR-TEST-USER-UUID-HERE';
begin
  if v_uid::text = 'PUT-YOUR-TEST-USER-UUID-HERE' then
    raise exception '대상 사용자 UUID 를 입력하세요.';
  end if;
  delete from public.customer_events where owner_id = v_uid and memo like '[DEMO]%';
  delete from public.trade_records   where owner_id = v_uid and memo like '[DEMO]%';
  delete from public.customers       where owner_id = v_uid and memo like '[DEMO]%';
end $$;
```
