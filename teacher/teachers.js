// ===== רשימת המורות והכיתות שכל אחת רואה =====
//
// הקובץ הזה הוא "שכבת ההרשאות" של לוח המורה. הוא מכוון להיות מוחלף
// בעתיד בהרשמה אמיתית (Supabase Auth) בלי לשכתב את הלוח: כל הסינון
// עובר דרך canSeeStudent() בלבד, ולכן ביום שבו מסד הנתונים עצמו יסנן
// (RLS לפי teacher_id), הפונקציה הזו פשוט תחזיר תמיד true — ושאר
// הקוד לא ישתנה.
//
// ⚠️ מה זה כן ומה זה לא:
// כן — מונע מכל מורה לראות בטעות את הכיתות של האחרות, ונותן לכל אחת
//      מסך נקי עם הכיתות שלה בלבד.
// לא — זו אינה חסימה אבטחתית. הנתונים נשלפים מ-Supabase עם המפתח
//      הציבורי, כך שמי שיודעת לפתוח כלי מפתחים בדפדפן יכולה עדיין
//      להגיע להכול. חסימה אמיתית מחייבת Auth + RLS.
//
// ===== איך מוסיפים מורה =====
// 1. מייצרים hash לסיסמה שלה. בקונסולת הדפדפן (F12 ← Console):
//      await crypto.subtle.digest('SHA-256', new TextEncoder().encode('הסיסמה'))
//        .then(b => [...new Uint8Array(b)].map(x => x.toString(16).padStart(2,'0')).join(''))
// 2. מוסיפים רשומה למערך TEACHERS למטה, עם ה-hash והכיתות שלה.
// 3. מעתיקים את הקובץ הזה לכל הלומדות (תיקיית teacher/ זהה בכולן).
//
// שימו לב: סיסמה ריקה ('') = המורה מושבתת ולא יכולה להיכנס.
// ושתי מורות לא יכולות לחלוק סיסמה — הזיהוי נעשה לפיה.

export const TEACHERS = [
  {
    id: 'enav',
    name: 'ענב',
    passwordHash: '31fc3cb0c9bc23e6630e1b46cbf96e25f9265cb0ec4cc4c267284adbd8f66870',
    // 'all' = רואה את כל התלמידות בכל בתי הספר והכיתות.
    scope: 'all',
  },

  // ===== מקומות שמורות למורות הנוספות =====
  // למלא passwordHash (ראו ההוראות למעלה) ולעדכן שם + כיתות.
  // כל עוד ה-hash ריק, הרשומה מושבתת ולא משפיעה על כלום.
  {
    id: 'teacher-2',
    name: 'מורה 2',
    passwordHash: '',
    scope: { school: 'צביה היברידי', classes: ["י'", "י״א"] },
  },
  {
    id: 'teacher-3',
    name: 'מורה 3',
    passwordHash: '',
    scope: { school: 'צביה היברידי', classes: ["י״ב"] },
  },
  {
    id: 'teacher-4',
    name: 'מורה 4',
    passwordHash: '',
    scope: { classes: [] },
  },
];

// נרמול זהה לזה שב-js/progress.js: התלמידה מקלידה את הכיתה ידנית, ואסור
// שרווח נוסף או אות גדולה יגרמו לה "להיעלם" מהמסך של המורה שלה.
function norm(s) {
  return String(s || '').trim().replace(/\s+/g, ' ').toLowerCase();
}

export async function sha256Hex(text) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

// מזהה מורה לפי ה-hash של הסיסמה שהקלידה. מחזיר null אם אין התאמה.
// רשומות עם passwordHash ריק מדולגות, כדי ששורת תבנית שלא מולאה לא
// תאפשר כניסה עם סיסמה ריקה.
export function findTeacherByHash(hash) {
  return TEACHERS.find((t) => t.passwordHash && t.passwordHash === hash) || null;
}

// ===== נקודת ההחלפה העתידית =====
// כשיהיה Auth אמיתי: מסד הנתונים כבר יחזיר רק את התלמידות של המורה
// המחוברת, ואז הגוף של הפונקציה הזו מתקצר ל-`return true;`.
export function canSeeStudent(teacher, student) {
  if (!teacher) return false;
  if (teacher.scope === 'all') return true;

  const scope = teacher.scope || {};
  if (scope.school && norm(scope.school) !== norm(student.school)) return false;

  const classes = scope.classes || [];
  if (!classes.length) return false;
  return classes.some((c) => norm(c) === norm(student.class_name));
}
