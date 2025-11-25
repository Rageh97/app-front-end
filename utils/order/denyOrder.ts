import api from "@/utils/api";
import { useMutation, useQueryClient } from "react-query";

export async function denyOrder(orderId: string) {
  const response = await api.post("/api/admin/deny-order/", {order_id: orderId});
  return response.data;
}

export const useDenyOrder = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (orderId: string) => {
      return denyOrder(orderId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["orders"]);
    },
  });
};
