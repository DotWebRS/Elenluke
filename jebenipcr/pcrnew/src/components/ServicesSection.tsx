import type { ReactNode } from "react";
import useScrollReveal from "../hooks/useScrollReveal";

type Props = {
  id: string;
  title?: ReactNode; 
  children: ReactNode;
  className?: string;
};

export default function Section({ id, title, children, className }: Props) {
  const ref = useScrollReveal();

  return (
    <section id={id} ref={ref} className={["section", className || ""].join(" ").trim()}>
      <div className="container">
        {title ? <h2 className="sectionTitle">{title}</h2> : null}
        <div className="sectionBody">{children}</div>
      </div>
    </section>
  );
}
