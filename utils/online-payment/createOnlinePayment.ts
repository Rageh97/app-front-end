import { NewOnlinePayment } from "@/types/online-payment/new-online-payment-dto";
import api from "@/utils/api";
import { useMutation, useQueryClient } from "react-query";

export async function createPayment(data: NewOnlinePayment) {
  const response = await api.post("/api/payment/online-payment/", data);
  return response.data;
}

export const useOnlinePayment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: NewOnlinePayment) => {
      return createPayment(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["online-payment"]);
    },
  });
};
