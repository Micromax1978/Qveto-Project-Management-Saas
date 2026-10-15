import React, { useState, useEffect, useRef } from 'react';
import {
  Mail,
  ArrowLeft,
  RefreshCw,
  Info,
  Briefcase,
  UserCheck,
  AlertCircle,
  Loader2,
  Lock,
} from 'lucide-react';
import AuthLayout from './AuthLayout';
import OTPInput from './OTPInput';

const COOLDOWN_SECONDS = 30;

/**
 * Reusable TASKORA Email Verification Component
 * Used for both Manager and Employee signup flows.
 *
 * Strict Frontend Demonstration Phase:
 * - Dynamic email display
 * - Interactive 6-digit OTP input
 * - Demonstration states for verification and resend
 * - Honest feedback explaining backend integration boundaries
 * - Safe memory-only state handling with zero credentials stored
 */
export default function EmailVerification({
  email = '',
  role = 'manager',
  onChangeEmail,
  onBack,
}) {
  const isManager = role === 'manager';
  const RoleIcon = isManager ? Briefcase : UserCheck;
  const roleDisplay = isManager ? 'Manager' : 'Employee';

  const [otp, setOtp] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifyNotice, setVerifyNotice] = useState(null);
  const [resendNotice, setResendNotice] = useState(null);

  // Resend cooldown timer state
  const [cooldown, setCooldown] = useState(0);
  const timerRef = useRef(null);

  // Document title
  useEffect(() => {
    document.title = `Verify Email (${roleDisplay}) — TASKORA`;
  }, [roleDisplay]);

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  // Handle Verify Email button click (demonstration interaction)
  const handleVerify = (e) => {
    e.preventDefault();

    if (otp.length < 6) return;

    setIsVerifying(true);
    setVerifyNotice(null);
    setResendNotice(null);

    // Frontend interaction simulation (no network request, no fake success)
    setTimeout(() => {
      setIsVerifying(false);
      setVerifyNotice({
        type: 'info',
        title: 'Backend Integration Required',
        message: 'Email verification will be available after backend integration.',
        detail:
          'In this frontend demonstration phase, entering digits validates input UX only. No account was created and no API requests were made.',
      });
    }, 750);
  };

  // Handle Resend Code click (demonstration interaction)
  const handleResend = () => {
    if (cooldown > 0) return;

    // Start cooldown
    setCooldown(COOLDOWN_SECONDS);
    setResendNotice({
      title: 'Frontend Demonstration State',
      message:
        'Resending verification codes will be available after backend integration.',
    });

    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    timerRef.current = setInterval(() => {
      setCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  return (
    <AuthLayout
      maxWidth="max-w-[500px]"
      badgeText={isManager ? 'MANAGER ONBOARDING' : 'EMPLOYEE ONBOARDING'}
      title="Verify your email"
      subtitle="Enter the six-digit verification code to continue creating your TASKORA account."
      backTo={isManager ? '/signup/manager' : '/signup/employee'}
      backLabel="Back to signup"
    >
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xl shadow-slate-900/5 p-6 sm:p-9 relative">
        {/* Top Back and Navigation Bar */}
        <div className="flex items-center justify-between pb-4 mb-6 border-b border-slate-100 text-xs">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-1.5 font-semibold text-slate-500 hover:text-blue-600 transition-colors focus:outline-hidden focus:ring-2 focus:ring-blue-500 rounded px-1 py-0.5 cursor-pointer"
            aria-label="Return to signup form"
          >
            <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Back to signup</span>
          </button>

          <span className="inline-flex items-center gap-1 font-semibold text-blue-700 bg-blue-50 border border-blue-200/80 px-2.5 py-0.5 rounded-full text-[11px]">
            Step 2 of 2
          </span>
        </div>

        {/* Role and Email Context Card */}
        <div className="rounded-xl bg-slate-50 border border-slate-200/80 p-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/10 border border-blue-600/20 flex items-center justify-center text-blue-600 shrink-0">
              <RoleIcon className="w-5 h-5" aria-hidden="true" />
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-[11px] font-semibold text-blue-700 uppercase tracking-wider block">
                {isManager ? 'Creating your Manager account' : 'Creating your Employee account'}
              </span>
              <p className="text-sm font-bold text-slate-900 truncate">
                {email || 'user@company.com'}
              </p>
            </div>
            {onChangeEmail && (
              <button
                type="button"
                onClick={onChangeEmail}
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline shrink-0 px-2 py-1 rounded focus:outline-hidden focus:ring-2 focus:ring-blue-500 cursor-pointer"
                aria-label="Change email address"
              >
                Change
              </button>
            )}
          </div>
        </div>

        {/* Email Illustration Badge */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 border border-blue-200/80 flex items-center justify-center text-blue-600 mb-3 shadow-2xs">
            <Mail className="w-7 h-7" aria-hidden="true" />
          </div>
          <h2 className="text-lg font-bold text-slate-900">
            Check your inbox
          </h2>
          <p className="mt-1 text-xs text-slate-600 max-w-xs leading-relaxed">
            We sent a verification code to{' '}
            <strong className="text-slate-900 font-semibold break-all">
              {email || 'your email'}
            </strong>
          </p>
        </div>

        {/* Verification Form */}
        <form onSubmit={handleVerify} noValidate className="space-y-6">
          {/* 6-Digit OTP Input */}
          <div>
            <label
              htmlFor="taskora-otp-0"
              className="block text-center text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3 select-none"
            >
              Enter 6-Digit Code
            </label>

            <OTPInput
              value={otp}
              onChange={(newOtp) => {
                setOtp(newOtp);
                if (verifyNotice) setVerifyNotice(null);
              }}
              disabled={isVerifying}
              idPrefix="taskora-otp"
            />
          </div>

          {/* Verification Status Banner (Honest Demonstration State) */}
          {verifyNotice && (
            <div
              role="status"
              aria-live="polite"
              className="rounded-xl border border-blue-200 bg-blue-50/80 p-4 animate-in fade-in slide-in-from-top-1 duration-200 text-left"
            >
              <div className="flex items-start gap-3">
                <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" aria-hidden="true" />
                <div className="text-xs text-slate-700 space-y-1">
                  <p className="font-bold text-slate-900">
                    {verifyNotice.message}
                  </p>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    {verifyNotice.detail}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Primary Action: Verify Email */}
          <div className="pt-1">
            <button
              type="submit"
              disabled={otp.length !== 6 || isVerifying}
              className={`w-full h-12 inline-flex items-center justify-center gap-2 px-6 rounded-xl text-sm font-semibold transition-all duration-150 shadow-sm focus:outline-hidden focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 ${
                otp.length === 6 && !isVerifying
                  ? 'bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800 shadow-blue-500/20 cursor-pointer'
                  : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed opacity-80'
              }`}
            >
              {isVerifying ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                  <span>Verifying Code...</span>
                </>
              ) : (
                <span>Verify Email</span>
              )}
            </button>
          </div>
        </form>

        {/* Resend OTP Section */}
        <div className="mt-6 pt-5 border-t border-slate-100 text-center">
          <p className="text-xs text-slate-600 mb-2">
            Didn't receive the code?
          </p>

          <button
            type="button"
            onClick={handleResend}
            disabled={cooldown > 0}
            className={`inline-flex items-center gap-1.5 text-xs font-semibold transition-colors focus:outline-hidden focus:ring-2 focus:ring-blue-500 rounded px-2 py-1 ${
              cooldown > 0
                ? 'text-slate-400 cursor-not-allowed'
                : 'text-blue-600 hover:text-blue-700 hover:underline cursor-pointer'
            }`}
            aria-live="polite"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${cooldown > 0 ? 'animate-spin opacity-50' : ''}`}
              aria-hidden="true"
            />
            <span>
              {cooldown > 0 ? `Resend Code in ${cooldown}s` : 'Resend Code'}
            </span>
          </button>

          {/* Resend Honest Feedback */}
          {resendNotice && (
            <div
              role="status"
              aria-live="polite"
              className="mt-3 text-left rounded-lg bg-amber-50/80 border border-amber-200/90 p-3 animate-in fade-in duration-150"
            >
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" aria-hidden="true" />
                <p className="text-[11px] text-amber-900 leading-relaxed font-medium">
                  {resendNotice.message}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Change Email Action */}
        <div className="mt-5 text-center">
          <button
            type="button"
            onClick={onChangeEmail}
            className="text-xs font-medium text-slate-500 hover:text-slate-800 transition-colors focus:outline-hidden focus:ring-2 focus:ring-blue-500 rounded px-2 py-1 cursor-pointer"
          >
            Entered the wrong email?{' '}
            <span className="font-semibold text-blue-600 hover:underline">
              Change email address
            </span>
          </button>
        </div>

        {/* Security & Architecture Boundary Notice */}
        <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-center gap-2 text-[11px] text-slate-400">
          <Lock className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
          <span>Frontend demo state • No external requests or storage</span>
        </div>
      </div>
    </AuthLayout>
  );
}
