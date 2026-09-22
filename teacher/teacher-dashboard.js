// ===== דשבורד מורה — קורא ישירות מ-Supabase, לפי content/manifest.js =====
// לא משתמש ב-js/progress.js (זה מיועד לסשן של תלמידה בודדת, מבוסס
// localStorage) — כאן צריך לחשב התקדמות לכל התלמידות בבת אחת מהשורות
// שחזרו מהשרת, אז יש כאן גרסה מקבילה קטנה של אותה לוגיקה (isUnitDone,
// סטטוס פרק), שמקורה עדיין manifest.js כדי שלא יהיו שני "מקורות אמת".

// נתיבים יחסיים ולא מוחלטים (`/content/...`): כך הדשבורד עובד גם כשהאתר
// מתארח בתת-תיקייה (GitHub Pages של ריפו אחד עם כמה לומדות), ולא רק
// כשהוא יושב בשורש הדומיין.
import { CHAPTERS, COURSE, getFlatUnits, findChapter } from '../content/manifest.js';
import { supabaseClient } from '../js/supabase-config.js';
import { XP_VALUES } from '../js/progress.js';

// זיהוי המורה והכיתות שהיא רואה יושבים ב-teachers.js — ראו שם גם את
// ההסבר מה השכבה הזו כן מבטיחה ומה לא, ואיך היא מוחלפת ב-Auth אמיתי.
import { findTeacherByHash, canSeeStudent, sha256Hex } from './teachers.js';

document.title = COURSE.teacherTitle;
const titleEl = document.getElementById('teacher-title');
if (titleEl) titleEl.textContent = COURSE.teacherTitle;

const ALL_UNITS = getFlatUnits();
// כל הלומדות חולקות פרויקט Supabase אחד (ואותה טבלת תלמידות), וכל אחת
// מסמנת את היחידות שלה בקידומת משלה. הדשבורד הזה הוא של קורס אחד בלבד,
// אז שורות ששייכות לקורס אחר מסוננות כאן — אחרת הן היו מופיעות בדוח של
// התלמידה כמזהה גולמי בלי כותרת.
const MY_UNIT_IDS = new Set(ALL_UNITS.map((u) => u.id));
const MY_CHAPTER_IDS = new Set(CHAPTERS.map((ch) => ch.id));
const GATING_UNITS = ALL_UNITS.filter((u) => u.type !== 'exemption' && u.type !== 'bonus');

function isUnitDone(unitId, progressMap) {
  const p = progressMap[unitId];
  return !!p && (p.status === 'completed' || p.status === 'exempted');
}

function chapterStatusFor(chapter, progressMap) {
  const gating = chapter.units.filter((u) => u.type !== 'exemption' && u.type !== 'bonus');
  // פרק שכולו בונוס — ראו ההערה המקבילה ב-js/progress.js. שתי הפונקציות
  // חייבות להישאר מסונכרנות, אחרת התלמידה והמורה רואות סטטוס שונה על
  // אותו פרק בדיוק.
  const relevant = gating.length ? gating : chapter.units.filter((u) => u.type !== 'exemption');
  if (!relevant.length) return 'not-started';
  const doneCount = relevant.filter((u) => isUnitDone(u.id, progressMap)).length;
  if (doneCount === 0) return 'not-started';
  if (doneCount === relevant.length) return 'completed';
  return 'current';
}

function computeXP(progressMap) {
  let xp = 0;
  GATING_UNITS.forEach((u) => {
    if (isUnitDone(u.id, progressMap)) xp += XP_VALUES[u.type] || 10;
  });
  return xp;
}

function unitTitle(unitId) {
  const unit = ALL_UNITS.find((u) => u.id === unitId);
  return unit ? unit.title : unitId;
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str == null ? '' : String(str);
  return div.innerHTML;
}

function $(id) { return document.getElementById(id); }

let allStudents = [];
let progressByStudent = {};
let quizByStudent = {};
let exemptionsByStudent = {};
let expandedId = null;
let currentTeacher = null;

async function tryLogin() {
  const val = $('teacher-pass').value;
  const hash = await sha256Hex(val);
  const teacher = findTeacherByHash(hash);
  if (teacher) {
    currentTeacher = teacher;
    $('login-screen').style.display = 'none';
    $('dashboard').style.display = 'block';
    const whoEl = $('teacher-who');
    if (whoEl) {
      whoEl.textContent = teacher.scope === 'all'
        ? `${teacher.name} · כל הכיתות`
        : `${teacher.name} · הכיתות שלי`;
    }
    loadData();
  } else {
    $('pass-err').textContent = 'סיסמה שגויה';
  }
}

async function loadData() {
  $('loading-msg').style.display = 'block';
  $('students-table').style.display = 'none';
  $('no-students').style.display = 'none';
  expandedId = null;

  const [studentsRes, progressRes, quizRes, exemptionRes] = await Promise.all([
    supabaseClient.from('students').select('*').order('class_name').order('name'),
    supabaseClient.from('unit_progress').select('*'),
    supabaseClient.from('quiz_answers').select('*'),
    supabaseClient.from('exemption_attempts').select('*'),
  ]);

  // כאן, ורק כאן, מצטמצמת הרשימה לכיתות של המורה המחוברת. כשיהיה Auth
  // אמיתי, Supabase כבר יחזיר רק אותן ו-canSeeStudent תחזיר תמיד true —
  // השורה הזו תישאר נכונה בלי שינוי.
  allStudents = (studentsRes.data || []).filter((s) => canSeeStudent(currentTeacher, s));

  progressByStudent = {};
  (progressRes.data || []).forEach((r) => {
    if (!progressByStudent[r.student_id]) progressByStudent[r.student_id] = {};
    progressByStudent[r.student_id][r.unit_id] = { status: r.status, lastSlide: r.last_slide, completedAt: r.completed_at };
  });

  quizByStudent = {};
  (quizRes.data || []).forEach((r) => {
    if (!MY_UNIT_IDS.has(r.unit_id)) return;
    if (!quizByStudent[r.student_id]) quizByStudent[r.student_id] = {};
    quizByStudent[r.student_id][r.unit_id] = r.answers;
  });

  exemptionsByStudent = {};
  (exemptionRes.data || []).forEach((r) => {
    if (!MY_CHAPTER_IDS.has(r.chapter_id)) return;
    if (!exemptionsByStudent[r.student_id]) exemptionsByStudent[r.student_id] = [];
    exemptionsByStudent[r.student_id].push(r);
  });

  populateClassFilter();
  buildTableHeader();
  renderStats();
  renderTable();
  $('last-refresh').textContent = 'עודכן: ' + new Date().toLocaleTimeString('he-IL');
}

function populateClassFilter() {
  const classes = [...new Set(allStudents.map((s) => s.class_name))].sort();
  const sel = $('filter-class');
  const current = sel.value;
  sel.innerHTML = '<option value="">כל הכיתות</option>' + classes.map((c) => `<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join('');
  sel.value = classes.includes(current) ? current : '';
}

function buildTableHeader() {
  $('table-head-row').innerHTML = '<th>שם</th><th>בית ספר</th><th>כיתה</th><th>התקדמות</th>' +
    CHAPTERS.map((ch) => `<th title="${escapeHtml(ch.title)}" style="text-align:center;">${ch.number}</th>`).join('') +
    '<th>XP</th><th>נראתה לאחרונה</th>';
}

function renderStats() {
  const total = allStudents.length;
  const today = new Date().toDateString();
  let activeToday = 0;
  let completedAll = 0;
  let totalXP = 0;

  allStudents.forEach((s) => {
    if (s.last_seen && new Date(s.last_seen).toDateString() === today) activeToday++;
    const pm = progressByStudent[s.id] || {};
    const doneCount = GATING_UNITS.filter((u) => isUnitDone(u.id, pm)).length;
    if (GATING_UNITS.length > 0 && doneCount === GATING_UNITS.length) completedAll++;
    totalXP += computeXP(pm);
  });

  const avgXP = total ? Math.round(totalXP / total) : 0;

  $('stats-grid').innerHTML = [
    ['תלמידות רשומות', total],
    ['פעילות היום', activeToday],
    ['סיימו את הקורס', completedAll],
    ['XP ממוצע', avgXP],
  ].map(([label, num]) => `<div class="stat-tile"><div class="stat-num">${num}</div><div class="stat-label">${label}</div></div>`).join('');
}

function renderTable() {
  const filterClass = $('filter-class').value;
  const filterName = $('filter-name').value.trim().toLowerCase();

  if (allStudents.length === 0) {
    $('loading-msg').style.display = 'none';
    $('no-students').style.display = 'block';
    $('students-table').style.display = 'none';
    return;
  }

  const rows = allStudents.filter((s) => {
    if (filterClass && s.class_name !== filterClass) return false;
    if (filterName && !s.name.toLowerCase().includes(filterName)) return false;
    return true;
  });

  const tbody = $('students-tbody');
  tbody.innerHTML = '';
  const colCount = 6 + CHAPTERS.length;

  rows.forEach((s) => {
    const pm = progressByStudent[s.id] || {};
    const doneCount = GATING_UNITS.filter((u) => isUnitDone(u.id, pm)).length;
    const pct = GATING_UNITS.length ? Math.round((doneCount / GATING_UNITS.length) * 100) : 0;
    const xp = computeXP(pm);

    const chapterDots = CHAPTERS.map((ch) => {
      const status = chapterStatusFor(ch, pm);
      const cls = status === 'completed' ? 'dot-completed' : status === 'current' ? 'dot-current' : 'dot-locked';
      const symbol = status === 'completed' ? '✓' : status === 'current' ? '▶' : '—';
      return `<td style="text-align:center;"><span class="dot ${cls}" title="${escapeHtml(ch.title)}">${symbol}</span></td>`;
    }).join('');

    const lastSeen = s.last_seen
      ? new Date(s.last_seen).toLocaleDateString('he-IL', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
      : '—';

    const tr = document.createElement('tr');
    tr.className = 'student-row';
    tr.innerHTML = `
      <td class="td-name">${escapeHtml(s.name)}</td>
      <td class="td-sub">${escapeHtml(s.school)}</td>
      <td class="td-sub">${escapeHtml(s.class_name)}</td>
      <td>
        <div class="completion-bar-wrap">
          <div class="completion-bar-outer"><div class="completion-bar-inner" style="width:${pct}%"></div></div>
          <div class="completion-bar-label">${doneCount}/${GATING_UNITS.length}</div>
        </div>
      </td>
      ${chapterDots}
      <td>⭐ ${xp}</td>
      <td class="td-sub">${lastSeen}</td>
    `;
    tr.addEventListener('click', () => toggleDetails(s.id));
    tbody.appendChild(tr);

    if (expandedId === s.id) {
      const detailTr = document.createElement('tr');
      detailTr.className = 'detail-row';
      detailTr.innerHTML = `<td colspan="${colCount}"><div class="detail-inner">${buildDetailHTML(s)}</div></td>`;
      tbody.appendChild(detailTr);
    }
  });

  $('loading-msg').style.display = 'none';
  $('no-students').style.display = 'none';
  $('students-table').style.display = 'table';
}

function toggleDetails(studentId) {
  expandedId = expandedId === studentId ? null : studentId;
  renderTable();
}

function buildDetailHTML(student) {
  let html = '';

  const quizzes = quizByStudent[student.id] || {};
  const quizUnitIds = Object.keys(quizzes);
  html += '<div class="detail-section"><div class="detail-section-title">📝 תשובות מבחנים</div>';
  if (quizUnitIds.length === 0) {
    html += '<div class="muted">עדיין לא הגישה שום מבחן.</div>';
  } else {
    quizUnitIds.forEach((unitId) => {
      const answers = quizzes[unitId] || [];
      const correctCount = answers.filter((a) => a.is_correct).length;
      const score = answers.length ? Math.round((correctCount / answers.length) * 100) : 0;
      html += `<div style="margin-bottom:var(--space-3);"><strong>${escapeHtml(unitTitle(unitId))}</strong> — ציון ${score} (${correctCount}/${answers.length})`;
      html += '<table class="answers-table"><thead><tr><th>#</th><th>שאלה</th><th>תשובה</th><th>תוצאה</th></tr></thead><tbody>';
      answers.forEach((a) => {
        html += `<tr class="${a.is_correct ? 'correct-row' : 'wrong-row'}">
          <td>${escapeHtml(a.question_number)}</td>
          <td>${escapeHtml(String(a.question_text || '').slice(0, 90))}</td>
          <td>${escapeHtml(a.answer_given || '—')}</td>
          <td>${a.is_correct ? '✅' : '❌'}</td>
        </tr>`;
      });
      html += '</tbody></table></div>';
    });
  }
  html += '</div>';

  const attempts = exemptionsByStudent[student.id] || [];
  html += '<div class="detail-section"><div class="detail-section-title">🎯 ניסיונות אתגר פטור</div>';
  if (attempts.length === 0) {
    html += '<div class="muted">לא ניסתה אתגר פטור.</div>';
  } else {
    attempts
      .slice()
      .sort((a, b) => new Date(b.attempted_at) - new Date(a.attempted_at))
      .forEach((a) => {
        const chTitle = (findChapter(a.chapter_id) || {}).title || a.chapter_id;
        const when = new Date(a.attempted_at).toLocaleDateString('he-IL', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
        html += `<span class="exemption-chip ${a.passed ? 'passed' : 'failed'}">${a.passed ? '✅' : '❌'} ${escapeHtml(chTitle)} — ${a.score} (${when})</span>`;
      });
  }
  html += '</div>';

  return html;
}

$('login-btn').addEventListener('click', tryLogin);
$('teacher-pass').addEventListener('keydown', (e) => { if (e.key === 'Enter') tryLogin(); });
$('refresh-btn').addEventListener('click', loadData);
$('filter-class').addEventListener('change', renderTable);
$('filter-name').addEventListener('input', renderTable);
