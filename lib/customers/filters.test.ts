import { describe, expect, it } from "vitest";

import {
  buildCustomerSearchParams,
  hasActiveFilters,
  parseCustomerFilters,
  SEARCH_MAX_LENGTH,
} from "@/lib/customers/filters";

describe("parseCustomerFilters", () => {
  it("빈 파라미터는 기본값", () => {
    expect(parseCustomerFilters({})).toEqual({
      q: "",
      purpose: null,
      channel: null,
      inactiveDays: null,
    });
  });

  it("검색어 앞뒤 공백 제거", () => {
    expect(parseCustomerFilters({ q: "  김철수  " }).q).toBe("김철수");
  });

  it("검색어 길이 상한 적용", () => {
    const long = "가".repeat(SEARCH_MAX_LENGTH + 50);
    expect(parseCustomerFilters({ q: long }).q.length).toBe(SEARCH_MAX_LENGTH);
  });

  it("허용된 구매목적·유입경로만 수용", () => {
    expect(parseCustomerFilters({ purpose: "FIRST_BIRTHDAY" }).purpose).toBe(
      "FIRST_BIRTHDAY",
    );
    expect(parseCustomerFilters({ purpose: "예물" }).purpose).toBeNull();
    expect(parseCustomerFilters({ purpose: "NOPE" }).purpose).toBeNull();
    expect(parseCustomerFilters({ channel: "CARROT_MARKET" }).channel).toBe(
      "CARROT_MARKET",
    );
    expect(parseCustomerFilters({ channel: "hack" }).channel).toBeNull();
  });

  it("inactiveDays 는 30/90/180/365 만", () => {
    expect(parseCustomerFilters({ inactiveDays: "90" }).inactiveDays).toBe(90);
    expect(parseCustomerFilters({ inactiveDays: "45" }).inactiveDays).toBeNull();
    expect(parseCustomerFilters({ inactiveDays: "-30" }).inactiveDays).toBeNull();
    expect(parseCustomerFilters({ inactiveDays: "abc" }).inactiveDays).toBeNull();
    expect(parseCustomerFilters({ inactiveDays: "" }).inactiveDays).toBeNull();
  });

  it("배열 파라미터는 첫 값만", () => {
    expect(parseCustomerFilters({ q: ["김", "이"] }).q).toBe("김");
  });

  it("알 수 없는 파라미터는 무시", () => {
    const parsed = parseCustomerFilters({ evil: "1", page: "99" });
    expect(parsed).toEqual({
      q: "",
      purpose: null,
      channel: null,
      inactiveDays: null,
    });
  });
});

describe("buildCustomerSearchParams", () => {
  it("빈 값·기본값은 넣지 않는다", () => {
    expect(
      buildCustomerSearchParams({
        q: "",
        purpose: null,
        channel: null,
        inactiveDays: null,
      }).toString(),
    ).toBe("");
  });

  it("설정된 값만 직렬화", () => {
    const qs = buildCustomerSearchParams({
      q: "김",
      purpose: "FIRST_BIRTHDAY",
      channel: null,
      inactiveDays: 90,
    });
    expect(qs.get("q")).toBe("김");
    expect(qs.get("purpose")).toBe("FIRST_BIRTHDAY");
    expect(qs.get("inactiveDays")).toBe("90");
    expect(qs.has("channel")).toBe(false);
  });

  it("parse ↔ build 왕복", () => {
    const original = { q: "이영희", channel: "WALK_IN" as const };
    const qs = buildCustomerSearchParams({
      q: "이영희",
      purpose: null,
      channel: "WALK_IN",
      inactiveDays: null,
    });
    const parsed = parseCustomerFilters(Object.fromEntries(qs));
    expect(parsed.q).toBe(original.q);
    expect(parsed.channel).toBe(original.channel);
  });
});

describe("hasActiveFilters", () => {
  it("아무 조건 없으면 false", () => {
    expect(
      hasActiveFilters({ q: "", purpose: null, channel: null, inactiveDays: null }),
    ).toBe(false);
  });

  it("하나라도 있으면 true", () => {
    expect(
      hasActiveFilters({ q: "김", purpose: null, channel: null, inactiveDays: null }),
    ).toBe(true);
  });
});
