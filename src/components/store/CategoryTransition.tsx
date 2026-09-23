"use client";

import { useState } from "react";

/**
 * Replays the page-transition slide on the /store product grid only when the
 * category filter changes. Category links skip the site-wide page transition,
 * so without this the grid would just swap. The first render doesn't animate:
 * on arrival from another page the whole page is already sliding in, and a
 * second slide on the grid would double the motion.
 */
export function CategoryTransition({
  category,
  children,
}: {
  category: string;
  children: React.ReactNode;
}) {
  const [prevCategory, setPrevCategory] = useState(category);
  const [hasChanged, setHasChanged] = useState(false);
  if (category !== prevCategory) {
    setPrevCategory(category);
    setHasChanged(true);
  }

  return (
    <div className="overflow-x-clip">
      {/* Keyed on category so each change remounts and replays the animation. */}
      <div key={category} className={hasChanged ? "animate-dossier-in" : undefined}>
        {children}
      </div>
    </div>
  );
}
