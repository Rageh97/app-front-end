import api from "@/utils/api";
import { useMutation, useQueryClient } from "react-query";

export async function acceptOrder(orderId: string) {
  const response = await api.post("/api/admin/accept-device-order/", {
    order_id: orderId,
  });
  return response.data;
}

export const useAcceptDeviceOrder = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (orderId: string) => {
      return acceptOrder(orderId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["devices-orders"]);
    },
  });
};
