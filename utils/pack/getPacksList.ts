import api from "@/utils/api";
import { useQuery } from "react-query";

const fetchPacksList = () => async () => {
  const response = await api.get(`api/admin/get-packs/`);
  return response.data;
};

export const usePacksList = () => {
  const query = useQuery({
    queryKey: ["packs"],
    queryFn: fetchPacksList(),
    keepPreviousData: true,
  });

  return {
    ...query,
  };
};
