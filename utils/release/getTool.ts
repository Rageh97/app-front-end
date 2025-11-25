import api from "@/utils/api";
import { useQuery } from "react-query";

const fetchRelease = () => async () => {
  const response = await api.get(`api/user/get-release`);
  return response.data;
};

export const useGetRelease = () => {
  const query = useQuery({
    queryKey: ["release"],
    queryFn: fetchRelease(),
    keepPreviousData: true,
  });

  return {
    ...query,
  };
};
