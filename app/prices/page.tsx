import type { Metadata } from "next";

import { todayInSeoul } from "@/lib/date";
import {
  getLatestGoldPrice,
  getTodayGoldPrice,
  listGoldPrices,
} from "@/lib/prices/queries";
import { getNotifications } from "@/lib/notifications/queries";
import { requireUser } from "@/lib/supabase/require-user";
import { GoldPriceForm } from "@/app/prices/gold-price-form";
import { NotificationCenter } from "@/app/prices/notification-center";
import { PriceHistory } from "@/app/prices/price-history";

export const metadata: Metadata = {
  title: "시세 관리",
};

// 인증 사용자별 화면이므로 정적 캐시에 저장하지 않는다.
export const dynamic = "force-dynamic";

export default async function PricesPage() {
  await requireUser();

  const [todayPrice, latestPrice, notifications, history] = await Promise.all([
    getTodayGoldPrice(),
    getLatestGoldPrice(),
    getNotifications(),
    listGoldPrices(),
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
      <div>
        <h1 className="text-xl font-semibold">시세 관리</h1>
        <p className="text-sm text-muted-foreground">
          기준일 {todayInSeoul()} (Asia/Seoul)
        </p>
      </div>
      <GoldPriceForm
        today={today}
        todayPrice={todayValue}
        latestPrice={latest}
      />
      <NotificationCenter initial={notifications.ok ? notifications.data : []} />
      <PriceHistory items={history.ok ? history.data : []} />
    </main>
  );
}
