export type CmsBrand = {
  href: string;
  logo: string;
  name: string;
  isCurrent?: boolean;
};

export type CmsLink = {
  href: string;
  label: string;
};

export type CmsSocialLink = {
  href: string;
  icon: "instagram" | "tiktok" | "spotify" | "youtube" | string;
  label: string;
};

export type CmsContactType = {
  key: string; // e.g. "LICENSING" | "GENERAL"
  label: string; // shown in dropdown
  topics: string[];
};

export type CmsFooter = {
  brands: CmsBrand[];
  contact: {
    contactTypes: CmsContactType[];

    labels: {
      contactType: string;
      name: string;
      topic: string;
      email: string;
      instagram: string;
      upload: string;
      message: string;
    };

    placeholders: {
      name: string;
      email: string;
      instagram: string;
      message: string;
    };

    privacy: {
      text: string; // e.g. "Your data will be processed in accordance with our"
      linkLabel: string; // "Privacy Policy"
      href: string; // link
    };

    submitLabel: string;
    successMessage?: string;
  };

  socials: CmsSocialLink[];
  legal: CmsLink[];
};

export type CmsTrack = {
  title: string;
  length?: string;
  url: string; // spotify track URL
};

export type CmsArtistField = {
  label: string;
  value: string;
};

export type CmsArtist = {
  id: string;
  name: string;
  bio: string;
  image: string;
  spotifyUrl?: string;
  tracks?: CmsTrack[];
  fields?: CmsArtistField[];
};

export type CmsArtistsRoster = {
  artists: CmsArtist[];
};

export type CmsHomeArtists = {
  top3: string[]; // exactly 3 ids in order
};
