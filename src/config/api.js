export const API_BASE_URL = "https://api.u1rfoods.com";

// Helper to normalize asset URLs returned by the backend
export const withBaseUrl = (uri = "") =>
  uri && uri.startsWith("http") ? uri : `${API_BASE_URL}${uri}`;
