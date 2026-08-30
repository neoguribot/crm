import type { Metadata } from "next";
import Link from "next/link";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GENDER_LABELS, INFLOW_CHANNEL_LABELS } from "@/lib/labels";
import { GENDERS, INFLOW_CHANNELS } from "@/lib/types/database";
import { AGE_BUCKETS, AGE_BUCKET_LABELS, GRADE_BUCKETS, GRADE_BUCKET_LABELS } from "@/lib/analytics/summary";
import { getCustomerAnalytics } from "@/lib/analytics/queries";
import { formatWon } from "@/lib/number";
import { requireUser } from "@/lib/supabase/require-user";
import { BarList } from "@/app/analytics/bar-list";

export const metadata: Metadata = {
  title: "종합 분석",
};

export const dynamic = "force-dynamic";

export default async function AnalyticsPage() {
  await requireUser();

  const result = await getCustomerAnalytics();

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 px-6 py-10">
      <div>
        <h1 className="text-xl font-semibold">종합 분석</h1>
        <p className="text-sm text-muted-foreground">
          {result.ok ? `전체 고객 ${result.data.customerCount.toLocaleString("ko-KR")}명 기준` : ""}
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
          <section className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>성별 분포</CardTitle>
              </CardHeader>
              <CardContent>
                <BarList
                  rows={GENDERS.map((g) => ({
                    label: GENDER_LABELS[g],
                    count: result.data.genderCounts[g],
                  }))}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>등급 분포</CardTitle>
              </CardHeader>
              <CardContent>
                <BarList
                  rows={GRADE_BUCKETS.map((g) => ({
                    label: GRADE_BUCKET_LABELS[g],
                    count: result.data.gradeCounts[g],
                  }))}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>연령대 분포</CardTitle>
              </CardHeader>
              <CardContent>
                <BarList
                  rows={AGE_BUCKETS.map((a) => ({
                    label: AGE_BUCKET_LABELS[a],
                    count: result.data.ageBucketCounts[a],
                  }))}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>유입 경로 분포</CardTitle>
              </CardHeader>
              <CardContent>
                <BarList
                  rows={INFLOW_CHANNELS.map((c) => ({
                    label: INFLOW_CHANNEL_LABELS[c],
                    count: result.data.channelCounts[c],
                  }))}
                />
                <p className="mt-2 text-xs text-muted-foreground">
                  한 고객이 여러 경로를 가질 수 있어 합계가 전체 고객 수와 다를 수 있습니다.
                </p>
              </CardContent>
            </Card>
          </section>

          <Card>
            <CardHeader>
              <CardTitle>누적 거래액 상위 고객</CardTitle>
            </CardHeader>
            <CardContent>
              {result.data.topCustomers.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  거래 이력이 있는 고객이 없습니다.
                </p>
              ) : (
                <ol className="flex flex-col divide-y text-sm">
                  {result.data.topCustomers.map((c, i) => (
                    <li
                      key={c.id}
                      className="flex items-center justify-between gap-3 py-2"
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-5 shrink-0 text-right text-muted-foreground tabular-nums">
                          {i + 1}
                        </span>
                        <Link href={`/customers/${c.id}`} className="font-medium hover:underline">
                          {c.name}
                        </Link>
                        <span className="text-xs text-muted-foreground">
                          거래 {c.tradeCount.toLocaleString("ko-KR")}건
                        </span>
                      </div>
                      <span className="tabular-nums font-medium">{formatWon(c.totalAmount)}</span>
                    </li>
                  ))}
                </ol>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </main>
  );
}
