document.addEventListener('DOMContentLoaded', () => {
  const tbody = document.getElementById('volunteerTable'); if (!tbody) return;
  let session = null; try { session = JSON.parse(localStorage.getItem('volunteerhub_session') || 'null'); } catch {}
  const read = key => { try { return JSON.parse(localStorage.getItem(key) || '[]'); } catch { return []; } };
  const write = data => localStorage.setItem('volunteerhub_registrations', JSON.stringify(data));
  const search = document.getElementById('searchVolunteer'), statusFilter = document.getElementById('statusFilter');
  const empty = document.getElementById('emptyState'), count = document.getElementById('resultCount');
  const owned = read('volunteerhub_ngo_programs').filter(p => p.ownerEmail?.toLowerCase() === session?.email?.toLowerCase());
  const tabsHost = document.querySelector('.program-selector');
  let selectedProgram = owned[0]?.id || '';
  const programCountLabel = document.querySelector('.program-count'); if (programCountLabel) programCountLabel.textContent = `${owned.length} Programs`;
  if (tabsHost) {
    tabsHost.innerHTML = '';
    if (!owned.length) tabsHost.innerHTML = '<p class="empty-message">You have not created any programs yet. Add a program from your NGO dashboard.</p>'; 
    owned.forEach((program, index) => {
      const button = document.createElement('button'); button.type = 'button'; button.className = `program-tab${index===0?' active':''}`;
      button.innerHTML = '<div class="tab-info"><strong class="program-tab-title"></strong><span class="program-tab-date"></span></div><span class="tab-number">0</span>';
      button.querySelector('.program-tab-title').textContent = program.name;
      button.querySelector('.program-tab-date').textContent = program.date || 'Date to be announced';
      button.addEventListener('click', () => { selectedProgram = program.id; document.querySelectorAll('.program-tab').forEach(t=>t.classList.toggle('active',t===button)); render(); });
      tabsHost.appendChild(button);
    });
  }
  function update(id,next) { const all=read('volunteerhub_registrations'); const item=all.find(r=>r.registrationId===id); if(!item)return; item.status=next; item.reviewedAt=new Date().toISOString(); write(all); render(); }
  function render() {
    const all=read('volunteerhub_registrations');
    const program=owned.find(p=>String(p.id)===String(selectedProgram));
    const title=document.getElementById('selectedProgramTitle'); if(title) title.textContent=program?.name || 'No programs created yet';
    const date=document.getElementById('selectedProgramDate'); if(date) date.textContent=program?.date ? new Date(program.date + 'T00:00:00').toLocaleDateString('en-MY', {day:'numeric', month:'long', year:'numeric'}) + (program.location ? ' · ' + program.location : '') : 'Create a program in your NGO dashboard';
    const term=(search?.value||'').toLowerCase().trim(), selectedStatus=(statusFilter?.value||'all').toLowerCase();
    const records=all.filter(r=>String(r.programId)===String(selectedProgram) && r.organisationEmail?.toLowerCase()===session?.email?.toLowerCase() && `${r.volunteerName} ${r.volunteerEmail}`.toLowerCase().includes(term) && (selectedStatus==='all'||r.status.toLowerCase()===selectedStatus));
    tbody.innerHTML=''; records.forEach(r=>{
      const tr=document.createElement('tr'); tr.innerHTML='<td class="volunteer-name"></td><td class="volunteer-email"></td><td class="registered-date"></td><td><span class="status"></span></td><td class="registration-actions"></td>';
      tr.querySelector('.volunteer-name').textContent=r.volunteerName; tr.querySelector('.volunteer-email').textContent=r.volunteerEmail;
      const d=new Date(r.registeredAt); tr.querySelector('.registered-date').textContent=Number.isNaN(d.getTime())?'—':d.toLocaleDateString('en-MY',{day:'2-digit',month:'short',year:'numeric'});
      const badge=tr.querySelector('.status'); badge.textContent=r.status; badge.classList.add(r.status.toLowerCase());
      const actions=tr.querySelector('.registration-actions');
      if(r.status==='Pending') ['Approved','Rejected'].forEach(next=>{const b=document.createElement('button');b.type='button';b.className=next==='Approved'?'action-btn approve-btn':'action-btn reject-btn';b.textContent=next;b.addEventListener('click',()=>update(r.registrationId,next));actions.appendChild(b);}); else actions.textContent=r.status;
      tbody.appendChild(tr);
    });
    if(empty) empty.hidden=records.length>0; if(count) count.textContent=`Showing ${records.length} registrations`;
    const allForProgram=all.filter(r=>String(r.programId)===String(selectedProgram)&&r.organisationEmail?.toLowerCase()===session?.email?.toLowerCase());
    const allOwnedRegistrations = all.filter(r => owned.some(p => String(p.id) === String(r.programId)) && r.organisationEmail?.toLowerCase() === session?.email?.toLowerCase());
    const totals=[allOwnedRegistrations.length,allOwnedRegistrations.filter(r=>r.status==='Pending').length,allOwnedRegistrations.filter(r=>r.status==='Approved').length,allOwnedRegistrations.filter(r=>r.status==='Rejected').length];
    document.querySelectorAll('.summary-grid .summary-card h3').forEach((el,i)=>{if(totals[i]!==undefined)el.textContent=totals[i];});
    document.querySelectorAll('.program-tab').forEach((tab,i)=>{const p=owned[i];const badge=tab.querySelector('.tab-number');if(badge&&p)badge.textContent=all.filter(r=>String(r.programId)===String(p.id) && r.organisationEmail?.toLowerCase()===session?.email?.toLowerCase()).length;});
  }
  search?.addEventListener('input',render); statusFilter?.addEventListener('change',render); render();
});
