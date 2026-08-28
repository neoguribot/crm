"use client";

import { useRouter } from "next/navigation";
import { useId } from "react";

import { Button } from "@/components/ui/button";
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
  INACTIVE_DAY_OPTIONS,
  SEARCH_MAX_LENGTH,
  type CustomerFilters,
} from "@/lib/customers/filters";

const ALL = "ALL";

export function CustomerFilterBar({ filters }: { filters: CustomerFilters }) {
  const router = useRouter();
  const qId = useId();

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

    const inactiveDays = String(form.get("inactiveDays") ?? "");
    if (inactiveDays && inactiveDays !== ALL) {
      params.set("inactiveDays", inactiveDays);
    }

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

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="flex flex-col gap-1.5">
          <Label>구매목적</Label>
          <Select name="purpose" defaultValue={filters.purpose ?? ALL}>
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
          <Select name="channel" defaultValue={filters.channel ?? ALL}>
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

        <div className="flex flex-col gap-1.5">
          <Label>미방문 기간</Label>
          <Select
            name="inactiveDays"
            defaultValue={
              filters.inactiveDays ? String(filters.inactiveDays) : ALL
            }
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>전체</SelectItem>
              {INACTIVE_DAY_OPTIONS.map((d) => (
                <SelectItem key={d} value={String(d)}>
                  {d}일 이상
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

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
