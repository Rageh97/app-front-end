import api from "@/utils/api";
import { useMutation, useQueryClient } from "react-query";

const PatchRelease = async (data: any) => {
  const response = await api.post(`api/admin/update-release/`, data);
  return response.data;
};

export const useUpdateRelease = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: PatchRelease,
    onSuccess: () => {
      queryClient.invalidateQueries(["release"]);
    },
  });
};
