import { describe, expect, it } from "vitest";

import {
  classifyRemindStatus,
  formatDayDelta,
  matchesRemindFilter,
  remindDayDelta,
} from "@/lib/reminders/status";

const TODAY = "2026-08-28";

describe("classifyRemindStatus", () => {
  it("이벤트일이 없으면 NO_EVENT", () => {
    expect(classifyRemindStatus(null, TODAY)).toBe("NO_EVENT");
  });

  it("오늘 이전이면 OVERDUE", () => {
    expect(classifyRemindStatus("2026-08-27", TODAY)).toBe("OVERDUE");
    expect(classifyRemindStatus("2025-01-01", TODAY)).toBe("OVERDUE");
  });

  it("오늘이면 WITHIN_7_DAYS", () => {
    expect(classifyRemindStatus(TODAY, TODAY)).toBe("WITHIN_7_DAYS");
  });

  it("정확히 7일 후는 WITHIN_7_DAYS", () => {
    expect(classifyRemindStatus("2026-09-04", TODAY)).toBe("WITHIN_7_DAYS");
  });

  it("정확히 8일 후는 WITHIN_30_DAYS", () => {
    expect(classifyRemindStatus("2026-09-05", TODAY)).toBe("WITHIN_30_DAYS");
  });

  it("정확히 30일 후는 WITHIN_30_DAYS", () => {
    expect(classifyRemindStatus("2026-09-27", TODAY)).toBe("WITHIN_30_DAYS");
  });

  it("31일 후는 BEYOND_30", () => {
    expect(classifyRemindStatus("2026-09-28", TODAY)).toBe("BEYOND_30");
  });

  it("월 경계를 넘어도 정확 (Asia/Seoul 날짜 문자열 기준)", () => {
    // 2026-08-28 기준 3일 후 = 2026-08-31
    expect(classifyRemindStatus("2026-08-31", TODAY)).toBe("WITHIN_7_DAYS");
  });
});

describe("remindDayDelta", () => {
  it("미래는 양수, 과거는 음수, 오늘은 0, 없으면 null", () => {
    expect(remindDayDelta("2026-08-30", TODAY)).toBe(2);
    expect(remindDayDelta("2026-08-25", TODAY)).toBe(-3);
    expect(remindDayDelta(TODAY, TODAY)).toBe(0);
    expect(remindDayDelta(null, TODAY)).toBeNull();
  });
});

describe("matchesRemindFilter", () => {
  it("null(기본) = 기한 지남 + 30일 이내", () => {
    expect(matchesRemindFilter("OVERDUE", null)).toBe(true);
    expect(matchesRemindFilter("WITHIN_7_DAYS", null)).toBe(true);
    expect(matchesRemindFilter("WITHIN_30_DAYS", null)).toBe(true);
    expect(matchesRemindFilter("BEYOND_30", null)).toBe(false);
    expect(matchesRemindFilter("NO_EVENT", null)).toBe(false);
  });

  it("ALL_UPCOMING = 7일 이내 + 30일 이내 (지남 제외)", () => {
    expect(matchesRemindFilter("OVERDUE", "ALL_UPCOMING")).toBe(false);
    expect(matchesRemindFilter("WITHIN_7_DAYS", "ALL_UPCOMING")).toBe(true);
    expect(matchesRemindFilter("WITHIN_30_DAYS", "ALL_UPCOMING")).toBe(true);
  });

  it("단일 상태 필터", () => {
    expect(matchesRemindFilter("OVERDUE", "OVERDUE")).toBe(true);
    expect(matchesRemindFilter("WITHIN_7_DAYS", "OVERDUE")).toBe(false);
    expect(matchesRemindFilter("NO_EVENT", "NO_EVENT")).toBe(true);
  });
});

describe("formatDayDelta", () => {
  it("표시 형식", () => {
    expect(formatDayDelta(null)).toBe("-");
    expect(formatDayDelta(0)).toBe("오늘");
    expect(formatDayDelta(3)).toBe("3일 남음");
    expect(formatDayDelta(-5)).toBe("5일 지남");
  });
});
