"use client";

import { motion } from "motion/react";
import { useReducedMotion } from "motion/react";
import { ReactNode, useState } from "react";
import { disperseVariants } from "@/lib/disperse-anim";

function getText(children: ReactNode): string {
  if (typeof children === "string") return children;
  if (Array.isArray(children)) return children.map(getText).join("");
  if (children && typeof children === "object" && "props" in children) {
    const props = (children as { props?: { children?: ReactNode } }).props;
    return props?.children != null ? getText(props.children) : "";
  }
  return "";
}

interface TextDisperseProps {
  children: ReactNode;
  className?: string;
  /** When set, disperse is controlled by the parent (e.g. from mousemove over a different layer). */
  isAnimated?: boolean;
}

export function TextDisperse({ children, className, isAnimated: controlledAnimated }: TextDisperseProps) {
  const [internalAnimated, setInternalAnimated] = useState(false);
  const reduceMotion = useReducedMotion();
  const text = getText(children);
  const chars = text.split("");
  const noDisperse = reduceMotion === true;
  const isAnimated = controlledAnimated !== undefined ? controlledAnimated : internalAnimated;

  return (
    <div
      className={className}
      onMouseEnter={() => controlledAnimated === undefined && !noDisperse && setInternalAnimated(true)}
      onMouseLeave={() => controlledAnimated === undefined && setInternalAnimated(false)}
      role="presentation"
    >
      {chars.map((char, i) => {
        if (char === "\n") return <br key={`br-${i}`} />;
        return (
          <motion.span
            key={`${char}-${i}`}
            custom={i}
            variants={noDisperse ? undefined : disperseVariants}
            animate={noDisperse ? undefined : isAnimated ? "open" : "closed"}
            style={{ display: "inline-block" }}
          >
            {char}
          </motion.span>
        );
      })}
    </div>
  );
}
