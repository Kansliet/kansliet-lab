/** Unit quaternion [x, y, z, w]. */
export type Quat = [number, number, number, number];

export const IDENTITY: Quat = [0, 0, 0, 1];

/** a * b: apply b, then a. */
export function multiply(a: Quat, b: Quat): Quat {
  const [ax, ay, az, aw] = a;
  const [bx, by, bz, bw] = b;
  return [
    aw * bx + ax * bw + ay * bz - az * by,
    aw * by - ax * bz + ay * bw + az * bx,
    aw * bz + ax * by - ay * bx + az * bw,
    aw * bw - ax * bx - ay * by - az * bz,
  ];
}

export function normalize(q: Quat): Quat {
  const l = Math.hypot(q[0], q[1], q[2], q[3]) || 1;
  return [q[0] / l, q[1] / l, q[2] / l, q[3] / l];
}

/** Rotation by |w|·dt radians about the axis w (angular velocity, rad/s). */
export function fromAngularVelocity(wx: number, wy: number, wz: number, dt: number): Quat {
  const speed = Math.hypot(wx, wy, wz);
  if (speed < 1e-9) return IDENTITY;
  const half = (speed * dt) / 2;
  const s = Math.sin(half) / speed;
  return [wx * s, wy * s, wz * s, Math.cos(half)];
}

/** Angle of the rotation q, in radians (0..2π). */
export function angle(q: Quat): number {
  return 2 * Math.acos(Math.min(1, Math.abs(q[3])));
}

/**
 * Column-major 3×3 matrix of the *inverse* rotation (world → ball), which the
 * shader applies to the view normal to find the point of the ball's surface
 * under each pixel.
 */
export function inverseMatrix(q: Quat, out: Float32Array): Float32Array {
  const [x, y, z, w] = q;
  // Rotation matrix of q, transposed (= inverse for a rotation), column-major.
  out[0] = 1 - 2 * (y * y + z * z);
  out[1] = 2 * (x * y - z * w);
  out[2] = 2 * (x * z + y * w);
  out[3] = 2 * (x * y + z * w);
  out[4] = 1 - 2 * (x * x + z * z);
  out[5] = 2 * (y * z - x * w);
  out[6] = 2 * (x * z - y * w);
  out[7] = 2 * (y * z + x * w);
  out[8] = 1 - 2 * (x * x + y * y);
  return out;
}
