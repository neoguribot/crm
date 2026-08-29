import { describe, expect, it } from "vitest";

import { todayInSeoul } from "@/lib/date";
import {
  customerInputSchema,
  flattenFieldErrors,
} from "@/lib/validation/customer";

const validBase = {
  name: "홍길동",
  phone: "010-1234-5678",
  inflow_channel: "CARROT_MARKET",
  first_visit_date: "2026-01-10",
  purchase_purposes: ["WEDDING", "INVESTMENT"],
  last_contact_date: "",
  next_event_date: "",
  memo: "",
};

describe("customerInputSchema", () => {
  it("정상 입력을 통과시키고 이름·연락처 공백을 제거한다", () => {
    const parsed = customerInputSchema.parse({
      ...validBase,
      name: "  홍길동  ",
      phone: "  010-1234-5678  ",
    });
    expect(parsed.name).toBe("홍길동");
    expect(parsed.phone).toBe("010-1234-5678");
    expect(parsed.purchase_purposes).toEqual(["WEDDING", "INVESTMENT"]);
  });

  it("빈 선택 날짜를 null 로 변환한다", () => {
    const parsed = customerInputSchema.parse(validBase);
    expect(parsed.last_contact_date).toBeNull();
    expect(parsed.next_event_date).toBeNull();
    expect(parsed.memo).toBeNull();
  });

  it("이름이 공백만이면 거부한다", () => {
    const result = customerInputSchema.safeParse({ ...validBase, name: "   " });
    expect(result.success).toBe(false);
  });

  it("연락처가 없으면 거부한다", () => {
    const result = customerInputSchema.safeParse({ ...validBase, phone: "" });
    expect(result.success).toBe(false);
  });

  it("알 수 없는 유입경로를 거부한다", () => {
    const result = customerInputSchema.safeParse({
      ...validBase,
      inflow_channel: "UNKNOWN",
    });
    expect(result.success).toBe(false);
  });

  it("알 수 없는 구매목적을 거부한다", () => {
    const result = customerInputSchema.safeParse({
      ...validBase,
      purchase_purposes: ["WEDDING", "NOPE"],
    });
    expect(result.success).toBe(false);
  });

  it("구매목적을 비워도 통과하고 빈 배열이 된다", () => {
    const parsed = customerInputSchema.parse({
      ...validBase,
      purchase_purposes: [],
    });
    expect(parsed.purchase_purposes).toEqual([]);
  });

  it("존재하지 않는 날짜(2026-02-30)를 거부한다", () => {
    const result = customerInputSchema.safeParse({
      ...validBase,
      first_visit_date: "2026-02-30",
    });
    expect(result.success).toBe(false);
  });

  it("미래 최초 방문일을 거부한다", () => {
    const result = customerInputSchema.safeParse({
      ...validBase,
      first_visit_date: "2999-12-31",
    });
    expect(result.success).toBe(false);
  });

  it("미래 다음 이벤트 예정일은 허용한다", () => {
    const parsed = customerInputSchema.parse({
      ...validBase,
      next_event_date: "2999-12-31",
    });
    expect(parsed.next_event_date).toBe("2999-12-31");
  });

  it("오늘 날짜의 최초 방문일을 허용한다", () => {
    const parsed = customerInputSchema.parse({
      ...validBase,
      first_visit_date: todayInSeoul(),
    });
    expect(parsed.first_visit_date).toBe(todayInSeoul());
  });

  it("메모 길이 상한을 넘으면 거부한다", () => {
    const result = customerInputSchema.safeParse({
      ...validBase,
      memo: "가".repeat(1001),
    });
    expect(result.success).toBe(false);
  });
});

describe("flattenFieldErrors", () => {
  it("필드별 첫 오류 메시지만 남긴다", () => {
    const result = customerInputSchema.safeParse({
      ...validBase,
      name: "",
      phone: "",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const errors = flattenFieldErrors(result.error);
      expect(errors.name).toBeTruthy();
      expect(errors.phone).toBeTruthy();
    }
  });
});
