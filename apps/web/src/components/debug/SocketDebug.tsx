import { useEffect, useState } from "react";
import { useSocket } from "../../context/SocketContext";

/**
 * Temporary debug component — REMOVE after testing!
 * Shows WebSocket connection status and lets you send a test ping.
 */
export function SocketDebug() {
  const { socket, isConnected } = useSocket();
  const [pongMessage, setPongMessage] = useState<string>("");

  useEffect(() => {
    if (!socket) return;

    socket.on("pong", (data: { message: string }) => {
      setPongMessage(data.message);
    });

    return () => {
      socket.off("pong");
    };
  }, [socket]);

  const sendPing = () => {
    if (socket) {
      socket.emit("ping", { timestamp: Date.now() });
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        bottom: 16,
        right: 16,
        padding: 16,
        background: "#1a1a2e",
        color: "#fff",
        borderRadius: 12,
        fontSize: 14,
        zIndex: 9999,
        fontFamily: "monospace",
        boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
      }}
    >
      <div style={{ marginBottom: 4 }}>
        <strong>WebSocket Debug</strong>
      </div>
      <div>Status: {isConnected ? "🟢 Connected" : "🔴 Disconnected"}</div>
      <div>ID: {socket?.id || "N/A"}</div>
      <button
        onClick={sendPing}
        disabled={!isConnected}
        style={{
          marginTop: 8,
          padding: "6px 14px",
          background: isConnected ? "#00C700" : "#555",
          color: isConnected ? "#000" : "#999",
          border: "none",
          borderRadius: 6,
          cursor: isConnected ? "pointer" : "not-allowed",
          fontWeight: "bold",
        }}
      >
        Send Ping
      </button>
      {pongMessage && (
        <div style={{ marginTop: 8, color: "#6CE71D" }}>✅ {pongMessage}</div>
      )}
    </div>
  );
}
