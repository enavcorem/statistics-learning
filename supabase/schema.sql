-- ============================================================
-- סכימת Supabase ללומדת הסטטיסטיקה
-- ============================================================
-- איך מריצים: Supabase Dashboard של הפרויקט → SQL Editor → New query →
-- להדביק את כל הקובץ → Run. בטוח להריץ על הפרויקט הקיים: הסקריפט רק
-- יוצר טבלאות/מדיניות חדשות, לא נוגע בשום דבר אחר. אפשר להריץ שוב
-- בבטחה אם צריך (כל הפקודות "if not exists").
-- ============================================================

create extension if not exists pgcrypto;

-- ---------- תלמידות ----------
-- זיהוי תלמידה הוא לפי בית ספר+שם+כיתה (אין התחברות אמיתית עם סיסמה) —
-- ה-columns *_norm מנורמלים (רווחים מכווצים, אותיות קטנות) כדי שאותה
-- תלמידה שמתחברת ממחשב אחר עם רווח נוסף בשם עדיין תזוהה כאותה תלמידה.
create table if not exists students (
  id uuid primary key default gen_random_uuid(),
  school text not null,
  name text not null,
  class_name text not null,
  school_norm text not null,
  name_norm text not null,
  class_norm text not null,
  gender text not null default 'f' check (gender in ('f', 'm')),
  created_at timestamptz not null default now(),
  last_seen timestamptz not null default now(),
  unique (school_norm, name_norm, class_norm)
);

-- ---------- התקדמות ביחידות (שיעור/מעבדה/מבחן/הפניה) ----------
create table if not exists unit_progress (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references students(id) on delete cascade,
  unit_id text not null,
  status text not null check (status in ('started', 'completed', 'exempted')),
  last_slide int,
  completed_at timestamptz,
  updated_at timestamptz not null default now(),
  unique (student_id, unit_id)
);

-- ---------- תשובות מבחן (לדוח טעויות שהמורה רואה) ----------
create table if not exists quiz_answers (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references students(id) on delete cascade,
  unit_id text not null,
  answers jsonb not null,
  submitted_at timestamptz not null default now(),
  unique (student_id, unit_id)
);

-- ---------- ניסיונות אתגר-פטור (כל ניסיון נשמר בנפרד, לא רק האחרון) ----------
create table if not exists exemption_attempts (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references students(id) on delete cascade,
  chapter_id text not null,
  score numeric not null,
  passed boolean not null,
  attempted_at timestamptz not null default now()
);

create index if not exists idx_students_norm on students (school_norm, name_norm, class_norm);
create index if not exists idx_unit_progress_student on unit_progress (student_id);
create index if not exists idx_quiz_answers_student on quiz_answers (student_id);
create index if not exists idx_exemption_attempts_student on exemption_attempts (student_id);

-- ============================================================
-- מדיניות גישה (RLS)
-- ============================================================
-- חשוב להבין את המגבלה: אין כרגע התחברות אמיתית (Supabase Auth) —
-- כל מי שפותחת את האתר משתמשת באותו מפתח anon ציבורי. לכן המדיניות כאן
-- מאפשרת לכל אחת לקרוא ולכתוב בטבלאות האלה (לא למחוק — אין מדיניות
-- מחיקה בכלל, אז מחיקה חסומה תמיד), אבל לא נותנת גישה לשום טבלה אחרת
-- בפרויקט. זו לא הגנה מושלמת ברמת "תלמידה לא יכולה טכנית לראות נתונים
-- של תלמידה אחרת" — הגנה כזו דורשת בעתיד הרשמה אמיתית עם Supabase Auth.
-- לשימוש כיתתי עם קישור לא-ציבורי זה סיכון סביר בשלב הזה.

alter table students enable row level security;
alter table unit_progress enable row level security;
alter table quiz_answers enable row level security;
alter table exemption_attempts enable row level security;

create policy "anon select students" on students for select to anon using (true);
create policy "anon insert students" on students for insert to anon with check (true);
create policy "anon update students" on students for update to anon using (true) with check (true);

create policy "anon select unit_progress" on unit_progress for select to anon using (true);
create policy "anon insert unit_progress" on unit_progress for insert to anon with check (true);
create policy "anon update unit_progress" on unit_progress for update to anon using (true) with check (true);

create policy "anon select quiz_answers" on quiz_answers for select to anon using (true);
create policy "anon insert quiz_answers" on quiz_answers for insert to anon with check (true);
create policy "anon update quiz_answers" on quiz_answers for update to anon using (true) with check (true);

create policy "anon select exemption_attempts" on exemption_attempts for select to anon using (true);
create policy "anon insert exemption_attempts" on exemption_attempts for insert to anon with check (true);
