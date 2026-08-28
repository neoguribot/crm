"use client";

import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CUSTOMER_STAGE_LABELS } from "@/lib/labels";
import { CUSTOMER_STAGES, type CustomerStage } from "@/lib/types/database";
import { updateCustomerStage } from "@/app/pipeline/actions";

const STAGE_ITEMS: Record<string, string> = Object.fromEntries(
  CUSTOMER_STAGES.map((s) => [s, CUSTOMER_STAGE_LABELS[s]]),
);

export function CustomerStageControl({
  customerId,
  stage,
}: {
  customerId: string;
  stage: CustomerStage;
}) {
  const [value, setValue] = useState<CustomerStage>(stage);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function change(nextStage: CustomerStage) {
    if (nextStage === value) return;
    const prev = value;
    setValue(nextStage);
    setError(null);
    startTransition(async () => {
      const res = await updateCustomerStage(customerId, nextStage);
      if (!res.ok) {
        setValue(prev);
        setError(res.error ?? "단계를 변경하지 못했습니다.");
      }
    });
  }

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2">
        <Select
          value={value}
          items={STAGE_ITEMS}
          onValueChange={(v) => change(v as CustomerStage)}
        >
          <SelectTrigger className="w-40" disabled={pending}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CUSTOMER_STAGES.map((s) => (
              <SelectItem key={s} value={s}>
                {CUSTOMER_STAGE_LABELS[s]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          size="sm"
          variant="ghost"
          render={<a href="/pipeline" />}
        >
          파이프라인
        </Button>
      </div>
      {error ? (
        <p role="alert" className="text-xs text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}
