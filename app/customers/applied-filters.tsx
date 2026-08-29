import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { INFLOW_CHANNEL_LABELS, PURCHASE_PURPOSE_LABELS } from "@/lib/labels";
import {
  buildCustomerSearchParams,
  hasActiveFilters,
  type CustomerFilters,
} from "@/lib/customers/filters";

/** 적용 중인 필터를 Badge 로 보여준다. 각 Badge 의 x 는 해당 조건만 해제한다. */
export function AppliedFilters({ filters }: { filters: CustomerFilters }) {
  if (!hasActiveFilters(filters)) return null;

  const chips: { key: string; label: string; next: CustomerFilters }[] = [];

  if (filters.q) {
    chips.push({
      key: "q",
      label: `검색: "${filters.q}"`,
      next: { ...filters, q: "" },
    });
  }
  if (filters.purpose) {
    chips.push({
      key: "purpose",
      label: `구매목적: ${PURCHASE_PURPOSE_LABELS[filters.purpose]}`,
      next: { ...filters, purpose: null },
    });
  }
  if (filters.channel) {
    chips.push({
      key: "channel",
      label: `유입경로: ${INFLOW_CHANNEL_LABELS[filters.channel]}`,
      next: { ...filters, channel: null },
    });
  }
  if (filters.inactiveDays) {
    chips.push({
      key: "inactiveDays",
      label: `미방문 ${filters.inactiveDays}일 이상`,
      next: { ...filters, inactiveDays: null },
    });
  }
  if (filters.visitFrom || filters.visitTo) {
    const range = `${filters.visitFrom ?? "처음"} ~ ${filters.visitTo ?? "오늘"}`;
    chips.push({
      key: "visit",
      label: `방문일: ${range}`,
      next: { ...filters, visitFrom: null, visitTo: null },
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-sm text-muted-foreground">적용된 조건:</span>
      {chips.map((chip) => {
        const qs = buildCustomerSearchParams(chip.next).toString();
        return (
          <Badge key={chip.key} variant="secondary" className="gap-1">
            {chip.label}
            <Link
              href={qs ? `/customers?${qs}` : "/customers"}
              aria-label={`${chip.label} 조건 해제`}
              className="ml-0.5 rounded px-0.5 hover:bg-foreground/10"
            >
              ×
            </Link>
          </Badge>
        );
      })}
      <Button
        variant="ghost"
        size="sm"
        render={<Link href="/customers" />}
      >
        모두 지우기
      </Button>
    </div>
  );
}
