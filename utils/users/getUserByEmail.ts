import api from "@/utils/api";
import { useQuery } from "react-query";

const fetchUser = (email: string) => async () => {
  const response = await api.post(`api/admin/search-user-by-email`, {
    email: email,
  });
  return response.data;
};

export const useSearchUserByEmail = (email: string) => {
  const query = useQuery({
    queryKey: ["searchUser", email],
    queryFn: fetchUser(email),
    keepPreviousData: false,
    enabled: !!email,
  });

  return {
    ...query,
  };
};
