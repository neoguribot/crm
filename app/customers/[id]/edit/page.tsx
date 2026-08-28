import type { Metadata } from "next";
import { notFound } from "next/navigation";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { APP_NAME } from "@/lib/constants";
import { getCustomerById } from "@/lib/customers/queries";
import { requireUser } from "@/lib/supabase/require-user";
import { updateCustomer } from "@/app/customers/actions";
import { CustomerForm } from "@/app/customers/customer-form";

export const metadata: Metadata = {
  title: `고객 수정 · ${APP_NAME}`,
};

export default async function EditCustomerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireUser();
  const { id } = await params;

  const result = await getCustomerById(id);

  if (!result.ok) {
    return (
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col justify-center px-6 py-16">
        <Card>
          <CardContent className="py-10 text-center text-sm text-destructive">
            {result.error}
          </CardContent>
        </Card>
      </main>
    );
  }

  if (!result.data) {
    notFound();
  }

  const updateWithId = updateCustomer.bind(null, id);

  return (
    <main className="mx-auto flex w-full max-w-lg flex-1 flex-col gap-6 px-6 py-10">
      <h1 className="text-xl font-semibold">고객 수정</h1>
      <Card>
        <CardHeader>
          <CardTitle>{result.data.name}</CardTitle>
        </CardHeader>
        <CardContent>
          <CustomerForm
            action={updateWithId}
            submitLabel="수정 저장"
            cancelHref={`/customers/${id}`}
            defaults={result.data}
          />
        </CardContent>
      </Card>
    </main>
  );
}
