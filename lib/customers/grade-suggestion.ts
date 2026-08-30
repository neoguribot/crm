import type { CustomerGrade } from "@/lib/types/database";

const VIP_THRESHOLD = 10_000_000;
const PREMIUM_THRESHOLD = 3_000_000;

/**
 * 누적 거래액(원) 기준 등급 자동 추천. 참고용 배지로만 표시하며 DB에는
 * 저장하지 않는다(등급은 사장님이 수동으로 선택). 기준값은 임의 기본값이므로
 * 운영 데이터를 보며 조정한다.
 */
export function suggestGrade(cumulativeAmount: number): CustomerGrade {
  if (cumulativeAmount >= VIP_THRESHOLD) return "VIP";
  if (cumulativeAmount >= PREMIUM_THRESHOLD) return "우수";
  return "일반";
}
