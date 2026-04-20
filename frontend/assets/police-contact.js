(function () {
  const AUTH_KEY = "safeherlife-staff-authenticated";
  if (window.localStorage.getItem(AUTH_KEY) !== "1" && window.sessionStorage.getItem(AUTH_KEY) !== "1") {
    window.location.href = "./staff.html";
    return;
  }

  const lookupForm = document.getElementById("lookupForm");
  const locationInput = document.getElementById("locationInput");
  const radiusInput = document.getElementById("radiusInput");
  const lookupStatus = document.getElementById("lookupStatus");
  const nearbyResults = document.getElementById("nearbyResults");
  const resultCount = document.getElementById("resultCount");
  const geoResult = document.getElementById("geoResult");
  const stateSelect = document.getElementById("stateSelect");
  const directoryInput = document.getElementById("directoryInput");
  const searchDirectoryBtn = document.getElementById("searchDirectoryBtn");
  const loadAllBtn = document.getElementById("loadAllBtn");
  const directoryStatus = document.getElementById("directoryStatus");
  const directoryResults = document.getElementById("directoryResults");

  const API_BASES = (() => {
    const normalize = (value) => String(value || "").trim().replace(/\/+$/, "");
    const items = [
      window.SAFEHERLIFE_API_BASE_URL,
      localStorage.getItem("safeherlife-working-api-base"),
      localStorage.getItem("safe_her_life-working-api-base"),
      localStorage.getItem("safe_her_life-api-base"),
      "https://safeherlife-backend.onrender.com/api",
      "https://safeherlife-backend.onrender.com/api",
      `${window.location.origin}/api`,
      "http://localhost:5000/api",
      "http://127.0.0.1:5000/api",
    ].map(normalize).filter(Boolean);
    return [...new Set(items)];
  })();

  let workingApiBase = API_BASES[0];

  async function apiFetch(path) {
    let lastError = new Error("Unable to reach backend.");
    for (const base of [workingApiBase, ...API_BASES]) {
      if (!base) continue;
      try {
        const response = await fetch(`${base}${path}`);
        const data = await response.json();
        if (!response.ok || data.success === false) {
          throw new Error(data.message || "Request failed.");
        }
        workingApiBase = base;
        localStorage.setItem("safeherlife-working-api-base", base);
        localStorage.setItem("safe_her_life-working-api-base", base);
        return data;
      } catch (error) {
        lastError = error;
      }
    }
    throw lastError;
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function badgeLabel(status) {
    const key = String(status || '').toLowerCase();
    if (key === 'official_command_post') return 'Verified 2026 command post';
    return key === 'official_directory' ? 'Official directory' : 'Escalation line';
  }

  function badgeClass(status) {
    const key = String(status || '').toLowerCase();
    return key === 'official_directory' || key === 'official_command_post' ? 'verified' : 'escalation';
  }

  function renderActionLinks(item) {
    return `
      <div class="actions">
        ${item.telLink ? `<a class="action-link" href="${item.telLink}">Call</a>` : ""}
        ${item.whatsappLink ? `<a class="action-link" href="${item.whatsappLink}" target="_blank" rel="noopener noreferrer">WhatsApp</a>` : ""}
        ${item.mapsSearchUrl ? `<a class="action-link" href="${item.mapsSearchUrl}" target="_blank" rel="noopener noreferrer">Map</a>` : ""}
      </div>
    `;
  }

  function renderHotlines(item) {
    const hotlines = Array.isArray(item.hotlines) ? item.hotlines : [];
    if (!hotlines.length) return '';
    return `
      <div class="division-list">
        ${hotlines.map((line) => `
          <article class="division-card">
            <div class="division-head">
              <div>
                <h4>${escapeHtml(line.label || 'Hotline')}</h4>
                <p>${escapeHtml(line.phoneDisplay || line.phone || 'Not listed')}</p>
              </div>
              <span class="badge ${badgeClass(line.verificationStatus)}">${badgeLabel(line.verificationStatus)}</span>
            </div>
            ${renderActionLinks(line)}
          </article>
        `).join('')}
      </div>
    `;
  }

  function renderDirectory(items) {
    if (!items.length) {
      directoryResults.innerHTML = '<div class="result-card">No police command or division matched your search.</div>';
      return;
    }

    directoryResults.innerHTML = items.map((item, index) => {
      const divisions = Array.isArray(item.divisions) ? item.divisions : [];
      return `
        <article class="accordion-card">
          <button class="accordion-trigger" type="button" data-accordion-trigger="${index}" aria-expanded="${index === 0 ? 'true' : 'false'}">
            <div>
              <div class="accordion-eyebrow">${escapeHtml(item.state)}</div>
              <h3>${escapeHtml(item.command)}</h3>
              <p>${escapeHtml(item.pproName || 'Police spokesperson not listed')} · ${escapeHtml(item.phoneDisplay || item.phone || 'No phone listed')} ${item.lastVerified ? `· verified ${escapeHtml(item.lastVerified)}` : ''}</p>
            </div>
            <div class="accordion-meta">
              <span class="badge ${badgeClass(item.verificationStatus)}">${badgeLabel(item.verificationStatus)}</span>
              <span class="count-pill">${divisions.length} local point(s)</span>
            </div>
          </button>
          <div class="accordion-panel ${index === 0 ? 'is-open' : ''}">
            <div class="command-card">
              <div class="meta-grid">
                <div><strong>State command</strong><span>${escapeHtml(item.state)}</span></div>
                <div><strong>PPRO</strong><span>${escapeHtml(item.pproName || 'Not listed')}</span></div>
                <div><strong>Command line</strong><span>${escapeHtml(item.phoneDisplay || item.phone || 'Not listed')}</span></div>
                <div><strong>Last verified</strong><span>${escapeHtml(item.lastVerified || 'Not listed')}</span></div>
                <div><strong>Source</strong><span><a href="${escapeHtml(item.sourceUrl || '#')}" target="_blank" rel="noopener noreferrer">${escapeHtml(item.sourceTitle || 'Source')}</a></span></div>
              </div>
              ${renderActionLinks(item)}
            </div>
            ${renderHotlines(item)}
            <div class="division-list">
              ${divisions.length ? divisions.map((division) => `
                <article class="division-card">
                  <div class="division-head">
                    <div>
                      <h4>${escapeHtml(division.name)}</h4>
                      <p>${escapeHtml(division.contactRole || 'Division coverage point')}</p>
                    </div>
                    <span class="badge ${badgeClass(division.verificationStatus)}">${badgeLabel(division.verificationStatus)}</span>
                  </div>
                  <div class="meta-grid compact">
                    <div><strong>Active line</strong><span>${escapeHtml(division.phoneDisplay || division.activePhone || item.phoneDisplay || 'Not listed')}</span></div>
                    <div><strong>Routing</strong><span>${division.inheritsStateCommandPhone ? 'Uses state command line' : 'Local division line'}</span></div>
                  </div>
                  <p class="division-note">${escapeHtml(division.notes || '')}</p>
                  ${renderActionLinks(division)}
                </article>
              `).join("") : '<div class="division-card">No local division coverage points have been added for this command yet.</div>'}
            </div>
          </div>
        </article>
      `;
    }).join("");

    directoryResults.querySelectorAll("[data-accordion-trigger]").forEach((button) => {
      button.addEventListener("click", () => {
        const panel = button.parentElement.querySelector(".accordion-panel");
        const open = panel.classList.toggle("is-open");
        button.setAttribute("aria-expanded", open ? "true" : "false");
      });
    });
  }

  function renderNearby(payload) {
    const stations = payload.results || [];
    resultCount.textContent = `${stations.length} nearby police result(s)`;
    geoResult.classList.remove("hidden");
    geoResult.innerHTML = `
      <strong>Matched location:</strong> ${escapeHtml(payload.geocodedLocation?.displayName || payload.searchedLocation)}<br>
      ${payload.fallbackContact ? `<strong>State command fallback:</strong> ${escapeHtml(payload.fallbackContact.command)} — ${escapeHtml(payload.fallbackContact.phoneDisplay || payload.fallbackContact.phone || 'No phone listed')}` : ""}
    `;

    const cards = [];
    if (payload.fallbackContact) {
      cards.push(`
        <article class="result-card">
          <h3>Official state command fallback</h3>
          <div class="meta">
            <div><strong>Command:</strong> ${escapeHtml(payload.fallbackContact.command)}</div>
            <div><strong>Spokesperson:</strong> ${escapeHtml(payload.fallbackContact.pproName || 'Not listed')}</div>
            <div><strong>Phone:</strong> ${escapeHtml(payload.fallbackContact.phoneDisplay || payload.fallbackContact.phone || 'Not listed')}</div>
          </div>
          ${renderActionLinks(payload.fallbackContact)}
        </article>
      `);
    }

    if (!stations.length) {
      cards.push('<div class="result-card">No nearby station came back from live map data for this search. Try a bigger radius or use the command fallback above.</div>');
    }

    stations.forEach((item) => {
      cards.push(`
        <article class="result-card">
          <h3>${escapeHtml(item.name)}</h3>
          <div class="meta">
            <div><strong>Distance:</strong> ${escapeHtml(item.distanceKm)} km</div>
            <div><strong>Phone:</strong> ${escapeHtml(item.phone || 'Not listed in map data')}</div>
            <div><strong>Address:</strong> ${escapeHtml(item.address || 'Address not listed')}</div>
            <div><strong>Coordinates:</strong> ${escapeHtml(item.lat)}, ${escapeHtml(item.lon)}</div>
          </div>
          <div class="actions">
            ${item.phone ? `<a class="action-link" href="tel:${escapeHtml(item.phone)}">Call now</a>` : ""}
            <a class="action-link" href="${item.mapUrl}" target="_blank" rel="noopener noreferrer">OpenStreetMap</a>
            <a class="action-link" href="${item.googleMapsUrl}" target="_blank" rel="noopener noreferrer">Google Maps</a>
          </div>
        </article>
      `);
    });

    nearbyResults.innerHTML = cards.join("");
  }

  async function loadStates() {
    directoryStatus.textContent = "Loading police command directory...";
    const data = await apiFetch("/police-contacts/states");
    const options = ['<option value="">Select state command</option>']
      .concat((data.states || []).map((state) => `<option value="${state}">${state}</option>`));
    stateSelect.innerHTML = options.join("");
    directoryStatus.textContent = "Police command directory loaded.";
  }

  async function searchDirectory(query = "") {
    directoryStatus.textContent = query ? `Searching directory for ${query}...` : "Loading all police commands...";
    const data = await apiFetch(`/police-contacts/directory${query ? `?q=${encodeURIComponent(query)}` : ""}`);
    renderDirectory(data.results || []);
    directoryStatus.textContent = `${data.count || 0} command record(s) shown.`;
  }

  lookupForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const location = locationInput.value.trim();
    const radiusMeters = radiusInput.value;
    if (!location) {
      lookupStatus.textContent = "Enter a location in Nigeria first.";
      return;
    }
    lookupStatus.textContent = `Searching live police results for ${location}...`;
    nearbyResults.innerHTML = "";
    resultCount.textContent = "Searching...";
    try {
      const payload = await apiFetch(`/police-contacts/lookup?location=${encodeURIComponent(location)}&radiusMeters=${encodeURIComponent(radiusMeters)}`);
      renderNearby(payload);
      lookupStatus.textContent = "Live police lookup completed.";
    } catch (error) {
      lookupStatus.textContent = error.message || "Unable to run police lookup.";
      nearbyResults.innerHTML = '<div class="result-card">Search failed. Check your backend connection and try again.</div>';
    }
  });

  searchDirectoryBtn.addEventListener("click", async () => {
    try {
      await searchDirectory(directoryInput.value.trim() || stateSelect.value || "");
    } catch (error) {
      directoryStatus.textContent = error.message || "Unable to search directory.";
    }
  });

  loadAllBtn.addEventListener("click", async () => {
    directoryInput.value = "";
    stateSelect.value = "";
    try {
      await searchDirectory("");
    } catch (error) {
      directoryStatus.textContent = error.message || "Unable to load directory.";
    }
  });

  stateSelect.addEventListener("change", async () => {
    if (!stateSelect.value) return;
    directoryInput.value = stateSelect.value;
    try {
      await searchDirectory(stateSelect.value);
    } catch (error) {
      directoryStatus.textContent = error.message || "Unable to search selected state.";
    }
  });

  window.addEventListener("DOMContentLoaded", async () => {
    try {
      await loadStates();
      await searchDirectory("");
    } catch (error) {
      directoryStatus.textContent = error.message || "Unable to load police contact system.";
    }
  });
})();
