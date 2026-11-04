// ===== מקור האמת היחיד למבנה הקורס =====
// כל פרק ויחידה מוגדרים כאן פעם אחת. גם מפת המסלול וגם לוגיקת הנעילה
// קוראות מהרשימה הזאת בלבד. להוספת יחידה: אובייקט חדש ל-units + קובץ
// תוכן תחת content/chX/. אין צורך לגעת בשום קובץ אחר.

// ⚠️ מזהה הקורס. ממנו נגזרים מפתחות ה-localStorage של התלמידות
// ('cs1_data_v3' ו-'cs1_current_key_v3'). שינוי הערך כאן
// אחרי שתלמידות כבר נכנסו = התקדמות שנראית להן כאילו נמחקה.
export const COURSE_ID = 'cs1';

export const COURSE = {
  title: 'סוגי גרפים',
  icon: '📊',
  welcome: {
    f: 'ברוכה הבאה לסוגי גרפים! 📊',
    m: 'ברוך הבא לסוגי גרפים! 📊',
  },
  finaleText: 'סיימת את כל יחידות הלומדה 📊',
  teacherTitle: '📊 לוח מורה — סוגי גרפים',

  // מצב כיתה לשיעור פרונטלי (?class=1 פותח את כל היחידות במכשיר המורה).
  // כבוי כברירת מחדל. להפעלה — להוריד את ההערה מהשורה הבאה:
  // classMode: true,
};

export const CHAPTERS = [
  {
    id: 'cs1-ch1',
    number: 1,
    title: 'קוראים גרפים',
    icon: '📈',
    colorVar: 'chapter-1',
    // unordered: true,   ← אם כל היחידות בפרק פתוחות במקביל
    units: [
      { id: 'cs1-ch1-u1', title: 'גרף עמודות', type: 'lesson', icon: '📊', estMinutes: 8, modulePath: 'ch1/ch1-u1-bars.js' },
      { id: 'cs1-ch1-u2', title: 'גרף עוגה', type: 'lesson', icon: '🥧', estMinutes: 6, modulePath: 'ch1/ch1-u2-pie.js' },
      { id: 'cs1-ch1-u3', title: 'גרף קו', type: 'lesson', icon: '📈', estMinutes: 7, modulePath: 'ch1/ch1-u3-line.js' },
      { id: 'cs1-ch1-u4', title: 'גרף שמטעה את העין', type: 'lesson', icon: '🕵️', estMinutes: 8, modulePath: 'ch1/ch1-u4-misleading.js' },
    ],
  },
  {
    id: 'cs1-ch2',
    number: 2,
    title: 'איזה גרף מתאים?',
    icon: '🧭',
    colorVar: 'chapter-2',
    units: [
      { id: 'cs1-ch2-u1', title: 'עמודות, עוגה או קו?', type: 'lesson', icon: '🧭', estMinutes: 8, modulePath: 'ch2/ch2-u1-which-chart.js' },
      { id: 'cs1-ch2-final', title: 'מבחן מסכם: סוגי גרפים', type: 'quiz', icon: '🏁', estMinutes: 12, modulePath: 'ch2/ch2-final.js' },
    ],
  },
];

// ===== עזרי מניפסט =====
// לוגיקה גנרית שלא תלויה בקורס. המנוע מייבא את הפונקציות האלה מהמניפסט,
// ולכן הן חייבות להיות מיוצאות מכאן בכל לומדה. new-course.mjs מוסיף אותן
// אוטומטית — אין צורך לכתוב או לערוך אותן ביד.

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
