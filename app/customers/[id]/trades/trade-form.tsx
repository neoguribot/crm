"use client";

import Link from "next/link";
import { useActionState, useMemo, useState } from "react";

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
import {
  ITEM_TYPES,
  TRADE_TYPES,
  isPurchaseOnlyItemType,
} from "@/lib/types/database";
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

  const [tradeType, setTradeType] = useState<string>(v?.trade_type ?? "");
  const [itemType, setItemType] = useState<string>(v?.item_type ?? "");

  // 매입일 때만 매입 전용 품목을 노출한다.
  const itemOptions = useMemo(
    () =>
      ITEM_TYPES.filter(
        (it) => tradeType === "PURCHASE" || !isPurchaseOnlyItemType(it),
      ),
    [tradeType],
  );
  const itemItems = useMemo(
    () =>
      Object.fromEntries(itemOptions.map((it) => [it, ITEM_TYPE_LABELS[it]])),
    [itemOptions],
  );

  function onTradeTypeChange(next: string) {
    setTradeType(next);
    // 판매로 바꿨는데 현재 품목이 매입 전용이면 초기화
    if (next === "SALE" && isPurchaseOnlyItemType(itemType)) {
      setItemType("");
    }
  }

  const showDetail = itemType === "OTHER";

  return (
    <form action={formAction} className="flex flex-col gap-5">
      {state.status === "error" && state.message ? (
        <p role="alert" className="text-sm text-destructive">
          {state.message}
        </p>
      ) : null}

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
        <Label>
          거래구분 <span className="text-destructive">*</span>
        </Label>
        <Select
          name="trade_type"
          items={TRADE_TYPE_LABELS}
          value={tradeType || undefined}
          onValueChange={(val) => onTradeTypeChange(String(val))}
        >
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
          거래 품목 <span className="text-destructive">*</span>
        </Label>
        <Select
          name="item_type"
          items={itemItems}
          value={itemType || undefined}
          onValueChange={(val) => setItemType(String(val))}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="선택해 주세요" />
          </SelectTrigger>
          <SelectContent>
            {itemOptions.map((code) => (
              <SelectItem key={code} value={code}>
                {ITEM_TYPE_LABELS[code]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {tradeType !== "PURCHASE" ? (
          <p className="text-xs text-muted-foreground">
            은수저·치금은 매입 거래에서만 선택할 수 있습니다.
          </p>
        ) : null}
        <FieldError message={e.item_type} />
      </div>

      {showDetail ? (
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="item_detail">
            기타 세부 내용 <span className="text-destructive">*</span>
          </Label>
          <Input
            id="item_detail"
            name="item_detail"
            type="text"
            placeholder="예: 백금 반지"
            defaultValue={v?.item_detail ?? ""}
          />
          <FieldError message={e.item_detail} />
        </div>
      ) : (
        <input type="hidden" name="item_detail" value="" />
      )}

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="unit_price">
          기준 단가 (원) <span className="text-destructive">*</span>
        </Label>
        <Input
          id="unit_price"
          name="unit_price"
          type="text"
          inputMode="numeric"
          placeholder="예: 155000"
          defaultValue={v?.unit_price ?? ""}
          required
        />
        <FieldError message={e.unit_price} />
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
          총 금액 (원) <span className="text-destructive">*</span>
        </Label>
        <Input
          id="amount"
          name="amount"
          type="text"
          inputMode="numeric"
          placeholder="예: 581250"
          defaultValue={v?.amount ?? ""}
          required
        />
        <FieldError message={e.amount} />
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
