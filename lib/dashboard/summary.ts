import {
  PURCHASE_PURPOSES,
  type ItemType,
  type PurchasePurpose,
  type TradeType,
} from "@/lib/types/database";

export type RecentTrade = {
  id: string;
  customer_id: string;
  customer_name: string;
  trade_type: TradeType;
  item_type: ItemType;
  /** numeric → 문자열 (정밀도 유지) */
  amount: string;
  trade_date: string;
};

export type DashboardSummary = {
  customerCount: number;
  monthSaleAmount: string;
  monthPurchaseAmount: string;
  purposeCounts: Record<PurchasePurpose, number>;
  upcomingEventCount: number;
  recentTrades: RecentTrade[];
};

function toCount(value: unknown): number {
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) && n >= 0 ? Math.floor(n) : 0;
}

/** DB 가 내려준 numeric 문자열/숫자를 안전한 십진 문자열로. 없으면 "0". */
function toAmountString(value: unknown): string {
  if (typeof value === "string" && /^-?\d+(\.\d+)?$/.test(value)) return value;
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return "0";
}

const TRADE_TYPES_SET = new Set<TradeType>(["SALE", "PURCHASE"]);

function isRecentTrade(value: unknown): value is RecentTrade {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.id === "string" &&
    typeof v.customer_id === "string" &&
    typeof v.customer_name === "string" &&
    typeof v.trade_date === "string" &&
    TRADE_TYPES_SET.has(v.trade_type as TradeType)
  );
}

/**
 * `dashboard_summary()` RPC 의 jsonb 응답을 타입 있는 값으로 정규화한다.
 * 누락·null·형식 오류는 0 / 빈 값으로 안전하게 채운다.
 */
export function normalizeDashboardSummary(raw: unknown): DashboardSummary {
  const r = (typeof raw === "object" && raw !== null ? raw : {}) as Record<
    string,
    unknown
  >;

  const rawPurpose =
    typeof r.purpose_counts === "object" && r.purpose_counts !== null
      ? (r.purpose_counts as Record<string, unknown>)
      : {};

  const purposeCounts = Object.fromEntries(
    PURCHASE_PURPOSES.map((p) => [p, toCount(rawPurpose[p])]),
  ) as Record<PurchasePurpose, number>;

  const recentTrades = Array.isArray(r.recent_trades)
    ? r.recent_trades
        .filter(isRecentTrade)
        .map((t) => ({
          id: t.id,
          customer_id: t.customer_id,
          customer_name: t.customer_name,
          trade_type: t.trade_type,
          item_type: t.item_type,
          amount: toAmountString((t as Record<string, unknown>).amount),
          trade_date: t.trade_date,
        }))
        .slice(0, 5)
    : [];

  return {
    customerCount: toCount(r.customer_count),
    monthSaleAmount: toAmountString(r.month_sale_amount),
    monthPurchaseAmount: toAmountString(r.month_purchase_amount),
    purposeCounts,
    upcomingEventCount: toCount(r.upcoming_event_count),
    recentTrades,
  };
}
