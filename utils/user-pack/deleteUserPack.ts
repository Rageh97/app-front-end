import api from "@/utils/api";
import { useMutation, useQueryClient } from "react-query";

async function DeleteUserPack(userPackId: number) {
  const response = await api.post(`api/admin/delete-user-pack`, {
    userPackId: userPackId,
  });
  return response.data;
}

export const useDeleteUserPack = (userId: number) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: DeleteUserPack,
    onSuccess: () => {
      queryClient.invalidateQueries(["usersPacks"]);
    },
  });
};
