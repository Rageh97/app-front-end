import api from "@/utils/api";
import { useMutation, useQueryClient } from "react-query";

async function EnableUserTool(userToolId: number) {
  const response = await api.post(`api/admin/enable-user-tool`, {
    userToolId: userToolId,
  });
  return response.data;
}

export const useEnableUserTool = (userToolId: number) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: EnableUserTool,
    onSuccess: () => {
      queryClient.invalidateQueries([userToolId, "user_tool"]);
    },
  });
};
