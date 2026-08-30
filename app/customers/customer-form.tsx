"use client";

import Link from "next/link";
import { useActionState, useState } from "react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import { Textarea } from "@/components/ui/textarea";
import { todayInSeoul } from "@/lib/date";
import {
  FREQUENCY_LABEL_LABELS,
  GENDER_LABELS,
  INFLOW_CHANNEL_LABELS,
  PURCHASE_PURPOSE_LABELS,
  REVENUE_LABEL_LABELS,
} from "@/lib/labels";
import {
  FREQUENCY_LABELS,
  GENDERS,
  INFLOW_CHANNELS,
  PURCHASE_PURPOSES,
  REVENUE_LABELS,
} from "@/lib/types/database";
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
  /** 추천인 선택 후보(자기 자신 제외, 수정 페이지에서는 호출 측에서 필터링). */
  referrerCandidates?: { id: string; name: string; phone: string }[];
};

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p role="alert" className="text-xs text-destructive">
      {message}
    </p>
  );
}

function CheckboxGroup({
  legend,
  name,
  options,
  labels,
  checked,
  required,
  error,
}: {
  legend: string;
  name: string;
  options: readonly string[];
  labels: Record<string, string>;
  checked: Set<string>;
  required?: boolean;
  error?: string;
}) {
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="text-sm font-medium">
        {legend}
        {required ? <span className="text-destructive"> *</span> : null}
        <span className="ml-1 font-normal text-muted-foreground">
          (다중 선택)
        </span>
      </legend>
      <div className="grid gap-2 sm:grid-cols-2">
        {options.map((code) => (
          <label key={code} className="flex items-center gap-2 text-sm">
            <Checkbox
              name={name}
              value={code}
              aria-label={labels[code]}
              defaultChecked={checked.has(code)}
            />
            {labels[code]}
          </label>
        ))}
      </div>
      <FieldError message={error} />
    </fieldset>
  );
}

export function CustomerForm({
  action,
  submitLabel,
  cancelHref,
  defaults,
  referrerCandidates = [],
}: Props) {
  const [state, formAction, pending] = useActionState(
    action,
    initialCustomerFormState,
  );

  const v = state.values;
  const e = state.fieldErrors;

  const [phone, setPhone] = useState(
    formatKoreanPhone(v?.phone ?? defaults?.phone ?? ""),
  );

  const val = (formKey: string, fromDefaults: string | null | undefined) => {
    const raw = (v as Record<string, unknown> | null)?.[formKey];
    return (typeof raw === "string" ? raw : undefined) ?? fromDefaults ?? "";
  };

  const checkedChannels = new Set<string>(
    v?.inflow_channels ?? defaults?.inflow_channels ?? [],
  );
  const checkedPurposes = new Set<string>(
    v?.purchase_purposes ?? defaults?.purchase_purposes ?? [],
  );
  const registeredOnDefault =
    v?.registered_on ?? defaults?.registered_on ?? todayInSeoul();
  const [gender, setGender] = useState<string>(
    val("gender", defaults?.gender) || "UNKNOWN",
  );
  const [frequencyLabel, setFrequencyLabel] = useState<string>(
    val("frequency_label", defaults?.frequency_label) || "신규",
  );
  const [revenueLabel, setRevenueLabel] = useState<string>(
    val("revenue_label", defaults?.revenue_label) || "일반",
  );
  const [referredBy, setReferredBy] = useState<string>(
    val("referred_by_customer_id", defaults?.referred_by_customer_id ?? undefined),
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
        <Input
          id="name"
          name="name"
          defaultValue={val("name", defaults?.name)}
          required
        />
        <FieldError message={e.name} />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="phone">
          전화번호 <span className="text-destructive">*</span>
        </Label>
        <Input
          id="phone"
          name="phone"
          inputMode="tel"
          placeholder="예: 010-1234-5678"
          value={phone}
          onChange={(ev) => setPhone(formatKoreanPhone(ev.target.value))}
          required
        />
        <FieldError message={e.phone} />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="email">이메일 주소 (선택)</Label>
        <Input
          id="email"
          name="email"
          type="email"
          inputMode="email"
          placeholder="예: hong@example.com"
          defaultValue={val("email", defaults?.email)}
        />
        <FieldError message={e.email} />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="birth_date">생년월일 (선택)</Label>
        <DateInput
          id="birth_date"
          name="birth_date"
          defaultValue={val("birth_date", defaults?.birth_date)}
        />
        <FieldError message={e.birth_date} />
      </div>

      <fieldset className="flex flex-col gap-2">
        <legend className="text-sm font-medium">성별</legend>
        <div className="flex gap-4">
          {GENDERS.map((code) => (
            <label key={code} className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                name="gender"
                value={code}
                checked={gender === code}
                onChange={() => setGender(code)}
              />
              {GENDER_LABELS[code]}
            </label>
          ))}
        </div>
        <FieldError message={e.gender} />
      </fieldset>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="address">주소 (선택)</Label>
        <Input
          id="address"
          name="address"
          placeholder="예: 서울시 종로구 …"
          defaultValue={val("address", defaults?.address)}
        />
        <FieldError message={e.address} />
      </div>

      <CheckboxGroup
        legend="유입 경로"
        name="inflow_channels"
        options={INFLOW_CHANNELS}
        labels={INFLOW_CHANNEL_LABELS}
        checked={checkedChannels}
        required
        error={e.inflow_channels}
      />

      <CheckboxGroup
        legend="방문 목적"
        name="purchase_purposes"
        options={PURCHASE_PURPOSES}
        labels={PURCHASE_PURPOSE_LABELS}
        checked={checkedPurposes}
        error={e.purchase_purposes}
      />

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="registered_on">
          고객 등록일 <span className="text-destructive">*</span>
        </Label>
        <DateInput
          id="registered_on"
          name="registered_on"
          defaultValue={registeredOnDefault}
          required
        />
        <p className="text-xs text-muted-foreground">
          기본값은 오늘이며 직접 수정할 수 있습니다.
        </p>
        <FieldError message={e.registered_on} />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="first_trade_date">첫 거래일자 (선택)</Label>
        <DateInput
          id="first_trade_date"
          name="first_trade_date"
          defaultValue={val("first_trade_date", defaults?.first_trade_date)}
        />
        <FieldError message={e.first_trade_date} />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="last_contact_date">마지막 연락일 (선택)</Label>
        <DateInput
          id="last_contact_date"
          name="last_contact_date"
          defaultValue={val("last_contact_date", defaults?.last_contact_date)}
        />
        <FieldError message={e.last_contact_date} />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label>빈도 라벨</Label>
        <Select
          name="frequency_label"
          items={FREQUENCY_LABEL_LABELS}
          value={frequencyLabel}
          onValueChange={(val) => setFrequencyLabel(String(val))}
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {FREQUENCY_LABELS.map((code) => (
              <SelectItem key={code} value={code}>
                {FREQUENCY_LABEL_LABELS[code]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <FieldError message={e.frequency_label} />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label>매출 라벨</Label>
        <Select
          name="revenue_label"
          items={REVENUE_LABEL_LABELS}
          value={revenueLabel}
          onValueChange={(val) => setRevenueLabel(String(val))}
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {REVENUE_LABELS.map((code) => (
              <SelectItem key={code} value={code}>
                {REVENUE_LABEL_LABELS[code]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <FieldError message={e.revenue_label} />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label>추천인 (선택)</Label>
        <Select
          name="referred_by_customer_id"
          items={Object.fromEntries([
            ["NONE", "없음"],
            ...referrerCandidates.map((c) => [c.id, `${c.name} (${c.phone})`]),
          ])}
          value={referredBy || "NONE"}
          onValueChange={(val) => setReferredBy(val === "NONE" ? "" : String(val))}
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="NONE">없음</SelectItem>
            {referrerCandidates.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name} ({c.phone})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <FieldError message={e.referred_by_customer_id} />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="memo">비고</Label>
        <Textarea
          id="memo"
          name="memo"
          rows={3}
          defaultValue={val("memo", defaults?.memo)}
        />
        <FieldError message={e.memo} />
      </div>

      <div className="flex gap-2">
        <Button type="submit" disabled={pending}>
          {pending ? "저장 중…" : submitLabel}
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
