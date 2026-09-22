// ===== מסך הבית: פס מסלול פשוט + כרטיסיות פרקים =====
// קורא הכל מ-content/manifest.js — הוספת פרק/יחידה חדשה מופיעה כאן אוטומטית.

import { CHAPTERS } from '../../content/manifest.js';
import * as Progress from '../progress.js';
import { COURSE } from '../../content/manifest.js';
import { t } from './phrases.js';
import { consumeRoadmapScrollHint } from './scroll-hint.js';

// כיתה היא שדה טקסט חופשי (לא רשימה סגורה) כי יש תלמידות מכמה בתי ספר
// שונים עם מבנה כיתות שונה — הרשימה כאן היא רק הצעות ל-datalist, לא
// אילוץ. שם בית הספר קיים כדי להבחין בין תלמידות עם שם+כיתה זהים בבתי
// ספר שונים (המורה מלמדת יותר מבית ספר אחד).
//
// ברשת "צביה היברידי" יש כיתה אחת בלבד לכל שכבה, אז שדה בית הספר ממולא
// מראש (עדיין ניתן לעריכה/מחיקה למי שמגיעה מבית ספר אחר), וההצעות
// לכיתה הן שכבה בלבד, בלי מספר כיתה.
const DEFAULT_SCHOOL = 'צביה היברידי';
const CLASS_SUGGESTIONS = ["י'", "י״א", "י״ב"];

const STATUS_ICON = {
  locked: '🔒',
  'not-started': '▶',
  current: '✍️',
  completed: '✅',
  exempted: '🏅',
};

function el(tag, className, html) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (html !== undefined) node.innerHTML = html;
  return node;
}

export function renderLogin(container) {
  container.innerHTML = '';
  if (!Progress.isStorageAvailable()) {
    const warn = el('div', 'box box-trap');
    warn.style.marginBottom = 'var(--space-4)';
    warn.innerHTML = `<div class="box-icon">⚠️</div><div><div class="box-title">שימו לב</div><div class="box-body">נראה שהדפדפן חוסם שמירת נתונים כאן (למשל גלישה פרטית/incognito). ההתקדמות <strong>לא תישמר</strong> אחרי סגירת הדף. כדאי לצאת ממצב גלישה פרטית ולנסות שוב.</div></div>`;
    container.appendChild(warn);
  }
  const wrap = el('div', 'card fade-in');
  wrap.style.marginTop = 'var(--space-6)';
  wrap.innerHTML = `
    <div style="text-align:center;margin-bottom:var(--space-4);">
      <svg class="mascot" style="width:96px;height:96px;"><use href="assets/mascot.svg#mascot-wave"></use></svg>
      <h1 id="login-title">${t('welcome_title', 'f')}</h1>
      <p class="muted">כמה פרטים קטנים כדי שנוכל לשמור לך את ההתקדמות</p>
    </div>
  `;
  const form = el('form');
  form.innerHTML = `
    <label class="muted" for="student-name">שם מלא</label>
    <input id="student-name" class="input-field" type="text" placeholder="לדוגמה: נועה לוי" required style="margin-bottom:var(--space-3);margin-top:4px;">
    <label class="muted" for="student-school">בית ספר</label>
    <input id="student-school" class="input-field" type="text" placeholder="לדוגמה: תיכון הדסים" value="${DEFAULT_SCHOOL}" required style="margin-bottom:var(--space-3);margin-top:4px;">
    <label class="muted" for="student-class">כיתה</label>
    <input id="student-class" class="input-field" type="text" list="class-suggestions" placeholder="לדוגמה: י״א 2" required style="margin-bottom:var(--space-3);margin-top:4px;">
    <datalist id="class-suggestions">
      ${CLASS_SUGGESTIONS.map(c => `<option value="${c}"></option>`).join('')}
    </datalist>
    <label class="muted" for="student-gender">איך נפנה אלייך?</label>
    <select id="student-gender" class="input-field" style="margin-bottom:var(--space-4);margin-top:4px;">
      <option value="f" selected>בלשון נקבה</option>
      <option value="m">בלשון זכר</option>
    </select>
    <button type="submit" class="btn btn-primary btn-block" id="login-submit">${t('start_btn', 'f')}</button>
  `;
  wrap.appendChild(form);
  container.appendChild(wrap);

  const genderSelect = form.querySelector('#student-gender');
  genderSelect.addEventListener('change', () => {
    const g = genderSelect.value;
    form.querySelector('#login-submit').textContent = t('start_btn', g);
    wrap.querySelector('#login-title').textContent = t('welcome_title', g);
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = form.querySelector('#student-name').value;
    const school = form.querySelector('#student-school').value;
    const className = form.querySelector('#student-class').value;
    const gender = genderSelect.value;
    if (!name.trim() || !school.trim() || !className.trim()) return;
    await Progress.loginStudent(name, school, className, gender);
    location.hash = '#roadmap';
  });
}

function renderPathStrip() {
  const strip = el('div', 'path-strip');
  CHAPTERS.forEach(ch => {
    const status = Progress.chapterStatus(ch.id);
    const nodeWrap = el('div', `path-node-wrap state-${status}`);
    nodeWrap.style.setProperty('--node-color', `var(--${ch.colorVar})`);
    const node = el('div', 'path-node', status === 'completed' ? '✓' : String(ch.number));
    nodeWrap.appendChild(node);
    nodeWrap.appendChild(el('div', 'path-node-label', ch.icon));
    strip.appendChild(nodeWrap);
  });
  return strip;
}

function renderUnitCard(unit, chapter) {
  const status = unit.modulePath ? Progress.unitStatus(unit.id) : 'locked';
  const comingSoon = !unit.modulePath;
  const isExemptionType = unit.type === 'exemption';
  const isBonusType = unit.type === 'bonus';
  const card = el('a', `unit-card ${status === 'locked' || comingSoon ? 'locked' : ''} ${isExemptionType ? 'type-exemption' : ''} ${isBonusType ? 'type-bonus' : ''} ${comingSoon ? 'coming-soon' : ''}`);
  card.href = comingSoon || status === 'locked' ? '#' : `#unit/${unit.id}`;
  card.dataset.unitId = unit.id;
  card.style.setProperty('--band-color', `var(--${chapter.colorVar})`);

  const icon = el('div', 'unit-icon', `<span>${unit.icon}</span>`);
  const mid = el('div');
  mid.appendChild(el('div', 'unit-title', unit.title));
  mid.appendChild(el('div', 'unit-meta', comingSoon ? 'בקרוב ✨' : `${unit.estMinutes} דק׳ · ${labelForType(unit.type)}`));

  card.appendChild(icon);
  card.appendChild(mid);
  card.appendChild(el('div', 'unit-status', comingSoon ? '🌱' : STATUS_ICON[status] || ''));
  return card;
}

function labelForType(type) {
  return { lesson: 'שיעור', lab: 'מעבדה', quiz: 'מבחן', exemption: 'אתגר פטור', reference: 'סיכום', bonus: '✨ בונוס (לא חובה)' }[type] || '';
}

export function renderRoadmap(container) {
  if (!Progress.getStudent()) { location.hash = '#login'; return; }
  const student = Progress.getStudent();

  container.innerHTML = '';
  const wrap = el('div', 'fade-in');

  const topBar = el('div');
  topBar.style.cssText = 'display:flex;justify-content:space-between;align-items:center;margin-bottom:var(--space-3);';
  topBar.innerHTML = `
    <div>שלום, <strong id="greeting-name"></strong> 👋</div>
    ${Progress.isClassMode()
      ? '<div class="xp-counter class-mode-badge" title="כל היחידות פתוחות. לכיבוי: להוסיף ?class=0 לכתובת">👩‍🏫 מצב כיתה</div>'
      : `<div class="xp-counter">⭐ ${Progress.computeXP()} XP</div>`}
  `;
  // student.name הוקלד ע"י התלמידה בטופס הכניסה — לא סטטי/מפתחת, אז
  // חייבים textContent (לא innerHTML) כדי לא לפתוח פרצת XSS דרך שם עם
  // תגיות HTML.
  topBar.querySelector('#greeting-name').textContent = student.name;
  wrap.appendChild(topBar);
  wrap.appendChild(renderPathStrip());

  const { done, total } = Progress.overallCompletion();
  const overall = el('div', 'overall-progress');
  overall.innerHTML = `
    <div class="overall-progress-track"><div class="overall-progress-fill" style="width:${total ? (done / total * 100) : 0}%"></div></div>
    <div class="overall-progress-text">${done} / ${total} יחידות הושלמו</div>
  `;
  wrap.appendChild(overall);

  CHAPTERS.forEach(ch => {
    const band = el('div', 'chapter-band');
    band.dataset.chapterId = ch.id;
    band.style.setProperty('--band-color', `var(--${ch.colorVar})`);
    band.innerHTML = `<span class="chapter-icon">${ch.icon}</span> פרק ${ch.number}: ${ch.title}`;
    wrap.appendChild(band);
    ch.units.forEach(u => wrap.appendChild(renderUnitCard(u, ch)));
  });

  const logoutBtn = el('button', 'btn btn-ghost', 'התנתקות');
  logoutBtn.style.marginTop = 'var(--space-5)';
  logoutBtn.addEventListener('click', Progress.logout);
  wrap.appendChild(logoutBtn);

  container.appendChild(wrap);

  // גלילה חכמה: אם מגיעים לכאן אחרי סיום יחידה/פרק, ממרכזים את החלק
  // הרלוונטי הבא (ראי scroll-hint.js) — אחרת פשוט חוזרים לראש המסך.
  // בכוונה "instant" ולא "smooth": גלילת smooth תלויה בלולאת האנימציה של
  // הדפדפן (requestAnimationFrame), שלא רצה כשהטאב לא פעיל/גלוי — מה
  // שגרם לגלילה "להיבלע" בלי אזהרה. instant הוא סנכרוני ותמיד עובד.
  const hint = consumeRoadmapScrollHint();
  const target = hint && hint.type === 'unit'
    ? wrap.querySelector(`[data-unit-id="${hint.id}"]`)
    : hint && hint.type === 'chapter'
      ? wrap.querySelector(`[data-chapter-id="${hint.id}"]`)
      : null;
  if (target) {
    target.scrollIntoView({ behavior: 'instant', block: 'center' });
  } else {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }
}

export function renderGrandFinale(container) {
  container.innerHTML = '';
  const student = Progress.getStudent();
  const wrap = el('div', 'grand-celebrate pop-in');
  wrap.innerHTML = `
    <div class="grand-icon">🏆</div>
    <h1>כל הכבוד, <span id="finale-name"></span>!</h1>
    <div class="certificate">
      <h2>תעודת סיום — ${COURSE.title}</h2>
      <p class="muted">${COURSE.finaleText}</p>
      <div class="xp-counter" style="justify-content:center;font-size:1.3rem;">⭐ ${Progress.computeXP()} XP</div>
    </div>
    <a href="#roadmap" class="btn btn-primary">חזרה למסלול</a>
  `;
  // ראו הערה למעלה ב-renderRoadmap: student.name הוא קלט תלמידה, textContent לא innerHTML.
  wrap.querySelector('#finale-name').textContent = student ? student.name : '';
  container.appendChild(wrap);
  import('./celebrate.js').then(({ fireConfetti }) => { fireConfetti(40); });
}
