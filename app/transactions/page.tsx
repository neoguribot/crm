import type { Metadata } from "next";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatKoreanDate } from "@/lib/date";
import { formatWon } from "@/lib/number";
import {
  ITEM_TYPE_LABELS,
  TRADE_STATUS_LABELS,
  TRADE_TYPE_LABELS,
} from "@/lib/labels";
import { TRADE_STATUSES, TRADE_TYPES } from "@/lib/types/database";
import { searchTradeRecords } from "@/lib/trades/queries";
import { requireUser } from "@/lib/supabase/require-user";

export const metadata: Metadata = {
  title: "거래 관리",
};

export const dynamic = "force-dynamic";

export default async function TransactionsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  await requireUser();

  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q : "";
  const tradeType = TRADE_TYPES.find((t) => t === sp.trade_type);
  const status = TRADE_STATUSES.find((s) => s === sp.status);

  const result = await searchTradeRecords({ q, tradeType, status });

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-6 py-10">
      <div>
        <h1 className="text-xl font-semibold">거래 관리</h1>
        <p className="text-sm text-muted-foreground">전체 거래 검색·조회</p>
      </div>

      <form className="flex flex-wrap items-end gap-3" method="get">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="q" className="text-sm text-muted-foreground">
            고객 이름/전화번호
          </label>
          <Input id="q" name="q" defaultValue={q} placeholder="검색어" />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm text-muted-foreground">거래구분</label>
          <Select name="trade_type" items={TRADE_TYPE_LABELS} defaultValue={tradeType}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="전체" />
            </SelectTrigger>
            <SelectContent>
              {TRADE_TYPES.map((t) => (
                <SelectItem key={t} value={t}>
                  {TRADE_TYPE_LABELS[t]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm text-muted-foreground">완료 여부</label>
          <Select name="status" items={TRADE_STATUS_LABELS} defaultValue={status}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="전체" />
            </SelectTrigger>
            <SelectContent>
              {TRADE_STATUSES.map((s) => (
                <SelectItem key={s} value={s}>
                  {TRADE_STATUS_LABELS[s]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button type="submit">검색</Button>
      </form>

      {!result.ok ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-destructive">
            {result.error}
          </CardContent>
        </Card>
      ) : result.data.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            조건에 맞는 거래가 없습니다.
          </CardContent>
        </Card>
      ) : (
        <ul className="flex flex-col gap-2">
          {result.data.map((t) => (
            <li key={t.id}>
              <Link href={`/transactions/${t.id}`}>
                <Card className="transition-colors hover:bg-muted/50">
                  <CardContent className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm">
                    <div className="flex items-center gap-2">
                      <Badge variant={t.trade_type === "SALE" ? "secondary" : "outline"}>
                        {TRADE_TYPE_LABELS[t.trade_type]}
                      </Badge>
                      <Badge variant="outline">{TRADE_STATUS_LABELS[t.status]}</Badge>
                      <span className="font-medium">{t.customer_name}</span>
                      <span className="text-muted-foreground">
                        {ITEM_TYPE_LABELS[t.item_type]}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="tabular-nums">{formatWon(t.amount)}</span>
                      <span className="tabular-nums text-muted-foreground">
                        {formatKoreanDate(t.trade_date)}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
