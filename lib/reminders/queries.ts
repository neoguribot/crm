import "server-only";

import type { Customer } from "@/lib/types/database";
import { todayInSeoul } from "@/lib/date";
import type { QueryResult } from "@/lib/customers/queries";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  classifyRemindStatus,
  matchesRemindFilter,
  remindDayDelta,
  REMIND_FILTERS,
  type RemindFilter,
  type RemindStatus,
} from "@/lib/reminders/status";

/** 리마인드 화면에 필요한 컬럼만. */
const COLUMNS =
  "id, name, phone, purchase_purposes, next_event_date, last_contact_date";

type RawRow = Pick<
  Customer,
  | "id"
  | "name"
  | "phone"
  | "purchase_purposes"
  | "next_event_date"
  | "last_contact_date"
>;

export type ReminderCustomer = RawRow & {
  status: RemindStatus;
  dayDelta: number | null;
};

export type ReminderData = {
  today: string;
  /** 활성 필터로 걸러진 목록 (정렬 유지) */
  items: ReminderCustomer[];
  /** 각 필터값별 건수 + 기본 목록 건수 */
  counts: Record<RemindFilter, number> & { DEFAULT: number };
};

/**
 * 리마인드 대상 고객.
 * - 쿼리 1회. 고객별 반복 쿼리 없음.
 * - RLS(customers_select_own)로 로그인 사용자의 고객만.
 * - 리마인드 상태는 DB 에 저장하지 않고 next_event_date 로 계산.
 * - 정렬은 DB 에서: next_event_date 오름차순(null 은 뒤), 같으면 이름순.
 *   → 가장 오래 지난 기한 → 가장 가까운 예정 순으로 자연 정렬된다.
 */
export async function getReminderData(
  filter: RemindFilter | null,
): Promise<QueryResult<ReminderData>> {
  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase
    .from("customers")
    .select(COLUMNS)
    .order("next_event_date", { ascending: true, nullsFirst: false })
    .order("name", { ascending: true });

  if (error) {
    console.error("[reminders] 조회 실패:", error.message);
    return {
      ok: false,
      error: "리마인드 대상을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.",
    };
  }

  const today = todayInSeoul();
  const rows = (data ?? []) as unknown as RawRow[];

  const classified: ReminderCustomer[] = rows.map((row) => ({
    ...row,
    status: classifyRemindStatus(row.next_event_date, today),
    dayDelta: remindDayDelta(row.next_event_date, today),
  }));

  const counts = {
    DEFAULT: classified.filter((c) => matchesRemindFilter(c.status, null)).length,
  } as ReminderData["counts"];
  for (const f of REMIND_FILTERS) {
    counts[f] = classified.filter((c) => matchesRemindFilter(c.status, f)).length;
  }

  const items = classified.filter((c) => matchesRemindFilter(c.status, filter));

  return { ok: true, data: { today, items, counts } };
}
