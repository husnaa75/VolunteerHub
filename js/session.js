document.addEventListener('DOMContentLoaded', () => {
  const path = window.location.pathname.split('/').pop();
  const requiredRole = {
    'admin-dashboard.html': 'admin',
    'management_acc.html': 'admin',
    'ngo-dashboard.html': 'ngo',
    'myvolunteer.html': 'ngo',
    'volunteer-dashboard.html': 'volunteer'
  }[path];
  let session = null;
  try { session = JSON.parse(localStorage.getItem('volunteerhub_session') || 'null'); } catch {}
  if (requiredRole && (!session || session.role !== requiredRole)) {
    window.location.replace('login.html');
    return;
  }
  if (requiredRole === 'ngo') {
    let users = [];
    try { users = JSON.parse(localStorage.getItem('volunteerhub_users') || '[]'); } catch {}
    const account = users.find(user => user.email?.toLowerCase() === session.email?.toLowerCase());
    if (!account || account.status !== 'verified') {
      localStorage.removeItem('volunteerhub_session');
      window.location.replace('login.html');
      return;
    }
  }
  document.querySelectorAll('.logout-btn, .logout-link, [data-logout]').forEach(control => {
    control.addEventListener('click', event => {
      event.preventDefault();
      localStorage.removeItem('volunteerhub_session');
      window.location.href = 'login.html';
    });
  });
  document.querySelectorAll('[data-user-name]').forEach(el => { if (session?.name) el.textContent = session.name; });
});
