import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { APP_NAME } from "@/lib/constants";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: `대시보드 · ${APP_NAME}`,
};

export default async function DashboardPage() {
  const supabase = await createServerSupabaseClient();

  // 서버에서 인증 사용자를 직접 확인한다(쿠키 존재만 신뢰하지 않음).
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col justify-center gap-6 px-6 py-16">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">대시보드</CardTitle>
          <CardDescription>{APP_NAME}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <p className="text-sm text-muted-foreground">
            {user.email} 님으로 로그인했습니다.
          </p>
          <p className="text-sm text-muted-foreground">
            현재 상태: 인증 연동 완료. 통계 기능은 다음 단계에서 구현합니다.
          </p>
          <form action="/logout" method="post">
            <Button type="submit" variant="outline">
              로그아웃
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
