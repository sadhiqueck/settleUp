import {
  useEffect,
  useState,
  useCallback,
  useRef,
  type ReactNode,
} from "react";
import { Socket } from "socket.io-client";
import { getSocket, disconnectSocket } from "../shared/lib/socket";
import { SocketContext } from "./SocketContext";

export function SocketProvider({ children }: { children: ReactNode }) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);

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

  const reconnect = useCallback(() => {
    disconnectSocket();
    connect();
  }, [connect]);

  useEffect(() => {
    connect();

    return () => {
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
