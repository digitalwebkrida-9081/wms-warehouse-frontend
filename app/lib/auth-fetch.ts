import Cookies from "js-cookie";

export async function authFetch(url: string, options: RequestInit = {}) {
  const token = Cookies.get("auth-token");
  
  const isFormData = options.body instanceof FormData;
  
  const headers: any = {
    ...options.headers,
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  if (!isFormData) {
    headers["Content-Type"] = "application/json";
  }

  const response = await fetch(url, { ...options, headers });

  if (response.status === 401) {
    // Optional: Clear token and redirect to login if unauthorized
    Cookies.remove("auth-token");
    window.location.href = "/login";
  }

  return response;
}
