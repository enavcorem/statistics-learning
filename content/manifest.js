// ===== מקור האמת היחיד למבנה הקורס =====
// כל פרק ויחידה מוגדרים כאן פעם אחת. גם מפת המסלול (roadmap-render.js) וגם
// לוגיקת הנעילה/התקדמות (progress.js) קוראות מהרשימה הזאת בלבד — אין יותר
// "רשימה שנייה" נפרדת שיכולה להשתכח לעדכן (זה מה שגרם לבאג שהחביא את
// יחידות המבוא והמבחן הסופי באפליקציה הישנה).
//
// כדי להוסיף יחידה חדשה: הוסיפי אובייקט לרשימת ה-units של הפרק המתאים,
// וכתבי את קובץ התוכן שלה תחת content/chX/. זהו — אין צורך לגעת בשום
// קובץ אחר (לא ב-CSS, לא במנוע, לא בניתוב).
//
// modulePath: נתיב לקובץ התוכן תחת content/, או null אם היחידה עוד
// לא נכתבה (תוצג כ"בקרוב" במסלול).
// type: 'lesson' | 'lab' | 'quiz' | 'exemption' | 'reference'

// מזהה הקורס. ממנו נגזרים מפתחות ה-localStorage ב-js/progress.js, כדי
// ששתי לומדות שמתארחות על אותו דומיין לא ידרסו זו את ההתקדמות של זו.
//
// ⚠️ חייב להישאר 'stat' בדיוק. המפתחות שנבנים ממנו הם 'stat_data_v3'
// ו-'stat_current_key_v3' — בדיוק אלה שבהם כבר שמורה ההתקדמות אצל כל
// תלמידה שנכנסה עד היום. שינוי הערך כאן ייראה לתלמידות כאילו כל
// ההתקדמות שלהן נמחקה.
export const COURSE_ID = 'stat';

// הטקסטים שמזהים את הקורס בממשק. הם יושבים כאן ולא במנוע, כי js/ ו-css/
// זהים בין כל הלומדות וניתנים להחלפה מלאה בשדרוג.
export const COURSE = {
  title: 'לומדת הסטטיסטיקה',
  icon: '📊',
  welcome: {
    f: 'ברוכה הבאה ללומדת הסטטיסטיקה! 📊',
    m: 'ברוך הבא ללומדת הסטטיסטיקה! 📊',
  },
  finaleText: 'סיימת בהצלחה את כל יחידות הלומדה בסטטיסטיקה 📊',
  teacherTitle: '📊 לוח מורה — לומדת הסטטיסטיקה',

  // ⚠️ אין כאן classMode — וזה בכוונה.
  // המנוע תומך ב"מצב כיתה" (?class=1 פותח את כל היחידות במכשיר אחד,
  // לשיעור פרונטלי), אבל התכונה כבויה אלא אם הקורס מבקש אותה במפורש.
  // בלומדה הזו הנעילה ההדרגתית היא עיקר הפדגוגיה — מתקדמים לפי קצב,
  // חלק מהפרקים בסדר חופשי (unordered) וחלק לא — ולכן אין שום דרך
  // לעקוף אותה, בדיוק כמו קודם. ?class=1 כאן לא עושה כלום.
};

export const CHAPTERS = [
  {
    id: 'ch1',
    number: 1,
    title: 'מבוא לסטטיסטיקה',
    icon: '🔍',
    colorVar: 'chapter-1',
    units: [
      { id: 'ch1-exemption', title: 'אתגר פטור: מבוא לסטטיסטיקה', type: 'exemption', icon: '🎯', estMinutes: 8, modulePath: 'ch1/ch1-exemption.js' },
      { id: 'ch1-u1', title: 'אוכלוסייה ומדגם', type: 'lesson', icon: '🌍', estMinutes: 6, modulePath: 'ch1/ch1-u1-population-sample.js' },
      { id: 'ch1-u2', title: 'תצפית, משתנה וקבוע', type: 'lesson', icon: '📋', estMinutes: 6, modulePath: 'ch1/ch1-u2-observation-variable.js' },
      { id: 'ch1-u3', title: 'משתנה איכותי', type: 'lesson', icon: '🏷️', estMinutes: 7, modulePath: 'ch1/ch1-u3-qualitative.js' },
      { id: 'ch1-u4', title: 'משתנה כמותי', type: 'lesson', icon: '🔢', estMinutes: 6, modulePath: 'ch1/ch1-u4-quantitative.js' },
      { id: 'ch1-u5', title: 'סולמות מדידה', type: 'bonus', icon: '📏', estMinutes: 4, modulePath: 'ch1/ch1-u5-measurement-scales.js' },
      { id: 'ch1-quiz', title: 'מבחן מסכם: מבוא לסטטיסטיקה', type: 'quiz', icon: '📝', estMinutes: 15, modulePath: 'ch1/ch1-quiz.js' },
    ],
  },
  {
    id: 'ch2',
    number: 2,
    title: 'טבלאות שכיחות',
    icon: '📊',
    colorVar: 'chapter-2',
    units: [
      { id: 'ch2-exemption', title: 'אתגר פטור: טבלאות שכיחות', type: 'exemption', icon: '🎯', estMinutes: 8, modulePath: 'ch2/ch2-exemption.js' },
      { id: 'ch2-u1', title: 'שכיחות ושכיחות יחסית', type: 'lesson', icon: '🔢', estMinutes: 5, modulePath: 'ch2/ch2-u1-frequency.js' },
      { id: 'ch2-u2', title: 'שכיחות מצטברת ("כדור שלג")', type: 'lesson', icon: '⛄', estMinutes: 5, modulePath: 'ch2/ch2-u2-cumulative.js' },
      { id: 'ch2-u3', title: 'מטבלה לגרף עמודות', type: 'lesson', icon: '📶', estMinutes: 7, modulePath: 'ch2/ch2-u3-bar-chart.js' },
      { id: 'ch2-summary', title: 'עצירת סיכום: טבלאות שכיחות', type: 'reference', icon: '🧾', estMinutes: 3, modulePath: 'ch2/ch2-summary.js' },
      { id: 'ch2-quiz', title: 'מבחן פרק: טבלאות שכיחות', type: 'quiz', icon: '📝', estMinutes: 12, modulePath: 'ch2/ch2-quiz.js' },
    ],
  },
  {
    id: 'ch3',
    number: 3,
    title: 'מדדי מרכז',
    icon: '⚖️',
    colorVar: 'chapter-3',
    // ממוצע/חציון/שכיח (וגם המוקש) הם היבטים מקבילים של "מרכז", לא שרשרת
    // תלות — לכן כל השיעורים בפרק פתוחים יחד; רק המבחן דורש שכולם יושלמו.
    unordered: true,
    units: [
      { id: 'ch3-exemption', title: 'אתגר פטור: מדדי מרכז', type: 'exemption', icon: '🎯', estMinutes: 8, modulePath: 'ch3/ch3-exemption.js' },
      { id: 'ch3-u1', title: 'הממוצע', type: 'lesson', icon: '🎯', estMinutes: 6, modulePath: 'ch3/ch3-u1-mean.js' },
      { id: 'ch3-u2', title: 'החציון', type: 'lesson', icon: '🛡️', estMinutes: 4, modulePath: 'ch3/ch3-u2-median.js' },
      { id: 'ch3-u3', title: 'השכיח', type: 'lesson', icon: '🌟', estMinutes: 7, modulePath: 'ch3/ch3-u3-mode.js' },
      { id: 'ch3-u4', title: 'מוקש: AVERAGE מול תא ריק ואפס', type: 'lesson', icon: '⚠️', estMinutes: 5, modulePath: 'ch3/ch3-u4-average-blank-vs-zero.js' },
      { id: 'ch3-summary', title: 'עצירת סיכום: מדדי מרכז', type: 'reference', icon: '🧾', estMinutes: 3, modulePath: 'ch3/ch3-summary.js' },
      { id: 'ch3-quiz', title: 'מבחן פרק: מדדי מרכז', type: 'quiz', icon: '📝', estMinutes: 12, modulePath: 'ch3/ch3-quiz.js' },
    ],
  },
  {
    id: 'ch4',
    number: 4,
    title: 'מדדי פיזור',
    icon: '🌊',
    colorVar: 'chapter-4',
    units: [
      { id: 'ch4-exemption', title: 'אתגר פטור: מדדי פיזור', type: 'exemption', icon: '🎯', estMinutes: 8, modulePath: 'ch4/ch4-exemption.js' },
      { id: 'ch4-u1', title: 'טווח', type: 'lesson', icon: '📏', estMinutes: 5, modulePath: 'ch4/ch4-u1-range.js' },
      { id: 'ch4-u2', title: 'סטיית תקן ושונות', type: 'lesson', icon: '📐', estMinutes: 7, modulePath: 'ch4/ch4-u2-stdev.js' },
      { id: 'ch4-u3', title: 'רבעונים ו-IQR', type: 'lesson', icon: '🍰', estMinutes: 6, modulePath: 'ch4/ch4-u3-quartiles.js' },
      { id: 'ch4-summary', title: 'עצירת השוואה: מרכז מול פיזור', type: 'reference', icon: '🧾', estMinutes: 4, modulePath: 'ch4/ch4-summary.js' },
      { id: 'ch4-quiz', title: 'מבחן פרק: מדדי פיזור', type: 'quiz', icon: '📝', estMinutes: 12, modulePath: 'ch4/ch4-quiz.js' },
    ],
  },
  {
    // פרק חדש: ההיסטוגרמה חזרה לכאן מפרק 2 (שם הפכה אותו לכבד מדי כפרק
    // ראשון), וקיבלה מטרה אמיתית — אחרי שכבר יודעים לחשב מרכז ופיזור
    // (פרקים 3-4), עכשיו לומדים "לראות" אותם בגרף בלי לחשב. ה-id 'ch8'
    // (לא 'ch5') בכוונה — 'ch5' שמור לתוכן העתידי-המתקדם תחת content/ch5/,
    // לא קשור לפרק הזה בכלל.
    id: 'ch8',
    number: 5,
    title: 'ייצוג גרפי',
    icon: '📈',
    colorVar: 'chapter-5',
    units: [
      { id: 'ch8-exemption', title: 'אתגר פטור: ייצוג גרפי', type: 'exemption', icon: '🎯', estMinutes: 8, modulePath: 'ch8/ch8-exemption.js' },
      { id: 'ch8-u1', title: 'מטבלה מקובצת להיסטוגרמה', type: 'lesson', icon: '📊', estMinutes: 6, modulePath: 'ch8/ch8-u1-histogram.js' },
      { id: 'ch8-u2', title: 'הסקת מרכז ופיזור מגרף', type: 'lesson', icon: '👀', estMinutes: 8, modulePath: 'ch8/ch8-u2-reading-center-spread.js' },
      { id: 'ch8-quiz', title: 'מבחן פרק: ייצוג גרפי', type: 'quiz', icon: '📝', estMinutes: 12, modulePath: 'ch8/ch8-quiz.js' },
    ],
  },
  {
    // שימו לב: ה-id נשאר 'ch6' וה-colorVar נשאר 'chapter-6' (רק מזהים
    // פנימיים, לא מוצגים למשתמשת) — הפרק הזה עבר להיות שישי, אחרי פרק
    // הייצוג הגרפי, כי המעבדה נועדה כהפנמה של המושגים ונעזרת עכשיו
    // בהמחשה הגרפית שכבר נלמדה (ראו ch6-u1).
    id: 'ch6',
    number: 6,
    title: 'מעבדת חקר: שינויים בנתונים',
    icon: '🧪',
    colorVar: 'chapter-6',
    units: [
      { id: 'ch6-exemption', title: 'אתגר פטור: מעבדת חקר', type: 'exemption', icon: '🎯', estMinutes: 8, modulePath: 'ch6/ch6-exemption.js' },
      { id: 'ch6-u1', title: 'הוספה והכפלה בקבוע', type: 'lab', icon: '➕', estMinutes: 7, modulePath: 'ch6/ch6-u1-constant-transform.js' },
      { id: 'ch6-u2', title: 'הוספה/הורדה של תצפית', type: 'lab', icon: '🔁', estMinutes: 7, modulePath: 'ch6/ch6-u2-add-remove-fix.js' },
      { id: 'ch6-u3', title: 'ממוצע משוקלל וסכום הסטיות', type: 'lab', icon: '⚖️', estMinutes: 7, modulePath: 'ch6/ch6-u3-weighted-average.js' },
      { id: 'ch6-quiz', title: 'מבחן פרק: מעבדת חקר', type: 'quiz', icon: '📝', estMinutes: 12, modulePath: 'ch6/ch6-quiz.js' },
    ],
  },
  {
    id: 'ch7',
    number: 7,
    title: 'מבחן מסכם לחלק א׳',
    icon: '🏁',
    colorVar: 'chapter-7',
    units: [
      { id: 'ch7-final', title: 'מבחן מסכם כולל', type: 'quiz', icon: '🏆', estMinutes: 25, modulePath: 'ch7/ch7-final.js', isGrandFinale: true },
    ],
  },
  // תוכן שהיה כאן בעבר ("ch5" — היסטוגרמה + זיהוי צורת התפלגות + תרשים
  // קופסה) שמור בתיקיית content/ch5/ בלי להיות מקושר לאף פרק פעיל —
  // ההיסטוגרמה עצמה חזרה לשימוש כ-ch8 (למעלה), וזיהוי צורת התפלגות +
  // תרשים קופסה נשארים מוכנים ושלמים לפרק עתידי בסטטיסטיקה מתקדמת (יחד
  // עם מתאם/רגרסיה/פירסון). בעתיד: הרחבה תתווסף כאן כפרקים נוספים
  // (ch9...) או כרשימת פרקים נפרדת (content/part-b/) — ההחלטה טרם
  // התקבלה; שתי הצורות אפשריות בלי לשנות את המנוע.
];

export function getFlatUnits() {
  const flat = [];
  CHAPTERS.forEach(ch => {
    ch.units.forEach(u => {
      flat.push({ ...u, chapterId: ch.id, chapterNumber: ch.number, chapterTitle: ch.title, colorVar: ch.colorVar });
    });
  });
  return flat;
}

export function findUnit(unitId) {
  return getFlatUnits().find(u => u.id === unitId) || null;
}

export function findChapter(chapterId) {
  return CHAPTERS.find(ch => ch.id === chapterId) || null;
}

// היחידה שבאה מיד אחרי unitId ברצף הכולל (לא לפי שם, לפי הסדר במניפסט) —
// null אם זו היחידה האחרונה בקורס (המבחן המסכם).
export function getNextUnit(unitId) {
  const flat = getFlatUnits();
  const idx = flat.findIndex(u => u.id === unitId);
  if (idx === -1 || idx === flat.length - 1) return null;
  return flat[idx + 1];
}

// הפרק שבא מיד אחרי chapterId — null אם זה הפרק האחרון.
export function getNextChapter(chapterId) {
  const idx = CHAPTERS.findIndex(ch => ch.id === chapterId);
  if (idx === -1 || idx === CHAPTERS.length - 1) return null;
  return CHAPTERS[idx + 1];
}
