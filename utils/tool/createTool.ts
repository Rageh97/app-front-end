import api from "@/utils/api";
import { useMutation, useQueryClient } from "react-query";
import { NewToolsReqDto } from "@/types/tools/new-tools-req-dto";

export async function createTool(data: NewToolsReqDto) {
  const response = await api.post("/api/admin/create-tool/", data);
  return response.data;
}

export const useCreateTool = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: NewToolsReqDto) => {
      return createTool(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["tools"]);
    },
  });
};
