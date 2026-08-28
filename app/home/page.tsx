import type { Metadata } from "next";

import { requireUser } from "@/lib/supabase/require-user";

export const metadata: Metadata = {
  title: "홈",
};

// 인증 사용자별 화면이므로 정적 캐시에 저장하지 않는다.
export const dynamic = "force-dynamic";

// 지금은 빈 페이지. 내용은 이후에 채운다.
export default async function HomePage() {
  await requireUser();

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-10" />
  );
}
