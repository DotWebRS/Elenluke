export type AdminSiteKey =
  | "purple-crunch-publishing"
  | "purple-crunch-records"
  | "purple-music-group";

export const ADMIN_SITES: { key: AdminSiteKey; label: string }[] = [
  { key: "purple-crunch-publishing", label: "Purple Crunch Publishing" },
  { key: "purple-crunch-records", label: "Purple Crunch Records" },
  { key: "purple-music-group", label: "Purple Music Group" },
];
