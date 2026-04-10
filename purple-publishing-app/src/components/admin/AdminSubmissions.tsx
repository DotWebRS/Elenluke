import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import * as XLSX from "xlsx";
import { AdminShell } from "./AdminShell";
import { useAdminSite } from "./useAdminSite";
import AdminSubmissionAudit from "./AdminSubmissionAudit";
import { API_BASE } from "../../config/apiBase";
import "../../styles/AdminSubmissionsModal.css";
import { useLocation } from "react-router-dom";
import { useAdminNotifications } from "./AdminNotificationsProvider";

type DetailTab = "overview" | "chat" | "files";

type ChatMessage = {
  id: string;
  submissionId: string;
  senderType: string;
  senderEmail: string;
  body: string;
  isInternal: boolean;
  createdAtUtc: string;
};

type ChatListResponse = {
  items: ChatMessage[];
};

type ChatThreadItem = {
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

type PortalUserOption = {
  id: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: string;
};

const SubmissionTypeId = {
  DemoUpload: 1,
  ArtistInformation: 2,
  SongwriterInformation: 3,
  SyncRequest: 4,
  GeneralContactInquiry: 5,
  SupportForm: 6,
  LegalRequest: 7,
} as const;

const SubmissionStatusId = {
  Unread: 1,
  Read: 2,
  InProgress: 3,
  Done: 4,
  Accepted: 5,
  Rejected: 6,
  UnderReview: 7,
} as const;

type SubmissionTypeId = (typeof SubmissionTypeId)[keyof typeof SubmissionTypeId];
type SubmissionStatusId = (typeof SubmissionStatusId)[keyof typeof SubmissionStatusId];

type SubmissionFile = {
  id: string;
  fileName: string;
  contentType: string;
  size: number;
};

type SubmissionField = {
  name: string;
  value: string;
};

type SubmissionReply = {
  id: string;
  toEmail: string;
  subject: string;
  body: string;
  sentAt: string;
};

type SubmissionListItem = {
  id: string;
  type: SubmissionTypeId;
  status: SubmissionStatusId;
  domain: string;
  name: string;
  email: string;
  message: string | null;
  uploadedBy: string | null;
  createdAt: string;
  repliesCount: number;
  fields: SubmissionField[];
  files: SubmissionFile[];
  isArchived?: boolean;
  archivedAtUtc?: string | null;
};

type SubmissionDetail = {
  id: string;
  type: SubmissionTypeId;
  status: SubmissionStatusId;
  domain: string;
  name: string;
  email: string;
  message: string | null;
  uploadedBy: string | null;
  createdAt: string;
  fields: SubmissionField[];
  files: SubmissionFile[];
  replies: SubmissionReply[];
  isArchived?: boolean;
  archivedAtUtc?: string | null;
};

type ListResponse = {
  total: number;
  items: SubmissionListItem[];
};

type FilterHasFile = "all" | "yes" | "no";
type ArchiveTab = "active" | "archived";
type SubmissionView = "inbox" | "audit" | "chats";

const SUBMISSION_TYPE_VALUES: SubmissionTypeId[] = [
  SubmissionTypeId.DemoUpload,
  SubmissionTypeId.ArtistInformation,
  SubmissionTypeId.SongwriterInformation,
  SubmissionTypeId.SyncRequest,
  SubmissionTypeId.GeneralContactInquiry,
  SubmissionTypeId.SupportForm,
  SubmissionTypeId.LegalRequest,
];

const STATUS_FILTER_VALUES: SubmissionStatusId[] = [
  SubmissionStatusId.Unread,
  SubmissionStatusId.Read,
  SubmissionStatusId.InProgress,
  SubmissionStatusId.UnderReview,
  SubmissionStatusId.Done,
  SubmissionStatusId.Accepted,
  SubmissionStatusId.Rejected,
];

function typeLabel(t: SubmissionTypeId | number | string) {
  switch (Number(t)) {
    case SubmissionTypeId.DemoUpload:
      return "Demo";
    case SubmissionTypeId.ArtistInformation:
      return "Artist info";
    case SubmissionTypeId.SongwriterInformation:
      return "Songwriter info";
    case SubmissionTypeId.SyncRequest:
      return "Sync request";
    case SubmissionTypeId.GeneralContactInquiry:
      return "General contact";
    case SubmissionTypeId.SupportForm:
      return "Support";
    case SubmissionTypeId.LegalRequest:
      return "Legal";
    default:
      return String(t);
  }
}

function statusLabel(s: SubmissionStatusId | number | string) {
  switch (Number(s)) {
    case SubmissionStatusId.Unread:
      return "Unread";
    case SubmissionStatusId.Read:
      return "Read";
    case SubmissionStatusId.InProgress:
      return "In progress";
    case SubmissionStatusId.Done:
      return "Done";
    case SubmissionStatusId.Accepted:
      return "Accepted";
    case SubmissionStatusId.Rejected:
      return "Rejected";
    case SubmissionStatusId.UnderReview:
      return "Under review";
    default:
      return String(s);
  }
}

function statusBadgeClass(s: SubmissionStatusId | number | string) {
  switch (Number(s)) {
    case SubmissionStatusId.Unread:
      return "badge-unread";
    case SubmissionStatusId.Read:
      return "badge-read";
    case SubmissionStatusId.InProgress:
      return "badge-inprogress";
    case SubmissionStatusId.Done:
      return "badge-done";
    case SubmissionStatusId.Accepted:
      return "badge-accepted";
    case SubmissionStatusId.Rejected:
      return "badge-rejected";
    case SubmissionStatusId.UnderReview:
      return "badge-review";
    default:
      return "";
  }
}

function isDemoOrSync(t: SubmissionTypeId) {
  return t === SubmissionTypeId.DemoUpload || t === SubmissionTypeId.SyncRequest;
}

function showUnderReview(t: SubmissionTypeId, s: SubmissionStatusId) {
  if (!isDemoOrSync(t)) return false;
  return (
    s === SubmissionStatusId.Unread ||
    s === SubmissionStatusId.Read ||
    s === SubmissionStatusId.InProgress
  );
}

function buildUrl(path: string) {
  const base = String(API_BASE || "").replace(/\/+$/, "");
  const p = String(path || "").replace(/^\/+/, "");
  return base ? `${base}/${p}` : `/${p}`;
}

function useAuthHeaders() {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") || "" : "";
  return useMemo(() => {
    if (!token) return {};
    return { Authorization: `Bearer ${token}` } as Record<string, string>;
  }, [token]);
}

async function fetchJson<T>(input: RequestInfo, init?: RequestInit): Promise<T> {
  const res = await fetch(input, init);
  if (!res.ok) {
    const t = await res.text().catch(() => "");
    throw new Error(t || `Request failed with status ${res.status}`);
  }
  return (await res.json().catch(() => null)) as T;
}

async function fetchBlob(input: RequestInfo, init?: RequestInit): Promise<Blob> {
  const res = await fetch(input, init);
  if (!res.ok) {
    const t = await res.text().catch(() => "");
    throw new Error(t || `Request failed with status ${res.status}`);
  }
  return await res.blob();
}

function getFieldValue(fields: SubmissionField[] | null | undefined, candidates: string[]) {
  const arr = Array.isArray(fields) ? fields : [];
  const norm = (x: string) => (x || "").trim().toLowerCase();

  for (const c of candidates) {
    const hit = arr.find((f) => norm(f.name) === norm(c));
    if (hit?.value) return hit.value;
  }

  for (const c of candidates) {
    const cn = norm(c);
    const hit = arr.find((f) => norm(f.name).includes(cn));
    if (hit?.value) return hit.value;
  }

  return "";
}

function buildDemoRejectionTemplate(detail: SubmissionDetail) {
  const name = detail.name || "";
  const trackTitle = getFieldValue(detail.fields, [
    "releaseTitle",
    "Release Title",
    "songTitle",
    "Song Title",
    "trackTitle",
    "Track Title",
    "Title",
    "Track",
  ]);
  const trackPart = trackTitle ? ` ${trackTitle}` : " your track";

  return (
    `Hi ${name},\n\n` +
    `Thank you for sending${trackPart}. After careful consideration, we have decided not to move forward with a release for this track.\n\n` +
    `Due to the volume of submissions we receive, we can’t always provide detailed feedback, but we truly appreciate you sharing your work with us. Please don’t hesitate to send future demos, we are always keen to hear what you are working on next.\n\n` +
    `Wishing you the best,\n\n` +
    `Your Purple Crunch Records Team`
  );
}

export function AdminSubmissions() {
  const navigate = useNavigate();
  const role = localStorage.getItem("role") || "";
  const myEmail = localStorage.getItem("email") || "";
  const authHeaders = useAuthHeaders();
  const { site } = useAdminSite();

  const [detailTab, setDetailTab] = useState<DetailTab>("overview");
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [chatSending, setChatSending] = useState(false);
  const [chatBody, setChatBody] = useState("");
  const [chatInternal, setChatInternal] = useState(false);

  const [allChats, setAllChats] = useState<ChatThreadItem[]>([]);
  const [allChatsLoading, setAllChatsLoading] = useState(false);
  const [activeChatId, setActiveChatId] = useState("");
  const [allChatMessages, setAllChatMessages] = useState<ChatMessage[]>([]);
  const [allChatMessagesLoading, setAllChatMessagesLoading] = useState(false);

  const [portalUsers, setPortalUsers] = useState<PortalUserOption[]>([]);
  const [portalUsersLoading, setPortalUsersLoading] = useState(false);
  const [selectedPortalUserId, setSelectedPortalUserId] = useState("");
  const [assigningPortalUser, setAssigningPortalUser] = useState(false);
  const [assignedPortalUserIds, setAssignedPortalUserIds] = useState<string[]>([]);
  const [assignSuccessMessage, setAssignSuccessMessage] = useState("");

  const [subView, setSubView] = useState<SubmissionView>("inbox");
  const [archiveTab, setArchiveTab] = useState<ArchiveTab>("active");

  const [page, setPage] = useState(1);
  const pageSize = 50;

  const [data, setData] = useState<ListResponse>({ total: 0, items: [] });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [typeFilter, setTypeFilter] = useState<SubmissionTypeId | "all">("all");
  const [statusFilter, setStatusFilter] = useState<SubmissionStatusId | "all">("all");
  const [hasFile, setHasFile] = useState<FilterHasFile>("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const [search, setSearch] = useState("");
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  const [openId, setOpenId] = useState<string | null>(null);
  const [detail, setDetail] = useState<SubmissionDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const [busyRow, setBusyRow] = useState<string | null>(null);
  const [savingStatus, setSavingStatus] = useState(false);

  const [rejectionBody, setRejectionBody] = useState("");
  const [replyTo, setReplyTo] = useState("");
  const [replySubject, setReplySubject] = useState("");
  const [replyBody, setReplyBody] = useState("");

  const [previewUrls, setPreviewUrls] = useState<Record<string, string>>({});
  const previewUrlsRef = useRef<Record<string, string>>({});
  const [activePreviewFileId, setActivePreviewFileId] = useState<string | null>(null);

  const [allChatBody, setAllChatBody] = useState("");
  const [allChatInternal, setAllChatInternal] = useState(false);
  const [allChatSending, setAllChatSending] = useState(false);

  const location = useLocation();
  const { markEventsForSubmissionRead } = useAdminNotifications();
  const { events } = useAdminNotifications();

  useEffect(() => {
    if (role === "PortalUser") return;
    if (events.length === 0) return;

    const latest = events[0];
    if (!latest) return;

    if (subView === "inbox") {
      if (
        latest.type === "submission_created" ||
        latest.type === "submission_updated" ||
        latest.type === "message_received" ||
        latest.type === "submission_assigned"
      ) {
        fetchList();
      }
    }

    if (subView === "chats") {
      if (
        latest.type === "message_received" ||
        latest.type === "submission_assigned" ||
        latest.type === "submission_created"
      ) {
        fetchAllChats();

        if (activeChatId) {
          fetchAllChatMessages(activeChatId);
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [events, subView, role, activeChatId]);

  useEffect(() => {
    if (role === "PortalUser") {
      navigate("/portal/chat", { replace: true });
    }
  }, [role, navigate]);

  useEffect(() => {
    const submissionId = (location.state as any)?.openSubmissionId;
    if (!submissionId) return;

    openSubmission(submissionId);
    markEventsForSubmissionRead(submissionId);

    navigate(location.pathname, { replace: true, state: {} });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state]);

  useEffect(() => {
    previewUrlsRef.current = previewUrls;
  }, [previewUrls]);

  useEffect(() => {
    setPage(1);
    setArchiveTab("active");
    setSubView("inbox");
  }, [site]);

  useEffect(() => {
    return () => {
      for (const k of Object.keys(previewUrlsRef.current)) {
        try {
          URL.revokeObjectURL(previewUrlsRef.current[k]);
        } catch {}
      }
    };
  }, []);

  const visibleItems = useMemo(() => data.items ?? [], [data.items]);

  const buildQuery = () => {
    const qs = new URLSearchParams();
    qs.set("page", String(page));
    qs.set("pageSize", String(pageSize));

    if (site) qs.set("site", site);
    qs.set("archived", archiveTab === "archived" ? "true" : "false");

    if (search.trim()) qs.set("search", search.trim());
    if (typeFilter !== "all") qs.set("type", String(typeFilter));
    if (statusFilter !== "all") qs.set("status", String(statusFilter));
    if (hasFile !== "all") qs.set("hasFile", hasFile === "yes" ? "true" : "false");
    if (fromDate) qs.set("from", `${fromDate}T00:00:00`);
    if (toDate) qs.set("to", `${toDate}T23:59:59`);

    return qs.toString();
  };

  const sendAllChatMessage = async () => {
  if (!activeChatId || !allChatBody.trim()) return;

  setAllChatSending(true);
  setError(null);

  try {
    await fetchJson(buildUrl(`/api/chat/${activeChatId}/messages`), {
      method: "POST",
      headers: { ...authHeaders, "Content-Type": "application/json" },
      body: JSON.stringify({
        body: allChatBody.trim(),
        isInternal: allChatInternal,
        sendEmailToContact: false,
      }),
    });

    setAllChatBody("");
    setAllChatInternal(false);
    await fetchAllChatMessages(activeChatId);
    await fetchAllChats();
  } catch (e: any) {
    setError(e?.message || "All chat send error");
  } finally {
    setAllChatSending(false);
  }
};

  const listAbortRef = useRef<AbortController | null>(null);

  const fetchList = async () => {
    listAbortRef.current?.abort();
    const controller = new AbortController();
    listAbortRef.current = controller;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(buildUrl(`/api/submissions?${buildQuery()}`), {
        signal: controller.signal,
        headers: { ...authHeaders },
      });

      if (!res.ok) {
        const t = await res.text().catch(() => "");
        setError(`List error: ${res.status}${t ? ` — ${t}` : ""}`);
        setData({ total: 0, items: [] });
        return;
      }

      const json = await res.json().catch(() => null);

      setData({
        total: Number(json?.totalCount ?? json?.total ?? 0),
        items: Array.isArray(json?.items) ? json.items : [],
      });
    } catch (e: any) {
      if (e?.name === "AbortError") return;
      setError(e?.message || "List error");
      setData({ total: 0, items: [] });
    } finally {
      setLoading(false);
    }
  };

  const fetchAllChats = async () => {
  setAllChatsLoading(true);
  setError(null);

  try {
    const json = await fetchJson<ChatThreadItem[]>(buildUrl("/api/chat/my"), {
      headers: { ...authHeaders },
    });

    const arr = Array.isArray(json) ? json : [];


    const filtered = arr.filter((x) => x.lastMessage);

    setAllChats(filtered);

    if (filtered.length > 0) {
      setActiveChatId((prev) => prev || filtered[0].id);
    } else {
      setActiveChatId("");
      setAllChatMessages([]);
    }
  } catch (e: any) {
    setError(e?.message || "All chats load error");
    setAllChats([]);
  } finally {
    setAllChatsLoading(false);
  }
};

  const fetchAllChatMessages = async (submissionId: string) => {
    if (!submissionId) return;

    setAllChatMessagesLoading(true);
    setError(null);

    try {
      const json = await fetchJson<ChatListResponse>(buildUrl(`/api/chat/${submissionId}/messages`), {
        headers: { ...authHeaders },
      });

      setAllChatMessages(Array.isArray(json?.items) ? json.items : []);
    } catch (e: any) {
      setError(e?.message || "All chat messages load error");
      setAllChatMessages([]);
    } finally {
      setAllChatMessagesLoading(false);
    }
  };

  useEffect(() => {
    if (role === "PortalUser") return;
    if (subView !== "inbox") return;

    fetchList();
    return () => listAbortRef.current?.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, typeFilter, statusFilter, hasFile, fromDate, toDate, search, site, archiveTab, subView, role]);

  useEffect(() => {
    if (role === "PortalUser") return;
    if (subView !== "chats") return;
    fetchAllChats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subView, role]);

  useEffect(() => {
    if (role === "PortalUser") return;
    if (subView !== "chats") return;
    if (!activeChatId) return;
    fetchAllChatMessages(activeChatId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeChatId, subView, role]);

  const openSubmission = async (id: string) => {
    markEventsForSubmissionRead(id);
    setDetailTab("overview");
    setChatMessages([]);
    setChatBody("");
    setChatInternal(false);
    setPortalUsers([]);
    setSelectedPortalUserId("");
    setAssignedPortalUserIds([]);
    setAssignSuccessMessage("");
    setOpenId(id);
    setDetail(null);
    setDetailLoading(true);
    setError(null);
    setActivePreviewFileId(null);

    try {
      const d = await fetchJson<SubmissionDetail>(buildUrl(`/api/submissions/${id}`), {
        headers: { ...authHeaders },
      });

      setDetail(d);

      if (d.type === SubmissionTypeId.DemoUpload) {
        setRejectionBody(buildDemoRejectionTemplate(d));
      } else {
        setRejectionBody("");
      }

      setReplyTo(d.email || "");
      setReplySubject("");
      setReplyBody("");
    } catch (e: any) {
      setError(e?.message || "Detail error");
    } finally {
      setDetailLoading(false);
    }
  };

  const fetchPortalUsers = async () => {
    setPortalUsersLoading(true);
    setError(null);
    setAssignSuccessMessage("");

    try {
      const json = await fetchJson<PortalUserOption[]>(buildUrl("/api/users"), {
        headers: { ...authHeaders },
      });

      const onlyPortalUsers = (Array.isArray(json) ? json : []).filter(
        (u) => u.role === "PortalUser" && u.isActive
      );

      setPortalUsers(onlyPortalUsers);
      setSelectedPortalUserId("");
    } catch (e: any) {
      setError(e?.message || "Portal users load error");
      setPortalUsers([]);
    } finally {
      setPortalUsersLoading(false);
    }
  };

  const assignPortalUserToChat = async () => {
    if (!detail || !selectedPortalUserId) return;

    setAssigningPortalUser(true);
    setError(null);
    setAssignSuccessMessage("");

    try {
      await fetchJson(buildUrl(`/api/chat/${detail.id}/participants`), {
        method: "POST",
        headers: { ...authHeaders, "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: selectedPortalUserId,
        }),
      });

      const assignedUser = portalUsers.find((u) => u.id === selectedPortalUserId);

      setAssignedPortalUserIds((prev) =>
        prev.includes(selectedPortalUserId) ? prev : [...prev, selectedPortalUserId]
      );

      setAssignSuccessMessage(
        assignedUser?.email
          ? `${assignedUser.email} is now assigned to this chat.`
          : "Portal user assigned to this chat."
      );
    } catch (e: any) {
      setError(e?.message || "Assign portal user error");
    } finally {
      setAssigningPortalUser(false);
    }
  };

  useEffect(() => {
    if (!openId || !detail) return;
    fetchPortalUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openId, detail?.id]);

  const fetchChatMessages = async (submissionId: string) => {
    setChatLoading(true);
    setError(null);

    try {
      const json = await fetchJson<ChatListResponse>(buildUrl(`/api/chat/${submissionId}/messages`), {
        headers: { ...authHeaders },
      });

      setChatMessages(Array.isArray(json?.items) ? json.items : []);
    } catch (e: any) {
      setError(e?.message || "Chat load error");
      setChatMessages([]);
    } finally {
      setChatLoading(false);
    }
  };

  const sendChatMessage = async () => {
    if (!detail || !chatBody.trim()) return;

    setChatSending(true);
    setError(null);

    try {
      await fetchJson(buildUrl(`/api/chat/${detail.id}/messages`), {
        method: "POST",
        headers: { ...authHeaders, "Content-Type": "application/json" },
        body: JSON.stringify({
          body: chatBody.trim(),
          isInternal: chatInternal,
          sendEmailToContact: false,
          subject: `Re: ${typeLabel(detail.type)} - ${detail.name || detail.email || "Submission"}`,
        }),
      });

      setChatBody("");
      setChatInternal(false);
      await fetchChatMessages(detail.id);
      if (subView === "chats") await fetchAllChats();
    } catch (e: any) {
      setError(e?.message || "Chat send error");
    } finally {
      setChatSending(false);
    }
  };

  useEffect(() => {
    if (!detail || !openId) return;
    if (detailTab !== "chat") return;

    fetchChatMessages(detail.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [detailTab, detail?.id, openId]);

  const closeModal = () => {
    setOpenId(null);
    setDetail(null);
    setRejectionBody("");
    setReplyTo("");
    setReplySubject("");
    setReplyBody("");
    setActivePreviewFileId(null);
    setDetailTab("overview");
    setChatMessages([]);
    setChatBody("");
    setChatInternal(false);
    setPortalUsers([]);
    setSelectedPortalUserId("");
    setAssignedPortalUserIds([]);
    setAssignSuccessMessage("");
  };

  const patchStatusLocal = (id: string, newStatus: SubmissionStatusId) => {
    setData((prev) => ({
      ...prev,
      items: (prev.items || []).map((s) => (s.id === id ? { ...s, status: newStatus } : s)),
    }));
    setDetail((prev) => (prev && prev.id === id ? { ...prev, status: newStatus } : prev));
  };

  const updateStatus = async (id: string, newStatus: SubmissionStatusId) => {
    setSavingStatus(true);
    setBusyRow(id);
    setError(null);

    try {
      await fetchJson<void>(buildUrl(`/api/submissions/${id}/status`), {
        method: "PUT",
        headers: { ...authHeaders, "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      patchStatusLocal(id, newStatus);
    } catch (e: any) {
      setError(e?.message || "Status update error");
    } finally {
      setSavingStatus(false);
      setBusyRow(null);
    }
  };

  const deleteSubmissionById = async (id: string) => {
    const ok = window.confirm("Delete this submission?");
    if (!ok) return;

    setError(null);
    setBusyRow(id);

    try {
      const res = await fetch(buildUrl(`/api/submissions/${id}`), {
        method: "DELETE",
        headers: { ...authHeaders },
      });

      if (!res.ok) {
        const t = await res.text().catch(() => "");
        setError(`Delete error: ${res.status}${t ? ` — ${t}` : ""}`);
        return;
      }

      setData((prev) => ({
        ...prev,
        items: (prev.items || []).filter((s) => s.id !== id),
        total: Math.max(0, (prev.total || 0) - 1),
      }));

      if (detail && detail.id === id) closeModal();
    } catch (e: any) {
      setError(e?.message || "Delete error");
    } finally {
      setBusyRow(null);
    }
  };

  const patchArchiveLocal = (id: string, isArchived: boolean, archivedAtUtc?: string | null) => {
    setData((prev) => ({
      ...prev,
      items: (prev.items || []).map((s) =>
        s.id === id ? { ...s, isArchived, archivedAtUtc: archivedAtUtc ?? s.archivedAtUtc } : s
      ),
    }));
    setDetail((prev) =>
      prev && prev.id === id ? { ...prev, isArchived, archivedAtUtc: archivedAtUtc ?? prev.archivedAtUtc } : prev
    );
  };

  const archiveSubmission = async (id: string) => {
    setError(null);
    setBusyRow(id);

    try {
      const res = await fetch(buildUrl(`/api/submissions/${id}/archive`), {
        method: "PUT",
        headers: { ...authHeaders },
      });

      if (!res.ok) {
        const t = await res.text().catch(() => "");
        setError(`Archive error: ${res.status}${t ? ` — ${t}` : ""}`);
        return;
      }

      const json = await res.json().catch(() => null);
      const archivedAt = json?.archivedAtUtc ?? null;

      if (archiveTab === "active") {
        setData((prev) => ({
          ...prev,
          items: (prev.items || []).filter((s) => s.id !== id),
          total: Math.max(0, (prev.total || 0) - 1),
        }));
      } else {
        patchArchiveLocal(id, true, archivedAt);
      }

      if (detail?.id === id) patchArchiveLocal(id, true, archivedAt);
    } catch (e: any) {
      setError(e?.message || "Archive error");
    } finally {
      setBusyRow(null);
    }
  };

  const unarchiveSubmission = async (id: string) => {
    setError(null);
    setBusyRow(id);

    try {
      const res = await fetch(buildUrl(`/api/submissions/${id}/unarchive`), {
        method: "PUT",
        headers: { ...authHeaders },
      });

      if (!res.ok) {
        const t = await res.text().catch(() => "");
        setError(`Unarchive error: ${res.status}${t ? ` — ${t}` : ""}`);
        return;
      }

      if (archiveTab === "archived") {
        setData((prev) => ({
          ...prev,
          items: (prev.items || []).filter((s) => s.id !== id),
          total: Math.max(0, (prev.total || 0) - 1),
        }));
      } else {
        patchArchiveLocal(id, false, null);
      }

      if (detail?.id === id) patchArchiveLocal(id, false, null);
    } catch (e: any) {
      setError(e?.message || "Unarchive error");
    } finally {
      setBusyRow(null);
    }
  };

  const fetchFileBlob = async (submissionId: string, fileId: string) => {
    return await fetchBlob(buildUrl(`/api/submissions/${submissionId}/files/${fileId}/download`), {
      headers: { ...authHeaders },
    });
  };

  const ensurePreviewUrl = async (file: SubmissionFile) => {
    if (!detail) return "";
    const existing = previewUrls[file.id];
    if (existing) return existing;

    const blob = await fetchFileBlob(detail.id, file.id);
    const url = URL.createObjectURL(blob);
    setPreviewUrls((p) => ({ ...p, [file.id]: url }));
    return url;
  };

  const previewInline = async (file: SubmissionFile) => {
    try {
      setError(null);
      const url = await ensurePreviewUrl(file);
      if (!url) return;
      setActivePreviewFileId(file.id);
    } catch (e: any) {
      setError(e?.message || "Preview error");
    }
  };

  const downloadFile = async (file: SubmissionFile) => {
    if (!detail) return;

    try {
      const blob = await fetchFileBlob(detail.id, file.id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = file.fileName || "download";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 5000);
    } catch (e: any) {
      setError(e?.message || "Download error");
    }
  };

  const exportOneExcel = () => {
    if (!detail) return;

    const safeId = (detail.id || "submission").replace(/[^\w\-]+/g, "_");

    const overviewRow = {
      Id: detail.id,
      Type: typeLabel(detail.type),
      Status: statusLabel(detail.status),
      Domain: detail.domain,
      Name: detail.name,
      Email: detail.email,
      UploadedBy: detail.uploadedBy || "",
      CreatedAt: detail.createdAt,
      Message: detail.message || "",
      IsArchived: detail.isArchived ? "Yes" : "No",
      ArchivedAtUtc: detail.archivedAtUtc || "",
      FilesCount: (detail.files || []).length,
      FieldsCount: (detail.fields || []).length,
      RepliesCount: (detail.replies || []).length,
    };

    const wsOverview = XLSX.utils.json_to_sheet([overviewRow]);

    const fieldsRows = (detail.fields || []).map((f) => ({
      SubmissionId: detail.id,
      FieldName: f.name,
      FieldValue: f.value,
    }));
    const wsFields = XLSX.utils.json_to_sheet(
      fieldsRows.length ? fieldsRows : [{ SubmissionId: detail.id, FieldName: "", FieldValue: "" }]
    );

    const filesRows = (detail.files || []).map((f) => ({
      SubmissionId: detail.id,
      FileId: f.id,
      FileName: f.fileName,
      ContentType: f.contentType,
      SizeBytes: f.size,
      SizeMB: Number((f.size / 1024 / 1024).toFixed(2)),
    }));
    const wsFiles = XLSX.utils.json_to_sheet(
      filesRows.length
        ? filesRows
        : [{ SubmissionId: detail.id, FileId: "", FileName: "", ContentType: "", SizeBytes: "", SizeMB: "" }]
    );

    const repliesRows = (detail.replies || []).map((r) => ({
      SubmissionId: detail.id,
      ReplyId: r.id,
      ToEmail: r.toEmail,
      Subject: r.subject,
      SentAt: r.sentAt,
      Body: r.body,
    }));
    const wsReplies = XLSX.utils.json_to_sheet(
      repliesRows.length
        ? repliesRows
        : [{ SubmissionId: detail.id, ReplyId: "", ToEmail: "", Subject: "", SentAt: "", Body: "" }]
    );

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, wsOverview, "Overview");
    XLSX.utils.book_append_sheet(wb, wsFields, "Fields");
    XLSX.utils.book_append_sheet(wb, wsFiles, "Files");
    XLSX.utils.book_append_sheet(wb, wsReplies, "Replies");

    XLSX.writeFile(wb, `submission_${safeId}.xlsx`);
  };

  const acceptDemo = async () => {
    if (!detail || detail.type !== SubmissionTypeId.DemoUpload) return;

    setError(null);

    try {
      const res = await fetch(buildUrl(`/api/submissions/${detail.id}/accept`), {
        method: "PUT",
        headers: { ...authHeaders },
      });

      if (!res.ok) {
        const t = await res.text().catch(() => "");
        setError(`Accept error: ${res.status}${t ? ` — ${t}` : ""}`);
        return;
      }

      patchStatusLocal(detail.id, SubmissionStatusId.Accepted);
      await openSubmission(detail.id);
    } catch (e: any) {
      setError(e?.message || "Accept error");
    }
  };

  const rejectDemo = async () => {
    if (!detail || detail.type !== SubmissionTypeId.DemoUpload) return;

    setError(null);

    try {
      const res = await fetch(buildUrl(`/api/submissions/${detail.id}/reject`), {
        method: "PUT",
        headers: { ...authHeaders, "Content-Type": "application/json" },
        body: JSON.stringify({ body: rejectionBody }),
      });

      if (!res.ok) {
        const t = await res.text().catch(() => "");
        setError(`Reject error: ${res.status}${t ? ` — ${t}` : ""}`);
        return;
      }

      patchStatusLocal(detail.id, SubmissionStatusId.Rejected);
      await openSubmission(detail.id);
    } catch (e: any) {
      setError(e?.message || "Reject error");
    }
  };

  const sendReply = async () => {
    if (!detail) return;

    const toEmail = replyTo.trim();
    if (!toEmail) {
      alert("Recipient email is required.");
      return;
    }

    setError(null);

    try {
      await fetchJson<void>(buildUrl(`/api/submissions/${detail.id}/reply`), {
        method: "POST",
        headers: { ...authHeaders, "Content-Type": "application/json" },
        body: JSON.stringify({
          toEmail,
          subject: replySubject || "(no subject)",
          body: replyBody || "",
        }),
      });

      await openSubmission(detail.id);
    } catch (e: any) {
      setError(e?.message || "Reply error");
    }
  };

  const totalPages = Math.max(1, Math.ceil((data.total || 0) / pageSize));
  const canPrev = page > 1;
  const canNext = page < totalPages;

  if (role === "PortalUser") return null;

  return (
    <AdminShell title="Admin Inbox" active="submissions">
      <div className="admin-root">
        <div className="admin-filters-row" style={{ marginBottom: 10 }}>
          <div className="admin-filters-main" style={{ gap: 10 }}>
            <div className="admin-tabs">
              <button
                className={`admin-tab-btn ${subView === "inbox" ? "is-active" : ""}`}
                onClick={() => setSubView("inbox")}
              >
                Inbox
              </button>

              <button
                className={`admin-tab-btn ${subView === "chats" ? "is-active" : ""}`}
                onClick={() => setSubView("chats")}
              >
                All chats
              </button>

              <button
                className={`admin-tab-btn ${subView === "audit" ? "is-active" : ""}`}
                onClick={() => setSubView("audit")}
              >
                Audit changes
              </button>
            </div>
          </div>
        </div>

       {subView === "audit" ? (
  <AdminSubmissionAudit />
) : subView === "chats" ? (
  <>
    {error ? (
      <div className="admin-alert admin-alert-error">
        <strong>Error:</strong> {error}
      </div>
    ) : null}

    <div className="subm-chat-wrap">
      <div className="subm-chat-thread">
        {allChatsLoading ? (
          <div className="subm-loading">Loading chats…</div>
        ) : allChats.length === 0 ? (
          <div className="subm-empty">No active assigned chats.</div>
        ) : (
          allChats.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setActiveChatId(c.id)}
              style={{
                width: "100%",
                textAlign: "left",
                border: "1px solid #e5e7eb",
                background: activeChatId === c.id ? "#ede9fe" : "#fff",
                borderRadius: 12,
                padding: 12,
                cursor: "pointer",
              }}
            >
              <div style={{ fontWeight: 700, color: "#111827" }}>
                {c.name || c.email || "Conversation"}
              </div>
              <div style={{ fontSize: 12, color: "#6b7280", marginTop: 4 }}>
                {typeLabel(c.type)} · {statusLabel(c.status)}
              </div>
              <div style={{ fontSize: 12, color: "#6b7280", marginTop: 4 }}>
                {c.lastMessage?.body || "No messages yet"}
              </div>
            </button>
          ))
        )}
      </div>

      <div className="subm-chat-side" style={{ maxWidth: "none" }}>
        <div className="subm-card">
          <div className="subm-card-title">Conversation</div>

          <div className="subm-chat-thread" style={{ maxHeight: "52vh" }}>
            {allChatMessagesLoading ? (
              <div className="subm-loading">Loading messages…</div>
            ) : !activeChatId ? (
              <div className="subm-empty">Select a chat.</div>
            ) : allChatMessages.length === 0 ? (
              <div className="subm-empty">No messages.</div>
            ) : (
              allChatMessages.map((m) => {
                const mine = m.senderEmail?.toLowerCase() === myEmail.toLowerCase();

                return (
                  <div
                    key={m.id}
                    className={[
                      "subm-chat-msg",
                      mine ? "subm-chat-msg--mine" : "",
                      m.isInternal ? "subm-chat-msg--internal" : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                  >
                    <div className="subm-chat-meta">
                      {m.senderType} · {m.senderEmail} · {new Date(m.createdAtUtc).toLocaleString()}
                      {m.isInternal ? " · Internal" : ""}
                    </div>
                    <div className="subm-chat-body">{m.body}</div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="subm-card">
          <div className="subm-card-title">Send message</div>

          <div className="subm-chat-composer">
            <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <input
                type="checkbox"
                checked={allChatInternal}
                onChange={(e) => setAllChatInternal(e.target.checked)}
              />
              Internal note
            </label>

            <textarea
              className="admin-input"
              placeholder={
                allChatInternal
                  ? "Write an internal note..."
                  : "Write a reply in this conversation..."
              }
              value={allChatBody}
              onChange={(e) => setAllChatBody(e.target.value)}
            />

            <button
              className="subm-btn subm-btn-soft"
              type="button"
              onClick={sendAllChatMessage}
              disabled={allChatSending || !activeChatId || !allChatBody.trim()}
            >
              {allChatSending ? "Sending..." : "Send"}
            </button>
          </div>
        </div>
      </div>
    </div>
  </>
) : (
          <>
            {error ? (
              <div className="admin-alert admin-alert-error">
                <strong>Error:</strong> {error}
              </div>
            ) : null}

            <div className="admin-filters-row" style={{ marginBottom: 10 }}>
              <div className="admin-filters-main" style={{ gap: 10 }}>
                <div className="admin-table-actions" style={{ display: "flex", gap: 8 }}>
                  <div className="admin-tabs">
                    <button
                      className={`admin-tab-btn ${archiveTab === "active" ? "is-active" : ""}`}
                      onClick={() => {
                        setPage(1);
                        setArchiveTab("active");
                      }}
                    >
                      Active
                    </button>

                    <button
                      className={`admin-tab-btn ${archiveTab === "archived" ? "is-active" : ""}`}
                      onClick={() => {
                        setPage(1);
                        setArchiveTab("archived");
                      }}
                    >
                      Archived
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="admin-filters-row">
              <div className="admin-filters-main">
                <input
                  ref={searchInputRef}
                  className="admin-input admin-input--search"
                  placeholder="Search by name, email, domain or message…"
                  value={search}
                  onChange={(e) => {
                    setPage(1);
                    setSearch(e.target.value);
                  }}
                />

                <select
                  className="admin-select"
                  value={typeFilter === "all" ? "all" : String(typeFilter)}
                  onChange={(e) => {
                    const v = e.target.value;
                    setPage(1);
                    setTypeFilter(v === "all" ? "all" : (Number(v) as SubmissionTypeId));
                  }}
                >
                  <option value="all">All types</option>
                  {SUBMISSION_TYPE_VALUES.map((v) => (
                    <option key={String(v)} value={String(v)}>
                      {typeLabel(v)}
                    </option>
                  ))}
                </select>

                <select
                  className="admin-select"
                  value={statusFilter === "all" ? "all" : String(statusFilter)}
                  onChange={(e) => {
                    const v = e.target.value;
                    setPage(1);
                    setStatusFilter(v === "all" ? "all" : (Number(v) as SubmissionStatusId));
                  }}
                >
                  <option value="all">All statuses</option>
                  {STATUS_FILTER_VALUES.map((v) => (
                    <option key={String(v)} value={String(v)}>
                      {statusLabel(v)}
                    </option>
                  ))}
                </select>

                <select
                  className="admin-select"
                  value={hasFile}
                  onChange={(e) => {
                    setPage(1);
                    setHasFile(e.target.value as FilterHasFile);
                  }}
                >
                  <option value="all">Files: All</option>
                  <option value="yes">Files: Has file</option>
                  <option value="no">Files: No file</option>
                </select>

                <input
                  className="admin-input admin-input--date"
                  type="date"
                  value={fromDate}
                  onChange={(e) => {
                    setPage(1);
                    setFromDate(e.target.value);
                  }}
                />

                <input
                  className="admin-input admin-input--date"
                  type="date"
                  value={toDate}
                  onChange={(e) => {
                    setPage(1);
                    setToDate(e.target.value);
                  }}
                />
              </div>
            </div>

            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Created</th>
                    <th>Type</th>
                    <th>Status</th>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Files</th>
                    <th>Domain</th>
                    <th>Replies</th>
                    <th className="th-actions">Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={9} className="admin-table-empty">
                        Loading…
                      </td>
                    </tr>
                  ) : null}

                  {!loading && visibleItems.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="admin-table-empty">
                        There are no applications.
                      </td>
                    </tr>
                  ) : null}

                  {visibleItems.map((s) => (
                    <tr key={s.id} className="admin-row" onClick={() => openSubmission(s.id)}>
                      <td>{new Date(s.createdAt).toLocaleString()}</td>
                      <td>
                        <span className="subm-type">
                          {typeLabel(s.type)}
                          {showUnderReview(s.type, s.status) ? (
                            <span className="subm-tag subm-tag--review">Under review</span>
                          ) : null}
                        </span>
                      </td>
                      <td>
                        <span className={`admin-badge ${statusBadgeClass(s.status)}`}>
                          {statusLabel(s.status)}
                        </span>
                      </td>
                      <td>{s.name}</td>
                      <td>{s.email}</td>
                      <td>{(s.files || []).length}</td>
                      <td>{s.domain}</td>
                      <td>{s.repliesCount}</td>
                      <td>
                        <div className="admin-table-actions" onClick={(e) => e.stopPropagation()}>
                          <select
                            className="admin-select admin-select--compact"
                            value={String(s.status)}
                            disabled={savingStatus && busyRow === s.id}
                            onChange={(e) => updateStatus(s.id, Number(e.target.value) as SubmissionStatusId)}
                          >
                            {STATUS_FILTER_VALUES.map((st) => (
                              <option key={String(st)} value={String(st)}>
                                {statusLabel(st)}
                              </option>
                            ))}
                          </select>

                          {archiveTab === "archived" ? (
                            <button
                              className="admin-btn admin-btn-secondary admin-btn--xs"
                              disabled={busyRow === s.id}
                              onClick={(e) => {
                                e.stopPropagation();
                                unarchiveSubmission(s.id);
                              }}
                              title="Unarchive"
                            >
                              <i className="fa fa-undo" aria-hidden="true"></i>
                            </button>
                          ) : (
                            <button
                              className="admin-btn admin-btn-secondary admin-btn--xs"
                              disabled={busyRow === s.id}
                              onClick={(e) => {
                                e.stopPropagation();
                                archiveSubmission(s.id);
                              }}
                              title="Archive"
                            >
                              <i className="fa fa-archive" aria-hidden="true"></i>
                            </button>
                          )}

                          <button
                            className="admin-btn admin-btn-danger admin-btn--xs"
                            disabled={savingStatus && busyRow === s.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteSubmissionById(s.id);
                            }}
                          >
                            <i className="fa fa-trash" aria-hidden="true"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="admin-footer">
                <div className="admin-footer-left">
                  <span>
                    Page {page} of {totalPages} — {data.total} total
                  </span>
                </div>

                <div className="admin-footer-right">
                  <button
                    className="admin-btn admin-btn-secondary"
                    disabled={!canPrev}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                  >
                    Prev
                  </button>

                  <button
                    className="admin-btn admin-btn-secondary"
                    disabled={!canNext}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>

            {openId ? (
              <div
                className="subm-modal-overlay"
                onMouseDown={(e) => (e.target === e.currentTarget ? closeModal() : null)}
              >
                <div className="subm-modal" onMouseDown={(e) => e.stopPropagation()}>
                  <div className="subm-modal-top">
                    <div className="subm-modal-title">
                      <div className="subm-h">Submission</div>
                      <div className="subm-sub">{openId}</div>
                    </div>

                    <div className="subm-modal-actions">
                      <div className="subm-tabs">
                        <button
                          className={`subm-tab ${detailTab === "overview" ? "is-active" : ""}`}
                          onClick={() => setDetailTab("overview")}
                          type="button"
                        >
                          Overview
                        </button>

                        <button
                          className={`subm-tab ${detailTab === "chat" ? "is-active" : ""}`}
                          onClick={() => setDetailTab("chat")}
                          type="button"
                        >
                          Chat
                        </button>

                        <button
                          className={`subm-tab ${detailTab === "files" ? "is-active" : ""}`}
                          onClick={() => setDetailTab("files")}
                          type="button"
                        >
                          Files
                        </button>
                      </div>

                      <button className="subm-btn subm-btn-soft" onClick={closeModal}>
                        Close
                      </button>
                    </div>
                  </div>

                  {detailLoading ? (
                    <div className="subm-body">
                      <div className="subm-loading">Loading…</div>
                    </div>
                  ) : detail ? (
                    <div className="subm-body">
                      {detailTab === "overview" ? (
                        <div className="subm-stack">
                          <div className="subm-card">
                            <div className="subm-card-title">Overview</div>

                            <div className="subm-overview-list">
                              <div className="subm-overview-row">
                                <span className="subm-overview-label">Type</span>
                                <span className="subm-overview-value">{typeLabel(detail.type)}</span>
                              </div>

                              <div className="subm-overview-row">
                                <span className="subm-overview-label">Status</span>
                                <span className={`admin-badge ${statusBadgeClass(detail.status)}`}>
                                  {statusLabel(detail.status)}
                                </span>
                              </div>

                              <div className="subm-overview-row">
                                <span className="subm-overview-label">Name</span>
                                <span className="subm-overview-value">{detail.name || "-"}</span>
                              </div>

                              <div className="subm-overview-row">
                                <span className="subm-overview-label">Email</span>
                                <span className="subm-overview-value">{detail.email || "-"}</span>
                              </div>

                              <div className="subm-overview-row">
                                <span className="subm-overview-label">Domain</span>
                                <span className="subm-overview-value">{detail.domain || "-"}</span>
                              </div>

                              <div className="subm-overview-row">
                                <span className="subm-overview-label">Uploaded by</span>
                                <span className="subm-overview-value">{detail.uploadedBy || "-"}</span>
                              </div>

                              <div className="subm-overview-row">
                                <span className="subm-overview-label">Created</span>
                                <span className="subm-overview-value">
                                  {new Date(detail.createdAt).toLocaleString()}
                                </span>
                              </div>

                              <div className="subm-overview-row">
                                <span className="subm-overview-label">Archived</span>
                                <span className="subm-overview-value">{detail.isArchived ? "Yes" : "No"}</span>
                              </div>
                            </div>

                            {detail.message ? (
                              <div className="subm-section-block">
                                <div className="subm-section-title">Message</div>
                                <div className="subm-message-pretty">{detail.message}</div>
                              </div>
                            ) : null}
                          </div>

                          <div className="subm-card">
                            <div className="subm-card-title">Fields</div>

                            {(detail.fields || []).length === 0 ? (
                              <div className="subm-empty">No fields.</div>
                            ) : (
                              <div className="subm-fields-list">
                                {(detail.fields || []).map((f, idx) => (
                                  <div key={`${f.name}-${idx}`} className="subm-field-row">
                                    <div className="subm-field-name">{f.name}</div>
                                    <div className="subm-field-value">{f.value}</div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>

                          <div className="subm-card">
                            <div className="subm-card-title">Actions</div>

                            <div className="subm-actions-pretty">
                              <div className="subm-action-group">
                                <label className="subm-input-label">Status</label>
                                <select
                                  className="admin-select"
                                  value={String(detail.status)}
                                  onChange={(e) =>
                                    updateStatus(detail.id, Number(e.target.value) as SubmissionStatusId)
                                  }
                                >
                                  {STATUS_FILTER_VALUES.map((st) => (
                                    <option key={String(st)} value={String(st)}>
                                      {statusLabel(st)}
                                    </option>
                                  ))}
                                </select>
                              </div>

                              <div className="subm-action-buttons">
                                {detail.isArchived ? (
                                  <button className="subm-btn subm-btn-soft" onClick={() => unarchiveSubmission(detail.id)}>
                                    Unarchive
                                  </button>
                                ) : (
                                  <button className="subm-btn subm-btn-soft" onClick={() => archiveSubmission(detail.id)}>
                                    Archive
                                  </button>
                                )}

                                <button className="subm-btn subm-btn-soft" onClick={exportOneExcel}>
                                  Export xlsx
                                </button>

                                {detail.type === SubmissionTypeId.DemoUpload ? (
                                  <>
                                    <button className="subm-btn subm-btn-accept" onClick={acceptDemo}>
                                      Accept
                                    </button>
                                    <button className="subm-btn subm-btn-danger" onClick={rejectDemo}>
                                      Reject
                                    </button>
                                  </>
                                ) : null}
                              </div>
                            </div>
                          </div>

                          <div className="subm-card">
                            <div className="subm-card-title">Assign portal user</div>

                            <div className="subm-actions-pretty">
                              <div className="subm-action-group">
                                <label className="subm-input-label">Portal user</label>

                                <select
                                  className="admin-select"
                                  value={selectedPortalUserId}
                                  onChange={(e) => {
                                    setSelectedPortalUserId(e.target.value);
                                    setAssignSuccessMessage("");
                                  }}
                                  disabled={portalUsersLoading || assigningPortalUser}
                                >
                                  <option value="">Select portal user...</option>
                                  {portalUsers.map((u) => (
                                    <option key={u.id} value={u.id}>
                                      {u.email}
                                    </option>
                                  ))}
                                </select>
                              </div>

                              {assignSuccessMessage ? (
                                <div className="subm-assign-success">{assignSuccessMessage}</div>
                              ) : null}

                              <div className="subm-action-buttons">
                                <button
                                  className="subm-btn subm-btn-soft"
                                  onClick={assignPortalUserToChat}
                                  disabled={
                                    portalUsersLoading ||
                                    assigningPortalUser ||
                                    !selectedPortalUserId ||
                                    assignedPortalUserIds.includes(selectedPortalUserId)
                                  }
                                >
                                  {assigningPortalUser
                                    ? "Assigning..."
                                    : assignedPortalUserIds.includes(selectedPortalUserId)
                                    ? "Already assigned"
                                    : "Assign to chat"}
                                </button>
                              </div>
                            </div>
                          </div>

                          <div className="subm-card">
                            <div className="subm-card-title">Reply</div>

                            <div className="subm-reply-pretty">
                              <div className="subm-reply-grid">
                                <div className="subm-input-group">
                                  <label className="subm-input-label">To</label>
                                  <input
                                    className="admin-input"
                                    placeholder="Recipient email"
                                    value={replyTo}
                                    onChange={(e) => setReplyTo(e.target.value)}
                                  />
                                </div>

                                <div className="subm-input-group">
                                  <label className="subm-input-label">Subject</label>
                                  <input
                                    className="admin-input"
                                    placeholder="Email subject"
                                    value={replySubject}
                                    onChange={(e) => setReplySubject(e.target.value)}
                                  />
                                </div>
                              </div>

                              <div className="subm-input-group">
                                <label className="subm-input-label">Message</label>
                                <textarea
                                  className="admin-input subm-reply-textarea"
                                  placeholder="Write your reply..."
                                  value={replyBody}
                                  onChange={(e) => setReplyBody(e.target.value)}
                                />
                              </div>

                              <div className="subm-reply-footer">
                                <button className="subm-btn subm-btn-soft" onClick={sendReply}>
                                  Send reply
                                </button>
                              </div>
                            </div>
                          </div>

                          {detail.type === SubmissionTypeId.DemoUpload ? (
                            <div className="subm-card">
                              <div className="subm-card-title">Demo rejection template</div>
                              <textarea
                                className="admin-input subm-reply-textarea"
                                value={rejectionBody}
                                onChange={(e) => setRejectionBody(e.target.value)}
                              />
                            </div>
                          ) : null}

                          <div className="subm-card">
                            <div className="subm-card-title">Reply history</div>

                            {(detail.replies || []).length === 0 ? (
                              <div className="subm-empty">No replies.</div>
                            ) : (
                              <div className="subm-history-list">
                                {detail.replies.map((r) => (
                                  <div key={r.id} className="subm-history-item">
                                    <div className="subm-history-head">
                                      <div className="subm-history-subject">{r.subject}</div>
                                      <div className="subm-history-date">
                                        {new Date(r.sentAt).toLocaleString()}
                                      </div>
                                    </div>

                                    <div className="subm-history-to">To: {r.toEmail}</div>
                                    <div className="subm-history-body">{r.body}</div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      ) : null}

                      {detailTab === "chat" ? (
                        <div className="subm-chat-wrap">
                          <div className="subm-chat-thread">
                            {chatLoading ? (
                              <div className="subm-loading">Loading chat…</div>
                            ) : chatMessages.length === 0 ? (
                              <div className="subm-empty">No chat messages yet.</div>
                            ) : (
                              chatMessages.map((m) => {
                                const mine = m.senderEmail?.toLowerCase() === myEmail.toLowerCase();

                                return (
                                  <div
                                    key={m.id}
                                    className={[
                                      "subm-chat-msg",
                                      mine ? "subm-chat-msg--mine" : "",
                                      m.isInternal ? "subm-chat-msg--internal" : "",
                                    ]
                                      .filter(Boolean)
                                      .join(" ")}
                                  >
                                    <div className="subm-chat-meta">
                                      {m.senderType} · {m.senderEmail} · {new Date(m.createdAtUtc).toLocaleString()}
                                      {m.isInternal ? " · Internal" : ""}
                                    </div>
                                    <div className="subm-chat-body">{m.body}</div>
                                  </div>
                                );
                              })
                            )}
                          </div>

                          <div className="subm-chat-side">
                            <div className="subm-card">
                              <div className="subm-card-title">Send message</div>

                              <div className="subm-chat-composer">
                                <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
                                  <input
                                    type="checkbox"
                                    checked={chatInternal}
                                    onChange={(e) => setChatInternal(e.target.checked)}
                                  />
                                  Internal note
                                </label>

                                <textarea
                                  className="admin-input"
                                  placeholder={
                                    chatInternal
                                      ? "Write an internal note..."
                                      : "Write a message to this contact..."
                                  }
                                  value={chatBody}
                                  onChange={(e) => setChatBody(e.target.value)}
                                />

                                <button
                                  className="subm-btn subm-btn-soft"
                                  type="button"
                                  onClick={sendChatMessage}
                                  disabled={chatSending || !chatBody.trim()}
                                >
                                  {chatSending ? "Sending..." : "Send"}
                                </button>
                              </div>
                            </div>

                            <div className="subm-card">
                              <div className="subm-card-title">Contact</div>
                              <div><strong>Name:</strong> {detail.name || "-"}</div>
                              <div><strong>Email:</strong> {detail.email || "-"}</div>
                              <div><strong>Type:</strong> {typeLabel(detail.type)}</div>
                              <div><strong>Status:</strong> {statusLabel(detail.status)}</div>
                            </div>
                          </div>
                        </div>
                      ) : null}

                      {detailTab === "files" ? (
                        <div className="subm-grid">
                          <div className="subm-card">
                            <div className="subm-card-title">Files</div>
                            {(detail.files || []).length === 0 ? (
                              <div className="subm-empty">No files.</div>
                            ) : (
                              <div className="subm-files-grid">
                                <div className="subm-files-list">
                                  {(detail.files || []).map((f) => (
                                    <div key={f.id} className="subm-file-row">
                                      <div className="subm-file-meta">
                                        <div className="subm-file-name">{f.fileName}</div>
                                        <div className="subm-file-size">
                                          {f.contentType} · {(f.size / 1024 / 1024).toFixed(2)} MB
                                        </div>
                                      </div>

                                      <div className="subm-file-actions">
                                        <button className="subm-btn subm-btn-soft" onClick={() => previewInline(f)}>
                                          Preview
                                        </button>
                                        <button className="subm-btn subm-btn-soft" onClick={() => downloadFile(f)}>
                                          Download
                                        </button>
                                      </div>
                                    </div>
                                  ))}
                                </div>

                                <div className="subm-preview-box">
                                  {activePreviewFileId && previewUrls[activePreviewFileId] ? (
                                    (() => {
                                      const f = (detail.files || []).find((x) => x.id === activePreviewFileId);
                                      const url = previewUrls[activePreviewFileId];
                                      const ct = (f?.contentType || "").toLowerCase();

                                      if (ct.startsWith("image/")) {
                                        return (
                                          <img
                                            className="subm-preview-img"
                                            src={url}
                                            alt={f?.fileName || "preview"}
                                          />
                                        );
                                      }

                                      if (ct === "application/pdf") {
                                        return (
                                          <iframe
                                            className="subm-preview-iframe"
                                            src={url}
                                            title={f?.fileName || "preview"}
                                          />
                                        );
                                      }

                                      if (ct.startsWith("audio/")) {
                                        return <audio className="subm-preview-audio" controls src={url} />;
                                      }

                                      if (ct.startsWith("video/")) {
                                        return <video className="subm-preview-video" controls src={url} />;
                                      }

                                      return (
                                        <div className="subm-preview-fallback">
                                          <div className="subm-file-name">No inline preview</div>
                                          <div className="subm-file-meta">{f?.contentType || "unknown"}</div>
                                        </div>
                                      );
                                    })()
                                  ) : (
                                    <div className="subm-preview-empty">Select a file to preview.</div>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              </div>
            ) : null}
          </>
        )}
      </div>
    </AdminShell>
  );
}

export default AdminSubmissions;