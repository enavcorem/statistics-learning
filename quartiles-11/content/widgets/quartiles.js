// רכיבים אינטראקטיביים ללומדת "מעבדת הרבעונים".
// בלוקים:  q-tiles (נתונים ממוינים עם חלוקה לרבעים) · q-box (תרשים קופסה) ·
//          q-compare (כמה קופסאות על ציר אחד) · q-whisker-trap (איפה נגמר השפם).
// שאלות:   q-builder (בנייה מודרכת) · q-lab (גרירת נקודות עם משימה) ·
//          q-pick-outliers (סימון חריגים) · q-box-mc / q-box-numeric (שאלה עם תרשים, גם במבחן).
// שיטת החישוב: במספר אי-זוגי של נתונים החציון לא נכנס לאף חצי.
// הצבעים מגיעים מטוקנים ב-cs2.css. ב-JS יש רק מחלקות, בלי צבעים.

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

function button(className, html, onClick) {
  const b = el('button', className, html);
  b.type = 'button';
  if (onClick) b.addEventListener('click', onClick);
  return b;
}

const fmt = (x) => String(Math.round(x * 100) / 100);
const ltr = (x) => `<span class="ltr">${x}</span>`;

function median(a) {
  const n = a.length;
  return n % 2 ? a[(n - 1) / 2] : (a[n / 2 - 1] + a[n / 2]) / 2;
}

export function stats(values) {
  const s = [...values].sort((a, b) => a - b);
  const n = s.length;
  const h = Math.floor(n / 2);
  const lower = s.slice(0, h);
  const upper = s.slice(n - h);
  const q1 = median(lower);
  const q3 = median(upper);
  const iqr = q3 - q1;
  const lo = q1 - 1.5 * iqr;
  const hi = q3 + 1.5 * iqr;
  const inside = s.filter((v) => v >= lo && v <= hi);
  return {
    s, n, h, lower, upper, q1, q3, iqr, lo, hi,
    m: median(s),
    out: s.filter((v) => v < lo || v > hi),
    wmin: inside[0],
    wmax: inside[inside.length - 1],
    min: s[0],
    max: s[n - 1],
    mean: s.reduce((a, b) => a + b, 0) / n,
  };
}

function parseAnswer(v) {
  const t = String(v).trim().replace(',', '.').replace('−', '-');
  return t === '' ? NaN : Number(t);
}

function niceStep(range) {
  const raw = range / 9;
  const p = Math.pow(10, Math.floor(Math.log10(raw)));
  const f = raw / p;
  return (f < 1.5 ? 1 : f < 3 ? 2 : f < 7 ? 5 : 10) * p;
}

// ===== שרטוט =====
const W = 640, L = 36, R = 604;

function scale(d0, d1) {
  return (v) => L + ((v - d0) / (d1 - d0)) * (R - L);
}

function drawAxis(g, X, d0, d1, step, ax) {
  svgEl('line', { x1: L, y1: ax, x2: R, y2: ax, class: 'q-axis' }, g);
  const first = Math.ceil(d0 / step - 1e-9) * step;
  for (let i = 0, t = first; t <= d1 + 1e-9; i++, t = first + i * step) {
    const x = X(t);
    svgEl('line', { x1: x, y1: ax, x2: x, y2: ax + 7, class: 'q-axis' }, g);
    svgEl('text', { x, y: ax + 27, 'text-anchor': 'middle', class: 'q-tick' }, g, fmt(t));
  }
}

// show: { fences, whisk ('right' | 'fence' | 'outlier' | false), box, iqr, median, mean, out }
function drawParts(g, st, X, show, { top = 86, bot = 134, labels = true, fenceTop = 30, ax = 226 } = {}) {
  const mid = (top + bot) / 2;

  if (show.fences) {
    [st.lo, st.hi].forEach((v) => {
      if (X(v) < L - 1 || X(v) > R + 1) return;
      svgEl('line', { x1: X(v), y1: fenceTop, x2: X(v), y2: ax, class: 'q-fence' }, g);
      svgEl('text', { x: X(v), y: fenceTop - 8, 'text-anchor': 'middle', class: 'q-fence-label' }, g, fmt(v));
    });
  }

  if (show.whisk) {
    const lowEnd = show.whisk === 'fence' ? Math.max(st.lo, X.d0) : show.whisk === 'outlier' ? st.min : st.wmin;
    const highEnd = show.whisk === 'fence' ? Math.min(st.hi, X.d1) : show.whisk === 'outlier' ? st.max : st.wmax;
    const cls = show.whisk === 'right' ? 'q-whisk' : 'q-whisk q-whisk-bad';
    svgEl('line', { x1: X(lowEnd), y1: mid, x2: X(st.q1), y2: mid, class: cls }, g);
    svgEl('line', { x1: X(st.q3), y1: mid, x2: X(highEnd), y2: mid, class: cls }, g);
    [lowEnd, highEnd].forEach((v) => svgEl('line', { x1: X(v), y1: mid - 16, x2: X(v), y2: mid + 16, class: cls }, g));
  }

  if (show.box) {
    svgEl('rect', { x: X(st.q1), y: top, width: Math.max(1, X(st.q3) - X(st.q1)), height: bot - top, rx: 4, class: 'q-box' }, g);
    if (labels) {
      // Q1 מיושר שמאלה ו-Q3 ימינה, כדי שלא יעלו זה על זה בקופסה צרה
      svgEl('text', { x: X(st.q1) + 4, y: top - 10, 'text-anchor': 'end', class: 'q-label q-label-low' }, g, `Q1=${fmt(st.q1)}`);
      svgEl('text', { x: X(st.q3) - 4, y: top - 10, 'text-anchor': 'start', class: 'q-label q-label-up' }, g, `Q3=${fmt(st.q3)}`);
    }
  }

  if (show.iqr) {
    const y = bot + 20;
    svgEl('path', { d: `M${X(st.q1)} ${y - 6} V${y} H${X(st.q3)} V${y - 6}`, class: 'q-iqr' }, g);
    svgEl('text', { x: (X(st.q1) + X(st.q3)) / 2, y: y + 19, 'text-anchor': 'middle', class: 'q-label' }, g, `IQR=${fmt(st.iqr)}`);
  }

  if (show.median) {
    svgEl('line', { x1: X(st.m), y1: top, x2: X(st.m), y2: bot, class: 'q-median' }, g);
    if (labels && !show.box) {
      svgEl('text', { x: X(st.m), y: top - 10, 'text-anchor': 'middle', class: 'q-label' }, g, `חציון=${fmt(st.m)}`);
    }
  }

  if (show.mean) {
    const x = X(st.mean);
    svgEl('path', { d: `M${x - 8} ${mid - 8} L${x + 8} ${mid + 8} M${x + 8} ${mid - 8} L${x - 8} ${mid + 8}`, class: 'q-mean' }, g);
  }

  if (show.out) {
    st.out.forEach((v) => svgEl('circle', { cx: X(v), cy: mid, r: 9, class: 'q-outlier' }, g));
  }
}

function dotY(count, ax) {
  return ax - 11 - (count - 1) * 14;
}

function makeDomain(st, withFences, block = {}) {
  let lo = withFences ? Math.min(st.min, st.lo) : st.min;
  let hi = withFences ? Math.max(st.max, st.hi) : st.max;
  if (block.min != null) lo = block.min;
  if (block.max != null) hi = block.max;
  const step = block.step ?? niceStep(hi - lo || 1);
  const d0 = block.min ?? Math.floor(lo / step) * step;
  const d1 = block.max ?? Math.ceil(hi / step) * step;
  return { d0, d1, step };
}

function drawStatic(host, st, { d0, d1, step, show, dots, label, labels = true }) {
  const svg = svgEl('svg', { viewBox: `0 0 ${W} 272`, class: 'ltr', role: 'img', 'aria-label': label || 'תרשים קופסה' });
  const X = scale(d0, d1);
  X.d0 = d0; X.d1 = d1;
  drawAxis(svg, X, d0, d1, step, 226);
  drawParts(svg, st, X, show, { labels });
  if (dots) {
    const seen = {};
    dots.forEach((d) => {
      seen[d.v] = (seen[d.v] || 0) + 1;
      svgEl('circle', { cx: X(d.v), cy: dotY(seen[d.v], 226), r: 6.5, class: `q-dot ${d.c || ''}` }, svg);
    });
  }
  host.replaceChildren(svg);
}

// ===== q-tiles =====
// { type: 'q-tiles', data: [...], marks: 'none' | 'halves' | 'quartiles', caption }
function renderTilesBlock(block) {
  const wrap = el('div', 'block q-chart');
  const st = stats(block.data || []);
  const marks = block.marks || 'quartiles';
  const row = el('div', 'q-tiles ltr');
  const { n, h } = st;
  const lowerQ = h % 2 ? { tile: (h - 1) / 2 } : { gap: h / 2 };
  const upperStart = n - h;
  const upperQ = h % 2 ? { tile: upperStart + (h - 1) / 2 } : { gap: upperStart + h / 2 };

  const addDivider = (label, cls) => {
    const d = el('div', `q-divider ${cls || ''}`);
    d.append(el('small', '', label), el('i'));
    row.appendChild(d);
  };
  const addTile = (v, cls, label) => {
    const c = el('div', 'q-cell');
    c.append(el('small', '', label || '&nbsp;'), el('span', `q-tile ${cls}`, fmt(v)));
    row.appendChild(c);
  };

  st.s.forEach((v, i) => {
    if (marks === 'quartiles' && i === lowerQ.gap) addDivider(`Q1=${fmt(st.q1)}`, 'q-divider-q');
    if (marks !== 'none' && n % 2 === 0 && i === h) addDivider(`חציון=${fmt(st.m)}`);
    if (marks === 'quartiles' && i === upperQ.gap) addDivider(`Q3=${fmt(st.q3)}`, 'q-divider-q');

    let cls = '';
    let label = '';
    if (marks !== 'none') {
      if (n % 2 && i === (n - 1) / 2) { cls = 'q-tile-med'; label = 'חציון'; }
      else cls = i < h ? 'q-tile-low' : 'q-tile-up';
    }
    if (marks === 'quartiles' && i === lowerQ.tile) { cls += ' q-tile-q'; label = 'Q1'; }
    if (marks === 'quartiles' && i === upperQ.tile) { cls += ' q-tile-q'; label = 'Q3'; }
    addTile(v, cls, label);
  });

  wrap.appendChild(row);
  if (block.caption) wrap.appendChild(el('div', 'q-caption', block.caption));
  return wrap;
}

// ===== q-box =====
// { type: 'q-box', data, show: ['dots','median','box','iqr','fences','whisk','out','mean'],
//   min, max, step, labels: false ← בלי מספרים על התרשים (לקריאה מהציר), title, caption }
function renderBoxBlock(block) {
  const wrap = el('div', 'block q-chart');
  const st = stats(block.data || []);
  const list = block.show || ['median', 'box', 'whisk', 'out'];
  const has = (k) => list.includes(k);
  const show = {
    median: has('median'), box: has('box'), iqr: has('iqr'), fences: has('fences'),
    whisk: has('whisk') ? 'right' : false, out: has('out'), mean: has('mean'),
  };
  const dom = makeDomain(st, show.fences, block);
  const dots = has('dots') ? st.s.map((v) => ({ v, c: 'q-dot-plain' })) : null;
  const host = el('div', 'q-svg');
  drawStatic(host, st, { ...dom, show, dots, label: block.title, labels: block.labels !== false });
  if (block.title) wrap.appendChild(el('div', 'q-title', block.title));
  wrap.appendChild(host);
  if (block.xTitle) wrap.appendChild(el('div', 'q-caption', block.xTitle));
  if (block.caption) wrap.appendChild(el('div', 'q-caption', block.caption));
  return wrap;
}

// ===== q-compare =====
// { type: 'q-compare', groups: [{ label, data }], min, max, step, title, xTitle }
function renderCompareBlock(block) {
  const wrap = el('div', 'block q-chart');
  const groups = (block.groups || []).map((g) => ({ ...g, st: stats(g.data) }));
  const rowH = 92;
  const ax = 16 + groups.length * rowH;
  const H = ax + 44;
  const lo = Math.min(...groups.map((g) => g.st.min));
  const hi = Math.max(...groups.map((g) => g.st.max));
  const step = block.step ?? niceStep(hi - lo || 1);
  const d0 = block.min ?? Math.floor(lo / step) * step;
  const d1 = block.max ?? Math.ceil(hi / step) * step;
  const svg = svgEl('svg', { viewBox: `0 0 ${W} ${H}`, class: 'ltr', role: 'img', 'aria-label': block.title || 'השוואת תרשימי קופסה' });
  const X = scale(d0, d1);
  X.d0 = d0; X.d1 = d1;
  drawAxis(svg, X, d0, d1, step, ax);
  groups.forEach((g, i) => {
    const top = 42 + i * rowH;
    svgEl('text', { x: L, y: top - 14, 'text-anchor': 'start', class: 'q-label' }, svg, g.label);
    drawParts(svg, g.st, X, { median: true, box: true, whisk: 'right', out: true }, { top, bot: top + 40, labels: false, ax });
  });
  const host = el('div', 'q-svg');
  host.appendChild(svg);
  if (block.title) wrap.appendChild(el('div', 'q-title', block.title));
  wrap.appendChild(host);
  if (block.xTitle) wrap.appendChild(el('div', 'q-caption', block.xTitle));
  return wrap;
}

// ===== q-whisker-trap: אותם נתונים, שלוש דרכים לצייר שפם =====
// { type: 'q-whisker-trap', data, step }
function renderWhiskerTrap(block) {
  const wrap = el('div', 'block q-chart');
  const st = stats(block.data || []);
  const dom = makeDomain(st, true, block);
  const host = el('div', 'q-svg');
  const note = el('div', 'q-note');
  const toggle = el('div', 'q-toggle');
  const OPTIONS = [
    { mode: 'right', label: 'עד הערך האחרון שאינו חריג', msg: `✓ נכון. השפם העליון נעצר ב-${ltr(fmt(st.wmax))}, הערך הגדול ביותר שנמצא בתוך הגבולות. השפם תמיד נגמר בערך אמיתי מהנתונים.`, good: true },
    { mode: 'fence', label: 'עד הגבול', msg: `✗ טעות. ${ltr(fmt(st.hi))} הוא קו חישוב ולא נתון שנמדד, ולכן השפם לא יכול להיגמר שם.` },
    { mode: 'outlier', label: 'עד הערך החריג', msg: `✗ טעות. ${ltr(fmt(st.max))} הוא ערך חריג. אם השפם יגיע אליו, הוא יסתיר בדיוק את מה שהתרשים אמור להראות. חריג מסמנים כנקודה נפרדת.` },
  ];

  const draw = (opt) => {
    drawStatic(host, st, {
      ...dom,
      show: { median: true, box: true, fences: true, whisk: opt.mode, out: opt.mode !== 'outlier' },
      dots: opt.mode === 'outlier' ? st.out.map((v) => ({ v, c: 'q-dot-plain' })) : null,
      label: 'תרשים קופסה עם שפם לפי הבחירה',
    });
    note.className = `q-note ${opt.good ? 'q-note-ok' : 'q-note-bad'}`;
    note.innerHTML = opt.msg;
  };

  OPTIONS.forEach((opt, i) => {
    const b = button(`q-toggle-btn${i === 1 ? ' on' : ''}`, opt.label, () => {
      toggle.querySelectorAll('button').forEach((x) => x.classList.remove('on'));
      b.classList.add('on');
      draw(opt);
    });
    toggle.appendChild(b);
  });
  draw(OPTIONS[1]);

  wrap.append(toggle, host, note);
  return wrap;
}

registerBlockRenderer('q-tiles', renderTilesBlock);
registerBlockRenderer('q-box', renderBoxBlock);
registerBlockRenderer('q-compare', renderCompareBlock);
registerBlockRenderer('q-whisker-trap', renderWhiskerTrap);

// ===== q-pick-outliers: לוחצים על הערכים החריגים =====
// { type: 'q-pick-outliers', prompt, data, hint }
function practicePickOutliers(q, onSolved) {
  const wrap = el('div', 'question-block');
  wrap.appendChild(el('div', 'question-prompt', q.prompt));
  const st = stats(q.data);
  const picked = new Set();
  const row = el('div', 'q-tiles ltr');
  const feedback = el('div', 'feedback');
  let solved = false;

  st.s.forEach((v, i) => {
    const b = button('q-tile q-tile-btn', fmt(v), () => {
      if (solved) return;
      picked.has(i) ? picked.delete(i) : picked.add(i);
      b.classList.toggle('q-tile-sel', picked.has(i));
      b.setAttribute('aria-pressed', picked.has(i));
    });
    b.setAttribute('aria-pressed', 'false');
    row.appendChild(b);
  });

  const check = button('btn btn-primary', 'בדיקה', () => {
    if (solved) return;
    const truth = st.s.map((v, i) => (v < st.lo || v > st.hi ? i : -1)).filter((i) => i >= 0);
    const ok = truth.length === picked.size && truth.every((i) => picked.has(i));
    if (ok) {
      solved = true;
      check.disabled = true;
      feedback.className = 'feedback ok';
      feedback.textContent = 'נכון! סימנתם בדיוק את הערכים החריגים.';
      onSolved(true);
    } else {
      feedback.className = 'feedback hint';
      feedback.innerHTML = `💡 ${q.hint || 'טעיתם. השוו כל ערך לגבולות, והתחילו מהערכים שבקצוות.'}`;
    }
  });

  wrap.append(row, el('div', 'q-actions'), feedback);
  wrap.querySelector('.q-actions').appendChild(check);
  return wrap;
}

registerQuestionType('q-pick-outliers', { practice: practicePickOutliers });

// ===== q-builder: בנייה מודרכת של תרשים קופסה =====
// { type: 'q-builder', prompt, datasets: [{ t, u, v: [...] }] }
const STEPS = [
  { k: 'sort', name: 'מיון' },
  { k: 'm', name: 'חציון', f: [['m', 'חציון']],
    text: (st) => `יש ${ltr(st.n)} נתונים. מצאו את החציון.`,
    hint: (st) => (st.n % 2
      ? `מספר אי-זוגי של נתונים: החציון הוא הערך במקום ה-${ltr((st.n + 1) / 2)}.`
      : `מספר זוגי של נתונים: החציון הוא ממוצע הערכים במקומות ${ltr(st.n / 2)} ו-${ltr(st.n / 2 + 1)}.`) },
  { k: 'q', name: 'רבעונים', f: [['q1', 'Q1'], ['q3', 'Q3']],
    text: () => 'Q1 הוא החציון של החצי התחתון. Q3 הוא החציון של החצי העליון.',
    hint: (st) => `החצי התחתון: ${ltr(st.lower.join(', '))}. החצי העליון: ${ltr(st.upper.join(', '))}.${st.n % 2 ? ' החציון לא נכלל באף חצי.' : ''}` },
  { k: 'iqr', name: 'טווח בין-רבעוני', f: [['iqr', 'IQR']],
    text: () => `חשבו את הטווח הבין-רבעוני: ${ltr('IQR = Q3 − Q1')}`,
    hint: (st) => ltr(`${fmt(st.q3)} − ${fmt(st.q1)}`) },
  { k: 'fence', name: 'גבולות', f: [['lo', 'גבול תחתון'], ['hi', 'גבול עליון']],
    text: () => `גבול תחתון: ${ltr('Q1 − 1.5·IQR')}. גבול עליון: ${ltr('Q3 + 1.5·IQR')}.`,
    hint: (st) => `קודם מחשבים ${ltr(`1.5 · ${fmt(st.iqr)} = ${fmt(1.5 * st.iqr)}`)}, ואז מחסרים מ-Q1 ומוסיפים ל-Q3.` },
  { k: 'out', name: 'ערכים חריגים',
    text: (st) => `לחצו על כל ערך שקטן מ-${ltr(fmt(st.lo))} או גדול מ-${ltr(fmt(st.hi))}. אם אין כאלה, לחצו "בדיקה" בלי לסמן.`,
    hint: () => 'השוו את הערכים שבקצוות לגבולות. ערך ששווה לגבול אינו חריג.' },
  { k: 'w', name: 'שפמים', f: [['wmin', 'קצה שפם תחתון'], ['wmax', 'קצה שפם עליון']],
    text: () => 'השפמים נמשכים מהקופסה עד הערך הקטן ביותר והגדול ביותר <b>שאינם חריגים</b>.',
    hint: (st) => (st.out.length ? 'דלגו על הערכים החריגים, ובחרו את הערך הקיצוני הבא. השפם לא מגיע עד הגבול.' : 'אין חריגים, ולכן השפמים מגיעים למינימום ולמקסימום.') },
];

function randomDataset() {
  const n = 9 + Math.floor(Math.random() * 4);
  const v = [];
  for (let i = 0; i < n; i++) v.push(10 + Math.floor(Math.random() * 21));
  const r = Math.random();
  if (r < 0.4) v[0] += 25 + Math.floor(Math.random() * 15);
  else if (r < 0.6) v[0] = Math.floor(Math.random() * 3);
  return { t: 'נתונים אקראיים', u: '', v };
}

function practiceBuilder(q, onSolved) {
  const wrap = el('div', 'question-block q-builder');
  const datasets = q.datasets || [];
  let dsIndex = 0;
  let solved = false;
  let G;

  const titleEl = el('h3', 'q-builder-title');
  const countEl = el('div', 'q-muted');
  const poolWrap = el('div', 'q-pool');
  poolWrap.appendChild(el('div', 'q-muted', 'הנתונים כפי שנאספו:'));
  const pool = el('div', 'q-tiles ltr');
  poolWrap.appendChild(pool);
  const sortedLabel = el('div', 'q-muted');
  const sorted = el('div', 'q-tiles ltr');
  const layout = el('div', 'q-builder-layout');
  const stepper = el('ol', 'q-stepper');
  const card = el('div', 'q-step-card');
  const chart = el('div', 'q-svg');
  layout.append(stepper, card);
  wrap.append(el('div', 'question-prompt', q.prompt), titleEl, countEl, poolWrap, sortedLabel, sorted, layout, chart);

  const passed = (k) => STEPS.findIndex((x) => x.k === k) < G.step;

  function load(ds) {
    const st = stats(ds.v);
    const items = ds.v.map((v, id) => ({ v, id })).sort(() => Math.random() - 0.5);
    G = { ds, st, pool: items, sorted: [], step: 0, sel: new Set() };
    render();
  }

  function renderTiles() {
    const { st } = G;
    const current = STEPS[G.step] ? STEPS[G.step].k : 'end';
    poolWrap.hidden = G.step > 0;
    pool.replaceChildren(...G.pool.map((p) => button('q-tile q-tile-btn', fmt(p.v), (e) => pickSort(p.id, e.currentTarget))));
    sorted.replaceChildren();
    for (let i = 0; i < st.n; i++) {
      if (i >= G.sorted.length) { sorted.appendChild(el('span', 'q-slot')); continue; }
      const v = G.sorted[i];
      let cls = 'q-tile';
      if (passed('m')) {
        if (st.n % 2 && i === (st.n - 1) / 2) cls += ' q-tile-med';
        else cls += i < st.h ? ' q-tile-low' : ' q-tile-up';
      }
      if (G.sel.has(i)) cls += ' q-tile-sel';
      if (current === 'out') {
        const b = button(`${cls} q-tile-btn`, fmt(v), () => {
          G.sel.has(i) ? G.sel.delete(i) : G.sel.add(i);
          renderTiles();
        });
        b.setAttribute('aria-pressed', G.sel.has(i));
        sorted.appendChild(b);
      } else {
        sorted.appendChild(el('span', cls, fmt(v)));
      }
    }
    sortedLabel.textContent = G.step === 0 ? 'לחצו על המספרים מהקטן לגדול:' : 'הנתונים ממוינים:';
  }

  function pickSort(id, btn) {
    const p = G.pool.find((x) => x.id === id);
    const smallest = Math.min(...G.pool.map((x) => x.v));
    const fb = card.querySelector('.feedback');
    if (p.v === smallest) {
      G.pool = G.pool.filter((x) => x.id !== id);
      G.sorted.push(p.v);
      if (!G.pool.length) { G.step = 1; render(); return; }
      renderTiles();
      if (fb) fb.textContent = '';
    } else {
      btn.classList.remove('q-shake');
      void btn.offsetWidth;
      btn.classList.add('q-shake');
      if (fb) { fb.className = 'feedback hint'; fb.innerHTML = `טעיתם. יש מספר קטן מ-${ltr(fmt(p.v))}.`; }
    }
  }

  function renderStepper() {
    stepper.innerHTML = STEPS.map((s, i) => `<li class="${i < G.step ? 'done' : i === G.step ? 'now' : ''}"><span class="q-step-dot ltr">${i < G.step ? '✓' : i + 1}</span><span class="q-step-name">${s.name}</span></li>`).join('');
  }

  function answers() {
    const { st } = G;
    return { m: st.m, q1: st.q1, q3: st.q3, iqr: st.iqr, lo: st.lo, hi: st.hi, wmin: st.wmin, wmax: st.wmax };
  }

  function renderDone() {
    const { st } = G;
    card.replaceChildren();
    const done = el('div', 'q-done');
    done.innerHTML = `<h3>הקופסה מוכנה!</h3>
      <div class="q-five">
        ${[['שפם תחתון', st.wmin], ['Q1', st.q1], ['חציון', st.m], ['Q3', st.q3], ['שפם עליון', st.wmax], ['IQR', st.iqr]].map(([l, v]) => `<div><small>${l}</small><b class="ltr">${fmt(v)}</b></div>`).join('')}
      </div>
      <p>${st.out.length ? `ערכים חריגים: ${ltr(st.out.join(', '))}. הם מסומנים כנקודות מחוץ לשפמים.` : 'אין ערכים חריגים בנתונים האלה.'}</p>`;
    const actions = el('div', 'q-actions');
    actions.append(
      button('btn btn-ghost', 'לדוגמה הבאה', () => { dsIndex = (dsIndex + 1) % datasets.length; load(datasets[dsIndex]); }),
      button('btn btn-ghost', 'נתונים אקראיים', () => load(randomDataset())),
    );
    done.appendChild(actions);
    card.appendChild(done);
    if (!solved) { solved = true; onSolved(true); }
  }

  function renderStep() {
    if (G.step >= STEPS.length) { renderDone(); return; }
    const s = STEPS[G.step];
    const { st } = G;
    card.replaceChildren();
    if (s.k === 'sort') {
      card.append(el('h3', '', 'שלב 1: מיון'), el('p', '', 'לחצו על המספרים לפי הסדר, מהקטן לגדול. כל מספר עובר לשורה הממוינת.'), el('div', 'feedback'));
      return;
    }
    card.append(el('h3', '', `שלב ${G.step + 1}: ${s.name}`), el('p', '', s.text(st)));
    const inputs = {};
    if (s.f) {
      const fields = el('div', 'q-fields');
      s.f.forEach(([k, label]) => {
        const field = el('label', 'q-field');
        const input = el('input', 'q-input ltr');
        input.inputMode = 'decimal';
        input.autocomplete = 'off';
        input.setAttribute('aria-label', label);
        input.addEventListener('keydown', (e) => { if (e.key === 'Enter') check(); });
        field.append(el('span', '', label), input);
        fields.appendChild(field);
        inputs[k] = input;
      });
      card.appendChild(fields);
    }
    const actions = el('div', 'q-actions');
    const fb = el('div', 'feedback');
    const showBtn = button('btn btn-ghost', 'הצגת התשובה', reveal);
    showBtn.hidden = true;
    actions.append(
      button('btn btn-primary', 'בדיקה', check),
      button('btn btn-ghost', 'רמז', () => { fb.className = 'feedback hint'; fb.innerHTML = `💡 ${s.hint(st)}`; }),
      showBtn,
    );
    card.append(actions, fb);

    function check() {
      let ok = true;
      if (s.k === 'out') {
        const truth = st.s.map((v, i) => (v < st.lo || v > st.hi ? i : -1)).filter((i) => i >= 0);
        ok = truth.length === G.sel.size && truth.every((i) => G.sel.has(i));
      } else {
        const A = answers();
        s.f.forEach(([k]) => {
          const v = parseAnswer(inputs[k].value);
          const good = !Number.isNaN(v) && Math.abs(v - A[k]) < 0.011;
          inputs[k].classList.toggle('ok', good);
          inputs[k].classList.toggle('no', !good);
          if (!good) ok = false;
        });
      }
      if (ok) {
        fb.className = 'feedback ok';
        fb.textContent = 'נכון! ממשיכים.';
        setTimeout(() => { G.step++; render(); }, 600);
      } else {
        fb.className = 'feedback hint';
        fb.textContent = s.k === 'out' ? 'טעיתם. הסימון לא מדויק. בדקו שוב את הערכים שבקצוות.' : 'טעיתם. התשובה השגויה מסומנת באדום. נסו שוב או בקשו רמז.';
        showBtn.hidden = false;
      }
    }

    function reveal() {
      if (s.k === 'out') {
        G.sel = new Set(st.s.map((v, i) => (v < st.lo || v > st.hi ? i : -1)).filter((i) => i >= 0));
        renderTiles();
      } else {
        const A = answers();
        s.f.forEach(([k]) => { inputs[k].value = fmt(A[k]); });
      }
      fb.className = 'feedback hint';
      fb.textContent = 'זו התשובה. לחצו "בדיקה" כדי להמשיך.';
    }

    const first = card.querySelector('input');
    if (first) first.focus({ preventScroll: true });
  }

  function renderChart() {
    const { st } = G;
    const dom = makeDomain(st, true);
    const dots = st.s.map((v, i) => ({
      v,
      c: !passed('m') ? 'q-dot-plain' : i < st.h ? 'q-dot-low' : i >= st.n - st.h ? 'q-dot-up' : 'q-dot-mid',
    }));
    drawStatic(chart, st, {
      ...dom,
      dots,
      label: 'תרשים הקופסה שנבנה צעד אחר צעד',
      show: {
        median: passed('m'), box: passed('q'), iqr: passed('iqr'), fences: passed('fence'),
        out: passed('out'), whisk: passed('w') ? 'right' : false,
      },
    });
  }

  function render() {
    titleEl.textContent = G.ds.t + (G.ds.u ? ` (${G.ds.u})` : '');
    countEl.innerHTML = `${ltr(G.st.n)} נתונים`;
    renderTiles();
    renderStepper();
    renderStep();
    renderChart();
  }

  load(datasets[0]);
  return wrap;
}

registerQuestionType('q-builder', { practice: practiceBuilder });

// ===== q-lab: גוררים נקודות והקופסה משתנה =====
// { type: 'q-lab', start: [...], goal: 'outlier' | 'noOut' | 'rangeNotIqr' | 'iqr10' | 'mean3' | 'free',
//   prompt ← המשימה, doneText, tools: true ← כפתורי פיזור והוספה/הסרה של נקודות }
const GOALS = {
  outlier: (st) => st.out.length > 0,
  noOut: (st) => st.out.length === 0,
  iqr10: (st) => Math.abs(st.iqr - 10) < 1e-9,
  mean3: (st) => st.mean - st.m >= 3 - 1e-9,
  rangeNotIqr: (st, base) => !!base && st.n === base.n && (st.max - st.min) !== (base.max - base.min) && Math.abs(st.iqr - base.iqr) < 1e-9,
  free: () => true,
};

const PRESETS = [
  ['סימטרי', [10, 14, 17, 19, 20, 21, 23, 26, 30]],
  ['אסימטרי ימני', [5, 6, 7, 8, 9, 10, 12, 15, 22, 30, 34]],
  ['עם ערך חריג', [18, 20, 21, 22, 23, 24, 25, 26, 47]],
];

function practiceLab(q, onSolved) {
  const wrap = el('div', 'question-block q-lab');
  const D0 = 0, D1 = 50, AX = 226;
  let points = [...q.start];
  let base = null;
  let dragging = -1;
  let solved = false;
  const X = scale(D0, D1);
  X.d0 = D0; X.d1 = D1;

  const goal = el('div', 'q-goal');
  const check = el('span', 'q-goal-check', '');
  const goalText = el('span', '', q.prompt);
  goal.append(check, goalText);

  const svg = svgEl('svg', { viewBox: `0 0 ${W} 272`, class: 'ltr', role: 'group', 'aria-label': 'תרשים קופסה עם נקודות שאפשר לגרור' });
  drawAxis(svg, X, D0, D1, 5, AX);
  const parts = svgEl('g', {}, svg);
  const dots = svgEl('g', {}, svg);
  const host = el('div', 'q-svg');
  host.appendChild(svg);
  const statsGrid = el('div', 'q-stats');
  const feedback = el('div', 'feedback');

  function draw() {
    const st = stats(points);
    parts.replaceChildren();
    drawParts(parts, st, X, { median: true, box: true, iqr: true, fences: true, whisk: 'right', mean: true }, { ax: AX });
    dots.replaceChildren();
    const seen = {};
    points.forEach((v, i) => {
      seen[v] = (seen[v] || 0) + 1;
      const c = svgEl('circle', {
        cx: X(v), cy: dotY(seen[v], AX), r: 10, 'data-i': i, tabindex: 0, role: 'slider',
        'aria-label': `נקודה בערך ${v}`, 'aria-valuenow': v, 'aria-valuemin': D0, 'aria-valuemax': D1,
        class: `q-drag ${v < st.lo || v > st.hi ? 'q-drag-out' : ''}`,
      }, dots);
      if (i === dragging) c.classList.add('active');
    });
    const items = [
      ['מספר נתונים', st.n], ['Q1', fmt(st.q1)], ['חציון', fmt(st.m)], ['Q3', fmt(st.q3)], ['IQR', fmt(st.iqr), true],
      ['טווח', fmt(st.max - st.min)], ['ממוצע (✕)', fmt(st.mean)], ['גבול תחתון', fmt(st.lo)], ['גבול עליון', fmt(st.hi)],
      ['ערכים חריגים', st.out.length ? st.out.join(', ') : 'אין'],
    ];
    statsGrid.innerHTML = items.map(([l, v, hl]) => `<div class="q-stat${hl ? ' hl' : ''}"><small>${l}</small><b class="ltr">${v}</b></div>`).join('');
    return st;
  }

  function evaluate(st) {
    if (solved || !q.goal || !GOALS[q.goal](st, base)) return;
    solved = true;
    goal.classList.add('met');
    check.textContent = '✓';
    feedback.className = 'feedback ok';
    feedback.innerHTML = q.doneText || 'הצלחתם!';
    onSolved(true);
  }

  function moveTo(i, v) {
    const next = Math.max(D0, Math.min(D1, v));
    if (next === points[i]) return;
    points[i] = next;
    evaluate(draw());
  }

  svg.addEventListener('pointerdown', (e) => {
    const t = e.target.closest('.q-drag');
    if (!t) return;
    dragging = +t.dataset.i;
    base = stats(points);
    svg.setPointerCapture(e.pointerId);
    e.preventDefault();
    draw();
  });
  svg.addEventListener('pointermove', (e) => {
    if (dragging < 0) return;
    const pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const p = pt.matrixTransform(svg.getScreenCTM().inverse());
    moveTo(dragging, Math.round(((p.x - L) / (R - L)) * (D1 - D0) + D0));
  });
  const endDrag = () => { if (dragging >= 0) { dragging = -1; draw(); } };
  svg.addEventListener('pointerup', endDrag);
  svg.addEventListener('pointercancel', endDrag);
  svg.addEventListener('keydown', (e) => {
    const t = e.target.closest('.q-drag');
    if (!t || (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight')) return;
    e.preventDefault();
    const i = +t.dataset.i;
    base = stats(points);
    moveTo(i, points[i] + (e.key === 'ArrowRight' ? 1 : -1));
    const again = dots.querySelector(`[data-i="${i}"]`);
    if (again) again.focus();
  });

  wrap.append(goal, host, statsGrid);

  const reset = (values) => { points = [...values]; base = null; draw(); };
  const tools = el('div', 'q-actions');
  tools.appendChild(button('btn btn-ghost', 'איפוס', () => reset(q.start)));
  if (q.tools) {
    PRESETS.forEach(([label, values]) => tools.appendChild(button('btn btn-ghost', label, () => reset(values))));
    tools.appendChild(button('btn btn-ghost', '+ הוספת נקודה', () => {
      if (points.length < 20) { points.push(15 + Math.floor(Math.random() * 20)); base = null; draw(); }
    }));
    tools.appendChild(button('btn btn-ghost', '− הסרת נקודה', () => {
      if (points.length > 5) { points.pop(); base = null; draw(); }
    }));
  }
  wrap.append(tools, feedback);
  draw();
  return wrap;
}

registerQuestionType('q-lab', { practice: practiceLab });

// ===== שאלה עם תרשים =====
// mc ו-numeric רגילות, עם שדה chart (בלוק q-box או q-compare) שמוצג מתחת לשאלה.
// validate לא בודק כאן "תשובה נכונה אחת", ולכן בודקים בעין.
// במבחן מופיעה ליד כל תשובה, אחרי הבדיקה, הערה אם היא נכונה.
// q-mc ו-q-numeric הם אותו דבר בלי תרשים (המנוע לבדו מסמן במבחן רק בצבע).
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
          r.el.appendChild(el('div', `q-verdict ${result.isCorrect ? 'ok' : 'bad'}`, result.isCorrect ? '✓ תשובה נכונה' : '✗ טעיתם'));
          return result;
        },
      };
    },
  };
}

registerQuestionType('q-box-mc', withChart('mc'));
registerQuestionType('q-box-numeric', withChart('numeric'));
registerQuestionType('q-mc', withChart('mc'));
registerQuestionType('q-numeric', withChart('numeric'));
