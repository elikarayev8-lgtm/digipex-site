// Digipex — Supabase bağlantısı (bütün hesab səhifələri üçün ortaq)
// Yeni Supabase layihəsini yaradandan sonra bu iki sətri doldurun:
//   Supabase → Project Settings → API → Project URL və "anon public" açar.
// anon açar ictimaidir, brauzerdə olması təhlükəsizdir (məlumatı RLS qoruyur).
// "service_role" açarını HEÇ VAXT bura yazmayın.
const SUPABASE_URL = 'https://XXXXXXXX.supabase.co';
const SUPABASE_ANON_KEY = 'XXXXXXXX';

const SITE_URL = location.origin;
const SB_READY = !SUPABASE_URL.includes('XXXX') && typeof window.supabase !== 'undefined';
const sb = SB_READY ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
}) : null;

const $ = s => document.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const ROLE_AZ = { doctor: 'Həkim', xray_center: 'Rentgen mərkəzi' };
const STATUS_AZ = { pending: 'Yoxlanılır', approved: 'Təsdiqlənib', rejected: 'Rədd edilib' };

function showMsg(el, type, html) { el.className = 'msg ' + type; el.innerHTML = html; }
function setupWarning(where) {
  if (SB_READY) return false;
  const box = document.createElement('div');
  box.className = 'setup';
  box.innerHTML = '<b>Server hələ qoşulmayıb.</b> Supabase layihəsi yaradıldıqdan sonra <code>supa.js</code> faylında URL və anon açarı yazılmalıdır. Hələlik forma yalnız görünüş üçündür.';
  (where || document.querySelector('.card')).prepend(box);
  return true;
}
// Azərbaycanca xəta mesajları
function azError(err) {
  const m = (err && (err.message || err.error_description || String(err))) || '';
  if (/Invalid login credentials/i.test(m)) return 'E-mail və ya şifrə yanlışdır.';
  if (/Email not confirmed/i.test(m)) return 'E-mail hələ təsdiqlənməyib. Poçtunuzdakı linkə klikləyin.';
  if (/already registered|already exists/i.test(m)) return 'Bu e-mail ilə artıq qeydiyyat var. Giriş edin və ya şifrəni bərpa edin.';
  if (/Password should be at least/i.test(m)) return 'Şifrə ən azı 8 simvol olmalıdır.';
  if (/rate limit|too many/i.test(m)) return 'Çox sayda cəhd edildi. Bir neçə dəqiqə sonra yenidən yoxlayın.';
  if (/valid email|invalid email/i.test(m)) return 'E-mail ünvanı düzgün deyil.';
  if (/network|fetch/i.test(m)) return 'İnternet bağlantısını yoxlayın.';
  return 'Xəta baş verdi: ' + esc(m);
}
async function currentProfile() {
  if (!sb) return null;
  const { data: { session } } = await sb.auth.getSession();
  if (!session) return null;
  const { data, error } = await sb.from('profiles').select('*').eq('id', session.user.id).single();
  if (error) return { user: session.user, profile: null, error };
  return { user: session.user, profile: data };
}
// Header-də "Giriş" linkini "Hesabım" ilə əvəz et
async function updateHeader() {
  const a = document.getElementById('navAccount'); if (!a || !sb) return;
  const { data: { session } } = await sb.auth.getSession();
  if (session) { a.textContent = 'Hesabım'; a.href = 'hesab.html'; }
}
updateHeader();
