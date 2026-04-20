import {
  createCase,
  getCases,
  getCaseByCaseId,
  updateCaseStatus,
  getCaseMessages,
  postCaseMessage,
  getCommunityRiskSuggestions,
  addInternalCaseNote,
} from './caseController.js';

/**
 * Submit a new report.
 * Main endpoint for public/user report submissions.
 */
export async function submitReport(req, res) {
  return createCase(req, res);
}

/**
 * Alias for submitReport.
 * Useful if any route file uses createReport instead.
 */
export async function createReport(req, res) {
  return createCase(req, res);
}

/**
 * Fetch all reports/cases for staff dashboard.
 */
export async function getReports(req, res) {
  return getCases(req, res);
}

/**
 * Alias for getReports.
 */
export async function getAllReports(req, res) {
  return getCases(req, res);
}

/**
 * Fetch one report by caseId.
 */
export async function getReportByCaseId(req, res) {
  return getCaseByCaseId(req, res);
}

/**
 * Alias for tracking endpoints.
 */
export async function getReport(req, res) {
  return getCaseByCaseId(req, res);
}

/**
 * Update a report/case status.
 */
export async function updateReportStatus(req, res) {
  return updateCaseStatus(req, res);
}

/**
 * Alias for updateReportStatus.
 */
export async function patchReportStatus(req, res) {
  return updateCaseStatus(req, res);
}

/**
 * Get messages for a report/case.
 */
export async function getReportMessages(req, res) {
  return getCaseMessages(req, res);
}

/**
 * Send a new message to a report/case thread.
 */
export async function postReportMessage(req, res) {
  return postCaseMessage(req, res);
}

/**
 * Alias for postReportMessage.
 */
export async function sendReportMessage(req, res) {
  return postCaseMessage(req, res);
}

export async function getReportCommunityRisk(req, res) {
  return getCommunityRiskSuggestions(req, res);
}

export async function addReportInternalNote(req, res) {
  return addInternalCaseNote(req, res);
}

export default {
  submitReport,
  createReport,
  getReports,
  getAllReports,
  getReportByCaseId,
  getReport,
  updateReportStatus,
  patchReportStatus,
  getReportMessages,
  postReportMessage,
  sendReportMessage,
  addReportInternalNote,
};