import { Router } from 'express';
import { createCase, getCaseByCaseId, getCaseMessages, getCases, postCaseMessage, updateCaseStatus } from '../controllers/caseController.js';

const router = Router();

router.post('/', createCase);
router.get('/', getCases);
router.get('/:caseId', getCaseByCaseId);
router.patch('/:caseId', updateCaseStatus);
router.get('/:caseId/messages', getCaseMessages);
router.post('/:caseId/messages', postCaseMessage);

export default router;
