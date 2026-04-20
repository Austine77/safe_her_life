const stateSelect = document.getElementById('stateSelect');
const directoryInput = document.getElementById('directoryInput');
const directoryResults = document.getElementById('directoryResults');
const directoryStatus = document.getElementById('directoryStatus');
const searchDirectoryBtn = document.getElementById('searchDirectoryBtn');
const loadAllBtn = document.getElementById('loadAllBtn');

let DIRECTORY = [];

function escapeHtml(value = '') {
  return String(value || '').replace(/[&<>"']/g, (char) => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[char]));
}

function normalize(value = '') {
  return String(value || '').trim().toLowerCase();
}

function cleanPhone(phone = '') {
  return String(phone || '').replace(/\D/g, '');
}

function phoneHref(phone = '') {
  const digits = cleanPhone(phone);
  if (!digits) return '';
  const local = digits.startsWith('234') ? `0${digits.slice(3)}` : digits;
  return `tel:${local}`;
}

function whatsappHref(phone = '') {
  const digits = cleanPhone(phone);
  if (!digits) return '';
  const intl = digits.startsWith('0') ? `234${digits.slice(1)}` : digits;
  return `https://wa.me/${intl}`;
}

function renderSelectOptions() {
  stateSelect.innerHTML = ['<option value="">All states</option>']
    .concat(DIRECTORY.map((item) => `<option value="${escapeHtml(item.state)}">${escapeHtml(item.state)}</option>`))
    .join('');
}

function matches(item, query, state) {
  const q = normalize(query);
  const stateFilter = normalize(state);
  const haystack = [item.state, item.agency, item.notes, item.address, item.email, item.sourceTitle].map(normalize).join(' ');
  if (stateFilter && normalize(item.state) !== stateFilter) return false;
  if (!q) return true;
  return haystack.includes(q);
}

function renderResults(items) {
  if (!items.length) {
    directoryResults.innerHTML = '<div class="notice">No support contact matched this search.</div>';
    directoryStatus.textContent = 'No matching contact found.';
    directoryStatus.className = 'status info';
    return;
  }

  directoryResults.innerHTML = items.map((item) => {
    const hasPhone = Boolean(item.phone);
    const hasEmail = Boolean(item.email);
    const hasWhatsapp = hasPhone;
    return `
      <article class="result-card">
        <div class="result-top">
          <div>
            <h3>${escapeHtml(item.state)}</h3>
            <p>${escapeHtml(item.agency)}</p>
          </div>
          <span class="badge ${item.verificationStatus === 'support_escalation' ? 'escalation' : 'verified'}">${item.verificationStatus === 'support_escalation' ? 'Support escalation' : 'Official page'}</span>
        </div>
        <div class="result-meta"><strong>Address:</strong> ${escapeHtml(item.address || 'Not listed publicly')}</div>
        <div class="result-meta"><strong>Phone:</strong> ${hasPhone ? escapeHtml(item.phone) : 'Not listed publicly'}</div>
        <div class="result-meta"><strong>Email:</strong> ${hasEmail ? escapeHtml(item.email) : 'Not listed publicly'}</div>
        <div class="result-meta"><strong>Notes:</strong> ${escapeHtml(item.notes || '')}</div>
        <div class="btn-row" style="margin-top:14px;">
          ${hasPhone ? `<a class="secondary-btn" href="${phoneHref(item.phone)}">Call</a>` : ''}
          ${hasWhatsapp ? `<a class="secondary-btn" href="${whatsappHref(item.phone)}" target="_blank" rel="noopener noreferrer">WhatsApp</a>` : ''}
          ${hasEmail ? `<a class="secondary-btn" href="mailto:${encodeURIComponent(item.email)}">Email</a>` : ''}
          <a class="ghost-btn" href="${escapeHtml(item.sourceUrl)}" target="_blank" rel="noopener noreferrer">Open source</a>
        </div>
        <div class="result-meta" style="margin-top:10px;"><strong>Source:</strong> ${escapeHtml(item.sourceTitle)} · <strong>Last verified:</strong> ${escapeHtml(item.lastVerified || '2026-04-15')}</div>
      </article>
    `;
  }).join('');

  directoryStatus.textContent = `${items.length} support contact${items.length === 1 ? '' : 's'} shown.`;
  directoryStatus.className = 'status success';
}

function applyFilters() {
  const items = DIRECTORY.filter((item) => matches(item, directoryInput.value, stateSelect.value));
  renderResults(items);
}

async function loadDirectory() {
  directoryStatus.textContent = 'Loading support directory...';
  directoryStatus.className = 'status info';
  const response = await fetch('./assets/social-workers-data.json', { cache: 'no-store' });
  DIRECTORY = await response.json();
  renderSelectOptions();
  renderResults(DIRECTORY);
}

searchDirectoryBtn.addEventListener('click', applyFilters);
loadAllBtn.addEventListener('click', () => {
  stateSelect.value = '';
  directoryInput.value = '';
  renderResults(DIRECTORY);
});
stateSelect.addEventListener('change', applyFilters);
directoryInput.addEventListener('keydown', (event) => {
  if (event.key === 'Enter') applyFilters();
});
loadDirectory();
