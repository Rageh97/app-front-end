import api from "@/utils/api";
import { useMutation, useQueryClient } from "react-query";

async function DisableUserPack(userPackId: number) {
  const response = await api.post(`api/admin/disable-user-pack`, {
    userPackId: userPackId,
  });
  return response.data;
}

export const useDisableUserPack = (userPackId: number) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: DisableUserPack,
    onSuccess: () => {
      queryClient.invalidateQueries([userPackId, "user_pack"]);
    },
  });
};
