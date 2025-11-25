import api from "@/utils/api";
import { useMutation, useQueryClient } from "react-query";

async function EnableUserPack(userPackId: number) {
  const response = await api.post(`api/admin/enable-user-pack`, {
    userPackId: userPackId,
  });
  return response.data;
}

export const useEnableUserPack = (userPackId: number) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: EnableUserPack,
    onSuccess: () => {
      queryClient.invalidateQueries([userPackId, "user_pack"]);
    },
  });
};
