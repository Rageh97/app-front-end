import api from "@/utils/api";
import { useMutation, useQueryClient } from "react-query";

async function UpdateUserPlanExpiry(data: { userPlanId: number; endedAt: string }) {
  const response = await api.post(`api/admin/update-user-plan-expiry`, data);
  return response.data;
}

export const useUpdateUserPlanExpiry = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: UpdateUserPlanExpiry,
    onSuccess: () => {
      queryClient.invalidateQueries(["usersPlans"]);
    },
  });
};
