import api from "@/utils/api";
import { useMutation, useQueryClient } from "react-query";

async function UpdateUserPackExpiry(data: { userPackId: number; endedAt: string }) {
  const response = await api.post(`api/admin/update-user-pack-expiry`, data);
  return response.data;
}

export const useUpdateUserPackExpiry = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: UpdateUserPackExpiry,
    onSuccess: () => {
      queryClient.invalidateQueries(["usersPacks"]);
    },
  });
};
