import Echo from "laravel-echo";
import Pusher from "pusher-js";
import type { ChannelAuthorizationCallback } from "pusher-js";

window.Pusher = Pusher;

const API_URL = import.meta.env.VITE_API_URL;
const REVERB_KEY = import.meta.env.VITE_REVERB_APP_KEY;
const REVERB_HOST = import.meta.env.VITE_REVERB_HOST;
const REVERB_PORT = Number(import.meta.env.VITE_REVERB_PORT ?? 443);
const REVERB_SCHEME = import.meta.env.VITE_REVERB_SCHEME ?? "https";

if (!API_URL || !REVERB_KEY || !REVERB_HOST) {
  // eslint-disable-next-line no-console
  console.warn(
    "[echo] Missing VITE_API_URL / VITE_REVERB_APP_KEY / VITE_REVERB_HOST. " +
      "Realtime will not connect.",
  );
}

export const echo = new Echo({
  broadcaster: "reverb",
  key: REVERB_KEY,
  wsHost: REVERB_HOST,
  wsPort: REVERB_PORT,
  wssPort: REVERB_PORT,
  forceTLS: REVERB_SCHEME === "https",
  enabledTransports: ["ws", "wss"],
  disableStats: true,
  // Read the token fresh on every channel-auth — survives login/logout cycles
  // without needing a page reload.
  authorizer: (channel: { name: string }) => ({
    authorize: (socketId: string, callback: ChannelAuthorizationCallback) => {
      fetch(`${API_URL}/broadcasting/auth`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${localStorage.getItem("auth_token") ?? ""}`,
        },
        body: JSON.stringify({
          socket_id: socketId,
          channel_name: channel.name,
        }),
      })
        .then((r) => (r.ok ? r.json() : Promise.reject(r)))
        .then((data) => callback(null, data))
        .catch((err) => callback(err as Error, null));
    },
  }),
});

export function disconnectEcho(): void {
  echo.disconnect();
}
