document.addEventListener('DOMContentLoaded', () => {
  const USERS_KEY = 'volunteerhub_users';
  const readUsers = () => { try { const value = JSON.parse(localStorage.getItem(USERS_KEY) || '[]'); return Array.isArray(value) ? value : []; } catch { return []; } };
  const writeUsers = users => localStorage.setItem(USERS_KEY, JSON.stringify(users));
  // Account Management must show one account per email address. Normalize case
  // and surrounding spaces so entries such as User@email.com and user@email.com
  // are treated as the same account.
  function getUniqueUsers(users) {
    const byEmail = new Map();
    users.forEach((user, index) => {
      const emailKey = String(user.email || '').trim().toLowerCase();
      if (!emailKey) {
        byEmail.set(`__missing_email_${index}`, user);
        return;
      }
      const existing = byEmail.get(emailKey);
      if (!existing) {
        byEmail.set(emailKey, { ...user, email: emailKey });
        return;
      }
      // Keep the newest account record, while retaining any useful fields
      // that are only present on the older duplicate.
      const oldTime = new Date(existing.registeredAt || 0).getTime() || 0;
      const newTime = new Date(user.registeredAt || 0).getTime() || 0;
      const preferred = newTime >= oldTime ? { ...user } : { ...existing };
      const secondary = newTime >= oldTime ? existing : user;
      Object.entries(secondary).forEach(([key, value]) => {
        if (preferred[key] === undefined || preferred[key] === null || preferred[key] === '') {
          preferred[key] = value;
        }
      });
      preferred.email = emailKey;
      byEmail.set(emailKey, preferred);
    });
    return [...byEmail.values()];
  }
  function getAccountUsers() {
    const storedUsers = readUsers();
    const uniqueUsers = getUniqueUsers(storedUsers);
    if (uniqueUsers.length !== storedUsers.length) writeUsers(uniqueUsers);
    return uniqueUsers;
  }
  const dateLabel = value => { const d = value ? new Date(value) : null; return d && !Number.isNaN(d.getTime()) ? d.toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'}) : '—'; };
  const safe = value => String(value || '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const ngoBody = document.querySelector('#ngoTable tbody');
  const volBody = document.querySelector('#volunteerTable tbody');
  const tabs = document.querySelectorAll('[data-tab]');
  tabs.forEach(button => button.addEventListener('click', () => {
    tabs.forEach(tab => tab.classList.toggle('active', tab === button));
    document.querySelectorAll('.tab-content').forEach(panel => panel.classList.toggle('active', panel.id === button.dataset.tab));
  }));
  window.updateAccountStatus = (email, status) => {
    const users = getAccountUsers(); const user = users.find(u => u.email?.trim().toLowerCase() === String(email).trim().toLowerCase());
    if (!user || user.role !== 'ngo') return;
    user.status = status; writeUsers(users); render();
  };
  window.viewAccount = email => {
    const user = getAccountUsers().find(u => u.email?.trim().toLowerCase() === String(email).trim().toLowerCase());
    if (!user) return;
    alert(`Name: ${user.name}\nEmail: ${user.email}\nContact: ${user.contact || '—'}\nCountry: ${user.country || '—'}\nState / Region: ${user.state || '—'}\nDate of Birth: ${user.dateOfBirth || '—'}\nGender: ${user.gender || '—'}\nRegistration No.: ${user.ssm || '—'}\nStatus: ${user.status || 'active'}`);
  };
  window.editAccount = email => {
    const users = getAccountUsers(); const user = users.find(u => u.email?.trim().toLowerCase() === String(email).trim().toLowerCase());
    if (!user) return;
    const name = prompt('Edit account name:', user.name || ''); if (name === null) return;
    const contact = prompt('Edit contact number:', user.contact || ''); if (contact === null) return;
    const newEmail = prompt('Edit email address:', user.email || ''); if (newEmail === null) return;
    const cleanEmail = newEmail.trim().toLowerCase();
    if (!name.trim() || !cleanEmail) { alert('Name and email cannot be empty.'); return; }
    if (users.some(u => u !== user && u.email?.toLowerCase() === cleanEmail)) { alert('This email address is already used by another account.'); return; }
    const oldEmail = user.email.toLowerCase();
    user.name = name.trim(); user.contact = contact.trim(); user.email = cleanEmail;
    if (user.role === 'ngo') {
      user.organisation = user.name;
      const programs = (() => { try { return JSON.parse(localStorage.getItem('volunteerhub_ngo_programs') || '[]'); } catch { return []; } })();
      programs.forEach(program => { if (program.ownerEmail?.toLowerCase() === oldEmail) { program.ownerEmail = cleanEmail; program.organisation = user.name; } });
      localStorage.setItem('volunteerhub_ngo_programs', JSON.stringify(programs));
      const registrations = (() => { try { return JSON.parse(localStorage.getItem('volunteerhub_registrations') || '[]'); } catch { return []; } })();
      registrations.forEach(registration => { if (registration.organisationEmail?.toLowerCase() === oldEmail) { registration.organisationEmail = cleanEmail; registration.organisation = user.name; } });
      localStorage.setItem('volunteerhub_registrations', JSON.stringify(registrations));
    }
    const activeSession = (() => { try { return JSON.parse(localStorage.getItem('volunteerhub_session') || 'null'); } catch { return null; } })();
    if (activeSession?.email?.toLowerCase() === oldEmail) { activeSession.email = cleanEmail; activeSession.name = user.name; activeSession.organisation = user.organisation || ''; localStorage.setItem('volunteerhub_session', JSON.stringify(activeSession)); }
    writeUsers(users); render();
  };
  window.deleteAccount = email => {
    const users = getAccountUsers(); const user = users.find(u => u.email?.trim().toLowerCase() === String(email).trim().toLowerCase());
    if (!user) return;
    if (!confirm(`Delete the ${user.role} account for ${user.name} (${user.email})?`)) return;
    writeUsers(users.filter(u => u !== user));
    if (user.demoAccount && user.demoKey) {
      const deletedUsers = (() => { try { return JSON.parse(localStorage.getItem('volunteerhub_deleted_demo_users') || '[]'); } catch { return []; } })();
      if (!deletedUsers.includes(user.demoKey)) deletedUsers.push(user.demoKey);
      localStorage.setItem('volunteerhub_deleted_demo_users', JSON.stringify(deletedUsers));
    }
    const registrations = (() => { try { return JSON.parse(localStorage.getItem('volunteerhub_registrations') || '[]'); } catch { return []; } })();
    if (user.role === 'ngo') {
      const programs = (() => { try { return JSON.parse(localStorage.getItem('volunteerhub_ngo_programs') || '[]'); } catch { return []; } })();
      const ownedPrograms = programs.filter(p => p.ownerEmail?.toLowerCase() === user.email.toLowerCase());
      const ownedIds = new Set(ownedPrograms.map(p => String(p.id)));
      const deletedPrograms = (() => { try { return JSON.parse(localStorage.getItem('volunteerhub_deleted_demo_programs') || '[]'); } catch { return []; } })();
      ownedPrograms.filter(program => program.demoData).forEach(program => {
        if (!deletedPrograms.includes(program.id)) deletedPrograms.push(program.id);
      });
      localStorage.setItem('volunteerhub_deleted_demo_programs', JSON.stringify(deletedPrograms));
      localStorage.setItem('volunteerhub_ngo_programs', JSON.stringify(programs.filter(p => !ownedIds.has(String(p.id)))));
      localStorage.setItem('volunteerhub_registrations', JSON.stringify(registrations.filter(r => !ownedIds.has(String(r.programId)))));
    } else if (user.role === 'volunteer') {
      localStorage.setItem('volunteerhub_registrations', JSON.stringify(registrations.filter(r => r.volunteerEmail?.toLowerCase() !== user.email.toLowerCase())));
    }
    const session = (() => { try { return JSON.parse(localStorage.getItem('volunteerhub_session') || 'null'); } catch { return null; } })();
    if (session?.email?.toLowerCase() === user.email.toLowerCase()) localStorage.removeItem('volunteerhub_session');
    render();
  };
  function renderRows(body, users, type) {
    if (!body) return;
    body.innerHTML = '';
    users.forEach(user => {
      const status = type === 'ngo' ? (user.status || 'pending') : (user.status || 'active');
      const tr = document.createElement('tr'); tr.dataset.status = status;
      const initials = safe((user.name || '?').trim().charAt(0).toUpperCase());
      const date = dateLabel(user.registeredAt);
      const actions = type === 'ngo'
        ? `<div class="action-group"><button class="action-btn approve-btn" data-action="verified">Approve</button><button class="action-btn reject-btn" data-action="rejected">Reject</button><button class="action-btn view-btn" data-edit>Edit</button><button class="action-btn reject-btn" data-delete>Delete</button></div>`
        : `<div class="action-group"><button class="action-btn view-btn" data-view>View</button><button class="action-btn view-btn" data-edit>Edit</button><button class="action-btn reject-btn" data-delete>Delete</button></div>`;
      tr.innerHTML = `<td><div class="account-cell"><div class="account-avatar">${initials}</div><div><strong>${safe(user.name)}</strong><span>${type === 'ngo' ? 'NGO Organisation' : 'Volunteer Account'}</span></div></div></td><td>${safe(user.email)}</td><td>${date}</td><td><span class="status ${safe(status)}">${status === 'verified' ? 'Verified' : status[0].toUpperCase()+status.slice(1)}</span></td><td>${actions}</td>`;
      tr.querySelectorAll('[data-action]').forEach(btn => btn.addEventListener('click', () => window.updateAccountStatus(user.email, btn.dataset.action)));
      tr.querySelector('[data-view]')?.addEventListener('click', () => window.viewAccount(user.email));
      tr.querySelector('[data-edit]')?.addEventListener('click', () => window.editAccount(user.email));
      tr.querySelector('[data-delete]')?.addEventListener('click', () => window.deleteAccount(user.email));
      body.appendChild(tr);
    });
  }
  function filterTable(tableId, searchId, statusId, emptyId) {
    const table = document.getElementById(tableId), term = (document.getElementById(searchId)?.value || '').toLowerCase();
    const status = (document.getElementById(statusId)?.value || 'all').toLowerCase(); let shown = 0;
    table?.querySelectorAll('tbody tr').forEach(row => { const visible = row.textContent.toLowerCase().includes(term) && (status === 'all' || row.dataset.status === status); row.hidden = !visible; if (visible) shown++; });
    const empty = document.getElementById(emptyId); if (empty) empty.hidden = shown !== 0;
  }
  function render() {
    const users = getAccountUsers().filter(u => u.email?.trim().toLowerCase() !== 'admin@volunhub.com');
    const ngos = users.filter(u => u.role === 'ngo'), volunteers = users.filter(u => u.role === 'volunteer');
    renderRows(ngoBody, ngos, 'ngo'); renderRows(volBody, volunteers, 'volunteer');
    const setText = (selector, value) => document.querySelectorAll(selector).forEach(el => el.textContent = value);
    setText('.summary-grid .summary-card:nth-child(1) h2', ngos.length);
    setText('.summary-grid .summary-card:nth-child(2) h2', ngos.filter(u => u.status === 'verified').length);
    setText('.summary-grid .summary-card:nth-child(3) h2', ngos.filter(u => (u.status || 'pending') === 'pending').length);
    setText('.summary-grid .summary-card:nth-child(4) h2', volunteers.length);
    setText('.tab-btn[data-tab="ngo"] .tab-count', ngos.length); setText('.tab-btn[data-tab="volunteer"] .tab-count', volunteers.length);
    const ngoTotal = document.querySelector('#ngo .total-label'); if (ngoTotal) ngoTotal.textContent = `${ngos.length} Organisations`;
    const volTotal = document.querySelector('#volunteer .total-label'); if (volTotal) volTotal.textContent = `${volunteers.length} Volunteers`;
    filterTable('ngoTable','ngoSearch','ngoStatusFilter','ngoEmpty'); filterTable('volunteerTable','volunteerSearch','volunteerStatusFilter','volunteerEmpty');
  }
  [['ngoTable','ngoSearch','ngoStatusFilter','ngoEmpty'],['volunteerTable','volunteerSearch','volunteerStatusFilter','volunteerEmpty']].forEach(([t,s,f,e]) => { document.getElementById(s)?.addEventListener('input',()=>filterTable(t,s,f,e)); document.getElementById(f)?.addEventListener('change',()=>filterTable(t,s,f,e)); });
  render();
});
