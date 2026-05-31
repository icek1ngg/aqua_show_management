import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import AuthLayout from '../../shared/layouts/AuthLayout.jsx';
import Logo from '../../shared/components/navigation/Logo.jsx';
import {
  sanitizeDigits,
  validateEmail,
  validateName,
  validatePassword,
  validatePhone,
} from '../../shared/utils/validation.js';
import { useAuth } from './AuthContext.jsx';

const registerBubbles = [
  {
    width: '24px',
    height: '24px',
    left: '6%',
    top: '78%',
    '--bubble-duration': '4.9s',
    '--bubble-delay': '-1.3s',
    '--bubble-drift': '16px',
    '--bubble-rise': '118px',
  },
  {
    width: '48px',
    height: '48px',
    left: '14%',
    top: '60%',
    '--bubble-duration': '7.5s',
    '--bubble-delay': '-5.2s',
    '--bubble-drift': '-24px',
    '--bubble-rise': '152px',
  },
  {
    width: '16px',
    height: '16px',
    left: '24%',
    top: '86%',
    '--bubble-duration': '4.1s',
    '--bubble-delay': '-2.4s',
    '--bubble-drift': '28px',
    '--bubble-rise': '98px',
  },
  {
    width: '36px',
    height: '36px',
    left: '33%',
    top: '68%',
    '--bubble-duration': '6.2s',
    '--bubble-delay': '-3s',
    '--bubble-drift': '-14px',
    '--bubble-rise': '132px',
  },
  {
    width: '56px',
    height: '56px',
    left: '45%',
    top: '52%',
    '--bubble-duration': '7.9s',
    '--bubble-delay': '-6s',
    '--bubble-drift': '22px',
    '--bubble-rise': '160px',
  },
  {
    width: '20px',
    height: '20px',
    left: '56%',
    top: '80%',
    '--bubble-duration': '5s',
    '--bubble-delay': '-1.8s',
    '--bubble-drift': '-18px',
    '--bubble-rise': '116px',
  },
  {
    width: '40px',
    height: '40px',
    left: '66%',
    top: '62%',
    '--bubble-duration': '6.9s',
    '--bubble-delay': '-4.6s',
    '--bubble-drift': '20px',
    '--bubble-rise': '144px',
  },
  {
    width: '16px',
    height: '16px',
    left: '77%',
    top: '84%',
    '--bubble-duration': '4.3s',
    '--bubble-delay': '-0.9s',
    '--bubble-drift': '-12px',
    '--bubble-rise': '92px',
  },
  {
    width: '44px',
    height: '44px',
    left: '86%',
    top: '70%',
    '--bubble-duration': '7.2s',
    '--bubble-delay': '-5.4s',
    '--bubble-drift': '-30px',
    '--bubble-rise': '148px',
  },
  {
    width: '24px',
    height: '24px',
    left: '93%',
    top: '76%',
    '--bubble-duration': '5.4s',
    '--bubble-delay': '-2.8s',
    '--bubble-drift': '-18px',
    '--bubble-rise': '124px',
  },
  {
    width: '20px',
    height: '20px',
    left: '40%',
    top: '88%',
    '--bubble-duration': '4.7s',
    '--bubble-delay': '-3.6s',
    '--bubble-drift': '34px',
    '--bubble-rise': '108px',
  },
  {
    width: '14px',
    height: '14px',
    left: '20%',
    top: '38%',
    '--bubble-duration': '4s',
    '--bubble-delay': '-1.4s',
    '--bubble-drift': '-14px',
    '--bubble-rise': '86px',
  },
  {
    width: '24px',
    height: '24px',
    left: '72%',
    top: '34%',
    '--bubble-duration': '5.7s',
    '--bubble-delay': '-4.1s',
    '--bubble-drift': '20px',
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

function splitFullName(fullName) {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);

  return {
    lastName: parts[0] || '',
    firstMiddleName: parts.slice(1).join(' '),
  };
}

function FieldError({ children }) {
  if (!children) {
    return null;
  }

  return <p className="ml-1 text-sm font-semibold text-red-600">{children}</p>;
}

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [phone, setPhone] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const clearFieldError = (fieldName) => {
    setErrorMessage('');
    setFieldErrors((currentErrors) => {
      if (!currentErrors[fieldName]) {
        return currentErrors;
      }

      const nextErrors = { ...currentErrors };
      delete nextErrors[fieldName];
      return nextErrors;
    });
  };

  const handlePhoneChange = (event) => {
    setPhone(sanitizeDigits(event.target.value));
    clearFieldError('phone');
    setErrorMessage('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const fullName = String(formData.get('fullName') || '').trim();
    const email = String(formData.get('email') || '').trim();
    const phone = String(formData.get('phone') || '').trim();
    const password = String(formData.get('password') || '');
    const confirmPassword = String(formData.get('confirmPassword') || '');
    const acceptedTerms = formData.get('acceptedTerms') === 'on';

    setErrorMessage('');
    setSuccessMessage('');
    setFieldErrors({});

    const nextErrors = {
      fullName: validateName(fullName, 'Full name', { min: 2 }),
      email: validateEmail(email),
      phone: validatePhone(phone),
      password: validatePassword(password),
      confirmPassword: password === confirmPassword ? '' : 'Password confirmation does not match.',
      acceptedTerms: acceptedTerms ? '' : 'Please agree to the Terms and Conditions and Privacy Policy.',
    };

    const { lastName, firstMiddleName } = splitFullName(fullName);
    if (!nextErrors.fullName && !firstMiddleName) {
      nextErrors.fullName = 'Please enter both last name and first or middle name.';
    }

    const activeErrors = Object.fromEntries(Object.entries(nextErrors).filter(([, message]) => message));
    if (Object.keys(activeErrors).length > 0) {
      setFieldErrors(activeErrors);
      setErrorMessage(Object.values(activeErrors)[0]);
      return;
    }

    setIsSubmitting(true);

    try {
      await register({
        lastName,
        firstMiddleName,
        email,
        phoneNumber: phone,
        password,
      });
      setSuccessMessage('Registration successful. Please check your email to verify your account.');
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayout>
      <div className="grid w-full max-w-6xl overflow-hidden rounded-[2rem] border border-cyan-100 bg-white shadow-[0_20px_48px_rgba(0,206,209,0.14)] lg:grid-cols-[0.9fr_1.1fr]">
        <section className="relative hidden min-h-[760px] items-center overflow-hidden bg-cyan-950 lg:flex">
          <img
            alt="Immersive AquaPulse water show"
            className="absolute inset-0 z-0 h-full w-full object-cover opacity-70 mix-blend-overlay"
            src="https://lh3.googleusercontent.com/aida/ADBb0ujt3y3oHep8ZyS33fWXSwjI8mG8aZHbNUcl0CdGivcGyeT3du82S-KhXF_z4dlPRBUlc4EswabU5EeIcZJqXipWtpjbttrQ0GOkGXD__Ue8EUNvilyj-UDsJCa1cZbn_l6pfjV_lg7TOdizUqPdcum_qmMFI-csEQojqIgtLoSEhUsOXh1HErJxLtr4lvL3loCl2YH0XpPXQu6PYmM-OELKDDyxmjnmTGP8Zxcj3pb5flEfrV4506pYqA"
          />
          <div className="absolute inset-0 z-[1] bg-gradient-to-br from-cyan-950/95 via-teal-700/60 to-cyan-300/20" />
          <div className="absolute left-12 top-16 z-[2] h-24 w-24 rounded-full border border-white/20 bg-white/10" />
          <div className="absolute right-10 top-1/3 z-[2] h-16 w-16 rounded-full border border-cyan-100/20 bg-cyan-100/10" />
          <div className="absolute bottom-28 left-16 z-[2] h-36 w-36 rounded-full border border-white/15 bg-white/10" />
          <div className="absolute -bottom-24 left-0 right-0 z-[11] h-48 rounded-[50%] bg-white" />
          <BubbleLayer bubbles={registerBubbles} />

          <div className="relative z-20 max-w-lg px-12 text-white">
            <Logo variant="footer" className="mb-8" />

            <h2 className="text-5xl font-black leading-tight tracking-tight">
              Create Your <span className="text-cyan-300">AquaPulse</span> Account
            </h2>
            <p className="mt-6 text-lg leading-8 text-white/85">
              Experience synchronized water and light like never before. Join the pulse of premium water park
              entertainment.
            </p>

            <div className="mt-8 flex flex-wrap gap-4">
              <span className="flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-5 py-3 text-sm font-bold backdrop-blur-md">
                <span className="material-symbols-outlined text-cyan-300">star</span>
                Access Exclusive Shows
              </span>
              <span className="flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-5 py-3 text-sm font-bold backdrop-blur-md">
                <span className="material-symbols-outlined text-cyan-300">schedule</span>
                Priority Booking
              </span>
            </div>
          </div>
        </section>

        <section className="relative flex min-h-[760px] items-center justify-center overflow-hidden px-6 py-12 sm:px-10 lg:px-12">
          <div className="absolute inset-x-0 top-0 h-48 bg-gradient-to-b from-cyan-100/80 to-transparent lg:hidden" />
          <div className="absolute -right-16 top-16 h-44 w-44 rounded-full bg-cyan-200/40 blur-3xl" />
          <div className="absolute -bottom-20 -left-16 h-56 w-56 rounded-full bg-orange-200/25 blur-3xl" />

          <div className="relative z-10 w-full max-w-[540px] rounded-[2rem] border border-cyan-100/80 bg-white/85 p-8 shadow-[0_20px_48px_rgba(0,206,209,0.14)] backdrop-blur-xl sm:p-10 lg:p-12">
            <header className="mb-10 text-center sm:text-left">
              <h2 className="text-3xl font-black tracking-tight text-cyan-800">Get Started</h2>
              <p className="mt-2 text-sm text-slate-600">Enter your details to create an AquaPulse account.</p>
            </header>

            {successMessage ? (
              <div className="space-y-6 text-center py-4">
                <div className="rounded-2xl border border-emerald-100 bg-emerald-50/90 p-8 text-sm font-semibold text-emerald-800 shadow-sm backdrop-blur" role="status">
                  <p className="text-lg font-bold mb-4 text-emerald-950">{successMessage}</p>
                  <p className="text-slate-600 font-normal mb-8 leading-relaxed">
                    We've sent a verification link to your email. Click the link to activate your AquaPulse account and sign in.
                  </p>
                  <Link
                    to="/login"
                    className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#ff6900] to-[#c2410c] py-4 font-bold text-white shadow-lg shadow-orange-700/20 transition duration-300 hover:-translate-y-0.5"
                  >
                    Go to Sign In
                    <span className="material-symbols-outlined text-sm">login</span>
                  </Link>
                </div>
              </div>
            ) : (
              <form className="space-y-6" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <label className="ml-1 block text-sm font-bold text-slate-600" htmlFor="register-name">
                  Full Name
                </label>
                <div className="group relative">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 transition group-focus-within:text-cyan-700">
                    person
                  </span>
                  <input
                    className="w-full rounded-full border border-transparent bg-cyan-50/70 py-4 pl-12 pr-4 text-slate-900 outline-none transition focus:border-cyan-500 focus:bg-white focus:ring-2 focus:ring-cyan-200"
                    id="register-name"
                    name="fullName"
                    placeholder="John Doe"
                    required
                    type="text"
                    onChange={() => clearFieldError('fullName')}
                  />
                </div>
                <FieldError>{fieldErrors.fullName}</FieldError>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="ml-1 block text-sm font-bold text-slate-600" htmlFor="register-email">
                    Email Address
                  </label>
                  <div className="group relative">
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 transition group-focus-within:text-cyan-700">
                      mail
                    </span>
                    <input
                      className="w-full rounded-full border border-transparent bg-cyan-50/70 py-4 pl-12 pr-4 text-slate-900 outline-none transition focus:border-cyan-500 focus:bg-white focus:ring-2 focus:ring-cyan-200"
                      id="register-email"
                      name="email"
                      placeholder="john@example.com"
                      required
                      type="email"
                      onChange={() => clearFieldError('email')}
                    />
                  </div>
                  <FieldError>{fieldErrors.email}</FieldError>
                </div>

                <div className="space-y-2">
                  <label className="ml-1 block text-sm font-bold text-slate-600" htmlFor="register-phone">
                    Phone Number
                  </label>
                  <div className="group relative">
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 transition group-focus-within:text-cyan-700">
                      call
                    </span>
                    <input
                      className="w-full rounded-full border border-transparent bg-cyan-50/70 py-4 pl-12 pr-4 text-slate-900 outline-none transition focus:border-cyan-500 focus:bg-white focus:ring-2 focus:ring-cyan-200"
                      id="register-phone"
                      inputMode="numeric"
                      name="phone"
                      pattern="[0-9]*"
                      placeholder="0123456789"
                      type="tel"
                      value={phone}
                      onChange={handlePhoneChange}
                    />
                  </div>
                  <FieldError>{fieldErrors.phone}</FieldError>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="ml-1 block text-sm font-bold text-slate-600" htmlFor="register-password">
                    Password
                  </label>
                  <div className="group relative">
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 transition group-focus-within:text-cyan-700">
                      lock
                    </span>
                    <input
                      className="w-full rounded-full border border-transparent bg-cyan-50/70 py-4 pl-12 pr-12 text-slate-900 outline-none transition focus:border-cyan-500 focus:bg-white focus:ring-2 focus:ring-cyan-200"
                      id="register-password"
                      name="password"
                      placeholder="••••••••"
                      required
                      type={showPassword ? 'text' : 'password'}
                      onChange={() => clearFieldError('password')}
                    />
                    <button
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-700"
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      <span className="material-symbols-outlined">
                        {showPassword ? 'visibility_off' : 'visibility'}
                      </span>
                    </button>
                  </div>
                  <FieldError>{fieldErrors.password}</FieldError>
                </div>

                <div className="space-y-2">
                  <label className="ml-1 block text-sm font-bold text-slate-600" htmlFor="register-confirm-password">
                    Confirm Password
                  </label>
                  <div className="group relative">
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 transition group-focus-within:text-cyan-700">
                      verified_user
                    </span>
                    <input
                      className="w-full rounded-full border border-transparent bg-cyan-50/70 py-4 pl-12 pr-12 text-slate-900 outline-none transition focus:border-cyan-500 focus:bg-white focus:ring-2 focus:ring-cyan-200"
                      id="register-confirm-password"
                      name="confirmPassword"
                      placeholder="••••••••"
                      required
                      type={showConfirmPassword ? 'text' : 'password'}
                      onChange={() => clearFieldError('confirmPassword')}
                    />
                    <button
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-700"
                      type="button"
                      onClick={() => setShowConfirmPassword((prev) => !prev)}
                      aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                    >
                      <span className="material-symbols-outlined">
                        {showConfirmPassword ? 'visibility_off' : 'visibility'}
                      </span>
                    </button>
                  </div>
                  <FieldError>{fieldErrors.confirmPassword}</FieldError>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-2xl bg-cyan-50/60 p-4 transition hover:bg-cyan-50">
                <input
                  className="peer sr-only"
                  id="register-terms"
                  name="acceptedTerms"
                  type="checkbox"
                  onChange={() => clearFieldError('acceptedTerms')}
                />
                <label
                  className="mt-0.5 flex h-5 w-5 shrink-0 cursor-pointer items-center justify-center rounded-full border-2 border-cyan-300 bg-white shadow-sm transition peer-checked:border-cyan-600 peer-checked:bg-gradient-to-br peer-checked:from-cyan-400 peer-checked:to-teal-700 peer-checked:[&>svg]:opacity-100 peer-hover:border-cyan-500 peer-hover:bg-cyan-50 peer-focus-visible:ring-4 peer-focus-visible:ring-cyan-200"
                  htmlFor="register-terms"
                  aria-label="Agree to terms and privacy policy"
                >
                  <svg className="h-3 w-3 text-white opacity-0 transition" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                    <path d="M2.25 6.15 4.85 8.75 9.75 3.25" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </label>
                <p className="text-sm leading-6 text-slate-600">
                  <label className="cursor-pointer" htmlFor="register-terms">
                    I agree to the
                  </label>{' '}
                  <a className="font-bold text-cyan-700 underline-offset-4 transition hover:underline" href="#">
                    Terms and Conditions
                  </a>{' '}
                  and{' '}
                  <a className="font-bold text-cyan-700 underline-offset-4 transition hover:underline" href="#">
                    Privacy Policy
                  </a>
                  .
                </p>
              </div>
              <FieldError>{fieldErrors.acceptedTerms}</FieldError>

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
                className="flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#ff6900] to-[#c2410c] py-4 font-bold text-white shadow-lg shadow-orange-700/20 transition duration-300 hover:-translate-y-0.5 hover:shadow-orange-700/30 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-70"
                disabled={isSubmitting}
                type="submit"
              >
                {isSubmitting ? 'Creating account...' : 'Create Account'}
                <span className="material-symbols-outlined">arrow_forward</span>
              </button>
            </form>
            )}

            <p className="mt-10 text-center text-sm text-slate-600">
              Already have an account?
              <Link className="ml-1 font-bold text-cyan-700 underline-offset-4 transition hover:underline" to="/login">
                Sign In
              </Link>
            </p>
          </div>
        </section>
      </div>
    </AuthLayout>
  );
}
