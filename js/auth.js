(() => {
  const USERS_KEY = 'volunteerhub_users';
  const SESSION_KEY = 'volunteerhub_session';
  const ADMIN = { name: 'Administrator', email: 'admin@volunhub.com', password: 'volunhub123', role: 'admin' };
  const DEMO_USERS = [
    { demoKey: 'volunteer-aina', name: 'Aina Volunteer', email: 'aina@volunteer.com', password: 'volunteer123', role: 'volunteer', contact: '012-345 6789', status: 'active', registeredAt: '2026-11-10T09:00:00.000Z', demoAccount: true },
    { demoKey: 'volunteer-amir', name: 'Amir Volunteer', email: 'amir@volunteer.com', password: 'volunteer123', role: 'volunteer', contact: '013-456 7890', status: 'active', registeredAt: '2026-11-11T10:30:00.000Z', demoAccount: true },
    { demoKey: 'ngo-greensteps', name: 'GreenSteps Malaysia', email: 'gs@ngo.com', password: 'ngo12345', role: 'ngo', contact: '012-345 6789', ssm: '202601234561', organisation: 'GreenSteps Malaysia', status: 'verified', registeredAt: '2026-11-09T08:15:00.000Z', demoAccount: true },
    { demoKey: 'ngo-brightfuture', name: 'Bright Future NGO', email: 'brightfuture@ngo.com', password: 'ngo12345', role: 'ngo', contact: '013-456 7890', ssm: '202601234562', organisation: 'Bright Future NGO', status: 'verified', registeredAt: '2026-11-10T08:15:00.000Z', demoAccount: true },
    { demoKey: 'ngo-kpk', name: 'Komuniti Prihatin Kelantan', email: 'kpk@ngo.com', password: 'ngo12345', role: 'ngo', contact: '09-765 4321', ssm: '202601234567', organisation: 'Komuniti Prihatin Kelantan', status: 'verified', registeredAt: '2026-11-11T08:15:00.000Z', demoAccount: true }
  ];

  function readUsers() {
    try { const users = JSON.parse(localStorage.getItem(USERS_KEY) || '[]'); return Array.isArray(users) ? users : []; }
    catch { return []; }
  }
  function ensureDemoAccounts() {
    const current = readUsers();
    const demoEmails = new Set(DEMO_USERS.map(user => user.email.toLowerCase()));
    const demoKeys = new Set(DEMO_USERS.map(user => user.demoKey));
    const users = current.filter(user => {
      const email = String(user.email || '').trim().toLowerCase();
      if (demoEmails.has(email) || demoKeys.has(user.demoKey)) return false;
      // Remove only obsolete records explicitly marked as demo NGO accounts.
      // Genuine NGO registrations (which do not carry demo markers) remain.
      return !(user.role === 'ngo'
        && (user.demoAccount === true || String(user.demoKey || '').startsWith('ngo-')));
    });
    DEMO_USERS.forEach(demo => users.push({ ...demo }));
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
    return users;
  }
  function ensureAdmin() {
    const users = ensureDemoAccounts().filter(user => String(user.email || '').trim().toLowerCase() !== ADMIN.email);
    users.push(ADMIN);
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  }
  function saveSession(user) {
    localStorage.setItem(SESSION_KEY, JSON.stringify({ name: user.name, email: user.email, role: user.role, country: user.country || '', state: user.state || '', organisation: user.organisation || (user.role === 'ngo' ? user.name : ''), signedInAt: Date.now() }));
  }
  function destination(role) {
    return ({ admin: 'admin-dashboard.html', ngo: 'ngo-dashboard.html', volunteer: 'volunteer-dashboard.html' })[role] || 'index.html';
  }
  function postLoginDestination(role) {
    const pending = localStorage.getItem('volunteerhub_pending_program');
    if (pending && role === 'volunteer') return `Programs.html?register=${encodeURIComponent(pending)}`;
    if (pending) localStorage.removeItem('volunteerhub_pending_program');
    const returnTo = localStorage.getItem('volunteerhub_return_after_login');
    if (returnTo && role === 'volunteer') { localStorage.removeItem('volunteerhub_return_after_login'); return returnTo; }
    if (returnTo) localStorage.removeItem('volunteerhub_return_after_login');
    return destination(role);
  }
  function showAlert(element, message, success = false) {
    if (!element) return;
    element.textContent = message;
    element.style.display = 'block';
    element.classList.toggle('alert-success', success);
  }

  const countryCodes = `AF AL DZ AS AD AO AI AQ AG AR AM AW AU AT AZ BS BH BD BB BY BE BZ BJ BM BT BO BQ BA BW BV BR IO BN BG BF BI CV KH CM CA KY CF TD CL CN CX CC CO KM CG CD CK CR CI HR CU CW CY CZ DK DJ DM DO EC EG SV GQ ER EE SZ ET FK FO FJ FI FR GF PF TF GA GM GE DE GH GI GR GL GD GP GU GT GG GN GW GY HT HM VA HN HK HU IS IN ID IR IQ IE IM IL IT JM JP JE JO KZ KE KI KP KR KW KG LA LV LB LS LR LY LI LT LU MO MG MW MY MV ML MT MH MQ MR MU YT MX FM MD MC MN ME MS MA MZ MM NA NR NP NL NC NZ NI NE NG NU NF MK MP NO OM PK PW PS PA PG PY PE PH PN PL PT PR QA RE RO RU RW BL SH KN LC MF PM VC WS SM ST SA SN RS SC SL SG SX SK SI SB SO ZA GS SS ES LK SD SR SJ SE CH SY TW TJ TZ TH TL TG TK TO TT TN TR TM TC TV UG UA AE GB US UM UY UZ VU VE VN VG VI WF EH YE ZM ZW`.split(/\s+/);
  const fallbackCountryNames = { MY: 'Malaysia', SG: 'Singapore', US: 'United States', GB: 'United Kingdom', AU: 'Australia', CA: 'Canada', IN: 'India', ID: 'Indonesia', TH: 'Thailand', PH: 'Philippines', BN: 'Brunei', JP: 'Japan', KR: 'South Korea', CN: 'China', NZ: 'New Zealand', PK: 'Pakistan', BD: 'Bangladesh', AE: 'United Arab Emirates', SA: 'Saudi Arabia', ZA: 'South Africa' };
  const regionLists = {
    MY: ['Johor','Kedah','Kelantan','Melaka','Negeri Sembilan','Pahang','Pulau Pinang','Perak','Perlis','Sabah','Sarawak','Selangor','Terengganu','Kuala Lumpur','Labuan','Putrajaya'],
    US: ['Alabama','Alaska','Arizona','Arkansas','California','Colorado','Connecticut','Delaware','Florida','Georgia','Hawaii','Idaho','Illinois','Indiana','Iowa','Kansas','Kentucky','Louisiana','Maine','Maryland','Massachusetts','Michigan','Minnesota','Mississippi','Missouri','Montana','Nebraska','Nevada','New Hampshire','New Jersey','New Mexico','New York','North Carolina','North Dakota','Ohio','Oklahoma','Oregon','Pennsylvania','Rhode Island','South Carolina','South Dakota','Tennessee','Texas','Utah','Vermont','Virginia','Washington','West Virginia','Wisconsin','Wyoming','District of Columbia'],
    CA: ['Alberta','British Columbia','Manitoba','New Brunswick','Newfoundland and Labrador','Northwest Territories','Nova Scotia','Nunavut','Ontario','Prince Edward Island','Quebec','Saskatchewan','Yukon'],
    AU: ['Australian Capital Territory','New South Wales','Northern Territory','Queensland','South Australia','Tasmania','Victoria','Western Australia'],
    IN: ['Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh','Goa','Gujarat','Haryana','Himachal Pradesh','Jharkhand','Karnataka','Kerala','Madhya Pradesh','Maharashtra','Manipur','Meghalaya','Mizoram','Nagaland','Odisha','Punjab','Rajasthan','Sikkim','Tamil Nadu','Telangana','Tripura','Uttar Pradesh','Uttarakhand','West Bengal','Delhi'],
    GB: ['England','Scotland','Wales','Northern Ireland'],
    NZ: ['Auckland','Bay of Plenty','Canterbury','Gisborne','Hawke’s Bay','Manawatū-Whanganui','Marlborough','Nelson','Northland','Otago','Southland','Taranaki','Tasman','Waikato','Wellington','West Coast'],
    SG: ['Central Singapore','North East','North West','South East','South West'],
    ID: ['Aceh','Bali','Bangka Belitung Islands','Banten','Bengkulu','Central Java','Central Kalimantan','Central Sulawesi','East Java','East Kalimantan','East Nusa Tenggara','Gorontalo','Jakarta','Jambi','Lampung','Maluku','North Kalimantan','North Maluku','North Sulawesi','North Sumatra','Papua','Riau','Riau Islands','South Kalimantan','South Sulawesi','South Sumatra','Southeast Sulawesi','West Java','West Kalimantan','West Nusa Tenggara','West Papua','West Sulawesi','West Sumatra','Yogyakarta'],
    TH: ['Bangkok','Chiang Mai','Chonburi','Krabi','Nakhon Ratchasima','Phuket','Songkhla','Surat Thani'],
    PH: ['Metro Manila','Abra','Agusan del Norte','Agusan del Sur','Aklan','Albay','Antique','Bataan','Batangas','Benguet','Bohol','Bukidnon','Bulacan','Cagayan','Camarines Norte','Camarines Sur','Cebu','Davao del Norte','Davao del Sur','Iloilo','Laguna','Leyte','Negros Occidental','Pampanga','Pangasinan','Rizal'],
    BN: ['Belait','Brunei-Muara','Temburong','Tutong'],
    PK: ['Balochistan','Khyber Pakhtunkhwa','Punjab','Sindh','Islamabad Capital Territory'],
    BD: ['Barisal','Chattogram','Dhaka','Khulna','Mymensingh','Rajshahi','Rangpur','Sylhet'],
    JP: ['Aichi','Akita','Aomori','Chiba','Ehime','Fukui','Fukuoka','Fukushima','Gifu','Gunma','Hiroshima','Hokkaido','Hyogo','Ibaraki','Ishikawa','Iwate','Kagawa','Kagoshima','Kanagawa','Kochi','Kumamoto','Kyoto','Mie','Miyagi','Miyazaki','Nagano','Nagasaki','Nara','Niigata','Oita','Okayama','Okinawa','Osaka','Saga','Saitama','Shiga','Shimane','Shizuoka','Tochigi','Tokushima','Tokyo','Tottori','Toyama','Wakayama','Yamagata','Yamaguchi','Yamanashi'],
    KR: ['Busan','Chungcheongbuk-do','Chungcheongnam-do','Daegu','Daejeon','Gangwon-do','Gwangju','Gyeonggi-do','Gyeongsangbuk-do','Gyeongsangnam-do','Incheon','Jeju-do','Jeollabuk-do','Jeollanam-do','Sejong','Seoul','Ulsan'],
    CN: ['Anhui','Beijing','Chongqing','Fujian','Gansu','Guangdong','Guangxi','Guizhou','Hainan','Hebei','Heilongjiang','Henan','Hubei','Hunan','Inner Mongolia','Jiangsu','Jiangxi','Jilin','Liaoning','Ningxia','Qinghai','Shaanxi','Shandong','Shanghai','Shanxi','Sichuan','Tianjin','Tibet','Xinjiang','Yunnan','Zhejiang'],
    DE: ['Baden-Württemberg','Bavaria','Berlin','Brandenburg','Bremen','Hamburg','Hesse','Lower Saxony','Mecklenburg-Vorpommern','North Rhine-Westphalia','Rhineland-Palatinate','Saarland','Saxony','Saxony-Anhalt','Schleswig-Holstein','Thuringia'],
    FR: ['Auvergne-Rhône-Alpes','Bourgogne-Franche-Comté','Brittany','Centre-Val de Loire','Corsica','Grand Est','Hauts-de-France','Île-de-France','Normandy','Nouvelle-Aquitaine','Occitanie','Pays de la Loire','Provence-Alpes-Côte d’Azur'],
    AE: ['Abu Dhabi','Ajman','Dubai','Fujairah','Ras Al Khaimah','Sharjah','Umm Al Quwain'],
    SA: ['Asir','Al Bahah','Al Jawf','Eastern Province','Ha’il','Jazan','Madinah','Makkah','Najran','Northern Borders','Qassim','Riyadh','Tabuk'],
    ZA: ['Eastern Cape','Free State','Gauteng','KwaZulu-Natal','Limpopo','Mpumalanga','Northern Cape','North West','Western Cape']
  };
  function countryName(code) {
    try { return new Intl.DisplayNames(['en'], { type: 'region' }).of(code) || fallbackCountryNames[code] || code; }
    catch { return fallbackCountryNames[code] || code; }
  }
  function setupLocationFields(prefix) {
    const country = document.getElementById(`${prefix}Country`);
    const region = document.getElementById(`${prefix}State`);
    const other = document.getElementById(`${prefix}StateOther`);
    if (!country || !region || !other) return;
    country.innerHTML = '<option value="">Select country</option>' + countryCodes.map(code => `<option value="${code}">${countryName(code)}</option>`).join('');
    country.value = 'MY';
    function updateRegions() {
      const list = regionLists[country.value];
      region.innerHTML = '';
      if (list) {
        region.add(new Option('Select state / region', ''));
        list.forEach(value => region.add(new Option(value, value)));
        region.style.display = ''; region.required = true; other.style.display = 'none'; other.required = false; other.value = '';
      } else {
        region.style.display = 'none'; region.required = false; region.value = '';
        other.style.display = ''; other.required = true;
      }
    }
    country.addEventListener('change', updateRegions);
    updateRegions();
  }

  document.addEventListener('DOMContentLoaded', () => {
    ensureAdmin();
    const loginForm = document.getElementById('loginForm');
    const signupForm = document.getElementById('signupForm');
    const loginTab = document.getElementById('tab-login');
    const signupTab = document.getElementById('tab-signup');
    const loginAlert = document.getElementById('loginAlert');
    const signupAlert = document.getElementById('signupAlert');
    setupLocationFields('v');
    setupLocationFields('n');

    // Back button to the home page, without changing the login page layout.
    const authHeading = document.querySelector('.auth-card-heading');
    if (authHeading && !document.getElementById('backToHome')) {
      const backLink = document.createElement('a');
      backLink.id = 'backToHome';
      backLink.href = 'index.html';
      backLink.textContent = '← Back to Home';
      backLink.style.cssText = 'display:inline-block;margin-bottom:14px;color:inherit;text-decoration:none;font-weight:600;';
      authHeading.prepend(backLink);
    }

    function showForm(mode) {
      if (!loginForm || !signupForm) return;
      const isLogin = mode === 'login';
      loginForm.style.display = isLogin ? '' : 'none';
      signupForm.style.display = isLogin ? 'none' : '';
      loginTab?.classList.toggle('active', isLogin);
      signupTab?.classList.toggle('active', !isLogin);
    }
    loginTab?.addEventListener('click', () => showForm('login'));
    signupTab?.addEventListener('click', () => showForm('signup'));
    document.getElementById('goToSignup')?.addEventListener('click', event => { event.preventDefault(); showForm('signup'); });
    document.getElementById('goToLogin')?.addEventListener('click', event => { event.preventDefault(); showForm('login'); });

    const role = document.getElementById('role');
    function updateRoleFields() {
      const value = role?.value;
      const volunteer = document.getElementById('volFields');
      const ngo = document.getElementById('ngoFields');
      const common = document.getElementById('commonFields');
      if (volunteer) volunteer.style.display = value === 'volunteer' ? '' : 'none';
      if (ngo) ngo.style.display = value === 'ngo' ? '' : 'none';
      if (common) common.style.display = value ? '' : 'none';
      ['vName','vDob','vGender','vEmail','vCountry','vState','vStateOther','nName','nEmail','nSsm','nCountry','nState','nStateOther','contact','pass','pass2'].forEach(id => {
        const field = document.getElementById(id);
        if (!field) return;
        const common = ['contact','pass','pass2'].includes(id);
        const volunteerField = ['vName','vDob','vGender','vEmail','vCountry','vState','vStateOther'].includes(id);
        const ngoField = ['nName','nEmail','nSsm','nCountry','nState','nStateOther'].includes(id);
        field.required = common || (value === 'volunteer' && volunteerField) || (value === 'ngo' && ngoField);
      });
      ['v', 'n'].forEach(prefix => {
        const active = value === (prefix === 'v' ? 'volunteer' : 'ngo');
        const country = document.getElementById(`${prefix}Country`);
        const stateSelect = document.getElementById(`${prefix}State`);
        const stateOther = document.getElementById(`${prefix}StateOther`);
        if (country) country.required = active;
        if (stateSelect) stateSelect.required = active && stateSelect.style.display !== 'none';
        if (stateOther) stateOther.required = active && stateOther.style.display !== 'none';
      });
    }
    role?.addEventListener('change', updateRoleFields);
    updateRoleFields();

    ['loginPasswordToggle', 'passPasswordToggle', 'pass2PasswordToggle'].forEach(id => {
      document.getElementById(id)?.addEventListener('click', event => {
        const input = event.currentTarget.parentElement?.querySelector('input');
        if (input) input.type = input.type === 'password' ? 'text' : 'password';
      });
    });

    loginForm?.addEventListener('submit', event => {
      event.preventDefault();
      const email = (document.getElementById('loginEmail')?.value || '').trim().toLowerCase();
      const password = document.getElementById('loginPass')?.value || '';
      // Repair the demo records at the point of login too, so a stale browser
      // cache or older LocalStorage data cannot block the published credentials.
      ensureDemoAccounts();
      const user = readUsers().find(item =>
        String(item.email || '').trim().toLowerCase() === email
        && String(item.password || '') === password
      );
      if (!user) { showAlert(loginAlert, 'Invalid email or password. Please try again.'); return; }
      if (user.role === 'ngo' && user.status !== 'verified') {
        showAlert(loginAlert, user.status === 'rejected'
          ? 'Your NGO account application was rejected. Please contact the administrator.'
          : 'Your NGO account is awaiting admin approval. You can log in after it has been approved.');
        return;
      }
      saveSession(user);
      window.location.href = postLoginDestination(user.role);
    });

    signupForm?.addEventListener('submit', event => {
      event.preventDefault();
      const selectedRole = role?.value;
      const value = id => document.getElementById(id)?.value.trim() || '';
      const name = selectedRole === 'volunteer' ? value('vName') : selectedRole === 'ngo' ? value('nName') : '';
      const email = selectedRole === 'volunteer' ? value('vEmail').toLowerCase() : selectedRole === 'ngo' ? value('nEmail').toLowerCase() : '';
      const password = document.getElementById('pass')?.value || '';
      const confirm = document.getElementById('pass2')?.value || '';
      const contact = value('contact');
      const country = selectedRole === 'volunteer' ? value('vCountry') : value('nCountry');
      const state = selectedRole === 'volunteer'
        ? (value('vState') || value('vStateOther'))
        : (value('nState') || value('nStateOther'));
      const dob = selectedRole === 'volunteer' ? value('vDob') : '';
      const gender = selectedRole === 'volunteer' ? value('vGender') : '';
      const ssm = selectedRole === 'ngo' ? value('nSsm') : '';

      if (!selectedRole || !name || !email || !contact || !country || !state || !password || !confirm || (selectedRole === 'volunteer' && (!dob || !gender)) || (selectedRole === 'ngo' && !ssm)) {
        showAlert(signupAlert, 'Please complete all required fields, including your country and state/region.');
        return;
      }
      if (password.length < 6) { showAlert(signupAlert, 'Password must contain at least 6 characters.'); return; }
      if (password !== confirm) { showAlert(signupAlert, 'Passwords do not match.'); return; }
      if (selectedRole === 'volunteer' && new Date(dob) > new Date()) { showAlert(signupAlert, 'Date of birth cannot be in the future.'); return; }
      const users = readUsers();
      if (users.some(user => user.email?.toLowerCase() === email)) { showAlert(signupAlert, 'An account with this email already exists. Please log in instead.'); return; }

      const newUser = {
        name, email, password, role: selectedRole, contact, country: countryName(country), countryCode: country, state,
        dateOfBirth: dob, gender, ssm,
        organisation: selectedRole === 'ngo' ? name : '',
        status: selectedRole === 'ngo' ? 'pending' : 'active',
        registeredAt: new Date().toISOString()
      };
      users.push(newUser);
      localStorage.setItem(USERS_KEY, JSON.stringify(users));

      // After successful registration, return the user to Login with their email filled in.
      const loginEmail = document.getElementById('loginEmail');
      if (loginEmail) loginEmail.value = email;
      signupForm.reset();
      if (role) role.value = '';
      updateRoleFields();
      showForm('login');
      if (selectedRole === 'ngo') {
        showAlert(loginAlert, 'NGO account created successfully. Please wait for admin approval before logging in.', true);
      } else {
        showAlert(loginAlert, 'Account created successfully. Please enter your password to log in.', true);
      }
    });
  });
})();
