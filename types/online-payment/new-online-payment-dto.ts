export type NewOnlinePayment = {
  productId: number;
  productType: "tool" | "pack";
  productData: any;
  paymentMethod: "paypal"
  period: "day" | "month" | "year";
};