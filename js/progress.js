// ===== ניהול תלמידה, התקדמות ונעילה — מבוסס על content/manifest.js בלבד =====
//
// שכבת אחסון: localStorage הוא תמיד "מטמון מקומי מיידי" — כל קריאה
// (getStudent, canAccessUnit, computeXP וכו') ממשיכה להיות סינכרונית,
// כדי ש-unit-runner.js/quiz-runner.js/roadmap-render.js לא יצטרכו להשתנות
// בכלל. Supabase הוא "מקור אמת חוצה-מכשירים": בכל כניסה (loginStudent)
// שולפים ממנו את הנתונים העדכניים ומעדכנים את המטמון המקומי לפיהם, ובכל
// שינוי (saveProgress/markComplete/saveQuizAnswers/saveExemptionAttempt)
// כותבים קודם למטמון המקומי (מיידי, לא תלוי רשת) ובמקביל שולחים עדכון
// ל-Supabase ברקע ("fire and forget"). אם אין רשת/Supabase לא זמין —
// הכל ממשיך לעבוד מקומית בדיוק כמו קודם, רק בלי הסנכרון בין מכשירים.
//
// חשוב: אין כאן יותר MODULE_CONFIG נפרד. הנעילה וההתקדמות תמיד נגזרות
// מ-content/manifest.js — זה מתקן מבנית את הבאג שבו יחידות "נשכחו" מרשימה
// שנייה שלא עודכנה (מה שקרה באפליקציה הישנה ליחידות המבוא והמבחן הסופי).
//
// מחשבים משותפים (בית ספר): כל התלמידות שמורות באותו localStorage, אבל
// בתוך "תיקיות" נפרדות לפי בית ספר+שם+כיתה. כשמישהי מתחברת בשם שכבר קיים
// על המכשיר הזה, היא חוזרת בדיוק לנקודה שבה עצרה — גם אם מישהי אחרת
// התחברה בינתיים על אותו מחשב. עכשיו, בזכות Supabase, זה גם עובד בין
// מחשבים שונים: ברגע שממלאים את טופס הכניסה, שולפים את הנתונים העדכניים
// ביותר מהשרת (לא רק מהמכשיר הזה).

import { COURSE, COURSE_ID, getFlatUnits, findUnit, findChapter } from '../content/manifest.js';
import { supabaseClient } from './supabase-config.js';

// מפתחות האחסון נגזרים מ-COURSE_ID של הקורס, ולא קבועים בקוד המנוע: אם
// שתי לומדות מתארחות על אותו דומיין (תת-תיקיות של אותו GitHub Pages) הן
// חולקות localStorage אחד, ובלי הפרדה הן היו דורסות זו את הבחירות של זו.
// בשרת (Supabase) הן דווקא כן חולקות את טבלת התלמידות בכוונה — אותה
// תלמידה, אותה שורה, בכל הקורסים.
const KEY_ALL = `${COURSE_ID}_data_v3`;
const KEY_CURRENT = `${COURSE_ID}_current_key_v3`;

// ===== מצב כיתה — תכונה בהצטרפות מרצון, לכל קורס בנפרד =====
// המנוע בנוי ללמידה עצמית בקצב אישי: יחידה נפתחת רק אחרי שקודמתה הושלמה.
// בשיעור פרונטלי הנעילה מפריעה — המורה רוצה לקפוץ ישר ליחידה שהיא מקרינה.
// כניסה לכתובת עם ?class=1 מבטלת את הנעילה במכשיר הזה בלבד; ?class=0 מחזירה.
//
// ⚠️ התכונה **כבויה אלא אם הקורס ביקש אותה במפורש**, עם
// `classMode: true` ב-COURSE שב-content/manifest.js. קורס שלא ביקש —
// ?class=1 לא עושה אצלו כלום, ו-canAccessUnit מתנהגת בדיוק כמו לפני
// שהתכונה נוספה. כך אפשר להוסיף אותה למנוע המשותף בלי לגעת בקורס שבו
// הנעילה ההדרגתית היא עיקר הפדגוגיה.
const CLASS_MODE_ENABLED = COURSE.classMode === true;
const KEY_CLASS_MODE = `${COURSE_ID}_class_mode`;

(function initClassModeFromUrl() {
  if (!CLASS_MODE_ENABLED) return;
  try {
    const param = new URLSearchParams(location.search).get('class');
    if (param === '1') localStorage.setItem(KEY_CLASS_MODE, '1');
    else if (param === '0') localStorage.removeItem(KEY_CLASS_MODE);
  } catch (e) { /* בלי localStorage פשוט אין מצב כיתה — לא שוברים את הדף */ }
})();

export function isClassMode() {
  if (!CLASS_MODE_ENABLED) return false;
  try { return localStorage.getItem(KEY_CLASS_MODE) === '1'; }
  catch (e) { return false; }
}

export const XP_VALUES = { lesson: 10, lab: 10, quiz: 20, reference: 5, exemption: 30 };

// בודקים שהאחסון באמת עובד (לא רק זמין) — גלישה פרטית/הגדרות דפדפן
// מסוימות נותנות ל-localStorage "להצליח" אבל לא לשמור כלום בפועל.
// המסך שמציג את זה (renderLogin) קורא לפונקציה הזו לפני שמישהי מתחילה
// למלא נתונים, כדי שהאזהרה תגיע *לפני* שההתקדמות הולכת לאיבוד, לא אחרי.
export function isStorageAvailable() {
  try {
    const testKey = '__lomda_storage_test__';
    localStorage.setItem(testKey, '1');
    const ok = localStorage.getItem(testKey) === '1';
    localStorage.removeItem(testKey);
    return ok;
  } catch (e) {
    return false;
  }
}

function readJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (e) {
    console.warn('localStorage read failed for', key, e);
    return fallback;
  }
}
function writeJSON(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); }
  catch (e) { console.warn('localStorage write failed for', key, e); }
}

function normPart(s) {
  return String(s || '').trim().replace(/\s+/g, ' ').toLowerCase();
}
function makeStudentKey(school, name, className) {
  return `${normPart(school)}__${normPart(name)}__${normPart(className)}`;
}

function getAllBuckets() {
  return readJSON(KEY_ALL, {});
}
function saveBucket(key, bucket) {
  const all = getAllBuckets();
  all[key] = bucket;
  writeJSON(KEY_ALL, all);
}
function getCurrentKey() {
  return readJSON(KEY_CURRENT, null);
}
function getCurrentBucket() {
  const key = getCurrentKey();
  if (!key) return null;
  const all = getAllBuckets();
  return all[key] || null;
}

// ===== סנכרון עם Supabase — כל הפונקציות כאן "fire and forget": =====
// לא חוסמות את החוויה, לא זורקות שגיאה החוצה, רק רושמות אזהרה בקונסול
// אם נכשלות (בלי רשת, למשל). זה מספיק לשלב הזה — לא בונים כאן מנגנון
// תור-נסיונות-חוזרים מלא; אם עדכון בודד לא הגיע לשרת, הוא פשוט יתעדכן
// בפעם הבאה שהערך הזה נשמר, או בכניסה הבאה מאותו מכשיר (הוא עדיין קיים
// במטמון המקומי).
function fireAndForget(promise) {
  promise.catch((e) => console.warn('סנכרון ל-Supabase נכשל (ממשיכים מקומית):', e));
}

async function throwOnError({ error }) {
  if (error) throw error;
}

async function supabaseUpsertUnitProgress(studentId, unitId, p) {
  await throwOnError(await supabaseClient.from('unit_progress').upsert({
    student_id: studentId,
    unit_id: unitId,
    status: p.status,
    last_slide: typeof p.lastSlide === 'number' ? p.lastSlide : null,
    completed_at: p.completedAt || null,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'student_id,unit_id' }));
}

async function supabaseUpsertQuizAnswers(studentId, unitId, answers) {
  await throwOnError(await supabaseClient.from('quiz_answers').upsert({
    student_id: studentId,
    unit_id: unitId,
    answers,
    submitted_at: new Date().toISOString(),
  }, { onConflict: 'student_id,unit_id' }));
}

async function supabaseInsertExemptionAttempt(studentId, chapterId, score, passed) {
  await throwOnError(await supabaseClient.from('exemption_attempts').insert({
    student_id: studentId,
    chapter_id: chapterId,
    score,
    passed,
    attempted_at: new Date().toISOString(),
  }));
}

// יצירת תלמידה חדשה ב-Supabase. insert רגיל (לא upsert) בכוונה: אם זה
// נכשל בגלל שהתלמידה כבר קיימת בפועל בשרת (מרוץ נדיר בין שני מחשבים),
// לא רוצים "לגנוב" את השורה הקיימת שלה — פשוט מוותרים על הדחיפה הזו,
// והכניסה הבאה שלה תשלוף אותה נכון דרך tryFetchRemoteBundle.
function createRemoteStudent(student) {
  fireAndForget((async () => {
    await throwOnError(await supabaseClient.from('students').insert({
      id: student.id,
      school: student.school,
      name: student.name,
      class_name: student.class_name,
      school_norm: normPart(student.school),
      name_norm: normPart(student.name),
      class_norm: normPart(student.class_name),
      gender: student.gender,
      created_at: student.created_at,
      last_seen: student.last_seen,
    }));
  })());
}

function touchRemoteLastSeen(studentId) {
  fireAndForget((async () => {
    await throwOnError(await supabaseClient.from('students')
      .update({ last_seen: new Date().toISOString() })
      .eq('id', studentId));
  })());
}

// דוחפים בקאלנד לשרת bucket שקיים רק מקומית (למשל נוצר כשהמכשיר היה
// לא מקוון). ניסיון-אחד-כל-שדה, לא מחכה לתוצאה.
function pushLocalBucketToRemote(bucket) {
  createRemoteStudent(bucket.student);
  Object.entries(bucket.progress).forEach(([unitId, p]) => {
    fireAndForget(supabaseUpsertUnitProgress(bucket.student.id, unitId, p));
  });
  Object.entries(bucket.quizAnswers).forEach(([unitId, answers]) => {
    fireAndForget(supabaseUpsertQuizAnswers(bucket.student.id, unitId, answers));
  });
  bucket.exemptionAttempts.forEach((a) => {
    fireAndForget(supabaseInsertExemptionAttempt(bucket.student.id, a.chapterId, a.score, a.passed));
  });
}

// שולפים מ-Supabase bucket מלא (תלמידה + כל ההתקדמות שלה) לפי בית
// ספר+שם+כיתה מנורמלים. מחזירים null אם לא נמצאה, או אם הייתה שגיאת
// רשת/שרת — במקרה הזה ממשיכים בזרימה המקומית הרגילה, לא חוסמים כניסה.
async function tryFetchRemoteBundle(schoolNorm, nameNorm, classNorm) {
  try {
    const { data: studentRow, error: studentErr } = await supabaseClient
      .from('students')
      .select('*')
      .eq('school_norm', schoolNorm)
      .eq('name_norm', nameNorm)
      .eq('class_norm', classNorm)
      .maybeSingle();
    if (studentErr) throw studentErr;
    if (!studentRow) return null;

    const [progressRes, quizRes, attemptsRes] = await Promise.all([
      supabaseClient.from('unit_progress').select('*').eq('student_id', studentRow.id),
      supabaseClient.from('quiz_answers').select('*').eq('student_id', studentRow.id),
      supabaseClient.from('exemption_attempts').select('*').eq('student_id', studentRow.id),
    ]);
    if (progressRes.error) throw progressRes.error;
    if (quizRes.error) throw quizRes.error;
    if (attemptsRes.error) throw attemptsRes.error;

    const progress = {};
    (progressRes.data || []).forEach((r) => {
      progress[r.unit_id] = { status: r.status, lastSlide: r.last_slide, completedAt: r.completed_at };
    });
    const quizAnswers = {};
    (quizRes.data || []).forEach((r) => { quizAnswers[r.unit_id] = r.answers; });
    const exemptionAttempts = (attemptsRes.data || []).map((r) => ({
      chapterId: r.chapter_id, score: r.score, passed: r.passed, attemptedAt: r.attempted_at,
    }));

    const student = {
      id: studentRow.id,
      name: studentRow.name,
      school: studentRow.school,
      class_name: studentRow.class_name,
      gender: studentRow.gender,
      created_at: studentRow.created_at,
      last_seen: studentRow.last_seen,
    };
    return { student, progress, quizAnswers, exemptionAttempts };
  } catch (e) {
    console.warn('לא הצלחנו לטעון נתונים מ-Supabase (ממשיכים עם נתונים מקומיים אם יש):', e);
    return null;
  }
}

// ===== זהות תלמידה =====

export function getStudent() {
  const bucket = getCurrentBucket();
  return bucket ? bucket.student : null;
}

export function logout() {
  writeJSON(KEY_CURRENT, null);
  location.hash = '#login';
  location.reload();
}

export async function loginStudent(name, school, className, gender) {
  const schoolNorm = normPart(school);
  const nameNorm = normPart(name);
  const classNorm = normPart(className);
  const key = makeStudentKey(school, name, className);
  const all = getAllBuckets();
  const localBucket = all[key];

  const remote = await tryFetchRemoteBundle(schoolNorm, nameNorm, classNorm);

  let bucket;
  if (remote) {
    // Supabase הוא מקור האמת חוצה-המכשירים — מעדכנים את המטמון המקומי
    // לפיו, כדי שתלמידה שמתחברת ממחשב אחר תמשיך בדיוק מאיפה שעצרה.
    remote.student.last_seen = new Date().toISOString();
    bucket = remote;
    saveBucket(key, bucket);
    touchRemoteLastSeen(bucket.student.id);
  } else if (localBucket) {
    // קיימת מקומית אבל לא נמצאה בשרת — כנראה נוצרה כשהיה ניתוק, או
    // שהשרת לא זמין כרגע. ממשיכים עם הנתונים המקומיים, ומנסים לדחוף
    // אותם לשרת ברקע כדי שהם יתעדכנו בפעם שכן תהיה רשת.
    localBucket.student.last_seen = new Date().toISOString();
    bucket = localBucket;
    saveBucket(key, bucket);
    pushLocalBucketToRemote(bucket);
  } else {
    const student = {
      id: crypto.randomUUID(),
      name: name.trim(),
      school: school.trim(),
      class_name: className.trim(),
      gender: gender === 'm' ? 'm' : 'f',
      created_at: new Date().toISOString(),
      last_seen: new Date().toISOString(),
    };
    bucket = { student, progress: {}, quizAnswers: {}, exemptionAttempts: [] };
    saveBucket(key, bucket);
    createRemoteStudent(student);
  }

  writeJSON(KEY_CURRENT, key);
  return bucket.student;
}

// ===== התקדמות ליחידה =====

function getAllProgress() {
  const bucket = getCurrentBucket();
  return bucket ? bucket.progress : {};
}

function mutateBucket(mutator) {
  const key = getCurrentKey();
  if (!key) return;
  const all = getAllBuckets();
  const bucket = all[key];
  if (!bucket) return;
  mutator(bucket);
  saveBucket(key, bucket);
}

export function loadProgress(unitId) {
  const all = getAllProgress();
  return all[unitId] || null;
}

function syncUnitProgressToRemote(unitId) {
  const student = getStudent();
  const p = loadProgress(unitId);
  if (student && p) fireAndForget(supabaseUpsertUnitProgress(student.id, unitId, p));
}

export function saveProgress(unitId, slideIndex) {
  mutateBucket((bucket) => {
    const prev = bucket.progress[unitId] || {};
    bucket.progress[unitId] = { ...prev, status: prev.status === 'completed' ? prev.status : 'started', lastSlide: slideIndex };
  });
  syncUnitProgressToRemote(unitId);
}

export function markComplete(unitId, opts = {}) {
  mutateBucket((bucket) => {
    const prev = bucket.progress[unitId] || {};
    bucket.progress[unitId] = { ...prev, status: opts.exempted ? 'exempted' : 'completed', completedAt: new Date().toISOString() };
  });
  syncUnitProgressToRemote(unitId);
}

// ===== נעילה: תמיד נגזרת מ-manifest, לא ממערך נפרד =====

function isUnitDone(unitId, all) {
  const p = all[unitId];
  return !!p && (p.status === 'completed' || p.status === 'exempted');
}

export function canAccessUnit(unitId) {
  if (!getStudent()) return false;
  const unit = findUnit(unitId);
  if (!unit) return false;
  // במצב כיתה הכול פתוח — ההתקדמות עצמה עדיין נשמרת כרגיל.
  if (isClassMode()) return true;

  const chapter = findChapter(unit.chapterId);
  const flat = getFlatUnits();
  const all = getAllProgress();

  // כל הפרקים הקודמים חייבים להיות שלמים — גם לפני אתגר פטור של פרק
  // מאוחר יותר, לא רק לפני השיעורים שלו. אחרת אפשר "לדלג" ישר לאתגר
  // פטור של פרק 4 בלי לגעת בפרקים 1-3 בכלל — לא הגיוני, כי אתגר פטור
  // מניח שכבר שולטים בחומר הקודם. הפרקים עצמם נשארים ברצף, גם אם פרק
  // בודד מסומן "unordered" מבפנים.
  for (const u of flat) {
    if (u.chapterNumber >= chapter.number) break;
    if (u.type === 'exemption' || u.type === 'bonus') continue;
    if (!isUnitDone(u.id, all)) return false;
  }

  // בתוך הפרק עצמו, אתגר הפטור תמיד פתוח — הוא בדיוק החלופה לעבור על
  // השיעורים אחד-אחד, לא משהו שדורש להשלים אותם קודם.
  if (unit.type === 'exemption') return true;

  if (chapter.unordered) {
    // פרק "לא-מסודר": כל השיעורים/מעבדות/בונוסים בפרק פתוחים יחד ברגע
    // שהגענו לפרק — הסדר ביניהם לא משמעותי. סיכום/מבחן דורשים שכל
    // השיעורים/מעבדות (לא כולל בונוס) בפרק יושלמו קודם.
    if (unit.type === 'lesson' || unit.type === 'lab' || unit.type === 'bonus') return true;
    const required = chapter.units.filter(u => u.type === 'lesson' || u.type === 'lab');
    return required.every(u => isUnitDone(u.id, all));
  }

  // פרק רגיל (מסודר): רצף מלא בתוך הפרק, כמו קודם.
  const idxInChapter = chapter.units.findIndex(u => u.id === unitId);
  for (let i = 0; i < idxInChapter; i++) {
    const u = chapter.units[i];
    if (u.type === 'exemption' || u.type === 'bonus') continue;
    if (!isUnitDone(u.id, all)) return false;
  }
  return true;
}

export function unitStatus(unitId) {
  const p = loadProgress(unitId);
  if (p && (p.status === 'completed' || p.status === 'exempted')) return p.status;
  if (!canAccessUnit(unitId)) return 'locked';
  if (p && p.status === 'started') return 'current';
  return 'not-started';
}

export function chapterStatus(chapterId) {
  const ch = findChapter(chapterId);
  if (!ch) return 'locked';
  const gating = ch.units.filter(u => u.type !== 'exemption' && u.type !== 'bonus');
  // פרק שכולו בונוס (אין בו אף יחידת חובה): על מערך ריק, every() מחזיר
  // true — ולכן הפרק נצבע "הושלם" עוד לפני שהתלמידה נגעה בו. במקרה כזה
  // גוזרים את הסטטוס מהיחידות שכן יש בפרק (הבונוסים עצמם).
  const relevant = gating.length ? gating : ch.units.filter(u => u.type !== 'exemption');
  if (!relevant.length) return 'locked';
  const statuses = relevant.map(u => unitStatus(u.id));
  if (statuses.every(s => s === 'completed' || s === 'exempted')) return 'completed';
  if (statuses.some(s => s !== 'locked')) return 'current';
  return 'locked';
}

// ===== מבחנים =====

export function saveQuizAnswers(unitId, answersArray) {
  mutateBucket((bucket) => { bucket.quizAnswers[unitId] = answersArray; });
  const student = getStudent();
  if (student) fireAndForget(supabaseUpsertQuizAnswers(student.id, unitId, answersArray));
}

// ===== אתגר פטור =====

export function saveExemptionAttempt(chapterId, score, passed) {
  mutateBucket((bucket) => {
    bucket.exemptionAttempts.push({ chapterId, score, passed, attemptedAt: new Date().toISOString() });
  });
  const student = getStudent();
  if (student) fireAndForget(supabaseInsertExemptionAttempt(student.id, chapterId, score, passed));

  if (passed) {
    const ch = findChapter(chapterId);
    if (ch) {
      ch.units.forEach(u => {
        if (u.type !== 'exemption') markComplete(u.id, { exempted: true });
      });
    }
  }
}

// ===== משחקיות: XP ותגים — תמיד מחושבים מהנתונים, לא נשמרים כמונה נפרד =====

export function computeXP() {
  const all = getAllProgress();
  const flat = getFlatUnits();
  let xp = 0;
  flat.forEach(u => {
    const p = all[u.id];
    if (p && (p.status === 'completed' || p.status === 'exempted')) {
      xp += XP_VALUES[u.type] || 10;
    }
  });
  return xp;
}

export function overallCompletion() {
  // בונוס לא נספר במונה הכולל — כדי שהמספר ישקף את מה שבאמת נדרש להשלמת החלק.
  const flat = getFlatUnits().filter(u => u.type !== 'exemption' && u.type !== 'bonus');
  const all = getAllProgress();
  const done = flat.filter(u => {
    const p = all[u.id];
    return p && (p.status === 'completed' || p.status === 'exempted');
  }).length;
  return { done, total: flat.length };
}
