export type ContactPreference = 'anonymous' | 'email' | 'sms' | 'call' | 'phone';
export type CaseStatus = 'Submitted' | 'Assigned' | 'Reviewing' | 'Resolved';

export interface DraftReportPayload {
  incidentType: string;
  location: string;
  incidentDetails: string;
  evidence: {
    photos: number;
    screenshots: number;
    audioNotes: number;
  };
  contact: {
    preference: ContactPreference;
    value: string;
  };
}

export interface CaseTimelineItem {
  label: string;
  note: string;
  createdAt: string;
}

export interface CaseMessage {
  _id: string;
  senderRole: 'user' | 'worker' | 'admin';
  senderName: string;
  message: string;
  createdAt: string;
}

export interface CaseRecord extends DraftReportPayload {
  _id: string;
  caseId: string;
  status: CaseStatus;
  priority: 'Normal' | 'High';
  assignedOfficer: string;
  assignedTo?: string;
  timeline: CaseTimelineItem[];
  messages: CaseMessage[];
  createdAt: string;
  updatedAt: string;
  locationType?: string;
  description?: string;
  contactPreference?: ContactPreference;
  email?: string;
  phone?: string;
}

export interface CasesResponse {
  metrics: {
    totalCases: number;
    totalOpenCases: number;
    highPriorityAlerts: number;
    activeSupportOfficers: number;
  };
  cases: CaseRecord[];
}

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options?.headers || {}),
    },
    ...options,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data?.message || data?.error || 'Request failed.');
  }

  return data as T;
}

export function createAccessPin() {
  return request<{ pin: string; message: string }>('/pin/create-pin', { method: 'POST' });
}

export function validateAccessPin(pin: string) {
  return request<{ valid: boolean; message: string }>('/pin/validate', {
    method: 'POST',
    body: JSON.stringify({ pin }),
  });
}

export function createCase(payload: DraftReportPayload) {
  return request<CaseRecord>('/cases', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function fetchCases() {
  return request<CasesResponse>('/cases');
}

export function fetchCaseById(caseId: string) {
  return request<CaseRecord>(`/cases/${encodeURIComponent(caseId)}`);
}

export function loginAdmin(username: string, password: string) {
  return request<{ role: 'admin'; message: string }>('/auth/admin/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  });
}

export function loginWorker(username: string, password: string) {
  return request<{ role: 'worker'; message: string }>('/auth/worker/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  });
}

export function updateCaseStatus(caseId: string, payload: Partial<Pick<CaseRecord, 'status' | 'assignedOfficer'>> & { note?: string; assignedTo?: string }) {
  return request<CaseRecord>(`/cases/${encodeURIComponent(caseId)}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export function fetchCaseMessages(caseId: string) {
  return request<{ caseId: string; messages: CaseMessage[] }>(`/cases/${encodeURIComponent(caseId)}/messages`);
}

export function sendCaseMessage(caseId: string, payload: { senderRole: 'user' | 'worker' | 'admin'; senderName: string; message: string }) {
  return request<{ caseId: string; messages: CaseMessage[] }>(`/cases/${encodeURIComponent(caseId)}/messages`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}
