import api from "@/utils/api";
import { useQuery } from "react-query";

const fetchIssuesList = (page: number, filter: string) => async () => {
  const response = await api.post(`api/admin/get-issues-list/`, {
    page: page,
    filter: filter,
  });
  return response.data;
};

export const useIssuesList = (page: number, filter: string) => {
  const query = useQuery({
    queryKey: ["issues"],
    queryFn: fetchIssuesList(page, filter),
    keepPreviousData: true,
  });

  return {
    ...query,
  };
};
