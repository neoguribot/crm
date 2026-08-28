import { z } from "zod";

import { isValidIsoDate, todayInSeoul } from "@/lib/date";
import { INFLOW_CHANNELS, PURCHASE_PURPOSES } from "@/lib/types/database";

const MEMO_MAX = 1000;

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
    inflow_channel: z.enum(INFLOW_CHANNELS, {
      message: "유입경로를 선택해 주세요.",
    }),
    first_visit_date: isoDate,
    purchase_purposes: z.array(z.enum(PURCHASE_PURPOSES)).default([]),
    last_contact_date: optionalIsoDate,
    next_event_date: optionalIsoDate,
    memo: z
      .string()
      .trim()
      .max(MEMO_MAX, `비고는 ${MEMO_MAX}자 이내로 입력해 주세요.`)
      .transform((v) => (v === "" ? null : v))
      .nullable(),
  })
  .superRefine((val, ctx) => {
    const today = todayInSeoul();

    if (val.first_visit_date > today) {
      ctx.addIssue({
        code: "custom",
        path: ["first_visit_date"],
        message: "최초 방문일은 오늘 이후로 지정할 수 없습니다.",
      });
    }

    if (val.last_contact_date && val.last_contact_date > today) {
      ctx.addIssue({
        code: "custom",
        path: ["last_contact_date"],
        message: "마지막 연락일은 오늘 이후로 지정할 수 없습니다.",
      });
    }
  });

export type CustomerInput = z.infer<typeof customerInputSchema>;

/** FormData → 평면 객체. 검증은 호출 측에서 customerInputSchema 로 수행한다. */
export function customerFormDataToObject(formData: FormData) {
  return {
    name: String(formData.get("name") ?? ""),
    phone: String(formData.get("phone") ?? ""),
    inflow_channel: String(formData.get("inflow_channel") ?? ""),
    first_visit_date: String(formData.get("first_visit_date") ?? ""),
    purchase_purposes: formData.getAll("purchase_purposes").map(String),
    last_contact_date: String(formData.get("last_contact_date") ?? ""),
    next_event_date: String(formData.get("next_event_date") ?? ""),
    memo: String(formData.get("memo") ?? ""),
  };
}

export { flattenFieldErrors } from "@/lib/validation/flatten";
