import { describe, expect, it } from "vitest";

import { todayInSeoul } from "@/lib/date";
import {
  customerInputSchema,
  flattenFieldErrors,
} from "@/lib/validation/customer";

const validBase = {
  name: "홍길동",
  phone: "010-1234-5678",
  email: "",
  birth_date: "",
  address: "",
  inflow_channels: ["CARROT_MARKET", "KAKAO_MAP"],
  purchase_purposes: ["PURCHASE", "GOLD_BAR"],
  registered_on: "2026-01-10",
  first_trade_date: "",
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
    expect(parsed.inflow_channels).toEqual(["CARROT_MARKET", "KAKAO_MAP"]);
    expect(parsed.purchase_purposes).toEqual(["PURCHASE", "GOLD_BAR"]);
  });

  it("빈 선택 항목을 null 로 변환한다", () => {
    const parsed = customerInputSchema.parse(validBase);
    expect(parsed.email).toBeNull();
    expect(parsed.birth_date).toBeNull();
    expect(parsed.address).toBeNull();
    expect(parsed.first_trade_date).toBeNull();
    expect(parsed.last_contact_date).toBeNull();
    expect(parsed.next_event_date).toBeNull();
    expect(parsed.memo).toBeNull();
  });

  it("이름이 공백만이면 거부한다", () => {
    expect(
      customerInputSchema.safeParse({ ...validBase, name: "   " }).success,
    ).toBe(false);
  });

  it("연락처가 없으면 거부한다", () => {
    expect(
      customerInputSchema.safeParse({ ...validBase, phone: "" }).success,
    ).toBe(false);
  });

  it("이메일 형식을 검증한다 (빈 값은 허용)", () => {
    expect(
      customerInputSchema.safeParse({ ...validBase, email: "not-an-email" })
        .success,
    ).toBe(false);
    expect(
      customerInputSchema.parse({ ...validBase, email: "hong@example.com" })
        .email,
    ).toBe("hong@example.com");
  });

  it("유입 경로를 1개 이상 선택해야 한다", () => {
    expect(
      customerInputSchema.safeParse({ ...validBase, inflow_channels: [] })
        .success,
    ).toBe(false);
  });

  it("알 수 없는 유입 경로·방문 목적을 거부한다", () => {
    expect(
      customerInputSchema.safeParse({
        ...validBase,
        inflow_channels: ["UNKNOWN"],
      }).success,
    ).toBe(false);
    expect(
      customerInputSchema.safeParse({
        ...validBase,
        purchase_purposes: ["PURCHASE", "NOPE"],
      }).success,
    ).toBe(false);
  });

  it("방문 목적을 비워도 통과하고 빈 배열이 된다", () => {
    expect(
      customerInputSchema.parse({ ...validBase, purchase_purposes: [] })
        .purchase_purposes,
    ).toEqual([]);
  });

  it("존재하지 않는 날짜(2026-02-30)를 거부한다", () => {
    expect(
      customerInputSchema.safeParse({
        ...validBase,
        registered_on: "2026-02-30",
      }).success,
    ).toBe(false);
  });

  it("미래 등록일·생년월일·첫 거래일자·마지막 연락일을 거부한다", () => {
    for (const key of [
      "registered_on",
      "birth_date",
      "first_trade_date",
      "last_contact_date",
    ] as const) {
      expect(
        customerInputSchema.safeParse({ ...validBase, [key]: "2999-12-31" })
          .success,
      ).toBe(false);
    }
  });

  it("미래 다음 이벤트 예정일은 허용한다", () => {
    expect(
      customerInputSchema.parse({ ...validBase, next_event_date: "2999-12-31" })
        .next_event_date,
    ).toBe("2999-12-31");
  });

  it("오늘 날짜의 등록일을 허용한다", () => {
    const parsed = customerInputSchema.parse({
      ...validBase,
      registered_on: todayInSeoul(),
    });
    expect(parsed.registered_on).toBe(todayInSeoul());
  });

  it("메모 길이 상한을 넘으면 거부한다", () => {
    expect(
      customerInputSchema.safeParse({ ...validBase, memo: "가".repeat(1001) })
        .success,
    ).toBe(false);
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
