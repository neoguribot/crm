import type { Metadata } from "next";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatKoreanDate } from "@/lib/date";
import { searchCustomers } from "@/lib/customers/queries";
import {
  hasActiveFilters,
  parseCustomerFilters,
} from "@/lib/customers/filters";
import { INFLOW_CHANNEL_LABELS, PURCHASE_PURPOSE_LABELS } from "@/lib/labels";
import { requireUser } from "@/lib/supabase/require-user";
import { AppliedFilters } from "@/app/customers/applied-filters";
import { CustomerFilterBar } from "@/app/customers/customer-filter-bar";
import { DeleteCustomerButton } from "@/app/customers/delete-customer-button";

export const metadata: Metadata = {
  title: "고객 목록",
};

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  await requireUser();

  const filters = parseCustomerFilters(await searchParams);
  const active = hasActiveFilters(filters);
  const result = await searchCustomers(filters);

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 px-6 py-10">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">고객 목록</h1>
        <Button render={<Link href="/customers/new" />}>신규 고객 등록</Button>
      </div>

      <CustomerFilterBar filters={filters} />
      <AppliedFilters filters={filters} />

      {!result.ok ? (
        <Card>
          <CardContent className="py-8 text-center text-sm text-destructive">
            {result.error}
          </CardContent>
        </Card>
      ) : result.data.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
            {active ? (
              <>
                <p className="text-sm text-muted-foreground">
                  조건에 맞는 고객이 없습니다.
                </p>
                <Button
                  variant="outline"
                  render={<Link href="/customers" />}
                >
                  필터 초기화
                </Button>
              </>
            ) : (
              <>
                <p className="text-sm text-muted-foreground">
                  아직 등록된 고객이 없습니다.
                </p>
                <Button render={<Link href="/customers/new" />}>
                  첫 고객 등록하기
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      ) : (
        <>
          <p className="text-sm text-muted-foreground">
            총 {result.data.length}명
          </p>
          <ul className="flex flex-col gap-3">
            {result.data.map((customer) => (
              <li key={customer.id}>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex flex-wrap items-center justify-between gap-2">
                      <Link
                        href={`/customers/${customer.id}`}
                        className="rounded outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring/50"
                      >
                        {customer.name}
                      </Link>
                      <span className="text-sm font-normal text-muted-foreground">
                        {customer.phone}
                      </span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="flex flex-col gap-3">
                    <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-muted-foreground">
                      <span>
                        유입경로:{" "}
                        {INFLOW_CHANNEL_LABELS[customer.inflow_channel]}
                      </span>
                      <span>
                        구매목적:{" "}
                        {customer.purchase_purposes.length > 0
                          ? customer.purchase_purposes
                              .map((p) => PURCHASE_PURPOSE_LABELS[p])
                              .join(", ")
                          : "없음"}
                      </span>
                      <span>
                        최근 방문일: {formatKoreanDate(customer.last_visit_date)}
                      </span>
                      <span>미방문 {customer.inactive_days}일</span>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        render={<Link href={`/customers/${customer.id}`} />}
                      >
                        상세
                      </Button>
                      <DeleteCustomerButton
                        customerId={customer.id}
                        customerName={customer.name}
                      />
                    </div>
                  </CardContent>
                </Card>
              </li>
            ))}
          </ul>
        </>
      )}
    </main>
  );
}
