import api from "@/utils/api";
import { useMutation, useQueryClient } from "react-query";

async function EnableUserPlan(userPlanId: number) {
  const response = await api.post(`api/admin/enable-user-plan`, {
    userPlanId: userPlanId,
  });
  return response.data;
}

export const useEnableUserPlan = (userPlanId: number) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: EnableUserPlan,
    onSuccess: () => {
      queryClient.invalidateQueries([userPlanId, "user_plan"]);
    },
  });
};
