import React from "react";

type RevealTextProps<T extends React.ElementType> = {
  as?: T;
  text: string;
  className?: string;
  style?: React.CSSProperties;
  baseDelayMs?: number;
} & Omit<React.ComponentPropsWithoutRef<T>, "as" | "children">;

export function RevealText<T extends React.ElementType = "p">({
  as,
  text,
  className,
  style,
  baseDelayMs = 0,
  ...rest
}: RevealTextProps<T>) {
  const Tag = (as ?? "p") as React.ElementType;

  return (
    <Tag
      className={`reveal-text ${className ?? ""}`}
      style={{ ...(style || {}), ["--baseDelay" as any]: `${baseDelayMs}ms` }}
      {...rest}
    >
      {Array.from(text).map((ch, i) => (
        <span key={i} className="reveal-char" style={{ ["--i" as any]: i }}>
          {ch === " " ? "\u00A0" : ch}
        </span>
      ))}
    </Tag>
  );
}
