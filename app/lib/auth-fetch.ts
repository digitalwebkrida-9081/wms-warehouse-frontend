import Cookies from "js-cookie";
import { loadingState } from "./loading-state";
import { notificationState } from "./notification-state";

// Map of common success messages based on method and URL path
const SUCCESS_MESSAGES: Record<string, string> = {
  'POST': 'Record created successfully',
  'PUT': 'Record updated successfully',
  'DELETE': 'Record deleted successfully',
};

export async function authFetch(url: string, options: RequestInit = {}) {
  const token = Cookies.get("auth-token");
  const method = options.method || 'GET';
  
  const isFormData = options.body instanceof FormData;
  
  const headers: any = {
    ...options.headers,
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  if (!isFormData) {
    headers["Content-Type"] = "application/json";
  }

  loadingState.setIsLoading(true);
  try {
    const response = await fetch(url, { ...options, headers });

    if (response.status === 401) {
      Cookies.remove("auth-token");
      window.location.href = "/login";
      return response;
    }

    // Automatically show success toast for data-modifying actions
    if (response.ok && method !== 'GET') {
      const message = SUCCESS_MESSAGES[method] || 'Task completed successfully';
      notificationState.showToast('success', message);
    }

    return response;
  } finally {
    loadingState.setIsLoading(false);
  }
}
