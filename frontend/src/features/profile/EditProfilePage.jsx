import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { useAuth } from '../../features/auth/AuthContext.jsx';
import MainLayout from '../../shared/layouts/MainLayout.jsx';
import { updateProfile } from '../../services/authService.js';
import {
  sanitizeDigits,
  validateName,
  validatePhone,
} from '../../shared/utils/validation.js';

function FieldLabel({ children, icon }) {
  return (
    <label className="ml-1 flex items-center gap-2 text-[13px] font-black uppercase tracking-[0.18em] text-slate-500">
      <span className="material-symbols-outlined text-[18px] text-cyan-700">{icon}</span>
      {children}
    </label>
  );
}

function FieldError({ children }) {
  if (!children) {
    return null;
  }

  return <p className="ml-1 text-sm font-semibold text-red-600">{children}</p>;
}

const inputClassName =
  'w-full rounded-2xl border border-transparent bg-cyan-50/70 px-6 py-4 text-base text-slate-900 shadow-sm outline-none transition focus:border-cyan-500 focus:bg-white focus:ring-2 focus:ring-cyan-200';

export default function EditProfilePage() {
  const { user, loading, refreshCurrentUser } = useAuth();
  const navigate = useNavigate();

  const [values, setValues] = useState({
    firstMiddleName: '',
    lastName: '',
    gender: '',
    phoneNumber: '',
    address: '',
    dateOfBirth: '',
  });

  const [fieldErrors, setFieldErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState('');
  const [generalError, setGeneralError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!user && !loading) {
      refreshCurrentUser();
    }
  }, [user, loading, refreshCurrentUser]);

  useEffect(() => {
    if (user) {
      setValues({
        firstMiddleName: user.firstMiddleName || '',
        lastName: user.lastName || '',
        gender: user.gender || '',
        phoneNumber: user.phoneNumber || '',
        address: user.address || '',
        dateOfBirth: user.dateOfBirth || '',
      });
    }
  }, [user]);

  if (loading || !user) {
    return (
      <MainLayout>
        <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-cyan-700 border-t-transparent" />
          <p className="text-sm font-semibold text-cyan-800">Loading your profile...</p>
        </div>
      </MainLayout>
    );
  }

  const clearFieldError = (fieldName) => {
    setFieldErrors((currentErrors) => {
      if (!currentErrors[fieldName]) {
        return currentErrors;
      }

      const nextErrors = { ...currentErrors };
      delete nextErrors[fieldName];
      return nextErrors;
    });
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setValues((currentValues) => ({
      ...currentValues,
      [name]: name === 'phoneNumber' ? sanitizeDigits(value) : value,
    }));
    clearFieldError(name);
    setSuccessMessage('');
    setGeneralError('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    // Client-side validations
    const nextErrors = {
      firstMiddleName: validateName(values.firstMiddleName, 'First and middle name'),
      lastName: validateName(values.lastName, 'Last name'),
      phoneNumber: validatePhone(values.phoneNumber, { required: false }),
      address: values.address.length > 255 ? 'Address must not exceed 255 characters.' : '',
    };

    if (values.gender && !['MALE', 'FEMALE', 'OTHER'].includes(values.gender)) {
      nextErrors.gender = 'Please select a valid gender.';
    }

    if (values.dateOfBirth) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const dob = new Date(values.dateOfBirth);
      dob.setHours(0, 0, 0, 0);
      if (dob >= today) {
        nextErrors.dateOfBirth = 'Date of birth must be in the past (before today).';
      }
    }

    const activeErrors = Object.fromEntries(Object.entries(nextErrors).filter(([, message]) => message));
    setFieldErrors(activeErrors);

    if (Object.keys(activeErrors).length > 0) {
      setSuccessMessage('');
      return;
    }

    setIsSaving(true);
    setSuccessMessage('');
    setGeneralError('');

    try {
      // Map empty inputs to null to avoid storing empty string values for optional fields
      const payload = {
        lastName: values.lastName.trim(),
        firstMiddleName: values.firstMiddleName.trim(),
        gender: values.gender || null,
        phoneNumber: values.phoneNumber.trim() ? values.phoneNumber.trim() : null,
        address: values.address.trim() ? values.address.trim() : null,
        dateOfBirth: values.dateOfBirth || null,
      };

      await updateProfile(payload);
      setSuccessMessage('Profile updated successfully! Redirecting...');
      
      // Refresh AuthContext
      await refreshCurrentUser();

      setTimeout(() => {
        navigate('/profile');
      }, 1500);
    } catch (error) {
      const backendValidationErrors = error.response?.data?.errors;
      if (backendValidationErrors) {
        setFieldErrors(backendValidationErrors);
      } else {
        setGeneralError(error.response?.data?.message || error.message || 'Failed to update profile.');
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <MainLayout>
      <div className="relative overflow-hidden">
        <div className="absolute left-[8%] top-16 h-32 w-32 rounded-full bg-cyan-200/40 blur-2xl" />
        <div className="absolute right-[6%] top-48 h-48 w-48 rounded-full bg-teal-200/35 blur-3xl" />
        <div className="absolute bottom-16 left-[20%] h-24 w-24 rounded-full bg-cyan-300/30 blur-2xl" />
        <svg className="absolute bottom-0 left-0 w-full opacity-10" fill="none" viewBox="0 0 1440 320" aria-hidden="true">
          <path
            d="M0,160L48,176C96,192,192,224,288,224C384,224,480,192,576,165.3C672,139,768,117,864,128C960,139,1056,181,1152,192C1248,203,1344,181,1392,170.7L1440,160L1440,320L0,320Z"
            fill="#00ced1"
          />
        </svg>

        <main className="relative z-10 mx-auto max-w-7xl px-4 py-12 sm:px-6 md:py-16 lg:px-8">
          <section className="overflow-hidden rounded-[2rem] border border-white bg-white shadow-[0_20px_48px_rgba(0,0,0,0.05)]">
            <div className="flex flex-col justify-between gap-4 bg-gradient-to-r from-cyan-400 via-cyan-600 to-teal-800 p-8 text-white md:flex-row md:items-center md:p-10">
              <div>
                <div className="mb-2 flex flex-wrap items-center gap-3">
                  <h1 className="text-3xl font-black tracking-tight">Edit Profile</h1>
                  <span className="flex items-center gap-1 rounded-full border border-cyan-200/30 bg-cyan-200/20 px-3 py-1 text-[10px] font-black uppercase tracking-[0.24em] text-cyan-50 uppercase">
                    {user.status} Account
                  </span>
                </div>
                <p className="text-sm leading-6 text-white/80">Update your personal information for your AquaPulse account.</p>
              </div>
            </div>

            <div className="p-8 md:p-12">
              <form className="space-y-12" onSubmit={handleSubmit}>
                <div className="flex flex-col items-center gap-8 border-b border-cyan-100 pb-10 md:flex-row">
                  <div className="group relative">
                    <div className="h-32 w-32 overflow-hidden rounded-full border-4 border-cyan-100 bg-cyan-50 shadow-xl ring-4 ring-white flex items-center justify-center">
                      {user.avatarUrl ? (
                        <img alt="Profile" className="h-full w-full object-cover" src={user.avatarUrl} />
                      ) : (
                        <span className="flex h-full w-full items-center justify-center bg-cyan-100 text-4xl font-black text-cyan-800 uppercase">
                          {(user.fullName || user.email || 'A').charAt(0)}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="text-center md:text-left">
                    <h3 className="text-lg font-black text-slate-800">{user.fullName}</h3>
                    <p className="text-sm text-slate-500">Avatar initials automatically refresh on name change.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-x-8 gap-y-8 md:grid-cols-2">
                  <div className="space-y-3">
                    <FieldLabel icon="person">First and Middle Name</FieldLabel>
                    <input
                      className={inputClassName}
                      name="firstMiddleName"
                      placeholder="Enter names"
                      type="text"
                      value={values.firstMiddleName}
                      onChange={handleChange}
                      disabled={isSaving}
                    />
                    <FieldError>{fieldErrors.firstMiddleName}</FieldError>
                  </div>

                  <div className="space-y-3">
                    <FieldLabel icon="badge">Last Name</FieldLabel>
                    <input
                      className={inputClassName}
                      name="lastName"
                      placeholder="Enter last name"
                      type="text"
                      value={values.lastName}
                      onChange={handleChange}
                      disabled={isSaving}
                    />
                    <FieldError>{fieldErrors.lastName}</FieldError>
                  </div>

                  <div className="space-y-3">
                    <FieldLabel icon="diversity_3">Gender</FieldLabel>
                    <div className="relative">
                      <select
                        className={`${inputClassName} appearance-none cursor-pointer`}
                        name="gender"
                        value={values.gender}
                        onChange={handleChange}
                        disabled={isSaving}
                      >
                        <option value="">Prefer not to say</option>
                        <option value="FEMALE">Female</option>
                        <option value="MALE">Male</option>
                        <option value="OTHER">Other</option>
                      </select>
                      <span className="material-symbols-outlined pointer-events-none absolute right-6 top-1/2 -translate-y-1/2 text-slate-400">
                        expand_more
                      </span>
                    </div>
                    <FieldError>{fieldErrors.gender}</FieldError>
                  </div>

                  <div className="space-y-3">
                    <FieldLabel icon="call">Phone Number</FieldLabel>
                    <input
                      className={inputClassName}
                      inputMode="numeric"
                      name="phoneNumber"
                      pattern="[0-9]*"
                      placeholder="0909123456 (Optional)"
                      type="tel"
                      value={values.phoneNumber}
                      onChange={handleChange}
                      disabled={isSaving}
                    />
                    <FieldError>{fieldErrors.phoneNumber}</FieldError>
                  </div>

                  <div className="space-y-3">
                    <FieldLabel icon="calendar_month">Date of Birth</FieldLabel>
                    <input
                      className={inputClassName}
                      name="dateOfBirth"
                      type="date"
                      value={values.dateOfBirth}
                      onChange={handleChange}
                      disabled={isSaving}
                    />
                    <FieldError>{fieldErrors.dateOfBirth}</FieldError>
                  </div>

                  <div className="space-y-3">
                    <FieldLabel icon="lock">Email Address</FieldLabel>
                    <div className="relative">
                      <input
                        className="w-full cursor-not-allowed rounded-2xl border border-cyan-100 bg-slate-100 px-6 py-4 text-base text-slate-500 shadow-inner outline-none"
                        value={user.email}
                        readOnly
                        disabled
                        type="email"
                      />
                      <span className="absolute right-6 top-1/2 -translate-y-1/2 rounded bg-slate-200 px-2 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">
                        Read Only
                      </span>
                    </div>
                    <p className="ml-4 text-xs italic text-slate-500">Email cannot be changed. Contact support for assistance.</p>
                  </div>

                  <div className="space-y-3 md:col-span-2">
                    <FieldLabel icon="location_on">Residential Address</FieldLabel>
                    <textarea
                      className={`${inputClassName} min-h-32 resize-none`}
                      maxLength="255"
                      name="address"
                      placeholder="123 Coral Reef Drive, Atlantis City... (Optional)"
                      rows="3"
                      value={values.address}
                      onChange={handleChange}
                      disabled={isSaving}
                    />
                    <FieldError>{fieldErrors.address}</FieldError>
                  </div>
                </div>

                {successMessage && (
                  <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700" role="status">
                    {successMessage}
                  </div>
                )}

                {generalError && (
                  <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700" role="alert">
                    {generalError}
                  </div>
                )}

                <div className="flex flex-col items-center justify-between gap-6 border-t border-cyan-100 pt-10 md:flex-row">
                  <a 
                    className="order-3 px-4 py-2 font-bold text-slate-400 transition hover:text-cyan-700 md:order-1" 
                    href="/profile"
                  >
                    Back to Profile
                  </a>

                  <div className="order-1 flex w-full flex-col gap-4 sm:flex-row md:order-2 md:w-auto">
                    <a
                      className="rounded-full border-2 border-cyan-100 px-10 py-4 text-center font-bold text-slate-600 shadow-sm transition hover:bg-cyan-50 active:scale-95"
                      href="/profile"
                    >
                      Cancel
                    </a>
                    <button
                      className="rounded-full bg-gradient-to-r from-cyan-600 to-teal-800 px-12 py-4 font-bold text-white shadow-[0_12px_24px_rgba(0,105,107,0.2)] transition hover:shadow-[0_16px_32px_rgba(0,105,107,0.3)] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                      type="submit"
                      disabled={isSaving}
                    >
                      {isSaving ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </section>
        </main>
      </div>
    </MainLayout>
  );
}
