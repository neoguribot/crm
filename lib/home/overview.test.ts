import { describe, expect, it } from "vitest";

import { buildHomeOverview, type HomeCustomerRow } from "@/lib/home/overview";

const TODAY = "2026-08-28";

function row(over: Partial<HomeCustomerRow>): HomeCustomerRow {
  return {
    id: "c",
    name: "고객",
    stage: "NEW_INQUIRY",
    next_event_date: null,
    created_at: "2026-01-01T00:00:00Z",
    ...over,
  };
}

describe("buildHomeOverview", () => {
  it("빈 입력은 모두 0", () => {
    const o = buildHomeOverview([], TODAY);
    expect(o.customerCount).toBe(0);
    expect(o.remindDueCount).toBe(0);
    expect(o.overdueCount).toBe(0);
    expect(o.upcomingCount).toBe(0);
    expect(o.recent).toEqual([]);
    expect(o.stageCounts).toEqual({
      NEW_INQUIRY: 0,
      CONSULTING: 0,
      QUOTE_SENT: 0,
      PURCHASE_CONFIRMED: 0,
      AFTER_CARE: 0,
    });
  });

  it("단계별 고객 수를 센다 (stage null 은 제외)", () => {
    const o = buildHomeOverview(
      [
        row({ id: "1", stage: "NEW_INQUIRY" }),
        row({ id: "2", stage: "NEW_INQUIRY" }),
        row({ id: "3", stage: "CONSULTING" }),
        row({ id: "4", stage: null }),
      ],
      TODAY,
    );
    expect(o.customerCount).toBe(4);
    expect(o.stageCounts.NEW_INQUIRY).toBe(2);
    expect(o.stageCounts.CONSULTING).toBe(1);
    expect(o.stageCounts.QUOTE_SENT).toBe(0);
  });

  it("리마인드 카운트: 기한 지남 / 30일 이내 / 기본 목록", () => {
    const o = buildHomeOverview(
      [
        row({ id: "1", next_event_date: "2026-08-20" }), // 지남
        row({ id: "2", next_event_date: "2026-08-30" }), // 2일 후
        row({ id: "3", next_event_date: "2026-09-20" }), // 23일 후
        row({ id: "4", next_event_date: "2026-12-01" }), // 30일 이후
        row({ id: "5", next_event_date: null }), // 예정 없음
      ],
      TODAY,
    );
    expect(o.overdueCount).toBe(1);
    expect(o.upcomingCount).toBe(2);
    expect(o.remindDueCount).toBe(3); // 지남 + 30일 이내 전부
  });

  it("최근 등록 고객은 created_at 내림차순 최대 5명", () => {
    const rows = Array.from({ length: 7 }, (_, i) =>
      row({
        id: `c${i}`,
        name: `고객${i}`,
        created_at: `2026-02-0${i + 1}T00:00:00Z`,
      }),
    );
    const o = buildHomeOverview(rows, TODAY);
    expect(o.recent).toHaveLength(5);
    expect(o.recent[0].id).toBe("c6");
    expect(o.recent[4].id).toBe("c2");
  });
});
