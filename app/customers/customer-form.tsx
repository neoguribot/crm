"use client";

import Link from "next/link";
import { useActionState, useState } from "react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import {
  INFLOW_CHANNEL_LABELS,
  PURCHASE_PURPOSE_LABELS,
} from "@/lib/labels";
import { INFLOW_CHANNELS, PURCHASE_PURPOSES } from "@/lib/types/database";
import { formatKoreanPhone } from "@/lib/phone";
import type { CustomerDetail } from "@/lib/customers/queries";
import {
  type CustomerFormState,
  initialCustomerFormState,
} from "@/app/customers/form-state";

type Action = (
  state: CustomerFormState,
  formData: FormData,
) => Promise<CustomerFormState>;

type Props = {
  action: Action;
  submitLabel: string;
  cancelHref: string;
  defaults?: CustomerDetail;
};

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p role="alert" className="text-xs text-destructive">
      {message}
    </p>
  );
}

export function CustomerForm({
  action,
  submitLabel,
  cancelHref,
  defaults,
}: Props) {
  const [state, formAction, pending] = useActionState(
    action,
    initialCustomerFormState,
  );

  const v = state.values;
  const errors = state.fieldErrors;

  const nameDefault = v?.name ?? defaults?.name ?? "";
  const [phone, setPhone] = useState(
    formatKoreanPhone(v?.phone ?? defaults?.phone ?? ""),
  );
  const channelDefault =
    v?.inflow_channel ?? defaults?.inflow_channel ?? "";
  const firstVisitDefault =
    v?.first_visit_date ?? defaults?.first_visit_date ?? "";
  const lastContactDefault =
    v?.last_contact_date ?? defaults?.last_contact_date ?? "";
  const nextEventDefault =
    v?.next_event_date ?? defaults?.next_event_date ?? "";
  const memoDefault = v?.memo ?? defaults?.memo ?? "";
  const checkedPurposes = new Set<string>(
    v?.purchase_purposes ?? defaults?.purchase_purposes ?? [],
  );

  return (
    <form action={formAction} className="flex flex-col gap-5">
      {state.status === "error" && state.message ? (
        <p role="alert" className="text-sm text-destructive">
          {state.message}
        </p>
      ) : null}

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="name">
          이름 <span className="text-destructive">*</span>
        </Label>
        <Input id="name" name="name" defaultValue={nameDefault} required />
        <FieldError message={errors.name} />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="phone">
          연락처 <span className="text-destructive">*</span>
        </Label>
        <Input
          id="phone"
          name="phone"
          inputMode="tel"
          placeholder="예: 010-1234-5678"
          value={phone}
          onChange={(e) => setPhone(formatKoreanPhone(e.target.value))}
          required
        />
        <FieldError message={errors.phone} />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label>
          유입경로 <span className="text-destructive">*</span>
        </Label>
        <Select name="inflow_channel" defaultValue={channelDefault || undefined}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="선택해 주세요" />
          </SelectTrigger>
          <SelectContent>
            {INFLOW_CHANNELS.map((code) => (
              <SelectItem key={code} value={code}>
                {INFLOW_CHANNEL_LABELS[code]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <FieldError message={errors.inflow_channel} />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="first_visit_date">
          최초 방문일 <span className="text-destructive">*</span>
        </Label>
        <Input
          id="first_visit_date"
          name="first_visit_date"
          type="date"
          defaultValue={firstVisitDefault}
          required
        />
        <FieldError message={errors.first_visit_date} />
      </div>

      <fieldset className="flex flex-col gap-2">
        <legend className="text-sm font-medium">구매목적 (복수 선택)</legend>
        <div className="flex flex-col gap-2">
          {PURCHASE_PURPOSES.map((code) => (
            <label
              key={code}
              className="flex items-center gap-2 text-sm"
            >
              <Checkbox
                name="purchase_purposes"
                value={code}
                defaultChecked={checkedPurposes.has(code)}
              />
              {PURCHASE_PURPOSE_LABELS[code]}
            </label>
          ))}
        </div>
        <FieldError message={errors.purchase_purposes} />
      </fieldset>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="last_contact_date">마지막 연락일</Label>
        <Input
          id="last_contact_date"
          name="last_contact_date"
          type="date"
          defaultValue={lastContactDefault}
        />
        <FieldError message={errors.last_contact_date} />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="next_event_date">다음 이벤트 예정일</Label>
        <Input
          id="next_event_date"
          name="next_event_date"
          type="date"
          defaultValue={nextEventDefault}
        />
        <FieldError message={errors.next_event_date} />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="memo">비고</Label>
        <Textarea id="memo" name="memo" rows={3} defaultValue={memoDefault} />
        <FieldError message={errors.memo} />
      </div>

      <div className="flex gap-2">
        <Button type="submit" disabled={pending}>
          {pending ? "저장 중…" : submitLabel}
        </Button>
        <Button type="button" variant="outline" render={<Link href={cancelHref} />}>
          취소
        </Button>
      </div>
    </form>
  );
}
