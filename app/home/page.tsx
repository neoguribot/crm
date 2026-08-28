import type { Metadata } from "next";
import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { NAV_ITEMS } from "@/lib/constants";
import {
  formatKoreanDate,
  isoTimestampToSeoulDate,
  todayInSeoul,
} from "@/lib/date";
import { getHomeOverview } from "@/lib/home/queries";
import { CUSTOMER_STAGE_LABELS } from "@/lib/labels";
import { PIPELINE_STAGES } from "@/lib/customers/pipeline";
import { requireUser } from "@/lib/supabase/require-user";

export const metadata: Metadata = {
  title: "홈",
};

// 인증 사용자별 데이터이므로 정적 캐시에 저장하지 않는다.
export const dynamic = "force-dynamic";

/** 홈에서 안내할 화면 (네비게이션 항목과 동일). */
const QUICK_LINKS: { href: string; label: string; description: string }[] =
  NAV_ITEMS.map((item) => ({
    href: item.href,
    label: item.label,
    description:
      (
        {
          "/pipeline": "영업 단계별 고객 보드",
          "/dashboard": "매출·고객 현황 요약",
          "/customers": "고객 등록·검색·세그먼트",
          "/reminders": "이벤트 리마인드 대상",
        } as Record<string, string>
      )[item.href] ?? "",
  }));

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
    <Card className={href ? "h-full transition-colors hover:bg-muted/50" : "h-full"}>
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

export default async function HomePage() {
  const user = await requireUser();
  const result = await getHomeOverview();
  const today = todayInSeoul();

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-6 py-10">
      <div>
        <h1 className="text-xl font-semibold">
          안녕하세요{user.email ? `, ${user.email}` : ""} 님
        </h1>
        <p className="text-sm text-muted-foreground">
          오늘 {formatKoreanDate(today)} · 시간대 Asia/Seoul
        </p>
      </div>

      {!result.ok ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-destructive">
            {result.error}
          </CardContent>
        </Card>
      ) : result.data.customerCount === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
            <p className="text-sm text-muted-foreground">
              아직 등록된 고객이 없습니다. 첫 고객을 등록해 보세요.
            </p>
            <Link href="/customers/new" className={buttonVariants()}>
              고객 등록
            </Link>
          </CardContent>
        </Card>
      ) : (
        <>
          <section
            aria-labelledby="home-summary"
            className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
          >
            <h2 id="home-summary" className="sr-only">
              오늘의 요약
            </h2>
            <StatCard
              label="리마인드 대상"
              value={`${result.data.remindDueCount.toLocaleString("ko-KR")}명`}
              href="/reminders"
              sub={`기한 지남 ${result.data.overdueCount} · 30일 이내 예정 ${result.data.upcomingCount}`}
            />
            <StatCard
              label="기한 지난 이벤트"
              value={`${result.data.overdueCount.toLocaleString("ko-KR")}명`}
              href="/reminders?status=OVERDUE"
            />
            <StatCard
              label="전체 고객"
              value={`${result.data.customerCount.toLocaleString("ko-KR")}명`}
              href="/customers"
            />
          </section>

          <section aria-labelledby="home-stage" className="grid gap-6 lg:grid-cols-2">
            <h2 id="home-stage" className="sr-only">
              영업 단계와 최근 등록 고객
            </h2>

            <Card>
              <CardHeader>
                <CardTitle>영업 단계별 고객</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="flex flex-col divide-y text-sm">
                  {PIPELINE_STAGES.map((stage) => (
                    <li key={stage}>
                      <Link
                        href="/pipeline"
                        className="flex items-center justify-between py-2 hover:text-foreground"
                      >
                        <span>{CUSTOMER_STAGE_LABELS[stage]}</span>
                        <span className="tabular-nums">
                          {result.data.stageCounts[stage].toLocaleString("ko-KR")}명
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>최근 등록 고객</CardTitle>
              </CardHeader>
              <CardContent>
                {result.data.recent.length === 0 ? (
                  <p className="py-6 text-center text-sm text-muted-foreground">
                    아직 등록된 고객이 없습니다.
                  </p>
                ) : (
                  <ul className="flex flex-col divide-y text-sm">
                    {result.data.recent.map((c) => (
                      <li
                        key={c.id}
                        className="flex items-center justify-between gap-x-3 py-2"
                      >
                        <Link
                          href={`/customers/${c.id}`}
                          className="font-medium hover:underline"
                        >
                          {c.name}
                        </Link>
                        <span className="tabular-nums text-muted-foreground">
                          {formatKoreanDate(isoTimestampToSeoulDate(c.created_at))}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </section>
        </>
      )}

      <section aria-labelledby="home-links">
        <h2 id="home-links" className="mb-3 text-sm font-medium text-muted-foreground">
          바로가기
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {QUICK_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="block rounded-xl outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <Card className="h-full transition-colors hover:bg-muted/50">
                <CardHeader>
                  <CardTitle className="text-base">{link.label}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground">
                    {link.description}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
