import api from "@/utils/api";
import { useMutation, useQueryClient } from "react-query";

async function DeleteUserPlan(userPlanId: number) {
  const response = await api.post(`api/admin/delete-user-plan`, {
    userPlanId: userPlanId,
  });
  return response.data;
}

export const useDeleteUserPlan = (userId: number) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: DeleteUserPlan,
    onSuccess: () => {
      queryClient.invalidateQueries(["usersPlans"]);
    },
  });
};
