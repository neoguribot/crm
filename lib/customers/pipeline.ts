import {
  CUSTOMER_STAGES,
  type CustomerStage,
} from "@/lib/types/database";

/** 파이프라인 컬럼(고객 영업 단계)을 순서대로. */
export const PIPELINE_STAGES = CUSTOMER_STAGES;

export function isCustomerStage(value: unknown): value is CustomerStage {
  return (
    typeof value === "string" &&
    (CUSTOMER_STAGES as readonly string[]).includes(value)
  );
}

/** 현재 단계의 인덱스. 알 수 없으면 0. */
export function stageIndex(stage: CustomerStage): number {
  const i = CUSTOMER_STAGES.indexOf(stage);
  return i < 0 ? 0 : i;
}

/** 다음 단계 (마지막이면 null). */
export function nextStage(stage: CustomerStage): CustomerStage | null {
  const i = stageIndex(stage);
  return i < CUSTOMER_STAGES.length - 1 ? CUSTOMER_STAGES[i + 1] : null;
}

/** 이전 단계 (첫 단계면 null). */
export function prevStage(stage: CustomerStage): CustomerStage | null {
  const i = stageIndex(stage);
  return i > 0 ? CUSTOMER_STAGES[i - 1] : null;
}

/** 고객 목록을 단계별로 그룹. 모든 단계 키가 존재하며, 각 배열은 입력 순서를 유지한다. */
export function groupByStage<T extends { stage: CustomerStage }>(
  customers: readonly T[],
): Record<CustomerStage, T[]> {
  const groups = Object.fromEntries(
    CUSTOMER_STAGES.map((s) => [s, [] as T[]]),
  ) as Record<CustomerStage, T[]>;

  for (const c of customers) {
    (groups[c.stage] ?? groups.NEW_INQUIRY).push(c);
  }
  return groups;
}
