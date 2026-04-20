import { Router } from 'express';
import {
  submitReport,
  getReports,
  getReportByCaseId,
  updateReportStatus,
  getReportMessages,
  postReportMessage,
  getReportCommunityRisk,
  addReportInternalNote,
} from '../controllers/reportController.js';

const router = Router();

/*
  Root compatibility routes
  Supports:
  POST /reports
  GET /reports
  POST /api/reports
  GET /api/reports
*/
router.post('/', submitReport);
router.get('/', getReports);

/*
  Main report routes
*/
router.post('/submit-report', submitReport);
router.get('/all-reports', getReports);
router.get('/community-risk', getReportCommunityRisk);

/*
  Message routes must stay before generic /:caseId routes
*/
router.get('/:caseId/messages', getReportMessages);
router.post('/:caseId/messages', postReportMessage);
router.post('/:caseId/internal-note', addReportInternalNote);

/*
  Tracking routes
*/
router.get('/case/:caseId', getReportByCaseId);
router.get('/:caseId', getReportByCaseId);

/*
  Status update routes
*/
router.patch('/:caseId/status', updateReportStatus);

/*
  Compatibility update routes
*/
router.patch('/:caseId', updateReportStatus);
router.put('/:caseId', updateReportStatus);

export default router;