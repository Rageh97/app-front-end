import api from "@/utils/api";
import { useQuery } from "react-query";

const fetchOverview = () => async () => {
  const response = await api.post(`api/admin/get-overview`);
  return response.data;
};

export const useGetOverview = () => {
  const query = useQuery({
    queryKey: ["overview"],
    queryFn: fetchOverview(),
    keepPreviousData: true,
  });

  return {
    ...query,
  };
};
