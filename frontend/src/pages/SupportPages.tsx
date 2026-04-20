import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchCaseMessages, sendCaseMessage } from '../lib/api';

type ChatPageProps = {
  trackingCaseId: string;
  onTrackCaseId: (caseId: string) => void;
};

export function ChatPage({ trackingCaseId, onTrackCaseId }: ChatPageProps) {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Array<{ _id: string; senderRole: 'user' | 'worker' | 'admin'; senderName: string; message: string; createdAt: string }>>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [error, setError] = useState('');

  const canLoad = useMemo(() => trackingCaseId.trim().length > 0, [trackingCaseId]);

  const loadMessages = async () => {
    if (!canLoad) return;
    setIsLoading(true);
    setError('');
    try {
      const result = await fetchCaseMessages(trackingCaseId.trim());
      setMessages(result.messages);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to open chat.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!canLoad) return;
    void loadMessages();
  }, [trackingCaseId]);

  const handleSend = async (event: FormEvent) => {
    event.preventDefault();
    if (!trackingCaseId.trim() || !message.trim()) {
      setError('Enter your case ID and message first.');
      return;
    }

    setError('');
    setFeedback('');
    try {
      const result = await sendCaseMessage(trackingCaseId.trim(), {
        senderRole: 'user',
        senderName: 'Anonymous user',
        message: message.trim(),
      });
      setMessages(result.messages);
      setMessage('');
      setFeedback('Message sent to your social worker.');
    } catch (sendError) {
      setError(sendError instanceof Error ? sendError.message : 'Unable to send message.');
    }
  };

  return (
    <section className="card">
      <h3>Secure Chat</h3>
      <p>Use your case ID to message the assigned social worker privately.</p>
      <div className="form-gap"><input value={trackingCaseId} onChange={(e) => onTrackCaseId(e.target.value.toUpperCase())} placeholder="Enter your case ID" /></div>
      <div className="button-row"><button className="btn btn-primary" onClick={() => void loadMessages()} disabled={!canLoad || isLoading}>{isLoading ? 'Opening...' : 'Open chat'}</button></div>
      <div className="chat-box form-gap">
        {messages.length ? messages.map((item) => (
          <div key={item._id} className={`msg ${item.senderRole === 'user' ? 'you' : 'sw'}`}>
            <strong>{item.senderName}</strong>
            <div>{item.message}</div>
          </div>
        )) : <div className="msg sw">No messages yet. Start the conversation when you are ready.</div>}
      </div>
      <form className="form-gap" onSubmit={handleSend}>
        <input value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Type a message..." />
        <div className="button-row"><button className="btn btn-teal" type="submit">Send message</button></div>
      </form>
      {feedback ? <p className="info-text">{feedback}</p> : null}
      {error ? <p className="error-text">{error}</p> : null}
    </section>
  );
}

export function EmergencyPage() {
  return (
    <section className="card hero">
      <span className="badge alert">Immediate support</span>
      <h3 className="section-title">Are you in immediate danger?</h3>
      <p>Use these urgent options only when it is safe to do so.</p>
      <div className="support-grid form-gap">
        <div className="support-card"><strong>Call Emergency Line</strong><p>Fast action for urgent physical danger.</p><div className="button-row"><a className="btn btn-danger link-button" href="tel:112">Call now</a></div></div>
        <div className="support-card"><strong>Alert Nearby Support</strong><p>Tell a trusted adult or social worker immediately.</p><div className="button-row"><Link className="btn btn-primary link-button" to="/chat">Send alert</Link></div></div>
        <div className="support-card"><strong>Find Safe Shelter</strong><p>View the nearest shelter or safe place.</p><div className="button-row"><Link className="btn btn-teal link-button" to="/support">Open support map</Link></div></div>
      </div>
    </section>
  );
}

export function SupportMapPage() {
  return (
    <div className="grid grid-2">
      <div className="card">
        <h3>Find Support Near You</h3>
        <div className="map">
          <span className="map-pin pin-one"></span>
          <span className="map-pin pin-two"></span>
          <span className="map-pin pin-three"></span>
          <span className="map-pin pin-four"></span>
        </div>
        <div className="chips">
          <span className="chip">Hospitals</span>
          <span className="chip">Legal Aid</span>
          <span className="chip">Support Officers</span>
          <span className="chip">Safe Shelters</span>
        </div>
      </div>
      <div className="card">
        <h3>Nearby support options</h3>
        <div className="support-grid single-column form-gap">
          <div className="support-card"><strong>Hope Shelter Centre</strong><p>Safe shelter · 1.4 km away</p></div>
          <div className="support-card"><strong>City Women’s Legal Aid</strong><p>Legal assistance · 2.1 km away</p></div>
          <div className="support-card"><strong>Community Support Desk</strong><p>Confidential support · 900 m away</p></div>
        </div>
      </div>
    </div>
  );
}

export function ResourcesPage() {
  return (
    <section className="card">
      <h3>Resource Library</h3>
      <p>Simple, supportive content designed for users who may be distressed or accessing the app on limited data.</p>
      <div className="form-gap"><input placeholder="Search resources..." /></div>
      <div className="chips">
        <span className="chip">After abuse</span>
        <span className="chip">Legal rights</span>
        <span className="chip">Safe help-seeking</span>
        <span className="chip">Mental health support</span>
      </div>
      <div className="resource-grid form-gap">
        <div className="resource-item"><strong>What to do after abuse</strong><p>Immediate safety steps and how to preserve evidence if safe.</p></div>
        <div className="resource-item"><strong>Legal rights for survivors</strong><p>Clear rights information using simple language.</p></div>
        <div className="resource-item"><strong>How to seek help safely</strong><p>Discreet ways to contact services or trusted adults.</p></div>
        <div className="resource-item"><strong>Mental health support</strong><p>Calming guidance and referral options for emotional recovery.</p></div>
      </div>
    </section>
  );
}
