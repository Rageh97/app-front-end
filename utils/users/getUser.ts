import api from "@/utils/api";
import { useQuery } from "react-query";

const fetchUser = (userId: number) => async () => {
  const response = await api.post(`api/admin/get-one-user`, { user_id: userId });
  return response.data;
};

export const useGetUser = (userId: number) => {
  const query = useQuery({
    queryKey: ["user", userId],
    queryFn: fetchUser(userId),
    keepPreviousData: true,
  });

  return {
    ...query,
  };
};
