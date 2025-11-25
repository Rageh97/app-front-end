import api from "@/utils/api";
import { useQuery } from "react-query";

const fetchOnlineStatus = () => async () => {
  const response = await api.get(`status`);
  return response.data;
};

export const useGetUsersOnlineStatus = () => {
  const query = useQuery({
    queryKey: ["online-users"],
    queryFn: fetchOnlineStatus(),
    keepPreviousData: true,
  });

  return {
    ...query,
  };
};
