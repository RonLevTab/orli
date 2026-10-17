/* ============================================================
   The hero's animated background: petaron.ai's GradFlow stripe.

   The fragment shader is GradFlow's own "stripe" type (gradflow 0.2.0,
   the library petaron.ai's ribbon is drawn with, RelayFlow.tsx there),
   with its grain, run here in plain WebGL so the site stays free of
   dependencies. Same speed, scale and grain as petaron.ai; the three
   colours are Orli's instead of their lime: a near-white mint, the brand
   teal and a soft mint, the way theirs runs pale lime, lime and mint.

   Falls back to a static CSS gradient (class on the section) when
   WebGL is unavailable, and freezes for prefers-reduced-motion.
   ============================================================ */
(function () {
  'use strict';

  var CONFIG = {
    color1: [236, 248, 243], // near-white mint, so the field never vanishes into the page
    color2: [ 20, 184, 166], // --teal-bright #14b8a6
    color3: [168, 232, 208], // soft mint, petaron.ai's own third colour
    speed: 0.4,
    scale: 1.0,
    noise: 0.08,
  };

  var canvas = document.getElementById('heroGradient');
  if (!canvas) return;

  var gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
  if (!gl) {
    // No WebGL — let CSS provide a static gradient instead.
    canvas.closest('.hero').classList.add('hero--nogl');
    return;
  }

  var VERT = 'attribute vec2 p; varying vec2 vUv; void main(){ vUv = p * 0.5 + 0.5; gl_Position = vec4(p, 0.0, 1.0); }';

  // GradFlow's stripeGradient and its grain, verbatim but for the names.
  var FRAG = [
    'precision highp float;',
    'uniform float u_time; uniform vec2 u_res;',
    'uniform vec3 u_c1; uniform vec3 u_c2; uniform vec3 u_c3;',
    'uniform float u_speed; uniform float u_scale; uniform float u_noise;',
    'varying vec2 vUv;',
    'float grainAt(vec2 st){ return fract(sin(dot(st, vec2(12.9898, 78.233))) * 43758.5453); }',
    'vec3 stripe(vec2 uv, float time){',
    '  vec2 p = ((uv * u_res * 2.0 - u_res.xy) / (u_res.x + u_res.y) * 2.0) * u_scale;',
    '  float t = time * 0.7, a = 4.0 * p.y - sin(-p.x * 3.0 + p.y - t);',
    '  a = smoothstep(cos(a) * 0.7, sin(a) * 0.7 + 1.0, cos(a - 4.0 * p.y) - sin(a + 3.0 * p.x));',
    '  vec2 warped = (cos(a) * p + sin(a) * vec2(-p.y, p.x)) * 0.5 + 0.5;',
    '  vec3 color = mix(u_c1, u_c2, warped.x);',
    '  color = mix(color, u_c3, warped.y);',
    '  color *= color + 0.6 * sqrt(color);',
    '  return clamp(color, 0.0, 1.0);',
    '}',
    'void main(){',
    '  float time = u_time * u_speed;',
    '  vec3 color = stripe(vUv, time);',
    '  if (u_noise > 0.001) {',
    '    float g = grainAt(vUv * 200.0 + time * 0.1);',
    '    color *= (1.0 - u_noise * 0.4 + u_noise * g * 0.4);',
    '  }',
    '  gl_FragColor = vec4(color, 1.0);',
    '}',
  ].join('\n');

  function compile(type, src) {
    var s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
      console.error('[hero-gradient]', gl.getShaderInfoLog(s));
      return null;
    }
    return s;
  }

  var vs = compile(gl.VERTEX_SHADER, VERT);
  var fs = compile(gl.FRAGMENT_SHADER, FRAG);
  if (!vs || !fs) { canvas.closest('.hero').classList.add('hero--nogl'); return; }

  var prog = gl.createProgram();
  gl.attachShader(prog, vs);
  gl.attachShader(prog, fs);
  gl.linkProgram(prog);
  gl.useProgram(prog);

  // fullscreen triangle
  var buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  var loc = gl.getAttribLocation(prog, 'p');
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

  var U = {
    time: gl.getUniformLocation(prog, 'u_time'),
    res: gl.getUniformLocation(prog, 'u_res'),
    c1: gl.getUniformLocation(prog, 'u_c1'),
    c2: gl.getUniformLocation(prog, 'u_c2'),
    c3: gl.getUniformLocation(prog, 'u_c3'),
    speed: gl.getUniformLocation(prog, 'u_speed'),
    scale: gl.getUniformLocation(prog, 'u_scale'),
    noise: gl.getUniformLocation(prog, 'u_noise'),
  };
  function rgb(c) { return [c[0] / 255, c[1] / 255, c[2] / 255]; }
  gl.uniform3fv(U.c1, rgb(CONFIG.color1));
  gl.uniform3fv(U.c2, rgb(CONFIG.color2));
  gl.uniform3fv(U.c3, rgb(CONFIG.color3));
  gl.uniform1f(U.speed, CONFIG.speed);
  gl.uniform1f(U.scale, CONFIG.scale);
  gl.uniform1f(U.noise, CONFIG.noise);

  function resize() {
    var dpr = Math.min(window.devicePixelRatio || 1, 1.5); // cap for perf
    var w = Math.floor(canvas.clientWidth * dpr);
    var h = Math.floor(canvas.clientHeight * dpr);
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w; canvas.height = h;
      gl.viewport(0, 0, w, h);
    }
    gl.uniform2f(U.res, canvas.width, canvas.height);
  }
  // resize() reads canvas.clientWidth/Height, which forces layout. It used to
  // run inside frame(), so the shader took a synchronous layout 60 times a
  // second for a size that only changes when the window does.
  resize();
  var resizeTimer = null;
  window.addEventListener('resize', function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(resize, 120);
  });

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var start = performance.now();
  var running = false;
  var elapsed = 0;

  function frame(now) {
    gl.uniform1f(U.time, (now - start) / 1000);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    if (reduce || !running) { running = false; return; }
    requestAnimationFrame(frame);
  }
  function play() {
    if (running || reduce) return;
    running = true;
    // Restart the clock where it stopped, so coming back to the hero doesn't
    // jump the field forward by however long the visitor spent reading below.
    start = performance.now() - elapsed;
    requestAnimationFrame(frame);
  }
  function pause() {
    if (!running) return;
    elapsed = performance.now() - start;
    running = false;
  }

  // A full-viewport fragment shader has no business running while the visitor
  // is three sections down reading the FAQ. Draw one frame so the hero is
  // painted, then animate only while it is actually on screen.
  requestAnimationFrame(frame);
  // The accessibility menu's "stop animations" reaches here (a11y.js): the
  // gradient is the one thing on the page that moves on its own forever.
  var stilled = document.documentElement.classList.contains('a11y-still');
  if (stilled) pause();
  window.addEventListener('orli:motion-still', function () { stilled = true; pause(); });
  window.addEventListener('orli:motion-go', function () { stilled = false; play(); });

  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) {
      if (entries.some(function (e) { return e.isIntersecting; }) && !stilled) play();
      else pause();
    }, { threshold: 0 }).observe(canvas);
  } else {
    play();
  }
})();
