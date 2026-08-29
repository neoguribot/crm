/**
 * 데이터베이스 스키마에 대응하는 TypeScript 타입.
 *
 * 실제 Supabase 프로젝트가 연결되면 `supabase gen types typescript` 로 자동 생성한
 * 타입으로 대체하거나 병행할 수 있다. 지금은 마이그레이션 SQL 과 손으로 맞춘 정의다.
 *
 * numeric 컬럼(amount, weight, purity)은 `string` 으로 다룬다.
 * 이유와 처리 원칙은 supabase/README.md 의 "numeric 값 처리" 항목 참고.
 */

// ─────────────────────────────────────────────────────────────
// 선택값 (DB enum 과 동일한 코드 문자열). 한국어 표시명은 lib/labels.ts 에서 분리 관리.
// ─────────────────────────────────────────────────────────────

export const INFLOW_CHANNELS = [
  "CARROT_MARKET",
  "NAVER_PLACE",
  "REFERRAL",
  "WALK_IN",
  "OTHER",
] as const;
export type InflowChannel = (typeof INFLOW_CHANNELS)[number];

export const PURCHASE_PURPOSES = [
  "WEDDING",
  "FIRST_BIRTHDAY",
  "INVESTMENT",
  "SELLING",
  "OTHER",
] as const;
export type PurchasePurpose = (typeof PURCHASE_PURPOSES)[number];

export const TRADE_TYPES = ["SALE", "PURCHASE"] as const;
export type TradeType = (typeof TRADE_TYPES)[number];

/**
 * 거래 품목. 0007 에서 enum → text 로 바뀌어 앱에서 검증한다.
 * PURCHASE_ONLY_ITEM_TYPES 는 매입(PURCHASE) 거래에서만 선택할 수 있다.
 */
export const ITEM_TYPES = [
  "GOLD_BAR",
  "SILVER_BAR",
  "GOLD_24K",
  "GOLD_24K_STONE",
  "GOLD_24K_JEWELRY",
  "GOLD_18K",
  "GOLD_14K",
  "SILVER_JEWELRY",
  "OTHER",
  "SILVER_SPOON",
  "SCRAP_GOLD",
] as const;
export type ItemType = (typeof ITEM_TYPES)[number];

/** 매입 거래에서만 쓰는 품목. */
export const PURCHASE_ONLY_ITEM_TYPES = ["SILVER_SPOON", "SCRAP_GOLD"] as const;
export type PurchaseOnlyItemType = (typeof PURCHASE_ONLY_ITEM_TYPES)[number];

export function isPurchaseOnlyItemType(value: string): value is PurchaseOnlyItemType {
  return (PURCHASE_ONLY_ITEM_TYPES as readonly string[]).includes(value);
}

/** 해당 거래구분에서 이 품목을 쓸 수 있는지. */
export function isItemTypeAllowedForTradeType(
  itemType: string,
  tradeType: TradeType,
): boolean {
  if (tradeType === "PURCHASE") return true;
  return !isPurchaseOnlyItemType(itemType);
}

/** 고객 영업 단계 (파이프라인 보드의 컬럼). 순서대로. */
export const CUSTOMER_STAGES = [
  "NEW_INQUIRY",
  "CONSULTING",
  "QUOTE_SENT",
  "PURCHASE_CONFIRMED",
  "AFTER_CARE",
] as const;
export type CustomerStage = (typeof CUSTOMER_STAGES)[number];

// ─────────────────────────────────────────────────────────────
// 행(Row) 타입 — SELECT 결과
// ─────────────────────────────────────────────────────────────

/** `YYYY-MM-DD` 형식의 날짜 문자열 */
export type IsoDateString = string;
/** ISO 8601 타임스탬프 문자열 */
export type IsoTimestampString = string;
/** PostgreSQL numeric 값. 정밀도 보존을 위해 문자열로 다룬다. */
export type NumericString = string;

export interface Customer {
  id: string;
  owner_id: string;
  name: string;
  phone: string;
  inflow_channel: InflowChannel;
  stage: CustomerStage;
  first_visit_date: IsoDateString;
  purchase_purposes: PurchasePurpose[];
  last_contact_date: IsoDateString | null;
  next_event_date: IsoDateString | null;
  memo: string | null;
  created_at: IsoTimestampString;
  updated_at: IsoTimestampString;
}

export interface TradeRecord {
  id: string;
  owner_id: string;
  customer_id: string;
  trade_type: TradeType;
  item_type: ItemType;
  /** 품목이 OTHER 일 때 세부 내용 */
  item_detail: string | null;
  /** 기준 단가(원). 0007 이전 행은 null. */
  unit_price: NumericString | null;
  weight: NumericString;
  /** 총 금액(원) */
  amount: NumericString;
  trade_date: IsoDateString;
  memo: string | null;
  created_at: IsoTimestampString;
  updated_at: IsoTimestampString;
}

/** 고객별 매수 희망 가격 (금 1돈 기준, 원). 고객당 최대 1건. */
export interface PriceTarget {
  id: string;
  owner_id: string;
  customer_id: string;
  target_price_per_don: NumericString;
  note: string | null;
  created_at: IsoTimestampString;
  updated_at: IsoTimestampString;
}

export const GOLD_PRICE_SOURCES = ["MANUAL", "API"] as const;
export type GoldPriceSource = (typeof GOLD_PRICE_SOURCES)[number];

/** 일자별 순금(24K) 시세, 1돈(3.75g) 기준. owner + price_date 유니크. */
export interface GoldPrice {
  id: string;
  owner_id: string;
  price_date: IsoDateString;
  price_per_don: NumericString;
  source: GoldPriceSource;
  created_at: IsoTimestampString;
  updated_at: IsoTimestampString;
}

export const NOTIFICATION_TYPES = ["PRICE_TARGET_REACHED"] as const;
export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

/** 직원(owner)별 알림. */
export interface NotificationRow {
  id: string;
  owner_id: string;
  type: string;
  customer_id: string | null;
  title: string;
  body: string | null;
  dedupe_key: string | null;
  read_at: IsoTimestampString | null;
  dismissed_at: IsoTimestampString | null;
  created_at: IsoTimestampString;
}

// ─────────────────────────────────────────────────────────────
// 입력 타입 — owner_id 는 클라이언트가 보내지 않는다.
// DB 기본값 auth.uid() 로 채워지고 RLS 로 검증된다.
// ─────────────────────────────────────────────────────────────

export interface CustomerCreateInput {
  name: string;
  phone: string;
  inflow_channel: InflowChannel;
  first_visit_date: IsoDateString;
  purchase_purposes: PurchasePurpose[];
  last_contact_date?: IsoDateString | null;
  next_event_date?: IsoDateString | null;
  memo?: string | null;
}

export type CustomerUpdateInput = Partial<CustomerCreateInput>;

export interface TradeRecordCreateInput {
  customer_id: string;
  trade_type: TradeType;
  item_type: ItemType;
  item_detail?: string | null;
  unit_price: NumericString;
  weight: NumericString;
  amount: NumericString;
  trade_date: IsoDateString;
  memo?: string | null;
}

/** 거래의 소속 고객은 수정하지 않는다. */
export type TradeRecordUpdateInput = Partial<
  Omit<TradeRecordCreateInput, "customer_id">
>;
