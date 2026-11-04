// גרפים אינטראקטיביים ללומדת "סוגי גרפים": עמודות, עוגה, קו, וגרף שמטעה את העין.
// כל בלוק מקבל את הנתונים מקובץ התוכן, כך שאותו רכיב משמש גם ביחידות וגם במבחן.
// הצבעים מגיעים מטוקנים ב-cs1.css. ב-JS יש רק מחלקות, בלי צבעים.

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

// 54.00000000001 → 54
const fmt = (n) => String(Math.round(n * 100) / 100);

// '{label}' ו-'{value}' בתבנית של קובץ התוכן
function fill(template, d) {
  return template.replace(/\{label\}/g, d.label).replace(/\{value\}/g, fmt(d.value));
}

// רשת, צירים וכותרות צירים. מחזיר את הפונקציה שממירה ערך לגובה.
function frame(svg, { L, R, T, B, min, max, step, xTitle, yTitle }) {
  const y = (v) => B - ((v - min) / (max - min)) * (B - T);
  for (let v = min; v <= max + 1e-9; v += step) {
    svgEl('line', { x1: L, x2: R, y1: y(v), y2: y(v), class: 'cs1-grid' }, svg);
    svgEl('text', { x: L - 10, y: y(v) + 4, 'text-anchor': 'end', class: 'cs1-tick' }, svg, fmt(v));
  }
  svgEl('line', { x1: L, x2: L, y1: T - 6, y2: B, class: 'cs1-axis' }, svg);
  svgEl('line', { x1: L, x2: R, y1: B, y2: B, class: 'cs1-axis' }, svg);
  if (xTitle) svgEl('text', { x: (L + R) / 2, y: B + 44, 'text-anchor': 'middle', class: 'cs1-axis-title' }, svg, xTitle);
  if (yTitle) {
    const cy = (T + B) / 2;
    svgEl('text', { x: 16, y: cy, 'text-anchor': 'middle', class: 'cs1-axis-title', transform: `rotate(-90 16 ${cy})` }, svg, yTitle);
  }
  return y;
}

function onActivate(node, fn) {
  node.addEventListener('click', fn);
  node.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fn(); }
  });
}

// ===== גרף עמודות (לחיצה על עמודה מציגה את הערך) =====
// { type: 'stick-chart', data: [{label, value}], max, step, xTitle, yTitle,
//   readout: '<b>{value}</b> תלמידים ענו {label}', hint: 'לחצו על עמודה' }
function renderStickChart(block) {
  const wrap = el('div', 'block cs1-chart');
  const svg = svgEl('svg', { viewBox: '0 0 560 320', class: 'ltr', role: 'img', 'aria-label': block.title || block.yTitle || '' });
  const L = 60, R = 530, T = 24, B = 270;
  const data = block.data || [];
  const max = block.max ?? Math.max(...data.map((d) => d.value), 1);
  const y = frame(svg, { L, R, T, B, min: 0, max, step: block.step ?? Math.max(1, Math.ceil(max / 6)), xTitle: block.xTitle, yTitle: block.yTitle });
  const readout = el('div', 'cs1-readout', block.hint || 'לחצו על עמודה');
  const slot = (R - L) / data.length;
  const sticks = [];

  data.forEach((d, i) => {
    const cx = L + slot * (i + 0.5);
    svgEl('text', { x: cx, y: B + 20, 'text-anchor': 'middle', class: 'cs1-tick' }, svg, d.label);
    const stick = svgEl('rect', {
      x: cx - 22, y: y(d.value), width: 44, height: B - y(d.value),
      class: 'cs1-stick', tabindex: 0, role: 'button', 'aria-label': `${d.label}: ${d.value}`,
    }, svg);
    sticks.push({ stick, cx, d });
  });

  // הסימונים נוספים בסוף, כדי שיופיעו מעל העמודות
  const marks = svgEl('g', {}, svg);
  sticks.forEach(({ stick, cx, d }) => onActivate(stick, () => {
    sticks.forEach((s) => s.stick.classList.remove('on'));
    stick.classList.add('on');
    marks.replaceChildren();
    svgEl('line', { x1: L, x2: cx, y1: y(d.value), y2: y(d.value), class: 'cs1-guide' }, marks);
    svgEl('text', { x: cx, y: y(d.value) - 8, 'text-anchor': 'middle', class: 'cs1-val' }, marks, fmt(d.value));
    readout.innerHTML = fill(block.readout || '<b>{label}</b>: <b>{value}</b>', d);
  }));

  wrap.append(svg, readout);
  return wrap;
}

// ===== גרף עוגה =====
// { type: 'pie-chart', data: [{label, value}] (value = אחוז), total: 200, unit: 'תלמידים',
//   details: true ← מציג גם את חישוב מספר האנשים. במבחן משאירים false.
//   normalize: true ← לגרף מטעה שסכום האחוזים בו אינו 100: הגזרות מחולקות לפי הסכום,
//                     והתוויות ממשיכות להציג את האחוזים המקוריים. }
function renderPieChart(block) {
  const wrap = el('div', 'block cs1-chart');
  const row = el('div', 'cs1-pie-row');
  const svg = svgEl('svg', { viewBox: '0 0 280 280', class: 'cs1-pie', role: 'img', 'aria-label': block.title || '' });
  const legend = el('div', 'cs1-legend');
  const readout = el('div', 'cs1-readout', block.hint || 'לחצו על גזרה או על המקרא');
  const cx = 140, cy = 140, r = 120;
  let a0 = -Math.PI / 2;
  const parts = [];
  const whole = block.normalize ? (block.data || []).reduce((s, d) => s + d.value, 0) : 100;

  (block.data || []).forEach((d, i) => {
    const a1 = a0 + (d.value / whole) * 2 * Math.PI;
    const mid = (a0 + a1) / 2;
    const large = a1 - a0 > Math.PI ? 1 : 0;
    const path = `M${cx},${cy} L${cx + r * Math.cos(a0)},${cy + r * Math.sin(a0)} A${r},${r} 0 ${large} 1 ${cx + r * Math.cos(a1)},${cy + r * Math.sin(a1)} Z`;
    const g = svgEl('g', { class: `cs1-slice cs1-c${i % 4}`, tabindex: 0, role: 'button', 'aria-label': `${d.label}: ${d.value}%` }, svg);
    svgEl('path', { d: path }, g);
    svgEl('text', { x: cx + r * 0.62 * Math.cos(mid), y: cy + r * 0.62 * Math.sin(mid) + 5, 'text-anchor': 'middle', class: 'cs1-slice-label' }, g, d.value + '%');
    const pop = `translate(${(8 * Math.cos(mid)).toFixed(1)} ${(8 * Math.sin(mid)).toFixed(1)})`;

    const btn = el('button', `cs1-legend-item cs1-c${i % 4}`, `<i></i>${d.label}`);
    btn.type = 'button';
    legend.appendChild(btn);
    parts.push({ g, btn });

    const show = () => {
      parts.forEach((p) => { p.g.classList.remove('on'); p.g.removeAttribute('transform'); p.btn.classList.remove('on'); });
      g.classList.add('on');
      g.setAttribute('transform', pop);
      btn.classList.add('on');
      let msg = `${d.label}: <b class="ltr">${d.value}%</b>`;
      if (block.details && block.total) {
        msg += ` · <span class="ltr">${d.value}% × ${block.total} = <b>${fmt(d.value / 100 * block.total)}</b></span> ${block.unit || ''}`;
      }
      readout.innerHTML = msg;
    };
    onActivate(g, show);
    btn.addEventListener('click', show);
    a0 = a1;
  });

  row.append(svg, legend);
  wrap.append(row, readout);
  if (block.total) wrap.appendChild(el('div', 'cs1-caption', `סך הכול: <span class="ltr">${block.total}</span> ${block.unit || ''}`));
  return wrap;
}

// ===== גרף קו =====
// { type: 'line-chart', labels: ['6:00', ...], values: [14, ...], max, step, xTitle, yTitle,
//   unit: '°C', sliderLabel: 'שעה:', showChange: true ← מציג עלייה/ירידה מהנקודה הקודמת }
function renderLineChart(block) {
  const wrap = el('div', 'block cs1-chart');
  const svg = svgEl('svg', { viewBox: '0 0 560 320', class: 'ltr', role: 'img', 'aria-label': block.title || block.yTitle || '' });
  const L = 60, R = 530, T = 20, B = 270;
  const labels = block.labels || [];
  const values = block.values || [];
  const max = block.max ?? Math.max(...values, 1);
  const y = frame(svg, { L, R, T, B, min: 0, max, step: block.step ?? Math.max(1, Math.ceil(max / 6)), xTitle: block.xTitle, yTitle: block.yTitle });
  const x = (i) => L + 20 + i * ((R - L - 40) / Math.max(labels.length - 1, 1));
  const unit = block.unit || '';

  labels.forEach((lab, i) => svgEl('text', { x: x(i), y: B + 20, 'text-anchor': 'middle', class: 'cs1-tick' }, svg, lab));
  svgEl('polyline', { points: values.map((v, i) => `${x(i)},${y(v)}`).join(' '), class: 'cs1-line' }, svg);
  const dots = values.map((v, i) => svgEl('circle', { cx: x(i), cy: y(v), r: 5, class: 'cs1-dot' }, svg));
  const marks = svgEl('g', {}, svg);

  const sliderRow = el('div', 'cs1-slider');
  const id = 'cs1-range-' + Math.random().toString(36).slice(2, 8);
  sliderRow.innerHTML = `<label for="${id}">${block.sliderLabel || 'נקודה:'}</label>`;
  const range = el('input');
  Object.assign(range, { type: 'range', id, min: 0, max: values.length - 1, step: 1, value: 0 });
  range.dir = 'ltr';
  sliderRow.appendChild(range);
  const readout = el('div', 'cs1-readout');

  const update = () => {
    const i = +range.value;
    dots.forEach((d) => d.classList.remove('on'));
    dots[i].classList.add('on');
    marks.replaceChildren();
    svgEl('line', { x1: x(i), x2: x(i), y1: B, y2: y(values[i]), class: 'cs1-guide' }, marks);
    svgEl('line', { x1: L, x2: x(i), y1: y(values[i]), y2: y(values[i]), class: 'cs1-guide' }, marks);
    svgEl('text', { x: x(i), y: y(values[i]) - 12, 'text-anchor': 'middle', class: 'cs1-val' }, marks, fmt(values[i]) + (unit === '°C' ? '°' : ''));
    let msg = `<b class="ltr">${labels[i]}</b>: <b class="ltr">${fmt(values[i])}${unit}</b>`;
    if (block.showChange && i > 0) {
      const diff = values[i] - values[i - 1];
      msg += diff === 0
        ? ` · אין שינוי מאז <span class="ltr">${labels[i - 1]}</span>`
        : ` · מאז <span class="ltr">${labels[i - 1]}</span>: ${diff > 0 ? 'עלייה' : 'ירידה'} של <b class="ltr">${fmt(Math.abs(diff))}${unit === '°C' ? '°' : unit}</b>`;
    }
    readout.innerHTML = msg;
  };
  range.addEventListener('input', update);
  update();

  wrap.append(svg, sliderRow, readout);
  return wrap;
}

// ===== גרף שמטעה את העין: אותם נתונים, שני צירים =====
// { type: 'axis-trick', data: [{label, value}], bases: [90, 0], max: 110,
//   steps: { 90: 5, 0: 20 }, yTitle }
function renderAxisTrick(block) {
  const wrap = el('div', 'block cs1-chart');
  const toggle = el('div', 'cs1-toggle');
  const svg = svgEl('svg', { viewBox: '0 0 560 300', class: 'ltr', role: 'img', 'aria-label': block.title || block.yTitle || '' });
  const data = block.data || [];
  const bases = block.bases || [Math.floor(Math.min(...data.map((d) => d.value)) * 0.95), 0];
  const max = block.max ?? Math.ceil(Math.max(...data.map((d) => d.value)) * 1.05);

  const draw = (base) => {
    svg.replaceChildren();
    const L = 60, R = 530, T = 20, B = 250;
    const step = block.steps?.[base] ?? Math.max(1, Math.ceil((max - base) / 5));
    const y = frame(svg, { L, R, T, B, min: base, max, step, yTitle: block.yTitle });
    data.forEach((d, i) => {
      const cx = L + (R - L) * ((i + 1) / (data.length + 1));
      svgEl('rect', { x: cx - 50, y: y(d.value), width: 100, height: B - y(d.value), class: `cs1-bar cs1-c${i % 4}` }, svg);
      svgEl('text', { x: cx, y: y(d.value) - 8, 'text-anchor': 'middle', class: 'cs1-val cs1-val-ink' }, svg, fmt(d.value));
      svgEl('text', { x: cx, y: B + 22, 'text-anchor': 'middle', class: 'cs1-tick' }, svg, d.label);
    });
  };

  bases.forEach((base, i) => {
    const btn = el('button', 'cs1-toggle-btn' + (i === 0 ? ' on' : ''), `ציר מתחיל ב-<span class="ltr">${base}</span>`);
    btn.type = 'button';
    btn.addEventListener('click', () => {
      toggle.querySelectorAll('button').forEach((b) => b.classList.remove('on'));
      btn.classList.add('on');
      draw(base);
    });
    toggle.appendChild(btn);
  });
  draw(bases[0]);

  // ציר אחד בלבד (למשל במבחן): בלי כפתור החלפה
  if (bases.length > 1) wrap.appendChild(toggle);
  wrap.appendChild(svg);
  return wrap;
}

registerBlockRenderer('stick-chart', renderStickChart);
registerBlockRenderer('pie-chart', renderPieChart);
registerBlockRenderer('line-chart', renderLineChart);
registerBlockRenderer('axis-trick', renderAxisTrick);

// ===== שאלת מבחן עם גרף =====
// שאלה במבחן לא יכולה להחזיק בלוקים, ולכן 'chart-mc' ו-'chart-numeric' הן
// mc ו-numeric רגילות, עם שדה chart (בלוק גרף) שמוצג מתחת לשאלה.
// שימו לב: validate לא בודק כאן "תשובה נכונה אחת". בודקים בעין.
function withChart(baseType) {
  return {
    practice: (q, onSolved) => {
      const wrap = el('div');
      wrap.appendChild(renderBlock(q.chart));
      wrap.appendChild(renderQuestionPractice({ ...q, type: baseType }, onSolved));
      return wrap;
    },
    exam: (q, index) => {
      const r = renderQuestionExam({ ...q, type: baseType }, index);
      r.el.querySelector('.question-prompt').after(renderBlock(q.chart));
      return r;
    },
  };
}

registerQuestionType('chart-mc', withChart('mc'));
registerQuestionType('chart-numeric', withChart('numeric'));
