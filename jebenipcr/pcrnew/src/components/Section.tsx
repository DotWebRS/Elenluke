import React, { useEffect, useRef, useState } from "react";

type Props = {
  id: string;
  title?: string;
  className?: string;
  children?: React.ReactNode;
};

export default function Section({ id, title, className, children }: Props) {
  const ref = useRef<HTMLElement | null>(null);
  const [active, setActive] = useState(id === "home"); // home je odmah active

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (id === "home") return;

    const io = new IntersectionObserver(
      (entries) => {
        const e = entries[0];
        if (!e) return;
        setActive(e.isIntersecting);
      },
      { threshold: 0.18 }
    );

    io.observe(el);
    return () => io.disconnect();
  }, [id]);

  const cls = [
    "section",
    className,
    id === "home" ? "is-home" : active ? "reveal-active" : "reveal-below",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <section ref={ref} id={id} className={cls}>
      <div className="container">
        {title ? <h2 className="sectionTitle">{title}</h2> : null}
        <div className="sectionBody">{children}</div>
      </div>
    </section>
  );
}
