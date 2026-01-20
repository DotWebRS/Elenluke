import type { CmsArtistsRoster, CmsFooter, CmsHomeArtists } from "./types";

export const DEFAULT_FOOTER: CmsFooter = {
  brands: [
    { href: "https://pcr-landing-page.vercel.app/", logo: "/branding/pcp-logo.png", name: "Purple Crunch Publishing", isCurrent: false },
    { href: "https://example.com", logo: "/branding/pmg.png", name: "Purple Music Group", isCurrent: false },
    { href: "#", logo: "/branding/publishing.png", name: "Purple Crunch Publishing", isCurrent: true },
  ],
  contact: {
    contactTypes: [
      { key: "LICENSING", label: "LICENSING CONTACT", topics: ["Sync request"] },
      { key: "GENERAL", label: "GENERAL CONTACT", topics: ["General question", "Follow-up", "Report a right issue"] },
    ],
    labels: {
      contactType: "CONTACT TYPE",
      name: "NAME",
      topic: "TOPIC",
      email: "EMAIL",
      instagram: "@INSTAGRAM HANDLE (OPTIONAL)",
      upload: "UPLOAD (OPTIONAL)",
      message: "MESSAGE",
    },
    placeholders: {
      name: "Your name",
      email: "name@email.com",
      instagram: "@yourhandle",
      message: "Write your message...",
    },
    privacy: {
      text: "Your data will be processed in accordance with our",
      linkLabel: "Privacy Policy",
      href: "#",
    },
    submitLabel: "SEND",
    successMessage: "Thanks! We received your message.",
  },
  socials: [
    { href: "#", icon: "instagram", label: "Instagram" },
    { href: "#", icon: "tiktok", label: "TikTok" },
    { href: "#", icon: "spotify", label: "Spotify" },
    { href: "#", icon: "youtube", label: "YouTube" },
  ],
  legal: [
    { href: "#", label: "Cookie Policy" },
    { href: "#", label: "Privacy Policy" },
    { href: "#", label: "Terms & Conditions" },
  ],
};

export const DEFAULT_ROSTER: CmsArtistsRoster = {
  artists: [],
};

export const DEFAULT_HOME_ARTISTS: CmsHomeArtists = {
  top3: [],
};
