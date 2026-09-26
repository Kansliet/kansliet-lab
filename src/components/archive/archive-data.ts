// Plain module (not "use client"), so server pages can build the plates and
// pass them to ArchiveColumn as props.

export type ArchivePlate = {
  src: string;
  alt: string;
  projectId: string;
  /** e.g. "P.03 — MATTSONS · BRAND IDENTITY · 2026" */
  caption: string;
};

export type ArchiveProject = { id: string; title: string };

/**
 * Every image of every project as archive plates, mixed so the same project
 * never comes round again within the next few plates (the column reads as
 * many more projects than there are). See mixPlates.
 */
export function toArchivePlates(
  projects: {
    id: string;
    title: string;
    category: string;
    year: string;
    images: { src: string; alt: string }[];
  }[]
): ArchivePlate[] {
  return mixPlatesBest(
    projects.flatMap((project, index) =>
      project.images.map((image) => ({
        src: image.src,
        alt: image.alt,
        projectId: project.id,
        caption: `P.${String(index + 1).padStart(2, "0")} — ${project.title} · ${project.category.toUpperCase()} · ${project.year}`,
      }))
    )
  );
}

/** How many plates must pass before a project may come round again, where possible. */
const SPACING = 4;

/**
 * Reorders plates so each project's images are spread out: every pick is
 * from the project with the most images left that hasn't appeared in the
 * last SPACING picks (ties broken by a seeded shuffle, so the order is the
 * same on server and client). Taking the fullest project first drains them
 * evenly, so no clump of one project is left over at the end, and the list
 * still reads well where the endless column wraps from last to first.
 */
export function mixPlates(plates: ArchivePlate[], seed = 7): ArchivePlate[] {
  let s = seed >>> 0 || 1;
  const rand = () => ((s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 2 ** 32);

  const byProject = new Map<string, ArchivePlate[]>();
  for (const plate of plates) {
    const list = byProject.get(plate.projectId) ?? [];
    list.push(plate);
    byProject.set(plate.projectId, list);
  }
  // Each project's own images in a shuffled order too.
  for (const list of byProject.values()) {
    for (let i = list.length - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      [list[i], list[j]] = [list[j], list[i]];
    }
  }
  // A fixed random rank per project breaks ties between equally full ones.
  const rank = new Map([...byProject.keys()].map((id) => [id, rand()]));

  const out: ArchivePlate[] = [];
  while (out.length < plates.length) {
    // The column is endless: near the end, the first plates come next too.
    const toGo = plates.length - out.length;
    const recent = new Set(
      [...out.slice(-SPACING), ...out.slice(0, Math.max(0, SPACING - toGo + 1))].map((p) => p.projectId),
    );
    const left = [...byProject].filter(([, list]) => list.length > 0);
    const allowed = left.filter(([id]) => !recent.has(id));
    const pool = allowed.length > 0 ? allowed : left;
    pool.sort(([a, la], [b, lb]) => lb.length - la.length || rank.get(a)! - rank.get(b)!);
    out.push(pool[0][1].pop()!);
    // Vary the tie order as we go, so the rhythm doesn't settle into a cycle.
    for (const id of rank.keys()) rank.set(id, rand());
  }
  return out;
}

/** Fewest plates between two of the same project, going round the endless column. */
export function closestRepeat(plates: ArchivePlate[]): number {
  let min = Infinity;
  for (let i = 0; i < plates.length; i++)
    for (let d = 1; d < plates.length; d++)
      if (plates[(i + d) % plates.length].projectId === plates[i].projectId) {
        min = Math.min(min, d);
        break;
      }
  return min;
}

/** mixPlates over a fixed range of seeds, keeping the order that spaces projects furthest apart. */
export function mixPlatesBest(plates: ArchivePlate[]): ArchivePlate[] {
  let best = plates;
  let bestGap = -1;
  for (let seed = 1; seed <= 50; seed++) {
    const mixed = mixPlates(plates, seed);
    const gap = closestRepeat(mixed);
    if (gap > bestGap) [best, bestGap] = [mixed, gap];
  }
  return best;
}
