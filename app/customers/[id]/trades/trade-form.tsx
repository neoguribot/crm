"use client";

import Link from "next/link";
import { useActionState } from "react";

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
import { Textarea } from "@/components/ui/textarea";
import { ITEM_TYPE_LABELS, TRADE_TYPE_LABELS } from "@/lib/labels";
import { ITEM_TYPES, TRADE_TYPES } from "@/lib/types/database";
import {
  initialTradeFormState,
  type TradeFormState,
} from "@/app/customers/[id]/trades/form-state";

type Action = (
  state: TradeFormState,
  formData: FormData,
) => Promise<TradeFormState>;

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p role="alert" className="text-xs text-destructive">
      {message}
    </p>
  );
}

export function TradeForm({
  action,
  cancelHref,
}: {
  action: Action;
  cancelHref: string;
}) {
  const [state, formAction, pending] = useActionState(
    action,
    initialTradeFormState,
  );

  const v = state.values;
  const e = state.fieldErrors;

  return (
    <form action={formAction} className="flex flex-col gap-5">
      {state.status === "error" && state.message ? (
        <p role="alert" className="text-sm text-destructive">
          {state.message}
        </p>
      ) : null}

      <div className="flex flex-col gap-1.5">
        <Label>
          거래구분 <span className="text-destructive">*</span>
        </Label>
        <Select name="trade_type" defaultValue={v?.trade_type || undefined}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="선택해 주세요" />
          </SelectTrigger>
          <SelectContent>
            {TRADE_TYPES.map((code) => (
              <SelectItem key={code} value={code}>
                {TRADE_TYPE_LABELS[code]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <FieldError message={e.trade_type} />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label>
          품목 <span className="text-destructive">*</span>
        </Label>
        <Select name="item_type" defaultValue={v?.item_type || undefined}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="선택해 주세요" />
          </SelectTrigger>
          <SelectContent>
            {ITEM_TYPES.map((code) => (
              <SelectItem key={code} value={code}>
                {ITEM_TYPE_LABELS[code]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <FieldError message={e.item_type} />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="weight">
          중량 (g) <span className="text-destructive">*</span>
        </Label>
        <Input
          id="weight"
          name="weight"
          type="text"
          inputMode="decimal"
          placeholder="예: 3.75"
          defaultValue={v?.weight ?? ""}
          required
        />
        <FieldError message={e.weight} />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="amount">
          금액 (원) <span className="text-destructive">*</span>
        </Label>
        <Input
          id="amount"
          name="amount"
          type="text"
          inputMode="numeric"
          placeholder="예: 350000"
          defaultValue={v?.amount ?? ""}
          required
        />
        <FieldError message={e.amount} />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="purity">순도 (%)</Label>
        <Input
          id="purity"
          name="purity"
          type="text"
          inputMode="decimal"
          placeholder="예: 99.99 (선택)"
          defaultValue={v?.purity ?? ""}
        />
        <FieldError message={e.purity} />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="trade_date">
          거래일 <span className="text-destructive">*</span>
        </Label>
        <Input
          id="trade_date"
          name="trade_date"
          type="date"
          defaultValue={v?.trade_date ?? ""}
          required
        />
        <FieldError message={e.trade_date} />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="memo">비고</Label>
        <Textarea id="memo" name="memo" rows={3} defaultValue={v?.memo ?? ""} />
        <FieldError message={e.memo} />
      </div>

      <div className="flex gap-2">
        <Button type="submit" disabled={pending}>
          {pending ? "저장 중…" : "거래 등록"}
        </Button>
        <Button
          type="button"
          variant="outline"
          render={<Link href={cancelHref} />}
        >
          취소
        </Button>
      </div>
    </form>
  );
}
