"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  customerFormDataToObject,
  customerInputSchema,
  flattenFieldErrors,
} from "@/lib/validation/customer";
import type { CustomerFormState } from "@/app/customers/form-state";

const GENERIC_ERROR =
  "저장 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.";

/** 신규 고객 등록. 성공 시 상세 페이지로 이동. */
export async function createCustomer(
  _prev: CustomerFormState,
  formData: FormData,
): Promise<CustomerFormState> {
  const raw = customerFormDataToObject(formData);
  const parsed = customerInputSchema.safeParse(raw);

  if (!parsed.success) {
    return {
      status: "error",
      message: "입력값을 확인해 주세요.",
      fieldErrors: flattenFieldErrors(parsed.error),
      values: raw,
    };
  }

  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  // owner_id 는 보내지 않는다. DB 기본값 auth.uid() 로 채워지고 RLS 로 검증된다.
  const { data, error } = await supabase
    .from("customers")
    .insert({
      name: parsed.data.name,
      phone: parsed.data.phone,
      inflow_channel: parsed.data.inflow_channel,
      first_visit_date: parsed.data.first_visit_date,
      purchase_purposes: parsed.data.purchase_purposes,
      last_contact_date: parsed.data.last_contact_date,
      next_event_date: parsed.data.next_event_date,
      memo: parsed.data.memo,
    })
    .select("id")
    .single();

  if (error || !data) {
    console.error("[customers] 등록 실패:", error?.message);
    return {
      status: "error",
      message: GENERIC_ERROR,
      fieldErrors: {},
      values: raw,
    };
  }

  revalidatePath("/customers");
  redirect(`/customers/${data.id}`);
}

/** 고객 수정. 성공 시 상세 페이지로 이동. id/owner_id/created_at 은 수정 대상에서 제외. */
export async function updateCustomer(
  id: string,
  _prev: CustomerFormState,
  formData: FormData,
): Promise<CustomerFormState> {
  const raw = customerFormDataToObject(formData);
  const parsed = customerInputSchema.safeParse(raw);

  if (!parsed.success) {
    return {
      status: "error",
      message: "입력값을 확인해 주세요.",
      fieldErrors: flattenFieldErrors(parsed.error),
      values: raw,
    };
  }

  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  // RLS 의 customers_update_own 정책이 owner 불일치 행을 대상에서 제외한다.
  // updated_at 은 DB 트리거가 갱신한다.
  const { data, error } = await supabase
    .from("customers")
    .update({
      name: parsed.data.name,
      phone: parsed.data.phone,
      inflow_channel: parsed.data.inflow_channel,
      first_visit_date: parsed.data.first_visit_date,
      purchase_purposes: parsed.data.purchase_purposes,
      last_contact_date: parsed.data.last_contact_date,
      next_event_date: parsed.data.next_event_date,
      memo: parsed.data.memo,
    })
    .eq("id", id)
    .select("id")
    .maybeSingle();

  if (error) {
    console.error("[customers] 수정 실패:", error.message);
    return { status: "error", message: GENERIC_ERROR, fieldErrors: {}, values: raw };
  }

  if (!data) {
    // 다른 사용자의 고객이거나 없는 ID → 정보 노출 없이 처리
    return {
      status: "error",
      message: "해당 고객을 수정할 수 없습니다.",
      fieldErrors: {},
      values: raw,
    };
  }

  revalidatePath("/customers");
  revalidatePath(`/customers/${id}`);
  redirect(`/customers/${id}`);
}
