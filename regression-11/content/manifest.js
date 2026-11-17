// ===== מקור האמת היחיד למבנה הקורס =====
// כל פרק ויחידה מוגדרים כאן פעם אחת. גם מפת המסלול וגם לוגיקת הנעילה
// קוראות מהרשימה הזאת בלבד. להוספת יחידה: אובייקט חדש ל-units + קובץ
// תוכן תחת content/chX/. אין צורך לגעת בשום קובץ אחר.

// ⚠️ מזהה הקורס. ממנו נגזרים מפתחות ה-localStorage של התלמידות
// ('cs3_data_v3' ו-'cs3_current_key_v3'). שינוי הערך כאן
// אחרי שתלמידות כבר נכנסו = התקדמות שנראית להן כאילו נמחקה.
export const COURSE_ID = 'cs3';

export const COURSE = {
  title: 'רגרסיה לינארית',
  icon: '📈',
  welcome: {
    f: 'ברוכה הבאה ללומדת הרגרסיה הלינארית! 📈', // המקור: "לומדת רגרסיה לינארית" (ארטיפקט של כרמל). תוכן התלמידים בלשון רבים, לבקשתה.
    m: 'ברוך הבא ללומדת הרגרסיה הלינארית! 📈',
    p: 'ברוכים הבאים ללומדת הרגרסיה הלינארית! 📈',
  },
  // לשון הכפתורים והמסכים: רבים, כמו התוכן (בקשת כרמל). בלי הדגל: נקבה/זכר לפי הבחירה.
  voice: 'plural',
  finaleText: 'כל יחידות הלומדה הושלמו 📈',
  teacherTitle: '📈 לוח מורה — רגרסיה לינארית',

  // מצב כיתה לשיעור פרונטלי (?class=1 פותח את כל היחידות במכשיר המורה).
  // כבוי כברירת מחדל. להפעלה — להוריד את ההערה מהשורה הבאה:
  // classMode: true,
};

export const CHAPTERS = [
  {
    id: 'cs3-ch1',
    number: 1,
    title: 'הקו של הנקודות',
    icon: '📈',
    colorVar: 'chapter-1',
    // unordered: true,   ← אם כל היחידות בפרק פתוחות במקביל
    units: [
      { id: 'cs3-ch1-u1', title: 'מה זה רגרסיה לינארית?', type: 'lesson', icon: '📈', estMinutes: 8, modulePath: 'ch1/ch1-u1-intro.js' },
      { id: 'cs3-ch1-u2', title: 'שיפוע וחותך', type: 'lesson', icon: '📐', estMinutes: 8, modulePath: 'ch1/ch1-u2-slope.js' },
      { id: 'cs3-ch1-u3', title: 'חוזים עם הקו', type: 'lab', icon: '🔮', estMinutes: 7, modulePath: 'ch1/ch1-u3-predict.js' },
    ],
  },
  {
    id: 'cs3-ch2',
    number: 2,
    title: 'באקסל ובחיים',
    icon: '🧮',
    colorVar: 'chapter-2',
    units: [
      { id: 'cs3-ch2-u1', title: 'SLOPE, INTERCEPT ו-FORECAST', type: 'lesson', icon: '🧮', estMinutes: 8, modulePath: 'ch2/ch2-u1-excel.js' },
      { id: 'cs3-ch2-u2', title: 'מתי מתאים ומתי לא', type: 'lesson', icon: '⚖️', estMinutes: 9, modulePath: 'ch2/ch2-u2-when.js' },
      { id: 'cs3-ch2-final', title: 'מבחן מסכם: רגרסיה לינארית', type: 'quiz', icon: '🏁', estMinutes: 12, modulePath: 'ch2/ch2-final.js' },
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
