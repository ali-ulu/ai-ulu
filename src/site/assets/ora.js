// Home page film: a procedural laptop types real code, turns it into a site and comes apart, scrubbed by scroll.
const root = document.documentElement;
const pre = document.getElementById('pre');
const preBar = document.getElementById('preBar');
const prePct = document.getElementById('prePct');
let loaded = 0;
const step = (n) => { if (!pre) return; loaded = Math.max(loaded, n); preBar.style.width = loaded + '%'; prePct.textContent = String(Math.round(loaded)).padStart(3, '0'); };
const finishPre = () => { step(100); if (pre) pre.classList.add('done'); };
// No WebGL or a failed download: show the chapters as a plain column instead of an empty stage.
const fallback = (err) => { root.classList.add('no-3d'); finishPre(); if (err) console.error('3D scene disabled:', err); };

let THREE, RoundedBoxGeometry, RoomEnvironment;
try {
  [THREE, { RoundedBoxGeometry }, { RoomEnvironment }] = await Promise.all([
    import(new URL('./vendor/three/three.module.min.js', import.meta.url)).then((m) => (step(45), m)),
    import(new URL('./vendor/three/RoundedBoxGeometry.js', import.meta.url)).then((m) => (step(60), m)),
    import(new URL('./vendor/three/RoomEnvironment.js', import.meta.url)).then((m) => (step(70), m)),
  ]);
  await document.fonts.ready;
  step(80);
} catch (err) {
  fallback(err);
}

// Mock-site photo (Unsplash licence, see img/KAYNAK.txt); the screen still draws without it.
const photo = THREE ? await (async () => { const im = new Image(); im.src = new URL('./img/gulus.webp', import.meta.url).href; try { await im.decode(); return im; } catch { return null; } })() : null;
let renderer = null;
if (THREE) {
  try {
    renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('gl'), antialias: true, alpha: true, powerPreference: 'high-performance' });
  } catch (err) {
    fallback(err);
  }
}
if (renderer) start();

function start() {
  step(88);
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const ease = (t) => t * t * (3 - 2 * t);
  const seg = (p, a, b) => ease(clamp((p - a) / (b - a)));

  /* ---------- screen texture: code → site ---------- */
  const SW = 1600, SH = 1000;
  const sc = document.createElement('canvas'); sc.width = SW; sc.height = SH;
  const sx = sc.getContext('2d');
  const CODE = [
    ['<','p'],['section ','t'],['class','a'],['="hero"','s'],['>','p'],null,
    ['  <','p'],['h1','t'],['>','p'],['Sağlıklı gülüşler özenli bir bakımla başlar.','x'],['</','p'],['h1','t'],['>','p'],null,
    ['  <','p'],['p','t'],['>','p'],['Modern diş hekimliği, şeffaf fiyat.','x'],['</','p'],['p','t'],['>','p'],null,
    ['  <','p'],['a ','t'],['href','a'],['="https://wa.me/…"','s'],['>','p'],['WhatsApp','x'],['</','p'],['a','t'],['>','p'],null,
    ['</','p'],['section','t'],['>','p'],null,
    null,
    ['.hero ','t'],['{','p'],null,
    ['  display','a'],[': ','p'],['grid','s'],[';','p'],null,
    ['  min-height','a'],[': ','p'],['100svh','s'],[';','p'],null,
    ['  font-family','a'],[': ','p'],['"Instrument Serif"','s'],[';','p'],null,
    ['  background','a'],[': ','p'],['#f1f3ef','s'],[';','p'],null,
    ['}','p'],null,
    null,
    ['<','p'],['script ','t'],['type','a'],['="application/ld+json"','s'],['>','p'],null,
    ['  { ','p'],['"@type"','a'],[': ','p'],['"Dentist"','s'],[', ','p'],['"name"','a'],[': ','p'],['"Lumen Diş"','s'],[' }','p'],null,
    ['</','p'],['script','t'],['>','p'],null,
  ];
  const COL = { p: '#7d8590', t: '#e0a458', a: '#9ecbff', s: '#a5d6a7', x: '#ece7de' };
  const TOTAL = CODE.reduce((n, t) => n + (t ? t[0].length : 0), 0);
  // roundRect is missing in Safari < 16; square corners are an acceptable fallback there.
  const rr = (x, y, w, h, r) => { sx.beginPath(); if (sx.roundRect) sx.roundRect(x, y, w, h, r); else sx.rect(x, y, w, h); };

  function drawCode(frac) {
    sx.fillStyle = '#0d1015'; sx.fillRect(0, 0, SW, SH);
    sx.fillStyle = '#151922'; sx.fillRect(0, 0, SW, 54);
    ['#ff5f57', '#febc2e', '#28c840'].forEach((c, i) => { sx.fillStyle = c; sx.beginPath(); sx.arc(34 + i * 26, 27, 7, 0, 7); sx.fill(); });
    sx.font = '500 20px "JetBrains Mono",monospace'; sx.fillStyle = '#7d8590'; sx.fillText('index.html — ai-ulu', 140, 34);
    sx.font = '400 25px "JetBrains Mono",monospace';
    const lh = 38, top = 104;
    let budget = Math.floor(TOTAL * frac), line = 0, x = 110, cx = 110, cy = top;
    sx.fillStyle = '#3a404a'; sx.fillText('1', 50, top);
    for (const tok of CODE) {
      if (budget <= 0) break;
      if (!tok) { line++; x = 110; cx = x; cy = top + line * lh; sx.fillStyle = '#3a404a'; sx.fillText(String(line + 1), 50, cy); continue; }
      const txt = tok[0].slice(0, budget); budget -= txt.length;
      sx.fillStyle = COL[tok[1]]; sx.fillText(txt, x, top + line * lh);
      x += sx.measureText(txt).width; cx = x; cy = top + line * lh;
    }
    if (frac < 1 && (performance.now() / 500 | 0) % 2 === 0) { sx.fillStyle = '#e0a458'; sx.fillRect(cx + 2, cy - 24, 3, 30); }
  }

  function drawSite(t) {
    // Light editorial clinic page: grotesk headline with an italic serif accent, blurred photo + sharp card.
    const r = (a, b) => seg(t, a, b), up = (k) => (1 - k) * 36;
    const SANS = '"Hanken Grotesk",sans-serif', ACC = 'italic 400 88px "Instrument Serif",serif';
    sx.fillStyle = '#f1f3ef'; sx.fillRect(0, 0, SW, SH);
    sx.save();
    sx.globalAlpha = r(0, .3);
    sx.fillStyle = '#141513'; sx.beginPath(); sx.arc(166, 80, 17, 0, 7); sx.fill();
    sx.fillStyle = '#f1f3ef'; sx.beginPath(); sx.arc(172, 75, 6, 0, 7); sx.fill();
    sx.fillStyle = '#141513'; sx.font = '600 25px ' + SANS; sx.fillText('Lumen Diş', 196, 89);
    sx.strokeStyle = '#d6d9d3'; sx.lineWidth = 2; sx.beginPath(); sx.arc(800, 80, 30, 0, 7); sx.stroke();
    sx.fillStyle = '#141513'; [72, 80, 88].forEach((y, i) => sx.fillRect(787, y - 1, i === 1 ? 20 : 26, 2.5));
    const pg = sx.createLinearGradient(0, 50, 0, 110); pg.addColorStop(0, '#eceee9'); pg.addColorStop(1, '#c6c9c3');
    sx.fillStyle = pg; rr(1222, 50, 228, 60, 30); sx.fill();
    sx.fillStyle = '#141513'; sx.font = '500 22px ' + SANS; sx.fillText('Randevu al  ↗', 1262, 88);

    const k1 = r(.12, .55), iy = 196 + up(k1);
    sx.globalAlpha = k1;
    sx.save(); rr(820, iy, 630, 694, 24); sx.clip();
    if (photo) { sx.filter = 'blur(26px)'; sx.drawImage(photo, 760, iy - 60, 760, 820); sx.filter = 'none'; }
    else { sx.fillStyle = '#d8c3b0'; sx.fillRect(820, iy, 630, 694); }
    sx.fillStyle = 'rgba(241,243,239,.08)'; sx.fillRect(820, iy, 630, 694);
    sx.restore();
    const k2 = r(.3, .75), cy = 346 + up(k2) * 1.6;
    sx.globalAlpha = k2;
    sx.shadowColor = 'rgba(0,0,0,.18)'; sx.shadowBlur = 40; sx.shadowOffsetY = 18;
    sx.fillStyle = '#fff'; sx.fillRect(988, cy, 294, 376); sx.shadowColor = 'transparent';
    if (photo) sx.drawImage(photo, 120, 230, 640, 640, 998, cy + 10, 274, 274);
    sx.fillStyle = '#141513'; sx.font = '700 17px ' + SANS; sx.textAlign = 'center';
    sx.fillText('GÜLÜŞÜNÜZ BURADA BAŞLAR', 1135, cy + 336); sx.textAlign = 'left';

    const k3 = r(.22, .62), hy = 330 + up(k3);
    sx.globalAlpha = k3; sx.letterSpacing = '-2px';
    const line = (parts, y) => { let x = 150; for (const [txt, acc] of parts) {
      sx.font = acc ? ACC : '500 78px ' + SANS; sx.fillStyle = acc ? '#9b9d97' : '#141513';
      sx.fillText(txt, x, y); x += sx.measureText(txt).width; } };
    line([['Sağlıklı gülüşler', 0]], hy);
    line([['özenli', 1], [' bir bakımla', 0]], hy + 88);
    line([['başlar.', 0]], hy + 176);
    sx.letterSpacing = '0px';
    const k4 = r(.45, .82); sx.globalAlpha = k4; sx.fillStyle = '#8b8e88'; sx.font = '400 24px ' + SANS;
    sx.fillText('Modern diş hekimliği, şeffaf fiyat ve', 152, 582 + up(k4));
    sx.fillText('aynı hafta randevuyla rahat bir tedavi.', 152, 616 + up(k4));
    const k5 = r(.58, .95), by = 668 + up(k5); sx.globalAlpha = k5;
    const bg = sx.createLinearGradient(0, by, 0, by + 68); bg.addColorStop(0, '#4a4b48'); bg.addColorStop(1, '#1d1e1c');
    sx.fillStyle = bg; rr(150, by, 236, 68, 34); sx.fill();
    sx.fillStyle = '#f4f5f2'; sx.font = '500 22px ' + SANS; sx.fillText('Hizmetler  ↗', 186, by + 42);
    sx.globalAlpha = r(.75, 1); sx.fillStyle = '#9b9d97'; sx.font = '500 19px ' + SANS;
    sx.fillText('Aynı hafta randevu   ·   Şeffaf fiyat   ·   WhatsApp ile iletişim', 152, 862);
    sx.font = '500 15px ' + SANS; sx.fillText('Örnek tasarım', 152, 950);
    sx.restore();
  }

  /* ---------- 3D laptop ---------- */
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(renderer), .04).texture;
  const camera = new THREE.PerspectiveCamera(32, 1, .1, 100);

  const alu = new THREE.MeshPhysicalMaterial({ color: 0x3a3d43, metalness: 1, roughness: .34, clearcoat: .35, clearcoatRoughness: .4 });
  const aluDark = new THREE.MeshPhysicalMaterial({ color: 0x1d1f23, metalness: .9, roughness: .45 });
  const black = new THREE.MeshStandardMaterial({ color: 0x050506, roughness: .25, metalness: .2 });
  const keyMat = new THREE.MeshStandardMaterial({ color: 0x0b0c0e, roughness: .7 });

  const W = 3.2, D = 2.2, BH = .1, DECK = BH - .03, LH = 2.1;
  const laptop = new THREE.Group(); scene.add(laptop);

  const bottom = new THREE.Mesh(new RoundedBoxGeometry(W, .04, D, 4, .018), aluDark); bottom.position.y = .02; laptop.add(bottom);
  const deck = new THREE.Mesh(new RoundedBoxGeometry(W, DECK, D, 4, .03), alu); deck.position.y = .04 + DECK / 2; laptop.add(deck);
  const well = new THREE.Mesh(new THREE.PlaneGeometry(2.86, 1.0), black); well.rotation.x = -Math.PI / 2; well.position.set(0, DECK / 2 + .001, -.36); deck.add(well);
  const pad = new THREE.Mesh(new RoundedBoxGeometry(1.15, .004, .7, 2, .002), new THREE.MeshPhysicalMaterial({ color: 0x45484e, metalness: .8, roughness: .22 }));
  pad.position.set(0, DECK / 2 + .002, .58); deck.add(pad);

  const keys = new THREE.Group(); laptop.add(keys);
  const keyMesh = new THREE.InstancedMesh(new RoundedBoxGeometry(.165, .03, .165, 2, .012), keyMat, 70);
  const m4 = new THREE.Matrix4(); let ki = 0;
  for (let r = 0; r < 5; r++) for (let c = 0; c < 14; c++) { m4.makeTranslation(-1.33 + c * .205, 0, -.76 + r * .2); keyMesh.setMatrixAt(ki++, m4); }
  keys.add(keyMesh); keys.position.y = BH + .02;

  const hinge = new THREE.Group(); hinge.position.set(0, BH + .02, -D / 2 + .04); laptop.add(hinge);
  const lidShell = new THREE.Mesh(new RoundedBoxGeometry(W, LH, .06, 4, .025), alu); lidShell.position.y = LH / 2; hinge.add(lidShell);
  const bezel = new THREE.Mesh(new RoundedBoxGeometry(W - .04, LH - .04, .012, 3, .006), black); bezel.position.set(0, LH / 2, .036); hinge.add(bezel);
  const tex = new THREE.CanvasTexture(sc); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(2.98, 2.98 * SH / SW), new THREE.MeshBasicMaterial({ map: tex, toneMapped: false }));
  screen.position.set(0, LH / 2 + .02, .044); hinge.add(screen);
  const glass = new THREE.Mesh(new THREE.PlaneGeometry(W - .06, LH - .06), new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: .05, transparent: true, opacity: .06, envMapIntensity: 1.4 }));
  glass.position.set(0, LH / 2, .047); hinge.add(glass);

  const shc = document.createElement('canvas'); shc.width = shc.height = 256;
  const shx = shc.getContext('2d'), rg = shx.createRadialGradient(128, 128, 10, 128, 128, 128);
  rg.addColorStop(0, 'rgba(0,0,0,.75)'); rg.addColorStop(1, 'rgba(0,0,0,0)'); shx.fillStyle = rg; shx.fillRect(0, 0, 256, 256);
  const shadow = new THREE.Mesh(new THREE.PlaneGeometry(6, 4.2), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(shc), transparent: true, depthWrite: false }));
  shadow.rotation.x = -Math.PI / 2; shadow.position.y = -.01; scene.add(shadow);

  const rim = new THREE.DirectionalLight(0xffe2bd, 1.6); rim.position.set(-4, 5, -4); scene.add(rim);
  const fill = new THREE.DirectionalLight(0xbfd3ff, .5); fill.position.set(5, 2, 4); scene.add(fill);
  const glow = new THREE.PointLight(0xe0a458, 0, 5); glow.position.set(0, 1.2, 1.2); scene.add(glow);

  /* ---------- choreography: [progress, camPos, target, lidOpen, explode] ---------- */
  const KEYS = [
    // target.x offsets push the laptop away from the copy column (copy left → laptop right)
    [0.00, [0, 4.2, 10.4], [0, 2.75, 0], 0.00, 0],
    [0.10, [0, 2.8, 8.2], [0, 1.6, 0], 0.45, 0],
    [0.18, [-1.2, 1.7, 6.4], [-1.1, 1.0, 0], 1.00, 0],
    [0.36, [-1.6, 1.5, 5.4], [-1.2, 1.05, 0], 1.00, 0],
    [0.50, [1.6, 1.5, 5.6], [1.2, 1.0, 0], 1.00, 0],
    [0.60, [2.0, 1.8, 6.4], [1.0, 1.0, 0], 1.00, 0],
    [0.70, [6.4, 3.2, 6.6], [-.9, 1.0, -.2], 1.00, 1],
    [0.80, [5.8, 2.8, 7.4], [-.9, 1.0, -.2], 1.00, 1],
    [0.88, [0, 1.7, 7.0], [1.0, 1.0, 0], 1.00, 0],
    [1.00, [0, 1.5, 6.2], [1.1, 1.05, 0], 1.00, 0],
  ];
  let portrait = false;
  const v3 = (a, b, t) => new THREE.Vector3(lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t));
  function pose(p) {
    let i = 0; while (i < KEYS.length - 2 && p > KEYS[i + 1][0]) i++;
    const A = KEYS[i], B = KEYS[i + 1], t = ease(clamp((p - A[0]) / (B[0] - A[0])));
    const pos = v3(A[1], B[1], t), tgt = v3(A[2], B[2], t);
    if (portrait) { // phone: copy sits at the bottom, so centre the laptop and lift it into the upper half
      const k = seg(p, .08, .18); // the hero keeps the laptop low, under the headline
      tgt.x = 0; pos.x *= .6; tgt.y -= .9 * k - .9 * (1 - k); pos.multiplyScalar(1.25);
    }
    return { pos, tgt, lid: lerp(A[3], B[3], t), ex: lerp(A[4], B[4], t) };
  }

  const chapters = [...document.querySelectorAll('.ch')];
  const tags = [...document.querySelectorAll('.tag')];
  const ticks = [...document.querySelectorAll('.prog i')];
  const hint = document.getElementById('hint'), film = document.getElementById('film');
  // Tag anchors on separate corners so labels never stack: Tasarım, Hız, Görünürlük, Dönüşüm.
  const marker = (parent, x, y, z) => { const o = new THREE.Object3D(); o.position.set(x, y, z); parent.add(o); return o; };
  const anchors = [marker(screen, 1.5, .55, 0), marker(keys, 1.45, 0, -.3), marker(glass, 1.55, .95, 0), marker(deck, .58, 0, .58)];
  const tmp = new THREE.Vector3();

  let target = 0, cur = 0, lastScreen = -1, lastDrawn = -1, onScreen = true, raf = 0;
  const readScroll = () => { const r = film.getBoundingClientRect(); target = clamp(-r.top / (r.height - innerHeight)); wake(); };

  function resize() {
    const w = innerWidth, h = innerHeight;
    renderer.setSize(w, h, false); camera.aspect = w / h;
    portrait = w / h < .8;
    camera.fov = portrait ? 50 : 32; camera.updateProjectionMatrix();
    lastDrawn = -1; wake();
  }

  function paintScreen(p) {
    const codeK = seg(p, .14, .42), siteK = seg(p, .42, .58);
    const typing = codeK > 0 && codeK < 1;
    const key = siteK > 0 ? 2 + siteK : codeK;
    if (key === lastScreen && !typing) return false;
    if (siteK <= 0) drawCode(codeK);
    else {
      drawSite(siteK);
      if (siteK < .35) { // scan wipe: the code gives way top → bottom
        const yCut = SH * (siteK / .35);
        sx.save(); sx.beginPath(); sx.rect(0, yCut, SW, SH - yCut); sx.clip(); drawCode(1); sx.restore();
        sx.fillStyle = '#e0a458'; sx.fillRect(0, yCut - 2, SW, 4);
      }
    }
    tex.needsUpdate = true; lastScreen = key;
    return typing; // a blinking caret needs the next frame too
  }

  function paintCopy(p, e) {
    chapters.forEach((el) => {
      const a = +el.dataset.a, b = +el.dataset.b, f = .035;
      const o = Math.min(a === 0 ? 1 : seg(p, a - f, a + f), 1 - seg(p, b - f, b + f));
      el.style.opacity = o;
      el.style.visibility = o > .02 ? 'visible' : 'hidden'; // hidden chapters keep their links out of the tab order
      el.style.transform = (el.id === 'c0' ? 'translate(-50%,-50%) ' : '') + `translateY(${(1 - o) * 24}px)`;
      el.classList.toggle('on', o > .5);
    });
    ticks.forEach((t, i) => t.classList.toggle('on', i === Math.min(4, Math.floor(p * 5))));
    hint.style.opacity = 1 - seg(p, .01, .05);
    const tagO = seg(e, .6, 1);
    tags.forEach((el, i) => {
      el.style.opacity = tagO;
      if (tagO <= 0) return;
      anchors[i].getWorldPosition(tmp); tmp.project(camera);
      el.style.transform = `translate(${((tmp.x * .5 + .5) * innerWidth + 40).toFixed(1)}px,${((-tmp.y * .5 + .5) * innerHeight - 12).toFixed(1)}px)`;
    });
  }

  // Render on demand: only while the eased scroll is still moving or the caret blinks, and never while off screen.
  function frame() {
    raf = 0;
    if (!onScreen) return;
    cur = reduce ? target : cur + (target - cur) * .085;
    if (Math.abs(target - cur) < 1e-4) cur = target;
    const p = cur, P = pose(p), e = P.ex;
    camera.position.copy(P.pos); camera.lookAt(P.tgt);
    hinge.rotation.x = lerp(Math.PI / 2 - .015, -.2, P.lid);
    laptop.rotation.y = Math.sin(p * Math.PI) * .12;
    bottom.position.y = .02 - e * .6;
    keys.position.y = BH + .02 + e * .3;
    lidShell.position.z = -e * .55;
    screen.position.z = .044 + e * .45;
    glass.position.z = .047 + e * .9;
    glow.intensity = seg(p, .42, .55) * 1.2;
    const typing = paintScreen(p);
    if (p !== lastDrawn || typing) {
      paintCopy(p, e);
      renderer.render(scene, camera);
      lastDrawn = p;
    }
    if (cur !== target || typing) wake();
  }
  function wake() { if (!raf && onScreen) raf = requestAnimationFrame(frame); }

  new IntersectionObserver(([entry]) => { onScreen = entry.isIntersecting; wake(); }).observe(film);
  addEventListener('scroll', readScroll, { passive: true });
  addEventListener('resize', resize);
  resize();
  readScroll(); cur = target;
  requestAnimationFrame(() => { frame(); finishPre(); });
}
