// פרק 3, ביס 1: הממוצע — מבוסס על "מדדי מרכז ופיזור.html" המקורי (אנלוגיית
// "מרכז הכובד"), עם תרגול ידני ותרגול נוסחת אקסל אמיתי — לא רק הערת אגב.

export default {
  title: 'הממוצע',
  slides: [
    {
      blocks: [
        { type: 'text', html: `<h1>ארגז הכלים של הסטטיסטיקה 🧰</h1><p>איך מתארים בקבוצה שלמה של נתונים "במספר אחד"? זו בדיוק השאלה שמדדי המרכז עונים עליה — ובבגרות שואלים עליה הרבה, לא כדי שתזכרו נוסחה (יש חומר מודפס), אלא כדי לבדוק שאתן מבינות <em>מה כל מדד באמת אומר, ומתי הוא מטעה</em>.</p>` },
        { type: 'concept', icon: '⚖️', title: 'הממוצע: מרכז הכובד', body: 'הממוצע לוקח את כל המספרים ומחלק אותם שווה בשווה.' },
        { type: 'trap', title: 'רגישות לקיצון!', body: 'הממוצע רגיש מאוד לערכים קיצוניים. אם יש ציון 0 אחד ברשימה, הוא ימשוך את כל הממוצע למטה — גם אם כל השאר הצליחו מצוין.' },
      ],
      question: {
        type: 'numeric',
        prompt: 'ציונים: 80, 90, 100. מה הממוצע?',
        answer: 90,
        hint: 'חברי את שלושתם וחלקי ב-3.',
      },
    },
    {
      blocks: [
        { type: 'concept', icon: '💻', title: 'עכשיו באקסל', html: 'הפונקציה היא <code class="ltr formula-display">AVERAGE(range)</code>.' },
        {
          type: 'table',
          headers: ['', 'A'],
          rows: [['1', '80'], ['2', '90'], ['3', '100'], ['4', '70']],
        },
        { type: 'text', html: '<p>איזו נוסחה תיתן את הממוצע של הטווח <strong class="ltr">A1:A4</strong>?</p>' },
      ],
      question: {
        type: 'mc',
        prompt: 'בחרי את הנוסחה הנכונה לממוצע:',
        options: [
          { text: '<span class="ltr">=AVERAGE(A1:A4)</span>', correct: true },
          { text: '<span class="ltr">=SUM(A1:A4)</span>', correct: false, hint: 'זו הנוסחה לסכום, לא לממוצע — היא לא מחלקת במספר התאים.' },
          { text: '<span class="ltr">=AVERAGE(A1:A5)</span>', correct: false, hint: 'שימי לב לטווח — הנתונים נמצאים ב-A1:A4 בלבד, לא עד A5.' },
          { text: '<span class="ltr">=MEDIAN(A1:A4)</span>', correct: false, hint: 'זו הנוסחה לחציון, לא לממוצע.' },
        ],
      },
    },
  ],
};
