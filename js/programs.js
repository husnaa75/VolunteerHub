(() => {
  const PROGRAMS_KEY = 'volunteerhub_ngo_programs';
  const REGISTRATIONS_KEY = 'volunteerhub_registrations';
  const SESSION_KEY = 'volunteerhub_session';
  const read = key => { try { return JSON.parse(localStorage.getItem(key) || '[]'); } catch { return []; } };
  const getPrograms = () => read(PROGRAMS_KEY).filter(p => p && p.status !== 'deleted');
  const formatDate = date => date ? new Date(`${date}T00:00:00`).toLocaleDateString('en-MY', {day:'numeric', month:'short', year:'numeric'}) : 'Date to be announced';

  function createCard(program, directory = false) {
    const card = document.createElement('article'); card.className = 'program-card';
    card.dataset.programId = String(program.id); card.dataset.category = program.category || 'Community'; card.dataset.location = program.location || '';
    const imageWrap = document.createElement('div'); imageWrap.className = 'program-image';
    const image = document.createElement('img'); image.src = program.image || 'image/cover.png'; image.alt = program.name || 'Volunteer program'; image.loading = 'lazy'; imageWrap.appendChild(image);
    if (directory) { const tag = document.createElement('span'); tag.className = 'category-tag'; tag.textContent = program.category || 'Community'; imageWrap.appendChild(tag); }
    const info = document.createElement('div'); info.className = 'program-info';
    const location = document.createElement('div'); location.className = 'program-location'; location.textContent = program.location || '';
    const title = document.createElement('h3'); title.textContent = program.name || 'Volunteer Program';
    const description = document.createElement('p'); description.textContent = program.description || '';
    const meta = document.createElement('div'); meta.className = 'program-meta';
    const date = document.createElement('span'); date.textContent = formatDate(program.date);
    const ngo = document.createElement('span'); ngo.textContent = program.organisation || 'VolunteerHub'; meta.append(date, ngo);
    if (directory) {
      const button = document.createElement('button'); button.type = 'button'; button.className = 'program-link'; button.textContent = 'Register Now';
      button.addEventListener('click', () => registerForProgram(program.id)); info.append(location, title, description, meta, button);
    } else {
      const link = document.createElement('a'); link.href = 'Programs.html'; link.className = 'program-link'; link.textContent = 'View Program';
      info.append(location, title, description, meta, link);
    }
    card.append(imageWrap, info); return card;
  }

  function registerForProgram(id) {
    const program = getPrograms().find(p => String(p.id) === String(id));
    if (!program) { alert('This program is no longer available.'); return; }
    let session = null; try { session = JSON.parse(localStorage.getItem(SESSION_KEY) || 'null'); } catch {}
    if (!session || session.role !== 'volunteer') {
      localStorage.setItem('volunteerhub_pending_program', String(id));
      alert(!session ? 'Please log in as a volunteer to register for this program.' : 'Only volunteer accounts can register for programs.');
      window.location.href = 'login.html'; return;
    }
    const registrations = read(REGISTRATIONS_KEY);
    const volunteerEmail = String(session.email || '').trim().toLowerCase();
    if (!volunteerEmail) { alert('Your volunteer account could not be identified. Please log in again.'); window.location.href = 'login.html'; return; }
    if (registrations.some(r => String(r.programId) === String(id) && String(r.volunteerEmail || '').trim().toLowerCase() === volunteerEmail)) {
      alert('You have already registered for this program. Check My Activities in your dashboard.'); return;
    }
    registrations.push({
      registrationId: `REG-${Date.now()}-${Math.random().toString(36).slice(2,8)}`,
      programId: program.id, programName: program.name, category: program.category, location: program.location,
      date: program.date, time: program.time || '', organisation: program.organisation, organisationEmail: program.ownerEmail || '',
      volunteerName: session.name, volunteerEmail, status: 'Pending', registeredAt: new Date().toISOString()
    });
    localStorage.setItem(REGISTRATIONS_KEY, JSON.stringify(registrations)); localStorage.removeItem('volunteerhub_pending_program');
    alert(`Registration successful! ${program.name} has been added to My Activities with Pending status.`);
    window.location.href = 'volunteer-dashboard.html';
  }

  function renderHome() {
    const grid = document.querySelector('.programs-section .program-grid'); if (!grid) return;
    let session = null; try { session = JSON.parse(localStorage.getItem(SESSION_KEY) || 'null'); } catch {}
    grid.replaceChildren();
    getPrograms().slice(0,3).forEach(p => grid.appendChild(createCard(p)));
    if (!grid.children.length) { const empty = document.createElement('p'); empty.className = 'empty-message'; empty.textContent = 'No programs available yet.'; grid.appendChild(empty); }
  }

  function renderDirectory() {
    const grid = document.getElementById('programGrid'); if (!grid) return;
    let session = null; try { session = JSON.parse(localStorage.getItem(SESSION_KEY) || 'null'); } catch {}
    const search = document.getElementById('searchInput'), category = document.getElementById('categoryFilter');
    const location = document.getElementById('locationFilter'), sort = document.getElementById('sortFilter');
    let chipCategory = 'all';
    function render() {
      const term = (search?.value || '').toLowerCase().trim(), cat = category?.value || 'all', loc = location?.value || 'all';
      let visible = getPrograms().filter(p => {
        const searchable = `${p.name || ''} ${p.description || ''} ${p.organisation || ''} ${p.location || ''} ${p.category || ''}`.toLowerCase();
        return searchable.includes(term) && (cat === 'all' || p.category === cat)
          && (loc === 'all' || String(p.location || '').toLowerCase().includes(loc.toLowerCase()))
          && (chipCategory === 'all' || p.category === chipCategory);
      });
      if (sort?.value === 'name') visible = visible.slice().sort((a,b) => (a.name || '').localeCompare(b.name || ''));
      grid.replaceChildren(); visible.forEach(p => grid.appendChild(createCard(p, true)));
      if (!visible.length) {
        const empty = document.createElement('div'); empty.className = 'empty-state';
        const heading = document.createElement('h3'); heading.textContent = getPrograms().length ? 'No programs found' : 'No programs available yet';
        const message = document.createElement('p'); message.textContent = getPrograms().length ? 'Try changing your search or filters.' : 'Programs created by verified NGOs will appear here.';
        empty.append(heading, message); grid.appendChild(empty);
      }
    }
    [search, category, location, sort].forEach(el => { el?.addEventListener('input', render); el?.addEventListener('change', render); });
    document.querySelectorAll('.category-chip').forEach(chip => chip.addEventListener('click', () => {
      chipCategory = chip.dataset.category || 'all';
      document.querySelectorAll('.category-chip').forEach(item => item.classList.toggle('active', item === chip));
      if (category) category.value = chipCategory; render();
    }));
    render();
    const intended = new URLSearchParams(window.location.search).get('register');
    if (intended) { window.history.replaceState({}, '', 'Programs.html'); registerForProgram(intended); }
  }

  document.addEventListener('DOMContentLoaded', () => { renderHome(); renderDirectory(); });
  window.addEventListener('storage', event => { if (event.key === PROGRAMS_KEY) window.location.reload(); });
})();
