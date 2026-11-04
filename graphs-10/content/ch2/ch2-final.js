// מבחן מסכם: קריאת גרף עמודות, גרף עוגה וגרף קו, גרף מטעה, ובחירת הגרף המתאים.
// chart-mc / chart-numeric = שאלה רגילה עם גרף (ראו content/widgets/charts.js).
// validate לא בודק "תשובה נכונה אחת" בסוגים האלה, ולכן בודקים בעין.
// בגרף העוגה כאן details כבוי, כדי שהגרף לא יחשב במקום התלמידים.

const books = {
  type: 'stick-chart',
  title: 'כמה ספרים קראו תלמידי י\'3 בחופש',
  data: [
    { label: '0', value: 4 }, { label: '1', value: 7 }, { label: '2', value: 9 },
    { label: '3', value: 5 }, { label: '4', value: 3 },
  ],
  max: 10,
  step: 2,
  xTitle: 'מספר ספרים',
  yTitle: 'מספר תלמידים',
  readout: '<b>{value}</b> תלמידים קראו <b>{label}</b> ספרים',
};

const sport = {
  type: 'pie-chart',
  title: 'ענף הספורט האהוב על 300 תלמידי השכבה',
  data: [
    { label: 'כדורגל', value: 35 },
    { label: 'כדורסל', value: 25 },
    { label: 'ריקוד', value: 30 },
    { label: 'שחייה', value: 10 },
  ],
  total: 300,
  unit: 'תלמידים',
  details: false,
};

const library = {
  type: 'line-chart',
  title: 'מספר המבקרים בספריית בית הספר',
  labels: ['א\'', 'ב\'', 'ג\'', 'ד\'', 'ה\''],
  values: [20, 35, 30, 45, 25],
  max: 50,
  step: 10,
  xTitle: 'יום',
  yTitle: 'מספר מבקרים',
  sliderLabel: 'יום:',
};

const ticket = {
  type: 'axis-trick',
  title: 'מחיר כרטיס להופעה של סוף השנה',
  data: [{ label: '2024', value: 50 }, { label: '2025', value: 55 }],
  bases: [48],
  max: 56,
  steps: { 48: 2 },
  yTitle: 'מחיר (₪)',
};

export default {
  title: 'מבחן מסכם: סוגי גרפים',
  passMark: 70,
  questions: [
    {
      type: 'chart-numeric',
      topic: 'גרף עמודות: סכום השכיחויות',
      prompt: 'כמה תלמידים יש בכיתה י\'3?',
      chart: books,
      answer: 28,
      unitLabel: 'תלמידים',
      explanation: 'מחברים את כל העמודות: 4+7+9+5+3 = 28.',
    },
    {
      type: 'chart-mc',
      topic: 'גרף עמודות: שכיח ושכיחות',
      prompt: 'מהו השכיח של מספר הספרים?',
      chart: books,
      options: [
        { text: '9', correct: false },
        { text: '2', correct: true },
        { text: '4', correct: false },
        { text: '1', correct: false },
      ],
      explanation: 'העמודה הגבוהה ביותר נמצאת מעל 2, ולכן השכיח הוא 2. המספר 9 הוא השכיחות שלו, לא השכיח.',
    },
    {
      type: 'chart-numeric',
      topic: 'גרף עמודות: "לפחות"',
      prompt: 'כמה תלמידים קראו לפחות 2 ספרים?',
      chart: books,
      answer: 17,
      unitLabel: 'תלמידים',
      explanation: '"לפחות 2" = 2 או 3 או 4: 9+5+3 = 17.',
    },
    {
      type: 'chart-numeric',
      topic: 'גרף עוגה: אחוז ← מספר',
      prompt: 'כמה תלמידים בחרו ריקוד?',
      chart: sport,
      answer: 90,
      unitLabel: 'תלמידים',
      explanation: '30% מתוך 300: 0.3 × 300 = 90.',
    },
    {
      type: 'chart-mc',
      topic: 'גרף קו: עלייה וירידה',
      prompt: 'באיזה יום הייתה הירידה הגדולה ביותר במספר המבקרים, לעומת היום שלפניו?',
      chart: library,
      options: [
        { text: 'יום ב\'', correct: false },
        { text: 'יום ג\'', correct: false },
        { text: 'יום ה\'', correct: true },
        { text: 'יום ד\'', correct: false },
      ],
      explanation: 'בין ד\' ל-ה\' ירד המספר מ-45 ל-25, כלומר ב-20. בין ב\' ל-ג\' הירידה היא רק 5. בימים ב\' ו-ד\' המספר עלה.',
    },
    {
      type: 'chart-numeric',
      topic: 'גרף קו: עלייה וירידה',
      prompt: 'בכמה גדל מספר המבקרים מיום א\' עד יום ד\'?',
      chart: library,
      answer: 25,
      unitLabel: 'מבקרים',
      explanation: 'הערך המאוחר פחות הערך המוקדם: 45−20 = 25.',
    },
    {
      type: 'chart-mc',
      topic: 'גרף מטעה: ציר שלא מתחיל ב-0',
      prompt: 'מה נכון לגבי מחיר הכרטיס?',
      chart: ticket,
      options: [
        { text: 'המחיר עלה פי 3 בערך', correct: false },
        { text: 'המחיר ירד', correct: false },
        { text: 'אי אפשר לדעת, כי הציר לא מתחיל ב-0', correct: false },
        { text: 'המחיר עלה ב-10%', correct: true },
      ],
      explanation: 'המספרים הם 50 ו-55. הגידול הוא 5, ו-5 ÷ 50 × 100 = 10%. העמודה נראית גבוהה בהרבה רק כי הציר מתחיל ב-48.',
    },
    {
      type: 'mc',
      topic: 'בחירת הגרף המתאים',
      prompt: 'כל אחד מתלמידי השכבה בחר מגמה אחת. רוצים להראות איזה אחוז מהשכבה בחר כל מגמה. איזה גרף הכי מתאים?',
      options: [
        { text: 'גרף עוגה', correct: true },
        { text: 'גרף קו', correct: false },
        { text: 'גרף עמודות', correct: false },
      ],
      explanation: 'אלה חלקים מתוך שלם אחד (כל השכבה), וכל תלמיד נספר פעם אחת. לכן גרף עוגה.',
    },
    {
      type: 'mc',
      topic: 'בחירת הגרף המתאים',
      prompt: 'רוצים להשוות כמה ספרים השאילה כל כיתה בשכבה במהלך השנה. איזה גרף הכי מתאים?',
      options: [
        { text: 'גרף קו', correct: false },
        { text: 'גרף עמודות', correct: true },
        { text: 'גרף עוגה', correct: false },
      ],
      explanation: 'משווים בין קבוצות נפרדות (כיתות), ולכן גרף עמודות. אין כאן רצף בין הכיתות, ולכן לא קו.',
    },
    {
      type: 'mc',
      topic: 'בחירת הגרף המתאים',
      prompt: 'אחות טיפת חלב שקלה תינוקת פעם בחודש, במשך השנה הראשונה שלה. איזה גרף הכי מתאים להצגת המשקל?',
      options: [
        { text: 'גרף עוגה', correct: false },
        { text: 'גרף עמודות', correct: false },
        { text: 'גרף קו', correct: true },
      ],
      explanation: 'המשקל הוא מדידה שמשתנה ברציפות לאורך זמן, ולכן גרף קו. עוגה מתאימה רק לחלקים מתוך שלם.',
    },
  ],
};
