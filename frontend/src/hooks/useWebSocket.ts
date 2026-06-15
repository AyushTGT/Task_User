"use client";
import { useEffect, useRef, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { WSMessage } from "@/types";

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8000";

export function useWebSocket(token: string | null) {
  const qc = useQueryClient();
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimer = useRef<NodeJS.Timeout>();
  const mounted = useRef(true);

  const connect = useCallback(() => {
    if (!token || !mounted.current) return;

    const ws = new WebSocket(`${WS_URL}/ws?token=${token}`);
    wsRef.current = ws;

    ws.onopen = () => {
      const ping = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) ws.send("ping");
      }, 30_000);
      ws.addEventListener("close", () => clearInterval(ping));
    };

    ws.onmessage = (event) => {
      if (event.data === "pong") return;
      try {
        const msg: WSMessage = JSON.parse(event.data);
        if (msg.type === "task_created" || msg.type === "task_updated") {
          qc.invalidateQueries({ queryKey: ["tasks"] });
          qc.invalidateQueries({ queryKey: ["tasks-kanban"] });
        } else if (msg.type === "task_deleted") {
          qc.invalidateQueries({ queryKey: ["tasks"] });
          qc.invalidateQueries({ queryKey: ["tasks-kanban"] });
        }
      } catch {}
    };

    ws.onclose = () => {
      if (mounted.current) {
        reconnectTimer.current = setTimeout(connect, 3_000);
      }
    };

    ws.onerror = () => ws.close();
  }, [token, qc]);

  useEffect(() => {
    mounted.current = true;
    connect();
    return () => {
      mounted.current = false;
      clearTimeout(reconnectTimer.current);
      wsRef.current?.close();
    };
  }, [connect]);
}
