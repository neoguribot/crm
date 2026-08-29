import { describe, expect, it } from "vitest";

import {
  groupByStage,
  isCustomerStage,
  nextStage,
  prevStage,
  stageIndex,
} from "@/lib/customers/pipeline";

describe("isCustomerStage", () => {
  it("허용된 단계만 통과", () => {
    expect(isCustomerStage("NEW_INQUIRY")).toBe(true);
    expect(isCustomerStage("AFTER_CARE")).toBe(true);
    expect(isCustomerStage("신규 문의")).toBe(false);
    expect(isCustomerStage("HACK")).toBe(false);
    expect(isCustomerStage(null)).toBe(false);
    expect(isCustomerStage(3)).toBe(false);
  });
});

describe("nextStage / prevStage", () => {
  it("다음 단계", () => {
    expect(nextStage("NEW_INQUIRY")).toBe("CONSULTING");
    expect(nextStage("QUOTE_SENT")).toBe("PURCHASE_CONFIRMED");
  });
  it("마지막 단계의 다음은 null", () => {
    expect(nextStage("AFTER_CARE")).toBeNull();
  });
  it("이전 단계", () => {
    expect(prevStage("CONSULTING")).toBe("NEW_INQUIRY");
  });
  it("첫 단계의 이전은 null", () => {
    expect(prevStage("NEW_INQUIRY")).toBeNull();
  });
  it("stageIndex", () => {
    expect(stageIndex("NEW_INQUIRY")).toBe(0);
    expect(stageIndex("AFTER_CARE")).toBe(4);
  });
});

describe("groupByStage", () => {
  it("모든 단계 키가 존재하고, 없는 단계는 빈 배열", () => {
    const groups = groupByStage([
      { id: "a", stage: "NEW_INQUIRY" as const },
      { id: "b", stage: "NEW_INQUIRY" as const },
      { id: "c", stage: "QUOTE_SENT" as const },
    ]);
    expect(groups.NEW_INQUIRY.map((x) => x.id)).toEqual(["a", "b"]);
    expect(groups.QUOTE_SENT.map((x) => x.id)).toEqual(["c"]);
    expect(groups.CONSULTING).toEqual([]);
    expect(groups.PURCHASE_CONFIRMED).toEqual([]);
    expect(groups.AFTER_CARE).toEqual([]);
  });

  it("입력 순서를 유지", () => {
    const groups = groupByStage([
      { id: "1", stage: "CONSULTING" as const },
      { id: "2", stage: "CONSULTING" as const },
      { id: "3", stage: "CONSULTING" as const },
    ]);
    expect(groups.CONSULTING.map((x) => x.id)).toEqual(["1", "2", "3"]);
  });

  it("빈 입력", () => {
    const groups = groupByStage([]);
    expect(Object.keys(groups)).toHaveLength(5);
    expect(groups.NEW_INQUIRY).toEqual([]);
  });
});
