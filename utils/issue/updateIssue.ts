import api from "@/utils/api";
import { useMutation, useQueryClient } from "react-query";

export async function UpdateIssue(data: any) {
  const response = await api.post("/api/admin/update-issue/", data);
  return response.data;
}

export const useUpdateIssue = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: any) => {
      return UpdateIssue(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["issues"]);
    },
  });
};
