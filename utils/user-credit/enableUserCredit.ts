import api from "@/utils/api";
import { useMutation, useQueryClient } from "react-query";

async function EnableUserCredit(userCreditId: number) {
  const response = await api.post(`api/admin/enable-user-credit`, {
    userCreditId: userCreditId,
  });
  return response.data;
}

export const useEnableUserCredit = (userId: number) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: EnableUserCredit,
    onSuccess: () => {
      queryClient.invalidateQueries(["usersCredits"]);
    },
  });
};
