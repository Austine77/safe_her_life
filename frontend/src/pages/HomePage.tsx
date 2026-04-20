import { Link } from 'react-router-dom';

export default function HomePage() {
  return (
    <div className="grid grid-2">
      <div className="card hero">
        <h3>You are safe here.</h3>
        <p>Report abuse anonymously, get support quickly, chat with a social worker, and track your case with calm, clear steps.</p>
        <div className="cta-grid">
          <Link className="cta-card link-card" to="/report/step-1"><strong>Report Abuse</strong><span>Start the secure 5-step reporting flow.</span></Link>
          <Link className="cta-card link-card" to="/emergency"><strong>Emergency Help</strong><span>Access urgent support actions fast.</span></Link>
          <Link className="cta-card link-card" to="/tracking"><strong>Track Case</strong><span>Enter your case ID and monitor progress privately.</span></Link>
          <Link className="cta-card link-card" to="/chat"><strong>Secure Chat</strong><span>Send messages directly to your assigned social worker.</span></Link>
          <Link className="cta-card link-card" to="/support"><strong>Find Support</strong><span>See shelters, hospitals, and legal aid options.</span></Link>
          <Link className="cta-card link-card" to="/resources"><strong>Learn Your Rights</strong><span>Simple articles and safety guidance.</span></Link>
        </div>
      </div>
      <div className="stats">
        <div className="stat"><b>Anonymous</b><span>Identity stays hidden by default unless the user chooses to share contact details.</span></div>
        <div className="stat"><b>Real dashboards</b><span>New cases appear on the admin dashboard and the social worker dashboard from MongoDB.</span></div>
        <div className="stat"><b>Route-safe refresh</b><span>Refreshing the page keeps the user on the same page instead of returning to the calculator.</span></div>
      </div>
    </div>
  );
}
