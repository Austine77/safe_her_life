import contacts from "../data/policeContacts.json" with { type: "json" };

function normalize(value = "") {
  return String(value || "").trim().toLowerCase();
}

function phoneDisplay(phone = "") {
  const digits = String(phone || "").replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("234")) return `+${digits}`;
  if (digits.startsWith("0")) return `+234${digits.slice(1)}`;
  return `+${digits}`;
}

function buildPhoneLinks(phone = "") {
  const cleaned = String(phone || "").replace(/\D/g, "");
  const local = cleaned.startsWith("234") ? `0${cleaned.slice(3)}` : cleaned;
  const intl = phoneDisplay(cleaned);
  const whatsappNumber = intl.replace(/\+/g, "");
  return {
    phoneDisplay: intl,
    telLink: local ? `tel:${local}` : "",
    whatsappLink: whatsappNumber ? `https://wa.me/${whatsappNumber}` : "",
  };
}

function enrichHotlines(hotlines = []) {
  return Array.isArray(hotlines) ? hotlines.map((item) => ({
    ...item,
    ...buildPhoneLinks(item.phone),
  })) : [];
}

function buildDivisionMapsLink(state = "", division = "") {
  const q = encodeURIComponent(`${division} police division ${state} Nigeria`);
  return `https://www.google.com/maps/search/?api=1&query=${q}`;
}

function enrichDivision(stateItem = {}, division = {}) {
  const activePhone = division.localPhone || (division.inheritsStateCommandPhone ? stateItem.phone : "");
  return {
    ...division,
    state: stateItem.state,
    command: stateItem.command,
    pproName: stateItem.pproName,
    activePhone,
    sourceTitle: division.sourceTitle || stateItem.sourceTitle || "Nigeria Police Force contact directory",
    sourceUrl: division.sourceUrl || stateItem.sourceUrl || "https://www.npf.gov.ng/contact/display",
    ...buildPhoneLinks(activePhone),
    mapsSearchUrl: buildDivisionMapsLink(stateItem.state, division.name),
  };
}

function enrichState(item = {}) {
  const divisions = Array.isArray(item.divisions) ? item.divisions.map((division) => enrichDivision(item, division)) : [];
  const hotlines = enrichHotlines(item.hotlines || []);
  return {
    ...item,
    ...buildPhoneLinks(item.phone),
    hotlines,
    divisions,
    divisionCount: divisions.length,
  };
}

export function getAllPoliceContacts() {
  return contacts.map(enrichState).sort((a, b) => a.state.localeCompare(b.state));
}

export function getPoliceStates() {
  return getAllPoliceContacts().map((item) => item.state);
}

export function getPoliceHierarchy() {
  return getAllPoliceContacts();
}

export function findPoliceStateContact(query = "") {
  const q = normalize(query);
  if (!q) return null;
  return getAllPoliceContacts().find((item) => {
    const haystacks = [item.state, item.command, item.pproName, ...(item.keywords || [])]
      .map(normalize)
      .filter(Boolean);
    return haystacks.some((value) => value.includes(q) || q.includes(value));
  }) || null;
}

export function searchPoliceContacts(query = "") {
  const q = normalize(query);
  const items = getAllPoliceContacts();
  if (!q) return items;

  return items
    .map((item) => {
      const stateHaystacks = [item.state, item.command, item.pproName, ...(item.keywords || [])].map(normalize).filter(Boolean);
      const matchedDivisions = (item.divisions || []).filter((division) => {
        const divisionHaystacks = [division.name, division.contactRole, division.notes, ...(division.keywords || [])]
          .map(normalize)
          .filter(Boolean);
        return divisionHaystacks.some((value) => value.includes(q) || q.includes(value));
      });

      const stateMatch = stateHaystacks.some((value) => value.includes(q) || q.includes(value));
      if (!stateMatch && !matchedDivisions.length) return null;

      return {
        ...item,
        divisions: matchedDivisions.length ? matchedDivisions : item.divisions,
      };
    })
    .filter(Boolean);
}
