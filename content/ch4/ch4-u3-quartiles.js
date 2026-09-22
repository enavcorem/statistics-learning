// פרק 4, ביס 3: רבעונים וטווח בין-רבעוני (IQR) — "לב הכיתה", בסיס גם
// לתרשים הקופסה שיבוא בהמשך (בפרק ההיסטוגרמה).

export default {
  title: 'רבעונים ו-IQR',
  slides: [
    {
      blocks: [
        { type: 'text', html: '<p>סטיית התקן (בביס הקודם) כן מושפעת מערכים קיצוניים — היא מביאה בחשבון את כולם. יש מדד פיזור נוסף שמתעלם מהקיצונים בכוונה, ולכן יציב יותר כשיש ערך חריג בודד.</p>' },
        { type: 'concept', icon: '📦', title: 'הטווח הבין-רבעוני (IQR)', body: 'אם נזרוק את הקיצוניים ביותר (25% הכי נמוכים ו-25% הכי גבוהים), נישאר עם ה"לב" של הכיתה — 50% האמצעיים. זהו מדד יציב שלא מושפע מקיצון.' },
        { type: 'example', icon: '🍰', title: 'רבעונים', body: 'Q1 (הרבעון התחתון) הוא הערך שמתחתיו נמצאים 25% מהנתונים. Q3 (הרבעון העליון) הוא הערך שמתחתיו נמצאים 75% מהנתונים. ה-IQR הוא הפער ביניהם: Q3 − Q1.' },
      ],
      question: {
        type: 'numeric',
        prompt: 'רבעון עליון (Q3) הוא 90. רבעון תחתון (Q1) הוא 60. מה הטווח הבין-רבעוני?',
        answer: 30,
        hint: '90 פחות 60.',
      },
    },
    {
      blocks: [
        { type: 'concept', icon: '💻', title: 'עכשיו באקסל', html: 'נוסחה למתקדמים: <code class="ltr formula-display">QUARTILE(range,3) - QUARTILE(range,1)</code>' },
        { type: 'table', headers: ['', 'A'], rows: [['1', '50'], ['2', '60'], ['3', '70'], ['4', '80'], ['5', '90']] },
      ],
      question: {
        type: 'mc',
        prompt: 'בחרי את הנוסחה הנכונה ל-IQR:',
        options: [
          { text: '<span class="ltr">=QUARTILE(A1:A5,3)-QUARTILE(A1:A5,1)</span>', correct: true },
          { text: '<span class="ltr">=QUARTILE(A1:A5,1)-QUARTILE(A1:A5,3)</span>', correct: false, hint: 'הסדר הפוך — זה ייתן מספר שלילי. תמיד עליון פחות תחתון.' },
          { text: '<span class="ltr">=MAX(A1:A5)-MIN(A1:A5)</span>', correct: false, hint: 'זו הנוסחה לטווח הרגיל, לא ל-IQR — היא לא מתעלמת מהקיצונים.' },
          { text: '<span class="ltr">=QUARTILE(A1:A5,4)-QUARTILE(A1:A5,0)</span>', correct: false, hint: 'ל-QUARTILE יש רק ערכים 0-4, אבל Q1 ו-Q3 הם דווקא 1 ו-3, לא 0 ו-4 (שהם המינימום והמקסימום).' },
        ],
      },
    },
  ],
};
