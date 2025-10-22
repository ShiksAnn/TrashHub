// app.js — single-page TrashHub frontend (Supabase + Google Places + IntaSend demo + charts)
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

// ----------------------
// Supabase config (you provided earlier)
const SUPABASE_URL = 'https://diafryzevfzdoxvkjlvr.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpYWZyeXpldmZ6ZG94dmtqbHZyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA3OTEwMTMsImV4cCI6MjA3NjM2NzAxM30.q6ya6paTCMinmmcNqZ1cBCJ_9hi-EVaVm8hqw2IXN9Y';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
// ----------------------

/* DOM refs */
const app = document.getElementById('app');
document.getElementById('year').textContent = new Date().getFullYear();

let state = {
  user: null,
  profile: null,
  pickups: [],
  currentPickupLocation: null
};

/* ------------------ Home landing ------------------ */
function renderHome() {
  updateAuthArea();
  app.innerHTML = `
    <section class="card grid cols-2">
      <div>
        <div class="header-row">
          <div>
            <h2>TrashHub — Clean cities, smart pickups</h2>
            <p style="color:#6b7280;margin-top:6px">Schedule pickups, track collection trucks, and turn waste into value.</p>
          </div>
        </div>

        <div style="margin-top:12px">
          <h4 style="margin-bottom:8px">Features</h4>
          <ul style="color:var(--muted);line-height:1.6;">
            <li>Real-time tracking (Google Maps)</li>
            <li>Recycling marketplace (future)</li>
            <li>Supabase Auth & Database</li>
            <li>IntaSend payments (demo)</li>
          </ul>
        </div>
      </div>

      <div class="card" style="padding:14px">
        <h3 style="margin-top:0">Quick demo: Request a pickup</h3>
        ${pickupFormHTML()}
      </div>
    </section>
  `;
  attachPickupForm();
}

/* ------------------ Header auth area ------------------ */
function updateAuthArea() {
  const area = document.getElementById('auth-area');
  area.innerHTML = '';
  if (!state.user) {
    const btn = document.createElement('button');
    btn.className = 'btn small';
    btn.id = 'openAuthBtnHeader';
    btn.textContent = 'Login / Signup';
    btn.onclick = openAuthModal;
    area.appendChild(btn);
  } else {
    const name = document.createElement('div');
    name.style.fontSize = '13px';
    name.style.marginRight = '8px';
    name.textContent = state.profile?.full_name || state.user.email;

    const logout = document.createElement('button');
    logout.className = 'btn small ghost';
    logout.textContent = 'Logout';
    logout.onclick = async () => {
      await supabase.auth.signOut();
      state.user = null;
      state.profile = null;
      renderHome();
    };

    area.appendChild(name);
    area.appendChild(logout);
  }
}

/* ------------------ Auth modal (popup) ------------------ */
const authModal = document.getElementById('authModal');
const authBody = document.getElementById('authBody');
document.getElementById('openAuthBtn').addEventListener('click', openAuthModal);
document.getElementById('closeAuthBtn').addEventListener('click', closeAuthModal);
document.getElementById('tabSignup').addEventListener('click', () => switchAuthTab('signup'));
document.getElementById('tabLogin').addEventListener('click', () => switchAuthTab('login'));

// open/close
function openAuthModal() {
  switchAuthTab('signup');
  authModal.classList.remove('hidden');
}
function closeAuthModal() {
  authModal.classList.add('hidden');
}

// switch tabs
function switchAuthTab(tab) {
  document.getElementById('tabSignup').classList.toggle('active', tab === 'signup');
  document.getElementById('tabLogin').classList.toggle('active', tab === 'login');
  if (tab === 'signup') showSignupForm();
  else showLoginForm();
}

/* Signup with Google Places autocomplete for location */
function showSignupForm() {
  document.getElementById('authTitle').textContent = 'Create account';
  authBody.innerHTML = `
    <div id="signupBlock">
      <label>Full name</label><input id="su-name" class="input" placeholder="Your full name" />
      <label>Email</label><input id="su-email" class="input" type="email" placeholder="you@domain.com" />
      <label>Password</label><input id="su-password" class="input" type="password" placeholder="Password (min 6 chars)" />
      <label>Phone</label><input id="su-phone" class="input" placeholder="07..." />
      <label>Location</label><input id="su-location" class="input" placeholder="Start typing your city / estate" />
      <label>Account type</label>
      <select id="su-role" class="input">
        <option value="resident">Resident</option>
        <option value="collector">Collector</option>
        <option value="admin">Admin</option>
      </select>

      <div style="display:flex;gap:8px;margin-top:10px;align-items:center">
        <button id="doSignup" class="btn">Create account</button>
        <button id="toLogin" class="btn small ghost">Switch to Login</button>
        <div id="signup-msg" style="color:#dc2626;margin-left:12px"></div>
      </div>
    </div>
  `;

  // attach Google Places autocomplete (if loaded)
  setTimeout(() => {
    const locEl = document.getElementById('su-location');
    if (window.google?.maps?.places && locEl) {
      const autocomplete = new google.maps.places.Autocomplete(locEl, { types: ['(regions)'] });
      autocomplete.addListener('place_changed', () => {
        const place = autocomplete.getPlace();
        if (place.geometry?.location) {
          locEl.dataset.lat = place.geometry.location.lat();
          locEl.dataset.lng = place.geometry.location.lng();
        }
      });
    }
  }, 400);

  document.getElementById('doSignup').onclick = handleSignup;
  document.getElementById('toLogin').onclick = () => switchAuthTab('login');
}

/* Login form */
function showLoginForm() {
  document.getElementById('authTitle').textContent = 'Login';
  authBody.innerHTML = `
    <div id="loginBlock">
      <label>Email</label><input id="li-email" class="input" type="email" placeholder="you@domain.com" />
      <label>Password</label><input id="li-password" class="input" type="password" placeholder="password" />
      <div style="display:flex;gap:8px;margin-top:10px;align-items:center">
        <button id="doLogin" class="btn">Login</button>
        <button id="toSignup" class="btn small ghost">Back to Signup</button>
        <div id="login-msg" style="color:#dc2626;margin-left:12px"></div>
      </div>
    </div>
  `;
  document.getElementById('doLogin').onclick = handleLogin;
  document.getElementById('toSignup').onclick = () => switchAuthTab('signup');
}

/* Signup handler */
async function handleSignup() {
  const full_name = document.getElementById('su-name').value.trim();
  const email = document.getElementById('su-email').value.trim();
  const password = document.getElementById('su-password').value;
  const phone = document.getElementById('su-phone').value.trim();
  const location = document.getElementById('su-location').value.trim();
  const role = document.getElementById('su-role').value;
  const msg = document.getElementById('signup-msg');
  msg.textContent = '';

  if (!full_name || !email || !password) { msg.textContent = 'Name, email and password required.'; return; }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name, phone, location, role } }
  });

  if (error) { msg.textContent = error.message; return; }

  // Wait briefly and try to create profile row
  setTimeout(async () => {
    await loadCurrentUser();
    if (!state.user) {
      msg.style.color = '#16a34a';
      msg.textContent = 'Account created. Please confirm your email (if required) then login.';
      return;
    }
    const locEl = document.getElementById('su-location');
    const lat = locEl?.dataset?.lat ? parseFloat(locEl.dataset.lat) : null;
    const lng = locEl?.dataset?.lng ? parseFloat(locEl.dataset.lng) : null;
    await supabase.from('profiles').upsert([{ id: state.user.id, full_name, role, phone, location, lat, lng }]);
    await loadCurrentUser();
    msg.style.color = '#16a34a';
    msg.textContent = 'Account ready — redirecting...';
    closeAuthModal();
    routeAfterLogin();
  }, 900);
}

/* Login handler */
async function handleLogin() {
  const email = document.getElementById('li-email').value.trim();
  const password = document.getElementById('li-password').value;
  const msg = document.getElementById('login-msg');
  msg.textContent = '';
  if (!email || !password) { msg.textContent = 'Enter email and password'; return; }

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) { msg.textContent = error.message; return; }

  await loadCurrentUser();
  // ensure profile row exists
  if (state.user && !state.profile) {
    const meta = state.user.user_metadata || {};
    await supabase.from('profiles').upsert([{ id: state.user.id, full_name: meta.full_name || null, role: meta.role || 'resident', phone: meta.phone || null, location: meta.location || null }]);
    await loadCurrentUser();
  }
  msg.style.color = '#16a34a';
  msg.textContent = 'Login successful — redirecting...';
  closeAuthModal();
  routeAfterLogin();
}

/* Ensure profile exists (fallback) */
async function ensureProfile() {
  if (!state.user) return;
  const { data } = await supabase.from('profiles').select('id').eq('id', state.user.id).maybeSingle();
  if (!data) {
    const meta = state.user.user_metadata || {};
    await supabase.from('profiles').upsert([{ id: state.user.id, full_name: meta.full_name || null, role: meta.role || 'resident', phone: meta.phone || null, location: meta.location || null }]);
  }
}

/* Load current user + profile */
async function loadCurrentUser() {
  const { data: authData } = await supabase.auth.getUser();
  state.user = authData?.user || null;
  if (state.user) {
    const { data: profile } = await supabase.from('profiles').select('*').eq('id', state.user.id).maybeSingle();
    state.profile = profile || null;
  } else state.profile = null;
  updateAuthArea();
}
supabase.auth.onAuthStateChange(() => loadCurrentUser());

/* ------------------ Post-login routing ------------------ */
async function routeAfterLogin() {
  await ensureProfile();
  await loadCurrentUser();
  const role = state.profile?.role || state.user?.user_metadata?.role || 'resident';
  if (role === 'admin') return renderAdmin();
  if (role === 'collector') return renderCollector();
  return renderResident();
}

/* ------------------ Pickups data ops ------------------ */
async function loadPickups() {
  let q = supabase.from('pickups').select('*').order('created_at', { ascending: false });
  if (state.profile?.role === 'resident') q = q.eq('user_id', state.user.id);
  const { data, error } = await q;
  if (error) { console.error(error); state.pickups = []; return; }
  state.pickups = data || [];
}

async function createPickup({ name, type, scheduled_at, lat=null, lng=null }) {
  if (!state.user) { openAuthModal(); return; }
  const payload = { name, type, scheduled_at: scheduled_at ? new Date(scheduled_at).toISOString() : new Date().toISOString(), status: 'Scheduled', user_id: state.user.id, lat, lng };
  const { error } = await supabase.from('pickups').insert([payload]);
  if (error) return alert('Error creating pickup: ' + error.message);
  await loadPickups();
  renderResident();
}
async function markCollected(id) {
  const { error } = await supabase.from('pickups').update({ status: 'Collected' }).eq('id', id);
  if (error) return alert('Error: ' + error.message);
  await loadPickups();
  routeAfterLogin();
}
async function deletePickup(id) {
  if (!confirm('Delete pickup?')) return;
  const { error } = await supabase.from('pickups').delete().eq('id', id);
  if (error) return alert('Error: ' + error.message);
  await loadPickups();
  routeAfterLogin();
}

/* ------------------ UI: pickup form + attach ------------------ */
function pickupFormHTML() {
  return `
    <label>House / Business name</label><input id="pf-name" class="input" placeholder="House 12 or Shop A" />
    <label>Type</label>
    <select id="pf-type" class="input"><option>Regular</option><option>Recyclables</option><option>Bulk</option><option>E-waste</option></select>
    <label>When</label><input id="pf-date" class="input" type="datetime-local" />
    <label>Location (optional)</label>
    <div style="display:flex;gap:8px;align-items:center">
      <input id="pf-loc" class="input" placeholder="Click Pick on map to set coordinates" />
      <button class="btn small ghost" id="pickOnMapBtn" type="button">Pick on map</button>
    </div>
    <div style="display:flex;gap:8px;margin-top:8px">
      <button class="btn" id="pf-submit">Request</button>
      <button class="btn small ghost" id="pf-clear">Clear</button>
    </div>
  `;
}

function attachPickupForm() {
  const submit = document.getElementById('pf-submit');
  const clear = document.getElementById('pf-clear');
  const pickBtn = document.getElementById('pickOnMapBtn');
  if (!submit) return;
  submit.onclick = async () => {
    const name = document.getElementById('pf-name').value || 'Demo Household';
    const type = document.getElementById('pf-type').value;
    const date = document.getElementById('pf-date').value || new Date().toISOString();
    const locStr = document.getElementById('pf-loc').value || '';
    let lat = null, lng = null;
    if (state.currentPickupLocation) { lat = state.currentPickupLocation.lat; lng = state.currentPickupLocation.lng; }
    else if (locStr.includes(',')) { const parts = locStr.split(',').map(s => s.trim()); lat = parseFloat(parts[0]) || null; lng = parseFloat(parts[1]) || null; }
    await createPickup({ name, type, scheduled_at: date, lat, lng });
    state.currentPickupLocation = null;
  };
  clear.onclick = () => {
    document.getElementById('pf-name').value = '';
    document.getElementById('pf-date').value = '';
    document.getElementById('pf-type').value = 'Regular';
    document.getElementById('pf-loc').value = '';
    state.currentPickupLocation = null;
  };
  pickBtn.onclick = openMapModalForPickup;
}

/* ------------------ Resident, Collector, Admin renderers ------------------ */
async function renderResident() {
  await loadPickups();
  updateAuthArea();
  app.innerHTML = `
    <section class="card">
      <div class="header-row"><div><h2>Resident Portal</h2><div style="color:var(--muted)">Request pickups & pay</div></div></div>
      <div class="grid cols-2">
        <div>
          <div class="card"><h4 style="margin-top:0">Request pickup</h4>${pickupFormHTML()}</div>
          <div style="margin-top:14px" class="card"><h4 style="margin-top:0">Your requests</h4><div id="resident-list"></div></div>
        </div>
        <div>
          <div class="card"><h4>Tips to recycle</h4><ul style="color:var(--muted);line-height:1.6"><li>Rinse & sort plastics</li><li>Keep e-waste separate</li><li>Compost food waste</li></ul></div>
          <div class="card" style="margin-top:12px"><h4>IntaSend payment</h4><p style="color:var(--muted)">Demo: opens IntaSend sandbox. Replace with your backend checkout when ready.</p><label>Amount (KES)</label><input id="intasend-amount" class="input" placeholder="e.g. 50" /><div style="display:flex;gap:8px;margin-top:8px"><button id="payBtn" class="btn">Pay (IntaSend)</button></div></div>
        </div>
      </div>
    </section>
  `;
  attachPickupForm();
  renderResidentList();
  document.getElementById('payBtn').onclick = () => {
    const amt = document.getElementById('intasend-amount').value || '50';
    const ref = 'trashhub-demo-' + Date.now();
    window.open(`https://sandbox.intasend.com/pay?amount=${encodeURIComponent(amt)}&reference=${encodeURIComponent(ref)}`, '_blank');
  };
}

function renderResidentList() {
  const out = document.getElementById('resident-list');
  if (!out) return;
  if (!state.pickups.length) { out.innerHTML = `<div style="color:var(--muted)">No requests yet.</div>`; return; }
  out.innerHTML = state.pickups.map(p => `
    <div class="request-item">
      <div>
        <div style="font-weight:600">${escapeHtml(p.name)}</div>
        <div style="font-size:13px;color:#6b7280">${escapeHtml(p.type)} • ${new Date(p.scheduled_at || p.created_at).toLocaleString()}</div>
        ${p.lat && p.lng ? `<div style="font-size:12px;color:#4b5563">Coords: ${p.lat.toFixed(5)}, ${p.lng.toFixed(5)}</div>` : ''}
      </div>
      <div style="display:flex;gap:8px;align-items:center"><div class="badge ${p.status === 'Collected' ? 'collected' : 'scheduled'}">${p.status}</div></div>
    </div>
  `).join('');
}

async function renderCollector() {
  await loadPickups();
  updateAuthArea();
  app.innerHTML = `<section class="card"><div class="header-row"><h2>Collector App</h2><div style="color:var(--muted)">View & mark pickups</div></div><div id="collector-list"></div></section>`;
  const out = document.getElementById('collector-list');
  if (!state.pickups.length) { out.innerHTML = `<div style="color:var(--muted)">No pickups.</div>`; return; }
  out.innerHTML = state.pickups.map(p => `
    <div class="request-item">
      <div>
        <div style="font-weight:600">${escapeHtml(p.name)}</div>
        <div style="font-size:13px;color:#6b7280">${escapeHtml(p.type)} • ${new Date(p.scheduled_at || p.created_at).toLocaleString()}</div>
      </div>
      <div style="display:flex;gap:8px;align-items:center"><div class="badge ${p.status === 'Collected' ? 'collected' : 'scheduled'}">${p.status}</div>${p.status !== 'Collected' ? `<button class="btn small" onclick="markCollected(${p.id})">Mark Collected</button>` : ''}</div>
    </div>
  `).join('');
}

async function renderAdmin() {
  await loadPickups();
  updateAuthArea();
  const total = state.pickups.length;
  const collected = state.pickups.filter(p => p.status === 'Collected').length;
  const pending = total - collected;

  app.innerHTML = `
    <section class="card">
      <div class="header-row"><h2>Admin Dashboard</h2><div style="color:var(--muted)">Analytics & management</div></div>
      <div class="grid cols-3">
        <div class="card"><div style="font-size:13px;color:var(--muted)">Total requests</div><div style="font-size:22px;font-weight:700">${total}</div></div>
        <div class="card"><div style="font-size:13px;color:var(--muted)">Collected</div><div style="font-size:22px;font-weight:700">${collected}</div></div>
        <div class="card"><div style="font-size:13px;color:var(--muted)">Pending</div><div style="font-size:22px;font-weight:700">${pending}</div></div>
      </div>

      <div style="margin-top:16px" class="card">
        <h4 style="margin-top:0">Analytics</h4>
        <div class="charts">
          <div style="height:260px"><canvas id="statusChart"></canvas></div>
          <div style="height:260px"><canvas id="typeChart"></canvas></div>
        </div>
      </div>

      <div style="margin-top:16px" class="card"><h4 style="margin-top:0">Recent requests</h4><div id="admin-list"></div></div>
    </section>
  `;
  renderAdminList();
  renderAdminCharts();
}

function renderAdminList() {
  const out = document.getElementById('admin-list');
  if (!out) return;
  if (!state.pickups.length) { out.innerHTML = `<div style="color:var(--muted)">No pickups.</div>`; return; }
  out.innerHTML = state.pickups.map(p => `
    <div class="request-item">
      <div>
        <div style="font-weight:600">${escapeHtml(p.name)}</div>
        <div style="font-size:13px;color:#6b7280">${escapeHtml(p.type)} • ${new Date(p.scheduled_at || p.created_at).toLocaleString()}</div>
      </div>
      <div style="display:flex;gap:8px;align-items:center"><div class="badge ${p.status === 'Collected' ? 'collected' : 'scheduled'}">${p.status}</div><button class="btn small ghost" onclick="deletePickup(${p.id})">Delete</button></div>
    </div>
  `).join('');
}

function renderAdminCharts() {
  const statusCounts = state.pickups.reduce((acc, p) => { acc[p.status] = (acc[p.status]||0)+1; return acc; }, {});
  const typeCounts = state.pickups.reduce((acc, p) => { acc[p.type] = (acc[p.type]||0)+1; return acc; }, {});

  const sctx = document.getElementById('statusChart').getContext('2d');
  new Chart(sctx, { type: 'doughnut', data: { labels: Object.keys(statusCounts), datasets: [{ data: Object.values(statusCounts), backgroundColor: ['#f59e0b','#22c55e','#60a5fa','#ef4444'] }] }, options: { responsive:true, maintainAspectRatio:false } });

  const tctx = document.getElementById('typeChart').getContext('2d');
  new Chart(tctx, { type: 'bar', data: { labels: Object.keys(typeCounts), datasets: [{ label:'Requests', data:Object.values(typeCounts), backgroundColor:['#22c55e','#a3e635','#60a5fa','#f97316'] }] }, options:{responsive:true,maintainAspectRatio:false} });
}

/* ---------------- Map modal for picking coordinates ---------------- */
let map, mapMarker;
function openMapModalForPickup() {
  const modal = document.getElementById('mapModal');
  modal.classList.remove('hidden');

  if (!map && window.google?.maps) {
    const defaultCenter = { lat:-1.286389, lng:36.817223 }; // Nairobi
    map = new google.maps.Map(document.getElementById('map'), { center: defaultCenter, zoom: 12 });
    map.addListener('click', (e) => placeMarker(e.latLng));
  }

  if (state.currentPickupLocation && map) {
    const pos = new google.maps.LatLng(state.currentPickupLocation.lat, state.currentPickupLocation.lng);
    placeMarker(pos);
    map.setCenter(pos);
    map.setZoom(14);
  }

  document.getElementById('closeMapModal').onclick = () => modal.classList.add('hidden');
  document.getElementById('confirmMap').onclick = () => {
    if (mapMarker) {
      const pos = mapMarker.getPosition();
      state.currentPickupLocation = { lat: pos.lat(), lng: pos.lng() };
      const pf = document.getElementById('pf-loc');
      if (pf) pf.value = `${state.currentPickupLocation.lat.toFixed(5)}, ${state.currentPickupLocation.lng.toFixed(5)}`;
    }
    modal.classList.add('hidden');
  };
}

function placeMarker(latLng) {
  if (mapMarker) mapMarker.setPosition(latLng);
  else mapMarker = new google.maps.Marker({ position: latLng, map });
}

/* ---------------- Helpers ---------------- */
function escapeHtml(str){ if (!str) return ''; return String(str).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;'); }

/* ---------------- Init ---------------- */
(async function init(){
  // wire header buttons
  document.getElementById('nav-home').addEventListener('click', renderHome);
  document.getElementById('nav-about').addEventListener('click', () => alert('TrashHub — demo for degree project'));
  document.getElementById('nav-contact').addEventListener('click', () => alert('Contact: you@domain'));

  // ensure functions referenced in inline markup exist on window
  window.markCollected = markCollected;
  window.deletePickup = deletePickup;
  window.openMapModalForPickup = openMapModalForPickup;

  // load user and render home
  await loadCurrentUser();
  renderHome();

  // close modal when clicking outside content
  document.querySelectorAll('.modal').forEach(m => {
    m.addEventListener('click', (e) => { if (e.target === m) m.classList.add('hidden'); });
  });

  // ensure clicking quick-request's Request opens auth if not logged in
  document.addEventListener('click', (e) => {
    if (e.target && e.target.id === 'pf-submit' && !state.user) {
      openAuthModal();
    }
  });
})();
