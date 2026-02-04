import React, { useEffect, useMemo, useState } from "react";

type AnimatePresenceProps = {
  show: boolean;
  enter: string; // npr. "animate__fadeInUp"
  exit: string;  // npr. "animate__fadeOutUpBig"
  className?: string;
  style?: React.CSSProperties;
  onExited?: () => void;
  children: React.ReactNode;
};

export function AnimatePresence({
  show,
  enter,
  exit,
  className,
  style,
  onExited,
  children,
}: AnimatePresenceProps) {
  const [render, setRender] = useState(show);
  const [phase, setPhase] = useState<"enter" | "exit">(show ? "enter" : "exit");

  useEffect(() => {
    if (show) {
      setRender(true);
      setPhase("enter");
    } else if (render) {
      setPhase("exit");
    }
  }, [show, render]);

  const animClass = useMemo(() => {
    const which = phase === "enter" ? enter : exit;
    return `animate__animated ${which} ${className || ""}`.trim();
  }, [phase, enter, exit, className]);

  if (!render) return null;

  return (
    <div
      className={animClass}
      style={style}
      onAnimationEnd={() => {
        if (!show) {
          setRender(false);
          onExited?.();
        }
      }}
    >
      {children}
    </div>
  );
}
