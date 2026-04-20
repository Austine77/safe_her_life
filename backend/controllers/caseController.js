import CaseReport from '../models/CaseReport.js';
import { emitCaseCreated, emitCaseUpdated, emitCaseMessage } from '../realtime.js';

function normalizeString(value, fallback = '') {
  if (value === null || value === undefined) return fallback;
  const normalized = String(value).trim();
  return normalized || fallback;
}

function normalizeCaseId(value) {
  const normalized = normalizeString(value).toUpperCase();
  return normalized ? normalized.replace(/[^A-Z0-9-]/g, '') : '';
}

function toCount(value) {
  const parsed = Number(value || 0);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

function normalizeStatus(value, fallback = 'Submitted') {
  const normalized = String(value || '').trim().toLowerCase();
  if (normalized === 'resolved') return 'Resolved';
  if (normalized === 'closed') return 'Closed';
  if (normalized === 'reviewing' || normalized === 'in review') return 'Reviewing';
  if (normalized === 'assigned') return 'Assigned';
  if (normalized === 'open') return 'Open';
  if (normalized === 'submitted' || !normalized) return 'Submitted';
  return fallback;
}

function normalizePriority(value, location = '', fallback = 'Normal') {
  const normalized = String(value || '').trim().toLowerCase();
  if (normalized === 'high' || normalized === 'urgent') return 'High';
  if (normalized === 'normal' || !normalized) {
    return String(location || '').toLowerCase().includes('school') ? 'High' : fallback;
  }
  return fallback;
}


function normalizeReportLanguage(value, fallback = 'English') {
  const normalized = String(value || '').trim().toLowerCase();
  if (!normalized) return fallback;
  const map = {
    english: 'English',
    yoruba: 'Yoruba',
    hausa: 'Hausa',
    igbo: 'Igbo',
    pidgin: 'Nigerian Pidgin',
    fulfulde: 'Fulfulde',
    tiv: 'Tiv',
    ibibio: 'Ibibio',
    edo: 'Edo',
    efik: 'Efik',
    kanuri: 'Kanuri',
    other: 'Other Indigenous Language',
  };
  return map[normalized] || String(value || '').trim();
}

function tokenizeLocation(value = '') {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .split(/\s+/)
    .map((item) => item.trim())
    .filter((item) => item && item.length > 2);
}

function buildCommunityRiskSnapshot({ location = '', incidentType = '', existingCases = [] }) {
  const normalizedLocation = normalizeString(location, 'Not shared');
  const loweredLocation = normalizedLocation.toLowerCase();
  const loweredIncident = String(incidentType || '').toLowerCase();
  const tokens = tokenizeLocation(normalizedLocation);

  let riskScore = 18;
  const matchedSignals = [];

  const keywordSignals = [
    { test: /school|hostel|campus/, label: 'School surroundings mentioned', score: 16 },
    { test: /market|park|bus stop|junction/, label: 'Busy public meeting point', score: 10 },
    { test: /street|road|route|bridge/, label: 'Open route or street mentioned', score: 8 },
    { test: /isolated|bush|abandoned|dark|night/, label: 'Isolation or low-visibility signal', score: 22 },
    { test: /home|house|compound/, label: 'Residential setting mentioned', score: 9 },
  ];

  keywordSignals.forEach((signal) => {
    if (signal.test.test(loweredLocation) || signal.test.test(loweredIncident)) {
      riskScore += signal.score;
      matchedSignals.push(signal.label);
    }
  });

  const similarCases = existingCases.filter((item) => {
    const itemLocation = String(item.location || '').toLowerCase();
    if (!itemLocation) return false;
    if (loweredLocation && itemLocation.includes(loweredLocation)) return true;
    return tokens.some((token) => itemLocation.includes(token));
  });

  if (similarCases.length) {
    riskScore += Math.min(28, similarCases.length * 8);
    matchedSignals.push(`${similarCases.length} similar community report${similarCases.length > 1 ? 's' : ''}`);
  }

  const highPriorityCases = similarCases.filter((item) => String(item.priority || '').toLowerCase() === 'high');
  if (highPriorityCases.length) {
    riskScore += Math.min(18, highPriorityCases.length * 6);
    matchedSignals.push('High-priority reports linked to the area');
  }

  const openCases = similarCases.filter((item) => !['resolved', 'closed'].includes(String(item.status || '').toLowerCase()));
  if (openCases.length >= 2) {
    riskScore += 10;
    matchedSignals.push('Multiple active cases still under review');
  }

  riskScore = Math.max(12, Math.min(98, riskScore));
  const riskLevel = riskScore >= 75 ? 'High' : riskScore >= 45 ? 'Medium' : 'Low';

  let advisory = 'Stay alert and use trusted support channels if anything feels unsafe.';
  if (riskLevel === 'High') {
    advisory = 'This area has repeated risk signals. Avoid isolated movement there when possible and use the in-app support options quickly.';
  } else if (riskLevel === 'Medium') {
    advisory = 'This area shows some caution signals from past reports or location patterns. Move carefully and share your route with someone you trust when possible.';
  }

  return {
    areaLabel: normalizedLocation,
    riskLevel,
    riskScore,
    matchedSignals: [...new Set(matchedSignals)].slice(0, 5),
    advisory,
  };
}

export async function getCommunityRiskSuggestions(req, res) {
  try {
    const requestedLocation = normalizeString(req.query.location || req.query.area || req.params.location, '');
    if (!requestedLocation) {
      return res.status(400).json({ message: 'Location or area is required.' });
    }

    const caseItems = await CaseReport.find().sort({ createdAt: -1 }).lean();
    const snapshot = buildCommunityRiskSnapshot({
      location: requestedLocation,
      incidentType: String(req.query.incidentType || ''),
      existingCases: caseItems,
    });

    return res.json({
      area: snapshot.areaLabel,
      communityRisk: snapshot,
      supportedLanguages: ['English', 'Yoruba', 'Hausa', 'Igbo', 'Nigerian Pidgin', 'Other Indigenous Language'],
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Unable to generate community safety insights.',
      error: error.message,
    });
  }
}

function normalizeContact(payload = {}) {
  const preference = String(
    payload.contactPreference || payload.contact?.preference || 'anonymous'
  )
    .trim()
    .toLowerCase();

  const directValue = String(payload.contact?.value || '').trim();
  const email = String(payload.email || '').trim();
  const phone = String(payload.phone || '').trim();

  if (preference === 'email') {
    return { preference: 'email', value: email || directValue };
  }

  if (preference === 'phone' || preference === 'call' || preference === 'sms') {
    return {
      preference: preference === 'phone' ? 'call' : preference,
      value: phone || directValue,
    };
  }

  return { preference: 'anonymous', value: '' };
}

function serializeMessage(messageItem = {}) {
  const item = messageItem.toObject ? messageItem.toObject() : messageItem;
  const senderRole = String(item.senderRole || item.role || item.sender || 'user').toLowerCase();
  const senderName =
    item.senderName ||
    (senderRole === 'admin'
      ? 'Admin'
      : senderRole === 'worker'
        ? 'Social worker'
        : 'Anonymous user');
  const text = item.message || item.text || item.body || '';
  const voiceNoteData = item.voiceNoteData || item.audioData || '';
  const voiceNoteMimeType = item.voiceNoteMimeType || item.audioMimeType || '';
  const voiceNoteFileName = item.voiceNoteFileName || item.audioFileName || '';

  const serialized = {
    ...item,
    senderRole,
    senderName,
    sender: senderRole,
    role: senderRole,
    text,
    message: text,
    voiceNoteData,
    voiceNoteMimeType,
    voiceNoteFileName,
    voiceNoteUrl: voiceNoteData,
  };
}

function serializeCase(caseItem, options = {}) {
  const includeInternal = Boolean(options.includeInternal);
  const item = caseItem.toObject ? caseItem.toObject() : caseItem;
  const contactPreference = item.contact?.preference || 'anonymous';
  const contactValue = item.contact?.value || '';
  const email = contactPreference === 'email' ? contactValue : '';
  const phone = ['sms', 'call', 'phone'].includes(contactPreference) ? contactValue : '';
  const normalizedStatus = normalizeStatus(item.status, 'Submitted');
  const normalizedPriority = normalizePriority(item.priority, item.location, 'Normal');

  const serialized = {
    ...item,
    status: normalizedStatus,
    priority: normalizedPriority,
    locationType: item.location || 'Not shared',
    description: item.incidentDetails || '',
    originalIncidentDetails: item.originalIncidentDetails || item.incidentDetails || '',
    voiceNoteUrl: item.voiceNoteData || '',
    voiceNoteMimeType: item.voiceNoteMimeType || '',
    voiceNoteFileName: item.voiceNoteFileName || '',
    contactPreference,
    email,
    phone,
    assignedTo: item.assignedOfficer || 'socialworker',
    submittedAt: item.createdAt || item.submittedAt || '',
    reportLanguage: normalizeReportLanguage(item.reportLanguage, 'Not specified'),
    communityRiskSnapshot: item.communityRiskSnapshot || null,
    messages: Array.isArray(item.messages) ? item.messages.map(serializeMessage) : [],
  };

  if (includeInternal) {
    serialized.staffNotes = Array.isArray(item.staffNotes)
      ? item.staffNotes.map((note) => ({
          ...(note.toObject ? note.toObject() : note),
          authorRole: String(note.authorRole || 'worker').toLowerCase(),
          authorName: String(note.authorName || 'Staff').trim() || 'Staff',
          note: String(note.note || '').trim(),
        }))
      : [];
  }

  return serialized;
}


function buildMetrics(cases) {
  const totalOpenCases = cases.filter((item) => normalizeStatus(item.status) !== 'Resolved').length;
  const highPriorityAlerts = cases.filter(
    (item) =>
      normalizePriority(item.priority, item.location || item.locationType) === 'High' &&
      normalizeStatus(item.status) !== 'Resolved'
  ).length;

  return {
    totalCases: cases.length,
    totalOpenCases,
    highPriorityAlerts,
    activeSupportOfficers: Math.max(
      1,
      new Set(cases.map((item) => item.assignedOfficer).filter(Boolean)).size
    ),
  };
}

export async function createCase(req, res) {
  const requestBody = req.body && typeof req.body === 'object' ? req.body : {};

  try {
    const {
      caseId,
      incidentType,
      location,
      locationType,
      incidentDetails,
      description,
      evidence,
      contact,
      contactPreference,
      email,
      phone,
      assignedOfficer,
      assignedTo,
      priority,
      status,
      reporterName,
      reportLanguage,
      originalIncidentDetails,
      voiceNoteData,
      voiceNoteMimeType,
      voiceNoteFileName,
    } = requestBody;

    const normalizedIncidentType = normalizeString(incidentType, 'General abuse report');
    const normalizedLocation = normalizeString(location || locationType, 'Not shared');
    const normalizedOriginalDescription = normalizeString(
      originalIncidentDetails || incidentDetails || description,
      normalizeString(voiceNoteData, '') ? 'Voice note attached. No written text was added.' : 'No details shared.'
    );
    const normalizedContact = normalizeContact({
      contact,
      contactPreference,
      email,
      phone,
    });
    const normalizedAssignedOfficer = normalizeString(
      assignedOfficer || assignedTo,
      'socialworker'
    );
    const normalizedStatus = normalizeStatus(status, 'Submitted');
    const normalizedPriority = normalizePriority(priority, normalizedLocation, 'Normal');
    const normalizedReporterName = normalizeString(reporterName, 'Anonymous user');
    const normalizedClientCaseId = normalizeCaseId(caseId);
    const normalizedReportLanguage = normalizeReportLanguage(reportLanguage, 'Text report');
    const normalizedVoiceNoteData = normalizeString(voiceNoteData, '');
    const normalizedVoiceNoteMimeType = normalizeString(voiceNoteMimeType, '');
    const normalizedVoiceNoteFileName = normalizeString(voiceNoteFileName, '');
    const existingCases = await CaseReport.find({}, { location: 1, priority: 1, status: 1 }).lean();
    const communityRiskSnapshot = buildCommunityRiskSnapshot({
      location: normalizedLocation,
      incidentType: normalizedIncidentType,
      existingCases,
    });

    const casePayload = {
      incidentType: normalizedIncidentType,
      location: normalizedLocation,
      incidentDetails: normalizedOriginalDescription,
      originalIncidentDetails: normalizedOriginalDescription,
      voiceNoteData: normalizedVoiceNoteData,
      voiceNoteMimeType: normalizedVoiceNoteMimeType,
      voiceNoteFileName: normalizedVoiceNoteFileName,
      reportLanguage: normalizedReportLanguage,
      communityRiskSnapshot,
      evidence: {
        photos: toCount(evidence?.photos),
        screenshots: toCount(evidence?.screenshots),
        audioNotes: toCount(evidence?.audioNotes),
      },
      contact: normalizedContact,
      status: normalizedStatus,
      priority: normalizedPriority,
      assignedOfficer: normalizedAssignedOfficer,
      timeline: [
        {
          label: 'Created',
          note: `Report submitted safely by ${normalizedReporterName} and queued for review.`,
          createdAt: new Date(),
        },
        {
          label: 'Assigned',
          note: `Case assigned to ${normalizedAssignedOfficer} for safe follow-up.`,
          createdAt: new Date(),
        },
        {
          label: 'AI safety insight',
          note: `${communityRiskSnapshot.riskLevel} community risk suggested for ${communityRiskSnapshot.areaLabel}.`,
          createdAt: new Date(),
        },
      ],
      messages: [],
      staffNotes: [],
    };

    if (normalizedClientCaseId) {
      casePayload.caseId = normalizedClientCaseId;
    }

    let caseReport;

    try {
      caseReport = await CaseReport.create(casePayload);
    } catch (error) {
      const duplicateClientCaseId = error?.code === 11000 && normalizedClientCaseId;
      if (!duplicateClientCaseId) throw error;

      console.warn(
        `Duplicate client caseId detected (${normalizedClientCaseId}). Retrying with a server-generated ID.`
      );
      delete casePayload.caseId;
      caseReport = await CaseReport.create(casePayload);
    }

    const serializedCase = serializeCase(caseReport);
    emitCaseCreated(serializedCase);
    return res.status(201).json(serializedCase);
  } catch (error) {
    console.error('createCase failed:', {
      message: error?.message,
      code: error?.code,
      name: error?.name,
      errors: error?.errors,
      body: requestBody,
    });

    if (error?.name === 'ValidationError') {
      return res.status(400).json({
        message: 'Case report validation failed.',
        error: error.message,
        details: Object.values(error.errors || {}).map((item) => item.message),
      });
    }

    if (error?.code === 11000) {
      return res.status(409).json({
        message: 'Generated case ID already exists. Please retry.',
      });
    }

    return res.status(500).json({
      message: 'Unable to create case report.',
      error: error.message,
    });
  }
}

export async function getCases(_req, res) {
  try {
    const caseItems = await CaseReport.find().sort({ createdAt: -1 }).lean();
    const includeInternal = String(_req.headers['x-safeherlife-staff'] || '').trim() === '1';
    const cases = caseItems.map((item) => serializeCase(item, { includeInternal }));
    return res.json({ metrics: buildMetrics(cases), cases });
  } catch (error) {
    return res.status(500).json({
      message: 'Unable to fetch cases.',
      error: error.message,
    });
  }
}

export async function getCaseByCaseId(req, res) {
  try {
    const normalizedCaseId = normalizeCaseId(req.params.caseId);
    const caseReport = await CaseReport.findOne({ caseId: normalizedCaseId }).lean();

    if (!caseReport) {
      return res.status(404).json({ message: 'Case not found.' });
    }

    const includeInternal = String(req.headers['x-safeherlife-staff'] || '').trim() === '1';
    return res.json(serializeCase(caseReport, { includeInternal }));
  } catch (error) {
    return res.status(500).json({
      message: 'Unable to fetch case.',
      error: error.message,
    });
  }
}

export async function updateCaseStatus(req, res) {
  try {
    const normalizedCaseId = normalizeCaseId(req.params.caseId);
    const { status, assignedOfficer, assignedTo, note } = req.body || {};
    const caseReport = await CaseReport.findOne({ caseId: normalizedCaseId });

    if (!caseReport) {
      return res.status(404).json({ message: 'Case not found.' });
    }

    if (status) {
      caseReport.status = normalizeStatus(status, caseReport.status || 'Submitted');
    }

    if (assignedOfficer || assignedTo) {
      caseReport.assignedOfficer =
        String(assignedOfficer || assignedTo).trim() || caseReport.assignedOfficer;
    }

    if (note) {
      caseReport.timeline.push({
        label: caseReport.status || 'Updated',
        note: String(note).trim(),
        createdAt: new Date(),
      });
    }

    await caseReport.save();
    const serializedCase = serializeCase(caseReport, { includeInternal: true });
    emitCaseUpdated(serializedCase);
    return res.json(serializedCase);
  } catch (error) {
    return res.status(500).json({
      message: 'Unable to update case.',
      error: error.message,
    });
  }
}


export async function addInternalCaseNote(req, res) {
  try {
    const normalizedCaseId = normalizeCaseId(req.params.caseId);
    const caseReport = await CaseReport.findOne({ caseId: normalizedCaseId });

    if (!caseReport) {
      return res.status(404).json({ message: 'Case not found.' });
    }

    const note = normalizeString(req.body?.note, '');
    if (!note) {
      return res.status(400).json({ message: 'Internal note is required.' });
    }

    const incomingRole = String(req.body?.authorRole || req.body?.role || 'worker').trim().toLowerCase();
    const authorRole = incomingRole === 'admin' ? 'admin' : 'worker';
    const authorName = normalizeString(
      req.body?.authorName,
      authorRole === 'admin' ? 'Admin' : 'Social worker'
    );

    caseReport.staffNotes.push({
      authorRole,
      authorName,
      note,
      createdAt: new Date(),
    });

    await caseReport.save();
    const serializedCase = serializeCase(caseReport, { includeInternal: true });
    emitCaseUpdated(serializedCase);
    return res.json(serializedCase);
  } catch (error) {
    return res.status(500).json({
      message: 'Unable to save internal note.',
      error: error.message,
    });
  }
}

export async function getCaseMessages(req, res) {
  try {
    const normalizedCaseId = normalizeCaseId(req.params.caseId);
    const caseReport = await CaseReport.findOne({ caseId: normalizedCaseId }).lean();

    if (!caseReport) {
      return res.status(404).json({ message: 'Case not found.' });
    }

    return res.json({
      caseId: caseReport.caseId,
      messages: (caseReport.messages || []).map(serializeMessage),
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Unable to fetch case messages.',
      error: error.message,
    });
  }
}

export async function postCaseMessage(req, res) {
  try {
    const normalizedCaseId = normalizeCaseId(req.params.caseId);
    const incomingRole = String(
      req.body.senderRole || req.body.role || req.body.sender || 'user'
    )
      .trim()
      .toLowerCase();

    const senderRole =
      incomingRole === 'socialworker'
        ? 'worker'
        : incomingRole === 'survivor'
          ? 'user'
          : ['user', 'worker', 'admin'].includes(incomingRole)
            ? incomingRole
            : 'user';

    const senderName = String(
      req.body.senderName ||
        req.body.author ||
        (senderRole === 'admin'
          ? 'Admin'
          : senderRole === 'worker'
            ? 'Social worker'
            : 'Anonymous user')
    ).trim();

    const messageText = String(req.body.message || req.body.text || req.body.body || '').trim();
    const voiceNoteData = String(req.body.voiceNoteData || req.body.audioData || '').trim();
    const voiceNoteMimeType = String(req.body.voiceNoteMimeType || req.body.audioMimeType || '').trim();
    const voiceNoteFileName = String(req.body.voiceNoteFileName || req.body.audioFileName || '').trim();

    if (!messageText && !voiceNoteData) {
      return res.status(400).json({ message: 'Message text or a voice note is required.' });
    }

    const caseReport = await CaseReport.findOne({ caseId: normalizedCaseId });
    if (!caseReport) {
      return res.status(404).json({ message: 'Case not found.' });
    }

    caseReport.messages.push({
      senderRole,
      senderName,
      message: messageText,
      voiceNoteData,
      voiceNoteMimeType,
      voiceNoteFileName,
      createdAt: new Date(),
    });

    caseReport.timeline.push({
      label: 'Chat updated',
      note: voiceNoteData && messageText
        ? `New text and voice note sent by ${senderRole}.`
        : voiceNoteData
          ? `New voice note sent by ${senderRole}.`
          : `New message sent by ${senderRole}.`,
      createdAt: new Date(),
    });

    await caseReport.save();

    const serializedCase = serializeCase(caseReport, { includeInternal: true });
    const latestMessage = serializedCase.messages[serializedCase.messages.length - 1] || null;
    emitCaseMessage(serializedCase, latestMessage);

    return res.status(201).json({
      caseId: caseReport.caseId,
      messages: caseReport.messages.map(serializeMessage),
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Unable to send message.',
      error: error.message,
    });
  }
}