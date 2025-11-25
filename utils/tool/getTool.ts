import api from "@/utils/api";
import { useQuery } from "react-query";

const fetchTool = (toolId: number) => async () => {
  const response = await api.post(`api/admin/get-one-tool`, { tool_id: toolId });
  return response.data;
};

export const useGetTool = (toolId: number) => {
  const query = useQuery({
    queryKey: ["tools", toolId],
    queryFn: fetchTool(toolId),
    keepPreviousData: true,
  });

  return {
    ...query,
  };
};
