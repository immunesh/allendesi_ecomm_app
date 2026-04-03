import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

const WebSocketContext = createContext<any>(null);

export const WebSocketProvider = ({
  children,
  user,
}: {
  children: React.ReactNode;
  user: any;
}) => {
  const [wsReady, setWsReady] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!user?.id) {
      setWsReady(true); // Mark as ready even without user
      return;
    }

    try {
      const ws = new WebSocket(
        process.env.EXPO_PUBLIC_CHATTING_WEBSOCKET_URI || "ws://localhost:6006"
      );

      wsRef.current = ws;

      ws.onopen = () => {
        ws.send(`user_${user.id}`);
        setWsReady(true);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          if (data.type === "UNSEEN_COUNT_UPDATE") {
            const { conversationId, count } = data.payload;

            setUnreadCounts((prev) => ({
              ...prev,
              [conversationId]: count,
            }));
          }
        } catch (e) {
          console.log("Failed to parse websocket message:", e);
        }
      };

      ws.onerror = (error) => {
        console.log("WebSocket error:", error);
        setWsReady(true); // Mark as ready even on error
      };

      ws.onclose = () => {
        console.log("WebSocket closed");
      };

      return () => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.close();
        }
      };
    } catch (error) {
      console.log("WebSocket initialization error:", error);
      setWsReady(true); // Mark as ready even if initialization fails
    }
  }, [user?.id]);

  return (
    <WebSocketContext.Provider
      value={{ ws: wsRef.current, unreadCounts, wsReady }}
    >
      {children}
    </WebSocketContext.Provider>
  );
};

export const useWebSocket = () => useContext(WebSocketContext);