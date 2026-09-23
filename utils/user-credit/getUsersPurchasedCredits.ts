import api from "@/utils/api";
import { useQuery } from "react-query";

const fetchUsersPurchasedCreditsList =
  (page: number, userId: number) => async () => {
    const response = await api.post(`api/admin/get-users-purchased-credits`, {
      page: page,
      user_id: userId,
    });
    return response.data;
  };

export const useGetUsersPurchasedCreditsList = (page: number, userId: number) => {
  const query = useQuery({
    queryKey: ["usersCredits", page, userId],
    queryFn: fetchUsersPurchasedCreditsList(page, userId),
    keepPreviousData: true,
    enabled: !!page && !!userId,
  });

  return {
    ...query,
  };
};
