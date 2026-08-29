import type { Metadata } from "next";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatKoreanDate } from "@/lib/date";
import { PURCHASE_PURPOSE_LABELS } from "@/lib/labels";
import { parseRemindFilter, remindFilterHref } from "@/lib/reminders/filters";
import { getReminderData } from "@/lib/reminders/queries";
import {
  formatDayDelta,
  REMIND_STATUS_LABELS,
  type RemindFilter,
  type RemindStatus,
} from "@/lib/reminders/status";
import { requireUser } from "@/lib/supabase/require-user";
import { CopyablePhone } from "@/app/reminders/copyable-phone";

export const metadata: Metadata = {
  title: "리마인드",
};

// 인증 사용자별 데이터이므로 정적 캐시에 저장하지 않는다.
export const dynamic = "force-dynamic";

const STATUS_BADGE: Record<RemindStatus, "secondary" | "outline"> = {
  OVERDUE: "secondary",
  WITHIN_7_DAYS: "secondary",
  WITHIN_30_DAYS: "outline",
  BEYOND_30: "outline",
  NO_EVENT: "outline",
};

const TABS: { filter: RemindFilter | null; label: string }[] = [
  { filter: null, label: "기본 (지남 + 30일 이내)" },
  { filter: "OVERDUE", label: "기한 지남" },
  { filter: "WITHIN_7_DAYS", label: "7일 이내" },
  { filter: "WITHIN_30_DAYS", label: "30일 이내" },
  { filter: "ALL_UPCOMING", label: "30일 이내 전체" },
  { filter: "NO_EVENT", label: "예정 없음" },
];

export default async function RemindersPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  await requireUser();

  const filter = parseRemindFilter(await searchParams);
  const result = await getReminderData(filter);

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 px-6 py-10">
      <div>
        <h1 className="text-xl font-semibold">리마인드</h1>
        <p className="text-sm text-muted-foreground">
          다음 이벤트 예정일 기준
          {result.ok
            ? ` · 기준일 ${formatKoreanDate(result.data.today)} (Asia/Seoul)`
            : ""}
        </p>
      </div>

      {!result.ok ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-destructive">
            {result.error}
          </CardContent>
        </Card>
      ) : (
        <>
          <div
            aria-label="리마인드 상태 필터"
            className="flex flex-wrap gap-2"
          >
            {TABS.map((tab) => {
              const isActive =
                (tab.filter === null && filter === null) ||
                tab.filter === filter;
              const count =
                tab.filter === null
                  ? result.data.counts.DEFAULT
                  : result.data.counts[tab.filter];
              return (
                <Button
                  key={tab.label}
                  size="sm"
                  variant={isActive ? "default" : "outline"}
                  render={<Link href={remindFilterHref(tab.filter)} />}
                >
                  {tab.label} ({count})
                </Button>
              );
            })}
          </div>

          <p className="text-sm text-muted-foreground">
            총 {result.data.items.length}명
          </p>

          {result.data.items.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-sm text-muted-foreground">
                조건에 맞는 고객이 없습니다.
              </CardContent>
            </Card>
          ) : (
            <ul className="flex flex-col gap-3">
              {result.data.items.map((c) => (
                <li key={c.id}>
                  <Card>
                    <CardContent className="flex flex-col gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-medium">{c.name}</span>
                        <Badge variant={STATUS_BADGE[c.status]}>
                          {REMIND_STATUS_LABELS[c.status]}
                        </Badge>
                        {c.next_event_date ? (
                          <span className="text-sm text-muted-foreground tabular-nums">
                            {formatKoreanDate(c.next_event_date)} ·{" "}
                            {formatDayDelta(c.dayDelta)}
                          </span>
                        ) : null}
                      </div>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          연락처: <CopyablePhone phone={c.phone} />
                        </span>
                        <span>
                          방문 목적:{" "}
                          {c.purchase_purposes.length > 0
                            ? c.purchase_purposes
                                .map((p) => PURCHASE_PURPOSE_LABELS[p])
                                .join(", ")
                            : "없음"}
                        </span>
                        <span>
                          마지막 연락일:{" "}
                          {c.last_contact_date
                            ? formatKoreanDate(c.last_contact_date)
                            : "없음"}
                        </span>
                      </div>

                      <div>
                        <Button
                          size="sm"
                          variant="outline"
                          render={<Link href={`/customers/${c.id}`} />}
                        >
                          고객 상세
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </main>
  );
}
