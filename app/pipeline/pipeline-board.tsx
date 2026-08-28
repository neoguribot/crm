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
import { formatKoreanDate } from "@/lib/date";
import { CUSTOMER_STAGE_LABELS } from "@/lib/labels";
import type { CustomerStage } from "@/lib/types/database";
import type { PipelineCustomer } from "@/lib/customers/queries";
import {
  groupByStage,
  nextStage,
  PIPELINE_STAGES,
  prevStage,
} from "@/lib/customers/pipeline";
import { updateCustomerStage } from "@/app/pipeline/actions";

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
      style={transform ? { transform: CSS.Translate.toString(transform) } : undefined}
      className={`rounded-lg border bg-card p-3 text-sm shadow-sm ${
        isDragging ? "opacity-50" : ""
      }`}
    >
      <div
        {...listeners}
        {...attributes}
        className="cursor-grab active:cursor-grabbing"
      >
        <Link
          href={`/customers/${customer.id}`}
          className="font-medium hover:underline"
          onPointerDown={(e) => e.stopPropagation()}
        >
          {customer.name}
        </Link>
        <p className="mt-0.5 text-xs text-muted-foreground tabular-nums">
          {customer.phone}
        </p>
        {customer.next_event_date ? (
          <p className="mt-1 text-xs text-muted-foreground">
            다음 이벤트 {formatKoreanDate(customer.next_event_date)}
          </p>
        ) : null}
      </div>

      <div className="mt-2 flex gap-1">
        <Button
          type="button"
          size="xs"
          variant="outline"
          disabled={disabled || !prev}
          aria-label="이전 단계로"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={() => prev && onMove(customer.id, prev)}
        >
          ◀ 이전
        </Button>
        <Button
          type="button"
          size="xs"
          variant="outline"
          disabled={disabled || !next}
          aria-label="다음 단계로"
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
      className={`flex w-64 shrink-0 flex-col gap-2 rounded-xl border bg-muted/30 p-3 ${
        isOver ? "ring-2 ring-ring" : ""
      }`}
    >
      <h2 className="flex items-center justify-between text-sm font-semibold">
        {CUSTOMER_STAGE_LABELS[stage]}
        <Badge variant="secondary">{customers.length}</Badge>
      </h2>
      <div className="flex flex-col gap-2">
        {customers.length === 0 ? (
          <p className="py-4 text-center text-xs text-muted-foreground">
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
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
      <DndContext id="pipeline-board" sensors={sensors} onDragEnd={handleDragEnd}>
        <div className="flex gap-3 overflow-x-auto pb-2">
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
