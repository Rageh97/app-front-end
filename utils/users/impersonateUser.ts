import api from "@/utils/api";
import { useMutation } from "react-query";

async function ImpersonateUser(userId: number) {
  const response = await api.post(`api/admin/impersonate-user`, {
    user_id: userId,
  });
  return response.data;
}

export const useImpersonateUser = () => {
  return useMutation({
    mutationFn: ImpersonateUser,
  });
};
