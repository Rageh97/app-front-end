import api from "@/utils/api";
import { useMutation, useQueryClient } from "react-query";
import { NewPacksReqDto } from "@/types/packs/new-packs-req-dto";

const UpdatePack = async (data: NewPacksReqDto) => {
  // Prepare the data to send to the API
  const requestData = {
    ...data,
    // For backward compatibility, include pack_price as monthly_price if not provided
    pack_price: data.monthly_price,
  };
  
  const response = await api.post(`api/admin/update-pack/`, requestData);
  return response.data;
};

export const useUpdatePack = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: UpdatePack,
    onSuccess: () => {
      queryClient.invalidateQueries(["packs"]);
    },
  });
};
