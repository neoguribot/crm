import { ITEM_TYPES, type ItemType } from "@/lib/types/database";

export type ItemHolding = {
  itemType: ItemType;
  /** 그 품목의 판매(SALE) 거래 건수 = 보유 개수 */
  count: number;
};

type TradeLike = { trade_type: string; item_type: string };

/**
 * 고객이 매장에서 구매(SALE)한 거래를 품목별로 집계한다.
 * - 거래 1건 = 1개. 같은 품목의 여러 거래는 합산.
 * - 매입(PURCHASE, 매장이 고객에게서 사들인 것)은 "보유" 로 세지 않는다.
 * - 건수 0 인 품목은 제외. 결과 순서는 ITEM_TYPES 순서를 따른다.
 */
export function summarizeHoldings(
  trades: readonly TradeLike[],
): ItemHolding[] {
  const counts = new Map<ItemType, number>();

  for (const t of trades) {
    if (t.trade_type !== "SALE") continue;
    if (!(ITEM_TYPES as readonly string[]).includes(t.item_type)) continue;
    const it = t.item_type as ItemType;
    counts.set(it, (counts.get(it) ?? 0) + 1);
  }

  return ITEM_TYPES.filter((it) => counts.has(it)).map((it) => ({
    itemType: it,
    count: counts.get(it) ?? 0,
  }));
}

/** 보유 품목 총 개수. */
export function totalHoldings(holdings: readonly ItemHolding[]): number {
  return holdings.reduce((sum, h) => sum + h.count, 0);
}
