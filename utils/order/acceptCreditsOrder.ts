import api from "@/utils/api";
import { useMutation, useQueryClient } from "react-query";

export async function acceptOrder(orderId: number) {
  const response = await api.post("/api/admin/accept-credits-order/", {
    order_id: orderId,
  });
  return response.data;
}

export const useAcceptCreditsOrder = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (orderId: number) => acceptOrder(orderId),
    onSuccess: () => {
      queryClient.invalidateQueries(["credits-orders"]);
      queryClient.invalidateQueries(["orders"]);
    },
  });
};













































