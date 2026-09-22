// ===== עזרי בניית שאלות משותפים לכל קבצי המבחן/אתגר-פטור =====
// היו מוגדרים בעבר בנפרד (בעותק-הדבק זהה) בכל קובץ quiz/exemption בנפרד —
// אוחדו לכאן כדי ששינוי אחד (או תיקון באג) יחול בכל מקום בבת אחת.

// explanation אופציונלי בכוונה: קבצי quiz שולחים אותו (מוצג בדוח הטעויות),
// קבצי exemption לא שולחים אותו בכלל (השדה פשוט לא קיים באובייקט המוחזר).
export function mc(topic, prompt, opts, correctIndex, explanation) {
  return { type: 'mc', topic, prompt, explanation, options: opts.map((text, i) => ({ text, correct: i === correctIndex })) };
}

// עוטפת טקסט נוסחת-אקסל ב-LTR כדי שלא "יתהפך" בתוך כפתור בעמוד RTL.
export function ltrOpt(formulaText) {
  return `<span class="ltr">${formulaText}</span>`;
}

// טבלה קטנה בתוך prompt של שאלה (למשל טבלת שכיחות מצטברת עם "?" לחישוב).
export function tableHtml(headers, rows) {
  const th = headers.map(h => `<th>${h}</th>`).join('');
  const trs = rows.map(r => `<tr>${r.map(c => `<td>${c}</td>`).join('')}</tr>`).join('');
  return `<div class="table-scroll"><table class="content-table" style="margin-bottom:10px;"><tr>${th}</tr>${trs}</table></div>`;
}
