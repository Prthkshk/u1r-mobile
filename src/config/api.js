import Constants from "expo-constants";

// 1) Read env variable from EAS builds
let baseUrl = process.env.EXPO_PUBLIC_API_BASE_URL;

// 2) Read from app.json -> extra.apiBaseUrl
if (!baseUrl) {
  baseUrl = Constants.expoConfig?.extra?.apiBaseUrl;
}

// 3) Final fallback (should never happen)
if (!baseUrl) {
  baseUrl = "https://api.u1rfoods.com";
}

// Remove trailing slash
if (baseUrl.endsWith("/")) baseUrl = baseUrl.slice(0, -1);

export const API_BASE_URL = baseUrl;

if (/localhost|127\.0\.0\.1|0\.0\.0\.0/i.test(API_BASE_URL)) {
  console.warn(
    "[API] API_BASE_URL points to localhost. Use your LAN IP or public domain for mobile."
  );
}

if (__DEV__) {
  console.log(`[API] Using base URL: ${API_BASE_URL}`);
}

// Attach base URL for images or other asset paths
export const withBaseUrl = (uri = "") => {
  if (!uri) return uri;
  const cleaned = String(uri).trim().replace(/\\/g, "/");
  if (!cleaned) return "";
  if (/^https?:\/\//i.test(cleaned)) {
    try {
      const parsed = new URL(cleaned);
      if (parsed.pathname?.startsWith("/uploads/")) {
        return `${API_BASE_URL}${parsed.pathname}${parsed.search || ""}`;
      }
      return cleaned;
    } catch {
      return cleaned;
    }
  }
  const normalized = cleaned.startsWith("/") ? cleaned : `/${cleaned}`;
  return `${API_BASE_URL}${normalized}`;
};
