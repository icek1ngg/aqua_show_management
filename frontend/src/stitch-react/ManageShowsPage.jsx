import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import {
  activateShow,
  createShow,
  deactivateShow,
  getManagerShows,
  updateShow,
} from '../services/managerShowService.js';

const fallbackShowImage =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuCGv1p38H7OadNEaIuXdWb3grDkYf0losplVkkhDiN-Ip-WsAm0te-6vi1dNmYZfH8LzbKsE78pjgMmaQrkvX4ItLPk6nkce03kqztzTijEWZxWhmMUuMl4uI6XlDovYcJdl_OZSXCwof7DmsGz4q2zCOTZR6cSVudQiwADViJ9dg8HoIW-iXsFG05g-c5Z2rzFjApGssB6GTywMfz9BqfdczOP7JLvnsXArQOx4evFGZ-S0vSdNTAes7wt6wZGuWrkgiDM8f55UC0U';

const emptyForm = {
  title: '',
  description: '',
  imageUrl: '',
  durationMinutes: '',
  status: 'ACTIVE',
};

function formatDate(value) {
  if (!value) {
    return 'TBA';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return 'TBA';
  }

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function getErrorMessage(error, fallback) {
  return error?.response?.data?.message || error?.message || fallback;
}

function getValidationErrors(error) {
  return error?.response?.data?.errors || {};
}

function toForm(show) {
  return {
    title: show?.title || '',
    description: show?.description || '',
    imageUrl: show?.imageUrl || '',
    durationMinutes: show?.durationMinutes ? String(show.durationMinutes) : '',
    status: show?.status || 'ACTIVE',
  };
}

function statusBadge(status) {
  if (status === 'ACTIVE') {
    return 'bg-primary-container/20 text-primary';
  }

  return 'bg-outline-variant/30 text-on-surface-variant';
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

function StatCard({ icon, label, value, tone = 'primary', note }) {
  const toneClasses = {
    primary: 'bg-primary-container/30 text-primary',
    error: 'bg-error-container/30 text-error',
    tertiary: 'bg-tertiary-container/30 text-tertiary',
  };

  return (
    <div className="glass-card rounded-lg p-unit-lg shadow-sm">
      <div className="mb-unit-md flex items-start justify-between">
        <div className={`rounded-lg p-unit-sm ${toneClasses[tone] || toneClasses.primary}`}>
          <span className="material-symbols-outlined">{icon}</span>
        </div>
        {note && <span className="text-label-md font-bold text-on-surface-variant">{note}</span>}
      </div>
      <p className="font-label-lg text-label-lg uppercase tracking-wider text-on-surface-variant">{label}</p>
      <p className="font-headline-lg text-headline-lg text-on-surface">{value}</p>
    </div>
  );
}

function ShowFormModal({
  formMode,
  formValues,
  fieldErrors,
  generalError,
  isSaving,
  onChange,
  onClose,
  onSubmit,
}) {
  const isEdit = formMode === 'edit';

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-unit-lg">
      <button className="absolute inset-0 bg-on-surface/40 backdrop-blur-sm" type="button" aria-label="Close dialog" onClick={onClose} />
      <div className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-surface shadow-2xl">
        <div className="flex items-center justify-between border-b border-outline-variant/30 p-unit-lg">
          <h4 className="font-headline-md text-headline-md text-primary">{isEdit ? 'Update Show' : 'Create New Show'}</h4>
          <button className="rounded-full p-2 transition-colors hover:bg-surface-variant" type="button" onClick={onClose}>
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <form className="space-y-unit-md p-unit-lg" onSubmit={onSubmit}>
          {generalError && (
            <div className="rounded-lg border border-error/20 bg-error/10 px-unit-md py-3 text-body-sm font-bold text-error">
              {generalError}
            </div>
          )}

          <div className="grid grid-cols-1 gap-unit-lg md:grid-cols-2">
            <div className="md:col-span-2">
              <label className="mb-unit-sm block font-label-lg text-label-lg text-on-surface-variant" htmlFor="show-title">
                Show Title
              </label>
              <input
                className="w-full rounded-lg border border-outline-variant bg-surface-container-low px-unit-md py-3 text-body-md outline-none focus:ring-2 focus:ring-primary"
                id="show-title"
                name="title"
                placeholder="Enter show name..."
                type="text"
                value={formValues.title}
                onChange={onChange}
              />
              <FieldError>{fieldErrors.title}</FieldError>
            </div>

            <div className="md:col-span-2">
              <label className="mb-unit-sm block font-label-lg text-label-lg text-on-surface-variant" htmlFor="show-description">
                Description
              </label>
              <textarea
                className="w-full rounded-lg border border-outline-variant bg-surface-container-low px-unit-md py-3 text-body-md outline-none focus:ring-2 focus:ring-primary"
                id="show-description"
                name="description"
                placeholder="Describe the show experience..."
                rows="4"
                value={formValues.description}
                onChange={onChange}
              />
              <FieldError>{fieldErrors.description}</FieldError>
            </div>

            <div>
              <label className="mb-unit-sm block font-label-lg text-label-lg text-on-surface-variant" htmlFor="show-duration">
                Duration (mins)
              </label>
              <input
                className="w-full rounded-lg border border-outline-variant bg-surface-container-low px-unit-md py-3 text-body-md outline-none focus:ring-2 focus:ring-primary"
                id="show-duration"
                min="1"
                name="durationMinutes"
                placeholder="45"
                type="number"
                value={formValues.durationMinutes}
                onChange={onChange}
              />
              <FieldError>{fieldErrors.durationMinutes}</FieldError>
            </div>

            {isEdit && (
              <div>
                <label className="mb-unit-sm block font-label-lg text-label-lg text-on-surface-variant" htmlFor="show-status">
                  Status
                </label>
                <select
                  className="w-full rounded-lg border border-outline-variant bg-surface-container-low px-unit-md py-3 text-body-md outline-none focus:ring-2 focus:ring-primary"
                  id="show-status"
                  name="status"
                  value={formValues.status}
                  onChange={onChange}
                >
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                </select>
                <FieldError>{fieldErrors.status}</FieldError>
              </div>
            )}

            <div className={isEdit ? 'md:col-span-2' : 'md:col-span-2'}>
              <label className="mb-unit-sm block font-label-lg text-label-lg text-on-surface-variant" htmlFor="show-image-url">
                Cover Image URL
              </label>
              <input
                className="w-full rounded-lg border border-outline-variant bg-surface-container-low px-unit-md py-3 text-body-md outline-none focus:ring-2 focus:ring-primary"
                id="show-image-url"
                name="imageUrl"
                placeholder="https://..."
                type="url"
                value={formValues.imageUrl}
                onChange={onChange}
              />
              <FieldError>{fieldErrors.imageUrl}</FieldError>
            </div>
          </div>

          <div className="flex justify-end gap-unit-md border-t border-outline-variant/20 pt-unit-lg">
            <button className="rounded-full px-unit-xl py-unit-md text-label-lg text-on-surface-variant transition-all hover:bg-surface-variant" disabled={isSaving} type="button" onClick={onClose}>
              Cancel
            </button>
            <button className="rounded-full bg-primary px-unit-xl py-unit-md font-label-lg text-label-lg text-on-primary shadow-md transition-all hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60" disabled={isSaving} type="submit">
              {isSaving ? 'Saving...' : isEdit ? 'Update Show' : 'Create Show'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ConfirmDeactivateDialog({ show, isWorking, error, onCancel, onConfirm }) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-unit-lg">
      <button className="absolute inset-0 bg-on-surface/40 backdrop-blur-sm" type="button" aria-label="Cancel deactivate" onClick={onCancel} />
      <div className="relative w-full max-w-md overflow-hidden rounded-lg bg-surface p-unit-lg text-center shadow-2xl">
        <div className="mx-auto mb-unit-lg flex h-16 w-16 items-center justify-center rounded-full bg-error-container/20">
          <span className="material-symbols-outlined text-4xl text-error">warning</span>
        </div>
        <h4 className="mb-unit-sm font-headline-md text-headline-md text-on-surface">Deactivate Show?</h4>
        <p className="mb-unit-md font-body-md text-body-md text-on-surface-variant">
          This will hide <strong>{show?.title}</strong> from guest views. You can activate it again later.
        </p>
        {error && <p className="mb-unit-md rounded-lg bg-error/10 px-unit-md py-2 text-label-md font-bold text-error">{error}</p>}
        <div className="flex gap-unit-md">
          <button className="flex-1 rounded-full border border-outline-variant px-unit-md py-unit-md font-label-lg text-label-lg text-on-surface-variant transition-all hover:bg-surface-variant" disabled={isWorking} type="button" onClick={onCancel}>
            Cancel
          </button>
          <button className="flex-1 rounded-full bg-error px-unit-md py-unit-md font-label-lg text-label-lg text-on-error shadow-md transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60" disabled={isWorking} type="button" onClick={onConfirm}>
            {isWorking ? 'Deactivating...' : 'Yes, Deactivate'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ManageShowsPage() {
  const [shows, setShows] = useState([]);
  const [pagination, setPagination] = useState({
    page: 0,
    size: 10,
    totalItems: 0,
    totalPages: 0,
    hasNext: false,
    hasPrevious: false,
  });
  const [currentPage, setCurrentPage] = useState(0);
  const [keyword, setKeyword] = useState('');
  const [submittedKeyword, setSubmittedKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  const [formMode, setFormMode] = useState(null);
  const [editingShow, setEditingShow] = useState(null);
  const [formValues, setFormValues] = useState(emptyForm);
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const [showToDeactivate, setShowToDeactivate] = useState(null);
  const [actionError, setActionError] = useState('');
  const [workingShowId, setWorkingShowId] = useState(null);

  useEffect(() => {
    let isActive = true;

    async function loadShows() {
      setIsLoading(true);
      setLoadError('');

      try {
        const response = await getManagerShows({
          keyword: submittedKeyword,
          status: statusFilter,
          page: currentPage,
          size: pagination.size,
        });

        if (!isActive) {
          return;
        }

        const items = Array.isArray(response?.items) ? response.items : [];
        setShows(items);
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

        setShows([]);
        setPagination((current) => ({
          ...current,
          page: currentPage,
          totalItems: 0,
          totalPages: 0,
          hasNext: false,
          hasPrevious: false,
        }));
        setLoadError(getErrorMessage(error, 'Could not load manager shows.'));
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    }

    loadShows();

    return () => {
      isActive = false;
    };
  }, [currentPage, pagination.size, reloadKey, statusFilter, submittedKeyword]);

  const stats = useMemo(() => {
    const active = shows.filter((show) => show.status === 'ACTIVE').length;
    const inactive = shows.filter((show) => show.status === 'INACTIVE').length;

    return {
      total: pagination.totalItems,
      active,
      inactive,
      currentPage: shows.length,
    };
  }, [pagination.totalItems, shows]);

  const openCreateForm = () => {
    setFormMode('create');
    setEditingShow(null);
    setFormValues(emptyForm);
    setFieldErrors({});
    setFormError('');
  };

  const openEditForm = (show) => {
    setFormMode('edit');
    setEditingShow(show);
    setFormValues(toForm(show));
    setFieldErrors({});
    setFormError('');
  };

  const closeForm = () => {
    if (isSaving) {
      return;
    }
    setFormMode(null);
    setEditingShow(null);
    setFieldErrors({});
    setFormError('');
  };

  const handleFormChange = (event) => {
    const { name, value } = event.target;
    setFormValues((current) => ({ ...current, [name]: value }));
    setFieldErrors((current) => ({ ...current, [name]: '' }));
  };

  const handleSearch = (event) => {
    event.preventDefault();
    setCurrentPage(0);
    setSubmittedKeyword(keyword.trim());
  };

  const handleStatusFilterChange = (event) => {
    setCurrentPage(0);
    setStatusFilter(event.target.value);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSaving(true);
    setFieldErrors({});
    setFormError('');
    setSuccessMessage('');

    const payload = {
      title: formValues.title.trim(),
      description: formValues.description.trim(),
      imageUrl: formValues.imageUrl.trim() || null,
      durationMinutes: formValues.durationMinutes ? Number(formValues.durationMinutes) : null,
    };

    if (formMode === 'edit') {
      payload.status = formValues.status;
    }

    try {
      if (formMode === 'edit' && editingShow) {
        await updateShow(editingShow.id, payload);
        setSuccessMessage('Show updated successfully.');
      } else {
        await createShow(payload);
        setSuccessMessage('Show created successfully.');
      }

      closeForm();
      setReloadKey((key) => key + 1);
    } catch (error) {
      setFieldErrors(getValidationErrors(error));
      setFormError(getErrorMessage(error, 'Could not save show. Please review the form and try again.'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleActivate = async (show) => {
    setWorkingShowId(show.id);
    setActionError('');
    setSuccessMessage('');

    try {
      await activateShow(show.id);
      setSuccessMessage(`${show.title} activated successfully.`);
      setReloadKey((key) => key + 1);
    } catch (error) {
      setActionError(getErrorMessage(error, 'Could not activate show.'));
    } finally {
      setWorkingShowId(null);
    }
  };

  const handleConfirmDeactivate = async () => {
    if (!showToDeactivate) {
      return;
    }

    setWorkingShowId(showToDeactivate.id);
    setActionError('');
    setSuccessMessage('');

    try {
      await deactivateShow(showToDeactivate.id);
      setSuccessMessage(`${showToDeactivate.title} deactivated successfully.`);
      setShowToDeactivate(null);
      setReloadKey((key) => key + 1);
    } catch (error) {
      setActionError(getErrorMessage(error, 'Could not deactivate show.'));
    } finally {
      setWorkingShowId(null);
    }
  };

  const clearFilters = () => {
    setKeyword('');
    setSubmittedKeyword('');
    setStatusFilter('');
    setCurrentPage(0);
  };

  return (
    <div className="min-h-screen overflow-x-hidden bg-background text-on-surface">
      <style>{"body {\r\n            font-family: 'Plus Jakarta Sans', sans-serif;\r\n            background-color: #f1fbfb;\r\n        }\r\n        .material-symbols-outlined {\r\n            font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;\r\n        }\r\n        .glass-card {\r\n            background: rgba(255, 255, 255, 0.7);\r\n            backdrop-filter: blur(12px);\r\n            border: 1px solid rgba(255, 255, 255, 0.3);\r\n        }"}</style>

      <aside className="fixed left-0 top-0 z-50 flex h-full w-sidebar-width flex-col bg-on-secondary-fixed py-unit-lg shadow-lg">
        <div className="mb-unit-xl px-unit-lg">
          <h1 className="font-headline-md text-headline-md font-bold text-primary-fixed">AquaShow MS</h1>
          <p className="font-body-sm text-body-sm text-on-secondary-fixed-variant opacity-70">Management System</p>
        </div>
        <nav className="flex-grow space-y-unit-xs">
          <SidebarLink icon="dashboard" label="Dashboard" to="/manager/dashboard" />
          <SidebarLink active icon="theater_comedy" label="Shows" to="/manager/shows" />
          <SidebarLink icon="water_drop" label="Venues" to="/manager/venues" />
          <SidebarLink icon="calendar_month" label="Schedules" to="/manager/schedules" />
          <SidebarLink icon="event_seat" label="Bookings" to="/manager/bookings" />
          <SidebarLink icon="analytics" label="Reports" to="/manager/reports" />
          <SidebarLink icon="group" label="Users" to="/admin/users" />
          <SidebarLink icon="admin_panel_settings" label="Roles" to="/admin/roles" />
        </nav>
        <div className="mt-auto px-unit-lg">
          <button className="w-full rounded-lg bg-primary-fixed py-unit-md font-label-lg text-label-lg text-on-primary-fixed shadow-md transition-all hover:brightness-110 active:scale-95" type="button" onClick={openCreateForm}>
            New Show
          </button>
        </div>
      </aside>

      <header className="sticky top-0 z-40 ml-sidebar-width flex w-[calc(100%-theme(spacing.sidebar-width))] items-center justify-between border-b border-outline-variant/20 bg-surface/70 px-unit-lg py-unit-sm backdrop-blur-md">
        <form className="flex items-center gap-unit-md" onSubmit={handleSearch}>
          <div className="relative w-72">
            <input
              className="w-full rounded-full border-none bg-surface-container-low px-unit-lg py-2 text-body-sm focus:ring-2 focus:ring-primary-container"
              placeholder="Search shows..."
              type="search"
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
            />
            <span className="material-symbols-outlined absolute right-3 top-1/2 scale-75 -translate-y-1/2 text-on-surface-variant">search</span>
          </div>
          <button className="rounded-full bg-primary px-unit-lg py-2 font-label-lg text-label-lg text-on-primary transition hover:shadow-md" type="submit">
            Search
          </button>
        </form>
        <div className="flex items-center gap-unit-md">
          <select className="rounded-full border border-outline-variant bg-surface px-unit-md py-2 text-label-lg text-on-surface-variant" value={statusFilter} onChange={handleStatusFilterChange}>
            <option value="">All statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </select>
          {(submittedKeyword || statusFilter) && (
            <button className="rounded-full border border-outline-variant px-unit-md py-2 text-label-lg text-primary transition hover:bg-primary/5" type="button" onClick={clearFilters}>
              Clear
            </button>
          )}
        </div>
      </header>

      <main className="ml-sidebar-width min-h-screen p-unit-lg">
        <div className="mx-auto max-w-7xl space-y-unit-xl">
          <div className="flex flex-col gap-unit-md md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="font-headline-xl text-headline-xl text-primary">Manage Shows</h2>
              <p className="font-body-md text-body-md text-on-surface-variant">Oversee water park performances and guest-facing show catalog data.</p>
            </div>
            <button className="flex items-center gap-unit-md rounded-full bg-primary px-unit-xl py-unit-md font-label-lg text-label-lg text-on-primary transition-all hover:shadow-lg active:scale-95" type="button" onClick={openCreateForm}>
              <span className="material-symbols-outlined">add</span>
              Create New Show
            </button>
          </div>

          {successMessage && (
            <div className="rounded-lg border border-primary/20 bg-primary-container/20 px-unit-lg py-3 font-label-lg text-label-lg text-primary">
              {successMessage}
            </div>
          )}
          {actionError && (
            <div className="rounded-lg border border-error/20 bg-error/10 px-unit-lg py-3 font-label-lg text-label-lg text-error">
              {actionError}
            </div>
          )}

          <div className="grid grid-cols-1 gap-unit-lg md:grid-cols-4">
            <StatCard icon="theater_comedy" label="Total Shows" value={stats.total} note={`${stats.currentPage} shown`} />
            <StatCard icon="check_circle" label="Active On Page" value={stats.active} note="Active" />
            <StatCard icon="pause_circle" label="Inactive On Page" value={stats.inactive} note="Paused" tone="error" />
            <StatCard icon="search" label="Current Filter" value={statusFilter || 'All'} note={submittedKeyword || 'No keyword'} tone="tertiary" />
          </div>

          <div className="glass-card overflow-hidden rounded-lg shadow-md">
            <div className="flex flex-col gap-unit-md border-b border-outline-variant/30 p-unit-lg md:flex-row md:items-center md:justify-between">
              <div>
                <h3 className="font-headline-md text-headline-md text-on-surface">Show Catalog</h3>
                <p className="text-body-sm text-on-surface-variant">Create, update, activate, and deactivate shows using backend catalog data.</p>
              </div>
              <button className="w-fit rounded-full border border-outline-variant px-unit-md py-unit-sm text-label-lg text-on-surface-variant hover:bg-surface-variant/30" type="button" onClick={() => setReloadKey((key) => key + 1)}>
                <span className="material-symbols-outlined mr-1 text-sm">refresh</span>
                Refresh
              </button>
            </div>

            {isLoading ? (
              <div className="space-y-3 p-unit-lg">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div className="h-20 animate-pulse rounded-lg bg-surface-container-low" key={index} />
                ))}
              </div>
            ) : loadError ? (
              <div className="p-unit-xl text-center">
                <span className="material-symbols-outlined text-5xl text-error">error</span>
                <h3 className="mt-unit-sm font-headline-md text-headline-md text-on-surface">Could not load shows</h3>
                <p className="mt-2 text-body-md text-error">{loadError}</p>
                <button className="mt-unit-lg rounded-full bg-primary px-unit-lg py-unit-md font-label-lg text-label-lg text-on-primary" type="button" onClick={() => setReloadKey((key) => key + 1)}>
                  Try Again
                </button>
              </div>
            ) : shows.length === 0 ? (
              <div className="p-unit-xl text-center">
                <span className="material-symbols-outlined text-5xl text-primary">theater_comedy</span>
                <h3 className="mt-unit-sm font-headline-md text-headline-md text-on-surface">No shows found</h3>
                <p className="mt-2 text-body-md text-on-surface-variant">
                  {submittedKeyword || statusFilter ? 'No shows match the current search or status filter.' : 'Create the first show to populate the catalog.'}
                </p>
                <button className="mt-unit-lg rounded-full bg-primary px-unit-lg py-unit-md font-label-lg text-label-lg text-on-primary" type="button" onClick={openCreateForm}>
                  Create Show
                </button>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-surface-container-low">
                      <tr>
                        <th className="px-unit-lg py-unit-md font-label-lg text-label-lg text-on-surface-variant">Image</th>
                        <th className="px-unit-lg py-unit-md font-label-lg text-label-lg text-on-surface-variant">Title</th>
                        <th className="px-unit-lg py-unit-md font-label-lg text-label-lg text-on-surface-variant">Duration</th>
                        <th className="px-unit-lg py-unit-md font-label-lg text-label-lg text-on-surface-variant">Status</th>
                        <th className="px-unit-lg py-unit-md font-label-lg text-label-lg text-on-surface-variant">Created At</th>
                        <th className="px-unit-lg py-unit-md text-right font-label-lg text-label-lg text-on-surface-variant">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-outline-variant/20">
                      {shows.map((show) => (
                        <tr className={`group transition-colors hover:bg-primary-container/5 ${show.status === 'INACTIVE' ? 'opacity-70' : ''}`} key={show.id}>
                          <td className="px-unit-lg py-unit-md">
                            <img alt={show.title} className="h-12 w-16 rounded-lg object-cover shadow-sm transition-transform group-hover:scale-105" src={show.imageUrl || fallbackShowImage} />
                          </td>
                          <td className="max-w-md px-unit-lg py-unit-md">
                            <p className="font-body-md text-body-md font-bold text-on-surface">{show.title}</p>
                            <p className="line-clamp-1 text-[12px] text-on-surface-variant">{show.description || 'No description provided.'}</p>
                          </td>
                          <td className="px-unit-lg py-unit-md font-body-sm text-body-sm">{show.durationMinutes ? `${show.durationMinutes} mins` : 'TBA'}</td>
                          <td className="px-unit-lg py-unit-md">
                            <span className={`rounded-full px-3 py-1 text-label-md font-bold ${statusBadge(show.status)}`}>{show.status}</span>
                          </td>
                          <td className="px-unit-lg py-unit-md font-body-sm text-body-sm text-on-surface-variant">{formatDate(show.createdAt)}</td>
                          <td className="px-unit-lg py-unit-md text-right">
                            <div className="flex justify-end gap-2">
                              <Link className="p-2 text-on-surface-variant transition-colors hover:text-primary" title="View public details" to={`/shows/${show.id}`}>
                                <span className="material-symbols-outlined">visibility</span>
                              </Link>
                              <button className="p-2 text-on-surface-variant transition-colors hover:text-primary" title="Edit" type="button" onClick={() => openEditForm(show)}>
                                <span className="material-symbols-outlined">edit</span>
                              </button>
                              {show.status === 'ACTIVE' ? (
                                <button className="p-2 text-on-surface-variant transition-colors hover:text-error disabled:cursor-not-allowed disabled:opacity-50" disabled={workingShowId === show.id} title="Deactivate" type="button" onClick={() => { setActionError(''); setShowToDeactivate(show); }}>
                                  <span className="material-symbols-outlined">block</span>
                                </button>
                              ) : (
                                <button className="p-2 text-on-surface-variant transition-colors hover:text-primary disabled:cursor-not-allowed disabled:opacity-50" disabled={workingShowId === show.id} title="Activate" type="button" onClick={() => handleActivate(show)}>
                                  <span className="material-symbols-outlined">check_circle</span>
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="flex flex-col gap-unit-md bg-surface-container-low/50 p-unit-lg md:flex-row md:items-center md:justify-between">
                  <p className="font-body-sm text-body-sm text-on-surface-variant">
                    Showing {shows.length} of {pagination.totalItems} shows
                    {pagination.totalPages > 0 ? ` · Page ${pagination.page + 1} of ${pagination.totalPages}` : ''}
                  </p>
                  <div className="flex gap-unit-sm">
                    <button className="rounded-lg border border-outline-variant px-unit-md py-2 text-label-lg disabled:cursor-not-allowed disabled:opacity-50" disabled={!pagination.hasPrevious} type="button" onClick={() => setCurrentPage((page) => Math.max(0, page - 1))}>
                      Previous
                    </button>
                    <button className="rounded-lg bg-primary-container px-unit-md py-2 text-label-lg text-on-primary-container hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50" disabled={!pagination.hasNext} type="button" onClick={() => setCurrentPage((page) => page + 1)}>
                      Next
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </main>

      {formMode && (
        <ShowFormModal
          formMode={formMode}
          formValues={formValues}
          fieldErrors={fieldErrors}
          generalError={formError}
          isSaving={isSaving}
          onChange={handleFormChange}
          onClose={closeForm}
          onSubmit={handleSubmit}
        />
      )}

      {showToDeactivate && (
        <ConfirmDeactivateDialog
          show={showToDeactivate}
          isWorking={workingShowId === showToDeactivate.id}
          error={actionError}
          onCancel={() => {
            if (!workingShowId) {
              setShowToDeactivate(null);
              setActionError('');
            }
          }}
          onConfirm={handleConfirmDeactivate}
        />
      )}
    </div>
  );
}
