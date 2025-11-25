import api from "@/utils/api";
import { useMutation, useQueryClient } from "react-query";

async function deleteTool(tool_id: number) {
  const response = await api.post(`api/admin/delete-tool`, { tool_id: tool_id });
  return response.data;
}

export const useDeleteTool = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteTool,
    onSuccess: () => {
      queryClient.invalidateQueries(["tools"]);
    },
  });
};
