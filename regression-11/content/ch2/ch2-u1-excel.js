// יחידה 4: הפונקציות באקסל. SLOPE, INTERCEPT ו-FORECAST על אותה טבלה של גיל והורדות.
// מוקש מרכזי: בכל שלוש הפונקציות טווח ה-Y בא לפני טווח ה-X.

const ltr = (x) => `<span class="ltr">${x}</span>`;
const code = (x) => `<code class="ltr formula-display">${x}</code>`;

const SHEET = {
  type: 'table',
  headers: ['', 'A', 'B'],
  rows: [
    ['1', { text: 'גיל', highlight: 'good' }, { text: 'מספר הורדות', highlight: 'good' }],
    ['2', '10', '102'],
    ['3', '11', '132'],
    ['4', '12', '116'],
    ['5', '13', '146'],
    ['6', '14', '158'],
    ['7', '15', '139'],
    ['8', '16', '171'],
    ['9', '17', '195'],
    ['10', '18', '209'],
    ['11', '19', '192'],
    ['12', '20', '215'],
  ],
};

export default {
  title: 'SLOPE, INTERCEPT ו-FORECAST',
  slides: [
    {
      blocks: [
        { type: 'text', html: '<h2>הנתונים בגיליון</h2><p>באקסל לא צריך לחשב את הקו ביד. שלוש פונקציות עושות את זה:</p>' },
        SHEET,
        { type: 'table', headers: ['פונקציה', 'מה היא מחזירה'], rows: [
          [ltr('SLOPE'), 'את השיפוע של קו הרגרסיה'],
          [ltr('INTERCEPT'), 'את החותך עם ציר Y'],
          [ltr('FORECAST'), 'חיזוי של Y לערך X חדש'],
        ] },
      ],
      question: {
        type: 'mc',
        prompt: 'באיזו פונקציה נשתמש כדי למצוא את השיפוע של קו הרגרסיה?',
        options: [
          { text: 'INTERCEPT', correct: false, hint: 'INTERCEPT מחזירה את החותך, כלומר את הנקודה שבה הקו חוצה את ציר Y.' },
          { text: 'FORECAST', correct: false, hint: 'FORECAST חוזה ערך של Y. היא משתמשת בשיפוע, אבל לא מחזירה אותו.' },
          { text: 'SLOPE', correct: true },
          { text: 'AVERAGE', correct: false, hint: 'AVERAGE מחשבת ממוצע של עמודה אחת. היא לא קשורה לקו.' },
        ],
      },
    },
    {
      blocks: [
        { type: 'text', html: `<h2>הסדר בסוגריים</h2><p>ל-SLOPE ול-INTERCEPT יש שני טווחים: קודם ה-Y (המשתנה התלוי), ואחר כך ה-X (המשתנה הבלתי תלוי).</p>${code('=SLOPE(B2:B12, A2:A12)')}<p>בדוגמה התוצאה היא ${ltr('10.86')}.</p>` },
        { type: 'trap', title: 'מוקש: Y לפני X', body: `קל לכתוב את העמודות לפי הסדר בגיליון, A ואז B. אבל באקסל <b>Y בא קודם</b>. אם הופכים את הסדר, מקבלים מספר אחר, בלי הודעת שגיאה: ${ltr('=SLOPE(A2:A12, B2:B12)')} מחזירה ${ltr('0.08')}.` },
      ],
      question: {
        type: 'mc',
        prompt: 'איזו נוסחה מחזירה את החותך של קו הרגרסיה בדוגמה?',
        options: [
          { text: ltr('=INTERCEPT(A2:A12, B2:B12)'), correct: false, hint: 'הטווחים הפוכים. קודם Y (מספר ההורדות, עמודה B), ואחר כך X (הגיל, עמודה A).' },
          { text: ltr('=INTERCEPT(B2:B12, A2:A12)'), correct: true },
          { text: ltr('=INTERCEPT(B2:B12)'), correct: false, hint: 'חסר טווח ה-X. הקו מחושב משני משתנים, ולכן צריך שני טווחים.' },
          { text: ltr('=SLOPE(B2:B12, A2:A12)'), correct: false, hint: 'זו נוסחה נכונה, אבל היא מחזירה את השיפוע ולא את החותך.' },
        ],
      },
    },
    {
      blocks: [
        { type: 'text', html: `<h2>FORECAST: חיזוי</h2><p>FORECAST מקבלת שלושה דברים: את ערך ה-X שרוצים לחזות עבורו, את טווח ה-Y ואת טווח ה-X.</p>${code('=FORECAST(25, B2:B12, A2:A12)')}<p>כך חוזים את מספר ההורדות לבני 25, גיל שאינו בטבלה.</p>` },
        { type: 'example', icon: '🔍', title: 'בגרסאות חדשות של אקסל', body: `יש גם ${ltr('FORECAST.LINEAR')}. היא עובדת בדיוק אותו דבר, עם אותו סדר.` },
      ],
      question: {
        type: 'mc',
        prompt: 'רוצים לחזות את מספר ההורדות לבני 22. איזו נוסחה נכונה?',
        options: [
          { text: ltr('=FORECAST(B2:B12, A2:A12, 22)'), correct: false, hint: 'ערך ה-X שחוזים עבורו (22) בא ראשון, לפני הטווחים.' },
          { text: ltr('=FORECAST(22, A2:A12, B2:B12)'), correct: false, hint: 'הטווחים הפוכים. גם כאן Y (עמודה B) בא לפני X (עמודה A).' },
          { text: ltr('=SLOPE(22, B2:B12, A2:A12)'), correct: false, hint: 'SLOPE מחזירה שיפוע ומקבלת רק שני טווחים. לחיזוי משתמשים ב-FORECAST.' },
          { text: ltr('=FORECAST(22, B2:B12, A2:A12)'), correct: true },
        ],
      },
    },
    {
      blocks: [
        { type: 'text', html: `<h2>מה FORECAST עושה מאחורי הקלעים</h2><p>היא פשוט מציבה בנוסחת הקו: ${ltr('Y = SLOPE · X + INTERCEPT')}.</p><p>בדוגמה: SLOPE מחזירה ${ltr('10.86')}, ו-INTERCEPT מחזירה ${ltr('−1.59')}.</p>` },
      ],
      question: {
        type: 'numeric',
        prompt: `מה תחזיר ${ltr('=FORECAST(25, B2:B12, A2:A12)')}? (עגלו למספר שלם)`,
        answer: 270,
        tolerance: 1,
        hint: `מציבים X = 25: ${ltr('10.86 · 25 − 1.59')}.`,
      },
    },
  ],
};
