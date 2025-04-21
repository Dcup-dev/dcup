import { PaymentContext } from "@/context/PaymentContext";
import { useContext } from "react";

export const usePay=()=> {
    const context = useContext(PaymentContext);

   if (!context) {
    throw new Error(
      "usePay must be used within a PaymentContext",
    );
  }
  return context
}
