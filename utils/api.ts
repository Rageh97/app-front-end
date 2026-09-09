"use client";

import axios, { InternalAxiosRequestConfig } from "axios";


// Load FingerprintJS and get the visitorId

// Ensure visitorId is available before making requests
async function authRequestInterceptor(config: InternalAxiosRequestConfig) {
  // Try to get clientId from global or localStorage
  if (!global.clientId1328) {
    const savedId = localStorage.getItem("clientId1328");
    if (savedId) {
      global.clientId1328 = savedId;
    }
  }

  // Wait for visitorId to be resolved if it's not available yet (only if not found in localStorage)
  let retries = 0;
  while (!global.clientId1328 && retries < 40) { // Increased wait time slightly as fallback
    await new Promise(resolve => setTimeout(resolve, 100));
    retries++;
  }

  // Attach the visitorId to the headers
  if (global.clientId1328) {
    config.headers["User-Client"] = global.clientId1328;
  }

  // Handle token
  const token = localStorage.getItem("a");
  if (!token) {
    if (typeof window !== "undefined" && window.location.pathname !== "/signin") {
      window.location.replace("/signin");
    }
  }
  if (token) {
    config.headers.authorization = token;
  }

  return config;
}

const axiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: {
    "Content-Type": "application/json" ,
    Accept: "application/json",
  },
});

axiosInstance.interceptors.request.use(authRequestInterceptor, (error) => {
  return Promise.reject(error);
});

function authErrorInterceptor(error: any) {
  const status = error?.response?.status;
  const data = typeof error?.response?.data === "string" ? error.response.data : JSON.stringify(error?.response?.data || "");
  const isAuthError =
    status === 401 ||
    status === 403 ||
    (status === 400 && (data.includes("token") || data.includes("unauthorized") || data.includes("Bad request : token required")));

  if (isAuthError) {
    if (typeof window !== "undefined") {
      localStorage.removeItem("a");
      localStorage.removeItem("token");
      localStorage.removeItem("userRole");
      if ((global as any).userData) {
        delete (global as any).userData;
      }
      if ((global as any).userRole) {
        delete (global as any).userRole;
      }
      if (window.location.pathname !== "/signin") {
        window.location.replace("/signin");
      }
    }
  }
  return Promise.reject<any>(error);
}

axiosInstance.interceptors.response.use(
  (response) => response,
  authErrorInterceptor
);

export default axiosInstance;

export const setAuthToken = (token: string) => {
  if (token) {
    axiosInstance.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  } else {
    delete axiosInstance.defaults.headers.common["Authorization"];
  }
};

const mockApi = axios.create({
  baseURL: "/api",
  headers: {
    "Content-Type": "application/json" ,
    Accept: "application/json",
  },
});

export { mockApi };
