/* ============================================================
   Animated "stripe-like" gradient shader for the hero background.

   A dependency-free vanilla-WebGL reimplementation of the GradFlow
   React component the user referenced (gradflow.meera.dev) — same
   flowing 3-colour stripe field + grain, driven by simplex noise.
   Config mirrors the snippet that was provided.

   Falls back to a static CSS gradient (class on the section) when
   WebGL is unavailable, and freezes for prefers-reduced-motion.
   ============================================================ */
(function () {
  'use strict';

  // --- config (softened from the provided GradFlow snippet: same hues, pastel
  // tints so the contrast is gentle instead of neon) ---
  var CONFIG = {
    color1: [244, 242, 236], // soft cream-white
    color2: [152, 226, 214], // soft mint / aqua
    color3: [190, 170, 228], // soft lilac
    speed: 0.35,
    scale: 1.0,
    noise: 0.05,
  };

  var canvas = document.getElementById('heroGradient');
  if (!canvas) return;

  var gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
  if (!gl) {
    // No WebGL — let CSS provide a static gradient instead.
    canvas.closest('.hero').classList.add('hero--nogl');
    return;
  }

  var VERT = 'attribute vec2 p; void main(){ gl_Position = vec4(p, 0.0, 1.0); }';

  var FRAG = [
    'precision highp float;',
    'uniform float u_time; uniform vec2 u_res;',
    'uniform vec3 u_c1; uniform vec3 u_c2; uniform vec3 u_c3;',
    'uniform float u_speed; uniform float u_scale; uniform float u_noise;',
    // Ashima simplex noise 2D
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
    // stripe banding driven by position + flowing noise
    '  float band = sin((uv.x*2.2 + uv.y*0.6 + flow*1.4 + t*0.6) * 3.14159265);',
    '  float v = clamp(0.5 + 0.5*band + 0.15*flow, 0.0, 1.0);',
    '  vec3 col = mix(u_c1, u_c2, smoothstep(0.0, 0.55, v));',
    '  col = mix(col, u_c3, smoothstep(0.5, 1.0, v));',
    '  col += (rand(gl_FragCoord.xy + t) - 0.5) * u_noise;', // grain
    '  gl_FragColor = vec4(col, 1.0);',
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
  window.addEventListener('resize', resize);

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var start = performance.now();

  function frame(now) {
    resize();
    gl.uniform1f(U.time, (now - start) / 1000);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    if (!reduce) requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();
