// Vortex background: a twisted tube of particles swirling behind the hero.
// Self-contained (no three.js), sits under the 3D film so the front stays intact.
// No WebGL or reduced motion: the canvas is removed / drawn once as a still frame.
(() => {
  const canvas = document.getElementById("vortex");
  if (!canvas) return;

  const gl = canvas.getContext("webgl", {
    alpha: true,
    antialias: false,
    premultipliedAlpha: false,
    powerPreference: "high-performance",
  });
  if (!gl) {
    canvas.remove();
    return;
  }

  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Tube geometry, in CSS pixels. Waist is narrower than the ends.
  const TOP = 150, WAIST = 74, WP = 0.45, BOTTOM = 170;
  const HH = 1250, ZOOM = 1.0, DEPTHR = 700;
  const TWIST = 2.3;
  const REPR = 210, REPS = 64;
  const DUST = 1300, COMETS = 7, TAIL = 30;
  const DUST_COLOR = [0.87, 0.67, 0.38];
  const COMET_COLOR = [1.0, 0.85, 0.58];

  const place = `
precision highp float;
uniform vec2 uRes;
uniform float uRot,uTwist,uZoom,uOffsetY,uUnit,uHh,uDepthR,uTop,uWaist,uWp,uBottom,uRepR,uRepS;
uniform vec2 uMouse;
uniform float uMouseS;
const float CT=0.961055;
const float ST=0.276356;
float sm(float u){return u*u*(3.0-2.0*u);}
float radiusAt(float t){
  if(t<uWp) return mix(uTop,uWaist,sm(t/uWp));
  return mix(uWaist,uBottom,sm((t-uWp)/(1.0-uWp)));
}
vec3 place(float ph,float wb,float t,float extra,float radial){
  float r=radiusAt(t)*uUnit*(1.0+radial);
  float a=ph+uTwist*t*3.14159265+sin(t*6.0+wb)*0.06+extra+uRot;
  float px=cos(a)*r;
  float pz=sin(a)*r;
  float py=(t-0.5)*uHh;
  float y2=py*CT-pz*ST;
  float z2=py*ST+pz*CT;
  float k=(1100.0/(1100.0+z2))*uZoom;
  vec2 p=vec2(uRes.x*0.5+px*k,uRes.y*0.5+uOffsetY+y2*k);
  if(uMouseS>0.001){
    vec2 d=p-uMouse;
    float dist=length(d);
    if(dist<uRepR && dist>0.01){
      float f=1.0-dist/uRepR;
      f=f*f*(3.0-2.0*f);
      p+=(d/dist)*f*f*uRepS*uMouseS;
    }
  }
  float depth=clamp(0.5-z2/(2.0*uDepthR),0.0,1.0);
  return vec3(p,depth);
}
vec4 toClip(vec2 p){return vec4(p.x/uRes.x*2.0-1.0,1.0-p.y/uRes.y*2.0,0.0,1.0);}
`;

  const dustVS = `${place}
attribute vec4 aA;   // x band, y phase, z wobble, w base t
attribute vec4 aB;   // x flow speed, y twinkle speed, z twinkle phase, w radial
uniform float uTime,uDpr,uFlow,uMaxPt;
varying float vA;
void main(){
  float t=fract(aA.w+uFlow*aB.x);
  vec3 p=place(aA.y,aA.z,t,0.0,aB.w);
  float fl=0.5+0.5*sin(uTime*aB.y+aB.z);
  vA=(0.12+fl*0.55)*(0.28+p.z*0.72);
  float size=(1.5+p.z*2.3)*uDpr;
  gl_PointSize=min(size,uMaxPt);
  gl_Position=toClip(p.xy);
}`;

  const cometVS = `${place}
attribute vec3 aA;   // x comet id, y phase, z wobble
attribute vec2 aB;   // x speed, y tail index
uniform float uFlowC,uDpr,uMaxPt;
varying float vA;
void main(){
  float cp=fract(aA.x*0.37+aB.x*uFlowC);
  float j=aB.y;
  float tt=cp-j*0.0055;
  if(tt<0.0||tt>1.0){
    gl_Position=vec4(2.0,2.0,2.0,1.0);
    gl_PointSize=0.0;
    vA=0.0;
    return;
  }
  vec3 p=place(aA.y,aA.z,tt,0.0,0.0);
  float f=1.0-j/float(${TAIL});
  float dia;
  float a;
  if(j<0.5){ dia=15.0*(0.6+p.z*0.8); a=0.75+p.z*0.25; }
  else{ dia=(1.0+f*3.6)*(0.7+p.z*0.5); a=f*0.7*(0.25+p.z*0.75); }
  vA=a;
  gl_PointSize=min(dia*uDpr,uMaxPt);
  gl_Position=toClip(p.xy);
}`;

  const dotFS = `
precision highp float;
uniform vec3 uColor;
varying float vA;
void main(){
  float d=length(gl_PointCoord-0.5)*2.0;
  if(d>1.0) discard;
  gl_FragColor=vec4(uColor*(1.0-d)*(1.0-d)*vA,1.0);
}`;

  const headFS = `
precision highp float;
uniform vec3 uColor;
varying float vA;
void main(){
  float d=length(gl_PointCoord-0.5)*2.0;
  if(d>1.0) discard;
  gl_FragColor=vec4(uColor*pow(1.0-d,1.6)*vA,1.0);
}`;

  function shader(type, src) {
    const s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
      throw new Error(gl.getShaderInfoLog(s) || "shader compile failed");
    }
    return s;
  }

  function program(vsSrc, fsSrc) {
    const p = gl.createProgram();
    gl.attachShader(p, shader(gl.VERTEX_SHADER, vsSrc));
    gl.attachShader(p, shader(gl.FRAGMENT_SHADER, fsSrc));
    gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) {
      throw new Error(gl.getProgramInfoLog(p) || "program link failed");
    }
    const u = {};
    for (let i = 0; i < gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS); i++) {
      const info = gl.getActiveUniform(p, i);
      u[info.name] = gl.getUniformLocation(p, info.name);
    }
    return { p, u };
  }

  let dust, comet;
  try {
    dust = program(dustVS, dotFS);
    comet = program(cometVS, headFS);
  } catch (err) {
    console.error("vortex disabled:", err);
    canvas.remove();
    return;
  }

  const shared = (u) => {
    gl.uniform1f(u.uTwist, TWIST);
    gl.uniform1f(u.uZoom, ZOOM);
    gl.uniform1f(u.uOffsetY, 0.0);
    gl.uniform1f(u.uUnit, 1.0);
    gl.uniform1f(u.uHh, HH);
    gl.uniform1f(u.uDepthR, DEPTHR);
    gl.uniform1f(u.uTop, TOP);
    gl.uniform1f(u.uWaist, WAIST);
    gl.uniform1f(u.uWp, WP);
    gl.uniform1f(u.uBottom, BOTTOM);
    gl.uniform1f(u.uRepR, REPR);
    gl.uniform1f(u.uRepS, REPS);
  };

  // --- dust buffers ---
  const dA = new Float32Array(DUST * 4);
  const dB = new Float32Array(DUST * 4);
  for (let i = 0; i < DUST; i++) {
    dA[i * 4] = i % 3;                       // band
    dA[i * 4 + 1] = Math.random() * Math.PI * 2; // phase
    dA[i * 4 + 2] = Math.random() * Math.PI * 2; // wobble
    dA[i * 4 + 3] = Math.random();           // base t
    dB[i * 4] = 0.55 + Math.random() * 1.1;  // flow speed
    dB[i * 4 + 1] = 0.4 + Math.random() * 1.6; // twinkle speed
    dB[i * 4 + 2] = Math.random() * Math.PI * 2; // twinkle phase
    dB[i * 4 + 3] = (Math.random() - 0.5) * 0.14; // radial spread
  }
  const dustA = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, dustA);
  gl.bufferData(gl.ARRAY_BUFFER, dA, gl.STATIC_DRAW);
  const dustB = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, dustB);
  gl.bufferData(gl.ARRAY_BUFFER, dB, gl.STATIC_DRAW);

  // --- comet buffers ---
  const total = COMETS * (TAIL + 1);
  const cA = new Float32Array(total * 3);
  const cB = new Float32Array(total * 2);
  for (let c = 0; c < COMETS; c++) {
    const ph = Math.random() * Math.PI * 2;
    const wb = Math.random() * Math.PI * 2;
    const sp = 0.6 + Math.random() * 0.9;
    for (let j = 0; j <= TAIL; j++) {
      const k = c * (TAIL + 1) + j;
      cA[k * 3] = c;
      cA[k * 3 + 1] = ph;
      cA[k * 3 + 2] = wb;
      cB[k * 2] = sp;
      cB[k * 2 + 1] = j;
    }
  }
  const cometA = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, cometA);
  gl.bufferData(gl.ARRAY_BUFFER, cA, gl.STATIC_DRAW);
  const cometB = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, cometB);
  gl.bufferData(gl.ARRAY_BUFFER, cB, gl.STATIC_DRAW);

  let dpr = 1, w = 0, h = 0;
  function resize() {
    const rect = canvas.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = Math.max(1, Math.round(rect.width));
    h = Math.max(1, Math.round(rect.height));
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    gl.viewport(0, 0, canvas.width, canvas.height);
  }
  resize();

  // Pointer repulsion, eased in and out.
  let mx = 0, my = 0, mS = 0, mTarget = 0, mTimer = 0;
  addEventListener("pointermove", (e) => {
    const rect = canvas.getBoundingClientRect();
    mx = e.clientX - rect.left;
    my = e.clientY - rect.top;
    mTarget = 1;
    clearTimeout(mTimer);
    mTimer = setTimeout(() => { mTarget = 0; }, 1600);
  }, { passive: true });

  const bind = (buf, prog, name, size) => {
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    const loc = gl.getAttribLocation(prog.p, name);
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, size, gl.FLOAT, false, 0, 0);
  };

  function frame(now) {
    mS += (mTarget - mS) * 0.06;
    const t = reduce ? 0 : now / 1000;

    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE);

    const maxPt = gl.getParameter(gl.ALIASED_POINT_SIZE_RANGE)[1] || 64;

    gl.useProgram(dust.p);
    shared(dust.u);
    gl.uniform2f(dust.u.uRes, w, h);
    gl.uniform2f(dust.u.uMouse, mx, my);
    gl.uniform1f(dust.u.uMouseS, mS);
    gl.uniform1f(dust.u.uRot, t * 0.05);
    gl.uniform1f(dust.u.uTime, t);
    gl.uniform1f(dust.u.uFlow, t * 0.055);
    gl.uniform1f(dust.u.uDpr, dpr);
    gl.uniform1f(dust.u.uMaxPt, maxPt);
    gl.uniform3fv(dust.u.uColor, DUST_COLOR);
    bind(dustA, dust, "aA", 4);
    bind(dustB, dust, "aB", 4);
    gl.drawArrays(gl.POINTS, 0, DUST);

    gl.useProgram(comet.p);
    shared(comet.u);
    gl.uniform2f(comet.u.uRes, w, h);
    gl.uniform2f(comet.u.uMouse, mx, my);
    gl.uniform1f(comet.u.uMouseS, mS);
    gl.uniform1f(comet.u.uRot, t * 0.05);
    gl.uniform1f(comet.u.uFlowC, t * 0.16);
    gl.uniform1f(comet.u.uDpr, dpr);
    gl.uniform1f(comet.u.uMaxPt, maxPt);
    gl.uniform3fv(comet.u.uColor, COMET_COLOR);
    bind(cometA, comet, "aA", 3);
    bind(cometB, comet, "aB", 2);
    gl.drawArrays(gl.POINTS, 0, total);
  }

  if (reduce) {
    requestAnimationFrame(() => frame(0));
    return;
  }

  let visible = true;
  const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; });
  io.observe(canvas);

  function loop(now) {
    requestAnimationFrame(loop);
    if (document.hidden || !visible) return;
    frame(now);
  }
  requestAnimationFrame(loop);

  addEventListener("resize", resize, { passive: true });
})();
