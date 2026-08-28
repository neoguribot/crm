import type { Metadata } from "next";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { APP_NAME } from "@/lib/constants";
import { listCustomers } from "@/lib/customers/queries";
import { INFLOW_CHANNEL_LABELS, PURCHASE_PURPOSE_LABELS } from "@/lib/labels";
import { requireUser } from "@/lib/supabase/require-user";

export const metadata: Metadata = {
  title: `고객 목록 · ${APP_NAME}`,
};

export default async function CustomersPage() {
  await requireUser();

  const result = await listCustomers();

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 px-6 py-10">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">고객 목록</h1>
        <Button render={<Link href="/customers/new" />}>신규 고객 등록</Button>
      </div>

      {!result.ok ? (
        <Card>
          <CardContent className="py-8 text-center text-sm text-destructive">
            {result.error}
          </CardContent>
        </Card>
      ) : result.data.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
            <p className="text-sm text-muted-foreground">
              아직 등록된 고객이 없습니다.
            </p>
            <Button render={<Link href="/customers/new" />}>
              첫 고객 등록하기
            </Button>
          </CardContent>
        </Card>
      ) : (
        <ul className="flex flex-col gap-3">
          {result.data.map((customer) => (
            <li key={customer.id}>
              <Link
                href={`/customers/${customer.id}`}
                className="block rounded-xl outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                <Card className="transition-colors hover:bg-muted/50">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>{customer.name}</span>
                      <span className="text-sm font-normal text-muted-foreground">
                        {customer.phone}
                      </span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-muted-foreground">
                    <span>
                      유입경로: {INFLOW_CHANNEL_LABELS[customer.inflow_channel]}
                    </span>
                    <span>최초 방문일: {customer.first_visit_date}</span>
                    <span>
                      구매목적:{" "}
                      {customer.purchase_purposes.length > 0
                        ? customer.purchase_purposes
                            .map((p) => PURCHASE_PURPOSE_LABELS[p])
                            .join(", ")
                        : "없음"}
                    </span>
                  </CardContent>
                </Card>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
