// ===== פלטפורמת למידה - לוגיקת התקדמות =====
// כדי להוסיף יחידה חדשה: הוסיפי אובייקט חדש לרשימה MODULE_CONFIG

const MODULE_CONFIG = [
  { index: 1, file: 'סטיטסטיקה.html',                      title: 'מבוא לסטטיסטיקה',            unit: 1 },
  { index: 2, file: 'שכיחויות.html',                        title: 'טבלאות שכיחות',               unit: 1 },
  { index: 3, file: 'בדיקת ידע - שכיחיות.html',            title: 'חידון: שכיחויות',             unit: 1 },
  { index: 4, file: 'מדדי מרכז ופיזור.html',               title: 'מדדי מרכז ופיזור',            unit: 1 },
  { index: 5, file: 'מדדי מרכז ופיזור - סיכום.html',      title: 'סיכום: מדדי מרכז ופיזור',    unit: 1 },
  { index: 6, file: 'שינוי בנתונים.html',                   title: 'חקר שינויים במדדים',          unit: 1 },
  { index: 7, file: 'שינוי בנתונים - מבחן.html',           title: 'מבחן: שינוי בנתונים',        unit: 1 },
  { index: 8, file: 'statistics_quiz.html',                  title: 'מבחן מסכם – יחידה 1',        unit: 1 },
  // להוספת לומדה חדשה, הוסיפי שורה כאן (שני את unit ל-2 עבור יחידה 2):
  // { index: 9, file: 'שם-הקובץ.html', title: 'שם הלומדה', unit: 2 },
];

// ===== ניהול תלמידה =====

function getStudent() {
  return JSON.parse(localStorage.getItem('stat_student') || 'null');
}

function setStudent(student) {
  localStorage.setItem('stat_student', JSON.stringify(student));
}

function logout() {
  localStorage.removeItem('stat_student');
  location.href = 'index.html';
}

async function loginStudent(name, className) {
  const { data: existing, error: findErr } = await supabaseClient
    .from('students')
    .select('*')
    .eq('name', name.trim())
    .eq('class_name', className)
    .maybeSingle();

  if (existing) {
    await supabaseClient
      .from('students')
      .update({ last_seen: new Date().toISOString() })
      .eq('id', existing.id);
    setStudent(existing);
    return existing;
  }

  const { data: newStudent, error } = await supabaseClient
    .from('students')
    .insert([{ name: name.trim(), class_name: className }])
    .select()
    .single();

  if (error) throw error;
  setStudent(newStudent);
  return newStudent;
}

// ===== מעקב התקדמות =====

async function loadProgress(moduleIndex) {
  const student = getStudent();
  if (!student) return null;

  const { data } = await supabaseClient
    .from('module_progress')
    .select('last_slide, status')
    .eq('student_id', student.id)
    .eq('module_index', moduleIndex)
    .maybeSingle();

  return data;
}

async function saveProgress(moduleIndex, slideNum) {
  const student = getStudent();
  if (!student) return;

  await supabaseClient
    .from('module_progress')
    .upsert(
      { student_id: student.id, module_index: moduleIndex, last_slide: slideNum, status: 'started' },
      { onConflict: 'student_id,module_index' }
    );

  await supabaseClient
    .from('students')
    .update({ last_seen: new Date().toISOString() })
    .eq('id', student.id);
}

async function markComplete(moduleIndex) {
  const student = getStudent();
  if (!student) return;

  await supabaseClient
    .from('module_progress')
    .upsert(
      { student_id: student.id, module_index: moduleIndex, last_slide: 9999, status: 'completed', completed_at: new Date().toISOString() },
      { onConflict: 'student_id,module_index' }
    );

  const { data: studentData } = await supabaseClient
    .from('students')
    .select('unlocked_up_to')
    .eq('id', student.id)
    .single();

  if (studentData) {
    const maxModuleIndex = MODULE_CONFIG[MODULE_CONFIG.length - 1].index;
    const newUnlock = Math.min(
      Math.max(studentData.unlocked_up_to || 1, moduleIndex + 1),
      maxModuleIndex
    );
    await supabaseClient
      .from('students')
      .update({ unlocked_up_to: newUnlock, last_seen: new Date().toISOString() })
      .eq('id', student.id);

    const local = getStudent();
    if (local) { local.unlocked_up_to = newUnlock; setStudent(local); }
  }
}

async function canAccessModule(moduleIndex) {
  if (moduleIndex <= 1) return true;
  const student = getStudent();
  if (!student) return false;

  const { data } = await supabaseClient
    .from('students')
    .select('unlocked_up_to')
    .eq('id', student.id)
    .single();

  if (data) { student.unlocked_up_to = data.unlocked_up_to; setStudent(student); }
  return data && moduleIndex <= (data.unlocked_up_to || 1);
}

// ===== סרגל ניווט =====

function addNavBar(moduleIndex, moduleName) {
  const student = getStudent();
  const studentName = student ? student.name : '';
  const totalModules = MODULE_CONFIG.length;

  const bar = document.createElement('div');
  bar.id = 'platform-nav';
  bar.style.cssText = [
    'position:fixed', 'top:0', 'right:0', 'left:0', 'z-index:9999',
    'background:#fff', 'border-bottom:2px solid #e8e8e8',
    'padding:0 20px', 'height:52px',
    'display:flex', 'align-items:center', 'justify-content:space-between',
    'direction:rtl', 'font-family:Segoe UI,Tahoma,sans-serif',
    'box-shadow:0 2px 8px rgba(0,0,0,0.08)'
  ].join(';');

  bar.innerHTML = `
    <a href="index.html" style="text-decoration:none;color:#6C63FF;font-weight:bold;font-size:14px;white-space:nowrap;">🏠 ראשי</a>
    <div style="text-align:center;flex:1;padding:0 10px;">
      <div style="font-size:11px;color:#999;">לומדה ${moduleIndex} מתוך ${totalModules}</div>
      <div style="font-size:13px;font-weight:bold;color:#333;line-height:1.2;">${moduleName}</div>
    </div>
    <div style="font-size:13px;color:#777;white-space:nowrap;">שלום, ${studentName} 👋
      <button onclick="logout()" style="margin-right:8px;background:none;border:none;color:#aaa;cursor:pointer;font-size:12px;">יציאה</button>
    </div>
  `;

  const spacer = document.createElement('div');
  spacer.style.height = '60px';

  document.body.insertBefore(spacer, document.body.firstChild);
  document.body.insertBefore(bar, document.body.firstChild);
}

// ===== כניסה לדף לומדה (בדיקת הרשאה + טעינת מיקום) =====

async function initModule(moduleIndex, moduleName, onReady) {
  if (!getStudent()) { location.href = 'index.html'; return; }

  const allowed = await canAccessModule(moduleIndex);
  if (!allowed) {
    alert('לומדה זו עדיין נעולה. השלימי את הלומדה הקודמת תחילה.');
    location.href = 'index.html';
    return;
  }

  addNavBar(moduleIndex, moduleName);

  const progress = await loadProgress(moduleIndex);
  if (!progress) {
    await saveProgress(moduleIndex, 1);
  }

  onReady(progress);
}
