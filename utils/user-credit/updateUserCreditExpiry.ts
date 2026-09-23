import api from "@/utils/api";
import { useMutation, useQueryClient } from "react-query";

async function UpdateUserCreditExpiry(data: { userCreditId: number; endedAt: string }) {
  const response = await api.post(`api/admin/update-user-credit-expiry`, data);
  return response.data;
}

export const useUpdateUserCreditExpiry = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: UpdateUserCreditExpiry,
    onSuccess: () => {
      queryClient.invalidateQueries(["usersCredits"]);
    },
  });
};
