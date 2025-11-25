import api from "@/utils/api";
import { useMutation, useQueryClient } from "react-query";

async function deletePack(pack_id: number) {
  const response = await api.post(`api/admin/delete-pack`, { pack_id: pack_id });
  return response.data;
}

export const useDeletePack = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deletePack,
    onSuccess: () => {
      queryClient.invalidateQueries(["packs"]);
    },
  });
};
