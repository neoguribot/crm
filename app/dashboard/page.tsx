import type { Metadata } from "next";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { APP_NAME } from "@/lib/constants";
import { currentMonthLabelInSeoul, todayInSeoul } from "@/lib/date";
import { getDashboardSummary } from "@/lib/dashboard/queries";
import { ITEM_TYPE_LABELS, PURCHASE_PURPOSE_LABELS, TRADE_TYPE_LABELS } from "@/lib/labels";
import { formatWon } from "@/lib/number";
import { PURCHASE_PURPOSES } from "@/lib/types/database";
import { requireUser } from "@/lib/supabase/require-user";

export const metadata: Metadata = {
  title: `대시보드 · ${APP_NAME}`,
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

export default async function DashboardPage() {
  await requireUser();

  const result = await getDashboardSummary();
  const monthLabel = currentMonthLabelInSeoul();

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-6 py-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">CRM 현황</h1>
          <p className="text-sm text-muted-foreground">
            기준일 {todayInSeoul()} (Asia/Seoul)
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" render={<Link href="/customers" />}>
            고객 목록
          </Button>
          <form action="/logout" method="post">
            <Button type="submit" variant="ghost">
              로그아웃
            </Button>
          </form>
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
              label="90일 이상 미방문"
              value={`${result.data.inactive90Count.toLocaleString("ko-KR")}명`}
              href="/customers?inactiveDays=90"
            />
            <StatCard
              label="30일 이내 이벤트 예정"
              value={`${result.data.upcomingEventCount.toLocaleString("ko-KR")}명`}
              sub="다음 이벤트 예정일 기준"
            />
          </section>

          <section className="grid gap-6 lg:grid-cols-2">
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
                            {t.trade_date}
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
