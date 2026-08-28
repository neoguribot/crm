import { describe, expect, it } from "vitest";

import { todayInSeoul } from "@/lib/date";
import { tradeRecordInputSchema } from "@/lib/validation/trade-record";

const base = {
  trade_type: "SALE",
  item_type: "GOLD_BAR",
  amount: "350000",
  weight: "3.75",
  purity: "99.99",
  trade_date: "2026-01-10",
  memo: "",
};

describe("tradeRecordInputSchema", () => {
  it("정상 판매 거래를 통과시킨다", () => {
    const parsed = tradeRecordInputSchema.parse(base);
    expect(parsed.trade_type).toBe("SALE");
    expect(parsed.amount).toBe("350000");
    expect(parsed.weight).toBe("3.75");
    expect(parsed.purity).toBe("99.99");
    expect(parsed.memo).toBeNull();
  });

  it("정상 매입 거래를 통과시킨다", () => {
    const parsed = tradeRecordInputSchema.parse({ ...base, trade_type: "PURCHASE" });
    expect(parsed.trade_type).toBe("PURCHASE");
  });

  it("빈 순도·비고를 null 로 정규화한다", () => {
    const parsed = tradeRecordInputSchema.parse({ ...base, purity: "", memo: "" });
    expect(parsed.purity).toBeNull();
    expect(parsed.memo).toBeNull();
  });

  it("중량 0 을 거부한다", () => {
    expect(tradeRecordInputSchema.safeParse({ ...base, weight: "0" }).success).toBe(false);
    expect(tradeRecordInputSchema.safeParse({ ...base, weight: "0.000" }).success).toBe(false);
  });

  it("중량 필수 — 빈 값 거부", () => {
    expect(tradeRecordInputSchema.safeParse({ ...base, weight: "" }).success).toBe(false);
  });

  it("금액 음수·소수·문자열을 거부한다", () => {
    expect(tradeRecordInputSchema.safeParse({ ...base, amount: "-1" }).success).toBe(false);
    expect(tradeRecordInputSchema.safeParse({ ...base, amount: "1000.5" }).success).toBe(false);
    expect(tradeRecordInputSchema.safeParse({ ...base, amount: "abc" }).success).toBe(false);
    expect(tradeRecordInputSchema.safeParse({ ...base, amount: "" }).success).toBe(false);
  });

  it("금액 0 은 허용한다", () => {
    expect(tradeRecordInputSchema.parse({ ...base, amount: "0" }).amount).toBe("0");
  });

  it("NaN·Infinity·지수표기 문자열을 거부한다", () => {
    for (const bad of ["NaN", "Infinity", "1e3", "0x10", "1,000"]) {
      expect(tradeRecordInputSchema.safeParse({ ...base, weight: bad }).success).toBe(false);
    }
  });

  it("순도가 0 또는 100 초과면 거부한다", () => {
    expect(tradeRecordInputSchema.safeParse({ ...base, purity: "0" }).success).toBe(false);
    expect(tradeRecordInputSchema.safeParse({ ...base, purity: "100.01" }).success).toBe(false);
  });

  it("순도 100 은 허용한다", () => {
    expect(tradeRecordInputSchema.parse({ ...base, purity: "100" }).purity).toBe("100");
  });

  it("중량 소수 4자리를 거부한다", () => {
    expect(tradeRecordInputSchema.safeParse({ ...base, weight: "3.7501" }).success).toBe(false);
  });

  it("잘못된 거래구분·품목을 거부한다", () => {
    expect(tradeRecordInputSchema.safeParse({ ...base, trade_type: "GIFT" }).success).toBe(false);
    expect(tradeRecordInputSchema.safeParse({ ...base, item_type: "PLATINUM" }).success).toBe(false);
  });

  it("존재하지 않는 거래일을 거부한다", () => {
    expect(tradeRecordInputSchema.safeParse({ ...base, trade_date: "2026-02-30" }).success).toBe(false);
  });

  it("미래 거래일을 거부한다", () => {
    expect(tradeRecordInputSchema.safeParse({ ...base, trade_date: "2999-12-31" }).success).toBe(false);
  });

  it("오늘 거래일을 허용한다", () => {
    const parsed = tradeRecordInputSchema.parse({ ...base, trade_date: todayInSeoul() });
    expect(parsed.trade_date).toBe(todayInSeoul());
  });
});
