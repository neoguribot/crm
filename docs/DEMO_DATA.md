# 발표용 샘플 데이터 (DEMO_DATA)

> ⚠️ **이 문서와 `supabase/seed/demo_data.sql` 의 모든 데이터는 완전한 가상 정보입니다.**
> 실제 사람·연락처·거래가 아닙니다. 이름은 전부 `데모 `로 시작하고, 모든 비고는
> `[DEMO]` 로 시작합니다. 민감정보·실제 고객정보는 포함하지 않습니다.

- **파일**: `supabase/seed/demo_data.sql`
- **규모**: 고객 **18명**, 거래 **24건** (총 삽입 42행)
- **아직 실제 DB 에 적용되지 않았습니다.**

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
4. 성공 시 `NOTICE: 샘플 적용 완료 — 이 사용자의 [DEMO] 고객 18 명, [DEMO] 거래 24 건.`

### 안전장치

| 상황 | 동작 |
| --- | --- |
| `v_raw` 가 자리표시자 그대로 / 빈 값 | `raise exception` 으로 **중단** |
| `v_raw` 가 UUID 형식이 아님 | **중단** |
| 해당 UUID 사용자가 `auth.users` 에 없음 | **중단** |
| 스크립트 재실행 | 고객·거래 id 가 `md5(사용자UUID + 슬러그)` 라 **`ON CONFLICT DO NOTHING`** → 중복 생성 안 됨 |
| 다른 사용자에게 실행 | 다른 해시 → 충돌 없음, 그 사용자에게만 별도 생성 |

- `DROP` / `TRUNCATE` / 전체 `DELETE` **없음**. 기존 데이터를 절대 건드리지 않습니다.
- 날짜는 전부 "오늘(Asia/Seoul)" 기준 상대값이라 **시간이 지나도 시나리오가 유지**됩니다.

## 3. 예상 삽입 건수

| 대상 | 건수 |
| --- | --- |
| `customers` | 18 |
| `trade_records` | 24 |
| **합계** | **42** |

재실행 시 삽입 0건(전부 conflict).

## 4. 적용 후 검증 (읽기 전용)

SQL Editor 에서 `'<UUID>'` 자리에 대상 사용자 UUID 를 넣고 실행:

```sql
-- (1) 샘플 건수
select
  (select count(*) from customers     where owner_id = '<UUID>' and memo like '[DEMO]%') as demo_customers,
  (select count(*) from trade_records where owner_id = '<UUID>' and memo like '[DEMO]%') as demo_trades;
-- 기대: 18, 24

-- (2) 이번 달(Asia/Seoul) 판매/매입 합계
select trade_type, sum(amount) as total
from trade_records
where owner_id = '<UUID>' and memo like '[DEMO]%'
  and trade_date >= date_trunc('month', (now() at time zone 'Asia/Seoul'))::date
  and trade_date <  (date_trunc('month', (now() at time zone 'Asia/Seoul')) + interval '1 month')::date
group by trade_type order by trade_type;
-- 기대: PURCHASE 1030000 / SALE 5920000

-- (3) 구매목적별 고객 수 (복수 목적이면 각각 카운트)
select p as purpose, count(*)
from customers c, unnest(c.purchase_purposes) p
where c.owner_id = '<UUID>' and c.memo like '[DEMO]%'
group by p order by p;
-- 기대: FIRST_BIRTHDAY 5 / INVESTMENT 7 / OTHER 1 / SELLING 6 / WEDDING 5

-- (4) 대시보드 RPC 결과 (로그인 세션에서만 의미 있음. SQL Editor 에서는 owner 스코프가 달라
--     0 이 나올 수 있으니 실제 검증은 브라우저 대시보드로 한다.)
select public.dashboard_summary();
```

## 5. 페르소나별 구성

이름은 슬러그(c01…c18)로 식별. 아래 "일" 은 **적용일(Asia/Seoul) 기준 상대값**.

| # | 이름 | 유입경로 | 구매목적 | 최초방문 | 마지막연락 | 다음이벤트 | 거래 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| c01 | 데모 강토리 | 지인추천 | 돌반지 | 40일 전 | 30일 전 | +5일 | 1 |
| c02 | 데모 남해린 | 네이버플레이스 | 돌반지 | 200일 전 | 190일 전 | +20일 | **0** |
| c03 | 데모 도하준 | 당근마켓 | 돌반지·투자 | 90일 전 | **없음** | **오늘** | 2 (같은 날) |
| c04 | 데모 류가온 | 워크인 | 돌반지·기타 | 100일 전 | 95일 전 | **-10일(지남)** | 1 |
| c05 | 데모 문서아 | 기타 | 돌반지·예물 | 35일 전 | 20일 전 | +25일 | 1 |
| c06 | 데모 박도윤 | 네이버플레이스 | 투자 | 300일 전 | 100일 전 | 없음 | 2 (약 100/130일 전) |
| c07 | 데모 서지호 | 지인추천 | 투자 | 45일 전 | 10일 전 | +3일 | 1 |
| c08 | 데모 안유찬 | 당근마켓 | 투자·매입 | 220일 전 | **없음** | **-30일(지남)** | 2 |
| c09 | 데모 오세라 | 워크인 | 투자 | 30일 전 | 5일 전 | +15일 | 1 |
| c10 | 데모 유하람 | 기타 | 투자 | 500일 전 | 400일 전 | 없음 | **0** |
| c11 | 데모 이준서 | 당근마켓 | 매입 | 50일 전 | 40일 전 | +6일 | 1 |
| c12 | 데모 임채원 | 네이버플레이스 | 매입 | 95일 전 | 60일 전 | +28일 | 2 |
| c13 | 데모 장시우 | 지인추천 | 매입 | 130일 전 | **없음** | **-5일(지남)** | 2 |
| c14 | 데모 전보름 | 워크인 | 매입·예물 | 40일 전 | 35일 전 | 없음 | 1 |
| c15 | 데모 정해원 | 기타 | 매입 | 400일 전 | 380일 전 | +12일 | 2 (약 100/130일 전) |
| c16 | 데모 조가율 | 네이버플레이스 | 예물 | 25일 전 | 15일 전 | +2일 | 2 (같은 날) |
| c17 | 데모 채민재 | 지인추천 | 예물 | 70일 전 | 55일 전 | **-20일(지남)** | 1 |
| c18 | 데모 한소율 | 당근마켓 | 예물·투자 | 55일 전 | **없음** | +22일 | 2 |

구성 요약:
- 돌반지 5 (c01,c02,c03,c04,c05) / 투자 7 (c03,c06,c07,c08,c09,c10,c18) / 매입 6 (c08,c11,c12,c13,c14,c15) / 예물 5 (c05,c14,c16,c17,c18) / 기타 1 (c04)
- **복수 목적 6명** (c03,c04,c05,c08,c14,c18)
- 유입경로: 당근 4 / 네이버 4 / 지인추천 4 / 워크인 3 / 기타 3
- **거래 없음 2명** (c02,c10)
- **마지막 연락일 없음 4명** (c03,c08,c13,c18)
- 이벤트: 지남 4 (c04,c08,c13,c17) / 오늘 1 (c03) / 7일 이내 4 (c01,c07,c11,c16) / 8~30일 6 (c02,c05,c09,c12,c15,c18) / 없음 3 (c06,c10,c14)
- **90일 이상 미방문 5명** (c02,c06,c08,c10,c15) — c02·c10 은 180일 이상

## 6. 예상 대시보드 값 (검증 기준)

| 항목 | 기대값 | 비고 |
| --- | --- | --- |
| 전체 고객 수 | **18** | |
| 이번 달 판매 금액 | **5,920,000원** | t01+t05+t08+t11+t20+t21+t24 (판매·이번달) |
| 이번 달 매입 금액 | **1,030,000원** | t12+t17 (매입·이번달) |
| 구매목적별 | 예물 5 · 돌반지 5 · 투자·골드바 7 · 매입 6 · 기타 1 | 합계 24 ≠ 18 (복수 목적) |
| 90일 이상 미방문 | **5명** | |
| 30일 이내 이벤트 예정 | **11명** | 오늘~+30일 (지남·없음 제외) |
| 최근 거래 5건 | 이번 달 거래로 채워짐, 거래일 내림차순 | 서지호·전보름(약 +13일차) → 강토리·이준서·한소율(약 +8일차) |

> **이번 달 합계 ≠ 전체 거래 합계.** 대시보드는 이번 달만 집계합니다.
> 전체 거래 합계(참고, 적용일 무관): 판매 **15,035,000** / 매입 **9,555,000**.

## 7. 샘플 데이터만 제거하는 방법 (자동 실행 안 함)

필요할 때 **직접** SQL Editor 에서 실행. `[DEMO]` 비고로 샘플만 식별해 제거하므로
실제 데이터는 영향받지 않습니다.

```sql
do $$
declare v_uid uuid := 'PUT-YOUR-TEST-USER-UUID-HERE';
begin
  if v_uid::text = 'PUT-YOUR-TEST-USER-UUID-HERE' then
    raise exception '대상 사용자 UUID 를 입력하세요.';
  end if;
  delete from public.trade_records where owner_id = v_uid and memo like '[DEMO]%';
  delete from public.customers     where owner_id = v_uid and memo like '[DEMO]%';
end $$;
```
