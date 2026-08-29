import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ITEM_TYPE_LABELS } from "@/lib/labels";
import { totalHoldings, type ItemHolding } from "@/lib/trades/holdings";

/**
 * 고객이 매장에서 구매한 상품을 품목별 개수로 보여준다.
 * (거래 이력 표를 요약한 값 — 거래 1건 = 1개)
 */
export function HoldingsSummary({ holdings }: { holdings: ItemHolding[] }) {
  const total = totalHoldings(holdings);

  return (
    <Card>
      <CardHeader>
        <CardTitle>보유 품목</CardTitle>
      </CardHeader>
      <CardContent>
        {holdings.length === 0 ? (
          <p className="py-3 text-sm text-muted-foreground">
            매장에서 구매한 상품이 없습니다.
          </p>
        ) : (
          <ul className="flex flex-wrap gap-2">
            {holdings.map((h) => (
              <li
                key={h.itemType}
                className="inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-sm"
              >
                <span>{ITEM_TYPE_LABELS[h.itemType]}</span>
                <span className="rounded bg-muted px-1.5 text-xs font-semibold tabular-nums">
                  ×{h.count}
                </span>
              </li>
            ))}
          </ul>
        )}
        <p className="mt-3 text-xs text-muted-foreground">
          판매(매장 → 고객) 거래 기준
          {total > 0 ? ` · 총 ${total}개` : ""}
        </p>
      </CardContent>
    </Card>
  );
}
