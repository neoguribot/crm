import type { Metadata } from "next";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  isInMonth,
  monthGridWeeks,
  nextMonth,
  parseYearMonth,
  prevMonth,
  WEEKDAY_LABELS,
  type YearMonth,
} from "@/lib/calendar";
import { formatKoreanDate, isValidIsoDate, todayInSeoul } from "@/lib/date";
import { EVENT_TYPE_LABELS } from "@/lib/labels";
import { listEventsInRange, type UpcomingEventItem } from "@/lib/events/queries";
import { requireUser } from "@/lib/supabase/require-user";
import { MonthNav } from "@/app/calendar/month-nav";

export const metadata: Metadata = {
  title: "캘린더",
};

export const dynamic = "force-dynamic";

function monthHref(ym: YearMonth): string {
  return `/calendar?year=${ym.year}&month=${ym.month}`;
}

function dayHref(ym: YearMonth, day: string): string {
  return `/calendar?year=${ym.year}&month=${ym.month}&day=${day}`;
}

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  await requireUser();

  const sp = await searchParams;
  const today = todayInSeoul();
  const ym = parseYearMonth(
    Array.isArray(sp.year) ? sp.year[0] : sp.year,
    Array.isArray(sp.month) ? sp.month[0] : sp.month,
    today,
  );

  const weeks = monthGridWeeks(ym);
  const gridStart = weeks[0][0];
  const gridEnd = weeks[weeks.length - 1][6];

  const dayParam = Array.isArray(sp.day) ? sp.day[0] : sp.day;
  const selectedDay =
    dayParam && isValidIsoDate(dayParam) && dayParam >= gridStart && dayParam <= gridEnd
      ? dayParam
      : isInMonth(today, ym)
        ? today
        : `${ym.year}-${String(ym.month).padStart(2, "0")}-01`;

  const result = await listEventsInRange(gridStart, gridEnd);
  const eventsByDay = new Map<string, UpcomingEventItem[]>();
  if (result.ok) {
    for (const ev of result.data) {
      const list = eventsByDay.get(ev.event_date) ?? [];
      list.push(ev);
      eventsByDay.set(ev.event_date, list);
    }
  }

  const selectedEvents = eventsByDay.get(selectedDay) ?? [];

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 px-6 py-10">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">캘린더</h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" render={<Link href={monthHref(prevMonth(ym))} />}>
            이전 달
          </Button>
          <MonthNav ym={ym} />
          <Button variant="outline" size="sm" render={<Link href={monthHref(nextMonth(ym))} />}>
            다음 달
          </Button>
        </div>
      </div>

      {!result.ok ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-destructive">
            {result.error}
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="overflow-x-auto">
            <div className="grid min-w-[560px] grid-cols-7 gap-1 text-sm">
              {WEEKDAY_LABELS.map((label) => (
                <div key={label} className="py-1 text-center text-xs text-muted-foreground">
                  {label}
                </div>
              ))}
              {weeks.flat().map((day) => {
                const events = eventsByDay.get(day) ?? [];
                const dayNum = Number(day.slice(-2));
                const inMonth = isInMonth(day, ym);
                const isToday = day === today;
                const isSelected = day === selectedDay;
                return (
                  <Link
                    key={day}
                    href={dayHref(ym, day)}
                    className={`flex min-h-20 flex-col gap-1 rounded-md border p-1.5 outline-none focus-visible:ring-2 focus-visible:ring-ring/50 ${
                      isSelected
                        ? "border-primary bg-primary/5"
                        : "border-border hover:bg-muted/50"
                    } ${inMonth ? "" : "opacity-40"}`}
                  >
                    <span
                      className={`text-xs tabular-nums ${
                        isToday ? "font-semibold text-primary" : "text-muted-foreground"
                      }`}
                    >
                      {dayNum}
                    </span>
                    <div className="flex flex-col gap-0.5">
                      {events.slice(0, 2).map((ev) => (
                        <span
                          key={ev.id}
                          className={`truncate rounded bg-muted px-1 text-[0.65rem] ${
                            ev.is_done ? "text-muted-foreground line-through" : ""
                          }`}
                        >
                          {EVENT_TYPE_LABELS[ev.event_type]} {ev.customer_name}
                        </span>
                      ))}
                      {events.length > 2 ? (
                        <span className="text-[0.65rem] text-muted-foreground">
                          +{events.length - 2}건
                        </span>
                      ) : null}
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>

          <Card>
            <CardContent className="flex flex-col gap-3">
              <h2 className="text-sm font-semibold">{formatKoreanDate(selectedDay)} 일정</h2>
              {selectedEvents.length === 0 ? (
                <p className="py-4 text-center text-sm text-muted-foreground">
                  이 날짜에는 일정이 없습니다.
                </p>
              ) : (
                <ul className="flex flex-col divide-y text-sm">
                  {selectedEvents.map((ev) => (
                    <li
                      key={ev.id}
                      className="flex flex-wrap items-center justify-between gap-2 py-2"
                    >
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{EVENT_TYPE_LABELS[ev.event_type]}</Badge>
                        <Link
                          href={`/customers/${ev.customer_id}`}
                          className={`font-medium hover:underline ${
                            ev.is_done ? "text-muted-foreground line-through" : ""
                          }`}
                        >
                          {ev.customer_name}
                        </Link>
                        {ev.memo ? (
                          <span className="text-xs text-muted-foreground">{ev.memo}</span>
                        ) : null}
                      </div>
                      <Link
                        href={`/customers/${ev.customer_id}`}
                        className="text-xs text-muted-foreground hover:underline"
                      >
                        고객 상세
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
              <p className="text-xs text-muted-foreground">
                일정 등록·완료 처리·삭제는 고객 상세 페이지의 &quot;일정&quot; 섹션에서 합니다.
              </p>
            </CardContent>
          </Card>
        </>
      )}
    </main>
  );
}

