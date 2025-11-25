export type NewProductPayLocalBankReqDto = {
  tool_id?: number;
  user_account_name: string;
  period?: string;
  bank_name?: "cih" | "tijari"
  plan?: "standard" | "premium" | "vip";
  amount?: number;
};
