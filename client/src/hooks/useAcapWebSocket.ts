import { useEffect, useRef } from "react";
import { queryClient } from "@/lib/queryClient";

export function useAcapWebSocket() {
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === "acap") {
          if (msg.event === "assessment_completed") {
            queryClient.invalidateQueries({ queryKey: ["/api/acap/rankings/admin"] });
            queryClient.invalidateQueries({ queryKey: ["/api/acap/mastery"] });
            queryClient.invalidateQueries({ queryKey: ["/api/acap/dashboard"] });
            queryClient.invalidateQueries({ queryKey: ["/api/acap/assignments/scholar"] });
            queryClient.invalidateQueries({ queryKey: ["/api/acap/impact/latest"] });
          }
          if (msg.event === "genome_updated") {
            queryClient.invalidateQueries({ queryKey: ["/api/acap/genome"] });
          }
          if (msg.event === "rankings_updated") {
            queryClient.invalidateQueries({ queryKey: ["/api/acap/rankings/admin"] });
          }
        }
      } catch {}
    };

    ws.onclose = () => {
      setTimeout(() => {
        if (wsRef.current === ws) {
          wsRef.current = null;
        }
      }, 3000);
    };

    return () => {
      ws.close();
      wsRef.current = null;
    };
  }, []);
}
