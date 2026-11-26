(() => {
  const read = key => { try { return JSON.parse(localStorage.getItem(key) || '[]'); } catch { return []; } };
  const write = (key, value) => localStorage.setItem(key, JSON.stringify(value));

  const demoUsers = [
    { demoKey: 'volunteer-aina', name: 'Aina Volunteer', email: 'aina@volunteer.com', password: 'volunteer123', role: 'volunteer', contact: '012-345 6789', status: 'active', registeredAt: '2026-11-10T09:00:00.000Z', demoAccount: true },
    { demoKey: 'volunteer-amir', name: 'Amir Volunteer', email: 'amir@volunteer.com', password: 'volunteer123', role: 'volunteer', contact: '013-456 7890', status: 'active', registeredAt: '2026-11-11T10:30:00.000Z', demoAccount: true },
    { demoKey: 'ngo-greensteps', name: 'GreenSteps Malaysia', email: 'gs@ngo.com', password: 'ngo12345', role: 'ngo', contact: '012-345 6789', ssm: '202601234561', organisation: 'GreenSteps Malaysia', status: 'verified', registeredAt: '2026-11-09T08:15:00.000Z', demoAccount: true },
    { demoKey: 'ngo-brightfuture', name: 'Bright Future NGO', email: 'brightfuture@ngo.com', password: 'ngo12345', role: 'ngo', contact: '013-456 7890', ssm: '202601234562', organisation: 'Bright Future NGO', status: 'verified', registeredAt: '2026-11-10T08:15:00.000Z', demoAccount: true },
    { demoKey: 'ngo-kpk', name: 'Komuniti Prihatin Kelantan', email: 'kpk@ngo.com', password: 'ngo12345', role: 'ngo', contact: '09-765 4321', ssm: '202601234567', organisation: 'Komuniti Prihatin Kelantan', status: 'verified', registeredAt: '2026-11-11T08:15:00.000Z', demoAccount: true }
  ];
  const storedUsers = read('volunteerhub_users');
  const demoEmails = new Set(demoUsers.map(user => user.email.toLowerCase()));
  const canonicalDemoKeys = new Set(demoUsers.map(user => user.demoKey));
  const users = storedUsers.filter(user => {
    const email = String(user.email || '').trim().toLowerCase();
    if (demoEmails.has(email) || canonicalDemoKeys.has(user.demoKey)) return false;
    const isObsoleteDemoNgo = user.role === 'ngo'
      && (user.demoAccount === true || String(user.demoKey || '').startsWith('ngo-'));
    return !isObsoleteDemoNgo;
  });
  demoUsers.forEach(demo => users.push({ ...demo }));
  write('volunteerhub_users', users);
  // These built-in demonstration accounts must remain available for testing.
  // Remove legacy deletion tombstones for the published demo accounts.
  const deletedDemoUsers = read('volunteerhub_deleted_demo_users').filter(key =>
    !demoUsers.some(user => user.demoKey === String(key))
  );
  write('volunteerhub_deleted_demo_users', deletedDemoUsers);
  const demos = [
    { id: 'DEMO-GS-001', name: 'Community Clean-up Day', category: 'Environment', date: '2026-12-05', location: 'Kota Bharu, Kelantan', description: 'Join local volunteers to clean public spaces and promote a healthier environment.', image: 'image/cleanup.jpeg', organisation: 'GreenSteps Malaysia', ownerEmail: 'gs@ngo.com', status: 'active', demoData: true },
    { id: 'DEMO-BF-001', name: 'Back to School Project', category: 'Education', date: '2026-12-12', location: 'Shah Alam, Selangor', description: 'Support children through school supply preparation and learning activities.', image: 'image/school.jpg', organisation: 'Bright Future NGO', ownerEmail: 'brightfuture@ngo.com', status: 'active', demoData: true },
    { id: 'DEMO-KPK-001', name: 'Food Donation Drive', category: 'Community', date: '2026-12-05', location: 'Selangor', description: 'Support families in need by helping with food collection and distribution.', image: 'image/food.jpeg', ownerEmail: 'kpk@ngo.com', status: 'active', demoData: true }
  ];
  const demoProgramNames = new Set(demos.map(program => program.name.toLowerCase()));
  const legacyNames = new Set(['tree planting campaign', 'community learning support']);
  const originalPrograms = read('volunteerhub_ngo_programs');
  const canonicalIds = new Set(demos.map(program => program.id));
  const seenDemoIds = new Set();
  const cleaned = originalPrograms.filter(program => {
    const name = String(program?.name || '').trim().toLowerCase();
    const id = String(program?.id || '');
    if (legacyNames.has(name)) return false;
    // Remove duplicate/old copies of the three sample activities, including
    // records saved without the demoData flag by earlier versions.
    if (demoProgramNames.has(name) && !canonicalIds.has(id)) return false;
    if (program?.demoData === true && !canonicalIds.has(id)) return false;
    if (canonicalIds.has(id)) {
      if (seenDemoIds.has(id)) return false;
      seenDemoIds.add(id);
    }
    return true;
  });
  demos.forEach(demo => {
    const existingIndex = cleaned.findIndex(program => String(program.id) === demo.id);
    if (existingIndex >= 0) cleaned[existingIndex] = { ...cleaned[existingIndex], ...demo };
    else cleaned.push(demo);
  });
  write('volunteerhub_ngo_programs', cleaned);
  const registrations = read('volunteerhub_registrations');
  const activeProgramIds = new Set(cleaned.map(program => String(program.id)));
  const filteredRegistrations = registrations.filter(registration => {
    const name = String(registration?.programName || '').trim().toLowerCase();
    if (legacyNames.has(name)) return false;
    return !registration?.programId || activeProgramIds.has(String(registration.programId));
  });
  if (filteredRegistrations.length !== registrations.length) {
    write('volunteerhub_registrations', filteredRegistrations);
  }
})();
