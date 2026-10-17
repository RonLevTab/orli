/* ===========================================================
   The ribbon: the flowing stripe gradient behind every page, after
   petaron.ai's GradFlow ribbon (RelayFlow.tsx there). One WebGL canvas,
   sticky in the viewport inside a layer as tall as the page; the layer
   carries an SVG mask with the ribbon drawn in page coordinates, so
   scrolling moves the ribbon with the page while the colours keep
   flowing inside it. The mask is the page's head (the element carrying
   data-flow-head, usually the hero) and, on a page whose <main> carries
   data-flow-snake, a band that snakes left and right down the rest of
   the page. Rebuilt whenever the page changes size.

   The shader is the stripe field that used to fill the hero alone
   (hero-gradient.js), in the brand's own tones. Holds still under
   prefers-reduced-motion and the accessibility menu's motion off, and
   stops drawing while the tab is hidden or, on a page without the
   snake, once the head has scrolled away.
   =========================================================== */
(function () {
  'use strict';

  var main = document.querySelector('main');
  if (!main) return;
  var head = document.querySelector('[data-flow-head]');
  var snake = main.hasAttribute('data-flow-snake');

  var layer = document.createElement('div');
  layer.className = 'page-flow';
  layer.setAttribute('aria-hidden', 'true');
  var screen = document.createElement('div');
  screen.className = 'page-flow-screen';
  var canvas = document.createElement('canvas');
  screen.appendChild(canvas);
  layer.appendChild(screen);
  main.insertBefore(layer, main.firstChild);

  var gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
  if (!gl) { layer.classList.add('page-flow--nogl'); return; }

  // Three tones from the brand tokens, light -> mid -> deep, so the field
  // has real range and never vanishes into the cream page.
  var CONFIG = {
    color1: [247, 245, 239],
    color2: [152, 226, 214],
    color3: [90, 158, 150],
    speed: 0.35,
    scale: 1.0,
    noise: 0.05
  };

  var VERT = 'attribute vec2 p; void main(){ gl_Position = vec4(p, 0.0, 1.0); }';
  var FRAG = [
    'precision highp float;',
    'uniform float u_time; uniform vec2 u_res;',
    'uniform vec3 u_c1; uniform vec3 u_c2; uniform vec3 u_c3;',
    'uniform float u_speed; uniform float u_scale; uniform float u_noise;',
    'vec3 mod289(vec3 x){return x - floor(x*(1.0/289.0))*289.0;}',
    'vec2 mod289(vec2 x){return x - floor(x*(1.0/289.0))*289.0;}',
    'vec3 permute(vec3 x){return mod289(((x*34.0)+1.0)*x);}',
    'float snoise(vec2 v){',
    '  const vec4 C = vec4(0.211324865405187,0.366025403784439,-0.577350269189626,0.024390243902439);',
    '  vec2 i = floor(v + dot(v, C.yy));',
    '  vec2 x0 = v - i + dot(i, C.xx);',
    '  vec2 i1 = (x0.x > x0.y) ? vec2(1.0,0.0) : vec2(0.0,1.0);',
    '  vec4 x12 = x0.xyxy + C.xxzz; x12.xy -= i1;',
    '  i = mod289(i);',
    '  vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));',
    '  vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);',
    '  m = m*m; m = m*m;',
    '  vec3 x = 2.0 * fract(p * C.www) - 1.0;',
    '  vec3 h = abs(x) - 0.5; vec3 ox = floor(x + 0.5); vec3 a0 = x - ox;',
    '  m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);',
    '  vec3 g; g.x = a0.x * x0.x + h.x * x0.y; g.yz = a0.yz * x12.xz + h.yz * x12.yw;',
    '  return 130.0 * dot(m, g);',
    '}',
    'float rand(vec2 co){ return fract(sin(dot(co, vec2(12.9898,78.233))) * 43758.5453); }',
    'void main(){',
    '  vec2 uv = gl_FragCoord.xy / u_res.xy;',
    '  float aspect = u_res.x / u_res.y;',
    '  vec2 p = vec2(uv.x*aspect, uv.y) * u_scale;',
    '  float t = u_time * u_speed;',
    '  float n1 = snoise(p*1.2 + vec2(t*0.35, t*0.18));',
    '  float n2 = snoise(p*2.3 + vec2(-t*0.22, t*0.27));',
    '  float flow = 0.6*n1 + 0.4*n2;',
    '  float band = sin((uv.x*2.2 + uv.y*0.6 + flow*1.4 + t*0.6) * 3.14159265);',
    '  float v = clamp(0.5 + 0.5*band + 0.15*flow, 0.0, 1.0);',
    '  vec3 col = mix(u_c1, u_c2, smoothstep(0.0, 0.55, v));',
    '  col = mix(col, u_c3, smoothstep(0.5, 1.0, v));',
    '  col += (rand(gl_FragCoord.xy + t) - 0.5) * u_noise;',
    '  gl_FragColor = vec4(col, 1.0);',
    '}'
  ].join('\n');

  function compile(type, src) {
    var s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) { console.error('[flow]', gl.getShaderInfoLog(s)); return null; }
    return s;
  }
  var vs = compile(gl.VERTEX_SHADER, VERT);
  var fs = compile(gl.FRAGMENT_SHADER, FRAG);
  if (!vs || !fs) { layer.classList.add('page-flow--nogl'); return; }
  var prog = gl.createProgram();
  gl.attachShader(prog, vs); gl.attachShader(prog, fs); gl.linkProgram(prog); gl.useProgram(prog);
  var buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  var loc = gl.getAttribLocation(prog, 'p');
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  var U = {
    time: gl.getUniformLocation(prog, 'u_time'), res: gl.getUniformLocation(prog, 'u_res'),
    c1: gl.getUniformLocation(prog, 'u_c1'), c2: gl.getUniformLocation(prog, 'u_c2'), c3: gl.getUniformLocation(prog, 'u_c3'),
    speed: gl.getUniformLocation(prog, 'u_speed'), scale: gl.getUniformLocation(prog, 'u_scale'), noise: gl.getUniformLocation(prog, 'u_noise')
  };
  function rgb(c) { return [c[0] / 255, c[1] / 255, c[2] / 255]; }
  gl.uniform3fv(U.c1, rgb(CONFIG.color1)); gl.uniform3fv(U.c2, rgb(CONFIG.color2)); gl.uniform3fv(U.c3, rgb(CONFIG.color3));
  gl.uniform1f(U.speed, CONFIG.speed); gl.uniform1f(U.scale, CONFIG.scale); gl.uniform1f(U.noise, CONFIG.noise);

  function resize() {
    var dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    var w = Math.floor(canvas.clientWidth * dpr);
    var h = Math.floor(canvas.clientHeight * dpr);
    if (!w || !h) return;
    if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; gl.viewport(0, 0, w, h); }
    gl.uniform2f(U.res, canvas.width, canvas.height);
  }

  // ---- the mask: the head, then the ribbon snaking out of it ----
  // The ribbon's path below the head: [share of the width, share of the rest].
  // Mirrored from petaron.ai's, which was drawn for a left-to-right page.
  var BENDS = [[0.18, 0.04], [0.76, 0.15], [0.86, 0.27], [0.22, 0.39], [0.14, 0.51], [0.78, 0.63], [0.84, 0.75], [0.28, 0.86], [0.45, 0.96]];
  function curve(pts) {
    var p = function (i) { return pts[Math.max(0, Math.min(pts.length - 1, i))]; };
    var d = 'M' + pts[0][0].toFixed(1) + ' ' + pts[0][1].toFixed(1);
    for (var i = 0; i < pts.length - 1; i++) {
      var a = p(i - 1), b = p(i), c = p(i + 1), e = p(i + 2);
      var c1 = [b[0] + (c[0] - a[0]) / 6, b[1] + (c[1] - a[1]) / 6];
      var c2 = [c[0] - (e[0] - b[0]) / 6, c[1] - (e[1] - b[1]) / 6];
      d += ' C' + c1[0].toFixed(1) + ' ' + c1[1].toFixed(1) + ' ' + c2[0].toFixed(1) + ' ' + c2[1].toFixed(1) + ' ' + c[0].toFixed(1) + ' ' + c[1].toFixed(1);
    }
    return d;
  }
  function ribbonMask(W, H, headH) {
    var band = Math.max(170, Math.min(340, W * 0.21));
    var soft = band * 0.22;
    var rest = H - headH;
    var pts = [[W * 0.3, headH * 0.42]].concat(BENDS.map(function (b) { return [W * b[0], headH + rest * b[1]]; }));
    var svg = '<svg xmlns="http://www.w3.org/2000/svg" width="' + W + '" height="' + H + '" viewBox="0 0 ' + W + ' ' + H + '">' +
      '<defs><linearGradient id="h" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff"/><stop offset="0.55" stop-color="#fff"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>' +
      '<filter id="s" filterUnits="userSpaceOnUse" x="' + (-band) + '" y="' + (-band) + '" width="' + (W + band * 2) + '" height="' + (H + band * 2) + '"><feGaussianBlur stdDeviation="' + soft.toFixed(1) + '"/></filter></defs>' +
      '<rect width="' + W + '" height="' + headH + '" fill="url(#h)"/>' +
      (snake ? '<path d="' + curve(pts) + '" fill="none" stroke="#fff" stroke-width="' + band.toFixed(0) + '" stroke-linecap="round" stroke-linejoin="round" filter="url(#s)"/>' : '') +
      '</svg>';
    return 'url("data:image/svg+xml,' + encodeURIComponent(svg) + '")';
  }
  var size = '';
  function build() {
    var W = Math.round(layer.clientWidth), H = Math.round(layer.clientHeight);
    var top = layer.getBoundingClientRect().top;
    var headH = head ? Math.round(head.getBoundingClientRect().bottom - top) : Math.round(window.innerHeight * 0.9);
    var key = W + 'x' + H + 'x' + headH;
    if (!W || !H || key === size) return;
    size = key;
    var m = ribbonMask(W, H, headH);
    layer.style.maskImage = m; layer.style.webkitMaskImage = m;
    layer.classList.add('is-ready');
    resize();
  }
  build();
  if ('ResizeObserver' in window) {
    new ResizeObserver(function () { build(); resize(); }).observe(main);
  }
  var resizeTimer = null;
  window.addEventListener('resize', function () { clearTimeout(resizeTimer); resizeTimer = setTimeout(function () { build(); resize(); }, 120); });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(build);

  // ---- the clock ----
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var start = performance.now(), running = false, elapsed = 0;
  var stilled = document.documentElement.classList.contains('a11y-still');
  var headAway = false;
  function frame(now) {
    gl.uniform1f(U.time, (now - start) / 1000);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    if (reduce || !running) { running = false; return; }
    requestAnimationFrame(frame);
  }
  function play() {
    if (running || reduce || stilled || headAway || document.hidden) return;
    running = true; start = performance.now() - elapsed; requestAnimationFrame(frame);
  }
  function pause() { if (!running) return; elapsed = performance.now() - start; running = false; }
  requestAnimationFrame(frame);
  window.addEventListener('orli:motion-still', function () { stilled = true; pause(); });
  window.addEventListener('orli:motion-go', function () { stilled = false; play(); });
  document.addEventListener('visibilitychange', function () { if (document.hidden) pause(); else play(); });
  // Without the snake there is nothing to flow once the head is gone.
  if (!snake && head && 'IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) {
      headAway = !entries.some(function (e) { return e.isIntersecting; });
      if (headAway) pause(); else play();
    }, { threshold: 0 }).observe(head);
  }
  play();
})();
