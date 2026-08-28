/** 날짜/시간대 기준은 Asia/Seoul 고정. */

const KST_TIME_ZONE = "Asia/Seoul";

/** 오늘 날짜(Asia/Seoul)를 `YYYY-MM-DD` 문자열로 반환한다. */
export function todayInSeoul(): string {
  // en-CA 로케일은 YYYY-MM-DD 형식을 만든다.
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: KST_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

/** `YYYY-MM-DD` 가 실제 존재하는 날짜인지 확인한다. */
export function isValidIsoDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [y, m, d] = value.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  return (
    date.getUTCFullYear() === y &&
    date.getUTCMonth() === m - 1 &&
    date.getUTCDate() === d
  );
}
