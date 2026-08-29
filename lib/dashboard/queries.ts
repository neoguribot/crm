import "server-only";

import type { QueryResult } from "@/lib/customers/queries";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  normalizeDashboardSummary,
  type DashboardSummary,
} from "@/lib/dashboard/summary";

/**
 * 대시보드 요약을 한 번의 RPC 호출로 가져온다.
 * 집계는 전부 PostgreSQL(dashboard_summary())에서 수행하며,
 * 거래 데이터를 브라우저로 내려 합산하지 않는다.
 * RLS(SECURITY INVOKER)로 로그인 사용자의 데이터만 집계된다.
 */
export async function getDashboardSummary(): Promise<
  QueryResult<DashboardSummary>
> {
  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase.rpc("dashboard_summary");

  if (error) {
    console.error("[dashboard] 요약 조회 실패:", error.message);
    return {
      ok: false,
      error: "대시보드 정보를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.",
    };
  }

  return { ok: true, data: normalizeDashboardSummary(data) };
}
