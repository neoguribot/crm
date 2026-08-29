import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatKoreanDate } from "@/lib/date";
import { ITEM_TYPE_LABELS, TRADE_TYPE_LABELS } from "@/lib/labels";
import { formatWon, trimTrailingZeros } from "@/lib/number";
import type { QueryResult } from "@/lib/customers/queries";
import type { TradeRecordListItem } from "@/lib/trades/queries";

function TradeTypeBadge({ type }: { type: TradeRecordListItem["trade_type"] }) {
  // 색상만이 아니라 기호(▲/▼)와 텍스트로도 구분한다.
  const isSale = type === "SALE";
  return (
    <Badge variant={isSale ? "secondary" : "outline"}>
      {isSale ? "▲ " : "▼ "}
      {TRADE_TYPE_LABELS[type]}
    </Badge>
  );
}

export function TradeHistorySection({
  customerId,
  result,
}: {
  customerId: string;
  result: QueryResult<TradeRecordListItem[]>;
}) {
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle>거래 이력</CardTitle>
        <Button
          size="sm"
          render={<Link href={`/customers/${customerId}/trades/new`} />}
        >
          거래 기록 추가
        </Button>
      </CardHeader>
      <CardContent>
        {!result.ok ? (
          <p className="py-6 text-center text-sm text-destructive">
            {result.error}
          </p>
        ) : result.data.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            아직 등록된 거래가 없습니다.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th scope="col" className="py-2 pr-3 font-medium">거래일</th>
                  <th scope="col" className="py-2 pr-3 font-medium">구분</th>
                  <th scope="col" className="py-2 pr-3 font-medium">품목</th>
                  <th scope="col" className="py-2 pr-3 text-right font-medium">
                    순도(%)
                  </th>
                  <th scope="col" className="py-2 pr-3 text-right font-medium">
                    중량(g)
                  </th>
                  <th scope="col" className="py-2 pr-3 text-right font-medium">
                    금액
                  </th>
                  <th scope="col" className="py-2 font-medium">비고</th>
                </tr>
              </thead>
              <tbody>
                {result.data.map((t) => (
                  <tr key={t.id} className="border-b last:border-0 align-top">
                    <td className="py-2 pr-3 whitespace-nowrap tabular-nums">
                      {formatKoreanDate(t.trade_date)}
                    </td>
                    <td className="py-2 pr-3 whitespace-nowrap">
                      <TradeTypeBadge type={t.trade_type} />
                    </td>
                    <td className="py-2 pr-3 whitespace-nowrap">
                      {ITEM_TYPE_LABELS[t.item_type]}
                    </td>
                    <td className="py-2 pr-3 text-right tabular-nums">
                      {t.purity ? trimTrailingZeros(t.purity) : "-"}
                    </td>
                    <td className="py-2 pr-3 text-right tabular-nums">
                      {trimTrailingZeros(t.weight)}
                    </td>
                    <td className="py-2 pr-3 text-right tabular-nums">
                      {formatWon(t.amount)}
                    </td>
                    <td className="py-2 whitespace-pre-wrap">
                      {t.memo ?? "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
