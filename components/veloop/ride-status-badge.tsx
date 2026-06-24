import { Badge } from "@/components/ui/badge";
import { RIDE_STATUS_META, type RideStatus } from "@/lib/types";

const TONE_TO_VARIANT = {
  neutral: "neutral",
  active: "default",
  success: "success",
  danger: "danger",
} as const;

export function RideStatusBadge({ status }: { status: RideStatus }) {
  const meta = RIDE_STATUS_META[status];
  return <Badge variant={TONE_TO_VARIANT[meta.tone]}>{meta.label}</Badge>;
}
