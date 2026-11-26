document.addEventListener('DOMContentLoaded', () => {
  const date = document.getElementById('currentDate');
  if (date) date.textContent = new Intl.DateTimeFormat(undefined, { dateStyle: 'full' }).format(new Date());
  const read = key => {
    try { const value = JSON.parse(localStorage.getItem(key) || '[]'); return Array.isArray(value) ? value : []; }
    catch { return []; }
  };
  const users = read('volunteerhub_users').filter(user => user.email?.toLowerCase() !== 'admin@volunhub.com');
  const volunteers = users.filter(user => user.role === 'volunteer');
  const ngos = users.filter(user => user.role === 'ngo');
  const programs = read('volunteerhub_ngo_programs').filter(program => program && program.status !== 'deleted');
  const registrations = read('volunteerhub_registrations');
  const pending = ngos.filter(ngo => (ngo.status || 'pending') === 'pending').length;
  const verified = ngos.filter(ngo => ngo.status === 'verified').length;
  const values = [volunteers.length, ngos.length, pending, programs.length];
  document.querySelectorAll('.summary-grid .summary-card h2').forEach((element, index) => {
    if (values[index] !== undefined) element.textContent = values[index].toLocaleString();
  });

  // Monthly account registrations for the six months shown in the chart.
  const months = [...document.querySelectorAll('.bar-group[data-month]')];
  const counts = months.map(group => {
    const month = group.dataset.month;
    return {
      group,
      volunteers: volunteers.filter(user => String(user.registeredAt || '').slice(0, 7) === month).length,
      ngos: ngos.filter(user => String(user.registeredAt || '').slice(0, 7) === month).length
    };
  });
  const maximum = Math.max(1, ...counts.flatMap(item => [item.volunteers, item.ngos]));
  const axis = document.querySelectorAll('.chart-y-axis span');
  if (axis[0]) axis[0].textContent = maximum;
  if (axis[1]) axis[1].textContent = '0';
  counts.forEach(item => {
    const volunteerBar = item.group.querySelector('[data-role="volunteer"]');
    const ngoBar = item.group.querySelector('[data-role="ngo"]');
    if (volunteerBar) volunteerBar.style.height = `${item.volunteers / maximum * 100}%`;
    if (ngoBar) ngoBar.style.height = `${item.ngos / maximum * 100}%`;
  });

  const total = volunteers.length + ngos.length;
  const totalElement = document.querySelector('[data-user-total]');
  if (totalElement) totalElement.textContent = total;
  document.querySelectorAll('[data-chart-volunteers]').forEach(el => el.textContent = volunteers.length);
  document.querySelectorAll('[data-chart-ngos]').forEach(el => el.textContent = ngos.length);
  const donut = document.querySelector('.donut-chart');
  if (donut) {
    const volunteerShare = total ? volunteers.length / total * 100 : 0;
    donut.style.background = `conic-gradient(var(--terracotta) 0 ${volunteerShare}%, var(--sage) ${volunteerShare}% 100%)`;
  }

  const pendingValue = document.querySelector('[data-pending-ngos]');
  const verifiedValue = document.querySelector('[data-verified-ngos]');
  const pendingCount = document.querySelector('[data-pending-count]');
  const verifiedLabel = document.querySelector('[data-verified-label]');
  const pendingLabel = document.querySelector('[data-pending-label]');
  const progress = document.querySelector('[data-verification-progress]');
  if (pendingValue) pendingValue.textContent = pending;
  if (pendingCount) pendingCount.textContent = pending;
  if (verifiedValue) verifiedValue.textContent = verified;
  if (verifiedLabel) verifiedLabel.textContent = `${verified} Verified NGOs`;
  if (pendingLabel) pendingLabel.textContent = `${pending} Pending`;
  if (progress) progress.style.width = `${ngos.length ? verified / ngos.length * 100 : 0}%`;

  const activityHost = document.getElementById('recentAdminActivity');
  if (activityHost) {
    const latest = users.filter(user => user.registeredAt).sort((a, b) => new Date(b.registeredAt) - new Date(a.registeredAt)).slice(0, 3);
    activityHost.replaceChildren();
    if (!latest.length) {
      const message = document.createElement('p');
      message.className = 'empty-message';
      message.textContent = 'No recent account activity.';
      activityHost.appendChild(message);
    } else {
      latest.forEach(user => {
        const item = document.createElement('div'); item.className = 'activity-item';
        const icon = document.createElement('div'); icon.className = `activity-icon ${user.role === 'ngo' ? 'teal' : 'purple'}`;
        const details = document.createElement('div'); details.className = 'activity-details';
        const heading = document.createElement('strong'); heading.textContent = user.role === 'ngo' ? 'NGO account registered' : 'Volunteer account registered';
        const description = document.createElement('p'); description.textContent = user.name || user.email;
        const time = document.createElement('small');
        const dateValue = new Date(user.registeredAt);
        time.textContent = Number.isNaN(dateValue.getTime()) ? '' : dateValue.toLocaleDateString('en-MY', { day: 'numeric', month: 'short', year: 'numeric' });
        details.append(heading, description, time); item.append(icon, details); activityHost.appendChild(item);
      });
    }
  }
});
