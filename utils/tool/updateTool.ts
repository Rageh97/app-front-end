import api from "@/utils/api";
import { useMutation, useQueryClient } from "react-query";
import { NewToolsReqDto } from "@/types/tools/new-tools-req-dto";

const PatchTool = async (data: NewToolsReqDto) => {
  const response = await api.post(`api/admin/update-tool/`, data);
  return response.data;
};

export const useUpdateTool = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: PatchTool,
    onSuccess: () => {
      queryClient.invalidateQueries(["tools"]);
    },
  });
};
