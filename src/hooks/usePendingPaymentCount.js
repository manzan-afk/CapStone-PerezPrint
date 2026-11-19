import { useEffect, useState } from "react";
import { subscribePendingPaymentCount } from "../services/paymentService";

// Live number of payments waiting for review, for the staff/admin sidebar badge.
export default function usePendingPaymentCount(enabled) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!enabled) return undefined;
    return subscribePendingPaymentCount(setCount, (error) => {
      console.error("Failed to load pending payment count:", error);
    });
  }, [enabled]);

  return enabled ? count : 0;
}
