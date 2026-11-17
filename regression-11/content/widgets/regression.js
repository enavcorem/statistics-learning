// רכיבים אינטראקטיביים ללומדת "רגרסיה לינארית".
// בלוקים:  r-scatter (גרף פיזור, עם קו רגרסיה, מרחקים וחריגים לפי הצורך) ·
//          r-predict (גרף עם מחוון: חיזוי ערך לפי הקו, כמו FORECAST).
// שאלות:   r-fit (מזיזים קו בעצמם עד שהוא עובר הכי קרוב לנקודות) ·
//          r-mc / r-numeric (mc ו-numeric רגילות, עם תרשים רשות, ובמבחן הערה "תשובה נכונה / תשובה שגויה" ליד התשובה).
// קו הרגרסיה מחושב בשיטת הריבועים הפחותים, כמו SLOPE ו-INTERCEPT באקסל.
// הצבעים מגיעים מטוקנים ב-cs3.css. ב-JS יש רק מחלקות, בלי צבעים.

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

const fmt = (v, d = 2) => String(Math.round(v * 10 ** d) / 10 ** d);

// שיפוע וחותך בשיטת הריבועים הפחותים (SLOPE / INTERCEPT)
export function fitLine(xs, ys) {
  const n = xs.length;
  const mx = xs.reduce((s, v) => s + v, 0) / n;
  const my = ys.reduce((s, v) => s + v, 0) / n;
  let sxy = 0, sxx = 0;
  xs.forEach((x, i) => { sxy += (x - mx) * (ys[i] - my); sxx += (x - mx) ** 2; });
  const b = sxy / sxx;
  return { b, a: my - b * mx, mx, my };
}

function sse(xs, ys, a, b) {
  return xs.reduce((s, x, i) => s + (ys[i] - (a + b * x)) ** 2, 0);
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

function frame(dom, xLabel, yLabel, ariaLabel) {
  const svg = svgEl('svg', { viewBox: `0 0 ${W} ${H}`, class: 'ltr', role: 'img', 'aria-label': ariaLabel || 'גרף פיזור' });
  const sx = (x) => L + ((x - dom.x0) / (dom.x1 - dom.x0)) * (R - L);
  const sy = (y) => B - ((y - dom.y0) / (dom.y1 - dom.y0)) * (B - T);
  const grid = svgEl('g', {}, svg);
  for (let i = 0, t = dom.x0; t <= dom.x1 + 1e-9; i++, t = dom.x0 + i * dom.xstep) {
    svgEl('line', { x1: sx(t), x2: sx(t), y1: T, y2: B, class: 'r-grid' }, grid);
    svgEl('text', { x: sx(t), y: B + 22, 'text-anchor': 'middle', class: 'r-tick' }, grid, fmt(t));
  }
  for (let i = 0, t = dom.y0; t <= dom.y1 + 1e-9; i++, t = dom.y0 + i * dom.ystep) {
    svgEl('line', { x1: L, x2: R, y1: sy(t), y2: sy(t), class: 'r-grid' }, grid);
    svgEl('text', { x: L - 10, y: sy(t) + 5, 'text-anchor': 'end', class: 'r-tick' }, grid, fmt(t));
  }
  svgEl('line', { x1: L, x2: R, y1: B, y2: B, class: 'r-axis' }, svg);
  svgEl('line', { x1: L, x2: L, y1: T, y2: B, class: 'r-axis' }, svg);
  if (xLabel) svgEl('text', { x: (L + R) / 2, y: B + 52, 'text-anchor': 'middle', class: 'r-axis-title' }, svg, xLabel);
  if (yLabel) svgEl('text', { x: 18, y: (T + B) / 2, 'text-anchor': 'middle', class: 'r-axis-title', transform: `rotate(-90 18 ${(T + B) / 2})` }, svg, yLabel);
  // שכבות: מרחקים מתחת לקו, נקודות מעל
  const layers = {
    resid: svgEl('g', {}, svg),
    lines: svgEl('g', {}, svg),
    dots: svgEl('g', {}, svg),
    top: svgEl('g', {}, svg),
  };
  // קו נחתך לגבולות הגרף כדי שלא יצא מהמסגרת
  const clip = (a, b) => {
    let xa = dom.x0, xb = dom.x1;
    const yAt = (x) => a + b * x;
    if (b !== 0) {
      const xs = [(dom.y0 - a) / b, (dom.y1 - a) / b].sort((p, q) => p - q);
      xa = Math.max(xa, xs[0]);
      xb = Math.min(xb, xs[1]);
    }
    if (xa >= xb) return null;
    return { x1: sx(xa), y1: sy(yAt(xa)), x2: sx(xb), y2: sy(yAt(xb)) };
  };
  return { svg, sx, sy, layers, clip };
}

function drawLine(f, a, b, cls) {
  const seg = f.clip(a, b);
  if (seg) svgEl('line', { ...seg, class: cls }, f.layers.lines);
}

function drawResiduals(f, xs, ys, a, b) {
  xs.forEach((x, i) => svgEl('line', { x1: f.sx(x), x2: f.sx(x), y1: f.sy(ys[i]), y2: f.sy(a + b * x), class: 'r-resid' }, f.layers.resid));
}

function drawDots(f, xs, ys, special = []) {
  xs.forEach((x, i) => svgEl('circle', { cx: f.sx(x), cy: f.sy(ys[i]), r: 6, class: special.includes(i) ? 'r-dot r-dot-out' : 'r-dot' }, f.layers.dots));
}

function legend(items) {
  const row = el('div', 'r-legend');
  items.forEach(([cls, text]) => {
    const it = el('span', 'r-legend-item');
    it.append(el('i', `r-key ${cls}`), el('span', '', text));
    row.appendChild(it);
  });
  return row;
}

// ===== r-scatter =====
// { type: 'r-scatter', x: [...], y: [...], xLabel, yLabel, title, caption,
//   line: true ← קו רגרסיה של כל הנקודות · resid: true ← מרחקים מהקו ·
//   outliers: [אינדקסים] ← נקודות חריגות באדום, וקו מקווקו שמחושב בלעדיהן ·
//   showEq: true ← כתיבת השיפוע והחותך מתחת לגרף · domain: { x0, x1, xstep, y0, y1, ystep } }
function renderScatter(block) {
  const wrap = el('div', 'block r-chart');
  if (block.title) wrap.appendChild(el('div', 'r-title', block.title));
  const xs = block.x, ys = block.y;
  const dom = autoDomain(xs, ys, block.domain);
  const f = frame(dom, block.xLabel, block.yLabel, block.title || block.caption);
  const fit = fitLine(xs, ys);
  const keys = [];
  if (block.line) {
    drawLine(f, fit.a, fit.b, 'r-line');
    keys.push(['r-key-line', block.outliers ? 'קו רגרסיה עם החריג' : 'קו הרגרסיה']);
  }
  if (block.resid) {
    drawResiduals(f, xs, ys, fit.a, fit.b);
    keys.push(['r-key-resid', 'מרחק מהקו']);
  }
  if (block.outliers && block.outliers.length) {
    const keep = xs.map((_, i) => i).filter((i) => !block.outliers.includes(i));
    const clean = fitLine(keep.map((i) => xs[i]), keep.map((i) => ys[i]));
    drawLine(f, clean.a, clean.b, 'r-line r-line-ghost');
    keys.push(['r-key-ghost', 'קו רגרסיה בלי החריג'], ['r-key-out', 'ערך חריג']);
  }
  drawDots(f, xs, ys, block.outliers || []);
  const host = el('div', 'r-svg');
  host.appendChild(f.svg);
  wrap.appendChild(host);
  if (keys.length > 1) wrap.appendChild(legend(keys));
  if (block.showEq) {
    wrap.appendChild(el('div', 'r-eq', `שיפוע: <b class="ltr">${fmt(fit.b)}</b> · חותך: <b class="ltr">${fmt(fit.a)}</b>`));
  }
  if (block.caption) wrap.appendChild(el('div', 'r-caption', block.caption));
  return wrap;
}

// ===== r-predict =====
// { type: 'r-predict', x, y, xLabel, yLabel, what ← "מספר הורדות" , forLabel ← "לבני",
//   min, max, start ← גבולות המחוון וערך ההתחלה · domain }
// מחוון שמזיז נקודה על הקו. בתוך הטבלה מראה גם את הערך בפועל ואת המרחק מהקו.
// מחוץ לטווח הנתונים מזהיר שהחיזוי פחות אמין.
function renderPredict(block) {
  const wrap = el('div', 'block r-chart r-predict');
  const xs = block.x, ys = block.y;
  const fit = fitLine(xs, ys);
  const dom = autoDomain([...xs, block.min, block.max], [...ys, fit.a + fit.b * block.min, fit.a + fit.b * block.max], block.domain);
  const f = frame(dom, block.xLabel, block.yLabel, 'גרף פיזור עם קו רגרסיה ומחוון לחיזוי');
  drawLine(f, fit.a, fit.b, 'r-line');
  drawResiduals(f, xs, ys, fit.a, fit.b);
  drawDots(f, xs, ys);
  const gv = svgEl('line', { class: 'r-guide' }, f.layers.top);
  const gh = svgEl('line', { class: 'r-guide' }, f.layers.top);
  const gp = svgEl('circle', { r: 9, class: 'r-probe' }, f.layers.top);

  const host = el('div', 'r-svg');
  host.appendChild(f.svg);

  const controls = el('div', 'r-controls');
  const label = el('label', 'r-slider-label');
  const val = el('b', 'ltr');
  label.append(el('span', '', `${block.xName || 'X'}: `), val);
  const slider = el('input', 'r-range');
  Object.assign(slider, { type: 'range', min: block.min, max: block.max, step: block.step || 1, value: block.start ?? block.max });
  slider.setAttribute('dir', 'ltr');
  slider.setAttribute('aria-label', block.xName || 'X');
  const residToggle = el('label', 'r-check');
  const cb = el('input');
  cb.type = 'checkbox';
  cb.checked = true;
  residToggle.append(cb, el('span', '', 'הצגת המרחקים מהקו'));
  const sliderRow = el('div', 'r-slider');
  sliderRow.append(label, slider);
  controls.append(sliderRow, residToggle);

  const readout = el('div', 'r-readout');
  const xMin = Math.min(...xs), xMax = Math.max(...xs);

  function update() {
    const x = +slider.value;
    const y = fit.a + fit.b * x;
    val.textContent = fmt(x);
    Object.entries({ x1: f.sx(x), x2: f.sx(x), y1: B, y2: f.sy(y) }).forEach(([k, v]) => gv.setAttribute(k, v));
    Object.entries({ x1: L, x2: f.sx(x), y1: f.sy(y), y2: f.sy(y) }).forEach(([k, v]) => gh.setAttribute(k, v));
    gp.setAttribute('cx', f.sx(x));
    gp.setAttribute('cy', f.sy(y));
    const i = xs.indexOf(x);
    let html = `${block.what || 'Y'} חזוי ${block.forLabel || 'עבור'} ${x}: <b class="ltr">${Math.round(y)}</b>`;
    if (i >= 0) {
      html += ` · בפועל בטבלה: <b class="ltr">${ys[i]}</b> · מרחק מהקו: <b class="ltr">${Math.round(ys[i] - y)}</b>`;
    } else if (x < xMin || x > xMax) {
      html += `<div class="r-warn">⚠️ ${x} מחוץ לטווח הנתונים (${xMin} עד ${xMax}). זה חיזוי, כמו FORECAST באקסל, אבל ככל שמתרחקים מהנתונים הוא פחות אמין.</div>`;
    } else {
      html += ' · ערך שאינו בטבלה: זה חיזוי, כמו FORECAST באקסל.';
    }
    readout.innerHTML = html;
  }
  slider.addEventListener('input', update);
  cb.addEventListener('change', () => { f.layers.resid.style.display = cb.checked ? '' : 'none'; });
  update();

  wrap.append(host, controls, readout);
  if (block.caption) wrap.appendChild(el('div', 'r-caption', block.caption));
  return wrap;
}

registerBlockRenderer('r-scatter', renderScatter);
registerBlockRenderer('r-predict', renderPredict);

// ===== r-fit: מזיזים את הקו בעצמם =====
// { type: 'r-fit', x, y, xLabel, yLabel, domain, prompt, doneText,
//   slope: [מינימום, מקסימום, צעד, התחלה], level: [מינימום, מקסימום, צעד, התחלה] ← גובה הקו באמצע הנתונים,
//   goal: 90 ← כמה אחוזים מההתאמה הטובה ביותר צריך כדי לעבור }
// "התאמה" = סכום ריבועי המרחקים של הקו הטוב ביותר, חלקי זה של הקו שלהם. 100% = קו הרגרסיה.
function practiceFit(q, onSolved) {
  const wrap = el('div', 'question-block r-fit');
  const xs = q.x, ys = q.y;
  const best = fitLine(xs, ys);
  const minErr = sse(xs, ys, best.a, best.b);
  const dom = autoDomain(xs, ys, q.domain);
  const goalPct = q.goal ?? 90;
  let solved = false;

  const goal = el('div', 'r-goal');
  const check = el('span', 'r-goal-check', '');
  goal.append(check, el('span', '', q.prompt));

  const f = frame(dom, q.xLabel, q.yLabel, 'גרף פיזור עם קו שאפשר להזיז');
  drawDots(f, xs, ys);
  const host = el('div', 'r-svg');
  host.appendChild(f.svg);

  const mkSlider = ([min, max, step, start], name) => {
    const lab = el('label', 'r-slider-label');
    const s = el('input', 'r-range');
    Object.assign(s, { type: 'range', min, max, step, value: start });
    s.setAttribute('dir', 'ltr');
    s.setAttribute('aria-label', name);
    const out = el('b', 'ltr');
    lab.append(el('span', '', `${name}: `), out);
    const row = el('div', 'r-slider');
    row.append(lab, s);
    return { row, s, out };
  };
  const sl = mkSlider(q.slope, 'שיפוע');
  const lv = mkSlider(q.level, 'גובה הקו');
  const controls = el('div', 'r-controls');
  controls.append(sl.row, lv.row);

  const meter = el('div', 'r-meter');
  const bar = el('div', 'r-meter-bar');
  const fill = el('i', 'r-meter-fill');
  bar.appendChild(fill);
  const meterText = el('span', 'r-meter-text');
  meter.append(el('span', '', 'כמה הקו קרוב לנקודות:'), bar, meterText);
  const feedback = el('div', 'feedback');

  function draw() {
    const b = +sl.s.value;
    const a = +lv.s.value - b * best.mx;
    sl.out.textContent = fmt(b);
    lv.out.textContent = fmt(+lv.s.value);
    f.layers.lines.replaceChildren();
    f.layers.resid.replaceChildren();
    drawResiduals(f, xs, ys, a, b);
    drawLine(f, a, b, 'r-line r-line-user');
    if (solved) drawLine(f, best.a, best.b, 'r-line r-line-ghost');
    const pct = Math.round((minErr / sse(xs, ys, a, b)) * 100);
    fill.style.width = `${pct}%`;
    meter.classList.toggle('good', pct >= goalPct);
    meterText.textContent = `${pct}%`;
    if (!solved && pct >= goalPct) {
      solved = true;
      goal.classList.add('met');
      check.textContent = '✓';
      feedback.className = 'feedback ok';
      feedback.innerHTML = q.doneText || 'הצלחתם!';
      draw();
      onSolved(true);
    }
  }
  sl.s.addEventListener('input', draw);
  lv.s.addEventListener('input', draw);

  wrap.append(goal, host, controls, meter);
  wrap.appendChild(legend([['r-key-user', 'הקו שלכם'], ['r-key-resid', 'מרחק מהקו'], ['r-key-ghost', 'קו הרגרסיה (מופיע בסוף)']]));
  wrap.appendChild(feedback);
  draw();
  return wrap;
}

registerQuestionType('r-fit', { practice: practiceFit });

// ===== שאלה עם תרשים =====
// mc ו-numeric רגילות, עם שדה chart רשות (בלוק r-scatter או כל בלוק אחר) שמוצג מתחת לשאלה.
// validate לא בודק כאן "תשובה נכונה אחת", ולכן בודקים בעין.
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
          r.el.appendChild(el('div', `r-verdict ${result.isCorrect ? 'ok' : 'bad'}`, result.isCorrect ? '✓ תשובה נכונה' : '✗ תשובה שגויה'));
          return result;
        },
      };
    },
  };
}

registerQuestionType('r-mc', withChart('mc'));
registerQuestionType('r-numeric', withChart('numeric'));
