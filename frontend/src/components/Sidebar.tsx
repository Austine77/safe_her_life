import { useEffect, useState } from 'react';
import { ScreenId, screens } from '../data';

type Props = {
  activeScreen: ScreenId;
  onChange: (screen: ScreenId) => void;
};

export default function Sidebar({ activeScreen, onChange }: Props) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleResize = () => {
      if (window.innerWidth > 980) {
        setIsMobileMenuOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleScreenChange = (screen: ScreenId) => {
    onChange(screen);
    setIsMobileMenuOpen(false);
  };

  return (
    <aside className={`sidebar ${isMobileMenuOpen ? 'mobile-open' : ''}`}>
      <div className="sidebar-mobile-top">
        <div className="brand brand-compact">
          <div className="brand-mark">🛡</div>
          <div>
            <h1>SAFEVOICE</h1>
            <p>Private reporting and support</p>
          </div>
        </div>

        <button
          type="button"
          className="menu-toggle"
          aria-label={isMobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
          aria-expanded={isMobileMenuOpen}
          onClick={() => setIsMobileMenuOpen((open) => !open)}
        >
          <span></span>
          <span></span>
          <span></span>
        </button>
      </div>

      <div className="sidebar-panel">
        <div className="brand desktop-brand">
          <div className="brand-mark">🛡</div>
          <div>
            <h1>SAFEVOICE</h1>
            <p>Private reporting, support, and case-tracking platform</p>
          </div>
        </div>

        <div className="sidebar-note">
          Safe public interface for discreet reporting, support, and case tracking. Staff access is handled separately on the web portal.
        </div>

        <div>
          <p className="nav-title">App screens</p>
          <div className="nav-list">
            {screens.map((screen) => (
              <button
                key={screen.id}
                className={`nav-btn ${activeScreen === screen.id ? 'active' : ''}`}
                onClick={() => handleScreenChange(screen.id)}
              >
                {screen.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </aside>
  );
}
