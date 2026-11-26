document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('programForm');
  const grid = document.getElementById('ngoProgramGrid');
  const getSession = () => { try { return JSON.parse(localStorage.getItem('volunteerhub_session') || 'null'); } catch { return null; } };
  const session = getSession();
  const accountList = (() => { try { return JSON.parse(localStorage.getItem('volunteerhub_users') || '[]'); } catch { return []; } })();
  const account = accountList.find(user => user.email?.toLowerCase() === session?.email?.toLowerCase());
  const organisationName = account?.organisation || account?.name || session?.organisation || session?.name || 'My Organisation';
  document.querySelectorAll('[data-org-name]').forEach(el => el.textContent = organisationName);
  document.querySelectorAll('[data-org-email]').forEach(el => el.textContent = account?.email || session?.email || '');
  document.querySelectorAll('[data-org-contact]').forEach(el => el.textContent = account?.contact || 'Not provided');
  document.querySelectorAll('[data-org-type]').forEach(el => el.textContent = account?.organisationType || 'NGO Account');
  document.querySelectorAll('[data-org-ssm]').forEach(el => el.textContent = account?.ssm || 'Not provided');
  document.querySelectorAll('[data-org-state]').forEach(el => el.textContent = account?.state ? `${account.state}${account.country ? ', ' + account.country : ''}` : 'Not provided');
  document.querySelectorAll('[data-org-address]').forEach(el => el.textContent = account?.address || 'Not provided');
  document.querySelectorAll('[data-org-about]').forEach(el => el.textContent = account?.about || 'Not provided');
  document.querySelectorAll('[data-org-initials]').forEach(el => el.textContent = organisationName.split(/\s+/).slice(0,2).map(word => word[0]).join('').toUpperCase());
  if (!form || !grid) return;

  const KEY = 'volunteerhub_ngo_programs';
  const read = () => { try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch { return []; } };
  const write = data => localStorage.setItem(KEY, JSON.stringify(data));
  const email = (session?.email || '').toLowerCase();
  const name = organisationName;
  const field = id => document.getElementById(id);
  const editing = field('editingProgramId');
  const imageInput = field('programImage');
  const saveButton = field('saveProgramBtn');
  const cancelButton = field('cancelEditBtn');

  function ownedPrograms() {
    return read().filter(p => p.ownerEmail?.toLowerCase() === email && p.status !== 'deleted');
  }
  function dateLabel(value) {
    if (!value) return 'Date to be announced';
    const date = new Date(value + 'T00:00:00');
    return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString('en-MY', { day: 'numeric', month: 'long', year: 'numeric' });
  }
  function render() {
    const programs = ownedPrograms();
    grid.innerHTML = '';
    if (!programs.length) {
      const empty = document.createElement('p');
      empty.className = 'empty-message';
      empty.textContent = 'You have not created any programs yet. Use “Create a new program” to get started.';
      grid.appendChild(empty);
    }
    programs.forEach(program => {
      const card = document.createElement('article');
      card.className = 'program-card';
      const imageWrap = document.createElement('div'); imageWrap.className = 'program-image';
      const img = document.createElement('img'); img.src = program.image || 'image/cover.png'; img.alt = program.name;
      img.style.width = '100%'; img.style.height = '180px'; img.style.objectFit = 'cover';
      imageWrap.appendChild(img);
      const content = document.createElement('div'); content.className = 'program-content';
      const title = document.createElement('h3'); title.textContent = program.name;
      const meta = document.createElement('p'); meta.textContent = `${program.category} · ${dateLabel(program.date)} · ${program.location}`;
      const desc = document.createElement('p'); desc.textContent = program.description;
      const actions = document.createElement('div'); actions.className = 'program-actions';
      const edit = document.createElement('button'); edit.type = 'button'; edit.className = 'outline-btn'; edit.textContent = 'Edit';
      edit.addEventListener('click', () => startEdit(program));
      const del = document.createElement('button'); del.type = 'button'; del.className = 'outline-btn'; del.textContent = 'Delete';
      del.addEventListener('click', () => {
        if (!confirm(`Delete "${program.name}"?`)) return;
        const remaining = read().filter(p => String(p.id) !== String(program.id));
        write(remaining);
        const registrations = (() => { try { return JSON.parse(localStorage.getItem('volunteerhub_registrations') || '[]'); } catch { return []; } })();
        localStorage.setItem('volunteerhub_registrations', JSON.stringify(registrations.filter(r => String(r.programId) !== String(program.id))));
        if (program.demoData) {
          const deleted = (() => { try { return JSON.parse(localStorage.getItem('volunteerhub_deleted_demo_programs') || '[]'); } catch { return []; } })();
          if (!deleted.includes(program.id)) {
            deleted.push(program.id);
            localStorage.setItem('volunteerhub_deleted_demo_programs', JSON.stringify(deleted));
          }
        }
        render();
      });
      actions.append(edit, del); content.append(title, meta, desc, actions); card.append(imageWrap, content); grid.appendChild(card);
    });
    const stats = document.querySelectorAll('.stats-grid .stat-card h2');
    if (stats[0]) stats[0].textContent = programs.filter(p => p.status === 'active').length;
    const regs = (() => { try { return JSON.parse(localStorage.getItem('volunteerhub_registrations') || '[]'); } catch { return []; } })()
      .filter(r => r.organisationEmail?.toLowerCase() === email);
    if (stats[1]) stats[1].textContent = new Set(regs.map(r => r.volunteerEmail)).size;
    if (stats[2]) stats[2].textContent = regs.filter(r => r.status === 'Pending').length;
    if (stats[3]) stats[3].textContent = programs.filter(p => p.status === 'completed').length;
  }
  function startEdit(program) {
    editing.value = program.id;
    field('programName').value = program.name;
    field('programCategory').value = program.category;
    field('programDate').value = program.date;
    field('programLocation').value = program.location;
    field('programDescription').value = program.description;
    imageInput.required = false;
    saveButton.textContent = 'Update Program';
    cancelButton.hidden = false;
    document.getElementById('add-program')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  function resetForm() {
    form.reset(); editing.value = ''; imageInput.required = true;
    saveButton.textContent = 'Save Program'; cancelButton.hidden = true;
  }
  cancelButton?.addEventListener('click', resetForm);
  form.addEventListener('submit', event => {
    event.preventDefault();
    const id = editing.value;
    const existing = id ? read().find(p => String(p.id) === String(id)) : null;
    const file = imageInput.files?.[0];
    const save = imageData => {
      const data = read();
      const program = {
        id: existing?.id || `PRG-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        name: field('programName').value.trim(),
        category: field('programCategory').value,
        date: field('programDate').value,
        location: field('programLocation').value.trim(),
        description: field('programDescription').value.trim(),
        image: imageData || existing?.image || 'image/cover.png',
        organisation: name,
        ownerEmail: email,
        status: 'active',
        demoData: existing?.demoData || false,
        createdAt: existing?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      const index = data.findIndex(p => String(p.id) === String(program.id));
      if (index >= 0) data[index] = program; else data.push(program);
      write(data);
      // Keep every existing registration's displayed program details in sync with the latest edit.
      const registrations = (() => { try { return JSON.parse(localStorage.getItem('volunteerhub_registrations') || '[]'); } catch { return []; } })();
      const syncedRegistrations = registrations.map(r => String(r.programId) === String(program.id) ? { ...r, programName: program.name, category: program.category, location: program.location, date: program.date, organisation: program.organisation, organisationEmail: program.ownerEmail } : r);
      localStorage.setItem('volunteerhub_registrations', JSON.stringify(syncedRegistrations));
      resetForm(); render();
      alert(existing ? 'Program updated successfully.' : 'Program saved successfully. It is now available on the Program Page.');
    };
    if (file) {
      if (!file.type.startsWith('image/')) { alert('Please choose a valid image file.'); return; }
      const reader = new FileReader();
      reader.onload = () => save(reader.result);
      reader.onerror = () => alert('Unable to read the selected image. Please try again.');
      reader.readAsDataURL(file);
    } else save(existing?.image || '');
  });
  render();
});