document.addEventListener('DOMContentLoaded', () => {
  const list = document.getElementById('activityList');
  if (!list) return;
  const search = document.getElementById('activitySearch');
  const category = document.getElementById('activityCategory');
  const empty = document.getElementById('emptyActivities');
  let session = null;
  try { session = JSON.parse(localStorage.getItem('volunteerhub_session') || 'null'); } catch {}
  const read = key => { try { return JSON.parse(localStorage.getItem(key) || '[]'); } catch { return []; } };
  const currentVolunteerEmail = String(session?.email || '').trim().toLowerCase();
  const registrations = read('volunteerhub_registrations').filter(r => String(r.volunteerEmail || '').trim().toLowerCase() === currentVolunteerEmail);
  const dateParts = value => {
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? null : { month: d.toLocaleString('en', {month:'short'}).toUpperCase(), day: String(d.getDate()).padStart(2,'0'), year: d.getFullYear() };
  };
  function render() {
    const term = (search?.value || '').toLowerCase().trim(), selected = category?.value || 'all';
    list.innerHTML = '';
    const visible = registrations.filter(r => `${r.programName} ${r.organisation} ${r.location} ${r.status}`.toLowerCase().includes(term) && (selected === 'all' || r.category === selected));
    visible.forEach(r => {
      const date = dateParts(r.registeredAt) || {month:'NEW',day:'—',year:''};
      const item = document.createElement('article'); item.className = 'activity-item'; item.dataset.status = r.status.toLowerCase(); item.dataset.category = r.category;
      item.innerHTML = `<div class="activity-date"><span>${date.month}</span><strong>${date.day}</strong><small>${date.year}</small></div><div class="activity-details"><span class="category-label"></span><h3></h3><p class="organisation-name"></p><div class="activity-meta"><span class="activity-location"></span><span class="activity-time"></span></div></div><div class="activity-status-area"><span class="status-badge"></span><small></small></div>`;
      item.querySelector('.category-label').textContent = r.category || 'Community';
      item.querySelector('h3').textContent = r.programName;
      item.querySelector('.organisation-name').textContent = r.organisation;
      item.querySelector('.activity-location').textContent = `⌖ ${r.location || ''}`;
      item.querySelector('.activity-time').textContent = `◷ ${r.date || ''}${r.time ? ' · ' + r.time : ''}`;
      const badge = item.querySelector('.status-badge'); badge.textContent = r.status; badge.classList.add(String(r.status).toLowerCase());
      item.querySelector('.activity-status-area small').textContent = r.status === 'Pending' ? 'Waiting for NGO approval' : r.status === 'Approved' ? 'Your registration is approved' : 'Your registration was rejected';
      list.appendChild(item);
    });
    if (empty) empty.hidden = visible.length > 0;
    const count = id => { const el = document.getElementById(id); if (el) el.textContent = registrations.filter(r => r.status === (id === 'pendingCount' ? 'Pending' : 'Approved')).length; };
    const total = document.getElementById('totalRegistered'); if (total) total.textContent = registrations.length;
    count('pendingCount'); count('approvedCount');
    const hours = document.getElementById('volunteerHours'); if (hours) hours.textContent = '0';
    document.querySelectorAll('.welcome-content h2').forEach(el => { if (session?.name) el.textContent = `Welcome back, ${session.name}!`; });
  }
  function renderUpcoming() {
    const host = document.querySelector('.upcoming-grid'); if (!host) return;
    const programs = read('volunteerhub_ngo_programs').filter(p => p.status === 'active');
    host.innerHTML = '';
    if (!programs.length) {
      const message = document.createElement('p');
      message.className = 'empty-message';
      message.textContent = 'There are no available programs at the moment.';
      host.appendChild(message);
      return;
    }
    programs.slice(0, 3).forEach(p => {
      const card = document.createElement('article'); card.className = 'upcoming-card';
      const image = document.createElement('div'); image.className = 'program-image';
      const img = document.createElement('img'); img.src = p.image || 'image/cover.png'; img.alt = p.name; image.appendChild(img);
      const content = document.createElement('div'); content.className = 'upcoming-content';
      const title = document.createElement('h3'); title.textContent = p.name;
      const ngo = document.createElement('p'); ngo.textContent = p.organisation;
      const meta = document.createElement('div'); meta.className = 'upcoming-meta';
      const date = document.createElement('span'); date.textContent = p.date ? new Date(p.date + 'T00:00:00').toLocaleDateString('en-MY', {day:'numeric', month:'long', year:'numeric'}) : 'Date to be announced';
      const loc = document.createElement('span'); loc.textContent = p.location || '';
      meta.append(date, loc); content.append(title, ngo, meta);
      const link = document.createElement('a'); link.href = 'Programs.html'; link.className = 'program-link'; link.textContent = 'View Program';
      content.appendChild(link); card.append(image, content); host.appendChild(card);
    });
  }
  search?.addEventListener('input', render); category?.addEventListener('change', render);
  render(); renderUpcoming();
});