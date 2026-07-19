import { API_BASE_URL } from "../api/client";

export type RealtimeEvent = {
  type: string;
  payload?: Record<string, unknown>;
};

export function createRealtimeSocket(accessToken: string) {
  return new WebSocket(buildRealtimeUrl(accessToken));
}

export function sendRealtimeActivity(socket: WebSocket | null) {
  if (socket?.readyState === WebSocket.OPEN) {
    socket.send("activity");
  }
}

function buildRealtimeUrl(accessToken: string) {
  const encodedToken = encodeURIComponent(accessToken);

  if (API_BASE_URL.startsWith("http://") || API_BASE_URL.startsWith("https://")) {
    const apiUrl = new URL(API_BASE_URL);
    apiUrl.protocol = apiUrl.protocol === "https:" ? "wss:" : "ws:";
    apiUrl.pathname = `${apiUrl.pathname.replace(/\/$/, "")}/realtime`;
    apiUrl.search = `token=${encodedToken}`;
    return apiUrl.toString();
  }

  const basePath = API_BASE_URL.startsWith("/") ? API_BASE_URL : `/${API_BASE_URL}`;
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  return `${protocol}//${window.location.host}${basePath}/realtime?token=${encodedToken}`;
}
