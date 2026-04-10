import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import * as signalR from "@microsoft/signalr";
import { API_BASE } from "../../config/apiBase";

type LiveEventType =
  | "submission_created"
  | "submission_updated"
  | "message_received"
  | "submission_assigned";

type LiveEvent = {
  id: string;
  type: LiveEventType;
  payload: any;
  createdAt: string;
  read: boolean;
};

type AdminNotificationsContextValue = {
  isConnected: boolean;
  unreadCount: number;
  events: LiveEvent[];
  markAllRead: () => void;
  clearEvents: () => void;
  markEventRead: (eventId: string) => void;
  markEventsForSubmissionRead: (submissionId: string) => void;
};

const AdminNotificationsContext = createContext<AdminNotificationsContextValue | null>(null);

function buildHubUrl() {
  const base = String(API_BASE || "").replace(/\/+$/, "");
  return `${base}/hubs/notifications`;
}

export function AdminNotificationsProvider({ children }: { children: ReactNode }) {
  const [isConnected, setIsConnected] = useState(false);
  const [events, setEvents] = useState<LiveEvent[]>([]);

  const connectionRef = useRef<signalR.HubConnection | null>(null);

  const pushEvent = useCallback((type: LiveEventType, payload: any) => {
    const evt: LiveEvent = {
      id: `${type}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      type,
      payload,
      createdAt: new Date().toISOString(),
      read: false,
    };

    setEvents((prev) => [evt, ...prev].slice(0, 50));
  }, []);

  const markAllRead = useCallback(() => {
    setEvents((prev) => prev.map((e) => ({ ...e, read: true })));
  }, []);

  const clearEvents = useCallback(() => {
    setEvents([]);
  }, []);

  const markEventRead = useCallback((eventId: string) => {
    setEvents((prev) =>
      prev.map((e) => (e.id === eventId ? { ...e, read: true } : e))
    );
  }, []);

  const markEventsForSubmissionRead = useCallback((submissionId: string) => {
    if (!submissionId) return;

    setEvents((prev) =>
      prev.map((e) => {
        const eventSubmissionId =
          e.payload?.submissionId ||
          e.payload?.id ||
          "";

        if (String(eventSubmissionId) === String(submissionId)) {
          return { ...e, read: true };
        }

        return e;
      })
    );
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("token") || "";
    const role = localStorage.getItem("role") || "";

    if (!token) return;
    if (!["Admin", "Editor", "PortalUser"].includes(role)) return;

    const connection = new signalR.HubConnectionBuilder()
      .withUrl(buildHubUrl(), {
        accessTokenFactory: () => token,
      })
      .withAutomaticReconnect()
      .configureLogging(signalR.LogLevel.Warning)
      .build();

    connectionRef.current = connection;

    connection.on("submission_created", (payload) => {
      pushEvent("submission_created", payload);
    });

    connection.on("submission_updated", (payload) => {
      pushEvent("submission_updated", payload);
    });

    connection.on("message_received", (payload) => {
      pushEvent("message_received", payload);
    });

    connection.on("submission_assigned", (payload) => {
      pushEvent("submission_assigned", payload);
    });

    connection.onreconnecting(() => {
      setIsConnected(false);
    });

    connection.onreconnected(() => {
      setIsConnected(true);
    });

    connection.onclose(() => {
      setIsConnected(false);
    });

    connection
      .start()
      .then(() => {
        setIsConnected(true);
      })
      .catch((err) => {
        console.error("SignalR connection error:", err);
        setIsConnected(false);
      });

    return () => {
      connection.stop().catch(() => {});
    };
  }, [pushEvent]);

  const unreadCount = useMemo(
    () => events.filter((e) => !e.read).length,
    [events]
  );

  const value = useMemo<AdminNotificationsContextValue>(
    () => ({
      isConnected,
      unreadCount,
      events,
      markAllRead,
      clearEvents,
      markEventRead,
      markEventsForSubmissionRead,
    }),
    [isConnected, unreadCount, events, markAllRead, clearEvents, markEventRead, markEventsForSubmissionRead]
  );

  return (
    <AdminNotificationsContext.Provider value={value}>
      {children}
    </AdminNotificationsContext.Provider>
  );
}

export function useAdminNotifications() {
  const ctx = useContext(AdminNotificationsContext);
  if (!ctx) {
    throw new Error("useAdminNotifications must be used inside AdminNotificationsProvider");
  }
  return ctx;
}