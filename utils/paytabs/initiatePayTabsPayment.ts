import axios from "axios";

export interface PayTabsPaymentPayload {
  period: "day" | "month" | "year";
  productType: "tool" | "pack" | "credits";
  productId: number;
  customerPhone?: string;
  couponCode?: string;
}

export interface PayTabsPaymentResponse {
  redirect_url: string;
  tran_ref: string;
}

/**
 * Initiates a PayTabs hosted payment page.
 * Returns the redirect_url to send the user to.
 */
export async function initiatePayTabsPayment(
  payload: PayTabsPaymentPayload
): Promise<PayTabsPaymentResponse> {
  const token = localStorage.getItem("a");

  const response = await axios.post(
    process.env.NEXT_PUBLIC_API_URL + "/api/payment/paytabs-payment",
    payload,
    {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        "User-Client": (global as any).clientId1328 || "",
      },
    }
  );

  return response.data;
}
