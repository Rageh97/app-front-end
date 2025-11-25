import { NewProductPayLocalBankReqDto } from "@/types/cih/new-cih-product-pay-req-dto";
import api from "@/utils/api";
import { useMutation, useQueryClient } from "react-query";

export async function createPayment(data: NewProductPayLocalBankReqDto) {
  const response = await api.post("/api/user/local-bank-pay-tool/", data);
  return response.data;
}

export const usePayLocalBankToolProduct = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: NewProductPayLocalBankReqDto) => {
      return createPayment(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["local-bank-tool-product"]);
    },
  });
};
