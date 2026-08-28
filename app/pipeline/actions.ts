"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { isCustomerStage } from "@/lib/customers/pipeline";

export type StageUpdateResult = { ok: boolean; error: string | null };

/**
 * 고객의 영업 단계(stage)를 바꾼다. 버튼 이동과 드래그 앤 드롭이 모두 이 액션을 쓴다.
 * - 서버에서 인증 사용자 확인 → stage 값 검증 → 자기 고객만 수정(RLS).
 * - updated_at 은 DB 트리거가 갱신 → 파이프라인 정렬(최근 이동 위로)에 반영된다.
 */
export async function updateCustomerStage(
  customerId: string,
  nextStage: string,
): Promise<StageUpdateResult> {
  if (!isCustomerStage(nextStage)) {
    return { ok: false, error: "알 수 없는 단계입니다." };
  }

  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  const { data, error } = await supabase
    .from("customers")
    .update({ stage: nextStage })
    .eq("id", customerId)
    .select("id")
    .maybeSingle();

  if (error) {
    console.error("[pipeline] 단계 변경 실패:", error.message);
    return {
      ok: false,
      error: "단계를 변경하지 못했습니다. 잠시 후 다시 시도해 주세요.",
    };
  }
  if (!data) {
    return { ok: false, error: "해당 고객을 수정할 수 없습니다." };
  }

  revalidatePath("/pipeline");
  revalidatePath(`/customers/${customerId}`);
  return { ok: true, error: null };
}
