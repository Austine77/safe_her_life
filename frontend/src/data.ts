export type ScreenId =
  | 'entry'
  | 'home'
  | 'report1'
  | 'report2'
  | 'report3'
  | 'report4'
  | 'report5'
  | 'case'
  | 'tracking'
  | 'chat'
  | 'emergency'
  | 'support'
  | 'resources';

export interface ScreenMeta {
  id: ScreenId;
  label: string;
  title: string;
  description: string;
  path: string;
}

export const screens: ScreenMeta[] = [
  { id: 'entry', label: 'Safety Entry', title: 'Safety Entry', description: 'Disguised calculator-style launch for discreet access.', path: '/' },
  { id: 'home', label: 'Welcome Home', title: 'Welcome Home', description: 'Calm, supportive entry point for survivors.', path: '/home' },
  { id: 'report1', label: 'Report Step 1', title: 'Report Step 1', description: 'Incident type selection with simple, fast choices.', path: '/report/step-1' },
  { id: 'report2', label: 'Report Step 2', title: 'Report Step 2', description: 'Safe location capture with a visible skip path.', path: '/report/step-2' },
  { id: 'report3', label: 'Report Step 3', title: 'Report Step 3', description: 'Supportive incident description field.', path: '/report/step-3' },
  { id: 'report4', label: 'Report Step 4', title: 'Report Step 4', description: 'Optional evidence selection.', path: '/report/step-4' },
  { id: 'report5', label: 'Report Step 5', title: 'Report Step 5', description: 'Anonymous-by-default contact preferences.', path: '/report/step-5' },
  { id: 'case', label: 'Case Created', title: 'Case Created', description: 'Confirmation, reassurance, and case ID handoff.', path: '/case-created' },
  { id: 'tracking', label: 'Track Case', title: 'Track Case', description: 'Status visibility and timeline updates.', path: '/tracking' },
  { id: 'chat', label: 'Secure Chat', title: 'Secure Chat', description: 'Anonymous support messaging with a social worker.', path: '/chat' },
  { id: 'emergency', label: 'Emergency Help', title: 'Emergency Help', description: 'Urgent help actions in a controlled interface.', path: '/emergency' },
  { id: 'support', label: 'Support Map', title: 'Support Map', description: 'Nearby support services with filterable categories.', path: '/support' },
  { id: 'resources', label: 'Resource Library', title: 'Resource Library', description: 'Simple rights and safety education content.', path: '/resources' },
];

export function getScreenByPath(pathname: string) {
  return screens.find((screen) => screen.path === pathname) || screens[0];
}

export function getPathForScreen(screenId: ScreenId) {
  return screens.find((screen) => screen.id === screenId)?.path || '/';
}
