import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
// src/pages/ArtistInformationSubmission.tsx
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
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
    const parts = (v || "").trim().replace(/\s+/g, " ").split(" ").filter(Boolean);
    return parts.length >= 2;
}
function calcAgeFromISO(dobIso) {
    const s = (dobIso || "").trim();
    if (!s)
        return null;
    const d = new Date(s);
    if (Number.isNaN(d.getTime()))
        return null;
    const today = new Date();
    let age = today.getFullYear() - d.getFullYear();
    const m = today.getMonth() - d.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < d.getDate()))
        age--;
    return age;
}
function labelFor(k) {
    const m = {
        fullLegalName: "Full legal name",
        dateOfBirthArtist: "Date of birth",
        streetNumber: "Street & Number",
        zipCode: "ZIP Code",
        city: "City",
        country: "Country",
        instagram: "Instagram",
        businessEmail: "Business email",
        spotifyUrl: "Spotify URL",
        appleArtistId: "Apple Artist ID",
        downtownEmail: "Downtown Music account email",
        pro: "PRO",
        ipi: "IPI number",
        publisher: "Publisher",
        publisherIpiCae: "Publisher IPI/CAE",
        genre: "Genres",
        guardianNameArtist: "Guardian full legal name",
        guardianEmailArtist: "Guardian email address",
    };
    return m[k] || k;
}
const DISCLAIMER = "We carefully review all submissions and evaluate if they fit our network or not. Due to the high amount of submissions we can’t guarantee that all submissions will be answered. If accepted we will get back to you shortly.";
const DRAFT_KEY = "artist_information_submission_draft_v1";
function safeParseDraft(raw) {
    if (!raw)
        return null;
    try {
        const d = JSON.parse(raw);
        if (!d || typeof d !== "object")
            return null;
        return {
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
    fullLegalName: "",
    dateOfBirthArtist: "",
    streetNumber: "",
    zipCode: "",
    city: "",
    country: "",
    instagram: "",
    businessEmail: "",
    spotifyUrl: "",
    appleArtistId: "",
    downtownEmail: "",
    pro: "",
    ipi: "",
    publisher: "",
    publisherIpiCae: "",
    genre: "",
    guardianNameArtist: "",
    guardianEmailArtist: "",
};
export default function ArtistInformationSubmission() {
    const initialDraft = useMemo(() => safeParseDraft(sessionStorage.getItem(DRAFT_KEY)), []);
    // type je fiksno
    const type = "ArtistInformation";
    // name/email u ovoj formi su business fields (kao kod tebe u SubmitForm)
    const [name, setName] = useState(initialDraft?.fields?.fullLegalName ?? "");
    const [email, setEmail] = useState(initialDraft?.fields?.businessEmail ?? "");
    const [message, setMessage] = useState(initialDraft?.message ?? "");
    const [privacyAccepted, setPrivacyAccepted] = useState(initialDraft?.privacyAccepted ?? false);
    const [fields, setFields] = useState({ ...DEFAULT_FIELDS, ...(initialDraft?.fields ?? {}) });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [okId, setOkId] = useState(null);
    const [err, setErr] = useState(null);
    // sync top-level name/email with fields (da uvek ostane isto)
    useEffect(() => {
        setFields((p) => ({ ...p, fullLegalName: name }));
    }, [name]);
    useEffect(() => {
        setFields((p) => ({ ...p, businessEmail: email }));
    }, [email]);
    const ageArtist = useMemo(() => calcAgeFromISO(fields.dateOfBirthArtist), [fields.dateOfBirthArtist]);
    const artistIsMinor = typeof ageArtist === "number" && ageArtist < 18;
    const setField = (key, value) => setFields((p) => ({ ...p, [key]: value }));
    // draft save
    useEffect(() => {
        if (isSubmitting)
            return;
        try {
            const payload = {
                name,
                email,
                message,
                privacyAccepted,
                fields,
            };
            sessionStorage.setItem(DRAFT_KEY, JSON.stringify(payload));
        }
        catch {
            //
        }
    }, [name, email, message, privacyAccepted, fields, isSubmitting]);
    const clearDraft = () => {
        try {
            sessionStorage.removeItem(DRAFT_KEY);
        }
        catch {
            //
        }
    };
    const validate = () => {
        if (!privacyAccepted)
            return "Privacy policy must be accepted.";
        const legal = (fields.fullLegalName || "").trim();
        if (!legal || !looksLikeFullName(legal))
            return "Full legal name is required and must look like a full name.";
        if (!fields.businessEmail.trim())
            return "Business email is required.";
        if (!fields.dateOfBirthArtist.trim())
            return "Date of birth is required.";
        const required = ["streetNumber", "zipCode", "city", "country", "spotifyUrl", "appleArtistId"];
        for (const k of required)
            if (!(fields[k] ?? "").trim())
                return `${labelFor(k)} is required.`;
        const apple = fields.appleArtistId.trim();
        if (apple && !/^\d{10}$/.test(apple))
            return "Apple Artist ID must be exactly 10 digits.";
        if (artistIsMinor) {
            if (!fields.guardianNameArtist.trim() || !looksLikeFullName(fields.guardianNameArtist))
                return "For minors, guardian full legal name is required.";
            if (!fields.guardianEmailArtist.trim())
                return "For minors, guardian email address is required.";
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
        put("fullLegalNameArtist", fields.fullLegalName);
        put("dateOfBirthArtist", fields.dateOfBirthArtist);
        put("streetNumber", fields.streetNumber);
        put("zipCode", fields.zipCode);
        put("city", fields.city);
        put("country", fields.country);
        put("instagram", fields.instagram);
        put("businessEmail", fields.businessEmail);
        put("spotifyUrl", fields.spotifyUrl);
        put("appleArtistId", fields.appleArtistId);
        put("downtownEmail", fields.downtownEmail);
        put("pro", fields.pro);
        put("ipi", fields.ipi);
        put("publisher", fields.publisher);
        put("publisherIpiCae", fields.publisherIpiCae);
        put("genre", fields.genre);
        if (artistIsMinor) {
            put("guardianNameArtist", fields.guardianNameArtist);
            put("guardianEmailArtist", fields.guardianEmailArtist);
        }
        return JSON.stringify(obj);
    };
    const resetAll = () => {
        setName("");
        setEmail("");
        setMessage("");
        setPrivacyAccepted(false);
        setFields({ ...DEFAULT_FIELDS });
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
            fd.append("Type", type);
            fd.append("Domain", window.location.hostname || "");
            fd.append("PrivacyAccepted", privacyAccepted ? "true" : "false");
            // kao SubmitForm: ArtistInformation koristi legal name + business email
            fd.append("Name", fields.fullLegalName.trim());
            fd.append("Email", fields.businessEmail.trim());
            if (message.trim())
                fd.append("Message", message.trim());
            const fieldsJson = buildFieldsJson();
            if (fieldsJson && fieldsJson !== "{}")
                fd.append("FieldsJson", fieldsJson);
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
    return (_jsxs("main", { className: "submitform-page", children: [_jsx(BottomNav, {}), _jsxs("section", { className: "submitform-wrap", children: [_jsxs("header", { className: "submitform-head", children: [_jsxs("h1", { className: "submitform-title", children: ["ARTIST ", _jsx("span", { className: "submitform-titleGrad", children: "INFORMATION" })] }), _jsx("p", { className: "submitform-sub", children: "Artist information submission." })] }), _jsxs("form", { className: "submitform-card", onSubmit: onSubmit, children: [_jsxs("div", { className: "submitform-grid", children: [_jsxs("div", { className: "submitform-field submitform-span2", children: [_jsx("span", { className: "submitform-label", children: "SUBMISSION TYPE" }), _jsx("input", { className: "submitform-control", value: "Artist Information", readOnly: true })] }), _jsx("div", { className: "submitform-divider" }), _jsxs("label", { className: "submitform-field", children: [_jsx("span", { className: "submitform-label", children: "FULL LEGAL NAME*" }), _jsx("input", { className: "submitform-control", value: name, onChange: (ev) => setName(ev.target.value), placeholder: "First name Last name", autoComplete: "name" })] }), _jsxs("label", { className: "submitform-field", children: [_jsx("span", { className: "submitform-label", children: "BUSINESS EMAIL*" }), _jsx("input", { className: "submitform-control", type: "email", value: email, onChange: (ev) => setEmail(ev.target.value), placeholder: "business@email.com", autoComplete: "email" })] }), _jsxs("label", { className: "submitform-field", children: [_jsx("span", { className: "submitform-label", children: "DATE OF BIRTH*" }), _jsx("input", { className: "submitform-control", type: "date", value: fields.dateOfBirthArtist, onChange: (ev) => setField("dateOfBirthArtist", ev.target.value) })] }), _jsxs("label", { className: "submitform-field", children: [_jsx("span", { className: "submitform-label", children: "INSTAGRAM" }), _jsx("input", { className: "submitform-control", value: fields.instagram, onChange: (ev) => setField("instagram", ev.target.value), placeholder: "@handle" })] }), _jsxs("label", { className: "submitform-field submitform-span2", children: [_jsx("span", { className: "submitform-label", children: "STREET & NUMBER*" }), _jsx("input", { className: "submitform-control", value: fields.streetNumber, onChange: (ev) => setField("streetNumber", ev.target.value), placeholder: "Street 12A" })] }), _jsxs("label", { className: "submitform-field", children: [_jsx("span", { className: "submitform-label", children: "ZIP CODE*" }), _jsx("input", { className: "submitform-control", value: fields.zipCode, onChange: (ev) => setField("zipCode", ev.target.value), placeholder: "11000" })] }), _jsxs("label", { className: "submitform-field", children: [_jsx("span", { className: "submitform-label", children: "CITY*" }), _jsx("input", { className: "submitform-control", value: fields.city, onChange: (ev) => setField("city", ev.target.value), placeholder: "City" })] }), _jsxs("label", { className: "submitform-field", children: [_jsx("span", { className: "submitform-label", children: "COUNTRY*" }), _jsx("input", { className: "submitform-control", value: fields.country, onChange: (ev) => setField("country", ev.target.value), placeholder: "Country" })] }), _jsxs("label", { className: "submitform-field", children: [_jsx("span", { className: "submitform-label", children: "GENRES" }), _jsx("input", { className: "submitform-control", value: fields.genre, onChange: (ev) => setField("genre", ev.target.value), placeholder: "Pop, EDM, Hip-hop..." })] }), _jsxs("label", { className: "submitform-field submitform-span2", children: [_jsx("span", { className: "submitform-label", children: "SPOTIFY ARTIST URL*" }), _jsx("input", { className: "submitform-control", value: fields.spotifyUrl, onChange: (ev) => setField("spotifyUrl", ev.target.value), placeholder: "https://open.spotify.com/artist/..." })] }), _jsxs("label", { className: "submitform-field", children: [_jsx("span", { className: "submitform-label", children: "APPLE ARTIST ID*" }), _jsx("input", { className: "submitform-control", value: fields.appleArtistId, onChange: (ev) => setField("appleArtistId", ev.target.value), placeholder: "10 digits", inputMode: "numeric" })] }), _jsxs("label", { className: "submitform-field", children: [_jsx("span", { className: "submitform-label", children: "DOWNTOWN ACCOUNT EMAIL" }), _jsx("input", { className: "submitform-control", value: fields.downtownEmail, onChange: (ev) => setField("downtownEmail", ev.target.value), placeholder: "account@email.com" })] }), _jsxs("label", { className: "submitform-field", children: [_jsx("span", { className: "submitform-label", children: "PRO" }), _jsx("input", { className: "submitform-control", value: fields.pro, onChange: (ev) => setField("pro", ev.target.value) })] }), _jsxs("label", { className: "submitform-field", children: [_jsx("span", { className: "submitform-label", children: "IPI" }), _jsx("input", { className: "submitform-control", value: fields.ipi, onChange: (ev) => setField("ipi", ev.target.value) })] }), _jsxs("label", { className: "submitform-field", children: [_jsx("span", { className: "submitform-label", children: "PUBLISHER" }), _jsx("input", { className: "submitform-control", value: fields.publisher, onChange: (ev) => setField("publisher", ev.target.value) })] }), _jsxs("label", { className: "submitform-field", children: [_jsx("span", { className: "submitform-label", children: "PUBLISHER IPI/CAE" }), _jsx("input", { className: "submitform-control", value: fields.publisherIpiCae, onChange: (ev) => setField("publisherIpiCae", ev.target.value) })] }), artistIsMinor && (_jsxs(_Fragment, { children: [_jsx("div", { className: "submitform-divider" }), _jsxs("label", { className: "submitform-field", children: [_jsx("span", { className: "submitform-label", children: "GUARDIAN FULL LEGAL NAME*" }), _jsx("input", { className: "submitform-control", value: fields.guardianNameArtist, onChange: (ev) => setField("guardianNameArtist", ev.target.value), placeholder: "First name Last name" })] }), _jsxs("label", { className: "submitform-field", children: [_jsx("span", { className: "submitform-label", children: "GUARDIAN EMAIL*" }), _jsx("input", { className: "submitform-control", type: "email", value: fields.guardianEmailArtist, onChange: (ev) => setField("guardianEmailArtist", ev.target.value), placeholder: "guardian@email.com" })] }), _jsx("div", { className: "submitform-help submitform-span2", children: "Because the artist is under 18, guardian details are required." })] })), _jsxs("label", { className: "submitform-field submitform-span2", children: [_jsx("span", { className: "submitform-label", children: "MESSAGE" }), _jsx("textarea", { className: "submitform-control submitform-textarea", rows: 7, value: message, onChange: (ev) => setMessage(ev.target.value), placeholder: "Additional notes..." })] }), _jsx("label", { className: "submitform-field submitform-span2 submitform-privacy", children: _jsxs("span", { children: [_jsx("input", { type: "checkbox", checked: privacyAccepted, onChange: (ev) => setPrivacyAccepted(ev.target.checked) }), "\u00A0\u00A0I agree to the", " ", _jsx(Link, { className: "submitform-link", to: "/privacy", children: "Privacy Policy" }), " ", "and", " ", _jsx(Link, { className: "submitform-link", to: "/cookies", children: "Cookie Policy" }), "."] }) }), _jsx("div", { className: "submitform-field submitform-span2", children: _jsx("div", { className: "submitform-note--disclaimer", children: DISCLAIMER }) })] }), err && _jsx("div", { className: "submitform-alert submitform-alert--err", children: err }), okId && (_jsxs("div", { className: "submitform-alert submitform-alert--ok", children: ["Submitted successfully. Reference ID: ", _jsx("span", { className: "submitform-mono", children: okId })] })), _jsx("div", { className: "submitform-foot", children: _jsx("button", { className: "submitform-btn", type: "submit", disabled: isSubmitting, children: isSubmitting ? "SENDING..." : "SEND" }) })] })] }), _jsx(ReleasesFooterBar, {})] }));
}
