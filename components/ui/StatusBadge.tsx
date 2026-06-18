import { Badge } from "./Badge";
import { statusToVariant, riskToVariant, priorityToVariant } from "@/lib/labels";

/** 상태 문자열을 받아 자동으로 색을 매핑하는 배지 */
export function StatusBadge({ status, dot }: { status: string; dot?: boolean }) {
  return (
    <Badge variant={statusToVariant(status)} dot={dot}>
      {status}
    </Badge>
  );
}

export function RiskBadge({ risk }: { risk: string }) {
  return (
    <Badge variant={riskToVariant(risk)} dot={risk === "높음"}>
      개인정보 {risk}
    </Badge>
  );
}

export function PriorityBadge({ priority }: { priority: string }) {
  return <Badge variant={priorityToVariant(priority)}>{priority}</Badge>;
}
