import api from "@/utils/api";
import { useQuery } from "react-query";

const fetchUser = (name: string) => async () => {
  const response = await api.post(`api/admin/search-tool-by-name`, {
    name: name,
  });
  return response.data;
};

export const useSearchToolByName = (name: string) => {
  const query = useQuery({
    queryKey: ["searchUser", name],
    queryFn: fetchUser(name),
    keepPreviousData: false,
    enabled: !!name,
  });

  return {
    ...query,
  };
};
