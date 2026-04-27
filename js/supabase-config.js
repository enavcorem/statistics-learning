// ===== הגדרות Supabase =====
// החליפי את הערכים האלה בערכים האמיתיים מפרויקט Supabase שלך
// Settings → API → Project URL + anon public key

const SUPABASE_URL = 'https://rldpknffxccmdhekhwth.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_MxQy7AYaZ9oLbOBFkUxElQ_PA1PmPza';

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
