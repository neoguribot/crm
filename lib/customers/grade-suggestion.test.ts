import { describe, expect, it } from "vitest";
import { suggestGrade } from "./grade-suggestion";

describe("suggestGrade", () => {
  it("suggests 일반 below 3,000,000", () => {
    expect(suggestGrade(0)).toBe("일반");
    expect(suggestGrade(2_999_999)).toBe("일반");
  });
  it("suggests 우수 between 3,000,000 and 10,000,000", () => {
    expect(suggestGrade(3_000_000)).toBe("우수");
    expect(suggestGrade(9_999_999)).toBe("우수");
  });
  it("suggests VIP at or above 10,000,000", () => {
    expect(suggestGrade(10_000_000)).toBe("VIP");
    expect(suggestGrade(50_000_000)).toBe("VIP");
  });
});
