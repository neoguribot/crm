-- =====================================================================
-- demo_data.sql  —  발표용 가상 샘플 데이터 (고객 18명 / 거래 24건 / 일정 6건)
--
-- ⚠️ 모든 데이터는 완전한 가상 정보다. 실제 개인정보가 아니다.
--    이름은 전부 "데모 " 로 시작하고, 비고는 전부 "[DEMO]" 로 시작한다.
--
-- 현재 스키마(0025 기준) 반영: 성별/완료여부 필드, 거래구분·거래품목 정수
-- 코드화, customer_events(일정) 테이블, 빈도·매출 2축 라벨(frequency_label/
-- revenue_label), 추천인(referred_by_customer_id), 유입경로·방문목적 "기타"
-- 세부내용(inflow_channel_detail/purchase_purpose_detail, 0022). 방문 목적·
-- 유입 경로는 0008 이후 어휘(PURCHASE/GOLD_BAR/STONE_PRODUCT/CUSTOM_JEWELRY/
-- OTHER 등) 사용.
--
-- 안전장치:
--  1) 아래 v_raw 에 대상 테스트 사용자 UUID 를 넣지 않으면 실행이 중단된다.
--  2) UUID 형식이 아니거나 auth.users 에 없는 사용자면 중단된다.
--  3) 고객·거래·일정 id 를 (사용자 UUID + 슬러그) 해시로 만들고
--     ON CONFLICT DO NOTHING → 같은 사용자에게 다시 실행해도 중복 생성되지 않는다.
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
  v_event  int;
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

  -- 사용자 프로필(목표값) — auth.users 트리거로 이미 생성됐을 수 있으므로 upsert.
  insert into public.users (id, name, monthly_sales_goal)
  values (v_uid, '데모 사장님', 50000000)
  on conflict (id) do update set monthly_sales_goal = excluded.monthly_sales_goal;

  -- ================================================================
  -- 고객 18명
  --   fv = 첫 거래일자 (오늘로부터 N일 전, -1 이면 없음)
  --   lc = 마지막 연락일 (오늘로부터 N일 전, -1 이면 없음)
  --   gender: 0=모름, 1=남성, 2=여성
  --   freq: 빈도 라벨(신규/단골, 실제 거래 건수와 맞춤) / rev: 매출 라벨(일반/우수/VIP, 수동 지정값)
  -- ================================================================
  insert into public.customers
    (id, owner_id, name, phone, gender, address, inflow_channels,
     purchase_purposes, frequency_label, revenue_label, registered_on,
     first_trade_date, last_contact_date, memo)
  select
    md5(v_uid::text || ':demo-customer:' || v.slug)::uuid,
    v_uid,
    v.name,
    v.phone,
    (case v.gender when 'MALE' then 1 when 'FEMALE' then 2 else 0 end),
    v.address,
    v.channels,
    v.purposes,
    v.freq,
    v.rev,
    v_today - v.reg,
    case when v.fv < 0 then null else v_today - v.fv end,
    case when v.lc < 0 then null else v_today - v.lc end,
    v.memo
  from (values
    ('c01','데모 강토리','010-9900-0001','FEMALE','대전 서구', array['REFERRAL'],
       array['STONE_PRODUCT'], '신규', 'VIP', 40, 30, 30, '[DEMO] 돌반지 문의'),
    ('c02','데모 남해린','010-9900-0002','FEMALE','대전 중구', array['NAVER_PLACE'],
       array['STONE_PRODUCT'], '신규', '일반', 200, 190, 190, '[DEMO] 거래 없음 · 오래 미방문'),
    ('c03','데모 도하준','010-9900-0003','MALE','대전 유성구', array['CARROT_MARKET'],
       array['STONE_PRODUCT','GOLD_BAR'], '단골', '우수', 90, -1, -1, '[DEMO] 복수 목적 · 연락기록 없음'),
    ('c04','데모 류가온','010-9900-0004','UNKNOWN', null, array['WALK_IN'],
       array['STONE_PRODUCT','OTHER'], '신규', '일반', 100, 95, 95, '[DEMO] 복수 목적'),
    ('c05','데모 문서아','010-9900-0005','FEMALE','대전 대덕구', array['OTHER'],
       array['STONE_PRODUCT','CUSTOM_JEWELRY'], '신규', '일반', 35, 20, 20, '[DEMO] 복수 목적'),
    ('c06','데모 박도윤','010-9900-0006','MALE',null, array['NAVER_PLACE'],
       array['GOLD_BAR'], '단골', 'VIP', 300, 100, 100, '[DEMO] 오래 미방문'),
    ('c07','데모 서지호','010-9900-0007','MALE',null, array['REFERRAL'],
       array['GOLD_BAR'], '신규', '일반', 45, 10, 10, '[DEMO]'),
    ('c08','데모 안유찬','010-9900-0008','MALE',null, array['CARROT_MARKET'],
       array['GOLD_BAR','PURCHASE'], '단골', '일반', 220, -1, -1, '[DEMO] 복수 목적 · 연락기록 없음 · 오래 미방문'),
    ('c09','데모 오세라','010-9900-0009','FEMALE',null, array['WALK_IN'],
       array['GOLD_BAR'], '신규', '일반', 30, 5, 5, '[DEMO]'),
    ('c10','데모 유하람','010-9900-0010','UNKNOWN',null, array['OTHER'],
       array['GOLD_BAR'], '신규', '일반', 500, -1, -1, '[DEMO] 거래 없음 · 오래 미방문'),
    ('c11','데모 이준서','010-9900-0011','MALE',null, array['CARROT_MARKET'],
       array['PURCHASE'], '신규', '일반', 50, 40, 40, '[DEMO]'),
    ('c12','데모 임채원','010-9900-0012','FEMALE',null, array['NAVER_PLACE'],
       array['PURCHASE'], '단골', '우수', 95, 60, 60, '[DEMO]'),
    ('c13','데모 장시우','010-9900-0013','MALE',null, array['REFERRAL'],
       array['PURCHASE'], '단골', '일반', 130, -1, -1, '[DEMO] 연락기록 없음'),
    ('c14','데모 전보름','010-9900-0014','FEMALE',null, array['WALK_IN'],
       array['PURCHASE','OTHER'], '신규', '일반', 40, 35, 35, '[DEMO] 복수 목적'),
    ('c15','데모 정해원','010-9900-0015','MALE',null, array['OTHER'],
       array['PURCHASE'], '단골', 'VIP', 400, 380, 380, '[DEMO] 오래 미방문'),
    ('c16','데모 조가율','010-9900-0016','FEMALE',null, array['NAVER_PLACE'],
       array['CUSTOM_JEWELRY'], '단골', '우수', 25, 15, 15, '[DEMO]'),
    ('c17','데모 채민재','010-9900-0017','MALE',null, array['REFERRAL'],
       array['CUSTOM_JEWELRY'], '신규', '일반', 70, 55, 55, '[DEMO]'),
    ('c18','데모 한소율','010-9900-0018','FEMALE',null, array['CARROT_MARKET'],
       array['CUSTOM_JEWELRY','GOLD_BAR'], '단골', '일반', 55, -1, -1, '[DEMO] 복수 목적 · 연락기록 없음')
  ) as v(slug, name, phone, gender, address, channels, purposes, freq, rev, reg, fv, lc, memo)
  on conflict (id) do nothing;

  -- 추천인 예시(자기참조 FK) — 고객 등록 후 별도 UPDATE로 연결한다.
  update public.customers set referred_by_customer_id =
    md5(v_uid::text || ':demo-customer:c01')::uuid
    where id = md5(v_uid::text || ':demo-customer:c07')::uuid
      and owner_id = v_uid;
  update public.customers set referred_by_customer_id =
    md5(v_uid::text || ':demo-customer:c03')::uuid
    where id = md5(v_uid::text || ':demo-customer:c11')::uuid
      and owner_id = v_uid;
  update public.customers set referred_by_customer_id =
    md5(v_uid::text || ':demo-customer:c05')::uuid
    where id = md5(v_uid::text || ':demo-customer:c14')::uuid
      and owner_id = v_uid;

  -- 유입경로·방문목적을 "기타"로 선택한 고객의 세부 내용(0022 컬럼).
  update public.customers set purchase_purpose_detail = '시계 수리 문의'
    where id = md5(v_uid::text || ':demo-customer:c04')::uuid and owner_id = v_uid;
  update public.customers set inflow_channel_detail = '동네 전단지'
    where id = md5(v_uid::text || ':demo-customer:c05')::uuid and owner_id = v_uid;
  update public.customers set inflow_channel_detail = '길 지나가다 방문'
    where id = md5(v_uid::text || ':demo-customer:c10')::uuid and owner_id = v_uid;
  update public.customers set purchase_purpose_detail = '반지 사이즈 수선'
    where id = md5(v_uid::text || ':demo-customer:c14')::uuid and owner_id = v_uid;
  update public.customers set inflow_channel_detail = '라디오 광고'
    where id = md5(v_uid::text || ':demo-customer:c15')::uuid and owner_id = v_uid;

  -- ================================================================
  -- 거래 24건 (거래구분/거래품목/완료여부는 정수 코드로 저장)
  --   dkey: TM0/TM1/TM2 = 이번 달, LM/LM2 = 지난달, OLD1~3 = 그 이전
  -- ================================================================
  insert into public.trade_records
    (id, owner_id, customer_id, trade_type, item_type,
     unit_price, weight, amount, status, trade_date, memo)
  select
    md5(v_uid::text || ':demo-trade:' || v.slug)::uuid,
    v_uid,
    md5(v_uid::text || ':demo-customer:' || v.cust)::uuid,
    (case v.ttype when 'SALE' then 1 when 'PURCHASE' then 2 end),
    (case v.itype
       when 'GOLD_BAR' then 1
       when 'SILVER_BAR' then 2
       when 'GOLD_24K' then 3
       when 'GOLD_24K_STONE' then 4
       when 'GOLD_24K_JEWELRY' then 5
       when 'GOLD_18K' then 6
       when 'GOLD_14K' then 7
       when 'SILVER_JEWELRY' then 8
       when 'SILVER_SPOON' then 9
       when 'SCRAP_GOLD' then 10
       else 99
     end),
    v.unit_price,
    v.weight,
    v.amount,
    1, -- 완료
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
    ('t01','c01','SALE','GOLD_24K_JEWELRY', 112000, 3.750,  420000, 'TM1',  '[DEMO] 돌반지 24K'),
    ('t02','c03','SALE','GOLD_BAR',         101000, 3.750,  380000, 'OLD1', '[DEMO] 골드바 1돈'),
    ('t03','c03','SALE','GOLD_24K_JEWELRY', 128000, 1.875,  240000, 'OLD1', '[DEMO] 순금 반지 (같은 날)'),
    ('t04','c04','SALE','GOLD_24K_JEWELRY', 109000, 3.750,  410000, 'OLD1', '[DEMO] 돌반지'),
    ('t05','c05','SALE','GOLD_18K',         240000, 5.200, 1250000, 'TM0',  '[DEMO] 18K 주얼리 맞춤'),
    ('t06','c06','SALE','GOLD_BAR',         112000, 37.500,4200000, 'OLD2', '[DEMO] 골드바 10돈'),
    ('t07','c06','SALE','GOLD_BAR',         112000, 18.750,2100000, 'OLD3', '[DEMO] 골드바 5돈'),
    ('t08','c07','SALE','GOLD_BAR',         113000, 7.500,  850000, 'TM2',  '[DEMO] 골드바 2돈'),
    ('t09','c08','PURCHASE','GOLD_18K',     146000, 12.300,1800000, 'OLD3', '[DEMO] 18K 매입'),
    ('t10','c08','PURCHASE','SILVER_JEWELRY', 1800, 50.000,   90000, 'OLD2', '[DEMO] 은제품 매입'),
    ('t11','c09','SALE','GOLD_BAR',         114000, 3.750,  430000, 'TM0',  '[DEMO] 골드바 1돈'),
    ('t12','c11','PURCHASE','GOLD_14K',      73000, 8.400,  620000, 'TM1',  '[DEMO] 14K 매입'),
    ('t13','c12','PURCHASE','GOLD_18K',     146000, 15.000,2200000, 'LM',   '[DEMO] 18K 매입'),
    ('t14','c12','PURCHASE','GOLD_24K_JEWELRY',125000,6.200, 780000, 'OLD1', '[DEMO] 순금 매입'),
    ('t15','c13','PURCHASE','SILVER_JEWELRY',  1750, 120.000,210000, 'OLD1', '[DEMO] 은제품 대량 매입'),
    ('t16','c13','PURCHASE','SCRAP_GOLD',     6300, 15.000,   95000, 'LM2',  '[DEMO] 치금 매입'),
    ('t17','c14','PURCHASE','GOLD_14K',      73000, 5.600,  410000, 'TM2',  '[DEMO] 14K 매입'),
    ('t18','c15','PURCHASE','GOLD_BAR',     109000, 18.750,2050000, 'OLD3', '[DEMO] 골드바 매입'),
    ('t19','c15','PURCHASE','GOLD_18K',     143000, 9.100, 1300000, 'OLD2', '[DEMO] 18K 매입'),
    ('t20','c16','SALE','GOLD_18K',         237000, 6.400, 1520000, 'TM0',  '[DEMO] 18K 주얼리 맞춤'),
    ('t21','c16','SALE','GOLD_24K_JEWELRY', 123000, 3.750,  460000, 'TM0',  '[DEMO] 순금 주얼리 (같은 날)'),
    ('t22','c17','SALE','GOLD_18K',         238000, 5.800, 1380000, 'LM',   '[DEMO] 18K 주얼리'),
    ('t23','c18','SALE','GOLD_BAR',         108000, 3.750,  405000, 'LM',   '[DEMO] 골드바 1돈'),
    ('t24','c18','SALE','GOLD_18K',         236000, 4.200,  990000, 'TM1',  '[DEMO] 18K')
  ) as v(slug, cust, ttype, itype, unit_price, weight, amount, dkey, memo)
  on conflict (id) do nothing;

  -- ================================================================
  -- 일정 6건 (customer_events) — ev: 오늘로부터 N일 후(음수=지남)
  --   type: 1=문의 2=예약 3=맞춤주문 4=재방문 5=시세알림 6=생일 7=안부
  -- ================================================================
  insert into public.customer_events
    (id, owner_id, customer_id, event_type, event_date, memo, is_done)
  select
    md5(v_uid::text || ':demo-event:' || v.slug)::uuid,
    v_uid,
    md5(v_uid::text || ':demo-customer:' || v.cust)::uuid,
    v.etype,
    v_today + v.ev,
    v.memo,
    false
  from (values
    ('e01','c01', 1, 5,  '[DEMO] 돌반지 상담 예정'),
    ('e02','c03', 4, 0,  '[DEMO] 재방문 오늘'),
    ('e03','c05', 3, 25, '[DEMO] 주얼리 맞춤 출고 예정'),
    ('e04','c08', 4, -10,'[DEMO] 재방문 리마인드 (지남)'),
    ('e05','c16', 6, 2,  '[DEMO] 생일 축하 연락'),
    ('e06','c17', 7, -20,'[DEMO] 안부 연락 (지남)')
  ) as v(slug, cust, etype, ev, memo)
  on conflict (id) do nothing;

  select count(*) into v_cust
    from public.customers where owner_id = v_uid and memo like '[DEMO]%';
  select count(*) into v_trade
    from public.trade_records where owner_id = v_uid and memo like '[DEMO]%';
  select count(*) into v_event
    from public.customer_events where owner_id = v_uid and memo like '[DEMO]%';

  raise notice '샘플 적용 완료 — 이 사용자의 [DEMO] 고객 % 명, 거래 % 건, 일정 % 건.', v_cust, v_trade, v_event;
end $$;
