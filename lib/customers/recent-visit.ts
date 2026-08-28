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
