"use client";

import axios, { InternalAxiosRequestConfig } from "axios";


// Load FingerprintJS and get the visitorId

// Ensure visitorId is available before making requests
async function authRequestInterceptor(config: InternalAxiosRequestConfig) {
  // Wait for visitorId to be resolved
  if (!global.clientId1328) {
    return
  }
  // Attach the visitorId to the headers
  if (global.clientId1328) {
    config.headers["User-Client"] = global.clientId1328;
  }

  // Handle token
  const token = localStorage.getItem("a");
  if (!token) {
    window.location.href = "/signin";
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
  if (error?.response?.status === 401 || error?.response?.status === 400 || error?.response?.status === 403) {
    localStorage.removeItem("a");
    window.location.href = "/signin";
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
