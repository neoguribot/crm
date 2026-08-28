import "server-only";

import { todayInSeoul } from "@/lib/date";
import type { QueryResult } from "@/lib/customers/queries";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  buildHomeOverview,
  type HomeCustomerRow,
  type HomeOverview,
} from "@/lib/home/overview";

const COLUMNS = "id, name, stage, next_event_date, created_at";
/** stage 컬럼(마이그레이션 0004) 이 아직 없는 DB 를 위한 폴백. */
const COLUMNS_NO_STAGE = "id, name, next_event_date, created_at";

/**
 * 홈 화면 요약. 고객 1회 조회로 단계별 수·리마인드 수·최근 등록을 모두 계산한다.
 * - RLS(customers_select_own)로 로그인 사용자의 고객만.
 * - 리마인드 상태는 저장하지 않고 next_event_date 로 계산.
 */
export async function getHomeOverview(): Promise<QueryResult<HomeOverview>> {
  const supabase = await createServerSupabaseClient();

  let { data, error } = await supabase.from("customers").select(COLUMNS);

  if (error?.code === "42703") {
    // 0004 미적용 DB: stage 없이 다시 조회한다.
    ({ data, error } = await supabase.from("customers").select(COLUMNS_NO_STAGE));
  }

  if (error) {
    console.error("[home] 요약 조회 실패:", error.message);
    return {
      ok: false,
      error: "홈 정보를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.",
    };
  }

  const rows = ((data ?? []) as Record<string, unknown>[]).map<HomeCustomerRow>(
    (r) => ({
      id: String(r.id),
      name: String(r.name ?? ""),
      stage: (r.stage as HomeCustomerRow["stage"] | undefined) ?? null,
      next_event_date: (r.next_event_date as string | null) ?? null,
      created_at: String(r.created_at ?? ""),
    }),
  );

  return { ok: true, data: buildHomeOverview(rows, todayInSeoul()) };
}
