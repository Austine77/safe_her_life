let ioInstance = null;

export function setIo(instance) {
  ioInstance = instance;
}

export function getIo() {
  return ioInstance;
}

export function emitCaseCreated(caseItem) {
  if (!ioInstance || !caseItem) return;
  ioInstance.emit('case-created', { case: caseItem });
}

export function emitCaseUpdated(caseItem) {
  if (!ioInstance || !caseItem) return;
  ioInstance.emit('case-updated', { case: caseItem });
  if (caseItem.caseId) {
    ioInstance.to(`case:${caseItem.caseId}`).emit('case-status-changed', { case: caseItem });
  }
}

export function emitCaseMessage(caseItem, messageItem = null) {
  if (!ioInstance || !caseItem) return;
  const payload = { caseId: caseItem.caseId, case: caseItem, message: messageItem };
  ioInstance.emit('case-updated', { case: caseItem });
  if (caseItem.caseId) {
    ioInstance.to(`case:${caseItem.caseId}`).emit('case-message', payload);
  }
}
