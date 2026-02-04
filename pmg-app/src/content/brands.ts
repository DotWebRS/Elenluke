export type BrandItem = {
  key: string;
  name: string;
  description: string;
  href: string;
  logoSrc: string;
};

export const BRANDS: BrandItem[] = [
  {
    key: "pcr",
    name: "Purple Crunch Records",
    description:
      "The artist-facing label dedicated to releases, campaigns, and growth in the digital era.",
    href: "https://purplecrunchrecords.com/",
    logoSrc: "/brands/pcr-logo.png",
  },
  {
    key: "pcp",
    name: "Purple Crunch Publishing",
    description:
      "The creative backbone of the Purple Crunch ecosystem — representing songwriters, producers, and artists who define the sound of the digital generation.",
    href: "https://purplecrunchpublishing.com/",
    logoSrc: "/brands/pcp-logo.png",
  },
];
