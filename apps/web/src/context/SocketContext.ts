import { createContext, useContext } from "react";
import { Socket } from "socket.io-client";

export interface SocketContextType {
  /** The active Socket.io instance (null if not connected) */
  socket: Socket | null;
  /** Whether the socket is currently connected */
  isConnected: boolean;
  /** Manually trigger a reconnection (e.g., after token refresh) */
  reconnect: () => void;
}

export const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
  reconnect: () => {},
});

/**
 * Use this hook in any component to access the WebSocket.
 */
export function useSocket(): SocketContextType {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error("useSocket must be used within a SocketProvider");
  }
  return context;
}
