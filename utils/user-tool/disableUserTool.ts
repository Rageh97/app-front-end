import api from "@/utils/api";
import { useMutation, useQueryClient } from "react-query";

async function DisableUserTool(userToolId: number) {
  const response = await api.post(`api/admin/disable-user-tool`, {
    userToolId: userToolId,
  });
  return response.data;
}

export const useDisableUserTool = (userToolId: number) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: DisableUserTool,
    onSuccess: () => {
      queryClient.invalidateQueries([userToolId, "user_tool"]);
    },
  });
};
