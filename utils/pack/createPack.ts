import api from "@/utils/api";
import { useMutation, useQueryClient } from "react-query";
import { NewPacksReqDto } from "@/types/packs/new-packs-req-dto";

export async function createPack(data: NewPacksReqDto) {
  // Prepare the data to send to the API
  const requestData = {
    ...data,
    // For backward compatibility, include pack_price as monthly_price if not provided
    pack_price: data.monthly_price,
  };
  
  const response = await api.post("/api/admin/create-pack/", requestData);
  return response.data;
}

export const useCreatePack = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: NewPacksReqDto) => {
      return createPack(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["packs"]);
    },
  });
};
