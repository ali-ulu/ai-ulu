(()=>{const l=document.querySelector(".hero"),i=document.getElementById("liquid");if(!l||!i)return;const v=matchMedia("(prefers-reduced-motion: reduce)").matches,e=i.getContext("webgl2",{alpha:!0,antialias:!1,premultipliedAlpha:!1,powerPreference:"high-performance"});if(!e||!e.getExtension("EXT_color_buffer_float")){i.remove();return}const c=256,d=160,D=c*d;let X=[.086,.086,.078];function L(){const r=getComputedStyle(document.documentElement).getPropertyValue("--fg").trim().match(/^#?([0-9a-f]{6})$/i);if(!r)return;const o=parseInt(r[1],16);X=[(o>>16&255)/255,(o>>8&255)/255,(o&255)/255]}L();const $=`#version 300 es
layout(location=0) in vec2 aPos;
void main(){ gl_Position = vec4(aPos, 0.0, 1.0); }`,I=`
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
}`,K=`#version 300 es
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
${I}
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
}`,Q=`#version 300 es
uniform sampler2D uHome;
uniform sampler2D uState;
uniform int uTexW;
uniform vec2 uRes;
uniform float uDpr;
uniform float uDot;
uniform float uTime;
uniform float uAmbient;
out float vA;
${I}
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
}`,J=`#version 300 es
precision highp float;
in float vA;
uniform vec3 uColor;
out vec4 o;
void main(){
  float d = length(gl_PointCoord - 0.5) * 2.0;
  if (d > 1.0) discard;
  float a = 1.0 - d;
  o = vec4(uColor, a * a * vA);
}`;function O(t,r){const o=e.createShader(t);if(e.shaderSource(o,r),e.compileShader(o),!e.getShaderParameter(o,e.COMPILE_STATUS))throw new Error(e.getShaderInfoLog(o)||"shader");return o}function B(t,r){const o=e.createProgram();if(e.attachShader(o,O(e.VERTEX_SHADER,t)),e.attachShader(o,O(e.FRAGMENT_SHADER,r)),e.linkProgram(o),!e.getProgramParameter(o,e.LINK_STATUS))throw new Error(e.getProgramInfoLog(o)||"link");const g={};for(let m=0;m<e.getProgramParameter(o,e.ACTIVE_UNIFORMS);m++){const S=e.getActiveUniform(o,m);g[S.name]=e.getUniformLocation(o,S.name)}return{p:o,u:g}}function M(t){const r=e.createTexture();return e.bindTexture(e.TEXTURE_2D,r),e.texImage2D(e.TEXTURE_2D,0,e.RGBA32F,c,d,0,e.RGBA,e.FLOAT,t),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MIN_FILTER,e.NEAREST),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MAG_FILTER,e.NEAREST),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_S,e.CLAMP_TO_EDGE),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_T,e.CLAMP_TO_EDGE),r}function q(t){const r=e.createFramebuffer();return e.bindFramebuffer(e.FRAMEBUFFER,r),e.framebufferTexture2D(e.FRAMEBUFFER,e.COLOR_ATTACHMENT0,e.TEXTURE_2D,t,0),r}let n,u,h,a=null,f=null,T=null,s=null;try{n=B($,K),u=B(Q,J)}catch(t){console.error("liquid disabled:",t),i.remove();return}const Z=e.createBuffer();e.bindBuffer(e.ARRAY_BUFFER,Z),e.bufferData(e.ARRAY_BUFFER,new Float32Array([-1,-1,3,-1,-1,3]),e.STATIC_DRAW),e.enableVertexAttribArray(0),e.vertexAttribPointer(0,2,e.FLOAT,!1,0,0);const N=new Float32Array(D*4),p=new Float32Array(D*4);let E=0,R=0,x=1,H=2;function ee(){for(let t=0;t<d;t++)for(let r=0;r<c;r++){const o=(t*c+r)*4,g=(r+.5+(Math.random()-.5))/c*E,m=(t+.5+(Math.random()-.5))/d*R,S=.5+.5*Math.sin(g*.012+Math.cos(m*.017));p[o]=g,p[o+1]=m,p[o+2]=.45+S*.95,p[o+3]=1}}function z(){const t=i.getBoundingClientRect();x=Math.min(window.devicePixelRatio||1,2),E=Math.max(1,Math.round(t.width)),R=Math.max(1,Math.round(t.height)),i.width=Math.round(E*x),i.height=Math.round(R*x),e.viewport(0,0,i.width,i.height),H=Math.max(1.6,Math.min(3.2,E*R/9e5+1.6)),h&&e.deleteTexture(h),a&&e.deleteTexture(a),f&&e.deleteTexture(f),T&&e.deleteFramebuffer(T),s&&e.deleteFramebuffer(s),ee(),h=M(p),a=M(N),f=M(N),T=q(a),s=q(f)}let A=-1e4,b=-1e4,W=-1e4,V=-1e4,w=0,P=0,_=0,F=0,j=0;addEventListener("pointermove",t=>{const r=i.getBoundingClientRect();A=t.clientX-r.left,b=t.clientY-r.top,F=1,l.dataset.touched="1",clearTimeout(j),j=setTimeout(()=>F=0,1400)},{passive:!0}),l.addEventListener("pointerleave",()=>F=0),new MutationObserver(L).observe(document.documentElement,{attributes:!0,attributeFilter:["data-theme"]});let U=0,y=0;function G(t){e.useProgram(n.p),e.bindFramebuffer(e.FRAMEBUFFER,s),e.viewport(0,0,c,d),e.activeTexture(e.TEXTURE0),e.bindTexture(e.TEXTURE_2D,h),e.uniform1i(n.u.uHome,0),e.activeTexture(e.TEXTURE1),e.bindTexture(e.TEXTURE_2D,a),e.uniform1i(n.u.uState,1),e.uniform2f(n.u.uMouse,A,b),e.uniform2f(n.u.uVel,w,P),e.uniform1f(n.u.uPresence,_),e.uniform1f(n.u.uRadius,140),e.uniform1f(n.u.uStrength,1),e.uniform1f(n.u.uReturn,3.4),e.uniform1f(n.u.uTurb,v?0:1),e.uniform1f(n.u.uTime,U),e.uniform1f(n.u.uDt,t),e.drawArrays(e.TRIANGLES,0,3),e.bindFramebuffer(e.FRAMEBUFFER,null);const r=a;a=f,f=r;const o=T;T=s,s=o}function C(){e.viewport(0,0,i.width,i.height),e.clearColor(0,0,0,0),e.clear(e.COLOR_BUFFER_BIT),e.enable(e.BLEND),e.blendFunc(e.SRC_ALPHA,e.ONE_MINUS_SRC_ALPHA),e.useProgram(u.p),e.activeTexture(e.TEXTURE0),e.bindTexture(e.TEXTURE_2D,h),e.uniform1i(u.u.uHome,0),e.activeTexture(e.TEXTURE1),e.bindTexture(e.TEXTURE_2D,a),e.uniform1i(u.u.uState,1),e.uniform1i(u.u.uTexW,c),e.uniform2f(u.u.uRes,E,R),e.uniform1f(u.u.uDpr,x),e.uniform1f(u.u.uDot,H),e.uniform1f(u.u.uTime,U),e.uniform1f(u.u.uAmbient,v?0:1),e.uniform3fv(u.u.uColor,X),e.drawArrays(e.POINTS,0,D)}function k(t){if(requestAnimationFrame(k),document.hidden)return;const r=Math.min(.033,y?(t-y)/1e3:.016);y=t,U+=r,_+=(F-_)*.08,w+=((A-W)/Math.max(r,.001)-w)*.2,P+=((b-V)/Math.max(r,.001)-P)*.2,W=A,V=b,G(r),C()}try{if(z(),v){_=0;for(let t=0;t<40;t++)G(.016);C()}else l.dataset.gl="on",requestAnimationFrame(k)}catch(t){console.error("liquid failed:",t),i.remove();return}v&&(l.dataset.gl="on");let Y;addEventListener("resize",()=>{clearTimeout(Y),Y=setTimeout(()=>{try{z(),v&&C()}catch{}},180)},{passive:!0})})();
