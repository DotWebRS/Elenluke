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
  key: string; // "LICENSING" | "GENERAL"
  label: string; 
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
      text: string; 
      linkLabel: string; 
      href: string; 
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
