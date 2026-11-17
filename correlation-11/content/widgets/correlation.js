// רכיבים אינטראקטיביים ללומדת "מתאמים".
// בלוקים:  c-scatter (גרף פיזור, עם r ועם קו מגמה לפי הצורך) ·
//          c-explore (מחוון שמשנה את r, והנקודות זזות בהתאם).
// שאלות:   c-guess (משחק "נחשו את המתאם": כמה סבבים, מחוון לניחוש, בשיעור בלבד) ·
//          c-mc / c-numeric (mc ו-numeric רגילות, עם תרשים רשות, ובמבחן הערה "תשובה נכונה / תשובה שגויה" ליד התשובה).
// r מחושב בנוסחת פירסון, כמו PEARSON באקסל.
// נקודות "מיוצרות" (gen) נבנות כך שה-r שלהן יוצא בדיוק הערך המבוקש, וזהות בכל טעינה (seed קבוע).
// הצבעים מגיעים מטוקנים ב-cs4.css. ב-JS יש רק מחלקות, בלי צבעים.

import { registerBlockRenderer, renderBlock } from '../../js/engine/blocks.js';
import { registerQuestionType, renderQuestionExam, renderQuestionPractice } from '../../js/engine/question-types.js';

const NS = 'http://www.w3.org/2000/svg';

function svgEl(tag, attrs, parent, text) {
  const node = document.createElementNS(NS, tag);
  for (const k in attrs) node.setAttribute(k, attrs[k]);
  if (text != null) node.textContent = text;
  if (parent) parent.appendChild(node);
  return node;
}

function el(tag, className, html) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (html !== undefined) node.innerHTML = html;
  return node;
}

const fmt = (v, d = 2) => {
  const s = (Math.round(v * 10 ** d) / 10 ** d).toFixed(d).replace(/\.?0+$/, '');
  return s === '-0' ? '0' : s;
};
const fmtR = (v) => (Math.round(v * 100) / 100).toFixed(2).replace('-0.00', '0.00');

// ===== חישובים =====
const mean = (a) => a.reduce((s, v) => s + v, 0) / a.length;

export function pearson(xs, ys) {
  const mx = mean(xs), my = mean(ys);
  let sxy = 0, sxx = 0, syy = 0;
  xs.forEach((x, i) => {
    const dx = x - mx, dy = ys[i] - my;
    sxy += dx * dy; sxx += dx * dx; syy += dy * dy;
  });
  return sxy / Math.sqrt(sxx * syy);
}

function fitLine(xs, ys) {
  const mx = mean(xs), my = mean(ys);
  let sxy = 0, sxx = 0;
  xs.forEach((x, i) => { sxy += (x - mx) * (ys[i] - my); sxx += (x - mx) ** 2; });
  const b = sxy / sxx;
  return { a: my - b * mx, b };
}

// תיאור מילולי של r: כיוון + עוצמה. אותם ספים כמו בטבלה ביחידה "מקדם המתאם r".
export function describeR(r) {
  const a = Math.abs(r);
  if (a < 0.1) return 'כמעט אין מתאם';
  const dir = r > 0 ? 'חיובי' : 'שלילי';
  if (a >= 0.999) return `מתאם ${dir} מושלם`;
  const str = a < 0.3 ? 'חלש' : a < 0.7 ? 'בינוני' : 'חזק';
  return `מתאם ${dir} ${str}`;
}

// מחולל פסאודו-אקראי קבוע (אותן נקודות בכל טעינה)
function rng(seed) {
  let t = seed >>> 0;
  return () => {
    t += 0x6D2B79F5;
    let x = Math.imul(t ^ (t >>> 15), 1 | t);
    x ^= x + Math.imul(x ^ (x >>> 7), 61 | x);
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}

function standardize(a) {
  const m = mean(a);
  const sd = Math.sqrt(a.reduce((s, v) => s + (v - m) ** 2, 0) / a.length);
  return a.map((v) => (v - m) / sd);
}

// בסיס של שני משתנים "מאונכים" (מתאם 0 בדיוק). מהם בונים כל r.
function basis(n, seed) {
  const rand = rng(seed);
  const normal = () => {
    const u = Math.max(rand(), 1e-9), v = rand();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  };
  const z1 = standardize(Array.from({ length: n }, normal));
  let z2 = Array.from({ length: n }, normal);
  const proj = z2.reduce((s, v, i) => s + v * z1[i], 0) / n;
  z2 = standardize(z2.map((v, i) => v - proj * z1[i]));
  return { z1, z2 };
}

// gen: { r, n = 40, seed = 1, mx = 50, sx = 15, my = 50, sy = 15 }
export function genPoints(g, base) {
  const { z1, z2 } = base || basis(g.n || 40, g.seed || 1);
  const r = Math.max(-1, Math.min(1, g.r));
  const k = Math.sqrt(1 - r * r);
  const mx = g.mx ?? 50, sx = g.sx ?? 15, my = g.my ?? 50, sy = g.sy ?? 15;
  return {
    xs: z1.map((v) => mx + sx * v),
    ys: z1.map((v, i) => my + sy * (r * v + k * z2[i])),
  };
}

function niceStep(range, target = 8) {
  const raw = range / target;
  const p = Math.pow(10, Math.floor(Math.log10(raw)));
  const f = raw / p;
  return (f < 1.5 ? 1 : f < 3 ? 2 : f < 7 ? 5 : 10) * p;
}

function autoDomain(xs, ys, d = {}) {
  const pad = (lo, hi) => { const r = hi - lo || 1; return [lo - r * 0.08, hi + r * 0.08]; };
  const [xa, xb] = pad(Math.min(...xs), Math.max(...xs));
  const [ya, yb] = pad(Math.min(...ys), Math.max(...ys));
  const xstep = d.xstep ?? niceStep(xb - xa);
  const ystep = d.ystep ?? niceStep(yb - ya, 6);
  return {
    x0: d.x0 ?? Math.floor(xa / xstep) * xstep,
    x1: d.x1 ?? Math.ceil(xb / xstep) * xstep,
    y0: d.y0 ?? Math.floor(ya / ystep) * ystep,
    y1: d.y1 ?? Math.ceil(yb / ystep) * ystep,
    xstep, ystep,
  };
}

// ===== שרטוט: מסגרת, צירים ורשת =====
const W = 600, H = 380, L = 70, R = 580, T = 20, B = 316;

function frame(dom, opts = {}) {
  const svg = svgEl('svg', { viewBox: `0 0 ${W} ${H}`, class: 'ltr', role: 'img', 'aria-label': opts.aria || 'גרף פיזור' });
  const sx = (x) => L + ((x - dom.x0) / (dom.x1 - dom.x0)) * (R - L);
  const sy = (y) => B - ((y - dom.y0) / (dom.y1 - dom.y0)) * (B - T);
  const grid = svgEl('g', {}, svg);
  for (let i = 0, t = dom.x0; t <= dom.x1 + 1e-9; i++, t = dom.x0 + i * dom.xstep) {
    svgEl('line', { x1: sx(t), x2: sx(t), y1: T, y2: B, class: 'c-grid' }, grid);
    if (!opts.noTicks) svgEl('text', { x: sx(t), y: B + 22, 'text-anchor': 'middle', class: 'c-tick' }, grid, fmt(t));
  }
  for (let i = 0, t = dom.y0; t <= dom.y1 + 1e-9; i++, t = dom.y0 + i * dom.ystep) {
    svgEl('line', { x1: L, x2: R, y1: sy(t), y2: sy(t), class: 'c-grid' }, grid);
    if (!opts.noTicks) svgEl('text', { x: L - 10, y: sy(t) + 5, 'text-anchor': 'end', class: 'c-tick' }, grid, fmt(t));
  }
  svgEl('line', { x1: L, x2: R, y1: B, y2: B, class: 'c-axis' }, svg);
  svgEl('line', { x1: L, x2: L, y1: T, y2: B, class: 'c-axis' }, svg);
  if (opts.xLabel) svgEl('text', { x: (L + R) / 2, y: B + 52, 'text-anchor': 'middle', class: 'c-axis-title' }, svg, opts.xLabel);
  if (opts.yLabel) svgEl('text', { x: 18, y: (T + B) / 2, 'text-anchor': 'middle', class: 'c-axis-title', transform: `rotate(-90 18 ${(T + B) / 2})` }, svg, opts.yLabel);
  const layers = { lines: svgEl('g', {}, svg), dots: svgEl('g', {}, svg) };
  const clip = (a, b) => {
    let xa = dom.x0, xb = dom.x1;
    if (b !== 0) {
      const xs = [(dom.y0 - a) / b, (dom.y1 - a) / b].sort((p, q) => p - q);
      xa = Math.max(xa, xs[0]);
      xb = Math.min(xb, xs[1]);
    }
    if (xa >= xb) return null;
    return { x1: sx(xa), y1: sy(a + b * xa), x2: sx(xb), y2: sy(a + b * xb) };
  };
  return { svg, sx, sy, layers, clip };
}

function drawTrend(f, xs, ys, cls = 'c-line') {
  f.layers.lines.replaceChildren();
  const { a, b } = fitLine(xs, ys);
  const seg = f.clip(a, b);
  if (seg) svgEl('line', { ...seg, class: cls }, f.layers.lines);
}

function drawDots(f, xs, ys, special = []) {
  f.layers.dots.replaceChildren();
  xs.forEach((x, i) => svgEl('circle', { cx: f.sx(x), cy: f.sy(ys[i]), r: 6, class: special.includes(i) ? 'c-dot c-dot-out' : 'c-dot' }, f.layers.dots));
}

function getData(block) {
  if (block.gen) return genPoints(block.gen);
  return { xs: block.x, ys: block.y };
}

// ===== c-scatter =====
// { type: 'c-scatter', x: [...], y: [...]  ← או gen: { r, n, seed, mx, sx, my, sy },
//   xLabel, yLabel, title, caption,
//   showR: true ← כתיבת r ותיאור מילולי מתחת לגרף · line: true ← קו מגמה ·
//   outliers: [אינדקסים] ← נקודות חריגות באדום · noTicks: true ← בלי מספרים על הצירים (לשאלות "בעין") · domain }
function renderScatter(block) {
  const wrap = el('div', 'block c-chart');
  if (block.title) wrap.appendChild(el('div', 'c-title', block.title));
  const { xs, ys } = getData(block);
  const dom = autoDomain(xs, ys, block.domain);
  const f = frame(dom, { xLabel: block.xLabel, yLabel: block.yLabel, aria: block.title || block.caption, noTicks: block.noTicks });
  if (block.line) drawTrend(f, xs, ys);
  drawDots(f, xs, ys, block.outliers || []);
  const host = el('div', 'c-svg');
  host.appendChild(f.svg);
  wrap.appendChild(host);
  if (block.showR) {
    const r = pearson(xs, ys);
    wrap.appendChild(el('div', 'c-r', `<b class="ltr">r = ${fmtR(r)}</b> · ${describeR(r)}`));
  }
  if (block.caption) wrap.appendChild(el('div', 'c-caption', block.caption));
  return wrap;
}

// ===== c-explore =====
// { type: 'c-explore', start: 0.5, n: 50, seed: 7, xLabel, yLabel, caption }
// מחוון ל-r מ-1- עד 1. הנקודות זזות, ומתחת: r, תיאור מילולי, ופס שמראה איפה r נמצא על הסקאלה.
function renderExplore(block) {
  const wrap = el('div', 'block c-chart c-explore');
  const base = basis(block.n || 50, block.seed || 7);
  const dom = { x0: 0, x1: 100, xstep: 10, y0: 0, y1: 100, ystep: 10 };
  const f = frame(dom, { xLabel: block.xLabel || 'X', yLabel: block.yLabel || 'Y', aria: 'גרף פיזור שמשתנה לפי r', noTicks: true });
  const host = el('div', 'c-svg');
  host.appendChild(f.svg);

  const controls = el('div', 'c-controls');
  const row = el('div', 'c-slider');
  const lab = el('label', 'c-slider-label');
  const out = el('b', 'ltr');
  lab.append(el('span', '', 'r: '), out);
  const slider = el('input', 'c-range');
  Object.assign(slider, { type: 'range', min: -1, max: 1, step: 0.05, value: block.start ?? 0.5 });
  slider.setAttribute('dir', 'ltr');
  slider.setAttribute('aria-label', 'מקדם המתאם r');
  row.append(lab, slider);
  const lineToggle = el('label', 'c-check');
  const cb = el('input');
  cb.type = 'checkbox';
  lineToggle.append(cb, el('span', '', 'הצגת קו מגמה'));
  controls.append(row, lineToggle);

  const scale = el('div', 'c-scale ltr');
  scale.innerHTML = '<div class="c-scale-bar"><i class="c-scale-mark"></i></div><div class="c-scale-labels"><span>-1</span><span>0</span><span>1</span></div>';
  const mark = scale.querySelector('.c-scale-mark');
  const readout = el('div', 'c-readout');

  function update() {
    const r = +slider.value;
    const { xs, ys } = genPoints({ r }, base);
    drawDots(f, xs, ys);
    if (cb.checked) drawTrend(f, xs, ys); else f.layers.lines.replaceChildren();
    out.textContent = fmtR(r);
    mark.style.insetInlineStart = `${((r + 1) / 2) * 100}%`;
    readout.innerHTML = `<b class="ltr">r = ${fmtR(r)}</b> · ${describeR(r)}`;
  }
  slider.addEventListener('input', update);
  cb.addEventListener('change', update);
  update();

  wrap.append(host, controls, scale, readout);
  if (block.caption) wrap.appendChild(el('div', 'c-caption', block.caption));
  return wrap;
}

registerBlockRenderer('c-scatter', renderScatter);
registerBlockRenderer('c-explore', renderExplore);

// ===== c-guess: נחשו את המתאם =====
// { type: 'c-guess', prompt, rounds: [ { r, seed }, ... ], tolerance: 0.15, doneText }
// בכל סבב: גרף פיזור בלי מספרים, מחוון לניחוש, כפתור בדיקה. אחרי הבדיקה רואים את ה-r האמיתי.
// מספיק לעבור את כל הסבבים (גם ניחוש רחוק נחשב). בסוף: כמה ניחושים היו קרובים.
function practiceGuess(q, onSolved) {
  const wrap = el('div', 'question-block c-guess');
  const tol = q.tolerance ?? 0.15;
  wrap.appendChild(el('div', 'question-prompt', q.prompt));
  const status = el('div', 'c-round');
  const host = el('div', 'c-svg');
  const dom = { x0: -3, x1: 3, xstep: 1, y0: -3, y1: 3, ystep: 1 };

  const row = el('div', 'c-slider');
  const lab = el('label', 'c-slider-label');
  const out = el('b', 'ltr');
  lab.append(el('span', '', 'הניחוש שלכם: '), out);
  const slider = el('input', 'c-range');
  Object.assign(slider, { type: 'range', min: -1, max: 1, step: 0.05, value: 0 });
  slider.setAttribute('dir', 'ltr');
  slider.setAttribute('aria-label', 'הניחוש ל-r');
  row.append(lab, slider);
  const btn = el('button', 'btn btn-primary', 'בדיקה');
  const controls = el('div', 'c-controls');
  controls.append(row, btn);
  const feedback = el('div', 'feedback');

  let i = 0, close = 0, checked = false;
  const show = () => {
    const rd = q.rounds[i];
    const { xs, ys } = genPoints({ r: rd.r, seed: rd.seed || i + 11, n: rd.n || 40, mx: 0, sx: 1, my: 0, sy: 1 });
    const f = frame(dom, { aria: `סבב ${i + 1}: גרף פיזור`, noTicks: true });
    drawDots(f, xs, ys);
    host.replaceChildren(f.svg);
    status.textContent = `סבב ${i + 1} מתוך ${q.rounds.length}`;
    slider.value = 0;
    slider.disabled = false;
    out.textContent = fmtR(0);
    btn.textContent = 'בדיקה';
    feedback.className = 'feedback';
    feedback.textContent = '';
    checked = false;
  };
  slider.addEventListener('input', () => { out.textContent = fmtR(+slider.value); });
  btn.addEventListener('click', () => {
    if (!checked) {
      const real = q.rounds[i].r, guess = +slider.value;
      const diff = Math.abs(real - guess);
      checked = true;
      slider.disabled = true;
      if (diff <= tol) close++;
      feedback.className = diff <= tol ? 'feedback ok' : 'feedback hint';
      feedback.innerHTML = `ה-r האמיתי: <b class="ltr">${fmtR(real)}</b> (${describeR(real)}). ` +
        (diff <= tol ? 'ניחוש קרוב מאוד! 🎯' : `הפרש של <span class="ltr">${fmtR(diff)}</span>. ${Math.sign(real) !== Math.sign(guess) && Math.abs(real) > 0.1 ? 'שימו לב לכיוון: האם הענן עולה או יורד?' : 'שימו לב כמה הנקודות צמודות לקו דמיוני.'}`);
      if (i === q.rounds.length - 1) {
        btn.disabled = true;
        feedback.innerHTML += `<div class="c-done">${q.doneText || 'סיימתם את כל הסבבים.'} ניחושים קרובים: <b class="ltr">${close}/${q.rounds.length}</b></div>`;
        onSolved(true);
      } else {
        btn.textContent = 'לסבב הבא';
      }
    } else {
      i++;
      show();
    }
  });

  wrap.append(status, host, controls, feedback);
  show();
  return wrap;
}

registerQuestionType('c-guess', { practice: practiceGuess });

// ===== שאלה עם תרשים =====
// mc ו-numeric רגילות, עם שדה chart רשות (בלוק c-scatter או כל בלוק אחר) שמוצג לפני השאלה.
// במבחן מופיעה ליד כל תשובה, אחרי הבדיקה, הערה אם היא נכונה.
function withChart(baseType) {
  return {
    practice: (q, onSolved) => {
      const wrap = el('div');
      if (q.chart) wrap.appendChild(renderBlock(q.chart));
      wrap.appendChild(renderQuestionPractice({ ...q, type: baseType }, onSolved));
      return wrap;
    },
    exam: (q, index) => {
      const r = renderQuestionExam({ ...q, type: baseType }, index);
      if (q.chart) r.el.querySelector('.question-prompt').after(renderBlock(q.chart));
      return {
        ...r,
        reveal: () => {
          const result = r.reveal();
          r.el.appendChild(el('div', `c-verdict ${result.isCorrect ? 'ok' : 'bad'}`, result.isCorrect ? '✓ תשובה נכונה' : '✗ תשובה שגויה'));
          return result;
        },
      };
    },
  };
}

registerQuestionType('c-mc', withChart('mc'));
registerQuestionType('c-numeric', withChart('numeric'));
