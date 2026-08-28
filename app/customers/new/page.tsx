import type { Metadata } from "next";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { APP_NAME } from "@/lib/constants";
import { requireUser } from "@/lib/supabase/require-user";
import { createCustomer } from "@/app/customers/actions";
import { CustomerForm } from "@/app/customers/customer-form";

export const metadata: Metadata = {
  title: `신규 고객 등록 · ${APP_NAME}`,
};

export default async function NewCustomerPage() {
  await requireUser();

  return (
    <main className="mx-auto flex w-full max-w-lg flex-1 flex-col gap-6 px-6 py-10">
      <h1 className="text-xl font-semibold">신규 고객 등록</h1>
      <Card>
        <CardHeader>
          <CardTitle>고객 정보</CardTitle>
        </CardHeader>
        <CardContent>
          <CustomerForm
            action={createCustomer}
            submitLabel="등록"
            cancelHref="/customers"
          />
        </CardContent>
      </Card>
    </main>
  );
}
