import { REMIND_FILTERS, type RemindFilter } from "@/lib/reminders/status";

type RawSearchParams = Record<string, string | string[] | undefined>;

/**
 * URL `status` 파라미터를 검증된 필터로. 허용되지 않은 값은 null(기본 목록)로 처리.
 */
export function parseRemindFilter(sp: RawSearchParams): RemindFilter | null {
  const raw = Array.isArray(sp.status) ? sp.status[0] : sp.status;
  if (raw && (REMIND_FILTERS as readonly string[]).includes(raw)) {
    return raw as RemindFilter;
  }
  return null;
}

/** 필터를 `/reminders` 링크 href 로. 기본(null)은 파라미터 없이. */
export function remindFilterHref(filter: RemindFilter | null): string {
  return filter ? `/reminders?status=${filter}` : "/reminders";
}
