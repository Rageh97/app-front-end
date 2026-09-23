import api from "@/utils/api";
import { useMutation, useQueryClient } from "react-query";

async function DisableUserCredit(userCreditId: number) {
  const response = await api.post(`api/admin/disable-user-credit`, {
    userCreditId: userCreditId,
  });
  return response.data;
}

export const useDisableUserCredit = (userId: number) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: DisableUserCredit,
    onSuccess: () => {
      queryClient.invalidateQueries(["usersCredits"]);
    },
  });
};
