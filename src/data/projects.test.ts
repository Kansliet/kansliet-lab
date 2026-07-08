import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import { projects } from "@/data/projects";
import { trailImages } from "@/data/trail-images";

/** Resolve a public-relative src ("/images/...") to an absolute disk path. */
function publicPath(src: string): string {
  // path.join normalizes the leading slash on both Windows and Linux.
  // Do NOT do "public" + src — that breaks path separators on Windows.
  return path.join(process.cwd(), "public", src);
}

describe("project image paths", () => {
  const allSrcs = [
    ...projects.flatMap((p) => p.images.map((img) => img.src)),
    ...trailImages.map((img) => img.src),
  ];

  it.each(allSrcs)("resolves to a file on disk: %s", (src) => {
    expect(fs.existsSync(publicPath(src)), `missing file: public${src}`).toBe(
      true,
    );
  });
});

describe("project data integrity", () => {
  it("has unique project ids", () => {
    const ids = projects.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("gives every project at least one image", () => {
    for (const p of projects) {
      expect(p.images.length, `project ${p.id} has no images`).toBeGreaterThan(
        0,
      );
    }
  });

  it("uses URL-safe ids (routes become /works/<id>)", () => {
    for (const p of projects) {
      expect(p.id, `unsafe id: ${p.id}`).toMatch(/^[a-z0-9-]+$/);
    }
  });
});
