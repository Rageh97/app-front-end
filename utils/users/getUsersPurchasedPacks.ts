import api from "@/utils/api";
import { useQuery } from "react-query";

const fetchUsersPurchasedPacksList =
  (page: number, userId: number) => async () => {
    const response = await api.post(`api/admin/get-users-purchased-packs/`, {
      page: page,
      user_id: userId,
    });
    return response.data;
  };

export const useGetUsersPurchasedPacksList = (page: number, userId: number) => {
  const query = useQuery({
    queryKey: ["usersPacks"],
    queryFn: fetchUsersPurchasedPacksList(page, userId),
    keepPreviousData: true,
    enabled: !!page || !!userId,
  });

  return {
    ...query,
  };
};
