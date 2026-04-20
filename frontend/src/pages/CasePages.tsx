import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CaseRecord, fetchCaseById } from '../lib/api';

type CaseCreatedProps = {
  submittedCase: CaseRecord | null;
};

export function CaseCreated({ submittedCase }: CaseCreatedProps) {
  const caseId = submittedCase?.caseId || 'Pending';

  return (
    <section className="card hero">
      <span className="badge safe">Report shared safely</span>
      <h3 className="section-title">Your report has been created successfully</h3>
      <div className="case-id">{caseId}</div>
      <p>A support officer will review this report shortly. Save this case ID so you can track updates and open secure chat later without revealing your identity.</p>
      <div className="button-row"><Link className="btn btn-primary link-button" to="/tracking">Track case</Link><button className="btn btn-secondary" onClick={() => navigator.clipboard?.writeText(caseId)}>Copy Case ID</button><Link className="btn btn-teal link-button" to="/chat">Open secure chat</Link></div>
    </section>
  );
}

type TrackingProps = {
  trackingCaseId: string;
  onTrackCaseId: (caseId: string) => void;
  submittedCase: CaseRecord | null;
};

export function TrackingPage({ trackingCaseId, onTrackCaseId, submittedCase }: TrackingProps) {
  const navigate = useNavigate();
  const [caseData, setCaseData] = useState<CaseRecord | null>(submittedCase);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (submittedCase?.caseId && !trackingCaseId) {
      onTrackCaseId(submittedCase.caseId);
      setCaseData(submittedCase);
    }
  }, [submittedCase, trackingCaseId, onTrackCaseId]);

  const handleLookup = async () => {
    if (!trackingCaseId.trim()) {
      setError('Enter a case ID to continue.');
      return;
    }

    setIsLoading(true);
    setError('');
    try {
      const result = await fetchCaseById(trackingCaseId.trim());
      setCaseData(result);
    } catch (lookupError) {
      setCaseData(null);
      setError(lookupError instanceof Error ? lookupError.message : 'Unable to load case.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="grid grid-2">
      <div className="card">
        <h3>Track Case</h3>
        <div className="form-gap"><input value={trackingCaseId} onChange={(e) => onTrackCaseId(e.target.value.toUpperCase())} placeholder="Enter case ID e.g. SV-20260324-ABC123" /></div>
        <div className="button-row"><button className="btn btn-primary" onClick={handleLookup} disabled={isLoading}>{isLoading ? 'Checking...' : 'Check Status'}</button></div>
        {error ? <p className="error-text">{error}</p> : null}
        {caseData ? (
          <>
            <p>Case ID: <strong>{caseData.caseId}</strong></p>
            <p>Status: <strong>{caseData.status}</strong></p>
            <p>Assigned Officer: <strong>{caseData.assignedOfficer}</strong></p>
            <div className="timeline">
              {caseData.timeline.map((item) => (
                <div key={`${item.label}-${item.createdAt}`} className="timeline-item"><strong>{item.label}</strong><p>{item.note}</p></div>
              ))}
            </div>
          </>
        ) : null}
      </div>
      <div className="card">
        <h3>Next actions</h3>
        <div className="support-grid single-column form-gap">
          <div className="support-card"><strong>Continue chat</strong><p>Open secure support messaging tied to this case ID.</p></div>
          <div className="support-card"><strong>Find nearby help</strong><p>Locate local services and safe spaces.</p></div>
          <div className="support-card"><strong>Emergency help</strong><p>Use urgent help actions when safe.</p></div>
        </div>
        <div className="button-row"><button className="btn btn-teal" onClick={() => navigate('/chat')}>Open secure chat</button></div>
      </div>
    </div>
  );
}
