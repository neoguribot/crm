import { describe, expect, it } from "vitest";

import { summarizeHoldings, totalHoldings } from "@/lib/trades/holdings";

describe("summarizeHoldings", () => {
  it("SALE 거래만 품목별로 센다", () => {
    const holdings = summarizeHoldings([
      { trade_type: "SALE", item_type: "GOLD_BAR" },
      { trade_type: "SALE", item_type: "GOLD_BAR" },
      { trade_type: "SALE", item_type: "GOLD_14K" },
      { trade_type: "PURCHASE", item_type: "GOLD_BAR" }, // 제외
      { trade_type: "PURCHASE", item_type: "SILVER" }, // 제외
    ]);
    expect(holdings).toEqual([
      { itemType: "GOLD_BAR", count: 2 },
      { itemType: "GOLD_14K", count: 1 },
    ]);
  });

  it("건수 0 품목은 빠지고, ITEM_TYPES 순서를 따른다", () => {
    const holdings = summarizeHoldings([
      { trade_type: "SALE", item_type: "SILVER" },
      { trade_type: "SALE", item_type: "GOLD_BAR" },
    ]);
    expect(holdings.map((h) => h.itemType)).toEqual(["GOLD_BAR", "SILVER"]);
  });

  it("알 수 없는 품목·빈 입력은 무시", () => {
    expect(
      summarizeHoldings([{ trade_type: "SALE", item_type: "PLATINUM" }]),
    ).toEqual([]);
    expect(summarizeHoldings([])).toEqual([]);
  });
});

describe("totalHoldings", () => {
  it("총 개수 합산", () => {
    expect(
      totalHoldings([
        { itemType: "GOLD_BAR", count: 2 },
        { itemType: "SILVER", count: 3 },
      ]),
    ).toBe(5);
    expect(totalHoldings([])).toBe(0);
  });
});
