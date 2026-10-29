import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import ManagerSignupPage from './pages/ManagerSignupPage';
import EmployeeSignupPage from './pages/EmployeeSignupPage';
import DashboardPage from './pages/DashboardPage';
import AppLayout from './components/layout/AppLayout';
import ProjectsPage from './pages/projects/ProjectsPage';
import ProjectDetailPage from './pages/projects/ProjectDetailPage';
import MyTasksPage from './pages/tasks/MyTasksPage';
import PlaceholderPage from './pages/PlaceholderPage';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { Users, Bell, Settings, Layers } from 'lucide-react';

function App() {
  const [globalCreateProjectOpen, setGlobalCreateProjectOpen] = useState(false);
  const [globalCreateTaskOpen, setGlobalCreateTaskOpen] = useState(false);

  return (
    <AuthProvider>
      <ToastProvider>
        <Router>
          <Routes>
            {/* Public Marketing & Authentication Pages */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/signup/manager" element={<ManagerSignupPage />} />
            <Route path="/signup/employee" element={<EmployeeSignupPage />} />

            {/* Live API Dashboard */}
            <Route path="/dashboard" element={<DashboardPage />} />

            {/* Direct Project Route Redirects for Convenience */}
            <Route path="/projects" element={<Navigate to="/app/projects" replace />} />
            <Route path="/projects/:projectId" element={<Navigate to="/app/projects/:projectId" replace />} />
            <Route path="/tasks" element={<Navigate to="/app/tasks" replace />} />

            {/* Authenticated Workspace App Layout */}
            <Route
              path="/app"
              element={
                <AppLayout
                  onOpenCreateProject={() => setGlobalCreateProjectOpen(true)}
                  onOpenCreateTask={() => setGlobalCreateTaskOpen(true)}
                />
              }
            >
              <Route index element={<Navigate to="/app/projects" replace />} />
              <Route
                path="projects"
                element={
                  <ProjectsPage
                    isCreateModalOpen={globalCreateProjectOpen}
                    onCloseCreateModal={() => setGlobalCreateProjectOpen(false)}
                  />
                }
              />
              <Route
                path="projects/:projectId"
                element={
                  <ProjectDetailPage
                    isCreateTaskOpen={globalCreateTaskOpen}
                    onCloseCreateTask={() => setGlobalCreateTaskOpen(false)}
                  />
                }
              />
              <Route
                path="tasks"
                element={
                  <MyTasksPage
                    isCreateTaskOpen={globalCreateTaskOpen}
                    onCloseCreateTask={() => setGlobalCreateTaskOpen(false)}
                  />
                }
              />
              <Route
                path="overview"
                element={
                  <PlaceholderPage
                    title="Workspace Overview"
                    subtitle="Cross-project sprint velocity, organizational capacity, and executive health reports."
                    icon={Layers}
                  />
                }
              />
              <Route
                path="team"
                element={
                  <PlaceholderPage
                    title="Team Directory"
                    subtitle="Manage departments, member assignments, and pending workspace invitations."
                    icon={Users}
                  />
                }
              />
              <Route
                path="notifications"
                element={
                  <PlaceholderPage
                    title="Notifications & Activity"
                    subtitle="Real-time alert dispatch, mentions, and project milestone updates."
                    icon={Bell}
                  />
                }
              />
              <Route
                path="settings"
                element={
                  <PlaceholderPage
                    title="Workspace Settings"
                    subtitle="Configure organization branding, SSO parameters, and security policies."
                    icon={Settings}
                  />
                }
              />
            </Route>

            {/* Fallback Catch-all Route */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;
