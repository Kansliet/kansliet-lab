import { describe, it, expect } from "vitest";
import { projects } from "@/data/projects";
import { closestRepeat, toArchivePlates } from "./archive-data";

describe("archive plate mixing", () => {
  const plates = toArchivePlates(projects);

  it("keeps every image exactly once", () => {
    const all = projects.flatMap((p) => p.images.map((i) => i.src)).sort();
    expect(plates.map((p) => p.src).sort()).toEqual(all);
  });

  it("never shows the same project twice in a row, even where the column wraps", () => {
    for (let i = 0; i < plates.length; i++) {
      const next = plates[(i + 1) % plates.length];
      expect(next.projectId, `plates ${i} and ${i + 1}`).not.toBe(plates[i].projectId);
    }
  });

  it("keeps each project at least 4 plates from its next appearance", () => {
    expect(closestRepeat(plates)).toBeGreaterThanOrEqual(4);
  });

  it("is the same every time (server and client must agree)", () => {
    expect(toArchivePlates(projects).map((p) => p.src)).toEqual(plates.map((p) => p.src));
  });
});
