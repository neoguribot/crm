import type { ReactNode } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatKoreanDate } from "@/lib/date";
import { getCustomerById } from "@/lib/customers/queries";
import { listTradeRecordsByCustomer } from "@/lib/trades/queries";
import { INFLOW_CHANNEL_LABELS, PURCHASE_PURPOSE_LABELS } from "@/lib/labels";
import { summarizeHoldings } from "@/lib/trades/holdings";
import { requireUser } from "@/lib/supabase/require-user";
import { CustomerStageControl } from "@/app/customers/[id]/customer-stage-control";
import { HoldingsSummary } from "@/app/customers/[id]/holdings-summary";
import { TradeHistorySection } from "@/app/customers/[id]/trade-history";

export const metadata: Metadata = {
  title: "고객 상세",
};

function Row({
  label,
  value,
  children,
}: {
  label: string;
  value?: string;
  children?: ReactNode;
}) {
  return (
    <div className="flex gap-4 py-2 text-sm">
      <span className="w-28 shrink-0 text-muted-foreground">{label}</span>
      {children ?? <span className="whitespace-pre-wrap">{value}</span>}
    </div>
  );
}

export default async function CustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireUser();
  const { id } = await params;

  const result = await getCustomerById(id);

  if (!result.ok) {
    return (
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col justify-center px-6 py-16">
        <Card>
          <CardContent className="py-10 text-center text-sm text-destructive">
            {result.error}
          </CardContent>
        </Card>
      </main>
    );
  }

  // 없는 ID 또는 다른 사용자의 고객 → 404 와 동일하게 처리(정보 노출 없음)
  if (!result.data) {
    notFound();
  }

  const c = result.data;
  const trades = await listTradeRecordsByCustomer(c.id);
  const holdings = trades.ok ? summarizeHoldings(trades.data) : [];
  const purposes =
    c.purchase_purposes.length > 0
      ? c.purchase_purposes.map((p) => PURCHASE_PURPOSE_LABELS[p]).join(", ")
      : "없음";

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-6 py-10">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-xl font-semibold">{c.name}</h1>
        <div className="flex gap-2">
          <Button variant="outline" render={<Link href="/customers" />}>
            목록으로
          </Button>
          <Button render={<Link href={`/customers/${c.id}/edit`} />}>
            고객 정보 수정
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>고객 정보</CardTitle>
        </CardHeader>
        <CardContent className="divide-y">
          <Row label="이름" value={c.name} />
          <Row label="연락처" value={c.phone} />
          <Row label="유입경로" value={INFLOW_CHANNEL_LABELS[c.inflow_channel]} />
          {c.stage ? (
            <Row label="영업 단계">
              <CustomerStageControl customerId={c.id} stage={c.stage} />
            </Row>
          ) : null}
          <Row label="구매목적" value={purposes} />
          <Row
            label="최초 방문일"
            value={formatKoreanDate(c.first_visit_date)}
          />
          <Row
            label="마지막 연락일"
            value={
              c.last_contact_date ? formatKoreanDate(c.last_contact_date) : "없음"
            }
          />
          <Row
            label="다음 이벤트 예정일"
            value={
              c.next_event_date ? formatKoreanDate(c.next_event_date) : "없음"
            }
          />
          <Row label="비고" value={c.memo ?? "없음"} />
        </CardContent>
      </Card>

      {trades.ok ? <HoldingsSummary holdings={holdings} /> : null}

      <TradeHistorySection customerId={c.id} result={trades} />
    </main>
  );
}
