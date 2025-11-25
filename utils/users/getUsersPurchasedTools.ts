import api from "@/utils/api";
import { useQuery } from "react-query";

const fetchUsersPurchasedToolsList =
  (page: number, userId: number) => async () => {
    const response = await api.post(`api/admin/get-users-purchased-tools/`, {
      page: page,
      user_id: userId,
    });
    return response.data;
  };

export const useGetUsersPurchasedToolsList = (page: number, userId: number) => {
  const query = useQuery({
    queryKey: ["usersTools"],
    queryFn: fetchUsersPurchasedToolsList(page, userId),
    keepPreviousData: true,
    enabled: !!page || !!userId,
  });

  return {
    ...query,
  };
};
