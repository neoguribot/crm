import type { Metadata } from "next";

import { todayInSeoul } from "@/lib/date";
import { getLatestGoldPrice, getTodayGoldPrice } from "@/lib/prices/queries";
import { getNotifications } from "@/lib/notifications/queries";
import { requireUser } from "@/lib/supabase/require-user";
import { GoldPriceForm } from "@/app/home/gold-price-form";
import { NotificationCenter } from "@/app/home/notification-center";

export const metadata: Metadata = {
  title: "홈",
};

// 인증 사용자별 화면이므로 정적 캐시에 저장하지 않는다.
export const dynamic = "force-dynamic";

export default async function HomePage() {
  await requireUser();

  const [todayPrice, latestPrice, notifications] = await Promise.all([
    getTodayGoldPrice(),
    getLatestGoldPrice(),
    getNotifications(),
  ]);

  const today = todayInSeoul();
  const todayValue = todayPrice.ok ? (todayPrice.data?.price_per_don ?? null) : null;
  const latest =
    latestPrice.ok && latestPrice.data
      ? {
          price_per_don: latestPrice.data.price_per_don,
          price_date: latestPrice.data.price_date,
        }
      : null;

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-6 py-10">
      <GoldPriceForm
        today={today}
        todayPrice={todayValue}
        latestPrice={latest}
      />
      <NotificationCenter initial={notifications.ok ? notifications.data : []} />
    </main>
  );
}
