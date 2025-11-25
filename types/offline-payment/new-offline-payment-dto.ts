export type NewOfflinePayment = {
  period?: "month" | "year" | "day" | "same";
  paymentMethod?: "Zain" | "Alrafedeen" | "AsiaPay" | "IraqBank" | "FastPay" | "AsiaSel";
  productType?: "tool" | "pack" | "device" | "credits";
  productId?: number;
  productData?: any;
  userFullName?: string
  setDetailsModalOpen?: Function;
  deviceName?: string;
  quantity?: number;
  isToolDevice?: boolean;
};