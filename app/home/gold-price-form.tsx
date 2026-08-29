"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { saveTodayGoldPrice, type PriceActionState } from "@/lib/prices/actions";
import { formatKoreanDate } from "@/lib/date";
import { formatPricePerDon } from "@/lib/prices/target";

const initial: PriceActionState = { ok: false, error: null };

export function GoldPriceForm({
  today,
  todayPrice,
  latestPrice,
}: {
  today: string;
  /** 오늘 저장된 시세 (있으면) */
  todayPrice: string | null;
  /** 가장 최근 시세 + 날짜 (오늘이 아닐 수 있음) */
  latestPrice: { price_per_don: string; price_date: string } | null;
}) {
  const [state, action, pending] = useActionState(saveTodayGoldPrice, initial);

  return (
    <Card>
      <CardHeader>
        <CardTitle>오늘 금 시세</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <p className="text-sm text-muted-foreground">
          순금(24K) 1돈(3.75g) 기준, 원. 저장하면 매수 희망 가격에 도달한 고객을
          찾아 알림을 만듭니다.
        </p>

        {todayPrice ? (
          <p className="text-sm">
            오늘({formatKoreanDate(today)}) 저장됨:{" "}
            <span className="font-semibold tabular-nums">
              {formatPricePerDon(todayPrice)}
            </span>
          </p>
        ) : latestPrice ? (
          <p className="text-sm text-muted-foreground">
            최근 시세({formatKoreanDate(latestPrice.price_date)}):{" "}
            <span className="tabular-nums">
              {formatPricePerDon(latestPrice.price_per_don)}
            </span>
          </p>
        ) : null}

        <form action={action} className="flex flex-wrap items-end gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="price_per_don">시세 (원/돈)</Label>
            <Input
              id="price_per_don"
              name="price_per_don"
              inputMode="numeric"
              required
              placeholder="예: 588750"
              defaultValue={todayPrice ?? latestPrice?.price_per_don ?? ""}
              className="w-40"
            />
          </div>
          <Button type="submit" disabled={pending}>
            {pending ? "저장 중…" : todayPrice ? "오늘 시세 수정" : "저장"}
          </Button>
        </form>

        {state.error ? (
          <p className="text-sm text-destructive">{state.error}</p>
        ) : null}
        {state.ok ? (
          <p className="text-sm text-primary">
            저장되었습니다.
            {state.newAlerts && state.newAlerts > 0
              ? ` 새 알림 ${state.newAlerts}건이 생성되었습니다.`
              : " 새로 도달한 목표가격은 없습니다."}
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
