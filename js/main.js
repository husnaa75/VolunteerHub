document.addEventListener('DOMContentLoaded', () => {
  const toggle = document.getElementById('navToggle');
  const nav = document.querySelector('.nav-container');
  if (toggle && nav) toggle.addEventListener('change', () => nav.classList.toggle('mobile-menu-enabled', toggle.checked));

  const read = key => {
    try { const value = JSON.parse(localStorage.getItem(key) || '[]'); return Array.isArray(value) ? value : []; }
    catch { return []; }
  };
  const users = read('volunteerhub_users');
  const programs = read('volunteerhub_ngo_programs').filter(program => program && program.status === 'active');
  const registrations = read('volunteerhub_registrations');
  const totals = {
    volunteers: users.filter(user => user.role === 'volunteer' && user.status !== 'inactive').length,
    ngos: users.filter(user => user.role === 'ngo' && user.status === 'verified').length,
    programs: programs.length,
    registrations: registrations.length
  };
  document.querySelectorAll('[data-home-stat]').forEach(element => {
    const value = totals[element.dataset.homeStat];
    if (value !== undefined) element.textContent = value.toLocaleString();
  });
});
