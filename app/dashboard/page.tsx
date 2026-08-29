import type { Metadata } from "next";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  currentMonthLabelInSeoul,
  formatKoreanDate,
  todayInSeoul,
} from "@/lib/date";
import {
  getCustomerCountByPeriod,
  getDashboardSummary,
} from "@/lib/dashboard/queries";
import {
  formatPeriodBucket,
  parsePeriodGranularity,
  PERIOD_GRANULARITIES,
  PERIOD_LABELS,
  periodHref,
  type PeriodGranularity,
  type PeriodPoint,
} from "@/lib/dashboard/period";
import {
  ITEM_TYPE_LABELS,
  PURCHASE_PURPOSE_LABELS,
  TRADE_TYPE_LABELS,
} from "@/lib/labels";
import { cn } from "@/lib/utils";
import { formatWon } from "@/lib/number";
import { PURCHASE_PURPOSES } from "@/lib/types/database";
import { requireUser } from "@/lib/supabase/require-user";

export const metadata: Metadata = {
  title: "대시보드",
};

// 인증 사용자별 데이터이므로 정적 캐시에 저장하지 않는다.
export const dynamic = "force-dynamic";

function StatCard({
  label,
  value,
  href,
  sub,
}: {
  label: string;
  value: string;
  href?: string;
  sub?: string;
}) {
  const body = (
    <Card className={href ? "transition-colors hover:bg-muted/50" : undefined}>
      <CardHeader>
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {label}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-0.5">
        <span className="text-2xl font-semibold tabular-nums">{value}</span>
        {sub ? (
          <span className="text-xs text-muted-foreground">{sub}</span>
        ) : null}
      </CardContent>
    </Card>
  );

  if (!href) return body;
  return (
    <Link
      href={href}
      className="block rounded-xl outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
    >
      {body}
    </Link>
  );
}

function PeriodChart({
  granularity,
  points,
  caption,
  emptyText,
}: {
  granularity: PeriodGranularity;
  points: PeriodPoint[];
  caption: string;
  emptyText: string;
}) {
  const max = points.reduce((m, p) => Math.max(m, p.count), 0);
  const total = points.reduce((s, p) => s + p.count, 0);

  if (points.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-muted-foreground">
        {emptyText}
      </p>
    );
  }

  return (
    <>
      <ul className="flex flex-col gap-1.5">
        {points.map((p) => {
          const pct = max > 0 ? Math.round((p.count / max) * 100) : 0;
          const isMax = p.count === max && max > 0;
          return (
            <li key={p.bucket} className="flex items-center gap-3">
              <span className="w-16 shrink-0 text-right text-xs text-muted-foreground tabular-nums">
                {formatPeriodBucket(p.bucket, granularity)}
              </span>
              <span className="relative h-5 flex-1 overflow-hidden rounded bg-muted">
                <span
                  className={cn(
                    "absolute inset-y-0 left-0 rounded",
                    isMax ? "bg-primary" : "bg-primary/45",
                  )}
                  style={{ width: `${Math.max(pct, p.count > 0 ? 4 : 0)}%` }}
                />
              </span>
              <span className="w-10 shrink-0 text-right text-sm tabular-nums">
                {p.count.toLocaleString("ko-KR")}
              </span>
            </li>
          );
        })}
      </ul>
      <p className="mt-3 text-xs text-muted-foreground">
        최근 {points.length}개 구간 합계 {total.toLocaleString("ko-KR")}건 · {caption}
      </p>
    </>
  );
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  await requireUser();

  const sp = await searchParams;
  const granularity = parsePeriodGranularity(
    Array.isArray(sp.period) ? sp.period[0] : sp.period,
  );

  const [result, tradePeriod, registrationPeriod] = await Promise.all([
    getDashboardSummary(),
    getCustomerCountByPeriod(granularity, "trade"),
    getCustomerCountByPeriod(granularity, "registration"),
  ]);
  const monthLabel = currentMonthLabelInSeoul();

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-6 py-10">
      <div>
        <h1 className="text-xl font-semibold">CRM 현황</h1>
        <p className="text-sm text-muted-foreground">
          기준일 {formatKoreanDate(todayInSeoul())} · 시간대 Asia/Seoul
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
          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label="전체 고객"
              value={`${result.data.customerCount.toLocaleString("ko-KR")}명`}
              href="/customers"
            />
            <StatCard
              label={`${monthLabel} 판매 금액`}
              value={formatWon(result.data.monthSaleAmount)}
            />
            <StatCard
              label={`${monthLabel} 매입 금액`}
              value={formatWon(result.data.monthPurchaseAmount)}
            />
            <StatCard
              label="30일 이내 이벤트 예정"
              value={`${result.data.upcomingEventCount.toLocaleString("ko-KR")}명`}
              href="/reminders?status=ALL_UPCOMING"
              sub="리마인드 화면에서 확인"
            />
          </section>

          <Card>
            <CardHeader>
              <CardTitle>기간별 추이</CardTitle>
              <CardAction>
                <div
                  role="group"
                  aria-label="집계 단위"
                  className="flex flex-wrap gap-1"
                >
                  {PERIOD_GRANULARITIES.map((g) => (
                    <Link
                      key={g}
                      href={periodHref(g)}
                      aria-current={g === granularity ? "page" : undefined}
                      className={cn(
                        "rounded-md px-2.5 py-1 text-sm outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring/50",
                        g === granularity
                          ? "bg-muted font-medium text-foreground"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground",
                      )}
                    >
                      {PERIOD_LABELS[g]}
                    </Link>
                  ))}
                </div>
              </CardAction>
            </CardHeader>
            <CardContent className="flex flex-col gap-6">
              <div>
                <h3 className="mb-3 text-sm font-medium">
                  거래 고객수{" "}
                  <span className="font-normal text-muted-foreground">
                    (거래 1건 = 1명)
                  </span>
                </h3>
                {!tradePeriod.ok ? (
                  <p className="py-4 text-center text-sm text-destructive">
                    {tradePeriod.error}
                  </p>
                ) : (
                  <PeriodChart
                    granularity={granularity}
                    points={tradePeriod.data}
                    emptyText="표시할 거래가 없습니다."
                    caption="거래 1건을 1명으로 셉니다(같은 고객의 반복 거래도 중복)."
                  />
                )}
              </div>

              <div className="border-t pt-6">
                <h3 className="mb-3 text-sm font-medium">
                  신규 등록 고객수{" "}
                  <span className="font-normal text-muted-foreground">
                    (등록일 기준, 참고용)
                  </span>
                </h3>
                {!registrationPeriod.ok ? (
                  <p className="py-4 text-center text-sm text-destructive">
                    {registrationPeriod.error}
                  </p>
                ) : (
                  <PeriodChart
                    granularity={granularity}
                    points={registrationPeriod.data}
                    emptyText="이 구간에 등록된 고객이 없습니다."
                    caption="고객 등록일(created_at) 기준."
                  />
                )}
              </div>
            </CardContent>
          </Card>

          <section
            aria-labelledby="dash-detail"
            className="grid gap-6 lg:grid-cols-2"
          >
            <h2 id="dash-detail" className="sr-only">
              구매목적별 고객 수와 최근 거래
            </h2>
            <Card>
              <CardHeader>
                <CardTitle>구매목적별 고객 수</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="flex flex-col divide-y text-sm">
                  {PURCHASE_PURPOSES.map((p) => (
                    <li key={p}>
                      <Link
                        href={`/customers?purpose=${p}`}
                        className="flex items-center justify-between py-2 hover:text-foreground"
                      >
                        <span>{PURCHASE_PURPOSE_LABELS[p]}</span>
                        <span className="tabular-nums">
                          {result.data.purposeCounts[p].toLocaleString("ko-KR")}명
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
                <p className="mt-2 text-xs text-muted-foreground">
                  한 고객이 여러 목적을 가질 수 있어 합계가 전체 고객 수와 다를 수 있습니다.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>최근 거래 5건</CardTitle>
              </CardHeader>
              <CardContent>
                {result.data.recentTrades.length === 0 ? (
                  <p className="py-6 text-center text-sm text-muted-foreground">
                    아직 거래가 없습니다.
                  </p>
                ) : (
                  <ul className="flex flex-col divide-y text-sm">
                    {result.data.recentTrades.map((t) => (
                      <li
                        key={t.id}
                        className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 py-2"
                      >
                        <div className="flex items-center gap-2">
                          <Badge
                            variant={
                              t.trade_type === "SALE" ? "secondary" : "outline"
                            }
                          >
                            {TRADE_TYPE_LABELS[t.trade_type]}
                          </Badge>
                          <Link
                            href={`/customers/${t.customer_id}`}
                            className="font-medium hover:underline"
                          >
                            {t.customer_name}
                          </Link>
                          <span className="text-muted-foreground">
                            {ITEM_TYPE_LABELS[t.item_type]}
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="tabular-nums">
                            {formatWon(t.amount)}
                          </span>
                          <span className="tabular-nums text-muted-foreground">
                            {formatKoreanDate(t.trade_date)}
                          </span>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </section>
        </>
      )}
    </main>
  );
}
