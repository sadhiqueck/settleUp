import { io, Socket } from "socket.io-client";

// ─── Configuration ──────────────────────────────────
const SOCKET_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

// ─── Singleton Instance ─────────────────────────────
let socket: Socket | null = null;

/**
 * Get or create the Socket.io connection.
 *
 * WHY a singleton?
 *   - Socket.io connections are expensive (HTTP upgrade handshake).
 *   - We only ever need ONE connection per user session.
 *   - Multiple connections waste server resources and cause
 *     duplicate event handling.
 *
 * HOW it works:
 *   1. First call → creates the connection with cookies.
 *   2. Subsequent calls → returns the existing connection.
 *   3. If the existing connection is disconnected, it auto-reconnects.
 */
export function getSocket(): Socket {
  if (socket?.connected) {
    return socket;
  }

  // If a socket exists but is disconnected, clean it up first
  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
  }

  socket = io(SOCKET_URL, {
    // ─── Authentication ──────────────────────────
    // The browser automatically sends the httpOnly `auth_token`
    // cookie with this request because we set withCredentials: true.
    // No need to manually extract or pass the token!
    withCredentials: true,

    // ─── Reconnection Strategy ───────────────────
    reconnection: true, // Auto-reconnect on disconnect
    reconnectionAttempts: 5, // Try 5 times, then give up
    reconnectionDelay: 1000, // Start with 1 second delay
    reconnectionDelayMax: 10000, // Cap at 10 seconds (exponential backoff)

    // ─── Transport ───────────────────────────────
    transports: ["websocket", "polling"],
    // Start with WebSocket. If blocked (corporate firewalls),
    // fall back to HTTP long-polling automatically.
  });

  // ─── Connection lifecycle logging ──────────────
  socket.on("connect", () => {
    console.log("🟢 WebSocket connected:", socket!.id);
  });

  socket.on("disconnect", (reason) => {
    console.log("🔴 WebSocket disconnected:", reason);
  });

  socket.on("connect_error", (error) => {
    console.error("⚠️ WebSocket connection error:", error.message);

    // If the error is auth-related, don't keep retrying with bad credentials
    if (
      error.message.includes("Authentication") ||
      error.message.includes("token")
    ) {
      console.error("🔒 Auth error — stopping reconnection");
      socket?.disconnect();
    }
  });

  socket.on("error", (error) => {
    console.error("⚠️ WebSocket server error:", error);
  });

  return socket;
}

/**
 * Disconnect and clean up the WebSocket connection.
 * Call this when the user logs out.
 */
export function disconnectSocket(): void {
  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
    console.log("🔌 WebSocket cleaned up");
  }
}

/**
 * Check if the socket is currently connected.
 */
export function isSocketConnected(): boolean {
  return socket?.connected ?? false;
}
