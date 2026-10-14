import React from 'react';
import SignupPage from './SignupPage';

/**
 * Employee Signup Page Route (/signup/employee)
 * Extends SignupPage with forced employee role context
 */
export default function EmployeeSignupPage() {
  return <SignupPage forcedRole="employee" />;
}
