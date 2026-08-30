import {
  FREQUENCY_LABELS,
  INFLOW_CHANNELS,
  REVENUE_LABELS,
  type FrequencyLabel,
  type Gender,
  type InflowChannel,
  type RevenueLabel,
} from "@/lib/types/database";

export const AGE_BUCKETS = [
  "10s",
  "20s",
  "30s",
  "40s",
  "50s",
  "60_PLUS",
  "UNKNOWN",
] as const;
export type AgeBucket = (typeof AGE_BUCKETS)[number];

export const AGE_BUCKET_LABELS: Record<AgeBucket, string> = {
  "10s": "10대",
  "20s": "20대",
  "30s": "30대",
  "40s": "40대",
  "50s": "50대",
  "60_PLUS": "60대 이상",
  UNKNOWN: "미상",
};

export type TopCustomer = {
  id: string;
  name: string;
  totalAmount: string;
  tradeCount: number;
};

export type CustomerAnalytics = {
  customerCount: number;
  genderCounts: Record<Gender, number>;
  frequencyCounts: Record<FrequencyLabel, number>;
  revenueCounts: Record<RevenueLabel, number>;
  channelCounts: Record<InflowChannel, number>;
  ageBucketCounts: Record<AgeBucket, number>;
  topCustomers: TopCustomer[];
};

function toCount(value: unknown): number {
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) && n >= 0 ? Math.floor(n) : 0;
}

function isRawTopCustomer(
  value: unknown,
): value is { id: string; name: string; total_amount: string; trade_count: number } {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return typeof v.id === "string" && typeof v.name === "string";
}

/** `customer_analytics()` RPC 의 jsonb 응답을 타입 있는 값으로 정규화한다. */
export function normalizeCustomerAnalytics(raw: unknown): CustomerAnalytics {
  const r = (typeof raw === "object" && raw !== null ? raw : {}) as Record<string, unknown>;

  const genderRaw =
    typeof r.gender_counts === "object" && r.gender_counts !== null
      ? (r.gender_counts as Record<string, unknown>)
      : {};
  const genderCounts = {
    UNKNOWN: toCount(genderRaw.UNKNOWN),
    MALE: toCount(genderRaw.MALE),
    FEMALE: toCount(genderRaw.FEMALE),
  } as Record<Gender, number>;

  const frequencyRaw =
    typeof r.frequency_counts === "object" && r.frequency_counts !== null
      ? (r.frequency_counts as Record<string, unknown>)
      : {};
  const frequencyCounts = Object.fromEntries(
    FREQUENCY_LABELS.map((f) => [f, toCount(frequencyRaw[f])]),
  ) as Record<FrequencyLabel, number>;

  const revenueRaw =
    typeof r.revenue_counts === "object" && r.revenue_counts !== null
      ? (r.revenue_counts as Record<string, unknown>)
      : {};
  const revenueCounts = Object.fromEntries(
    REVENUE_LABELS.map((rv) => [rv, toCount(revenueRaw[rv])]),
  ) as Record<RevenueLabel, number>;

  const channelRaw =
    typeof r.channel_counts === "object" && r.channel_counts !== null
      ? (r.channel_counts as Record<string, unknown>)
      : {};
  const channelCounts = Object.fromEntries(
    INFLOW_CHANNELS.map((c) => [c, toCount(channelRaw[c])]),
  ) as Record<InflowChannel, number>;

  const ageRaw =
    typeof r.age_bucket_counts === "object" && r.age_bucket_counts !== null
      ? (r.age_bucket_counts as Record<string, unknown>)
      : {};
  const ageBucketCounts = Object.fromEntries(
    AGE_BUCKETS.map((a) => [a, toCount(ageRaw[a])]),
  ) as Record<AgeBucket, number>;

  const topCustomers = Array.isArray(r.top_customers)
    ? r.top_customers
        .filter(isRawTopCustomer)
        .map((t) => ({
          id: t.id,
          name: t.name,
          totalAmount: String(t.total_amount ?? "0"),
          tradeCount: toCount(t.trade_count),
        }))
    : [];

  return {
    customerCount: toCount(r.customer_count),
    genderCounts,
    frequencyCounts,
    revenueCounts,
    channelCounts,
    ageBucketCounts,
    topCustomers,
  };
}
