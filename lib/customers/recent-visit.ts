/**
 * 최근 방문일과 미방문 일수 계산 (순수 함수).
 *
 * - 최근 방문일 = 거래가 있으면 가장 최근 trade_date, 없으면 first_visit_date
 * - 모든 입력은 `YYYY-MM-DD` 문자열(date 컬럼). timestamptz 는 다루지 않는다.
 * - 기준일(오늘)은 Asia/Seoul 기준으로 호출 측에서 넘긴다.
 */

/** `YYYY-MM-DD` 두 개의 차이를 일수로. from > to 이면 음수. */
export function daysBetweenIsoDates(fromIso: string, toIso: string): number {
  const [fy, fm, fd] = fromIso.split("-").map(Number);
  const [ty, tm, td] = toIso.split("-").map(Number);
  const fromMs = Date.UTC(fy, fm - 1, fd);
  const toMs = Date.UTC(ty, tm - 1, td);
  return Math.round((toMs - fromMs) / 86_400_000);
}

/** 거래일 목록과 최초 방문일에서 최근 방문일을 구한다. */
export function resolveLastVisitDate(
  firstVisitDate: string,
  tradeDates: readonly string[],
): string {
  let latest = firstVisitDate;
  for (const d of tradeDates) {
    if (d > latest) latest = d;
  }
  return latest;
}

/**
 * 미방문 일수. 최근 방문일이 미래면(잘못된 데이터) 음수 대신 0 으로 처리한다.
 */
export function inactiveDaysSince(lastVisitDate: string, todayIso: string): number {
  const diff = daysBetweenIsoDates(lastVisitDate, todayIso);
  return diff < 0 ? 0 : diff;
}

/**
 * 방문일(최초 방문일 + 거래일) 중 하나라도 [from, to] 구간(양끝 포함)에 들어가는지.
 * - 날짜는 모두 `YYYY-MM-DD` 문자열. 문자열 비교로 대소를 판단한다.
 * - from 만 있으면 그 날짜 이후, to 만 있으면 그 날짜 이전. 둘 다 없으면 항상 true.
 */
export function visitedWithin(
  visitDates: readonly string[],
  from: string | null,
  to: string | null,
): boolean {
  if (!from && !to) return true;
  return visitDates.some((d) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) return false;
    if (from && d < from) return false;
    if (to && d > to) return false;
    return true;
  });
}
