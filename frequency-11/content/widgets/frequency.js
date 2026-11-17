// רכיבים אינטראקטיביים ללומדת "שכיחות, שכיחות יחסית ושכיחות מצטברת".
// בלוקים:  f-chart (גרף עמודות של שכיחות / יחסית / מצטברת / מצטברת יחסית, עם כפתורי מעבר בין הסוגים).
// שאלות:   f-fill (טבלה עם תאים להשלמה, בשיעור בלבד) ·
//          f-mc / f-numeric (mc ו-numeric רגילות, עם תרשים רשות, ובמבחן הערה "תשובה נכונה / תשובה שגויה").
// כל החישובים (יחסית, מצטברת) נעשים כאן מתוך השכיחויות, כדי שלא תהיה טעות בהקלדה.
// הצבעים מגיעים מטוקנים ב-cs5.css. ב-JS יש רק מחלקות, בלי צבעים.

import { registerBlockRenderer, renderBlock } from '../../js/engine/blocks.js';
import { registerQuestionType, renderQuestionExam, renderQuestionPractice } from '../../js/engine/question-types.js';

const NS = 'http://www.w3.org/2000/svg';

function svgEl(tag, attrs, parent, text) {
  const node = document.createElementNS(NS, tag);
  for (const k in attrs) node.setAttribute(k, attrs[k]);
  if (text != null) {
    node.textContent = text;
    // ה-SVG כולו LTR (בשביל מספרים כמו 40–50). טקסט עם עברית ("עד 50", כותרות צירים) מקבל RTL.
    if (/[֐-׿]/.test(text)) node.setAttribute('direction', 'rtl');
  }
  if (parent) parent.appendChild(node);
  return node;
}

function el(tag, className, html) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (html !== undefined) node.innerHTML = html;
  return node;
}

const fmt = (v, d = 1) => {
  const s = (Math.round(v * 10 ** d) / 10 ** d).toFixed(d).replace(/\.?0+$/, '');
  return s === '-0' ? '0' : s;
};

// ===== חישובים =====
export function series(freq, mode) {
  const n = freq.reduce((s, v) => s + v, 0);
  let run = 0;
  const cum = freq.map((v) => (run += v));
  if (mode === 'rel') return freq.map((v) => (v / n) * 100);
  if (mode === 'cum') return cum;
  if (mode === 'cumrel') return cum.map((v) => (v / n) * 100);
  return freq.slice();
}

const MODE_NAME = {
  freq: 'שכיחות',
  rel: 'שכיחות יחסית',
  cum: 'שכיחות מצטברת',
  cumrel: 'מצטברת יחסית',
};
const Y_LABEL = {
  freq: 'שכיחות (כמה)',
  rel: 'שכיחות יחסית (%)',
  cum: 'שכיחות מצטברת (כמה עד)',
  cumrel: 'שכיחות מצטברת יחסית (%)',
};
const isPct = (m) => m === 'rel' || m === 'cumrel';

function niceStep(max, target = 5) {
  const raw = max / target;
  const p = Math.pow(10, Math.floor(Math.log10(raw)));
  const f = raw / p;
  return (f < 1.5 ? 1 : f < 3 ? 2 : f < 7 ? 5 : 10) * p;
}

// ===== שרטוט =====
const W = 600, H = 380, L = 70, R = 580, T = 24, B = 312;

// labels: תוויות ציר X · values: גובה העמודות · opts: { xLabel, yLabel, pct, yMax, line, guide, highlight, showValues, aria }
function drawBars(labels, values, opts = {}) {
  const svg = svgEl('svg', { viewBox: `0 0 ${W} ${H}`, class: 'ltr', role: 'img', 'aria-label': opts.aria || 'גרף שכיחויות' });
  const maxV = opts.yMax ?? Math.max(...values, 1);
  const step = opts.yStep ?? niceStep(maxV);
  const top = opts.yMax ?? Math.ceil(maxV / step) * step;
  const sy = (v) => B - (v / top) * (B - T);
  const slot = (R - L) / labels.length;
  const bw = slot * (opts.gapless ? 1 : 0.62);
  const cx = (i) => L + slot * i + slot / 2;

  const grid = svgEl('g', {}, svg);
  for (let t = 0; t <= top + 1e-9; t += step) {
    svgEl('line', { x1: L, x2: R, y1: sy(t), y2: sy(t), class: 'f-grid' }, grid);
    svgEl('text', { x: L - 10, y: sy(t) + 5, 'text-anchor': 'end', class: 'f-tick' }, grid, fmt(t) + (opts.pct ? '%' : ''));
  }

  const bars = svgEl('g', {}, svg);
  values.forEach((v, i) => {
    const cls = 'f-bar' + (opts.highlight != null && [].concat(opts.highlight).includes(i) ? ' f-bar-hi' : '') + (opts.wrong ? ' f-bar-wrong' : '');
    svgEl('rect', { x: cx(i) - bw / 2, y: sy(v), width: bw, height: Math.max(0, B - sy(v)), class: cls }, bars);
    if (opts.showValues !== false) {
      svgEl('text', { x: cx(i), y: sy(v) - (opts.line ? 12 : 7), 'text-anchor': 'middle', class: 'f-val' }, bars, fmt(v) + (opts.pct ? '%' : ''));
    }
    svgEl('text', { x: cx(i), y: B + 22, 'text-anchor': 'middle', class: 'f-tick' }, bars, labels[i]);
  });

  if (opts.line) {
    // הנקודות באמצע ראש כל עמודה, מעל התווית "עד ...", כדי שיהיה ברור איזו נקודה שייכת לאיזה ערך
    const pts = values.map((v, i) => `${cx(i)},${sy(v)}`).join(' ');
    svgEl('polyline', { points: pts, class: 'f-line' }, svg);
    values.forEach((v, i) => svgEl('circle', { cx: cx(i), cy: sy(v), r: 5, class: 'f-pt' }, svg));
  }

  // קו עזר לקריאת הגרף: מראש העמודה אל ציר Y
  if (opts.guide != null) {
    const i = opts.guide;
    const gx = cx(i); // באמצע העמודה, מעל התווית "עד ..."
    svgEl('line', { x1: gx, x2: L, y1: sy(values[i]), y2: sy(values[i]), class: 'f-guide' }, svg);
    svgEl('line', { x1: gx, x2: gx, y1: B, y2: sy(values[i]), class: 'f-guide' }, svg);
  }

  svgEl('line', { x1: L, x2: R, y1: B, y2: B, class: 'f-axis' }, svg);
  svgEl('line', { x1: L, x2: L, y1: T, y2: B, class: 'f-axis' }, svg);
  if (opts.xLabel) svgEl('text', { x: (L + R) / 2, y: B + 54, 'text-anchor': 'middle', class: 'f-axis-title' }, svg, opts.xLabel);
  if (opts.yLabel) svgEl('text', { x: 16, y: (T + B) / 2, 'text-anchor': 'middle', class: 'f-axis-title', transform: `rotate(-90 16 ${(T + B) / 2})` }, svg, opts.yLabel);
  return svg;
}

// ===== f-chart =====
// { type: 'f-chart', labels: ['0','1',...], freq: [3, 8, ...],
//   mode: 'freq' | 'rel' | 'cum' | 'cumrel'   ← מה מוצג בהתחלה
//   modes: ['freq','rel','cum']                ← כפתורי מעבר (רשות. בלי זה: רק mode)
//   cumLabels: ['עד 50', ...]                  ← תוויות ציר X במצב מצטבר (רשות)
//   xLabel, yLabel (ברירת מחדל לפי המצב), title, caption,
//   gapless (מחלקות של נתון רציף), line (קו שמחבר את ראשי העמודות במצב מצטבר),
//   guide: i (קו עזר מקודקוד עמודה i לציר Y), highlight: i או [i, j],
//   wrong: true + rawX / rawY ← גרף "הפוך" לדוגמת מוקש: rawX תוויות, rawY גבהים, כמו שהם }
function renderChart(block) {
  const wrap = el('div', 'block f-chart');
  if (block.title) wrap.appendChild(el('div', 'f-title', block.title));
  const host = el('div', 'f-svg');
  const readout = el('div', 'f-readout');

  if (block.wrong) {
    host.appendChild(drawBars(block.rawX, block.rawY, {
      xLabel: block.xLabel, yLabel: block.yLabel, wrong: true, aria: block.title || 'גרף שגוי',
    }));
    wrap.appendChild(host);
    if (block.caption) wrap.appendChild(el('div', 'f-caption', block.caption));
    return wrap;
  }

  const modes = block.modes || [block.mode || 'freq'];
  let mode = block.mode || modes[0];
  const n = block.freq.reduce((s, v) => s + v, 0);

  const tabs = el('div', 'f-tabs');
  const btns = {};
  if (modes.length > 1) {
    modes.forEach((m) => {
      const b = el('button', 'f-tab', MODE_NAME[m]);
      b.type = 'button';
      b.addEventListener('click', () => { mode = m; draw(); });
      btns[m] = b;
      tabs.appendChild(b);
    });
    wrap.appendChild(tabs);
  }

  function draw() {
    const vals = series(block.freq, mode);
    const cumMode = mode === 'cum' || mode === 'cumrel';
    const labels = cumMode && block.cumLabels ? block.cumLabels : block.labels;
    const pct = isPct(mode);
    host.replaceChildren(drawBars(labels, vals, {
      xLabel: (cumMode && block.cumXLabel) || block.xLabel,
      yLabel: (block.yLabels && block.yLabels[mode]) || Y_LABEL[mode],
      pct,
      yMax: pct && cumMode ? 100 : (mode === 'cum' ? n : undefined),
      yStep: pct && cumMode ? 20 : undefined,
      gapless: block.gapless,
      line: block.line && cumMode,
      guide: block.guide,
      highlight: block.highlight,
      aria: `${MODE_NAME[mode]}${block.title ? ': ' + block.title : ''}`,
    }));
    Object.entries(btns).forEach(([m, b]) => b.classList.toggle('active', m === mode));
    const msg = {
      freq: `גובה כל עמודה = <b>כמה</b> תצפיות יש בערך הזה. סך הכול: <b class="ltr">${n}</b>.`,
      rel: `גובה כל עמודה = <b>איזה חלק</b> מכל ה-<span class="ltr">${n}</span>. כל העמודות יחד: <b class="ltr">100%</b>.`,
      cum: `גובה כל עמודה = כמה תצפיות <b>עד הערך הזה, כולל</b>. העמודה האחרונה תמיד <b class="ltr">${n}</b>.`,
      cumrel: 'גובה כל עמודה = איזה אחוז <b>עד הערך הזה, כולל</b>. העמודה האחרונה תמיד <b class="ltr">100%</b>.',
    }[mode];
    readout.innerHTML = msg;
  }
  draw();

  wrap.appendChild(host);
  if (modes.length > 1 || block.readout) wrap.appendChild(readout);
  if (block.caption) wrap.appendChild(el('div', 'f-caption', block.caption));
  return wrap;
}

registerBlockRenderer('f-chart', renderChart);

// ===== f-fill: טבלה להשלמה =====
// { type: 'f-fill', prompt, headers: [...], rows: [ ['0', '3', { answer: 0.12, tolerance: 0.005 }], ... ],
//   hint: 'רמז כללי אחרי טעות', solvedText }
// תא רגיל = מחרוזת (HTML). תא להשלמה = { answer, tolerance }. בודקים את כל התאים יחד,
// תא נכון נצבע ונעול, תא שגוי מסומן. נפתר כשכל התאים נכונים.
function practiceFill(q, onSolved) {
  const wrap = el('div', 'question-block f-fill');
  wrap.appendChild(el('div', 'question-prompt', q.prompt));
  const scroller = el('div', 'f-fill-scroll');
  const table = el('table', 'f-fill-table');
  const thead = el('thead');
  const hr = el('tr');
  q.headers.forEach((h) => hr.appendChild(el('th', '', h)));
  thead.appendChild(hr);
  table.appendChild(thead);
  const tbody = el('tbody');
  const inputs = [];
  q.rows.forEach((row) => {
    const tr = el('tr');
    row.forEach((cell) => {
      const td = el('td');
      if (cell && typeof cell === 'object') {
        const inp = el('input', 'input-field ltr-field f-cell');
        inp.type = 'number';
        inp.step = 'any';
        inp.setAttribute('aria-label', 'תא להשלמה');
        inputs.push({ inp, ans: cell.answer, tol: cell.tolerance ?? 0 });
        td.appendChild(inp);
      } else {
        td.innerHTML = cell;
      }
      tr.appendChild(td);
    });
    tbody.appendChild(tr);
  });
  table.appendChild(tbody);
  scroller.appendChild(table);
  wrap.appendChild(scroller);

  const btn = el('button', 'btn btn-primary', 'בדיקה');
  const feedback = el('div', 'feedback');
  let solved = false;
  const check = () => {
    if (solved) return;
    let ok = 0, empty = 0;
    inputs.forEach((c) => {
      const v = parseFloat(c.inp.value);
      c.inp.classList.remove('f-ok', 'f-bad');
      if (Number.isNaN(v)) { empty++; return; }
      if (Math.abs(v - c.ans) <= c.tol + 1e-9) { ok++; c.inp.classList.add('f-ok'); c.inp.disabled = true; }
      else c.inp.classList.add('f-bad');
    });
    if (ok === inputs.length) {
      solved = true;
      btn.disabled = true;
      feedback.className = 'feedback ok';
      feedback.textContent = q.solvedText || 'כל הכבוד! 🎉 הטבלה מלאה ונכונה.';
      onSolved(true);
    } else {
      feedback.className = 'feedback hint';
      const parts = [`נכונים: ${ok} מתוך ${inputs.length}.`];
      if (empty) parts.push('יש תאים ריקים.');
      if (q.hint) parts.push('💡 ' + q.hint);
      feedback.textContent = parts.join(' ');
    }
  };
  btn.addEventListener('click', check);
  wrap.addEventListener('keydown', (e) => { if (e.key === 'Enter' && e.target.tagName === 'INPUT') check(); });
  wrap.append(btn, feedback);
  return wrap;
}

registerQuestionType('f-fill', { practice: practiceFill });

// ===== שאלה עם תרשים =====
// mc ו-numeric רגילות, עם שדה chart רשות (בלוק f-chart, table או כל בלוק אחר) שמוצג לפני השאלה.
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
          r.el.appendChild(el('div', `f-verdict ${result.isCorrect ? 'ok' : 'bad'}`, result.isCorrect ? '✓ תשובה נכונה' : '✗ תשובה שגויה'));
          return result;
        },
      };
    },
  };
}

registerQuestionType('f-mc', withChart('mc'));
registerQuestionType('f-numeric', withChart('numeric'));
