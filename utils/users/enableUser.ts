import api from "@/utils/api";
import { useMutation, useQueryClient } from "react-query";

async function EnableUser(userId: number) {
  const response = await api.post(`api/admin/enable-user-account`, {
    user_id: userId,
  });
  return response.data;
}

export const useEnableUser = (userId: number) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: EnableUser,
    onSuccess: () => {
      queryClient.invalidateQueries([userId, "user"]);
    },
  });
};
