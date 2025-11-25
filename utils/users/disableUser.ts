import api from "@/utils/api";
import { useMutation, useQueryClient } from "react-query";

async function disableUser(userId: number) {
  const response = await api.post(`api/admin/disable-user-account`, {
    user_id: userId,
  });
  return response.data;
}

export const useDisableUser = (userId: number) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: disableUser,
    onSuccess: () => {
      queryClient.invalidateQueries([userId, "user"]);
    },
  });
};
