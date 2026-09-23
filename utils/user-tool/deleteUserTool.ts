import api from "@/utils/api";
import { useMutation, useQueryClient } from "react-query";

async function DeleteUserTool(userToolId: number) {
  const response = await api.post(`api/admin/delete-user-tool`, {
    userToolId: userToolId,
  });
  return response.data;
}

export const useDeleteUserTool = (userId: number) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: DeleteUserTool,
    onSuccess: () => {
      queryClient.invalidateQueries(["usersTools"]);
    },
  });
};
