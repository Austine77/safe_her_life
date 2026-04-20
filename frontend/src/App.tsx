import { useMemo } from 'react';
import { HashRouter, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';
import { getPathForScreen, getScreenByPath, ScreenId } from './data';
import EntryPage from './pages/EntryPage';
import HomePage from './pages/HomePage';
import { ReportStep1, ReportStep2, ReportStep3, ReportStep4, ReportStep5 } from './pages/ReportPages';
import { CaseCreated, TrackingPage } from './pages/CasePages';
import { ChatPage, EmergencyPage, ResourcesPage, SupportMapPage } from './pages/SupportPages';
import { AdminPanelPage, WorkerDashboardPage } from './pages/DashboardPages';
import { CaseRecord } from './lib/api';
import usePersistentState from './hooks/usePersistentState';

export interface ReportDraft {
  incidentType: string;
  location: string;
  incidentDetails: string;
  evidence: {
    photos: number;
    screenshots: number;
    audioNotes: number;
  };
  contact: {
    preference: 'anonymous' | 'email' | 'sms' | 'call';
    value: string;
  };
}

const initialReportDraft: ReportDraft = {
  incidentType: 'Sexual harassment',
  location: 'School',
  incidentDetails: '',
  evidence: {
    photos: 0,
    screenshots: 0,
    audioNotes: 0,
  },
  contact: {
    preference: 'anonymous',
    value: '',
  },
};

function ProtectedRoute({ isUnlocked, children }: { isUnlocked: boolean; children: JSX.Element }) {
  return isUnlocked ? children : <Navigate to="/" replace />;
}

function AppShell() {
  const location = useLocation();
  const navigate = useNavigate();
  const [reportDraft, setReportDraft] = usePersistentState<ReportDraft>('safevoice-report-draft', initialReportDraft);
  const [submittedCase, setSubmittedCase] = usePersistentState<CaseRecord | null>('safevoice-submitted-case', null);
  const [trackingCaseId, setTrackingCaseId] = usePersistentState('safevoice-tracking-case-id', '');
  const [currentAccessPin, setCurrentAccessPin] = usePersistentState('safevoice-access-pin', '');
  const [isUnlocked, setIsUnlocked] = usePersistentState<boolean>('safevoice-is-unlocked', false);

  const currentScreen = useMemo(() => getScreenByPath(location.pathname), [location.pathname]);

  const goTo = (screen: ScreenId) => navigate(getPathForScreen(screen));

  const resetToEntry = () => {
    setTrackingCaseId('');
    setIsUnlocked(false);
    navigate('/');
  };

  if (location.pathname.startsWith('/portal/')) {
    return (
      <Routes>
        <Route path="/portal/admin" element={<AdminPanelPage />} />
        <Route path="/portal/worker" element={<WorkerDashboardPage />} />
      </Routes>
    );
  }

  return (
    <div className="app-shell">
      <Sidebar activeScreen={currentScreen.id} onChange={goTo} />
      <main className="content">
        <Topbar title={currentScreen.title} description={currentScreen.description} onQuickExit={resetToEntry} />
        <Routes>
          <Route path="/" element={isUnlocked ? <Navigate to="/home" replace /> : <EntryPage goHome={() => { setIsUnlocked(true); navigate('/home'); }} onPinCreated={setCurrentAccessPin} currentAccessPin={currentAccessPin} />} />
          <Route path="/home" element={<ProtectedRoute isUnlocked={isUnlocked}><HomePage /></ProtectedRoute>} />
          <Route path="/report/step-1" element={<ProtectedRoute isUnlocked={isUnlocked}><ReportStep1 reportDraft={reportDraft} setReportDraft={setReportDraft} /></ProtectedRoute>} />
          <Route path="/report/step-2" element={<ProtectedRoute isUnlocked={isUnlocked}><ReportStep2 reportDraft={reportDraft} setReportDraft={setReportDraft} /></ProtectedRoute>} />
          <Route path="/report/step-3" element={<ProtectedRoute isUnlocked={isUnlocked}><ReportStep3 reportDraft={reportDraft} setReportDraft={setReportDraft} /></ProtectedRoute>} />
          <Route path="/report/step-4" element={<ProtectedRoute isUnlocked={isUnlocked}><ReportStep4 reportDraft={reportDraft} setReportDraft={setReportDraft} /></ProtectedRoute>} />
          <Route path="/report/step-5" element={<ProtectedRoute isUnlocked={isUnlocked}><ReportStep5 reportDraft={reportDraft} setReportDraft={setReportDraft} onSubmittedCase={setSubmittedCase} onTrackCaseId={setTrackingCaseId} /></ProtectedRoute>} />
          <Route path="/case-created" element={<ProtectedRoute isUnlocked={isUnlocked}><CaseCreated submittedCase={submittedCase} /></ProtectedRoute>} />
          <Route path="/tracking" element={<ProtectedRoute isUnlocked={isUnlocked}><TrackingPage trackingCaseId={trackingCaseId} onTrackCaseId={setTrackingCaseId} submittedCase={submittedCase} /></ProtectedRoute>} />
          <Route path="/chat" element={<ProtectedRoute isUnlocked={isUnlocked}><ChatPage trackingCaseId={trackingCaseId} onTrackCaseId={setTrackingCaseId} /></ProtectedRoute>} />
          <Route path="/emergency" element={<ProtectedRoute isUnlocked={isUnlocked}><EmergencyPage /></ProtectedRoute>} />
          <Route path="/support" element={<ProtectedRoute isUnlocked={isUnlocked}><SupportMapPage /></ProtectedRoute>} />
          <Route path="/resources" element={<ProtectedRoute isUnlocked={isUnlocked}><ResourcesPage /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <HashRouter>
      <AppShell />
    </HashRouter>
  );
}
