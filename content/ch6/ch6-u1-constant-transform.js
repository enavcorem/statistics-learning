// פרק 6, ביס 1: מעבדת חקר — הוספה והכפלה בקבוע. מבוסס על שינוי בנתונים.html
// המקורי (ניסויים 1-2). הכלל הזה (הוספת/הכפלת קבוע) נלמד רק כאן במלואו —
// לא חוזר בניסוח שונה בשום מקום אחר באפליקציה.
//
// גרפי "לפני/אחרי" בסוף כל ניסוי בכוונה: בפרק הקודם (ייצוג גרפי) התלמידה
// כבר ראתה חזותית ש"הזזה" משנה מיקום בלי לשנות פיזור, ו"מתיחה" משנה גם
// פיזור — כאן זה חוזר כאישור מספרי למה שכבר ראתה בעיניים, לא כלל חדש.

// maxOverride משותף לכל זוג "לפני/אחרי" — כדי שהשינוי האמיתי (הזזה קטנה
// מול מתיחה דרמטית) יראה נכון, ולא יתנרמל לגובה מלא בכל גרף בנפרד.
const BEFORE_ADD = { type: 'chart-bar', color: '6', maxOverride: 95, data: [{ label: '70', value: 70 }, { label: '80', value: 80 }, { label: '90', value: 90 }] };
const AFTER_ADD = { type: 'chart-bar', color: '6', maxOverride: 95, data: [{ label: '75', value: 75 }, { label: '85', value: 85 }, { label: '95', value: 95 }] };
const BEFORE_MUL = { type: 'chart-bar', color: '6', maxOverride: 60, data: [{ label: '2', value: 2 }, { label: '4', value: 4 }, { label: '6', value: 6 }] };
const AFTER_MUL = { type: 'chart-bar', color: '6', maxOverride: 60, data: [{ label: '20', value: 20 }, { label: '40', value: 40 }, { label: '60', value: 60 }] };

export default {
  title: 'הוספה והכפלה בקבוע',
  slides: [
    {
      blocks: [
        { type: 'text', html: '<h1>מעבדת החקר: שינויים במדדים 🔬</h1><p>מה קורה לממוצע, לחציון ולמדדי הפיזור כשמשנים את <em>כל</em> הנתונים באותה צורה? זו שאלת "יישום" קלאסית בבגרות — לא צריך לחשב מחדש הכל, רק להבין את הכלל.</p><h2>ניסוי 1: הבונוס (הוספת קבוע)</h2>' },
        { type: 'example', icon: '🎁', title: 'התרחיש', body: 'המורה נתנה 5 נקודות בונוס לכל התלמידות.' },
        { type: 'text', html: '<p class="ltr" style="text-align:center;font-size:1.2rem;font-weight:bold;">לפני: 70, 80, 90 (ממוצע 80) ⬇ אחרי: 75, 85, 95</p>' },
      ],
      question: {
        type: 'mc',
        prompt: 'מה קרה לממוצע החדש?',
        options: [
          { text: 'עלה ב-5', correct: true },
          { text: 'נשאר ללא שינוי', correct: false, hint: 'כל הציונים עלו — הממוצע לא יכול להישאר אותו דבר.' },
        ],
      },
    },
    {
      blocks: [{ type: 'text', html: '<p>נמשיך עם אותו ניסוי:</p>' }],
      question: {
        type: 'mc',
        prompt: 'מה קרה לחציון (האמצעי)?',
        options: [
          { text: 'נשאר 80', correct: false, hint: 'האמצעי היה 80, עכשיו הוא 85 — הוא השתנה!' },
          { text: 'עלה ב-5', correct: true },
        ],
      },
    },
    {
      blocks: [{ type: 'text', html: '<p>ועכשיו השאלה המעניינת באמת:</p>' }],
      question: {
        type: 'mc',
        prompt: 'מה קרה למדדי הפיזור (טווח, סטיית תקן ושונות)?',
        options: [
          { text: 'לא השתנו כלל', correct: true },
          { text: 'גדלו ב-5', correct: false, hint: 'המרחק בין 75 ל-95 הוא עדיין 20, בדיוק כמו קודם (בין 70 ל-90).' },
        ],
      },
    },
    {
      blocks: [
        { type: 'concept', icon: '📝', title: 'מסקנה — הוספת קבוע', html: '<strong>מרכז (ממוצע, חציון):</strong> גדלים ב-5.<br><strong>פיזור (טווח, סטיית תקן, שונות):</strong> לא משתנים! כל הכיתה "זזה" יחד — הגרף זז, אבל לא נמתח.' },
        { type: 'text', html: '<p class="muted" style="text-align:center;">לפני ← אחרי (אותו סרגל, כדי שההזזה תיראה):</p>' },
        BEFORE_ADD,
        AFTER_ADD,
        { type: 'text', html: '<h2>ניסוי 2: ההכפלה (פי 10)</h2>' },
        { type: 'example', icon: '✖️', title: 'התרחיש', body: 'נתונים: 2, 4, 6 (ממוצע 4, טווח 4). הכפלנו את כולם פי 10 → 20, 40, 60.' },
      ],
      question: {
        type: 'mc',
        prompt: 'מה קרה לממוצע ולחציון?',
        options: [
          { text: 'גדלו ב-10', correct: false, hint: 'הממוצע החדש הוא 40 (ולא 14) — זה כפל, לא חיבור.' },
          { text: 'הוכפלו פי 10', correct: true },
        ],
      },
    },
    {
      blocks: [{ type: 'text', html: '<p>שימי לב למרווחים בין המספרים:</p>' }],
      question: {
        type: 'mc',
        prompt: 'מה קרה לטווח ולסטיית התקן?',
        options: [
          { text: 'נשארו אותו דבר', correct: false, hint: 'טעות נפוצה! בכפל, הפערים עצמם גדלים.' },
          { text: 'הוכפלו פי 10', correct: true },
        ],
      },
    },
    {
      blocks: [{ type: 'trap', title: 'זהירות! השאלה הכי מטעה בפרק', body: 'השונות היא סטיית התקן <strong>בריבוע</strong> — אז כשסטיית התקן מוכפלת פי 10, השונות מוכפלת פי 10², כלומר פי 100!' }],
      question: {
        type: 'mc',
        prompt: 'מה קרה לשונות?',
        options: [
          { text: 'גדלה פי 100 (10²)', correct: true },
          { text: 'גדלה פי 10', correct: false, hint: 'סטיית התקן גדלה פי 10, אבל השונות היא בריבוע...' },
        ],
      },
    },
    {
      blocks: [
        { type: 'concept', icon: '📝', title: 'מסקנה — כפל בקבוע', html: '<strong>מרכז:</strong> מוכפל.<br><strong>טווח וסטיית תקן:</strong> מוכפלים! (הגרף נמתח).<br><strong>שונות:</strong> מוכפלת <em>בריבוע</em> (כי היא "שטח").' },
        { type: 'text', html: '<p class="muted" style="text-align:center;">לפני ← אחרי (אותו סרגל) — הפעם רואים מתיחה אמיתית, לא רק הזזה:</p>' },
        BEFORE_MUL,
        AFTER_MUL,
      ],
    },
  ],
};
