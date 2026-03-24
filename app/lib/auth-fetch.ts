import Cookies from "js-cookie";

export async function authFetch(url: string, options: RequestInit = {}) {
  const token = Cookies.get("auth-token");
  
  const headers = {
    ...options.headers,
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  const response = await fetch(url, { ...options, headers });

  if (response.status === 401) {
    // Optional: Clear token and redirect to login if unauthorized
    Cookies.remove("auth-token");
    window.location.href = "/login";
  }

  return response;
}
