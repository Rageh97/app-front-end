import api from "@/utils/api";
import { useMutation, useQueryClient } from "react-query";

async function DisableUserPlan(userPlanId: number) {
  const response = await api.post(`api/admin/disable-user-plan`, {
    userPlanId: userPlanId,
  });
  return response.data;
}

export const useDisableUserPlan = (userPlanId: number) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: DisableUserPlan,
    onSuccess: () => {
      queryClient.invalidateQueries([userPlanId, "user_plan"]);
    },
  });
};
