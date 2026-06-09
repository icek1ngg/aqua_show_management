import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import {
  disableAdminUser,
  enableAdminUser,
  getAdminUser,
  getAdminUsers,
  updateAdminUser,
} from '../services/adminUserService.js';

const roles = ['USER', 'STAFF', 'MANAGER', 'ADMIN'];
const statuses = ['ACTIVE', 'PENDING_VERIFICATION', 'INACTIVE', 'DISABLED'];
const genders = ['MALE', 'FEMALE', 'OTHER'];

const emptyForm = {
  lastName: '',
  firstMiddleName: '',
  gender: '',
  phoneNumber: '',
  address: '',
  dateOfBirth: '',
  status: '',
};

function getErrorMessage(error, fallback) {
  return error?.response?.data?.message || error?.message || fallback;
}

function getValidationErrors(error) {
  return error?.response?.data?.errors || {};
}

function formatEnum(value) {
  return value ? value.replaceAll('_', ' ') : 'TBA';
}

function formatDate(value) {
  if (!value) {
    return 'TBA';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function initials(user) {
  const source = user?.fullName || user?.email || 'User';
  return source
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'U';
}

function statusClass(status) {
  if (status === 'ACTIVE') {
    return 'text-primary';
  }

  if (status === 'PENDING_VERIFICATION' || status === 'INACTIVE') {
    return 'text-tertiary';
  }

  return 'text-error';
}

function roleBadgeClass(role) {
  if (role === 'ADMIN') {
    return 'bg-primary-container text-on-primary-container';
  }

  if (role === 'MANAGER') {
    return 'bg-secondary-container text-on-secondary-container';
  }

  if (role === 'STAFF') {
    return 'bg-tertiary-container text-on-tertiary-container';
  }

  return 'bg-surface-variant text-on-surface-variant';
}

function toForm(user) {
  return {
    lastName: user?.lastName || '',
    firstMiddleName: user?.firstMiddleName || '',
    gender: user?.gender || '',
    phoneNumber: user?.phoneNumber || '',
    address: user?.address || '',
    dateOfBirth: user?.dateOfBirth || '',
    status: user?.status || '',
  };
}

function toPayload(form) {
  return {
    lastName: form.lastName.trim(),
    firstMiddleName: form.firstMiddleName.trim(),
    gender: form.gender || null,
    phoneNumber: form.phoneNumber.trim(),
    address: form.address.trim(),
    dateOfBirth: form.dateOfBirth || null,
    status: form.status || null,
  };
}

function FieldError({ children }) {
  if (!children) {
    return null;
  }

  return <p className="mt-1 text-label-md font-bold text-error">{children}</p>;
}

function SidebarLink({ active, icon, label, to }) {
  return (
    <Link
      className={[
        'flex items-center gap-unit-md px-unit-lg py-unit-md transition-all',
        active
          ? 'border-l-4 border-primary-fixed bg-on-secondary-fixed-variant/30 text-primary-fixed'
          : 'text-on-secondary-fixed-variant hover:bg-on-secondary-fixed-variant/20 hover:text-primary-fixed',
      ].join(' ')}
      to={to}
    >
      <span className="material-symbols-outlined">{icon}</span>
      <span className="font-body-md text-body-md">{label}</span>
    </Link>
  );
}

function StatCard({ icon, label, value, tone = 'primary' }) {
  const toneClass = {
    primary: 'border-primary text-primary bg-primary/10',
    secondary: 'border-secondary text-secondary bg-secondary/10',
    tertiary: 'border-tertiary text-tertiary bg-tertiary/10',
    error: 'border-error text-error bg-error/10',
  }[tone];

  return (
    <div className={`glass-card rounded-lg border-l-4 p-unit-lg shadow-sm ${toneClass.split(' ')[0]}`}>
      <div className="mb-unit-md flex items-start justify-between">
        <span className={`material-symbols-outlined rounded-lg p-unit-sm ${toneClass.split(' ').slice(1).join(' ')}`}>{icon}</span>
      </div>
      <h3 className="font-label-lg text-label-lg text-on-surface-variant">{label}</h3>
      <p className="mt-unit-xs font-headline-md text-headline-md text-on-surface">{value}</p>
    </div>
  );
}

function UserModal({
  user,
  form,
  fieldErrors,
  generalError,
  isSaving,
  isDetailLoading,
  onChange,
  onClose,
  onSubmit,
}) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-unit-md">
      <button className="absolute inset-0 bg-on-secondary-fixed/40 backdrop-blur-sm" type="button" aria-label="Close user modal" onClick={onClose} />
      <div className="relative w-full max-w-2xl overflow-hidden rounded-lg bg-surface shadow-2xl">
        <div className="flex items-center justify-between bg-primary p-unit-lg text-on-primary">
          <div>
            <h3 className="font-headline-md text-headline-md">Edit User Profile</h3>
            <p className="font-label-md text-label-md opacity-80">Update supported account fields. Email and role are read-only here.</p>
          </div>
          <button className="rounded-full p-unit-sm transition-colors hover:bg-white/10" disabled={isSaving} type="button" onClick={onClose}>
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {isDetailLoading ? (
          <div className="flex min-h-[420px] flex-col items-center justify-center text-on-surface-variant">
            <span className="material-symbols-outlined animate-spin text-5xl text-primary">progress_activity</span>
            <p className="mt-unit-md font-label-lg">Loading user details...</p>
          </div>
        ) : (
          <form onSubmit={onSubmit}>
            <div className="max-h-[716px] space-y-unit-lg overflow-y-auto p-unit-lg">
              {generalError && (
                <div className="rounded-md border border-error/20 bg-error/10 p-unit-md text-body-sm font-bold text-error">
                  {generalError}
                </div>
              )}

              <div className="flex items-center gap-unit-lg">
                <div className="flex h-24 w-24 items-center justify-center rounded-full border-4 border-surface-container bg-primary-container text-headline-md font-bold text-on-primary-container">
                  {initials(user)}
                </div>
                <div className="flex-1">
                  <p className="font-label-lg text-label-lg text-on-surface">{user?.fullName || 'User Profile'}</p>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">{user?.email}</p>
                  <div className="mt-unit-sm flex flex-wrap gap-unit-sm">
                    <span className={`rounded-full px-unit-md py-unit-xs text-label-md font-label-md ${roleBadgeClass(user?.role)}`}>{formatEnum(user?.role)}</span>
                    <span className={`rounded-full bg-surface-container-high px-unit-md py-unit-xs text-label-md font-label-md ${statusClass(user?.status)}`}>{formatEnum(user?.status)}</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-unit-lg md:grid-cols-2">
                <div className="space-y-unit-xs">
                  <label className="font-label-lg text-label-lg text-on-surface" htmlFor="user-first-middle">First / Middle Name</label>
                  <input
                    className="w-full rounded-lg border border-outline-variant/40 bg-surface-container-low px-unit-md py-unit-sm outline-none transition-all focus:border-primary"
                    id="user-first-middle"
                    name="firstMiddleName"
                    type="text"
                    value={form.firstMiddleName}
                    onChange={onChange}
                  />
                  <FieldError>{fieldErrors.firstMiddleName}</FieldError>
                </div>

                <div className="space-y-unit-xs">
                  <label className="font-label-lg text-label-lg text-on-surface" htmlFor="user-last-name">Last Name</label>
                  <input
                    className="w-full rounded-lg border border-outline-variant/40 bg-surface-container-low px-unit-md py-unit-sm outline-none transition-all focus:border-primary"
                    id="user-last-name"
                    name="lastName"
                    type="text"
                    value={form.lastName}
                    onChange={onChange}
                  />
                  <FieldError>{fieldErrors.lastName}</FieldError>
                </div>

                <div className="space-y-unit-xs">
                  <label className="font-label-lg text-label-lg text-on-surface" htmlFor="user-email">Email Address</label>
                  <input
                    className="w-full cursor-not-allowed rounded-lg border border-outline-variant/40 bg-surface-container px-unit-md py-unit-sm text-on-surface-variant outline-none"
                    disabled
                    id="user-email"
                    type="email"
                    value={user?.email || ''}
                    readOnly
                  />
                </div>

                <div className="space-y-unit-xs">
                  <label className="font-label-lg text-label-lg text-on-surface" htmlFor="user-role">Role</label>
                  <input
                    className="w-full cursor-not-allowed rounded-lg border border-outline-variant/40 bg-surface-container px-unit-md py-unit-sm text-on-surface-variant outline-none"
                    disabled
                    id="user-role"
                    type="text"
                    value={formatEnum(user?.role)}
                    readOnly
                  />
                </div>

                <div className="space-y-unit-xs">
                  <label className="font-label-lg text-label-lg text-on-surface" htmlFor="user-phone">Phone Number</label>
                  <input
                    className="w-full rounded-lg border border-outline-variant/40 bg-surface-container-low px-unit-md py-unit-sm outline-none transition-all focus:border-primary"
                    id="user-phone"
                    name="phoneNumber"
                    placeholder="9 to 11 digits"
                    type="tel"
                    value={form.phoneNumber}
                    onChange={onChange}
                  />
                  <FieldError>{fieldErrors.phoneNumber}</FieldError>
                </div>

                <div className="space-y-unit-xs">
                  <label className="font-label-lg text-label-lg text-on-surface" htmlFor="user-gender">Gender</label>
                  <select
                    className="w-full rounded-lg border border-outline-variant/40 bg-surface-container-low px-unit-md py-unit-sm outline-none transition-all focus:border-primary"
                    id="user-gender"
                    name="gender"
                    value={form.gender}
                    onChange={onChange}
                  >
                    <option value="">Not specified</option>
                    {genders.map((gender) => (
                      <option key={gender} value={gender}>{formatEnum(gender)}</option>
                    ))}
                  </select>
                  <FieldError>{fieldErrors.gender}</FieldError>
                </div>

                <div className="space-y-unit-xs">
                  <label className="font-label-lg text-label-lg text-on-surface" htmlFor="user-date-of-birth">Date of Birth</label>
                  <input
                    className="w-full rounded-lg border border-outline-variant/40 bg-surface-container-low px-unit-md py-unit-sm outline-none transition-all focus:border-primary"
                    id="user-date-of-birth"
                    name="dateOfBirth"
                    type="date"
                    value={form.dateOfBirth}
                    onChange={onChange}
                  />
                  <FieldError>{fieldErrors.dateOfBirth}</FieldError>
                </div>

                <div className="space-y-unit-xs">
                  <label className="font-label-lg text-label-lg text-on-surface" htmlFor="user-status">Status</label>
                  <select
                    className="w-full rounded-lg border border-outline-variant/40 bg-surface-container-low px-unit-md py-unit-sm outline-none transition-all focus:border-primary"
                    id="user-status"
                    name="status"
                    value={form.status}
                    onChange={onChange}
                  >
                    {statuses.map((status) => (
                      <option key={status} value={status}>{formatEnum(status)}</option>
                    ))}
                  </select>
                  <FieldError>{fieldErrors.status}</FieldError>
                </div>
              </div>

              <div className="space-y-unit-xs">
                <label className="font-label-lg text-label-lg text-on-surface" htmlFor="user-address">Address</label>
                <textarea
                  className="min-h-24 w-full rounded-lg border border-outline-variant/40 bg-surface-container-low px-unit-md py-unit-sm outline-none transition-all focus:border-primary"
                  id="user-address"
                  name="address"
                  value={form.address}
                  onChange={onChange}
                />
                <FieldError>{fieldErrors.address}</FieldError>
              </div>
            </div>

            <div className="flex justify-between gap-unit-md border-t border-outline-variant/20 bg-surface-container-low p-unit-lg">
              <button className="rounded-full px-unit-lg py-unit-md font-label-lg text-label-lg text-on-surface-variant transition-all hover:bg-surface-container" disabled={isSaving} type="button" onClick={onClose}>
                Cancel
              </button>
              <button className="rounded-full bg-primary px-unit-lg py-unit-md font-label-lg text-label-lg text-on-primary transition-all hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60" disabled={isSaving} type="submit">
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

function ConfirmDisableDialog({ user, error, isWorking, onCancel, onConfirm }) {
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-on-background/40 p-unit-lg backdrop-blur-sm">
      <button className="absolute inset-0" type="button" aria-label="Cancel disable" onClick={onCancel} />
      <div className="glass-card relative w-full max-w-md rounded-lg p-unit-lg text-center shadow-2xl">
        <div className="mx-auto mb-unit-lg flex h-16 w-16 items-center justify-center rounded-full bg-error/10">
          <span className="material-symbols-outlined text-4xl text-error">warning</span>
        </div>
        <h3 className="font-headline-md text-headline-md font-bold text-on-surface">Disable User?</h3>
        <p className="mt-unit-sm text-body-md text-on-surface-variant">
          This will prevent <strong>{user?.fullName || user?.email}</strong> from accessing the system.
        </p>
        {error && <p className="mt-unit-md rounded-md bg-error/10 p-unit-sm text-label-md font-bold text-error">{error}</p>}
        <div className="mt-unit-lg flex gap-unit-md">
          <button className="flex-1 rounded-md border border-outline-variant px-unit-md py-unit-md font-label-lg text-on-surface-variant hover:bg-surface-container-high" disabled={isWorking} type="button" onClick={onCancel}>
            Cancel
          </button>
          <button className="flex-1 rounded-md bg-error px-unit-md py-unit-md font-label-lg text-on-error hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60" disabled={isWorking} type="button" onClick={onConfirm}>
            {isWorking ? 'Disabling...' : 'Disable'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ManageUsersPage() {
  const [users, setUsers] = useState([]);
  const [filters, setFilters] = useState({
    keyword: '',
    role: '',
    status: '',
  });
  const [pagination, setPagination] = useState({
    page: 0,
    size: 10,
    totalItems: 0,
    totalPages: 0,
    hasNext: false,
    hasPrevious: false,
  });
  const [currentPage, setCurrentPage] = useState(0);
  const [reloadKey, setReloadKey] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [actionError, setActionError] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [userForm, setUserForm] = useState(emptyForm);
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [userToDisable, setUserToDisable] = useState(null);
  const [disableError, setDisableError] = useState('');
  const [workingUserId, setWorkingUserId] = useState(null);

  useEffect(() => {
    let isActive = true;

    async function loadUsers() {
      setIsLoading(true);
      setLoadError('');

      try {
        const response = await getAdminUsers({
          keyword: filters.keyword,
          role: filters.role,
          status: filters.status,
          page: currentPage,
          size: pagination.size,
        });

        if (!isActive) {
          return;
        }

        const items = Array.isArray(response?.items) ? response.items : [];
        setUsers(items);
        setPagination({
          page: response?.page ?? currentPage,
          size: response?.size ?? pagination.size,
          totalItems: response?.totalItems ?? items.length,
          totalPages: response?.totalPages ?? (items.length ? 1 : 0),
          hasNext: Boolean(response?.hasNext),
          hasPrevious: Boolean(response?.hasPrevious),
        });
      } catch (error) {
        if (!isActive) {
          return;
        }

        setUsers([]);
        setPagination((current) => ({
          ...current,
          page: currentPage,
          totalItems: 0,
          totalPages: 0,
          hasNext: false,
          hasPrevious: false,
        }));
        setLoadError(getErrorMessage(error, 'Could not load users.'));
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    }

    loadUsers();

    return () => {
      isActive = false;
    };
  }, [currentPage, filters, pagination.size, reloadKey]);

  function handleFilterChange(event) {
    const { name, value } = event.target;

    setFilters((current) => ({
      ...current,
      [name]: value,
    }));
    setCurrentPage(0);
  }

  function resetFilters() {
    setFilters({ keyword: '', role: '', status: '' });
    setCurrentPage(0);
  }

  async function openUser(user) {
    setSelectedUser(user);
    setUserForm(emptyForm);
    setFieldErrors({});
    setFormError('');
    setIsDetailLoading(true);

    try {
      const detail = await getAdminUser(user.id);
      setSelectedUser(detail);
      setUserForm(toForm(detail));
    } catch (error) {
      setFormError(getErrorMessage(error, 'Could not load user details.'));
    } finally {
      setIsDetailLoading(false);
    }
  }

  function closeUserModal() {
    if (isSaving) {
      return;
    }

    setSelectedUser(null);
    setUserForm(emptyForm);
    setFieldErrors({});
    setFormError('');
  }

  function handleFormChange(event) {
    const { name, value } = event.target;
    setUserForm((current) => ({ ...current, [name]: value }));
    setFieldErrors((current) => ({ ...current, [name]: '' }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!selectedUser?.id) {
      return;
    }

    setIsSaving(true);
    setFieldErrors({});
    setFormError('');
    setActionError('');
    setSuccessMessage('');

    try {
      const updated = await updateAdminUser(selectedUser.id, toPayload(userForm));
      setSelectedUser(updated);
      setUserForm(toForm(updated));
      setSuccessMessage('User updated successfully.');
      setReloadKey((key) => key + 1);
    } catch (error) {
      setFieldErrors(getValidationErrors(error));
      setFormError(getErrorMessage(error, 'Could not update user.'));
    } finally {
      setIsSaving(false);
    }
  }

  async function handleEnable(user) {
    setWorkingUserId(user.id);
    setActionError('');
    setSuccessMessage('');

    try {
      await enableAdminUser(user.id);
      setSuccessMessage('User enabled successfully.');
      setReloadKey((key) => key + 1);
    } catch (error) {
      setActionError(getErrorMessage(error, 'Could not enable user.'));
    } finally {
      setWorkingUserId(null);
    }
  }

  async function handleDisable() {
    if (!userToDisable?.id) {
      return;
    }

    setWorkingUserId(userToDisable.id);
    setDisableError('');
    setActionError('');
    setSuccessMessage('');

    try {
      await disableAdminUser(userToDisable.id);
      setSuccessMessage('User disabled successfully.');
      setUserToDisable(null);
      setReloadKey((key) => key + 1);
    } catch (error) {
      setDisableError(getErrorMessage(error, 'Could not disable user.'));
    } finally {
      setWorkingUserId(null);
    }
  }

  const stats = useMemo(() => {
    const active = users.filter((user) => user.status === 'ACTIVE').length;
    const disabled = users.filter((user) => user.status === 'DISABLED').length;
    const admins = users.filter((user) => user.role === 'ADMIN').length;

    return {
      total: pagination.totalItems,
      active,
      disabled,
      admins,
    };
  }, [users, pagination.totalItems]);

  const startItem = users.length === 0 ? 0 : pagination.page * pagination.size + 1;
  const endItem = users.length === 0 ? 0 : startItem + users.length - 1;

  return (
    <div className="min-h-screen bg-background font-body-md text-on-background selection:bg-primary-container selection:text-on-primary-container">
      <style>{`.material-symbols-outlined {
            font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
        }
        .glass-card {
            background: rgba(255, 255, 255, 0.7);
            backdrop-filter: blur(20px);
            border: 1px solid rgba(255, 255, 255, 0.2);
        }
        ::-webkit-scrollbar {
            width: 6px;
        }
        ::-webkit-scrollbar-track {
            background: transparent;
        }
        ::-webkit-scrollbar-thumb {
            background: #bac9c9;
            border-radius: 10px;
        }`}</style>

      <aside className="fixed left-0 top-0 z-50 flex h-full w-sidebar-width flex-col bg-on-secondary-fixed py-unit-lg shadow-lg">
        <div className="mb-unit-xl px-unit-lg">
          <h1 className="font-headline-md text-headline-md font-bold text-primary-fixed">AquaShow MS</h1>
          <p className="font-label-md text-label-md text-primary-fixed-dim/70">Management System</p>
        </div>
        <nav className="flex flex-1 flex-col gap-unit-xs">
          <SidebarLink icon="dashboard" label="Dashboard" to="/manager/dashboard" />
          <SidebarLink icon="theater_comedy" label="Shows" to="/manager/shows" />
          <SidebarLink icon="water_drop" label="Venues" to="/manager/venues" />
          <SidebarLink icon="calendar_month" label="Schedules" to="/manager/schedules" />
          <SidebarLink icon="event_seat" label="Bookings" to="/manager/bookings" />
          <SidebarLink icon="analytics" label="Reports" to="/manager/reports" />
          <SidebarLink active icon="group" label="Users" to="/admin/users" />
          <SidebarLink icon="admin_panel_settings" label="Roles" to="/admin/roles" />
        </nav>
        <div className="mt-auto border-t border-on-secondary-fixed-variant/10 px-unit-lg pt-unit-lg">
          <Link className="flex w-full items-center justify-center gap-unit-sm rounded-lg bg-primary-fixed py-unit-md font-label-lg text-label-lg text-on-primary-fixed transition-transform hover:scale-[1.02] active:scale-[0.98]" to="/manager/schedules">
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>add_circle</span>
            Quick Schedule
          </Link>
        </div>
      </aside>

      <div className="ml-sidebar-width flex min-h-screen flex-col">
        <header className="sticky top-0 z-40 flex items-center justify-between border-b border-outline-variant/20 bg-surface/70 px-unit-lg py-unit-sm shadow-sm backdrop-blur-md">
          <div className="flex flex-1 items-center gap-unit-lg">
            <div className="relative w-full max-w-md">
              <span className="material-symbols-outlined absolute left-unit-md top-1/2 -translate-y-1/2 text-on-surface-variant">search</span>
              <input
                className="w-full rounded-full border-none bg-surface-container-low py-unit-sm pl-unit-xl pr-unit-md font-body-sm text-body-sm transition-all focus:ring-2 focus:ring-primary/20"
                name="keyword"
                placeholder="Search by name, email, phone..."
                type="search"
                value={filters.keyword}
                onChange={handleFilterChange}
              />
            </div>
          </div>
          <div className="flex items-center gap-unit-md">
            <button className="relative rounded-full p-unit-sm transition-colors hover:bg-surface-container-high/50" type="button">
              <span className="material-symbols-outlined">notifications</span>
              <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-error" />
            </button>
            <button className="rounded-full p-unit-sm transition-colors hover:bg-surface-container-high/50" type="button">
              <span className="material-symbols-outlined">help_outline</span>
            </button>
            <button className="rounded-full p-unit-sm transition-colors hover:bg-surface-container-high/50" type="button">
              <span className="material-symbols-outlined">settings</span>
            </button>
            <div className="mx-unit-sm h-8 w-[1px] bg-outline-variant/30" />
            <div className="text-right">
              <p className="font-label-lg text-label-lg text-on-surface">System Admin</p>
              <p className="font-label-md text-label-md text-on-surface-variant">Admin Access</p>
            </div>
          </div>
        </header>

        <main className="flex-1 p-unit-lg">
          <div className="mx-auto max-w-[1440px]">
            <div className="mb-unit-xl flex flex-col justify-between gap-unit-lg md:flex-row md:items-end">
              <div>
                <h2 className="font-headline-xl text-headline-xl text-on-surface">Manage Users</h2>
                <p className="mt-unit-xs font-body-md text-body-md text-on-surface-variant">Oversee account status and supported profile information for the AquaShow ecosystem.</p>
              </div>
              <div className="flex flex-wrap gap-unit-md">
                <div className="flex items-center rounded-xl border border-outline-variant/30 bg-surface-container-lowest p-unit-xs">
                  <button className={`rounded-lg px-unit-md py-unit-sm font-label-lg text-label-lg transition-all ${filters.role === '' ? 'bg-primary-container text-on-primary-container' : 'text-on-surface-variant hover:bg-surface-container'}`} type="button" onClick={() => { setFilters((current) => ({ ...current, role: '' })); setCurrentPage(0); }}>
                    All Users
                  </button>
                  <button className={`rounded-lg px-unit-md py-unit-sm font-label-lg text-label-lg transition-all ${filters.role === 'STAFF' ? 'bg-primary-container text-on-primary-container' : 'text-on-surface-variant hover:bg-surface-container'}`} type="button" onClick={() => { setFilters((current) => ({ ...current, role: 'STAFF' })); setCurrentPage(0); }}>
                    Staff
                  </button>
                  <button className={`rounded-lg px-unit-md py-unit-sm font-label-lg text-label-lg transition-all ${filters.role === 'MANAGER' ? 'bg-primary-container text-on-primary-container' : 'text-on-surface-variant hover:bg-surface-container'}`} type="button" onClick={() => { setFilters((current) => ({ ...current, role: 'MANAGER' })); setCurrentPage(0); }}>
                    Managers
                  </button>
                  <button className={`rounded-lg px-unit-md py-unit-sm font-label-lg text-label-lg transition-all ${filters.role === 'ADMIN' ? 'bg-primary-container text-on-primary-container' : 'text-on-surface-variant hover:bg-surface-container'}`} type="button" onClick={() => { setFilters((current) => ({ ...current, role: 'ADMIN' })); setCurrentPage(0); }}>
                    Admins
                  </button>
                </div>
              </div>
            </div>

            <div className="mb-unit-xl grid grid-cols-1 gap-unit-lg md:grid-cols-4">
              <StatCard icon="group" label="Total Users" value={stats.total} />
              <StatCard icon="verified_user" label="Active On Page" tone="secondary" value={stats.active} />
              <StatCard icon="admin_panel_settings" label="Admins On Page" tone="tertiary" value={stats.admins} />
              <StatCard icon="person_off" label="Disabled On Page" tone="error" value={stats.disabled} />
            </div>

            {successMessage && (
              <div className="mb-unit-md rounded-lg border border-primary/20 bg-primary/10 p-unit-md text-body-sm font-bold text-primary">
                {successMessage}
              </div>
            )}
            {actionError && (
              <div className="mb-unit-md rounded-lg border border-error/20 bg-error/10 p-unit-md text-body-sm font-bold text-error">
                {actionError}
              </div>
            )}

            <div className="glass-card overflow-hidden rounded-lg border border-outline-variant/20 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-unit-md border-b border-outline-variant/20 p-unit-lg">
                <div className="flex min-w-[300px] flex-1 items-center gap-unit-md">
                  <div className="relative max-w-sm flex-1">
                    <span className="material-symbols-outlined absolute left-unit-md top-1/2 -translate-y-1/2 text-sm text-on-surface-variant">search</span>
                    <input
                      className="w-full rounded-lg border border-outline-variant/40 bg-surface-container-lowest py-2 pl-unit-xl pr-unit-md font-body-sm text-body-sm outline-none transition-all focus:border-primary"
                      name="keyword"
                      placeholder="Filter by name, email..."
                      type="search"
                      value={filters.keyword}
                      onChange={handleFilterChange}
                    />
                  </div>
                  <select className="rounded-lg border border-outline-variant/40 bg-surface-container-lowest px-unit-md py-2 font-body-sm text-body-sm outline-none transition-all focus:border-primary" name="role" value={filters.role} onChange={handleFilterChange}>
                    <option value="">All Roles</option>
                    {roles.map((role) => (
                      <option key={role} value={role}>{formatEnum(role)}</option>
                    ))}
                  </select>
                  <select className="rounded-lg border border-outline-variant/40 bg-surface-container-lowest px-unit-md py-2 font-body-sm text-body-sm outline-none transition-all focus:border-primary" name="status" value={filters.status} onChange={handleFilterChange}>
                    <option value="">All Status</option>
                    {statuses.map((status) => (
                      <option key={status} value={status}>{formatEnum(status)}</option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center gap-unit-sm">
                  <button className="rounded-lg p-2 text-on-surface-variant transition-colors hover:bg-surface-container" type="button" onClick={() => setReloadKey((key) => key + 1)}>
                    <span className="material-symbols-outlined">refresh</span>
                  </button>
                  <button className="rounded-lg p-2 text-on-surface-variant transition-colors hover:bg-surface-container" type="button" onClick={resetFilters}>
                    <span className="material-symbols-outlined">filter_alt_off</span>
                  </button>
                </div>
              </div>

              {loadError && (
                <div className="m-unit-lg rounded-lg border border-error/20 bg-error/10 p-unit-lg text-center">
                  <span className="material-symbols-outlined text-4xl text-error">error</span>
                  <p className="mt-unit-sm font-label-lg text-error">{loadError}</p>
                  <button className="mt-unit-md rounded-lg bg-error px-unit-lg py-unit-sm font-label-lg text-on-error" type="button" onClick={() => setReloadKey((key) => key + 1)}>
                    Retry
                  </button>
                </div>
              )}

              {!loadError && (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-left">
                    <thead>
                      <tr className="bg-surface-container-low">
                        <th className="px-unit-lg py-unit-md font-label-lg text-label-lg uppercase tracking-wider text-on-surface-variant">User</th>
                        <th className="px-unit-lg py-unit-md font-label-lg text-label-lg uppercase tracking-wider text-on-surface-variant">Email</th>
                        <th className="px-unit-lg py-unit-md font-label-lg text-label-lg uppercase tracking-wider text-on-surface-variant">Role</th>
                        <th className="px-unit-lg py-unit-md font-label-lg text-label-lg uppercase tracking-wider text-on-surface-variant">Status</th>
                        <th className="px-unit-lg py-unit-md font-label-lg text-label-lg uppercase tracking-wider text-on-surface-variant">Created At</th>
                        <th className="px-unit-lg py-unit-md text-right font-label-lg text-label-lg uppercase tracking-wider text-on-surface-variant">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-outline-variant/10">
                      {isLoading && (
                        <tr>
                          <td className="px-unit-lg py-unit-xl text-center text-on-surface-variant" colSpan={6}>
                            <span className="material-symbols-outlined animate-spin align-middle text-primary">progress_activity</span>
                            <span className="ml-unit-sm font-label-lg">Loading users...</span>
                          </td>
                        </tr>
                      )}

                      {!isLoading && users.length === 0 && (
                        <tr>
                          <td className="px-unit-lg py-unit-xl text-center" colSpan={6}>
                            <span className="material-symbols-outlined text-4xl text-on-surface-variant">person_search</span>
                            <p className="mt-unit-sm font-label-lg text-on-surface">No users found</p>
                            <p className="text-body-sm text-on-surface-variant">Try clearing filters or using a different keyword.</p>
                          </td>
                        </tr>
                      )}

                      {!isLoading &&
                        users.map((user) => (
                          <tr key={user.id} className="group transition-colors hover:bg-surface-container-low">
                            <td className="px-unit-lg py-unit-md">
                              <div className="flex items-center gap-unit-md">
                                <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-transparent bg-primary-container font-bold text-on-primary-container transition-all group-hover:border-primary/40">
                                  {initials(user)}
                                </div>
                                <div>
                                  <p className="font-body-md text-body-md font-bold text-on-surface">{user.fullName || 'Unnamed User'}</p>
                                  <p className="font-label-md text-label-md text-on-surface-variant">{user.phoneNumber || 'No phone'}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-unit-lg py-unit-md font-body-sm text-on-surface-variant">{user.email}</td>
                            <td className="px-unit-lg py-unit-md">
                              <span className={`rounded-full px-unit-md py-unit-xs text-label-md font-label-md ${roleBadgeClass(user.role)}`}>{formatEnum(user.role)}</span>
                            </td>
                            <td className="px-unit-lg py-unit-md">
                              <div className={`flex items-center gap-unit-xs ${statusClass(user.status)}`}>
                                <span className={`h-2 w-2 rounded-full ${user.status === 'ACTIVE' ? 'animate-pulse bg-primary' : user.status === 'DISABLED' ? 'bg-error' : 'bg-tertiary'}`} />
                                <span className="font-label-md">{formatEnum(user.status)}</span>
                              </div>
                            </td>
                            <td className="px-unit-lg py-unit-md font-body-sm text-on-surface-variant">{formatDate(user.createdAt)}</td>
                            <td className="px-unit-lg py-unit-md text-right">
                              <div className="flex justify-end gap-unit-sm">
                                <button className="rounded-full p-unit-sm text-primary transition-colors hover:bg-primary/10" title="Edit" type="button" onClick={() => openUser(user)}>
                                  <span className="material-symbols-outlined">edit</span>
                                </button>
                                {user.status === 'DISABLED' ? (
                                  <button className="rounded-full p-unit-sm text-primary transition-colors hover:bg-primary/10 disabled:cursor-not-allowed disabled:opacity-50" disabled={workingUserId === user.id} title="Enable" type="button" onClick={() => handleEnable(user)}>
                                    <span className="material-symbols-outlined">check_circle</span>
                                  </button>
                                ) : (
                                  <button className="rounded-full p-unit-sm text-error transition-colors hover:bg-error/10 disabled:cursor-not-allowed disabled:opacity-50" disabled={workingUserId === user.id} title="Disable" type="button" onClick={() => { setUserToDisable(user); setDisableError(''); }}>
                                    <span className="material-symbols-outlined">block</span>
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              )}

              <div className="flex items-center justify-between border-t border-outline-variant/20 p-unit-lg">
                <p className="font-label-md text-label-md text-on-surface-variant">
                  Showing {startItem} to {endItem} of {pagination.totalItems} users
                  {pagination.totalPages > 0 ? ` · Page ${pagination.page + 1} of ${pagination.totalPages}` : ''}
                </p>
                <div className="flex items-center gap-unit-sm">
                  <button
                    className="rounded-lg border border-outline-variant/30 p-2 transition-all hover:bg-surface-container disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={isLoading || !pagination.hasPrevious}
                    type="button"
                    onClick={() => setCurrentPage((page) => Math.max(0, page - 1))}
                  >
                    <span className="material-symbols-outlined">chevron_left</span>
                  </button>
                  <button className="h-10 min-w-10 rounded-lg bg-primary px-unit-sm font-label-lg text-on-primary shadow-sm" type="button">
                    {pagination.page + 1}
                  </button>
                  <button
                    className="rounded-lg border border-outline-variant/30 p-2 transition-all hover:bg-surface-container disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={isLoading || !pagination.hasNext}
                    type="button"
                    onClick={() => setCurrentPage((page) => page + 1)}
                  >
                    <span className="material-symbols-outlined">chevron_right</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {selectedUser && (
        <UserModal
          fieldErrors={fieldErrors}
          form={userForm}
          generalError={formError}
          isDetailLoading={isDetailLoading}
          isSaving={isSaving}
          user={selectedUser}
          onChange={handleFormChange}
          onClose={closeUserModal}
          onSubmit={handleSubmit}
        />
      )}

      {userToDisable && (
        <ConfirmDisableDialog
          error={disableError}
          isWorking={workingUserId === userToDisable.id}
          user={userToDisable}
          onCancel={() => {
            if (!workingUserId) {
              setUserToDisable(null);
              setDisableError('');
            }
          }}
          onConfirm={handleDisable}
        />
      )}
    </div>
  );
}
