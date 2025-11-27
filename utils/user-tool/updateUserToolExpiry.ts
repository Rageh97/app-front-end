import api from "@/utils/api";
import { useMutation, useQueryClient } from "react-query";

async function UpdateUserToolExpiry(data: { userToolId: number; endedAt: string }) {
  const response = await api.post(`api/admin/update-user-tool-expiry`, data);
  return response.data;
}

export const useUpdateUserToolExpiry = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: UpdateUserToolExpiry,
    onSuccess: () => {
      queryClient.invalidateQueries(["usersTools"]);
    },
  });
};
