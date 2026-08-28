import type { Metadata } from "next";
import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getPipelineCustomers } from "@/lib/customers/queries";
import { requireUser } from "@/lib/supabase/require-user";
import { PipelineBoard } from "@/app/pipeline/pipeline-board";

export const metadata: Metadata = {
  title: "영업 파이프라인",
};

// 인증 사용자별 데이터이므로 정적 캐시에 저장하지 않는다.
export const dynamic = "force-dynamic";

export default async function PipelinePage() {
  await requireUser();

  const result = await getPipelineCustomers();
  const total = result.ok ? result.data.length : 0;

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-5 px-6 py-10">
      <header className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h1 className="text-xl font-semibold">영업 파이프라인</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            카드를 드래그하거나 이전·다음 버튼으로 단계를 옮깁니다.
          </p>
        </div>
        {result.ok && total > 0 ? (
          <span className="text-sm text-muted-foreground tabular-nums">
            전체 {total.toLocaleString("ko-KR")}명
          </span>
        ) : null}
      </header>

      {!result.ok ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-destructive">
            {result.error}
          </CardContent>
        </Card>
      ) : result.data.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
            <p className="text-sm text-muted-foreground">
              아직 등록된 고객이 없습니다. 고객을 등록하면 파이프라인에 나타납니다.
            </p>
            <Link href="/customers/new" className={buttonVariants()}>
              고객 등록
            </Link>
          </CardContent>
        </Card>
      ) : (
        <PipelineBoard initialCustomers={result.data} />
      )}
    </main>
  );
}
