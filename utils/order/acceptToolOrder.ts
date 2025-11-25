import api from "@/utils/api";
import { useMutation, useQueryClient } from "react-query";

export async function acceptOrder(orderId: number) {
  const response = await api.post("/api/admin/accept-tool-order/", {
    order_id: orderId,
  });
  return response.data;
}

export const useAcceptToolOrder = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (orderId: number) => {
      return acceptOrder(orderId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["tools-orders"]);
    },
  });
};
