import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import ManagerSignupPage from './pages/ManagerSignupPage';
import EmployeeSignupPage from './pages/EmployeeSignupPage';
import DashboardPage from './pages/DashboardPage';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/signup/manager" element={<ManagerSignupPage />} />
        <Route path="/signup/employee" element={<EmployeeSignupPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/projects" element={<DashboardPage />} />
        <Route path="/tasks" element={<DashboardPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
