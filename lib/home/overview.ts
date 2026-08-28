import {
  CUSTOMER_STAGES,
  type CustomerStage,
} from "@/lib/types/database";
import {
  classifyRemindStatus,
  matchesRemindFilter,
} from "@/lib/reminders/status";

/** 홈 화면 계산에 필요한 고객 1명의 최소 컬럼. */
export type HomeCustomerRow = {
  id: string;
  name: string;
  /** 0004 미적용 DB 에서는 null. */
  stage: CustomerStage | null;
  next_event_date: string | null;
  created_at: string;
};

export type HomeRecentCustomer = {
  id: string;
  name: string;
  created_at: string;
};

export type HomeOverview = {
  customerCount: number;
  /** 단계별 고객 수. 모든 단계 키가 존재한다. stage 가 null 인 고객은 세지 않는다. */
  stageCounts: Record<CustomerStage, number>;
  /** 리마인드 기본 목록 대상 (기한 지남 + 30일 이내). */
  remindDueCount: number;
  /** 기한이 이미 지난 고객. */
  overdueCount: number;
  /** 아직 지나지 않은 30일 이내 예정. */
  upcomingCount: number;
  /** 최근 등록 고객 (created_at 내림차순, 최대 5명). */
  recent: HomeRecentCustomer[];
};

const RECENT_LIMIT = 5;

/**
 * 홈 화면 요약을 순수 계산한다(DB 접근 없음).
 * - 리마인드 상태는 next_event_date 로 계산하며 저장하지 않는다.
 * - 정렬된 입력에 의존하지 않고 created_at 으로 다시 정렬한다.
 */
export function buildHomeOverview(
  rows: readonly HomeCustomerRow[],
  today: string,
): HomeOverview {
  const stageCounts = Object.fromEntries(
    CUSTOMER_STAGES.map((s) => [s, 0]),
  ) as Record<CustomerStage, number>;

  let remindDueCount = 0;
  let overdueCount = 0;
  let upcomingCount = 0;

  for (const row of rows) {
    if (row.stage && stageCounts[row.stage] !== undefined) {
      stageCounts[row.stage] += 1;
    }

    const status = classifyRemindStatus(row.next_event_date, today);
    if (matchesRemindFilter(status, null)) remindDueCount += 1;
    if (matchesRemindFilter(status, "OVERDUE")) overdueCount += 1;
    if (matchesRemindFilter(status, "ALL_UPCOMING")) upcomingCount += 1;
  }

  const recent = [...rows]
    .sort((a, b) => (a.created_at < b.created_at ? 1 : a.created_at > b.created_at ? -1 : 0))
    .slice(0, RECENT_LIMIT)
    .map((r) => ({ id: r.id, name: r.name, created_at: r.created_at }));

  return {
    customerCount: rows.length,
    stageCounts,
    remindDueCount,
    overdueCount,
    upcomingCount,
    recent,
  };
}
