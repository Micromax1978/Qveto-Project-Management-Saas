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
import NotificationsPage from './pages/notifications/NotificationsPage';
import WorkspaceOverviewPage from './pages/overview/WorkspaceOverviewPage';
import AnalyticsPage from './pages/analytics/AnalyticsPage';
import TeamPage from './pages/team/TeamPage';
import SettingsPage from './pages/settings/SettingsPage';
import UnauthorizedPage from './pages/UnauthorizedPage';
import ProtectedRoute from './components/auth/ProtectedRoute';
import ErrorBoundary from './components/common/ErrorBoundary';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { NotificationProvider } from './context/NotificationContext';
import { ROLES } from './constants/roles';

function App() {
  const [globalCreateProjectOpen, setGlobalCreateProjectOpen] = useState(false);
  const [globalCreateTaskOpen, setGlobalCreateTaskOpen] = useState(false);

  return (
    <ErrorBoundary>
      <AuthProvider>
        <ToastProvider>
          <NotificationProvider>
            <Router>
              <Routes>
                {/* Public Marketing & Authentication Pages */}
                <Route path="/" element={<LandingPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/signup" element={<SignupPage />} />
                <Route path="/signup/manager" element={<ManagerSignupPage />} />
                <Route path="/signup/employee" element={<EmployeeSignupPage />} />
                <Route path="/unauthorized" element={<UnauthorizedPage />} />

                {/* Live API Dashboard */}
                <Route path="/dashboard" element={<DashboardPage />} />

                {/* Direct Convenience Redirects */}
                <Route path="/projects" element={<Navigate to="/app/projects" replace />} />
                <Route path="/projects/:projectId" element={<Navigate to="/app/projects/:projectId" replace />} />
                <Route path="/tasks" element={<Navigate to="/app/tasks" replace />} />
                <Route path="/analytics" element={<Navigate to="/app/analytics" replace />} />

                {/* Authenticated Workspace App Layout with Route Protection */}
                <Route
                  path="/app"
                  element={
                    <ProtectedRoute>
                      <AppLayout
                        onOpenCreateProject={() => setGlobalCreateProjectOpen(true)}
                        onOpenCreateTask={() => setGlobalCreateTaskOpen(true)}
                      />
                    </ProtectedRoute>
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
                    element={<WorkspaceOverviewPage />}
                  />
                  <Route
                    path="analytics"
                    element={<AnalyticsPage />}
                  />
                  <Route
                    path="team"
                    element={<TeamPage />}
                  />
                  <Route
                    path="notifications"
                    element={<NotificationsPage />}
                  />
                  <Route
                    path="settings"
                    element={<SettingsPage />}
                  />
                </Route>

                {/* Fallback Catch-all Route */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Router>
          </NotificationProvider>
        </ToastProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
