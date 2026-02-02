/** Per-character transform presets for the text dispersion effect. */
const transforms: { x: number; y: number; rotationZ: number }[] = [
  { x: -0.8, y: -0.6, rotationZ: -29 },
  { x: -0.2, y: -0.4, rotationZ: -6 },
  { x: -0.05, y: 0.1, rotationZ: 12 },
  { x: -0.05, y: -0.1, rotationZ: -9 },
  { x: -0.1, y: 0.55, rotationZ: 3 },
  { x: 0, y: -0.1, rotationZ: 9 },
  { x: 0, y: 0.15, rotationZ: -12 },
  { x: 0, y: 0.15, rotationZ: -17 },
  { x: 0, y: -0.65, rotationZ: 9 },
  { x: 0.1, y: 0.4, rotationZ: 12 },
  { x: 0, y: -0.15, rotationZ: -9 },
  { x: 0.2, y: 0.15, rotationZ: 12 },
  { x: 0.8, y: 0.6, rotationZ: 20 },
];

const ease = [0.33, 1, 0.68, 1] as const;
const duration = 0.75;

export const disperseVariants = {
  open: (i: number) => {
    const t = transforms[i % transforms.length];
    return {
      x: `${t.x}em`,
      y: `${t.y}em`,
      rotateZ: t.rotationZ,
      transition: { duration, ease },
      zIndex: 1,
    };
  },
  closed: {
    x: 0,
    y: 0,
    rotateZ: 0,
    transition: { duration, ease },
    zIndex: 0,
  },
};
