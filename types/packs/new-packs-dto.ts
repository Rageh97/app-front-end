export type NewPacksDto = {
  pack_id?: number;
  pack_name: string;
  pack_tools: string;
  pack_price?: number; // Keeping for backward compatibility
  monthly_price: number;
  yearly_price: number;
  additional_device_price: number;
  max_devices: number;
  isActive?: boolean;
  credit_plan_id?: number;
  monthly_credit_plan_id?: number;
  yearly_credit_plan_id?: number;
};
