import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  User,
  Mail,
  KeyRound,
  ArrowRight,
  ArrowLeft,
  Briefcase,
  UserCheck,
  Building2,
  CheckCircle2,
  ShieldCheck,
  X,
  Sparkles,
} from 'lucide-react';
import AuthLayout from '../components/auth/AuthLayout';
import AuthInput from '../components/auth/AuthInput';
import PasswordInput from '../components/auth/PasswordInput';
import PasswordStrengthMeter from '../components/auth/PasswordStrengthMeter';
import AuthSubmitButton from '../components/auth/AuthSubmitButton';
import AuthInfoNotice from '../components/auth/AuthInfoNotice';

export default function SignupPage({ forcedRole }) {
  const navigate = useNavigate();
  const { role: paramRole } = useParams();
  
  // Determine role from props, URL param, or null for role selection hub
  const activeRole = forcedRole || (paramRole === 'manager' || paramRole === 'employee' ? paramRole : null);

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    invitationCode: '',
    password: '',
    confirmPassword: '',
    agreeTerms: false,
  });

  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedNotice, setSubmittedNotice] = useState(false);
  const [legalModal, setLegalModal] = useState({ open: false, type: 'terms' });
  const [orgInfoModal, setOrgInfoModal] = useState(false);

  useEffect(() => {
    if (activeRole === 'manager') {
      document.title = 'Sign Up as Manager — TASKORA';
    } else if (activeRole === 'employee') {
      document.title = 'Sign Up as Employee — TASKORA';
    } else {
      document.title = 'Join Your Team — TASKORA';
    }
  }, [activeRole]);

  // Validation function
  const validateField = (name, value, allValues = formData) => {
    switch (name) {
      case 'fullName':
        if (!value || !value.trim()) {
          return 'Full name is required.';
        }
        if (value.trim().length < 2) {
          return 'Please enter your real full name.';
        }
        return '';

      case 'email':
        if (!value || !value.trim()) {
          return 'Work email is required.';
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) {
          return 'Please enter a valid work email address.';
        }
        return '';

      case 'invitationCode':
        if (!value || !value.trim()) {
          return 'Organization invitation code is required.';
        }
        if (value.trim().length < 4) {
          return 'Please enter a valid invitation code (minimum 4 characters).';
        }
        return '';

      case 'password':
        if (!value) {
          return 'Password is required.';
        }
        if (value.length < 8) {
          return 'Password must contain at least 8 characters.';
        }
        return '';

      case 'confirmPassword':
        if (!value) {
          return 'Please confirm your password.';
        }
        if (value !== allValues.password) {
          return 'Passwords do not match.';
        }
        return '';

      case 'agreeTerms':
        if (!value) {
          return 'You must agree to the Terms of Service and Privacy Policy to proceed.';
        }
        return '';

      default:
        return '';
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const fieldValue = type === 'checkbox' ? checked : value;

    const nextFormData = {
      ...formData,
      [name]: fieldValue,
    };

    setFormData(nextFormData);

    if (submittedNotice) {
      setSubmittedNotice(false);
    }

    if (touched[name]) {
      const err = validateField(name, fieldValue, nextFormData);
      setErrors((prev) => ({ ...prev, [name]: err }));
    }

    if (name === 'password' && touched.confirmPassword) {
      const confirmErr = validateField('confirmPassword', formData.confirmPassword, nextFormData);
      setErrors((prev) => ({ ...prev, confirmPassword: confirmErr }));
    }
  };

  const handleBlur = (e) => {
    const { name, value, type, checked } = e.target;
    const fieldValue = type === 'checkbox' ? checked : value;
    setTouched((prev) => ({ ...prev, [name]: true }));
    const err = validateField(name, fieldValue);
    setErrors((prev) => ({ ...prev, [name]: err }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const newErrors = {
      fullName: validateField('fullName', formData.fullName),
      email: validateField('email', formData.email),
      invitationCode: validateField('invitationCode', formData.invitationCode),
      password: validateField('password', formData.password),
      confirmPassword: validateField('confirmPassword', formData.confirmPassword),
      agreeTerms: validateField('agreeTerms', formData.agreeTerms),
    };

    setErrors(newErrors);
    setTouched({
      fullName: true,
      email: true,
      invitationCode: true,
      password: true,
      confirmPassword: true,
      agreeTerms: true,
    });

    const hasErrors = Object.values(newErrors).some(Boolean);
    if (hasErrors) {
      const firstInvalidKey = Object.keys(newErrors).find((key) => newErrors[key]);
      if (firstInvalidKey) {
        const el = document.getElementById(firstInvalidKey);
        if (el) el.focus();
      }
      return;
    }

    setIsSubmitting(true);
    setSubmittedNotice(false);

    setTimeout(() => {
      setIsSubmitting(false);
      setSubmittedNotice(true);
    }, 1200);
  };

  const handleResetForm = () => {
    setSubmittedNotice(false);
    setFormData({
      fullName: '',
      email: '',
      invitationCode: '',
      password: '',
      confirmPassword: '',
      agreeTerms: false,
    });
    setErrors({});
    setTouched({});
  };

  // ----------------------------------------------------
  // VIEW 1: ROLE SELECTION HUB (/signup)
  // ----------------------------------------------------
  if (!activeRole) {
    return (
      <AuthLayout
        maxWidth="max-w-4xl"
        badgeText="WORKSPACE ONBOARDING"
        title="Join your team on TASKORA"
        subtitle="Select your role to get started with an optimized workspace experience."
      >
        <div className="space-y-8">
          {/* Two Polished Role Selection Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8 items-stretch">
            {/* 1. MANAGER CARD */}
            <div className="group relative flex flex-col justify-between bg-white rounded-2xl border-2 border-slate-200 hover:border-blue-500 hover:shadow-xl hover:shadow-blue-500/10 transition-all duration-200 p-6 sm:p-8">
              <div>
                {/* Header with Icon and Role Badge */}
                <div className="flex items-center justify-between mb-5">
                  <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-200/80 flex items-center justify-center text-blue-600 transition-transform group-hover:scale-105">
                    <Briefcase className="w-6 h-6" aria-hidden="true" />
                  </div>
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200/80">
                    <Sparkles className="w-3 h-3" />
                    Team Leadership
                  </span>
                </div>

                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                  Manager
                </h2>
                
                {/* Official required copy */}
                <p className="mt-2.5 text-sm leading-relaxed text-slate-600 font-normal">
                  Organize projects, coordinate teams, assign tasks, and monitor project progress.
                </p>

                {/* Role Feature Highlights */}
                <ul className="mt-6 space-y-2.5 text-xs text-slate-600 border-t border-slate-100 pt-5">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                    <span>Project roadmaps & milestone tracking</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                    <span>Sprint planning & team workload balancing</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                    <span>Milestone velocity & productivity analytics</span>
                  </li>
                </ul>
              </div>

              {/* Action Button */}
              <div className="pt-8">
                <button
                  type="button"
                  onClick={() => navigate('/signup/manager')}
                  className="w-full h-12 inline-flex items-center justify-center gap-2 px-6 rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 transition-colors shadow-sm shadow-blue-500/20 focus:outline-hidden focus:ring-2 focus:ring-blue-600 focus:ring-offset-2"
                >
                  <span>Sign Up as Manager</span>
                  <ArrowRight className="w-4 h-4" aria-hidden="true" />
                </button>
              </div>
            </div>

            {/* 2. EMPLOYEE CARD */}
            <div className="group relative flex flex-col justify-between bg-white rounded-2xl border-2 border-slate-200 hover:border-blue-500 hover:shadow-xl hover:shadow-blue-500/10 transition-all duration-200 p-6 sm:p-8">
              <div>
                {/* Header with Icon and Role Badge */}
                <div className="flex items-center justify-between mb-5">
                  <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 transition-transform group-hover:scale-105">
                    <UserCheck className="w-6 h-6" aria-hidden="true" />
                  </div>
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                    Team Member
                  </span>
                </div>

                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                  Employee
                </h2>

                {/* Official required copy */}
                <p className="mt-2.5 text-sm leading-relaxed text-slate-600 font-normal">
                  Manage assigned tasks, collaborate with teammates, and track your work.
                </p>

                {/* Role Feature Highlights */}
                <ul className="mt-6 space-y-2.5 text-xs text-slate-600 border-t border-slate-100 pt-5">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Personal daily task board & prioritized queues</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Real-time team collaboration & discussion threads</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Checklist execution & sprint delivery tracking</span>
                  </li>
                </ul>
              </div>

              {/* Action Button */}
              <div className="pt-8">
                <button
                  type="button"
                  onClick={() => navigate('/signup/employee')}
                  className="w-full h-12 inline-flex items-center justify-center gap-2 px-6 rounded-xl text-sm font-semibold text-slate-900 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 transition-colors border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-slate-900 focus:ring-offset-2"
                >
                  <span>Sign Up as Employee</span>
                  <ArrowRight className="w-4 h-4" aria-hidden="true" />
                </button>
              </div>
            </div>
          </div>

          {/* Organization Provisioning Callout (NO Organization signup card) */}
          <div className="rounded-xl border border-slate-200/90 bg-white/80 p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-900">
                  Looking for an Organization Account?
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Organization root workspaces are provisioned directly by TASKORA enterprise administrators.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setOrgInfoModal(true)}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline shrink-0"
            >
              Enterprise Provisioning Info
            </button>
          </div>

          {/* Already have an account link */}
          <div className="text-center pt-2">
            <p className="text-sm text-slate-600">
              Already have an account?{' '}
              <Link
                to="/login"
                className="font-semibold text-blue-600 hover:text-blue-700 hover:underline focus:outline-hidden focus:ring-2 focus:ring-blue-500 rounded px-1 py-0.5"
              >
                Log in
              </Link>
            </p>
          </div>
        </div>

        {/* Enterprise Organization Info Modal */}
        {orgInfoModal && (
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="org-modal-title"
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150"
          >
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2 text-slate-900 font-bold">
                  <ShieldCheck className="w-5 h-5 text-blue-600" />
                  <h3 id="org-modal-title" className="text-base">
                    Organization Account Policy
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setOrgInfoModal(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                  aria-label="Close dialog"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="py-4 text-xs text-slate-600 leading-relaxed space-y-3">
                <p>
                  To protect enterprise security boundaries and maintain organizational tenant integrity, TASKORA does not permit public sign-ups for organization root accounts.
                </p>
                <p>
                  New organization accounts are established directly by TASKORA administrators following enterprise agreement verification.
                </p>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setOrgInfoModal(false)}
                  className="w-full h-10 rounded-lg text-xs font-semibold bg-slate-900 text-white hover:bg-slate-800 transition-colors"
                >
                  I Understand
                </button>
              </div>
            </div>
          </div>
        )}
      </AuthLayout>
    );
  }

  // ----------------------------------------------------
  // VIEW 2: ROLE-SPECIFIC REGISTRATION FORM (/signup/manager or /signup/employee)
  // ----------------------------------------------------
  const isManager = activeRole === 'manager';
  const roleTitle = isManager ? 'Manager Registration' : 'Employee Registration';
  const alternateRole = isManager ? 'employee' : 'manager';
  const alternateLabel = isManager ? 'Sign up as Employee' : 'Sign up as Manager';
  const RoleIcon = isManager ? Briefcase : UserCheck;

  return (
    <AuthLayout
      maxWidth="max-w-[520px]"
      badgeText={isManager ? 'MANAGER ONBOARDING' : 'EMPLOYEE ONBOARDING'}
      title={isManager ? 'Create your Manager account' : 'Create your Employee account'}
      subtitle={
        isManager
          ? 'Organize projects, coordinate teams, and monitor progress.'
          : 'Manage assigned tasks, collaborate with teammates, and track your work.'
      }
    >
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xl shadow-slate-900/5 p-6 sm:p-9 relative">
        {/* Top Navigation Row: Back to role selection + Role Switcher */}
        <div className="flex items-center justify-between pb-4 mb-5 border-b border-slate-100 text-xs">
          <Link
            to="/signup"
            className="inline-flex items-center gap-1.5 font-semibold text-slate-500 hover:text-blue-600 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Change role</span>
          </Link>

          <Link
            to={`/signup/${alternateRole}`}
            className="font-medium text-slate-500 hover:text-blue-600 transition-colors"
          >
            {alternateLabel}
          </Link>
        </div>

        {/* Role Identity Pill */}
        <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200/80 mb-5">
          <div className="w-9 h-9 rounded-lg bg-blue-600/10 border border-blue-600/20 flex items-center justify-center text-blue-600 shrink-0">
            <RoleIcon className="w-4 h-4" aria-hidden="true" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-xs font-bold text-slate-900">
              {roleTitle}
            </h2>
            <p className="text-[11px] text-slate-500">
              {isManager
                ? 'Leadership & sprint management privileges'
                : 'Workspace team member privileges'}
            </p>
          </div>
        </div>

        {submittedNotice ? (
          <AuthInfoNotice mode="signup" onReset={handleResetForm} />
        ) : (
          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            {/* 1. Full Name */}
            <AuthInput
              id="fullName"
              name="fullName"
              label="Full Name"
              type="text"
              value={formData.fullName}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="e.g., Alex Morgan"
              error={errors.fullName}
              autoComplete="name"
              required
              disabled={isSubmitting}
              icon={User}
            />

            {/* 2. Work Email */}
            <AuthInput
              id="email"
              name="email"
              label="Work Email Address"
              type="email"
              value={formData.email}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="alex@company.com"
              error={errors.email}
              autoComplete="email"
              required
              disabled={isSubmitting}
              icon={Mail}
            />

            {/* 3. Organization Invitation Code (REQUIRED) */}
            <AuthInput
              id="invitationCode"
              name="invitationCode"
              label="Organization Invitation Code"
              type="text"
              value={formData.invitationCode}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="e.g., ORG-9482-ACME"
              error={errors.invitationCode}
              helperText="Enter the invitation code provided by your organization administrator."
              required
              disabled={isSubmitting}
              icon={KeyRound}
            />

            {/* 4. Password */}
            <div>
              <PasswordInput
                id="password"
                name="password"
                label="Create Password"
                value={formData.password}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="Minimum 8 characters"
                error={errors.password}
                autoComplete="new-password"
                required
                disabled={isSubmitting}
              />

              {/* Password Strength Indicator */}
              <PasswordStrengthMeter password={formData.password} />
            </div>

            {/* 5. Confirm Password */}
            <PasswordInput
              id="confirmPassword"
              name="confirmPassword"
              label="Confirm Password"
              value={formData.confirmPassword}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="Re-enter your password"
              error={errors.confirmPassword}
              autoComplete="new-password"
              required
              disabled={isSubmitting}
            />

            {/* 6. Terms Agreement Checkbox */}
            <div className="pt-1">
              <div className="flex items-start">
                <input
                  id="agreeTerms"
                  name="agreeTerms"
                  type="checkbox"
                  checked={formData.agreeTerms}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  disabled={isSubmitting}
                  aria-invalid={Boolean(errors.agreeTerms)}
                  aria-describedby={errors.agreeTerms ? 'agreeTerms-error' : undefined}
                  className="w-4 h-4 mt-0.5 rounded border-slate-300 text-blue-600 focus:ring-2 focus:ring-blue-500 transition-colors cursor-pointer shrink-0"
                />
                <label
                  htmlFor="agreeTerms"
                  className="ml-2.5 block text-xs leading-relaxed text-slate-700 select-none cursor-pointer"
                >
                  I agree to the{' '}
                  <button
                    type="button"
                    onClick={() => setLegalModal({ open: true, type: 'terms' })}
                    className="font-semibold text-blue-600 hover:text-blue-700 hover:underline focus:outline-hidden focus:ring-1 focus:ring-blue-500 rounded"
                  >
                    Terms of Service
                  </button>{' '}
                  and{' '}
                  <button
                    type="button"
                    onClick={() => setLegalModal({ open: true, type: 'privacy' })}
                    className="font-semibold text-blue-600 hover:text-blue-700 hover:underline focus:outline-hidden focus:ring-1 focus:ring-blue-500 rounded"
                  >
                    Privacy Policy
                  </button>
                  .
                </label>
              </div>

              {errors.agreeTerms && (
                <p
                  id="agreeTerms-error"
                  role="alert"
                  aria-live="polite"
                  className="text-xs font-medium text-red-600 mt-1.5 ml-6 animate-in fade-in duration-150"
                >
                  {errors.agreeTerms}
                </p>
              )}
            </div>

            {/* Submit Action */}
            <div className="pt-2">
              <AuthSubmitButton
                loading={isSubmitting}
                loadingText={isManager ? 'Setting up manager profile...' : 'Setting up employee profile...'}
                disabled={isSubmitting}
              >
                <span>{isManager ? 'Sign Up as Manager' : 'Sign Up as Employee'}</span>
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </AuthSubmitButton>
            </div>

            {/* Login Link */}
            <div className="pt-4 text-center border-t border-slate-100 mt-5">
              <p className="text-sm text-slate-600">
                Already have an account?{' '}
                <Link
                  to={`/login?role=${activeRole}`}
                  className="font-semibold text-blue-600 hover:text-blue-700 hover:underline focus:outline-hidden focus:ring-2 focus:ring-blue-500 rounded px-1 py-0.5"
                >
                  Log in
                </Link>
              </p>
            </div>
          </form>
        )}
      </div>

      {/* Transparent Legal Document Dialog */}
      {legalModal.open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="legal-doc-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150"
        >
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 text-slate-900 font-bold">
                <ShieldCheck className="w-5 h-5 text-blue-600" />
                <h3 id="legal-doc-title" className="text-base">
                  {legalModal.type === 'terms' ? 'Terms of Service' : 'Privacy Policy'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setLegalModal({ open: false, type: 'terms' })}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                aria-label="Close dialog"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-4 text-xs text-slate-600 leading-relaxed space-y-2">
              <p>
                Our enterprise <strong>{legalModal.type === 'terms' ? 'Terms of Service' : 'Privacy Policy'}</strong> safeguards workspace IP, team confidentiality, and data sovereignty.
              </p>
              <p className="text-slate-500">
                Statutory legal documents will be published upon Phase 2 production release.
              </p>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => setLegalModal({ open: false, type: 'terms' })}
                className="w-full h-10 rounded-lg text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 transition-colors"
              >
                I Understand
              </button>
            </div>
          </div>
        </div>
      )}
    </AuthLayout>
  );
}
