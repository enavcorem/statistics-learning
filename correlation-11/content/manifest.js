// ===== מקור האמת היחיד למבנה הקורס =====
// כל פרק ויחידה מוגדרים כאן פעם אחת. גם מפת המסלול וגם לוגיקת הנעילה
// קוראות מהרשימה הזאת בלבד. להוספת יחידה: אובייקט חדש ל-units + קובץ
// תוכן תחת content/chX/. אין צורך לגעת בשום קובץ אחר.

// ⚠️ מזהה הקורס. ממנו נגזרים מפתחות ה-localStorage של התלמידות
// ('cs4_data_v3' ו-'cs4_current_key_v3'). שינוי הערך כאן
// אחרי שתלמידות כבר נכנסו = התקדמות שנראית להן כאילו נמחקה.
export const COURSE_ID = 'cs4';

export const COURSE = {
  title: 'מתאמים',
  icon: '🔗',
  welcome: {
    f: 'ברוכה הבאה ללומדת המתאמים! 🔗', // כיתה י"א, אחרי לומדת הרגרסיה (cs3). תוכן בלשון רבים, לבקשת כרמל.
    m: 'ברוך הבא ללומדת המתאמים! 🔗',
    p: 'ברוכים הבאים ללומדת המתאמים! 🔗',
  },
  finaleText: 'כל יחידות הלומדה הושלמו 🔗',
  teacherTitle: '🔗 לוח מורה — מתאמים',
  voice: 'plural',

  // מצב כיתה לשיעור פרונטלי (?class=1 פותח את כל היחידות במכשיר המורה).
  // כבוי כברירת מחדל. להפעלה — להוריד את ההערה מהשורה הבאה:
  // classMode: true,
};

export const CHAPTERS = [
  {
    id: 'cs4-ch1',
    number: 1,
    title: 'מה זה מתאם?',
    icon: '🔗',
    colorVar: 'chapter-1',
    units: [
      { id: 'cs4-ch1-u1', title: 'מהו מתאם?', type: 'lesson', icon: '🔗', estMinutes: 7, modulePath: 'ch1/ch1-u1-intro.js' },
      { id: 'cs4-ch1-u2', title: 'סוגי מתאמים', type: 'lesson', icon: '🧭', estMinutes: 8, modulePath: 'ch1/ch1-u2-types.js' },
      { id: 'cs4-ch1-u3', title: 'נחשו את המתאם', type: 'lab', icon: '🎯', estMinutes: 6, modulePath: 'ch1/ch1-u3-guess.js' },
    ],
  },
  {
    id: 'cs4-ch2',
    number: 2,
    title: 'מתאם פירסון',
    icon: '📐',
    colorVar: 'chapter-2',
    units: [
      { id: 'cs4-ch2-u1', title: 'מקדם המתאם r', type: 'lesson', icon: '📏', estMinutes: 8, modulePath: 'ch2/ch2-u1-r.js' },
      { id: 'cs4-ch2-u2', title: 'חישוב r צעד אחר צעד', type: 'lesson', icon: '✏️', estMinutes: 9, modulePath: 'ch2/ch2-u2-formula.js' },
      { id: 'cs4-ch2-u3', title: 'מתאם באקסל', type: 'lesson', icon: '🧮', estMinutes: 8, modulePath: 'ch2/ch2-u3-excel.js' },
      { id: 'cs4-ch2-u4', title: 'דוגמאות ומוקשים', type: 'lesson', icon: '⚠️', estMinutes: 9, modulePath: 'ch2/ch2-u4-traps.js' },
      { id: 'cs4-ch2-final', title: 'מבחן מסכם: מתאמים', type: 'quiz', icon: '🏁', estMinutes: 12, modulePath: 'ch2/ch2-final.js' },
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
