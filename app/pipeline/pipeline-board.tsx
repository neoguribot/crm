"use client";

import Link from "next/link";
import { useState, useTransition } from "react";

import {
  DndContext,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatKoreanDate, todayInSeoul } from "@/lib/date";
import { CUSTOMER_STAGE_LABELS } from "@/lib/labels";
import { classifyRemindStatus } from "@/lib/reminders/status";
import type { CustomerStage } from "@/lib/types/database";
import type { PipelineCustomer } from "@/lib/customers/queries";
import {
  groupByStage,
  nextStage,
  PIPELINE_STAGES,
  prevStage,
} from "@/lib/customers/pipeline";
import { updateCustomerStage } from "@/app/pipeline/actions";

/** 단계별 컬럼 상단 색상 표식 (구분용, 작은 점만). */
const STAGE_DOT: Record<CustomerStage, string> = {
  NEW_INQUIRY: "bg-sky-500",
  CONSULTING: "bg-violet-500",
  QUOTE_SENT: "bg-amber-500",
  PURCHASE_CONFIRMED: "bg-emerald-500",
  AFTER_CARE: "bg-zinc-400",
};

function EventBadge({ date }: { date: string }) {
  const status = classifyRemindStatus(date, todayInSeoul());
  const overdue = status === "OVERDUE";
  const soon = status === "WITHIN_7_DAYS";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-xs",
        overdue
          ? "text-destructive"
          : soon
            ? "text-amber-600 dark:text-amber-500"
            : "text-muted-foreground",
      )}
    >
      <span aria-hidden>{overdue ? "!" : "•"}</span>
      이벤트 {formatKoreanDate(date)}
      {overdue ? " (지남)" : null}
    </span>
  );
}

function CardItem({
  customer,
  disabled,
  onMove,
}: {
  customer: PipelineCustomer;
  disabled: boolean;
  onMove: (id: string, to: CustomerStage) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({ id: customer.id });

  const prev = prevStage(customer.stage);
  const next = nextStage(customer.stage);

  return (
    <div
      ref={setNodeRef}
      style={
        transform ? { transform: CSS.Translate.toString(transform) } : undefined
      }
      className={cn(
        "rounded-lg border bg-card p-3 text-sm shadow-xs transition-shadow",
        isDragging
          ? "opacity-60 shadow-lg ring-1 ring-border"
          : "hover:shadow-sm",
      )}
    >
      <div
        {...listeners}
        {...attributes}
        className="touch-none cursor-grab active:cursor-grabbing"
      >
        <div className="flex items-start justify-between gap-2">
          <Link
            href={`/customers/${customer.id}`}
            className="font-medium hover:underline"
            onPointerDown={(e) => e.stopPropagation()}
          >
            {customer.name}
          </Link>
          <span
            aria-hidden
            className="mt-0.5 text-xs leading-none text-muted-foreground/60 select-none"
          >
            ⠿
          </span>
        </div>
        <p className="mt-0.5 text-xs text-muted-foreground tabular-nums">
          {customer.phone}
        </p>
        {customer.next_event_date ? (
          <p className="mt-1.5">
            <EventBadge date={customer.next_event_date} />
          </p>
        ) : null}
      </div>

      <div className="mt-2.5 flex gap-1 border-t pt-2">
        <Button
          type="button"
          size="xs"
          variant="ghost"
          className="flex-1"
          disabled={disabled || !prev}
          aria-label={prev ? `${CUSTOMER_STAGE_LABELS[prev]} 단계로` : "이전 단계 없음"}
          onPointerDown={(e) => e.stopPropagation()}
          onClick={() => prev && onMove(customer.id, prev)}
        >
          ◀ 이전
        </Button>
        <Button
          type="button"
          size="xs"
          variant="ghost"
          className="flex-1"
          disabled={disabled || !next}
          aria-label={next ? `${CUSTOMER_STAGE_LABELS[next]} 단계로` : "다음 단계 없음"}
          onPointerDown={(e) => e.stopPropagation()}
          onClick={() => next && onMove(customer.id, next)}
        >
          다음 ▶
        </Button>
      </div>
    </div>
  );
}

function Column({
  stage,
  customers,
  disabled,
  onMove,
}: {
  stage: CustomerStage;
  customers: PipelineCustomer[];
  disabled: boolean;
  onMove: (id: string, to: CustomerStage) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: stage });

  return (
    <section
      ref={setNodeRef}
      aria-label={CUSTOMER_STAGE_LABELS[stage]}
      className={cn(
        "flex w-64 shrink-0 flex-col gap-2.5 rounded-xl border bg-muted/40 p-3 transition-colors",
        isOver && "border-primary/50 bg-primary/5",
      )}
    >
      <div className="flex items-center gap-2">
        <span
          aria-hidden
          className={cn("size-2 shrink-0 rounded-full", STAGE_DOT[stage])}
        />
        <h2 className="text-sm font-semibold">{CUSTOMER_STAGE_LABELS[stage]}</h2>
        <Badge variant="secondary" className="ml-auto tabular-nums">
          {customers.length}
        </Badge>
      </div>

      <div className="flex min-h-24 flex-col gap-2">
        {customers.length === 0 ? (
          <p className="rounded-lg border border-dashed py-6 text-center text-xs text-muted-foreground">
            고객 없음
          </p>
        ) : (
          customers.map((c) => (
            <CardItem
              key={c.id}
              customer={c}
              disabled={disabled}
              onMove={onMove}
            />
          ))
        )}
      </div>
    </section>
  );
}

export function PipelineBoard({
  initialCustomers,
}: {
  initialCustomers: PipelineCustomer[];
}) {
  const [customers, setCustomers] = useState(initialCustomers);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );

  const groups = groupByStage(customers);

  function onMove(customerId: string, toStage: CustomerStage) {
    const current = customers.find((c) => c.id === customerId);
    if (!current || current.stage === toStage) return;

    const fromStage = current.stage;
    setError(null);
    // 낙관적 업데이트 (updated_at 을 지금으로 → 컬럼 맨 위로)
    setCustomers((prev) =>
      prev.map((c) =>
        c.id === customerId
          ? { ...c, stage: toStage, updated_at: new Date().toISOString() }
          : c,
      ),
    );

    startTransition(async () => {
      const res = await updateCustomerStage(customerId, toStage);
      if (!res.ok) {
        setCustomers((prev) =>
          prev.map((c) =>
            c.id === customerId ? { ...c, stage: fromStage } : c,
          ),
        );
        setError(res.error ?? "단계를 변경하지 못했습니다.");
      }
    });
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over) return;
    const toStage = over.id as CustomerStage;
    onMove(String(active.id), toStage);
  }

  return (
    <div className="flex flex-col gap-3">
      {error ? (
        <p
          role="alert"
          className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive"
        >
          {error}
        </p>
      ) : null}
      <DndContext id="pipeline-board" sensors={sensors} onDragEnd={handleDragEnd}>
        <div
          aria-busy={pending}
          className={cn(
            "-mx-1 flex gap-3 overflow-x-auto px-1 pb-3 transition-opacity",
            pending && "opacity-70",
          )}
        >
          {PIPELINE_STAGES.map((stage) => (
            <Column
              key={stage}
              stage={stage}
              customers={groups[stage]}
              disabled={pending}
              onMove={onMove}
            />
          ))}
        </div>
      </DndContext>
    </div>
  );
}
