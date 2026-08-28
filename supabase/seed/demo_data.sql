-- =====================================================================
-- demo_data.sql  —  발표용 가상 샘플 데이터 (고객 18명 / 거래 24건)
--
-- ⚠️ 모든 데이터는 완전한 가상 정보다. 실제 개인정보가 아니다.
--    이름은 전부 "데모 " 로 시작하고, 비고는 전부 "[DEMO]" 로 시작한다.
--
-- 안전장치:
--  1) 아래 v_raw 에 대상 테스트 사용자 UUID 를 넣지 않으면 실행이 중단된다.
--  2) UUID 형식이 아니거나 auth.users 에 없는 사용자면 중단된다.
--  3) 고객·거래 id 를 (사용자 UUID + 슬러그) 해시로 만들고 ON CONFLICT DO NOTHING
--     → 같은 사용자에게 다시 실행해도 중복 생성되지 않는다.
--  4) DROP / TRUNCATE / 전체 DELETE 없음. 기존 데이터를 건드리지 않는다.
--  5) 날짜는 모두 "오늘(Asia/Seoul)" 기준 상대값 → 시간이 지나도 시나리오가 유지된다.
--
-- 적용: Supabase 대시보드 > SQL Editor 에 붙여넣고, v_raw 를 채운 뒤 실행.
-- 제거: docs/DEMO_DATA.md 의 "샘플만 제거" 절차를 직접 실행 (여기엔 없음).
-- =====================================================================

do $$
declare
  -- ↓↓↓ 여기에 대상 테스트 사용자 UUID 를 입력하세요 (auth.users.id) ↓↓↓
  v_raw    text := 'PUT-YOUR-TEST-USER-UUID-HERE';
  -- ↑↑↑ 자리표시자가 그대로면 아래에서 실행이 중단됩니다 ↑↑↑

  v_uid    uuid;
  v_today  date := (now() at time zone 'Asia/Seoul')::date;
  v_mstart date := date_trunc('month', (now() at time zone 'Asia/Seoul'))::date;
  v_cust   int;
  v_trade  int;
begin
  if v_raw = 'PUT-YOUR-TEST-USER-UUID-HERE' or length(coalesce(v_raw, '')) = 0 then
    raise exception '대상 테스트 사용자 UUID 를 v_raw 에 입력한 뒤 다시 실행하세요.';
  end if;

  begin
    v_uid := v_raw::uuid;
  exception when others then
    raise exception 'v_raw 가 올바른 UUID 형식이 아닙니다: %', v_raw;
  end;

  if not exists (select 1 from auth.users where id = v_uid) then
    raise exception '해당 UUID 의 사용자가 auth.users 에 없습니다: %', v_uid;
  end if;

  -- ================================================================
  -- 고객 18명
  --   fv = 최초 방문일 (오늘로부터 N일 전)
  --   lc = 마지막 연락일 (오늘로부터 N일 전, -1 이면 없음)
  --   ev = 다음 이벤트 예정일 (오늘로부터 N일 후, 음수=지남, -999=없음)
  -- ================================================================
  insert into public.customers
    (id, owner_id, name, phone, inflow_channel, first_visit_date,
     purchase_purposes, last_contact_date, next_event_date, memo)
  select
    md5(v_uid::text || ':demo-customer:' || v.slug)::uuid,
    v_uid,
    v.name,
    v.phone,
    v.channel::public.inflow_channel,
    v_today - v.fv,
    v.purposes,
    case when v.lc < 0  then null else v_today - v.lc end,
    case when v.ev = -999 then null else v_today + v.ev end,
    v.memo
  from (values
    ('c01','데모 강토리','010-9900-0001','REFERRAL',
       array['FIRST_BIRTHDAY']::public.purchase_purpose[], 40, 30, 5,
       '[DEMO] 돌반지 문의 · 7일 이내 이벤트'),
    ('c02','데모 남해린','010-9900-0002','NAVER_PLACE',
       array['FIRST_BIRTHDAY']::public.purchase_purpose[], 200, 190, 20,
       '[DEMO] 거래 없음 · 180일 이상 미방문'),
    ('c03','데모 도하준','010-9900-0003','CARROT_MARKET',
       array['FIRST_BIRTHDAY','INVESTMENT']::public.purchase_purpose[], 90, -1, 0,
       '[DEMO] 복수 목적 · 이벤트 오늘 · 연락기록 없음'),
    ('c04','데모 류가온','010-9900-0004','WALK_IN',
       array['FIRST_BIRTHDAY','OTHER']::public.purchase_purpose[], 100, 95, -10,
       '[DEMO] 복수 목적 · 이벤트 지남'),
    ('c05','데모 문서아','010-9900-0005','OTHER',
       array['FIRST_BIRTHDAY','WEDDING']::public.purchase_purpose[], 35, 20, 25,
       '[DEMO] 복수 목적 · 8~30일 이벤트'),
    ('c06','데모 박도윤','010-9900-0006','NAVER_PLACE',
       array['INVESTMENT']::public.purchase_purpose[], 300, 100, -999,
       '[DEMO] 90일 이상 미방문 · 이벤트 없음'),
    ('c07','데모 서지호','010-9900-0007','REFERRAL',
       array['INVESTMENT']::public.purchase_purpose[], 45, 10, 3,
       '[DEMO] 7일 이내 이벤트'),
    ('c08','데모 안유찬','010-9900-0008','CARROT_MARKET',
       array['INVESTMENT','SELLING']::public.purchase_purpose[], 220, -1, -30,
       '[DEMO] 복수 목적 · 이벤트 지남 · 연락기록 없음 · 90일 이상 미방문'),
    ('c09','데모 오세라','010-9900-0009','WALK_IN',
       array['INVESTMENT']::public.purchase_purpose[], 30, 5, 15,
       '[DEMO] 8~30일 이벤트'),
    ('c10','데모 유하람','010-9900-0010','OTHER',
       array['INVESTMENT']::public.purchase_purpose[], 500, 400, -999,
       '[DEMO] 거래 없음 · 180일 이상 미방문 · 이벤트 없음'),
    ('c11','데모 이준서','010-9900-0011','CARROT_MARKET',
       array['SELLING']::public.purchase_purpose[], 50, 40, 6,
       '[DEMO] 7일 이내 이벤트'),
    ('c12','데모 임채원','010-9900-0012','NAVER_PLACE',
       array['SELLING']::public.purchase_purpose[], 95, 60, 28,
       '[DEMO] 8~30일 이벤트'),
    ('c13','데모 장시우','010-9900-0013','REFERRAL',
       array['SELLING']::public.purchase_purpose[], 130, -1, -5,
       '[DEMO] 이벤트 지남 · 연락기록 없음'),
    ('c14','데모 전보름','010-9900-0014','WALK_IN',
       array['SELLING','WEDDING']::public.purchase_purpose[], 40, 35, -999,
       '[DEMO] 복수 목적 · 이벤트 없음'),
    ('c15','데모 정해원','010-9900-0015','OTHER',
       array['SELLING']::public.purchase_purpose[], 400, 380, 12,
       '[DEMO] 90일 이상 미방문 · 8~30일 이벤트'),
    ('c16','데모 조가율','010-9900-0016','NAVER_PLACE',
       array['WEDDING']::public.purchase_purpose[], 25, 15, 2,
       '[DEMO] 7일 이내 이벤트'),
    ('c17','데모 채민재','010-9900-0017','REFERRAL',
       array['WEDDING']::public.purchase_purpose[], 70, 55, -20,
       '[DEMO] 이벤트 지남'),
    ('c18','데모 한소율','010-9900-0018','CARROT_MARKET',
       array['WEDDING','INVESTMENT']::public.purchase_purpose[], 55, -1, 22,
       '[DEMO] 복수 목적 · 8~30일 이벤트 · 연락기록 없음')
  ) as v(slug, name, phone, channel, purposes, fv, lc, ev, memo)
  on conflict (id) do nothing;

  -- ================================================================
  -- 거래 24건
  --   dkey: TM0/TM1/TM2 = 이번 달, LM/LM2 = 지난달, OLD1~3 = 그 이전
  --   trade_date 는 항상 first_visit_date 이후, 미래 아님
  -- ================================================================
  insert into public.trade_records
    (id, owner_id, customer_id, trade_type, item_type,
     purity, weight, amount, trade_date, memo)
  select
    md5(v_uid::text || ':demo-trade:' || v.slug)::uuid,
    v_uid,
    md5(v_uid::text || ':demo-customer:' || v.cust)::uuid,
    v.ttype::public.trade_type,
    v.itype::public.item_type,
    v.purity,
    v.weight,
    v.amount,
    case v.dkey
      when 'TM0'  then least(v_today, v_mstart + 3)
      when 'TM1'  then least(v_today, v_mstart + 8)
      when 'TM2'  then least(v_today, v_mstart + 13)
      when 'LM'   then v_mstart - 12
      when 'LM2'  then v_mstart - 6
      when 'OLD1' then v_mstart - 40
      when 'OLD2' then v_mstart - 100
      when 'OLD3' then v_mstart - 130
    end,
    v.memo
  from (values
    ('t01','c01','SALE','GOLD_24K_JEWELRY', 99.99, 3.750,  420000, 'TM1',  '[DEMO] 돌반지 24K'),
    ('t02','c03','SALE','GOLD_BAR',          99.99, 3.750,  380000, 'OLD1', '[DEMO] 골드바 1돈'),
    ('t03','c03','SALE','GOLD_24K_JEWELRY', 99.99, 1.875,  240000, 'OLD1', '[DEMO] 순금 반지 (같은 날)'),
    ('t04','c04','SALE','GOLD_24K_JEWELRY', 99.99, 3.750,  410000, 'OLD1', '[DEMO] 돌반지'),
    ('t05','c05','SALE','GOLD_18K',          75.00, 5.200, 1250000, 'TM0',  '[DEMO] 18K 예물 세트'),
    ('t06','c06','SALE','GOLD_BAR',          99.99, 37.500,4200000, 'OLD2', '[DEMO] 골드바 10돈'),
    ('t07','c06','SALE','GOLD_BAR',          99.99, 18.750,2100000, 'OLD3', '[DEMO] 골드바 5돈'),
    ('t08','c07','SALE','GOLD_BAR',          99.99, 7.500,  850000, 'TM2',  '[DEMO] 골드바 2돈'),
    ('t09','c08','PURCHASE','GOLD_18K',      75.00, 12.300,1800000, 'OLD3', '[DEMO] 18K 매입'),
    ('t10','c08','PURCHASE','SILVER',        92.50, 50.000,  90000, 'OLD2', '[DEMO] 은 매입'),
    ('t11','c09','SALE','GOLD_BAR',          99.99, 3.750,  430000, 'TM0',  '[DEMO] 골드바 1돈'),
    ('t12','c11','PURCHASE','GOLD_14K',      58.50, 8.400,  620000, 'TM1',  '[DEMO] 14K 매입'),
    ('t13','c12','PURCHASE','GOLD_18K',      75.00, 15.000,2200000, 'LM',   '[DEMO] 18K 매입'),
    ('t14','c12','PURCHASE','GOLD_24K_JEWELRY',99.99,6.200, 780000, 'OLD1', '[DEMO] 순금 매입'),
    ('t15','c13','PURCHASE','SILVER',        92.50, 120.000,210000, 'OLD1', '[DEMO] 은 대량 매입'),
    ('t16','c13','PURCHASE','OTHER',         null,  15.000,  95000, 'LM2',  '[DEMO] 기타 금속 매입'),
    ('t17','c14','PURCHASE','GOLD_14K',      58.50, 5.600,  410000, 'TM2',  '[DEMO] 14K 매입'),
    ('t18','c15','PURCHASE','GOLD_BAR',      99.99, 18.750,2050000, 'OLD3', '[DEMO] 골드바 매입'),
    ('t19','c15','PURCHASE','GOLD_18K',      75.00, 9.100, 1300000, 'OLD2', '[DEMO] 18K 매입'),
    ('t20','c16','SALE','GOLD_18K',          75.00, 6.400, 1520000, 'TM0',  '[DEMO] 18K 예물'),
    ('t21','c16','SALE','GOLD_24K_JEWELRY', 99.99, 3.750,  460000, 'TM0',  '[DEMO] 순금 예물 (같은 날)'),
    ('t22','c17','SALE','GOLD_18K',          75.00, 5.800, 1380000, 'LM',   '[DEMO] 18K 예물'),
    ('t23','c18','SALE','GOLD_BAR',          99.99, 3.750,  405000, 'LM',   '[DEMO] 골드바 1돈'),
    ('t24','c18','SALE','GOLD_18K',          75.00, 4.200,  990000, 'TM1',  '[DEMO] 18K')
  ) as v(slug, cust, ttype, itype, purity, weight, amount, dkey, memo)
  on conflict (id) do nothing;

  select count(*) into v_cust
    from public.customers where owner_id = v_uid and memo like '[DEMO]%';
  select count(*) into v_trade
    from public.trade_records where owner_id = v_uid and memo like '[DEMO]%';

  raise notice '샘플 적용 완료 — 이 사용자의 [DEMO] 고객 % 명, [DEMO] 거래 % 건.', v_cust, v_trade;
end $$;
