import api from "@/utils/api";
import { useQuery } from "react-query";

export type UserInfoResDto = {
  user: number;
  employee_id?: number;
  client_id?: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  profile_picture: string;
  phone_number: string;
  profile: {
    position: string;
    department: string;
  };
};

async function getMyInfo() {
  const response = await api.get("/api/user/");
  
  // Keep username cookie in sync (using email as username if username field is missing)
  const usernameValue = response.data?.username || response.data?.userData?.email;
  if (usernameValue) {
    document.cookie = `username=${usernameValue}; path=/; max-age=604800; SameSite=Lax`;
  }

  return response.data;
}

async function getUserInfo(userId: number) {
  const response = await api.get<UserInfoResDto>(
    `/employee/convfilter/${userId}/`
  );

  return response.data;
}

const getIsEnabled = () => {
  if (!global.isDataEnabled) {
    global.isDataEnabled = true;
    return true;
  } else {
    return false;
  }
};

export const useMyInfo = (enabled = true) => {
  return useQuery(["userData"], () => getMyInfo(), {
    refetchOnWindowFocus: false,
    keepPreviousData: true,
    enabled: enabled,
    cacheTime: Infinity,
    staleTime: Infinity,
  });
};

export const useUserInfo = (userId?: number) => {
  return useQuery(["user", userId], () => getUserInfo(userId), {
    refetchOnWindowFocus: false,
    keepPreviousData: true,
    enabled: !!userId,
    cacheTime: Infinity,
    staleTime: Infinity,
  });
};
