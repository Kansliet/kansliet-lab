// The ball is drawn by one fragment shader on a square canvas. Per pixel:
// the sphere normal under it (orthographic, z toward the viewer) looks up the
// matcap, so the photo's reflections stay fixed to the viewer; the same normal
// rotated into the ball's own frame looks up the imperfection map, so the
// specks, pits, scratches and smudges roll with the ball.

const VERTEX = `
attribute vec2 aPos;
varying vec2 vPos;
void main() {
  vPos = aPos;
  gl_Position = vec4(aPos, 0.0, 1.0);
}`;

const FRAGMENT = `
precision highp float;
varying vec2 vPos;            // -1..1, y up
uniform sampler2D uMatcap;    // the cleaned photo
uniform sampler2D uImp;       // R specks/scratches, G pits, B smudges
uniform sampler2D uPrints;    // fingerprints, light on black (same wrap, 2× res)
uniform mat3 uInv;            // world -> ball
uniform float uEdge;          // antialiasing width, in radii
// Toward the cast shadow (down-right, ~48°), y up. Matches SHADOW_OFFSET_* in SteelBall.tsx.
const vec2 SHADOW_DIR = vec2(0.664, -0.747);

void main() {
  float r2 = dot(vPos, vPos);
  float alpha = 1.0 - smoothstep(1.0 - uEdge, 1.0, sqrt(r2));
  if (alpha <= 0.0) {
    gl_FragColor = vec4(0.0);
    return;
  }
  vec3 n = vec3(vPos, sqrt(max(0.0, 1.0 - r2)));

  // 0.985: stay inside the photo's own soft, semi-transparent rim.
  vec3 base = texture2D(uMatcap, vec2(n.x, -n.y) * (0.5 * 0.985) + 0.5).rgb;

  vec3 o = uInv * n;
  vec2 eq = vec2(atan(o.x, o.z) / 6.2831853 + 0.5, 0.5 - asin(clamp(o.y, -1.0, 1.0)) / 3.1415927);
  vec3 imp = texture2D(uImp, eq).rgb;

  // Marks foreshorten to nothing at the rim.
  float face = smoothstep(0.0, 0.35, n.z);
  float lum = dot(base, vec3(0.299, 0.587, 0.114));
  // Smudges and fingerprints: above 0.5 an oily haze that lifts the dark
  // reflections (on polished steel it's visible there, not on the bright
  // ones); below, a faint darkening.
  float film = imp.b - 0.5 + texture2D(uPrints, eq).r * 0.12;
  vec3 col = base + max(film, 0.0) * 0.55 * (1.0 - 0.75 * lum) * face;
  col *= 1.0 + min(film, 0.0) * 0.33;
  // Dust and scratches catch light: most visible over the dark reflections.
  col += imp.r * face * (0.066 + 0.099 * (1.0 - lum));
  col *= 1.0 - imp.g * 0.22 * face;

  // The outer band reflects the paper right beside the ball, which is in the
  // ball's own shadow on the shadow side: darken it there (the photo's rim was
  // lit by a bright studio floor), strongest facing the shadow (down-right,
  // like the cast shadow's offset), fading out round the sides.
  float rim = smoothstep(0.9, 1.0, sqrt(r2));
  float facing = clamp(0.1 + 1.2 * dot(n.xy, SHADOW_DIR), 0.0, 1.0);
  col *= 1.0 - 0.48 * rim * facing;

  gl_FragColor = vec4(col * alpha, alpha); // premultiplied
}`;

export type BallRenderer = {
  draw(inverse: Float32Array): void;
  resize(pixels: number): void;
  dispose(): void;
};

function compile(gl: WebGLRenderingContext, type: number, source: string) {
  const shader = gl.createShader(type)!;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    throw new Error(gl.getShaderInfoLog(shader) ?? "shader compile failed");
  }
  return shader;
}

function texture(gl: WebGLRenderingContext, unit: number, image: HTMLImageElement, repeatX: boolean) {
  const tex = gl.createTexture();
  gl.activeTexture(gl.TEXTURE0 + unit);
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  // Longitude wraps; everything else clamps. REPEAT needs power-of-two sizes
  // in WebGL 1, which the wrapped maps are (1024×512, 2048×1024).
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, repeatX ? gl.REPEAT : gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  return tex;
}

/** Returns null when WebGL is unavailable (the caller shows the photo instead). */
export function createBallRenderer(
  canvas: HTMLCanvasElement,
  matcap: HTMLImageElement,
  imperfections: HTMLImageElement,
  prints: HTMLImageElement,
): BallRenderer | null {
  const gl = canvas.getContext("webgl", { alpha: true, premultipliedAlpha: true, antialias: false });
  if (!gl) return null;

  const program = gl.createProgram()!;
  gl.attachShader(program, compile(gl, gl.VERTEX_SHADER, VERTEX));
  gl.attachShader(program, compile(gl, gl.FRAGMENT_SHADER, FRAGMENT));
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return null;
  gl.useProgram(program);

  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  const aPos = gl.getAttribLocation(program, "aPos");
  gl.enableVertexAttribArray(aPos);
  gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

  gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
  const textures = [
    texture(gl, 0, matcap, false),
    texture(gl, 1, imperfections, true),
    texture(gl, 2, prints, true),
  ];
  gl.uniform1i(gl.getUniformLocation(program, "uMatcap"), 0);
  gl.uniform1i(gl.getUniformLocation(program, "uImp"), 1);
  gl.uniform1i(gl.getUniformLocation(program, "uPrints"), 2);
  const uInv = gl.getUniformLocation(program, "uInv");
  const uEdge = gl.getUniformLocation(program, "uEdge");

  return {
    resize(pixels) {
      canvas.width = canvas.height = pixels;
      gl.viewport(0, 0, pixels, pixels);
      // About 1.5 device pixels of edge softening at any size.
      gl.uniform1f(uEdge, 3 / pixels);
    },
    draw(inverse) {
      gl.uniformMatrix3fv(uInv, false, inverse);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    },
    dispose() {
      textures.forEach((t) => gl.deleteTexture(t));
      gl.deleteBuffer(buffer);
      gl.deleteProgram(program);
    },
  };
}
