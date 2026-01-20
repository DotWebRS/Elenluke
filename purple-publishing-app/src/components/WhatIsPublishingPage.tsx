import { useEffect, useMemo, useState } from "react";
import Container from "react-bootstrap/Container";
import BottomNav from "./BottomNav";

type Section = {
  id: string;
  title: string;
  body: string[];
  bullets?: string[];
};

const SECTIONS: Section[] = [
 
  {
    id: "what-do-you-do-for-me",
    title: "What do you do for me?",
    body: [],
    bullets: [
      "Register your songs globally with PROs.",
      "Collect performance, mechanical, sync royalties and pay you quarterly.",
      "Handle licensing (sync, mechanical, print, sampling, covers).",
      "Pitch your music to artists/labels/brands/film/games.",
      "Connect you with our Artist Network.",
      "Legal support with Sony to protect your works.",
    ],
  },
  {
    id: "why-sony",
    title: "Why do we work with Sony?",
    body: [
      "Sony registers your songs in every country, checks each registration for accuracy, and—thanks to its huge global market share—secures the best royalty rates, also for short-form content like YouTube Shorts, Reels, and TikTok.",
      "With direct contracts in every territory, Sony can collect faster and more completely than smaller publishers.",
      "That means your royalties reach you sooner, and at the highest possible rate.",
    ],
  },
  {
    id: "what-is-music-publishing",
    title: "What is music publishing?",
    body: [
      "A song (melody/lyrics/chords) is different from a recording (the sound file). We manage your songwriting rights so money from plays and uses reaches you.",
    ],
  },
  {
    id: "composition-vs-recording",
    title: "What’s the “composition” vs the “sound recording”?",
    body: [
      "The song is the idea and words. The recording is the audio file. We handle the song, labels handle the sounds.",
      "We only present you as a songwriter under Purple Crunch Publishing.",
      "We (Purple Crunch Publishing, in partnership with Sony Music Publishing) manage the songwriting rights, not the sound.",
    ],
  },
  {
    id: "label-vs-publisher",
    title: "What is the difference between a label and a publisher?",
    body: [],
    bullets: [
      "Label = sound. Earns from streams/sales of the recording.",
      "Publisher = song. Earns from uses of the composition (radio, TV, streaming, live, sync).",
      "Important: Label pays artist/streaming royalties. Publisher collects the songwriter royalties and shares them with the artist.",
    ],
  },
  {
    id: "can-i-work-with-any-label",
    title: "Can I work with any label?",
    body: ["Yes. You can release with any label. We only handle your songwriter rights."],
  },
  {
    id: "why-publishing-matters",
    title: "Why publishing matters?",
    body: [
      "If songs aren’t registered worldwide under a publisher, your money can fall into a “black box” and get paid to others later. We prevent that and ensure you receive your songwriter royalties.",
    ],
  },
  {
    id: "how-royalties-work",
    title: "How does royalty payment work?",
    body: [
      "When someone plays your music (Spotify, YouTube, radio, TV, or live), the platform pays license fees to collecting societies like GEMA, PRS, ASCAP, or BMI.",
      "These royalties are collected by us (Purple Crunch Publishing). We pay you, the songwriter.",
    ],
  },
  {
    id: "types-of-royalties",
    title: "What type of royalties do I get?",
    body: [],
    bullets: [
      "Performance royalties: From radio, live, streaming, and broadcast.",
      "Mechanical royalties: From downloads, streams, or CDs.",
      "Sync royalties: When your song is used in games, films, or ads.",
      "Neighbouring rights: When recordings play on radio, TV, or public.",
    ],
  },
  {
    id: "when-paid",
    title: "When will I get paid?",
    body: [],
    bullets: [
      "Registration takes 6–9 months worldwide.",
      "Payments: After registration, quarterly.",
    ],
  },
  {
    id: "what-is-sync",
    title: "What is sync?",
    body: [
      "Your songs can be licensed for games, movies, ads and apps.",
      "Recent partners from us: Epic Games (Fortnite), Roblox, Amanotes.",
      "We pitch the songwriters catalogue and handle all the paperwork.",
    ],
  },
  {
    id: "global-registration",
    title: "How does the global registration process work?",
    body: [
      "PRO is a Performance Rights Organization like GEMA, PRS, ASCAP or BMI.",
    ],
    bullets: [
      "We help you join a PRO (e.g. GEMA/PRS/ASCAP/BMI).",
      "We register your work in every country.",
      "After that, PROs report quarterly and we pay you out.",
    ],
  },
  {
    id: "protect-rights",
    title: "How do you protect my rights?",
    body: [],
    bullets: [
      "In-house & Sony legal teams.",
      "If you find somebody using your song, just let us know—we will handle any claims.",
    ],
  },
  {
    id: "ownership",
    title: "Do I lose ownership of my song?",
    body: [
      "No. You always keep the copyright to your composition. We only manage the rights on your behalf to collect your income and protect your work.",
    ],
  },
  {
    id: "under-18",
    title: "What if I am under 18 years old?",
    body: [
      "You can still join. If you’re under 18, we’ll ask a parent or legal guardian to co-sign your agreement.",
      "This makes sure everything is legally valid and that your royalties are paid safely to the right account.",
      "We’ll guide you and your parent through each step so it’s easy and clear.",
    ],
  },
];

function slugToTitle(s: string) {
  return s.replace(/-/g, " ");
}

export default function WhatIsPublishingPage() {
  const items = useMemo(() => SECTIONS, []);
  const [active, setActive] = useState(items[0]?.id ?? "");

  useEffect(() => {
    const ids = items.map((x) => x.id);
    const obs = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => (b.intersectionRatio ?? 0) - (a.intersectionRatio ?? 0))[0];
        if (visible?.target?.id && ids.includes(visible.target.id)) setActive(visible.target.id);
      },
      { rootMargin: "-30% 0px -55% 0px", threshold: [0.1, 0.2, 0.35, 0.5] }
    );

    ids.forEach((id) => {
      const el = document.getElementById(id);
      if (el) obs.observe(el);
    });

    return () => obs.disconnect();
  }, [items]);

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    
    <section className="publishing-page">
      <BottomNav />
      <div className="publishing-hero">
        <Container>
          <h1 className="publishing-h1">
            WHAT IS <span className="publishing-animated">PUBLISHING</span>
          </h1>
          
        </Container>
      </div>

      

      <Container className="publishing-content">
        {items.map((s) => (
          <section key={s.id} id={s.id} className="publishing-section">
            <h2 className="publishing-h2">{s.title}</h2>

            {s.body.map((p, i) => (
              <p key={`${s.id}_p_${i}`} className="publishing-p">
                {p}
              </p>
            ))}

            {s.bullets?.length ? (
              <ul className="publishing-list">
                {s.bullets.map((b, i) => (
                  <li key={`${s.id}_b_${i}`}>{b}</li>
                ))}
              </ul>
            ) : null}

            <div className="publishing-divider" />
          </section>
        ))}
      </Container>
    </section>
  );
}
