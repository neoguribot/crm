import { daysBetweenIsoDates } from "@/lib/customers/recent-visit";

/** 고객 1명의 리마인드 상태 (next_event_date 로 계산, DB 에 저장하지 않음). */
export const REMIND_STATUSES = [
  "OVERDUE",
  "WITHIN_7_DAYS",
  "WITHIN_30_DAYS",
  "BEYOND_30",
  "NO_EVENT",
] as const;
export type RemindStatus = (typeof REMIND_STATUSES)[number];

/** URL `status` 파라미터로 허용되는 필터 값. */
export const REMIND_FILTERS = [
  "OVERDUE",
  "WITHIN_7_DAYS",
  "WITHIN_30_DAYS",
  "ALL_UPCOMING",
  "NO_EVENT",
] as const;
export type RemindFilter = (typeof REMIND_FILTERS)[number];

/** 상태값 ↔ 한국어 표시명 분리. */
export const REMIND_STATUS_LABELS: Record<RemindStatus, string> = {
  OVERDUE: "기한 지남",
  WITHIN_7_DAYS: "7일 이내",
  WITHIN_30_DAYS: "30일 이내",
  BEYOND_30: "30일 이후",
  NO_EVENT: "예정 없음",
};

export const REMIND_FILTER_LABELS: Record<RemindFilter, string> = {
  OVERDUE: "기한 지남",
  WITHIN_7_DAYS: "7일 이내",
  WITHIN_30_DAYS: "30일 이내",
  ALL_UPCOMING: "30일 이내 전체",
  NO_EVENT: "예정 없음",
};

/** 기본 목록(필터 없음)에 표시되는 상태들: 기한 지남 + 30일 이내. */
const DEFAULT_VIEW_STATUSES: RemindStatus[] = [
  "OVERDUE",
  "WITHIN_7_DAYS",
  "WITHIN_30_DAYS",
];

/**
 * `today` 로부터 이벤트일까지 남은 일수. 양수 = 미래, 0 = 오늘, 음수 = 지남.
 * 이벤트일이 없으면 null.
 */
export function remindDayDelta(
  nextEventDate: string | null,
  today: string,
): number | null {
  if (!nextEventDate) return null;
  return daysBetweenIsoDates(today, nextEventDate);
}

/**
 * next_event_date 로 리마인드 상태를 계산한다.
 * - 없음 → NO_EVENT
 * - 오늘 이전 → OVERDUE
 * - 오늘 ~ 7일(오늘 포함) → WITHIN_7_DAYS
 * - 8일 ~ 30일 → WITHIN_30_DAYS
 * - 31일 이후 → BEYOND_30
 */
export function classifyRemindStatus(
  nextEventDate: string | null,
  today: string,
): RemindStatus {
  const delta = remindDayDelta(nextEventDate, today);
  if (delta === null) return "NO_EVENT";
  if (delta < 0) return "OVERDUE";
  if (delta <= 7) return "WITHIN_7_DAYS";
  if (delta <= 30) return "WITHIN_30_DAYS";
  return "BEYOND_30";
}

/** 상태가 주어진 필터에 해당하는지. filter 가 null 이면 기본 목록 규칙. */
export function matchesRemindFilter(
  status: RemindStatus,
  filter: RemindFilter | null,
): boolean {
  if (filter === null) return DEFAULT_VIEW_STATUSES.includes(status);
  switch (filter) {
    case "OVERDUE":
      return status === "OVERDUE";
    case "WITHIN_7_DAYS":
      return status === "WITHIN_7_DAYS";
    case "WITHIN_30_DAYS":
      return status === "WITHIN_30_DAYS";
    case "ALL_UPCOMING":
      return status === "WITHIN_7_DAYS" || status === "WITHIN_30_DAYS";
    case "NO_EVENT":
      return status === "NO_EVENT";
  }
}

/** 남은/지난 일수를 한국어로. */
export function formatDayDelta(delta: number | null): string {
  if (delta === null) return "-";
  if (delta === 0) return "오늘";
  if (delta > 0) return `${delta}일 남음`;
  return `${-delta}일 지남`;
}
