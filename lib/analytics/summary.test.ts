import { describe, expect, it } from "vitest";
import { normalizeCustomerAnalytics } from "./summary";

describe("normalizeCustomerAnalytics", () => {
  it("완전한 응답을 그대로 매핑한다", () => {
    const a = normalizeCustomerAnalytics({
      customer_count: 18,
      gender_counts: { UNKNOWN: 2, MALE: 8, FEMALE: 8 },
      grade_counts: { VIP: 3, 우수: 4, 일반: 5, 신규: 2, NONE: 4 },
      channel_counts: { CARROT_MARKET: 3, WALK_IN: 5 },
      age_bucket_counts: { "20s": 4, "30s": 6, UNKNOWN: 2 },
      top_customers: [
        { id: "c1", name: "홍길동", total_amount: "5000000", trade_count: 3 },
      ],
    });
    expect(a.customerCount).toBe(18);
    expect(a.genderCounts.MALE).toBe(8);
    expect(a.gradeCounts.VIP).toBe(3);
    expect(a.gradeCounts.NONE).toBe(4);
    expect(a.channelCounts.CARROT_MARKET).toBe(3);
    expect(a.channelCounts.NAVER_PLACE).toBe(0);
    expect(a.ageBucketCounts["20s"]).toBe(4);
    expect(a.ageBucketCounts["10s"]).toBe(0);
    expect(a.topCustomers).toHaveLength(1);
    expect(a.topCustomers[0].totalAmount).toBe("5000000");
  });

  it("빈/잘못된 응답은 0과 빈 배열로 안전하게 채운다", () => {
    const a = normalizeCustomerAnalytics({});
    expect(a.customerCount).toBe(0);
    expect(a.genderCounts.MALE).toBe(0);
    expect(a.topCustomers).toEqual([]);

    expect(normalizeCustomerAnalytics(null).customerCount).toBe(0);
    expect(normalizeCustomerAnalytics(undefined).customerCount).toBe(0);
  });

  it("불완전한 top_customers 항목은 제외한다", () => {
    const a = normalizeCustomerAnalytics({
      top_customers: [
        { id: "c1", name: "정상", total_amount: "1000", trade_count: 1 },
        { id: "bad" },
      ],
    });
    expect(a.topCustomers).toHaveLength(1);
  });
});
