// Liquid particle hero — a clean-room WebGL2 field of soft dots that is pushed
// and swirled by the pointer, then springs back home. Written from scratch for
// this site (no three.js, no external assets; the CSP is 'self' only).
//
// Two float textures per particle hold its offset and velocity (ping-pong), and
// a static texture holds where the particle belongs. No WebGL2, or no float
// render target: the canvas is removed and the hero falls back to its DOM copy.
(() => {
  const hero = document.querySelector(".hero");
  const canvas = document.getElementById("liquid");
  if (!hero || !canvas) return;

  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const gl = canvas.getContext("webgl2", {
    alpha: true,
    antialias: false,
    premultipliedAlpha: false,
    powerPreference: "high-performance",
  });
  if (!gl || !gl.getExtension("EXT_color_buffer_float")) {
    canvas.remove();
    return;
  }

  const TEX_W = 256;
  const ROWS = 160;
  const COUNT = TEX_W * ROWS;
  // Dots read as ink on paper; in the dark finish they invert to light. Read
  // from the live token so the two themes stay in step with the CSS.
  let COLOR = [0.086, 0.086, 0.078];
  function syncColor() {
    const v = getComputedStyle(document.documentElement).getPropertyValue("--fg").trim();
    const m = v.match(/^#?([0-9a-f]{6})$/i);
    if (!m) return;
    const n = parseInt(m[1], 16);
    COLOR = [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
  }
  syncColor();

  const VS_QUAD = `#version 300 es
layout(location=0) in vec2 aPos;
void main(){ gl_Position = vec4(aPos, 0.0, 1.0); }`;

  const NOISE = `
float hash(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float vnoise(vec2 p){
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  float a = hash(i), b = hash(i + vec2(1.0, 0.0)), c = hash(i + vec2(0.0, 1.0)), d = hash(i + vec2(1.0, 1.0));
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}
vec2 curl(vec2 p){
  const float e = 0.35;
  float a = vnoise(p + vec2(0.0, e)) - vnoise(p - vec2(0.0, e));
  float b = vnoise(p + vec2(e, 0.0)) - vnoise(p - vec2(e, 0.0));
  return vec2(a, -b) / (2.0 * e);
}`;

  const FS_SIM = `#version 300 es
precision highp float;
uniform sampler2D uHome;
uniform sampler2D uState;
uniform vec2 uMouse;
uniform vec2 uVel;
uniform float uPresence;
uniform float uRadius;
uniform float uStrength;
uniform float uReturn;
uniform float uTurb;
uniform float uTime;
uniform float uDt;
out vec4 o;
${NOISE}
void main(){
  ivec2 ij = ivec2(gl_FragCoord.xy);
  vec4 hm = texelFetch(uHome, ij, 0);
  if (hm.w <= 0.0) { o = vec4(0.0); return; }
  vec4 st = texelFetch(uState, ij, 0);
  vec2 off = st.xy;
  vec2 vel = st.zw;

  vec2 p = hm.xy + off;
  vec2 toM = p - uMouse;
  float r2 = dot(toM, toM);
  float f = exp(-r2 / (uRadius * uRadius)) * uPresence;
  vec2 n = toM * inversesqrt(r2 + 1.0);

  vec2 acc = vec2(0.0);
  acc += n * f * 900.0 * uStrength;                 // blown outward
  acc += vec2(-n.y, n.x) * f * 1300.0 * uStrength;  // swirled around the cursor
  acc += uVel * f * 6.0;                            // dragged by a fast pointer

  vec2 q = p * 0.006 + vec2(uTime * 0.35, -uTime * 0.20);
  vec2 c = curl(q) + 0.5 * curl(q * 2.1 + 5.0);
  acc += c * (f * 280.0 + 34.0) * uTurb;

  acc -= off * uReturn;                             // elastic return home

  vel += acc * uDt;
  vel *= pow(0.86, uDt);
  off += vel * uDt;
  if (dot(off, off) < 0.02 && dot(vel, vel) < 0.02) { off = vec2(0.0); vel = vec2(0.0); }
  o = vec4(off, vel);
}`;

  const VS_DRAW = `#version 300 es
uniform sampler2D uHome;
uniform sampler2D uState;
uniform int uTexW;
uniform vec2 uRes;
uniform float uDpr;
uniform float uDot;
uniform float uTime;
uniform float uAmbient;
out float vA;
${NOISE}
// Slow, cursor-independent drift so the field breathes even when the pointer is
// still. Applied at draw time (not in the sim) because the sim's elastic return
// would otherwise damp it to zero.
vec2 ambientField(vec2 uv, float t){
  vec2 q = uv * vec2(3.2, 1.7);
  vec2 a = vec2(vnoise(q + vec2(t * 0.11, 0.0)) - 0.5, vnoise(q + vec2(5.2, t * 0.08) + 3.1) - 0.5);
  vec2 q2 = uv * vec2(7.5, 4.0) + vec2(-t * 0.19, t * 0.13);
  vec2 b = vec2(vnoise(q2 + 1.7) - 0.5, vnoise(q2 + 9.3) - 0.5);
  return a + b * 0.45;
}
void main(){
  int id = gl_VertexID;
  ivec2 ij = ivec2(id % uTexW, id / uTexW);
  vec4 hm = texelFetch(uHome, ij, 0);
  if (hm.w <= 0.0) { gl_Position = vec4(2.0, 2.0, 2.0, 1.0); gl_PointSize = 0.0; vA = 0.0; return; }
  vec4 st = texelFetch(uState, ij, 0);
  // Offsetting the noise clock by depth keeps neighbouring dots out of phase, so
  // the field shimmers instead of sliding as one rigid sheet.
  vec2 amb = ambientField(hm.xy / uRes, uTime + hm.z * 4.0) * 18.0 * uAmbient;
  vec2 p = hm.xy + st.xy + amb;
  vec2 clip = vec2(p.x / uRes.x * 2.0 - 1.0, 1.0 - p.y / uRes.y * 2.0);
  gl_Position = vec4(clip, 0.0, 1.0);
  float sp = length(st.zw);
  gl_PointSize = min(uDot * hm.z * (1.0 + min(sp * 0.03, 2.2)) * uDpr, 26.0);
  vA = clamp(0.26 + hm.z * 0.5 + min(sp * 0.02, 0.5), 0.0, 1.0);
}`;

  const FS_DRAW = `#version 300 es
precision highp float;
in float vA;
uniform vec3 uColor;
out vec4 o;
void main(){
  float d = length(gl_PointCoord - 0.5) * 2.0;
  if (d > 1.0) discard;
  float a = 1.0 - d;
  o = vec4(uColor, a * a * vA);
}`;

  function compile(type, src) {
    const s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s) || "shader");
    return s;
  }
  function program(vs, fs) {
    const p = gl.createProgram();
    gl.attachShader(p, compile(gl.VERTEX_SHADER, vs));
    gl.attachShader(p, compile(gl.FRAGMENT_SHADER, fs));
    gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p) || "link");
    const u = {};
    for (let i = 0; i < gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS); i++) {
      const info = gl.getActiveUniform(p, i);
      u[info.name] = gl.getUniformLocation(p, info.name);
    }
    return { p, u };
  }

  function texture(data) {
    const t = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, t);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA32F, TEX_W, ROWS, 0, gl.RGBA, gl.FLOAT, data);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    return t;
  }
  function target(tex) {
    const fb = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
    return fb;
  }

  let sim, draw, homeTex;
  // Two state textures so the sim never reads the texture it is writing: read
  // A, write B, then swap. Without this the GPU reports a feedback loop. Each
  // texture keeps one framebuffer for its whole life, so nothing leaks per frame.
  let stateA = null, stateB = null, fbA = null, fbB = null;
  try {
    sim = program(VS_QUAD, FS_SIM);
    draw = program(VS_DRAW, FS_DRAW);
  } catch (err) {
    console.error("liquid disabled:", err);
    canvas.remove();
    return;
  }

  const quad = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, quad);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

  const state = new Float32Array(COUNT * 4);
  const home = new Float32Array(COUNT * 4);
  let w = 0, h = 0, dpr = 1, dot = 2;

  // Home positions: a jittered grid with a soft density wave, so the field reads
  // as material rather than a lattice.
  function buildHome() {
    for (let j = 0; j < ROWS; j++) {
      for (let i = 0; i < TEX_W; i++) {
        const k = (j * TEX_W + i) * 4;
        const x = ((i + 0.5 + (Math.random() - 0.5)) / TEX_W) * w;
        const y = ((j + 0.5 + (Math.random() - 0.5)) / ROWS) * h;
        const wave = 0.5 + 0.5 * Math.sin(x * 0.012 + Math.cos(y * 0.017));
        home[k] = x;
        home[k + 1] = y;
        home[k + 2] = 0.45 + wave * 0.95;
        home[k + 3] = 1;
      }
    }
  }

  function resize() {
    const rect = canvas.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = Math.max(1, Math.round(rect.width));
    h = Math.max(1, Math.round(rect.height));
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    gl.viewport(0, 0, canvas.width, canvas.height);
    dot = Math.max(1.6, Math.min(3.2, (w * h) / 900000 + 1.6));
    if (homeTex) gl.deleteTexture(homeTex);
    if (stateA) gl.deleteTexture(stateA);
    if (stateB) gl.deleteTexture(stateB);
    if (fbA) gl.deleteFramebuffer(fbA);
    if (fbB) gl.deleteFramebuffer(fbB);
    buildHome();
    homeTex = texture(home);
    stateA = texture(state);
    stateB = texture(state);
    fbA = target(stateA);
    fbB = target(stateB);
  }

  // Pointer state, in canvas CSS pixels (y down), with an eased presence.
  let mx = -1e4, my = -1e4, px = -1e4, py = -1e4, vx = 0, vy = 0;
  let presence = 0, targetPresence = 0, idle = 0;
  addEventListener(
    "pointermove",
    (e) => {
      const rect = canvas.getBoundingClientRect();
      mx = e.clientX - rect.left;
      my = e.clientY - rect.top;
      targetPresence = 1;
      hero.dataset.touched = "1";
      clearTimeout(idle);
      idle = setTimeout(() => (targetPresence = 0), 1400);
    },
    { passive: true },
  );
  hero.addEventListener("pointerleave", () => (targetPresence = 0));

  // The theme toggle rewrites --fg; pick the new dot colour up on the next frame.
  new MutationObserver(syncColor).observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-theme"],
  });

  let t = 0;
  let last = 0;

  function step(dt) {
    gl.useProgram(sim.p);
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbB);
    gl.viewport(0, 0, TEX_W, ROWS);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, homeTex);
    gl.uniform1i(sim.u.uHome, 0);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, stateA);
    gl.uniform1i(sim.u.uState, 1);
    gl.uniform2f(sim.u.uMouse, mx, my);
    gl.uniform2f(sim.u.uVel, vx, vy);
    gl.uniform1f(sim.u.uPresence, presence);
    gl.uniform1f(sim.u.uRadius, 140);
    gl.uniform1f(sim.u.uStrength, 1);
    gl.uniform1f(sim.u.uReturn, 3.4);
    gl.uniform1f(sim.u.uTurb, reduce ? 0 : 1);
    gl.uniform1f(sim.u.uTime, t);
    gl.uniform1f(sim.u.uDt, dt);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    // B now holds the newest state; make it the source for the next step.
    const swapT = stateA;
    stateA = stateB;
    stateB = swapT;
    const swapF = fbA;
    fbA = fbB;
    fbB = swapF;
  }

  function paint() {
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.useProgram(draw.p);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, homeTex);
    gl.uniform1i(draw.u.uHome, 0);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, stateA);
    gl.uniform1i(draw.u.uState, 1);
    gl.uniform1i(draw.u.uTexW, TEX_W);
    gl.uniform2f(draw.u.uRes, w, h);
    gl.uniform1f(draw.u.uDpr, dpr);
    gl.uniform1f(draw.u.uDot, dot);
    gl.uniform1f(draw.u.uTime, t);
    gl.uniform1f(draw.u.uAmbient, reduce ? 0 : 1);
    gl.uniform3fv(draw.u.uColor, COLOR);
    gl.drawArrays(gl.POINTS, 0, COUNT);
  }

  function frame(now) {
    requestAnimationFrame(frame);
    if (document.hidden) return;
    const dt = Math.min(0.033, last ? (now - last) / 1000 : 0.016);
    last = now;
    t += dt;
    // ease the pointer presence and velocity
    presence += (targetPresence - presence) * 0.08;
    vx += ((mx - px) / Math.max(dt, 0.001) - vx) * 0.2;
    vy += ((my - py) / Math.max(dt, 0.001) - vy) * 0.2;
    px = mx;
    py = my;
    step(dt);
    paint();
  }

  try {
    resize();
    if (reduce) {
      presence = 0;
      for (let i = 0; i < 40; i++) step(0.016); // settle a still frame
      paint();
    } else {
      hero.dataset.gl = "on";
      requestAnimationFrame(frame);
    }
  } catch (err) {
    console.error("liquid failed:", err);
    canvas.remove();
    return;
  }
  if (reduce) hero.dataset.gl = "on";

  let resizeTimer;
  addEventListener(
    "resize",
    () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        try {
          resize();
          if (reduce) paint();
        } catch {
          /* keep the last good frame */
        }
      }, 180);
    },
    { passive: true },
  );
})();
