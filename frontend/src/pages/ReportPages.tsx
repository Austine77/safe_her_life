import { Dispatch, SetStateAction, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ReportStepper from '../components/ReportStepper';
import { createCase, CaseRecord } from '../lib/api';
import { ReportDraft } from '../App';

type Props = {
  reportDraft: ReportDraft;
  setReportDraft: Dispatch<SetStateAction<ReportDraft>>;
};

const incidentOptions = ['Sexual harassment', 'Sexual assault', 'Molestation', 'Online harassment', 'Threat / intimidation', 'Other'];
const locationOptions = ['School', 'Home', 'Online', 'Public place', 'Other'];
const contactOptions: Array<{ label: string; value: ReportDraft['contact']['preference'] }> = [
  { label: 'Stay anonymous', value: 'anonymous' },
  { label: 'Email me updates', value: 'email' },
  { label: 'SMS me updates', value: 'sms' },
  { label: 'Let support officer call me', value: 'call' },
];

export function ReportStep1({ reportDraft, setReportDraft }: Props) {
  const navigate = useNavigate();
  return (
    <section className="card">
      <ReportStepper current={1} />
      <h3>What happened?</h3>
      <p>Select the incident type that best matches the situation.</p>
      <div className="option-list">
        {incidentOptions.map((item) => (
          <button
            key={item}
            type="button"
            className={`option-button option ${reportDraft.incidentType === item ? 'selected' : ''}`}
            onClick={() => setReportDraft((prev) => ({ ...prev, incidentType: item }))}
          >
            <span className="radio"></span><span>{item}</span>
          </button>
        ))}
      </div>
      <div className="button-row"><button className="btn btn-primary" onClick={() => navigate('/report/step-2')}>Next</button><button className="btn btn-secondary" onClick={() => navigate('/home')}>Cancel</button></div>
    </section>
  );
}

export function ReportStep2({ reportDraft, setReportDraft }: Props) {
  const navigate = useNavigate();
  return (
    <section className="card">
      <ReportStepper current={2} />
      <h3>Where did this happen?</h3>
      <p>Location is optional for safety. You can skip this step if you do not want to share it.</p>
      <div className="option-list">
        {locationOptions.map((item) => (
          <button
            key={item}
            type="button"
            className={`option-button option ${reportDraft.location === item ? 'selected' : ''}`}
            onClick={() => setReportDraft((prev) => ({ ...prev, location: item }))}
          >
            <span className="radio"></span><span>{item}</span>
          </button>
        ))}
      </div>
      <div className="button-row"><button className="btn btn-secondary" onClick={() => setReportDraft((prev) => ({ ...prev, location: 'Not shared' }))}>Skip for safety</button><button className="btn btn-primary" onClick={() => navigate('/report/step-3')}>Next</button><button className="btn btn-secondary" onClick={() => navigate('/report/step-1')}>Back</button></div>
    </section>
  );
}

export function ReportStep3({ reportDraft, setReportDraft }: Props) {
  const navigate = useNavigate();
  return (
    <section className="card">
      <ReportStepper current={3} />
      <h3>Tell us what happened</h3>
      <p>Share as much or as little as you want.</p>
      <div className="form-gap"><textarea value={reportDraft.incidentDetails} onChange={(e) => setReportDraft((prev) => ({ ...prev, incidentDetails: e.target.value }))} placeholder="Write what happened in your own words..." /></div>
      <div className="button-row"><button className="btn btn-primary" onClick={() => navigate('/report/step-4')}>Next</button><button className="btn btn-secondary" onClick={() => navigate('/report/step-2')}>Back</button></div>
    </section>
  );
}

export function ReportStep4({ reportDraft, setReportDraft }: Props) {
  const navigate = useNavigate();
  const increaseEvidence = (key: keyof ReportDraft['evidence']) => {
    setReportDraft((prev) => ({
      ...prev,
      evidence: {
        ...prev.evidence,
        [key]: prev.evidence[key] + 1,
      },
    }));
  };

  return (
    <section className="card">
      <ReportStepper current={4} />
      <h3>Add supporting evidence</h3>
      <p>Optional evidence can help, but you can continue safely without it.</p>
      <div className="upload-grid form-gap">
        <button type="button" className="upload-box option-button" onClick={() => increaseEvidence('photos')}><strong>Upload Photo</strong><p>{reportDraft.evidence.photos} file(s) selected</p></button>
        <button type="button" className="upload-box option-button" onClick={() => increaseEvidence('screenshots')}><strong>Upload Screenshot</strong><p>{reportDraft.evidence.screenshots} file(s) selected</p></button>
        <button type="button" className="upload-box option-button" onClick={() => increaseEvidence('audioNotes')}><strong>Audio Note</strong><p>{reportDraft.evidence.audioNotes} file(s) selected</p></button>
      </div>
      <div className="button-row"><button className="btn btn-primary" onClick={() => navigate('/report/step-5')}>Next</button><button className="btn btn-secondary" onClick={() => navigate('/report/step-3')}>Back</button></div>
    </section>
  );
}

type FinalStepProps = Props & {
  onSubmittedCase: (caseRecord: CaseRecord) => void;
  onTrackCaseId: (caseId: string) => void;
};

export function ReportStep5({ reportDraft, setReportDraft, onSubmittedCase, onTrackCaseId }: FinalStepProps) {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const submitReport = async () => {
    setIsSubmitting(true);
    setError('');
    try {
      const caseRecord = await createCase(reportDraft);
      onSubmittedCase(caseRecord);
      onTrackCaseId(caseRecord.caseId);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('safevoice:case-created', { detail: caseRecord }));
      }
      navigate('/case-created');
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : 'Unable to submit report.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="card">
      <ReportStepper current={5} />
      <h3>How should we contact you?</h3>
      <p>Anonymous by default. You control whether to share contact details.</p>
      <div className="option-list">
        {contactOptions.map((item) => (
          <button
            key={item.value}
            type="button"
            className={`option-button option ${reportDraft.contact.preference === item.value ? 'selected' : ''}`}
            onClick={() => setReportDraft((prev) => ({ ...prev, contact: { ...prev.contact, preference: item.value, value: item.value === 'anonymous' ? '' : prev.contact.value } }))}
          >
            <span className="radio"></span><span>{item.label}</span>
          </button>
        ))}
      </div>
      <div className="form-gap"><input value={reportDraft.contact.value} onChange={(e) => setReportDraft((prev) => ({ ...prev, contact: { ...prev.contact, value: e.target.value } }))} placeholder="Optional email or phone" disabled={reportDraft.contact.preference === 'anonymous'} /></div>
      {error ? <p className="error-text">{error}</p> : null}
      <div className="button-row"><button className="btn btn-primary" onClick={submitReport} disabled={isSubmitting}>{isSubmitting ? 'Submitting...' : 'Submit Report'}</button><button className="btn btn-secondary" onClick={() => navigate('/report/step-4')}>Back</button></div>
    </section>
  );
}
