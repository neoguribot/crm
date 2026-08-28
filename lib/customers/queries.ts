import "server-only";

import type { Customer } from "@/lib/types/database";
import { createServerSupabaseClient } from "@/lib/supabase/server";

/** 목록에 필요한 컬럼만. */
const LIST_COLUMNS =
  "id, name, phone, inflow_channel, purchase_purposes, first_visit_date, created_at";

/** 상세/수정에 필요한 컬럼. */
const DETAIL_COLUMNS =
  "id, name, phone, inflow_channel, purchase_purposes, first_visit_date, last_contact_date, next_event_date, memo, created_at, updated_at";

export type CustomerListItem = Pick<
  Customer,
  | "id"
  | "name"
  | "phone"
  | "inflow_channel"
  | "purchase_purposes"
  | "first_visit_date"
  | "created_at"
>;

export type CustomerDetail = Pick<
  Customer,
  | "id"
  | "name"
  | "phone"
  | "inflow_channel"
  | "purchase_purposes"
  | "first_visit_date"
  | "last_contact_date"
  | "next_event_date"
  | "memo"
  | "created_at"
  | "updated_at"
>;

export type QueryResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };

/**
 * 로그인 사용자의 고객 목록. 최신 등록순.
 * RLS 로 owner_id 가 자동으로 걸리므로 여기서 별도 필터하지 않는다.
 */
export async function listCustomers(): Promise<QueryResult<CustomerListItem[]>> {
  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase
    .from("customers")
    .select(LIST_COLUMNS)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[customers] 목록 조회 실패:", error.message);
    return { ok: false, error: "고객 목록을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요." };
  }

  return { ok: true, data: (data ?? []) as CustomerListItem[] };
}

/**
 * 고객 1건. 다른 사용자의 고객이거나 없는 ID 면 RLS 로 행이 안 나오므로
 * null 을 반환한다(호출 측에서 notFound 처리).
 */
export async function getCustomerById(
  id: string,
): Promise<QueryResult<CustomerDetail | null>> {
  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase
    .from("customers")
    .select(DETAIL_COLUMNS)
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("[customers] 상세 조회 실패:", error.message);
    return { ok: false, error: "고객 정보를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요." };
  }

  return { ok: true, data: (data as CustomerDetail | null) ?? null };
}
