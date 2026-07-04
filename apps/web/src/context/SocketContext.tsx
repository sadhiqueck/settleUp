import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
  type ReactNode,
} from "react";
import { Socket } from "socket.io-client";
import { getSocket, disconnectSocket } from "../lib/socket";

// ─── Context Type ───────────────────────────────────
interface SocketContextType {
  /** The active Socket.io instance (null if not connected) */
  socket: Socket | null;
  /** Whether the socket is currently connected */
  isConnected: boolean;
  /** Manually trigger a reconnection (e.g., after token refresh) */
  reconnect: () => void;
}

// ─── Create Context ─────────────────────────────────
const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
  reconnect: () => {},
});

// ─── Provider Component ─────────────────────────────
export function SocketProvider({ children }: { children: ReactNode }) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  // ─── Connect ────────────────────────────────────
  const connect = useCallback(() => {
    try {
      const newSocket = getSocket();
      socketRef.current = newSocket;
      setSocket(newSocket);

      // Clean up any old listeners from this context to prevent memory leaks
      newSocket.off("connect");
      newSocket.off("disconnect");

      newSocket.on("connect", () => setIsConnected(true));
      newSocket.on("disconnect", () => setIsConnected(false));

      // Set initial state (might already be connected)
      setIsConnected(newSocket.connected);
    } catch (error) {
      console.error("Failed to connect WebSocket:", error);
    }
  }, []);

  // ─── Reconnect (exposed to consumers) ───────────
  const reconnect = useCallback(() => {
    disconnectSocket();
    connect();
  }, [connect]);

  // ─── Effect: Connect on mount ──
  useEffect(() => {
    connect();

    return () => {
      // We don't call disconnectSocket() here because we want the singleton 
      // socket to persist across hot reloads and React Strict Mode remounts.
      // But we DO clean up the local event listeners!
      if (socketRef.current) {
         socketRef.current.off("connect");
         socketRef.current.off("disconnect");
      }
    };
  }, [connect]);

  return (
    <SocketContext.Provider value={{ socket, isConnected, reconnect }}>
      {children}
    </SocketContext.Provider>
  );
}

// ─── Custom Hook ────────────────────────────────────
/**
 * Use this hook in any component to access the WebSocket.
 *
 * Example:
 *   const { socket, isConnected } = useSocket();
 *
 *   useEffect(() => {
 *     if (!socket) return;
 *     socket.on('new_expense', (data) => { ... });
 *     return () => { socket.off('new_expense'); };
 *   }, [socket]);
 */
export function useSocket(): SocketContextType {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error("useSocket must be used within a SocketProvider");
  }
  return context;
}
