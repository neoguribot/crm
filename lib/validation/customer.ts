import { z } from "zod";

import { isValidIsoDate, todayInSeoul } from "@/lib/date";
import {
  CUSTOMER_GRADES,
  GENDERS,
  INFLOW_CHANNELS,
  PURCHASE_PURPOSES,
} from "@/lib/types/database";

const MEMO_MAX = 1000;
const ADDRESS_MAX = 200;
const EMAIL_MAX = 254;

/** `YYYY-MM-DD` 문자열이며 실제 유효한 날짜. */
const isoDate = z
  .string()
  .trim()
  .refine(isValidIsoDate, { message: "올바른 날짜(YYYY-MM-DD)를 입력해 주세요." });

/** 선택 날짜: 빈 문자열은 null 로 변환한다. */
const optionalIsoDate = z
  .string()
  .trim()
  .transform((v) => (v === "" ? null : v))
  .nullable()
  .refine((v) => v === null || isValidIsoDate(v), {
    message: "올바른 날짜(YYYY-MM-DD)를 입력해 주세요.",
  });

const optionalText = (max: number, label: string) =>
  z
    .string()
    .trim()
    .max(max, `${label}은(는) ${max}자 이내로 입력해 주세요.`)
    .transform((v) => (v === "" ? null : v))
    .nullable();

export const customerInputSchema = z
  .object({
    name: z
      .string()
      .transform((v) => v.trim())
      .pipe(
        z
          .string()
          .min(1, "이름을 입력해 주세요.")
          .max(50, "이름은 50자 이내로 입력해 주세요."),
      ),
    phone: z
      .string()
      .transform((v) => v.trim())
      .pipe(
        z
          .string()
          .min(1, "연락처를 입력해 주세요.")
          .max(20, "연락처는 20자 이내로 입력해 주세요.")
          .regex(/\d/, "연락처에 숫자를 포함해 주세요."),
      ),
    email: z
      .string()
      .trim()
      .transform((v) => (v === "" ? null : v))
      .nullable()
      .refine(
        (v) => v === null || (v.length <= EMAIL_MAX && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)),
        "올바른 이메일 주소를 입력해 주세요.",
      ),
    birth_date: optionalIsoDate,
    gender: z.enum(GENDERS).default("UNKNOWN"),
    address: optionalText(ADDRESS_MAX, "주소"),
    inflow_channels: z
      .array(z.enum(INFLOW_CHANNELS))
      .min(1, "유입 경로를 1개 이상 선택해 주세요."),
    purchase_purposes: z.array(z.enum(PURCHASE_PURPOSES)).default([]),
    grade: z
      .string()
      .trim()
      .transform((v) => (v === "" ? null : v))
      .nullable()
      .refine(
        (v) => v === null || (CUSTOMER_GRADES as readonly string[]).includes(v),
        "올바른 등급을 선택해 주세요.",
      ) as z.ZodType<(typeof CUSTOMER_GRADES)[number] | null>,
    registered_on: isoDate,
    first_trade_date: optionalIsoDate,
    last_contact_date: optionalIsoDate,
    memo: optionalText(MEMO_MAX, "비고"),
  })
  .superRefine((val, ctx) => {
    const today = todayInSeoul();

    for (const [key, label] of [
      ["registered_on", "고객 등록일"],
      ["birth_date", "생년월일"],
      ["first_trade_date", "첫 거래일자"],
      ["last_contact_date", "마지막 연락일"],
    ] as const) {
      const value = val[key];
      if (value && value > today) {
        ctx.addIssue({
          code: "custom",
          path: [key],
          message: `${label}은(는) 오늘 이후로 지정할 수 없습니다.`,
        });
      }
    }
  });

export type CustomerInput = z.infer<typeof customerInputSchema>;

/** FormData → 평면 객체. 검증은 호출 측에서 customerInputSchema 로 수행한다. */
export function customerFormDataToObject(formData: FormData) {
  return {
    name: String(formData.get("name") ?? ""),
    phone: String(formData.get("phone") ?? ""),
    email: String(formData.get("email") ?? ""),
    birth_date: String(formData.get("birth_date") ?? ""),
    gender: String(formData.get("gender") ?? "UNKNOWN"),
    address: String(formData.get("address") ?? ""),
    inflow_channels: formData.getAll("inflow_channels").map(String),
    purchase_purposes: formData.getAll("purchase_purposes").map(String),
    grade: String(formData.get("grade") ?? ""),
    registered_on: String(formData.get("registered_on") ?? ""),
    first_trade_date: String(formData.get("first_trade_date") ?? ""),
    last_contact_date: String(formData.get("last_contact_date") ?? ""),
    memo: String(formData.get("memo") ?? ""),
  };
}

export { flattenFieldErrors } from "@/lib/validation/flatten";
