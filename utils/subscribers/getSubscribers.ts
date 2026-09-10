import api from "@/utils/api";
import { useQuery } from "react-query";

export interface SubscriberItem {
  id: string;
  subscription_id: number;
  type: "tool" | "pack" | "plan" | "credits";
  type_label: string;
  item_id: number | null;
  item_name: string;
  user_id: number;
  user_name: string;
  user_email: string;
  user_role: string;
  user_avatar: string | null;
  user_is_active: boolean;
  created_at: string;
  ended_at: string;
  is_active: boolean;
  is_expired: boolean;
  is_currently_active: boolean;
  status: "active" | "expired" | "disabled";
  days_left: number | null;
  remaining_credits: number | null;
  total_credits: number | null;
}

export interface SubscriberStats {
  totalSubscriptions: number;
  activeSubscriptions: number;
  expiredSubscriptions: number;
  uniqueSubscribers: number;
  activeSubscribers: number;
}

export interface SubscribersResponse {
  stats: SubscriberStats;
  dataCount: number;
  totalPages: number;
  currentPage: number;
  subscribers: SubscriberItem[];
}

export interface SubscribersFilters {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  type?: string;
  exportAll?: boolean;
}

export const fetchSubscribersList = async (filters: SubscribersFilters): Promise<SubscribersResponse> => {
  const response = await api.post("api/admin/subscribers", filters);
  return response.data;
};

export const useGetSubscribersList = (filters: SubscribersFilters) => {
  const { page = 1, limit = 20, search = "", status = "all", type = "all" } = filters;
  const query = useQuery<SubscribersResponse>({
    queryKey: ["admin-subscribers", page, limit, search, status, type],
    queryFn: () => fetchSubscribersList({ page, limit, search, status, type }),
    keepPreviousData: true,
  });

  return query;
};

export const fetchAllSubscribersForExport = async (
  filters: Omit<SubscribersFilters, "page" | "limit" | "exportAll">
): Promise<SubscriberItem[]> => {
  const response = await api.post("api/admin/subscribers", {
    ...filters,
    exportAll: true,
  });
  return response.data?.subscribers || [];
};
