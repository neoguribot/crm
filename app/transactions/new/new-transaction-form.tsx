"use client";

import { useState } from "react";

import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TradeForm } from "@/app/customers/[id]/trades/trade-form";
import { createTradeRecordStandalone } from "@/app/transactions/actions";

export function NewTransactionForm({
  customers,
}: {
  customers: { id: string; name: string; phone: string }[];
}) {
  const [customerId, setCustomerId] = useState<string>("");

  const customerItems = Object.fromEntries(
    customers.map((c) => [c.id, `${c.name} (${c.phone})`]),
  );

  return (
    <TradeForm
      action={createTradeRecordStandalone}
      cancelHref="/transactions"
      submitLabel="거래 등록"
      beforeFields={
        <div className="flex flex-col gap-1.5">
          <Label>
            고객 <span className="text-destructive">*</span>
          </Label>
          <Select
            name="customer_id"
            items={customerItems}
            value={customerId || undefined}
            onValueChange={(next) => setCustomerId(String(next))}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="고객을 선택해 주세요" />
            </SelectTrigger>
            <SelectContent>
              {customers.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name} ({c.phone})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      }
    />
  );
}
