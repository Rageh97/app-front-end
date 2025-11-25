import api from "@/utils/api";
import { useQuery } from "react-query";

const fetchUsersPurchasedPlansList =
  (page: number, userId: number) => async () => {
    const response = await api.post(`api/admin/get-users-purchased-plans/`, {
      page: page,
      user_id: userId,
    });
    return response.data;
  };

export const useGetUsersPurchasedPlansList = (page: number, userId: number) => {
  const query = useQuery({
    queryKey: ["usersPlans"],
    queryFn: fetchUsersPurchasedPlansList(page, userId),
    keepPreviousData: true,
    enabled: !!page || !!userId,
  });

  return {
    ...query,
  };
};
