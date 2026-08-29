"use client";

import { useRouter } from "next/navigation";
import { useId } from "react";

import { Button } from "@/components/ui/button";
import { DateInput } from "@/components/ui/date-input";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { INFLOW_CHANNEL_LABELS, PURCHASE_PURPOSE_LABELS } from "@/lib/labels";
import { INFLOW_CHANNELS, PURCHASE_PURPOSES } from "@/lib/types/database";
import {
  SEARCH_MAX_LENGTH,
  type CustomerFilters,
} from "@/lib/customers/filters";

const ALL = "ALL";

const PURPOSE_ITEMS: Record<string, string> = {
  [ALL]: "전체",
  ...Object.fromEntries(
    PURCHASE_PURPOSES.map((c) => [c, PURCHASE_PURPOSE_LABELS[c]]),
  ),
};
const CHANNEL_ITEMS: Record<string, string> = {
  [ALL]: "전체",
  ...Object.fromEntries(
    INFLOW_CHANNELS.map((c) => [c, INFLOW_CHANNEL_LABELS[c]]),
  ),
};
export function CustomerFilterBar({ filters }: { filters: CustomerFilters }) {
  const router = useRouter();
  const qId = useId();
  const visitFromId = useId();
  const visitToId = useId();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const params = new URLSearchParams();

    const q = String(form.get("q") ?? "").trim().slice(0, SEARCH_MAX_LENGTH);
    if (q) params.set("q", q);

    const purpose = String(form.get("purpose") ?? "");
    if (purpose && purpose !== ALL) params.set("purpose", purpose);

    const channel = String(form.get("channel") ?? "");
    if (channel && channel !== ALL) params.set("channel", channel);

    let visitFrom = String(form.get("visitFrom") ?? "").trim();
    let visitTo = String(form.get("visitTo") ?? "").trim();
    if (visitFrom && visitTo && visitFrom > visitTo) {
      [visitFrom, visitTo] = [visitTo, visitFrom];
    }
    if (visitFrom) params.set("visitFrom", visitFrom);
    if (visitTo) params.set("visitTo", visitTo);

    const qs = params.toString();
    router.push(qs ? `/customers?${qs}` : "/customers");
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-4 rounded-xl border bg-card p-4"
    >
      <div className="flex flex-col gap-1.5">
        <Label htmlFor={qId}>이름(정확히) 또는 연락처 검색</Label>
        <Input
          id={qId}
          name="q"
          defaultValue={filters.q}
          maxLength={SEARCH_MAX_LENGTH}
          placeholder="예: 홍길동 또는 010-1234"
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label>구매목적</Label>
          <Select
            name="purpose"
            items={PURPOSE_ITEMS}
            defaultValue={filters.purpose ?? ALL}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>전체</SelectItem>
              {PURCHASE_PURPOSES.map((code) => (
                <SelectItem key={code} value={code}>
                  {PURCHASE_PURPOSE_LABELS[code]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label>유입경로</Label>
          <Select
            name="channel"
            items={CHANNEL_ITEMS}
            defaultValue={filters.channel ?? ALL}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>전체</SelectItem>
              {INFLOW_CHANNELS.map((code) => (
                <SelectItem key={code} value={code}>
                  {INFLOW_CHANNEL_LABELS[code]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

      </div>

      <fieldset className="flex flex-col gap-1.5">
        <legend className="mb-1.5 text-sm font-medium">방문일 (기간)</legend>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor={visitFromId} className="text-xs text-muted-foreground">
              시작
            </Label>
            <DateInput
              id={visitFromId}
              name="visitFrom"
              defaultValue={filters.visitFrom ?? ""}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor={visitToId} className="text-xs text-muted-foreground">
              종료
            </Label>
            <DateInput
              id={visitToId}
              name="visitTo"
              defaultValue={filters.visitTo ?? ""}
            />
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          최초 방문일 또는 거래일이 이 기간 안에 있는 고객을 찾습니다.
        </p>
      </fieldset>

      <div className="flex gap-2">
        <Button type="submit">검색</Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/customers")}
        >
          전체 초기화
        </Button>
      </div>
    </form>
  );
}
