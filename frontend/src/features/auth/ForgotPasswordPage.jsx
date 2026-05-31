import { useState } from 'react';
import { Link } from 'react-router-dom';

import AuthLayout from '../../shared/layouts/AuthLayout.jsx';
import Logo from '../../shared/components/navigation/Logo.jsx';
import { validateEmail } from '../../shared/utils/validation.js';
import * as authService from '../../services/authService.js';

const forgotBubbles = [
  {
    width: '20px',
    height: '20px',
    left: '7%',
    top: '76%',
    '--bubble-duration': '4.8s',
    '--bubble-delay': '-1.2s',
    '--bubble-drift': '18px',
    '--bubble-rise': '118px',
  },
  {
    width: '40px',
    height: '40px',
    left: '15%',
    top: '58%',
    '--bubble-duration': '6.8s',
    '--bubble-delay': '-3.4s',
    '--bubble-drift': '-18px',
    '--bubble-rise': '148px',
  },
  {
    width: '16px',
    height: '16px',
    left: '25%',
    top: '82%',
    '--bubble-duration': '4.4s',
    '--bubble-delay': '-2.1s',
    '--bubble-drift': '26px',
    '--bubble-rise': '104px',
  },
];

function BubbleLayer({ bubbles }) {
  return (
    <div className="pointer-events-none absolute inset-0 z-10 overflow-hidden" aria-hidden="true">
      {bubbles.map((bubble, index) => (
        <span
          key={`${bubble.left}-${bubble.top}-${index}`}
          className="aquapulse-bubble"
          style={bubble}
        />
      ))}
    </div>
  );
}

function FieldError({ children }) {
  if (!children) {
    return null;
  }
  return <p className="ml-1 text-sm font-semibold text-red-600">{children}</p>;
}

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const clearFieldError = (fieldName) => {
    setErrorMessage('');
    setSuccessMessage('');
    setFieldErrors((currentErrors) => {
      if (!currentErrors[fieldName]) {
        return currentErrors;
      }
      const nextErrors = { ...currentErrors };
      delete nextErrors[fieldName];
      return nextErrors;
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    setFieldErrors({});

    const emailError = validateEmail(email);
    if (emailError) {
      setFieldErrors({ email: emailError });
      setErrorMessage(emailError);
      return;
    }

    setIsSubmitting(true);
    try {
      await authService.forgotPassword(email);
      setSuccessMessage('If the email exists, a password reset link has been sent.');
    } catch (error) {
      // Generic success message on any error to prevent account enumeration
      setSuccessMessage('If the email exists, a password reset link has been sent.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayout>
      <div className="grid w-full max-w-6xl overflow-hidden rounded-[2rem] border border-cyan-100 bg-white shadow-[0_20px_48px_rgba(0,206,209,0.14)] lg:grid-cols-2">
        <section className="relative hidden min-h-[600px] items-center justify-center overflow-hidden bg-cyan-950 lg:flex">
          <img
            alt="AquaPulse water display"
            className="absolute inset-0 z-0 h-full w-full object-cover opacity-60"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuDwa1CnH9Pzvtiza_g9WIXaq7O8teYe46CgqFFLM8l4Ms8-xZUYX7ZtkZ0pI1rtpVbCgVgVa6d3bfBychRf0vCHNPTyFvRUNePQAAOcEpmHY2BUE5mcUoVLsyeQYjDlkMBBcFQwKm3bVnwxgjAm3XNaAV5OyoL8DtiKV-WXE3DG5RnCmaGSOArlT_aqRdEqINJyN6JQRkF-RsRrpgCzifDOa_VIkJ5bVA0mvbCWFj5rn4B7xs-pwa1NMgz0iOZDqz3viFF11zHfoQ"
          />
          <div className="absolute inset-0 z-[1] bg-gradient-to-tr from-cyan-950/90 via-teal-700/55 to-cyan-300/20" />
          <div className="absolute left-10 top-16 z-[2] h-24 w-24 rounded-full border border-white/20 bg-white/10 blur-[1px]" />
          <div className="absolute bottom-24 right-14 z-[2] h-36 w-36 rounded-full border border-cyan-200/20 bg-cyan-200/10 blur-[1px]" />
          <div className="absolute -bottom-24 left-0 right-0 z-[11] h-48 rounded-[50%] bg-white" />
          <BubbleLayer bubbles={forgotBubbles} />

          <div className="relative z-20 max-w-lg px-12 text-white">
            <p className="mb-5 inline-flex rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.24em] text-cyan-100 backdrop-blur">
              Security
            </p>
            <h1 className="text-5xl font-black leading-tight tracking-tight">
              Password Recovery
            </h1>
            <p className="mt-6 text-lg leading-8 text-white/85">
              Retrieve access to your AquaPulse dashboard. Enter your email and we'll send a secure password reset link.
            </p>
          </div>
        </section>

        <section className="relative flex min-h-[600px] items-center justify-center overflow-hidden px-6 py-12 sm:px-10 lg:px-12">
          <div className="absolute inset-x-0 top-0 h-48 bg-gradient-to-b from-cyan-100/80 to-transparent lg:hidden" />
          <div className="absolute -right-16 top-12 h-40 w-40 rounded-full bg-cyan-200/40 blur-3xl" />
          <div className="absolute -bottom-20 -left-16 h-52 w-52 rounded-full bg-orange-200/25 blur-3xl" />

          <div className="relative z-10 w-full max-w-md rounded-[2rem] border border-cyan-100/80 bg-white/85 p-8 shadow-[0_20px_48px_rgba(0,206,209,0.14)] backdrop-blur-xl sm:p-10">
            <div className="mb-10 text-center">
              <Logo className="justify-center" />
              <p className="mt-2 text-sm text-slate-600">Enter your email to request a reset link</p>
            </div>

            <form className="space-y-6" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <label className="ml-1 block text-sm font-bold text-slate-600" htmlFor="forgot-email">
                  Email Address
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                    mail
                  </span>
                  <input
                    className="w-full rounded-2xl border border-transparent bg-cyan-50/70 py-4 pl-12 pr-4 text-slate-900 outline-none transition focus:border-cyan-500 focus:bg-white focus:ring-2 focus:ring-cyan-200"
                    id="forgot-email"
                    name="email"
                    placeholder="name@aquashow.com"
                    required
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      clearFieldError('email');
                    }}
                  />
                </div>
                <FieldError>{fieldErrors.email}</FieldError>
              </div>

              {errorMessage && (
                <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700" role="alert">
                  {errorMessage}
                </div>
              )}

              {successMessage && (
                <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700" role="status">
                  {successMessage}
                </div>
              )}

              <button
                className="w-full rounded-full bg-gradient-to-r from-[#ff6900] to-[#c2410c] py-4 font-bold text-white shadow-lg shadow-orange-700/20 transition duration-300 hover:-translate-y-0.5 hover:shadow-orange-700/30 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-70"
                disabled={isSubmitting}
                type="submit"
              >
                {isSubmitting ? 'Sending...' : 'Send reset link'}
              </button>
            </form>

            <p className="mt-10 text-center text-sm text-slate-600">
              <Link className="inline-flex items-center gap-1.5 font-bold text-cyan-700 underline-offset-4 transition hover:underline" to="/login">
                <span className="material-symbols-outlined text-base">arrow_back</span>
                Back to Sign In
              </Link>
            </p>
          </div>
        </section>
      </div>
    </AuthLayout>
  );
}
