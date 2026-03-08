import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
// src/components/PcrContactForm.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import BottomNav from "../components/BottomNav";
import ReleasesFooterBar from "../components/ReleasesFooterBar";
import { API_BASE } from "../config/apiBase";
import "../style/PcrContactForm.css";
function buildUrl(path) {
    const base = String(API_BASE || "").replace(/\/+$/, "");
    const p = String(path || "").replace(/^\/+/, "");
    return base ? `${base}/${p}` : `/${p}`;
}
function looksLikeFullName(v) {
    const parts = (v || "")
        .trim()
        .replace(/\s+/g, " ")
        .split(" ")
        .filter(Boolean);
    return parts.length >= 2;
}
function isAllowedDemoUpload(file) {
    const n = (file.name || "").toLowerCase();
    const extOk = n.endsWith(".png") || n.endsWith(".jpg") || n.endsWith(".jpeg") || n.endsWith(".mp3") || n.endsWith(".mp4");
    const t = (file.type || "").toLowerCase();
    const typeOk = t === "image/png" || t === "image/jpeg" || t === "audio/mpeg" || t === "audio/mp3" || t === "video/mp4";
    if (n.endsWith(".wav") || t.includes("wav") || t === "audio/wav" || t === "audio/x-wav")
        return false;
    return extOk || typeOk;
}
const DRAFT_KEY = "pcr_contact_form_draft_v2";
function safeParseDraft(raw) {
    if (!raw)
        return null;
    try {
        const d = JSON.parse(raw);
        if (!d || typeof d !== "object")
            return null;
        return {
            type: (typeof d.type === "string" ? d.type : ""),
            name: typeof d.name === "string" ? d.name : "",
            email: typeof d.email === "string" ? d.email : "",
            message: typeof d.message === "string" ? d.message : "",
            privacyAccepted: typeof d.privacyAccepted === "boolean" ? d.privacyAccepted : false,
            fields: (d.fields && typeof d.fields === "object" ? d.fields : {}),
        };
    }
    catch {
        return null;
    }
}
const DEFAULT_FIELDS = {
    ig: "",
    spotifyLinks: "",
    playlists: "",
    trackTitle: "",
    spotifyTrackUrl: "",
};
const DISCLAIMER = "We carefully review all submissions and evaluate if they fit our network or not. Due to the high amount of submissions we can’t guarantee that all submissions will be answered. If accepted we will get back to you shortly.";
const PCR_SITE_KEY = "purple-crunch-records";
const CMS_KEY_PLAYLISTS = "pcr.playlists.items";
function safeJsonParse(raw, fallback) {
    try {
        if (!raw)
            return fallback;
        if (typeof raw === "string")
            return JSON.parse(raw);
        return raw;
    }
    catch {
        return fallback;
    }
}
function normalizePublicUrl(u) {
    const s = String(u || "").trim();
    if (!s)
        return "";
    if (/^https?:\/\//i.test(s))
        return s;
    const withSlash = s.startsWith("/") ? s : `/${s}`;
    return buildUrl(withSlash);
}
function sanitizePlaylists(payload) {
    const items = Array.isArray(payload?.items) ? payload.items : [];
    return items
        .map((x) => ({
        id: String(x?.id || "").trim(),
        title: String(x?.title ?? "").trim(),
        url: String(x?.url ?? "").trim(),
        coverSrc: normalizePublicUrl(String(x?.coverSrc ?? "")),
    }))
        .filter((x) => x.id && x.title); // show all with id+title (don’t hide “missing url” ones)
}
function labelFor(k) {
    const m = {
        ig: "Instagram",
        spotifyLinks: "Song(s) Spotify links",
        playlists: "Which playlist(s)",
        trackTitle: "Track title",
        spotifyTrackUrl: "Spotify track link",
    };
    return m[k] || k;
}
function readTypeFromQuery(search) {
    const p = new URLSearchParams(search || "");
    const t = (p.get("type") || "").trim();
    if (t === "GeneralContactInquiry" || t === "DemoUpload" || t === "PlaylistPitch")
        return t;
    return "";
}
export default function PcrContactForm() {
    const location = useLocation();
    const railRef = useRef(null);
    const initialDraft = useMemo(() => safeParseDraft(sessionStorage.getItem(DRAFT_KEY)), []);
    const initialTypeFromUrl = useMemo(() => readTypeFromQuery(location.search), [location.search]);
    const [type, setType] = useState(initialTypeFromUrl || initialDraft?.type || "");
    const [name, setName] = useState(initialDraft?.name ?? "");
    const [email, setEmail] = useState(initialDraft?.email ?? "");
    const [message, setMessage] = useState(initialDraft?.message ?? "");
    const [privacyAccepted, setPrivacyAccepted] = useState(initialDraft?.privacyAccepted ?? false);
    const [fields, setFields] = useState({ ...DEFAULT_FIELDS, ...(initialDraft?.fields ?? {}) });
    const [playlistSelected, setPlaylistSelected] = useState(() => {
        const raw = (initialDraft?.fields?.playlists ?? "").trim();
        if (!raw)
            return [];
        return raw
            .split(",")
            .map((x) => x.trim())
            .filter(Boolean);
    });
    const [files, setFiles] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [okId, setOkId] = useState(null);
    const [err, setErr] = useState(null);
    const [cmsPlaylists, setCmsPlaylists] = useState([]);
    const [cmsPlaylistsLoading, setCmsPlaylistsLoading] = useState(true);
    const isGeneral = type === "GeneralContactInquiry";
    const isDemo = type === "DemoUpload";
    const isPlaylist = type === "PlaylistPitch";
    const totalBytes = useMemo(() => files.reduce((s, f) => s + (f?.size || 0), 0), [files]);
    const setField = (key, value) => setFields((p) => ({ ...p, [key]: value }));
    const onFilesChange = (list) => {
        if (!list)
            return setFiles([]);
        setFiles(Array.from(list));
    };
    useEffect(() => {
        let alive = true;
        setCmsPlaylistsLoading(true);
        (async () => {
            try {
                const url = buildUrl(`/api/cms?siteKey=${encodeURIComponent(PCR_SITE_KEY)}&key=${encodeURIComponent(CMS_KEY_PLAYLISTS)}&ts=${Date.now()}`);
                const res = await fetch(url);
                if (res.status === 404) {
                    if (!alive)
                        return;
                    setCmsPlaylists([]);
                    return;
                }
                const text = await res.text().catch(() => "");
                if (!res.ok)
                    throw new Error(text || `HTTP ${res.status}`);
                const parsedEntry = JSON.parse(text);
                const payload = safeJsonParse(parsedEntry?.json, { items: [] });
                const cleaned = sanitizePlaylists(payload);
                if (!alive)
                    return;
                setCmsPlaylists(cleaned);
                // quick debug so you see count
                // eslint-disable-next-line no-console
                console.log("[PCR Contact] playlists from CMS:", cleaned.length, cleaned);
            }
            catch (e) {
                if (!alive)
                    return;
                setCmsPlaylists([]);
                // eslint-disable-next-line no-console
                console.log("[PCR Contact] playlists load failed:", e?.message || e);
            }
            finally {
                if (!alive)
                    return;
                setCmsPlaylistsLoading(false);
            }
        })();
        return () => {
            alive = false;
        };
    }, []);
    useEffect(() => {
        const t = readTypeFromQuery(location.search);
        if (!t)
            return;
        setType(t);
        setFiles([]);
        setErr(null);
        setOkId(null);
    }, [location.search]);
    useEffect(() => {
        setField("playlists", playlistSelected.join(", "));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [playlistSelected.join("|")]);
    useEffect(() => {
        if (isSubmitting)
            return;
        try {
            const payload = { type, name, email, message, privacyAccepted, fields };
            sessionStorage.setItem(DRAFT_KEY, JSON.stringify(payload));
        }
        catch {
            //
        }
    }, [type, name, email, message, privacyAccepted, fields, isSubmitting]);
    const clearDraft = () => {
        try {
            sessionStorage.removeItem(DRAFT_KEY);
        }
        catch {
            //
        }
    };
    const resetAll = () => {
        setType("");
        setName("");
        setEmail("");
        setMessage("");
        setPrivacyAccepted(false);
        setFields({ ...DEFAULT_FIELDS });
        setPlaylistSelected([]);
        setFiles([]);
    };
    const validate = () => {
        if (!type)
            return "Submission Type is required.";
        if (!privacyAccepted)
            return "Privacy policy must be accepted.";
        if (!name.trim() || !email.trim())
            return "Name and Email are required.";
        if (!looksLikeFullName(name.trim()))
            return "In Name box enter First name Last name.";
        if (isGeneral) {
            if (!message.trim())
                return "Message is required.";
            return null;
        }
        if (isPlaylist) {
            if (!fields.ig.trim())
                return `${labelFor("ig")} is required.`;
            if (!fields.spotifyLinks.trim())
                return `${labelFor("spotifyLinks")} is required.`;
            if (!playlistSelected.length)
                return "Please choose at least one playlist.";
            return null;
        }
        if (isDemo) {
            if (totalBytes > 20 * 1024 * 1024)
                return "Total upload size must be 20MB or less.";
            if (!files || files.length === 0)
                return "Please upload at least one file (mp3/mp4 or images).";
            if (files.length > 5)
                return "Please upload at most 5 files.";
            if (files.some((f) => !isAllowedDemoUpload(f)))
                return "Allowed: mp3, mp4, png, jpg, jpeg. WAV is not allowed.";
            return null;
        }
        return null;
    };
    const buildFieldsJson = () => {
        const obj = {};
        const put = (k, v) => {
            const val = (v ?? "").trim();
            if (val)
                obj[k] = val;
        };
        if (isPlaylist) {
            put("ig", fields.ig);
            put("spotifyLinks", fields.spotifyLinks);
            put("playlists", playlistSelected.join(", "));
        }
        if (isDemo) {
            put("trackTitle", fields.trackTitle);
            put("spotifyTrackUrl", fields.spotifyTrackUrl);
        }
        return JSON.stringify(obj);
    };
    const onSubmit = async (e) => {
        e.preventDefault();
        setErr(null);
        setOkId(null);
        const v = validate();
        if (v)
            return setErr(v);
        setIsSubmitting(true);
        try {
            const fd = new FormData();
            fd.append("Type", String(type));
            fd.append("Domain", window.location.hostname || "");
            fd.append("PrivacyAccepted", privacyAccepted ? "true" : "false");
            fd.append("Name", name.trim());
            fd.append("Email", email.trim());
            if (message.trim())
                fd.append("Message", message.trim());
            const fieldsJson = buildFieldsJson();
            if (fieldsJson && fieldsJson !== "{}")
                fd.append("FieldsJson", fieldsJson);
            if (isDemo) {
                for (const f of files)
                    fd.append("Files", f);
            }
            const res = await fetch(buildUrl("/api/submissions/form"), {
                method: "POST",
                body: fd,
            });
            if (!res.ok) {
                const text = await res.text().catch(() => "");
                throw new Error(text || "Submit failed.");
            }
            const data = await res.json().catch(() => null);
            setOkId(data?.id ?? data?.Id ?? "submitted");
            clearDraft();
            resetAll();
        }
        catch (ex) {
            setErr(ex?.message || "Submit failed.");
        }
        finally {
            setIsSubmitting(false);
        }
    };
    const togglePlaylist = (id) => {
        setPlaylistSelected((prev) => {
            const has = prev.includes(id);
            if (has)
                return prev.filter((x) => x !== id);
            return [...prev, id];
        });
    };
    const scrollRail = (dir) => {
        const el = railRef.current;
        if (!el)
            return;
        const card = el.querySelector(".pcr-playlistCard");
        const step = (card?.offsetWidth ?? 320) + 14;
        el.scrollBy({ left: dir === "left" ? -step : step, behavior: "smooth" });
    };
    return (_jsxs("main", { className: "submitform-page", children: [_jsx(BottomNav, {}), _jsxs("section", { className: "submitform-wrap", children: [_jsx("header", { className: "submitform-head", children: _jsxs("h1", { className: "submitform-title", children: ["CONTACT ", _jsx("span", { className: "submitform-titleGrad", children: "US" })] }) }), _jsxs("form", { className: "submitform-card", onSubmit: onSubmit, children: [_jsxs("div", { className: "submitform-grid", children: [_jsxs("label", { className: "submitform-field", children: [_jsx("span", { className: "submitform-label", children: "SUBMISSION TYPE*" }), _jsx("div", { className: "submitform-select", children: _jsxs("select", { className: "submitform-control", value: type, onChange: (ev) => {
                                                        const next = ev.target.value;
                                                        setType(next);
                                                        setFiles([]);
                                                        setErr(null);
                                                        setOkId(null);
                                                    }, children: [_jsx("option", { value: "", children: "Select\u2026" }), _jsx("option", { value: "GeneralContactInquiry", children: "General contact" }), _jsx("option", { value: "DemoUpload", children: "Demo submission" }), _jsx("option", { value: "PlaylistPitch", children: "Playlisting" })] }) })] }), _jsx("div", { className: "submitform-divider" }), _jsxs("label", { className: "submitform-field", children: [_jsx("span", { className: "submitform-label", children: "NAME*" }), _jsx("input", { className: "submitform-control", value: name, onChange: (ev) => setName(ev.target.value), placeholder: "First name Last name", autoComplete: "name" })] }), _jsxs("label", { className: "submitform-field", children: [_jsx("span", { className: "submitform-label", children: "EMAIL*" }), _jsx("input", { className: "submitform-control", type: "email", value: email, onChange: (ev) => setEmail(ev.target.value), placeholder: "name@email.com", autoComplete: "email" })] }), isPlaylist && (_jsxs(_Fragment, { children: [_jsxs("label", { className: "submitform-field", children: [_jsx("span", { className: "submitform-label", children: "INSTAGRAM*" }), _jsx("input", { className: "submitform-control", value: fields.ig, onChange: (ev) => setField("ig", ev.target.value), placeholder: "@yourhandle" })] }), _jsxs("label", { className: "submitform-field submitform-span2", children: [_jsx("span", { className: "submitform-label", children: "SONG(S) FROM SPOTIFY LINKS*" }), _jsx("textarea", { className: "submitform-control submitform-textarea", rows: 4, value: fields.spotifyLinks, onChange: (ev) => setField("spotifyLinks", ev.target.value), placeholder: "Paste Spotify track links (one per line)" })] }), _jsxs("div", { className: "submitform-field submitform-span2", children: [_jsx("div", { className: "submitform-label", children: "CHOOSE PLAYLIST(S)*" }), _jsxs("div", { className: "pcr-railWrap", children: [_jsx("button", { type: "button", className: "pcr-railBtn pcr-railBtn--left", onClick: () => scrollRail("left"), "aria-label": "Scroll playlists left", disabled: cmsPlaylistsLoading || cmsPlaylists.length === 0, children: "\u2039" }), _jsxs("div", { ref: railRef, className: "pcr-playlistsRail", role: "list", "aria-label": "Playlists", children: [!cmsPlaylistsLoading && cmsPlaylists.length === 0 ? (_jsx("div", { className: "submitform-help", style: { padding: 10 }, children: "No playlists available right now." })) : null, cmsPlaylists.map((pl) => {
                                                                        const selected = playlistSelected.includes(pl.id);
                                                                        const href = (pl.url || "").trim();
                                                                        const canOpen = /^https?:\/\//i.test(href);
                                                                        return (_jsxs("button", { type: "button", className: "pcr-playlistCard " + (selected ? "is-selected" : ""), onClick: () => togglePlaylist(pl.id), "aria-pressed": selected, title: pl.title, children: [_jsxs("div", { className: "pcr-playlistCover", children: [pl.coverSrc ? _jsx("img", { src: pl.coverSrc, alt: pl.title, draggable: false }) : null, _jsx("div", { className: "pcr-playlistOverlay" }), _jsx("div", { className: "pcr-playlistTick " + (selected ? "on" : ""), children: "\u2713" })] }), _jsxs("div", { className: "pcr-playlistMeta", children: [_jsx("div", { className: "pcr-playlistTitle", children: pl.title }), _jsx("div", { className: "pcr-playlistSub", children: selected ? "Selected" : "Click to select" }), canOpen ? (_jsx("a", { className: "pcr-playlistLink", href: href, target: "_blank", rel: "noreferrer", onClick: (e) => e.stopPropagation(), children: "Open on Spotify" })) : (_jsx("span", { className: "pcr-playlistLink", onClick: (e) => e.stopPropagation(), children: "No link" }))] })] }, pl.id));
                                                                    })] }), _jsx("button", { type: "button", className: "pcr-railBtn pcr-railBtn--right", onClick: () => scrollRail("right"), "aria-label": "Scroll playlists right", disabled: cmsPlaylistsLoading || cmsPlaylists.length === 0, children: "\u203A" })] }), _jsx("div", { className: "submitform-help", children: "You can select multiple playlists. Use arrows or horizontal scroll." })] })] })), isDemo && (_jsxs(_Fragment, { children: [_jsxs("label", { className: "submitform-field", children: [_jsx("span", { className: "submitform-label", children: "TRACK TITLE" }), _jsx("input", { className: "submitform-control", value: fields.trackTitle, onChange: (ev) => setField("trackTitle", ev.target.value), placeholder: "Track title" })] }), _jsxs("label", { className: "submitform-field", children: [_jsx("span", { className: "submitform-label", children: "SPOTIFY TRACK LINK" }), _jsx("input", { className: "submitform-control", value: fields.spotifyTrackUrl, onChange: (ev) => setField("spotifyTrackUrl", ev.target.value), placeholder: "https://open.spotify.com/track/..." })] }), _jsxs("label", { className: "submitform-field submitform-span2", children: [_jsx("span", { className: "submitform-label", children: "UPLOAD (MP3/MP4/IMAGES)*" }), _jsx("input", { className: "submitform-control", type: "file", multiple: true, accept: "audio/mpeg,video/mp4,image/png,image/jpeg,.mp3,.mp4,.png,.jpg,.jpeg", onChange: (ev) => onFilesChange(ev.target.files) }), _jsx("div", { className: "submitform-help", children: "Allowed: mp3, mp4, png, jpg, jpeg. Total max 20MB. WAV is blocked." }), files.length > 0 && (_jsxs("div", { className: "submitform-filesList", children: [files.map((f) => (_jsxs("div", { className: "submitform-fileRow", children: [_jsx("span", { className: "submitform-fileName", children: f.name }), _jsxs("span", { className: "submitform-fileMeta", children: [Math.round(f.size / 1024), " KB"] })] }, f.name + f.size))), _jsxs("div", { className: "submitform-fileTotal", children: ["Total: ", Math.round(totalBytes / 1024), " KB"] })] }))] })] })), _jsxs("label", { className: "submitform-field submitform-span2", children: [_jsxs("span", { className: "submitform-label", children: ["MESSAGE", isGeneral ? "*" : ""] }), _jsx("textarea", { className: "submitform-control submitform-textarea", rows: 7, value: message, onChange: (ev) => setMessage(ev.target.value), placeholder: "Details, references, deadlines..." })] }), _jsx("label", { className: "submitform-field submitform-span2 submitform-privacy", children: _jsxs("span", { children: [_jsx("input", { type: "checkbox", checked: privacyAccepted, onChange: (ev) => setPrivacyAccepted(ev.target.checked) }), "\u00A0\u00A0I agree to the", " ", _jsx(Link, { className: "submitform-link", to: "/privacy", children: "Privacy Policy" }), " ", "and", " ", _jsx(Link, { className: "submitform-link", to: "/cookies", children: "Cookie Policy" }), "."] }) }), _jsx("div", { className: "submitform-field submitform-span2", children: _jsx("div", { className: "submitform-note--disclaimer", children: DISCLAIMER }) })] }), err && _jsx("div", { className: "submitform-alert submitform-alert--err", children: err }), okId && (_jsxs("div", { className: "submitform-alert submitform-alert--ok", children: ["Submitted successfully. Reference ID: ", _jsx("span", { className: "submitform-mono", children: okId })] })), _jsx("div", { className: "submitform-foot", children: _jsx("button", { className: "submitform-btn", type: "submit", disabled: isSubmitting, children: isSubmitting ? "SENDING..." : "SEND" }) })] })] }), _jsx(ReleasesFooterBar, {})] }));
}
