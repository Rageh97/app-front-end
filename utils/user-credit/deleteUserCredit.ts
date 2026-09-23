import api from "@/utils/api";
import { useMutation, useQueryClient } from "react-query";

async function DeleteUserCredit(userCreditId: number) {
  const response = await api.post(`api/admin/delete-user-credit`, {
    userCreditId: userCreditId,
  });
  return response.data;
}

export const useDeleteUserCredit = (userId: number) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: DeleteUserCredit,
    onSuccess: () => {
      queryClient.invalidateQueries(["usersCredits"]);
    },
  });
};
