import api from "@/utils/api";
import { useQuery } from "react-query";

const fetchPack = (packId: number) => async () => {
  const response = await api.post(`api/admin/get-one-pack`, { pack_id: packId });
  return response.data;
};

export const useGetPack = (packId: number) => {
  const query = useQuery({
    queryKey: ["packs", packId],
    queryFn: fetchPack(packId),
    keepPreviousData: true,
    enabled: !!packId
  });

  return {
    ...query,
  };
};
