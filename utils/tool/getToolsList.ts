import api from "@/utils/api";
import { useQuery } from "react-query";

const fetchToolsList = () => async () => {
  const response = await api.get(`api/admin/get-tools/`);
  return response.data;
};

export const useToolsList = () => {
  const query = useQuery({
    queryKey: ["tools"],
    queryFn: fetchToolsList(),
    keepPreviousData: true,
  });

  return {
    ...query,
  };
};
