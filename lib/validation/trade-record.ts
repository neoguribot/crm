import { z } from "zod";

import { isValidIsoDate, todayInSeoul } from "@/lib/date";
import {
  hasMaxDecimalPlaces,
  isDecimalString,
  isZeroDecimalString,
} from "@/lib/number";
import { ITEM_TYPES, TRADE_TYPES } from "@/lib/types/database";

const MEMO_MAX = 1000;

/** 필수 양수 십진 문자열 (0 불가). */
const positiveDecimal = (label: string, decimalPlaces: number) =>
  z
    .string()
    .trim()
    .min(1, `${label}을(를) 입력해 주세요.`)
    .refine(isDecimalString, `${label}은(는) 올바른 숫자여야 합니다.`)
    .refine(
      (v) => hasMaxDecimalPlaces(v, decimalPlaces),
      `${label}은(는) 소수점 ${decimalPlaces}자리까지 입력할 수 있습니다.`,
    )
    .refine((v) => !isZeroDecimalString(v), `${label}은(는) 0보다 커야 합니다.`);

export const tradeRecordInputSchema = z.object({
  trade_type: z.enum(TRADE_TYPES, { message: "거래구분을 선택해 주세요." }),
  item_type: z.enum(ITEM_TYPES, { message: "품목을 선택해 주세요." }),
  // 금액: numeric(15,0) — 정수 원. 최대 15자리.
  amount: z
    .string()
    .trim()
    .min(1, "금액을 입력해 주세요.")
    .refine((v) => /^\d+$/.test(v), "금액은 0 이상의 정수여야 합니다.")
    .refine((v) => v.replace(/^0+/, "").length <= 15, "금액이 너무 큽니다."),
  // 중량: numeric(10,3), 0보다 커야 함.
  weight: positiveDecimal("중량", 3),
  // 순도: 선택. 값이 있으면 0 초과, 100 이하 (DB CHECK 와 동일 단위 = 퍼센트).
  purity: z
    .string()
    .trim()
    .transform((v) => (v === "" ? null : v))
    .nullable()
    .refine(
      (v) => v === null || isDecimalString(v),
      "순도는 올바른 숫자여야 합니다.",
    )
    .refine(
      (v) => v === null || hasMaxDecimalPlaces(v, 2),
      "순도는 소수점 2자리까지 입력할 수 있습니다.",
    )
    .refine(
      (v) => v === null || !isZeroDecimalString(v),
      "순도는 0보다 커야 합니다.",
    )
    .refine(
      (v) => v === null || Number(v) <= 100,
      "순도는 100 이하여야 합니다.",
    ),
  trade_date: z
    .string()
    .trim()
    .refine(isValidIsoDate, "올바른 날짜(YYYY-MM-DD)를 입력해 주세요.")
    .refine(
      (v) => v <= todayInSeoul(),
      "거래일은 오늘 이후로 지정할 수 없습니다.",
    ),
  memo: z
    .string()
    .trim()
    .max(MEMO_MAX, `비고는 ${MEMO_MAX}자 이내로 입력해 주세요.`)
    .transform((v) => (v === "" ? null : v))
    .nullable(),
});

export type TradeRecordInput = z.infer<typeof tradeRecordInputSchema>;

export function tradeRecordFormDataToObject(formData: FormData) {
  return {
    trade_type: String(formData.get("trade_type") ?? ""),
    item_type: String(formData.get("item_type") ?? ""),
    amount: String(formData.get("amount") ?? ""),
    weight: String(formData.get("weight") ?? ""),
    purity: String(formData.get("purity") ?? ""),
    trade_date: String(formData.get("trade_date") ?? ""),
    memo: String(formData.get("memo") ?? ""),
  };
}
