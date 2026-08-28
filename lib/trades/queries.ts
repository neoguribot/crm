import "server-only";

import type { ItemType, TradeType } from "@/lib/types/database";
import type { QueryResult } from "@/lib/customers/queries";
import { createServerSupabaseClient } from "@/lib/supabase/server";

/**
 * 목록 표시에 필요한 컬럼만. numeric 컬럼은 `::text` 로 캐스팅해
 * 정밀도 손실 없이 문자열로 받는다.
 */
const LIST_COLUMNS =
  "id, trade_type, item_type, purity::text, weight::text, amount::text, trade_date, memo, created_at";

export type TradeRecordListItem = {
  id: string;
  trade_type: TradeType;
  item_type: ItemType;
  purity: string | null;
  weight: string;
  amount: string;
  trade_date: string;
  memo: string | null;
  created_at: string;
};

/**
 * 특정 고객의 거래 이력. 거래일 내림차순, 같은 날짜면 생성일시 내림차순.
 * RLS(trade_records_select_own)로 로그인 사용자의 거래만 반환된다.
 * 호출 전에 해당 고객이 사용자 소유인지 확인해야 한다(getCustomerById 로).
 */
export async function listTradeRecordsByCustomer(
  customerId: string,
): Promise<QueryResult<TradeRecordListItem[]>> {
  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase
    .from("trade_records")
    .select(LIST_COLUMNS)
    .eq("customer_id", customerId)
    .order("trade_date", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[trades] 거래 이력 조회 실패:", error.message);
    return {
      ok: false,
      error: "거래 이력을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.",
    };
  }

  return { ok: true, data: (data ?? []) as unknown as TradeRecordListItem[] };
}
