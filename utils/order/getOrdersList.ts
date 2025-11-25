import api from "@/utils/api";
import { useQuery } from "react-query";

const fetchOrdersList = (page: number, filter: string) => async () => {
  const response = await api.post(`api/admin/get-orders-list/`, {
    page: page,
    filter: filter,
  });
  return response.data;
};

export const useOrdersList = (page: number, filter: string) => {
  const query = useQuery({
    queryKey: ["ordersList"],
    queryFn: fetchOrdersList(page, filter),
    keepPreviousData: true,
  });

  return {
    ...query,
  };
};
