// ===== בלוקים וסוגי שאלות ייחודיים לקורס =====
// js/router.js מייבא את הקובץ הזה תמיד, לפני הניתוב הראשון. **כל לומדה
// חייבת אותו — גם אם הוא ריק כמו כאן.**
//
// לומדת הסטטיסטיקה משתמשת רק בבלוקים ובסוגי השאלות שבמנוע עצמו
// (text / concept / example / trap / table / chart-bar / box-plot / video,
// ו-mc / numeric / match), ולכן אין כאן מה לרשום.
//
// אם בעתיד יידרש כאן בלוק ייחודי (למשל הדמיה אינטראקטיבית של התפלגות),
// כך רושמים אותו — בלי לגעת במנוע:
//
//   import { registerBlockRenderer } from '../../js/engine/blocks.js';
//   import { registerQuestionType } from '../../js/engine/question-types.js';
//
//   registerBlockRenderer('distribution-demo', renderDistributionDemo);
//   registerQuestionType('my-type', { practice: fn, exam: fn });
//
// דוגמה מלאה ועובדת: content/widgets/ בלומדת XLOOKUP.
// להסבר המלא: "README - איך להקים לומדה חדשה.md".
