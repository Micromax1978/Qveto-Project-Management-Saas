import React from 'react';
import SignupPage from './SignupPage';

/**
 * Manager Signup Page Route (/signup/manager)
 * Extends SignupPage with forced manager role context
 */
export default function ManagerSignupPage() {
  return <SignupPage forcedRole="manager" />;
}
