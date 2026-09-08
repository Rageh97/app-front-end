"use client";

/**
 * Handles session expiration (401 / 403) across all AI tools and platform pages.
 * Clears stored credentials and redirects to /signin immediately.
 */
export const handleAuthError = (status?: number) => {
  if (status === 401 || status === 403 || status === undefined) {
    if (typeof window !== "undefined") {
      localStorage.removeItem("a");
      localStorage.removeItem("token");
      localStorage.removeItem("userRole");
      // Set global session state to false
      if ((global as any).userData) {
        delete (global as any).userData;
      }
      if (window.location.pathname !== "/signin") {
        window.location.replace("/signin");
      }
    }
  }
};

/**
 * Standardized headers helper for AI tools and backend API calls
 */
export const getAuthHeaders = (extraHeaders: Record<string, string> = {}) => {
  const token = typeof window !== "undefined" ? localStorage.getItem("a") || "" : "";
  const clientId = (global as any)?.clientId1328 || (typeof window !== "undefined" ? localStorage.getItem("clientId1328") : "") || "";

  return {
    Authorization: token,
    "User-Client": clientId,
    "Content-Type": "application/json",
    ...extraHeaders,
  };
};

/**
 * Wrapper around native fetch that automatically checks for 401/403 status
 * and triggers immediate logout if the user's session expired.
 */
export const authFetch = async (
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<Response> => {
  const response = await fetch(input, init);
  if (response.status === 401 || response.status === 403) {
    handleAuthError(response.status);
  }
  return response;
};
