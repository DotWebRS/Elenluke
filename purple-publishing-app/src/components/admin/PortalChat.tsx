import { useEffect, useMemo, useState } from "react";
import { API_BASE } from "../../config/apiBase";

type ChatItem = {
  id: string;
  type: number | string;
  status: number | string;
  name: string;
  email: string;
  createdAt: string;
  lastMessage?: {
    body: string;
    createdAtUtc: string;
    senderType: string;
    isInternal: boolean;
  } | null;
};

type ChatMessage = {
  id: string;
  submissionId: string;
  senderType: string;
  senderEmail: string;
  body: string;
  isInternal: boolean;
  createdAtUtc: string;
};

function buildUrl(path: string) {
  const base = String(API_BASE || "").replace(/\/+$/, "");
  const p = String(path || "").replace(/^\/+/, "");
  return base ? `${base}/${p}` : `/${p}`;
}

export default function PortalChat() {
  const token = localStorage.getItem("token") || "";
  const role = localStorage.getItem("role") || "";
  const [items, setItems] = useState<ChatItem[]>([]);
  const [activeId, setActiveId] = useState<string>("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  const authHeaders = useMemo(
    () => (token ? ({ Authorization: `Bearer ${token}` } as Record<string, string>) : {}),
    [token]
  );

  useEffect(() => {
    if (role !== "PortalUser") {
      window.location.href = "/admin/login";
      return;
    }
  }, [role]);

  const fetchMyChats = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(buildUrl("/api/chat/my"), {
        headers: { ...authHeaders },
      });

      if (!res.ok) {
        const t = await res.text().catch(() => "");
        setError(`Chat list error: ${res.status}${t ? ` — ${t}` : ""}`);
        setItems([]);
        return;
      }

      const json = await res.json().catch(() => []);
      const arr = Array.isArray(json) ? json : [];
      setItems(arr);

      if (arr.length > 0 && !activeId) {
        setActiveId(arr[0].id);
      }
    } catch (e: any) {
      setError(e?.message || "Chat list error");
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (submissionId: string) => {
    if (!submissionId) return;
    setLoadingMessages(true);
    setError("");
    try {
      const res = await fetch(buildUrl(`/api/chat/${submissionId}/messages`), {
        headers: { ...authHeaders },
      });

      if (!res.ok) {
        const t = await res.text().catch(() => "");
        setError(`Messages error: ${res.status}${t ? ` — ${t}` : ""}`);
        setMessages([]);
        return;
      }

      const json = await res.json().catch(() => ({ items: [] }));
      setMessages(Array.isArray(json?.items) ? json.items : []);
    } catch (e: any) {
      setError(e?.message || "Messages error");
      setMessages([]);
    } finally {
      setLoadingMessages(false);
    }
  };

  useEffect(() => {
    fetchMyChats();
  }, []);

  useEffect(() => {
    if (activeId) fetchMessages(activeId);
  }, [activeId]);

  const sendMessage = async () => {
    if (!activeId || !body.trim()) return;

    setSending(true);
    setError("");

    try {
      const res = await fetch(buildUrl(`/api/chat/${activeId}/messages`), {
        method: "POST",
        headers: { ...authHeaders, "Content-Type": "application/json" },
        body: JSON.stringify({
          body: body.trim(),
          isInternal: false,
          sendEmailToContact: true,
        }),
      });

      if (!res.ok) {
        const t = await res.text().catch(() => "");
        setError(`Send error: ${res.status}${t ? ` — ${t}` : ""}`);
        return;
      }

      setBody("");
      await fetchMessages(activeId);
      await fetchMyChats();
    } catch (e: any) {
      setError(e?.message || "Send error");
    } finally {
      setSending(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("email");
    localStorage.removeItem("userId");
    window.location.href = "/admin/login";
  };

  return (
    <div className="admin-shell">
      <header className="admin-topbar">
        <div className="admin-topbar-left">
          <div className="topbar-btn topbar-btn--active">Portal Chat</div>
        </div>
        <div className="admin-topbar-right">
          <button type="button" className="topbar-link" onClick={logout}>
            Logout
          </button>
        </div>
      </header>

      <div className="admin-root" style={{ padding: 16 }}>
        {error ? (
          <div className="admin-alert admin-alert-error">
            <strong>Error:</strong> {error}
          </div>
        ) : null}

        <div style={{ display: "grid", gridTemplateColumns: "320px 1fr", gap: 16 }}>
          <div className="admin-table-wrap" style={{ minHeight: 500 }}>
            <div style={{ padding: 12, borderBottom: "1px solid #e5e7eb", fontWeight: 600 }}>
              My conversations
            </div>

            {loading ? (
              <div style={{ padding: 16 }}>Loading…</div>
            ) : items.length === 0 ? (
              <div style={{ padding: 16 }}>No assigned chats yet.</div>
            ) : (
              <div>
                {items.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setActiveId(item.id)}
                    style={{
                      width: "100%",
                      textAlign: "left",
                      padding: 12,
                      border: "none",
                      borderBottom: "1px solid #e5e7eb",
                      background: activeId === item.id ? "#f3f4f6" : "#fff",
                      cursor: "pointer",
                    }}
                  >
                    <div style={{ fontWeight: 600 }}>{item.name || item.email || "Conversation"}</div>
                    <div style={{ fontSize: 12, opacity: 0.7 }}>{item.email}</div>
                    <div style={{ fontSize: 12, marginTop: 6, opacity: 0.8 }}>
                      {item.lastMessage?.body || "No messages yet"}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="admin-table-wrap" style={{ minHeight: 500, display: "flex", flexDirection: "column" }}>
            <div style={{ padding: 12, borderBottom: "1px solid #e5e7eb", fontWeight: 600 }}>
              Conversation
            </div>

            <div style={{ flex: 1, padding: 16, overflowY: "auto" }}>
              {loadingMessages ? (
                <div>Loading messages…</div>
              ) : !activeId ? (
                <div>Select a conversation.</div>
              ) : messages.length === 0 ? (
                <div>No messages yet.</div>
              ) : (
                messages.map((m) => (
                  <div
                    key={m.id}
                    style={{
                      marginBottom: 12,
                      padding: 12,
                      borderRadius: 10,
                      background: m.senderType === "PortalUser" ? "#ede9fe" : "#f3f4f6",
                    }}
                  >
                    <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 6 }}>
                      {m.senderType} · {new Date(m.createdAtUtc).toLocaleString()}
                    </div>
                    <div style={{ whiteSpace: "pre-wrap" }}>{m.body}</div>
                  </div>
                ))
              )}
            </div>

            <div style={{ borderTop: "1px solid #e5e7eb", padding: 12 }}>
              <textarea
                className="admin-input"
                style={{ minHeight: 100, width: "100%" }}
                placeholder="Write a message..."
                value={body}
                onChange={(e) => setBody(e.target.value)}
              />
              <div style={{ marginTop: 10, display: "flex", justifyContent: "flex-end" }}>
                <button
                  className="admin-btn admin-btn-primary"
                  onClick={sendMessage}
                  disabled={sending || !activeId || !body.trim()}
                >
                  Send
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}