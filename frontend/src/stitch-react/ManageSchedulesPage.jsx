import { useEffect, useMemo, useState } from 'react';

import { getManagerShows } from '../services/managerShowService.js';
import {
  activateSchedule,
  createSchedule,
  deactivateSchedule,
  getSchedules,
  updateSchedule,
} from '../services/scheduleService.js';
import { getVenue, getVenues } from '../services/venueService.js';
import ManagerActionBar from '../features/manager/components/ManagerActionBar.jsx';
import ManagerLayout from '../features/manager/components/ManagerLayout.jsx';
import ManagerPageHeader from '../features/manager/components/ManagerPageHeader.jsx';
import ManagerStatCard from '../features/manager/components/ManagerStatCard.jsx';
import {
  buildScheduleVenueOptions,
  findScheduleVenue,
  validateScheduleInventory,
} from '../features/manager/scheduleForm.js';
import { formatCurrency } from '../shared/utils/ticketPricing.js';

const emptyForm = {
  showId: '',
  venueId: '',
  startTime: '',
  endTime: '',
  standardCapacity: '',
  vipCapacity: '',
  familyCapacity: '',
  standardPrice: '',
  status: 'ACTIVE',
};

function formatDateTime(value) {
  if (!value) {
    return 'TBA';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return 'TBA';
  }

  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function toDateTimeLocal(value) {
  if (!value) {
    return '';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  const offsetMs = date.getTimezoneOffset() * 60 * 1000;
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16);
}

function truncateId(id) {
  return id ? `${id.slice(0, 8)}...` : 'TBA';
}

function getErrorMessage(error, fallback) {
  return error?.response?.data?.message || error?.message || fallback;
}

function getValidationErrors(error) {
  return error?.response?.data?.errors || {};
}

function statusBadge(status) {
  if (status === 'ACTIVE') {
    return 'bg-primary/10 text-primary';
  }

  return 'bg-surface-container-highest text-on-surface-variant';
}

function toForm(schedule) {
  return {
    showId: schedule?.showId || '',
    venueId: schedule?.venueId || '',
    startTime: toDateTimeLocal(schedule?.startTime),
    endTime: toDateTimeLocal(schedule?.endTime),
    standardCapacity: schedule?.standardCapacity != null ? String(schedule.standardCapacity) : '',
    vipCapacity: schedule?.vipCapacity != null ? String(schedule.vipCapacity) : '',
    familyCapacity: schedule?.familyCapacity != null ? String(schedule.familyCapacity) : '',
    standardPrice: schedule?.standardPrice != null ? String(schedule.standardPrice) : '',
    status: schedule?.status || 'ACTIVE',
  };
}

function FieldError({ children }) {
  if (!children) {
    return null;
  }

  return <p className="mt-1 text-label-md font-bold text-error">{children}</p>;
}

function ScheduleFormModal({
  formMode,
  formValues,
  shows,
  venues,
  selectedVenue,
  inventoryValidation,
  fieldErrors,
  generalError,
  isSaving,
  onChange,
  onClose,
  onSubmit,
}) {
  const isEdit = formMode === 'edit';

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-on-background/40 p-unit-lg backdrop-blur-sm">
      <button className="absolute inset-0" type="button" aria-label="Close schedule dialog" onClick={onClose} />
      <div className="glass-card relative flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-lg shadow-2xl">
        <div className="flex items-center justify-between border-b border-outline-variant/20 p-unit-lg">
          <h2 className="font-headline-md text-headline-md font-bold text-primary">{isEdit ? 'Update Schedule' : 'New Show Schedule'}</h2>
          <button className="rounded-full p-unit-sm text-error transition-colors hover:bg-error/10" disabled={isSaving} type="button" onClick={onClose}>
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <form className="max-h-[716px] space-y-unit-lg overflow-y-auto p-unit-lg" onSubmit={onSubmit}>
          {generalError && (
            <div className="rounded-md border border-error/20 bg-error/10 p-unit-md text-body-sm font-bold text-error">
              {generalError}
            </div>
          )}

          <div className="grid grid-cols-1 gap-unit-lg md:grid-cols-2">
            <div className="space-y-unit-xs">
              <label className="text-label-md font-bold text-on-surface-variant" htmlFor="schedule-show">
                Select Show
              </label>
              <select
                className="w-full rounded-md border-none bg-surface-container-low px-unit-md py-unit-md text-body-md focus:ring-2 focus:ring-primary disabled:cursor-not-allowed disabled:opacity-60"
                disabled={isEdit}
                id="schedule-show"
                name="showId"
                value={formValues.showId}
                onChange={onChange}
              >
                <option value="">Choose active show</option>
                {shows.map((show) => (
                  <option key={show.id} value={show.id}>
                    {show.title}
                  </option>
                ))}
              </select>
              <FieldError>{fieldErrors.showId}</FieldError>
              {isEdit && <p className="text-[10px] font-medium text-on-surface-variant">Backend update does not accept changing show.</p>}
            </div>

            <div className="space-y-unit-xs">
              <label className="text-label-md font-bold text-on-surface-variant" htmlFor="schedule-venue">
                Select Venue
              </label>
              <select
                className="w-full rounded-md border-none bg-surface-container-low px-unit-md py-unit-md text-body-md focus:ring-2 focus:ring-primary"
                id="schedule-venue"
                name="venueId"
                value={formValues.venueId}
                onChange={onChange}
              >
                <option value="">Choose active venue</option>
                {venues.map((venue) => (
                  <option key={venue.id} value={venue.id}>
                    {venue.name}{venue.location ? ` - ${venue.location}` : ''}
                  </option>
                ))}
              </select>
              <FieldError>{fieldErrors.venueId}</FieldError>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-unit-lg md:grid-cols-2">
            <div className="space-y-unit-xs">
              <label className="text-label-md font-bold text-on-surface-variant" htmlFor="schedule-start">
                Start Time
              </label>
              <input
                className="w-full rounded-md border-none bg-surface-container-low px-unit-md py-unit-md text-body-md focus:ring-2 focus:ring-primary"
                id="schedule-start"
                name="startTime"
                type="datetime-local"
                value={formValues.startTime}
                onChange={onChange}
              />
              <FieldError>{fieldErrors.startTime}</FieldError>
            </div>

            <div className="space-y-unit-xs">
              <label className="text-label-md font-bold text-on-surface-variant" htmlFor="schedule-end">
                End Time
              </label>
              <input
                className="w-full rounded-md border-none bg-surface-container-low px-unit-md py-unit-md text-body-md focus:ring-2 focus:ring-primary"
                id="schedule-end"
                name="endTime"
                type="datetime-local"
                value={formValues.endTime}
                onChange={onChange}
              />
              <FieldError>{fieldErrors.endTime}</FieldError>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-unit-lg md:grid-cols-2">
            <div className="space-y-unit-xs">
              <label className="text-label-md font-bold text-on-surface-variant" htmlFor="schedule-standard-capacity">
                Standard Capacity
              </label>
              <input
                className="w-full rounded-md border-none bg-surface-container-low px-unit-md py-unit-md text-body-md focus:ring-2 focus:ring-primary"
                id="schedule-standard-capacity"
                min="0"
                name="standardCapacity"
                placeholder="70"
                step="1"
                type="number"
                value={formValues.standardCapacity}
                onChange={onChange}
              />
              <FieldError>{fieldErrors.standardCapacity || inventoryValidation.errors.standardCapacity}</FieldError>
            </div>

            <div className="space-y-unit-xs">
              <label className="text-label-md font-bold text-on-surface-variant" htmlFor="schedule-vip-capacity">
                VIP Capacity
              </label>
              <input
                className="w-full rounded-md border-none bg-surface-container-low px-unit-md py-unit-md text-body-md focus:ring-2 focus:ring-primary"
                id="schedule-vip-capacity"
                min="0"
                name="vipCapacity"
                placeholder="20"
                step="1"
                type="number"
                value={formValues.vipCapacity}
                onChange={onChange}
              />
              <FieldError>{fieldErrors.vipCapacity || inventoryValidation.errors.vipCapacity}</FieldError>
            </div>

            <div className="space-y-unit-xs">
              <label className="text-label-md font-bold text-on-surface-variant" htmlFor="schedule-family-capacity">
                Family Capacity
              </label>
              <input
                className="w-full rounded-md border-none bg-surface-container-low px-unit-md py-unit-md text-body-md focus:ring-2 focus:ring-primary"
                id="schedule-family-capacity"
                min="0"
                name="familyCapacity"
                placeholder="10"
                step="1"
                type="number"
                value={formValues.familyCapacity}
                onChange={onChange}
              />
              <FieldError>{fieldErrors.familyCapacity || inventoryValidation.errors.familyCapacity}</FieldError>
            </div>

            <div className="space-y-unit-xs">
              <label className="text-label-md font-bold text-on-surface-variant" htmlFor="schedule-standard-price">
                Standard Price (VND)
              </label>
              <input
                className="w-full rounded-md border-none bg-surface-container-low px-unit-md py-unit-md text-body-md focus:ring-2 focus:ring-primary"
                id="schedule-standard-price"
                min="1"
                name="standardPrice"
                placeholder="2500"
                step="1"
                type="number"
                value={formValues.standardPrice}
                onChange={onChange}
              />
              <FieldError>{fieldErrors.standardPrice || inventoryValidation.errors.standardPrice}</FieldError>
            </div>

            <div className="rounded-md bg-surface-container-low p-unit-md md:col-span-2">
              <p className="font-label-lg text-on-surface">
                Total Capacity: {inventoryValidation.totalCapacity} / {selectedVenue?.capacity ?? 'Select a venue'}
              </p>
              <FieldError>{inventoryValidation.errors.totalCapacity}</FieldError>
            </div>

            {isEdit && (
              <div className="space-y-unit-xs md:col-span-2">
                <label className="text-label-md font-bold text-on-surface-variant" htmlFor="schedule-status">
                  Status
                </label>
                <select
                  className="w-full rounded-md border-none bg-surface-container-low px-unit-md py-unit-md text-body-md focus:ring-2 focus:ring-primary"
                  id="schedule-status"
                  name="status"
                  value={formValues.status}
                  onChange={onChange}
                >
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="INACTIVE">INACTIVE</option>
                </select>
                <FieldError>{fieldErrors.status}</FieldError>
              </div>
            )}
          </div>

          <div className="flex gap-unit-md rounded-md border border-tertiary-container/30 bg-tertiary-container/10 p-unit-md">
            <span className="material-symbols-outlined text-tertiary-container">info</span>
            <div className="space-y-1">
              <h4 className="text-label-md font-bold text-tertiary">Backend Validation Applies</h4>
              <p className="text-body-sm text-on-surface-variant">
                Start must be before end, at least 24 hours ahead, non-overlapping, and the combined ticket capacity must fit the venue.
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-unit-md border-t border-outline-variant/20 pt-unit-lg">
            <button className="rounded-md px-unit-xl py-unit-md font-label-lg text-on-surface-variant transition-colors hover:bg-surface-container-high" disabled={isSaving} type="button" onClick={onClose}>
              Cancel
            </button>
            <button className="rounded-md bg-primary px-unit-xl py-unit-md font-label-lg text-on-primary transition-all hover:opacity-90 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60" disabled={isSaving || !inventoryValidation.isValid} type="submit">
              {isSaving ? 'Saving...' : isEdit ? 'Update Schedule' : 'Create Schedule'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ConfirmDeactivateDialog({ schedule, isWorking, error, onCancel, onConfirm }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-on-background/40 p-unit-lg backdrop-blur-sm">
      <button className="absolute inset-0" type="button" aria-label="Cancel deactivate" onClick={onCancel} />
      <div className="glass-card relative w-full max-w-md rounded-lg p-unit-lg text-center shadow-2xl">
        <div className="mx-auto mb-unit-lg flex h-16 w-16 items-center justify-center rounded-full bg-error/10">
          <span className="material-symbols-outlined text-4xl text-error">warning</span>
        </div>
        <h3 className="font-headline-md text-headline-md font-bold text-on-surface">Deactivate Schedule?</h3>
        <p className="mt-unit-sm text-body-md text-on-surface-variant">
          This will hide the schedule for <strong>{schedule?.showTitle}</strong>. Backend will reject this if paid bookings exist.
        </p>
        {error && <p className="mt-unit-md rounded-md bg-error/10 p-unit-sm text-label-md font-bold text-error">{error}</p>}
        <div className="mt-unit-lg flex gap-unit-md">
          <button className="flex-1 rounded-md border border-outline-variant px-unit-md py-unit-md font-label-lg text-on-surface-variant hover:bg-surface-container-high" disabled={isWorking} type="button" onClick={onCancel}>
            Cancel
          </button>
          <button className="flex-1 rounded-md bg-error px-unit-md py-unit-md font-label-lg text-on-error hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60" disabled={isWorking} type="button" onClick={onConfirm}>
            {isWorking ? 'Deactivating...' : 'Deactivate'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ManageSchedulesPage() {
  const [schedules, setSchedules] = useState([]);
  const [shows, setShows] = useState([]);
  const [venues, setVenues] = useState([]);
  const [pagination, setPagination] = useState({
    page: 0,
    size: 10,
    totalItems: 0,
    totalPages: 0,
    hasNext: false,
    hasPrevious: false,
  });
  const [currentPage, setCurrentPage] = useState(0);
  const [filters, setFilters] = useState({
    showId: '',
    venueId: '',
    status: '',
    fromTime: '',
    toTime: '',
  });
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [actionError, setActionError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  const [formMode, setFormMode] = useState(null);
  const [editingSchedule, setEditingSchedule] = useState(null);
  const [resolvedEditingVenue, setResolvedEditingVenue] = useState(null);
  const [formValues, setFormValues] = useState(emptyForm);
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const [scheduleToDeactivate, setScheduleToDeactivate] = useState(null);
  const [workingScheduleId, setWorkingScheduleId] = useState(null);

  useEffect(() => {
    let isActive = true;

    async function loadReferenceData() {
      try {
        const [showResponse, venueResponse] = await Promise.all([
          getManagerShows({ status: 'ACTIVE', page: 0, size: 100 }),
          getVenues({ status: 'ACTIVE', page: 0, size: 100 }),
        ]);

        if (!isActive) {
          return;
        }

        setShows(Array.isArray(showResponse?.items) ? showResponse.items : []);
        setVenues(Array.isArray(venueResponse?.items) ? venueResponse.items : []);
      } catch (error) {
        if (isActive) {
          setActionError(getErrorMessage(error, 'Could not load shows or venues for schedule forms.'));
        }
      }
    }

    loadReferenceData();

    return () => {
      isActive = false;
    };
  }, []);

  useEffect(() => {
    let isActive = true;

    async function loadSchedules() {
      setIsLoading(true);
      setLoadError('');

      try {
        const response = await getSchedules({
          showId: filters.showId,
          venueId: filters.venueId,
          status: filters.status,
          fromTime: filters.fromTime,
          toTime: filters.toTime,
          page: currentPage,
          size: pagination.size,
        });

        if (!isActive) {
          return;
        }

        const items = Array.isArray(response?.items) ? response.items : [];
        setSchedules(items);
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

        setSchedules([]);
        setPagination((current) => ({
          ...current,
          page: currentPage,
          totalItems: 0,
          totalPages: 0,
          hasNext: false,
          hasPrevious: false,
        }));
        setLoadError(getErrorMessage(error, 'Could not load schedules.'));
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    }

    loadSchedules();

    return () => {
      isActive = false;
    };
  }, [currentPage, filters, pagination.size, reloadKey]);

  useEffect(() => {
    const currentVenueId = editingSchedule?.venueId;

    if (!currentVenueId || venues.some((venue) => venue.id === currentVenueId)) {
      setResolvedEditingVenue(null);
      return undefined;
    }

    let isActive = true;
    setResolvedEditingVenue(null);

    getVenue(currentVenueId)
      .then((venue) => {
        if (isActive) {
          setResolvedEditingVenue(venue);
        }
      })
      .catch((error) => {
        if (isActive) {
          setFormError(getErrorMessage(error, 'Could not load the current venue details.'));
        }
      });

    return () => {
      isActive = false;
    };
  }, [editingSchedule, venues]);

  const stats = useMemo(() => {
    const active = schedules.filter((schedule) => schedule.status === 'ACTIVE').length;
    const inactive = schedules.filter((schedule) => schedule.status === 'INACTIVE').length;
    const availableTickets = schedules.reduce(
      (total, schedule) => total
        + (Number(schedule.standardAvailableTickets) || 0)
        + (Number(schedule.vipAvailableTickets) || 0)
        + (Number(schedule.familyAvailableTickets) || 0),
      0,
    );

    return {
      total: pagination.totalItems,
      active,
      inactive,
      availableTickets,
    };
  }, [pagination.totalItems, schedules]);

  const venueOptions = useMemo(
    () => buildScheduleVenueOptions(venues, editingSchedule, resolvedEditingVenue),
    [editingSchedule, resolvedEditingVenue, venues],
  );
  const selectedVenue = useMemo(
    () => findScheduleVenue(venueOptions, formValues.venueId),
    [formValues.venueId, venueOptions],
  );
  const inventoryValidation = useMemo(
    () => validateScheduleInventory(formValues, selectedVenue?.capacity),
    [formValues, selectedVenue?.capacity],
  );

  const handleFilterChange = (event) => {
    const { name, value } = event.target;
    setFilters((current) => ({ ...current, [name]: value }));
    setCurrentPage(0);
  };

  const clearFilters = () => {
    setFilters({
      showId: '',
      venueId: '',
      status: '',
      fromTime: '',
      toTime: '',
    });
    setCurrentPage(0);
  };

  const openCreateForm = () => {
    setFormMode('create');
    setEditingSchedule(null);
    setResolvedEditingVenue(null);
    setFormValues(emptyForm);
    setFieldErrors({});
    setFormError('');
  };

  const openEditForm = (schedule) => {
    setFormMode('edit');
    setEditingSchedule(schedule);
    setResolvedEditingVenue(null);
    setFormValues(toForm(schedule));
    setFieldErrors({});
    setFormError('');
  };

  const closeForm = () => {
    if (isSaving) {
      return;
    }
    setFormMode(null);
    setEditingSchedule(null);
    setResolvedEditingVenue(null);
    setFieldErrors({});
    setFormError('');
  };

  const handleFormChange = (event) => {
    const { name, value } = event.target;
    setFormValues((current) => ({ ...current, [name]: value }));
    setFieldErrors((current) => ({ ...current, [name]: '' }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!inventoryValidation.isValid) {
      return;
    }

    setIsSaving(true);
    setFieldErrors({});
    setFormError('');
    setSuccessMessage('');
    setActionError('');

    const basePayload = {
      venueId: formValues.venueId || null,
      startTime: formValues.startTime || null,
      endTime: formValues.endTime || null,
      standardCapacity: Number(formValues.standardCapacity),
      vipCapacity: Number(formValues.vipCapacity),
      familyCapacity: Number(formValues.familyCapacity),
      standardPrice: Number(formValues.standardPrice),
    };
    const payload = formMode === 'edit'
      ? { ...basePayload, status: formValues.status }
      : { ...basePayload, showId: formValues.showId || null };

    try {
      if (formMode === 'edit' && editingSchedule) {
        await updateSchedule(editingSchedule.id, payload);
        setSuccessMessage('Schedule updated successfully.');
      } else {
        await createSchedule(payload);
        setSuccessMessage('Schedule created successfully.');
      }

      closeForm();
      setReloadKey((key) => key + 1);
    } catch (error) {
      setFieldErrors(getValidationErrors(error));
      setFormError(getErrorMessage(error, 'Could not save schedule. Please review the form and try again.'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleActivate = async (schedule) => {
    setWorkingScheduleId(schedule.id);
    setSuccessMessage('');
    setActionError('');

    try {
      await activateSchedule(schedule.id);
      setSuccessMessage('Schedule activated successfully.');
      setReloadKey((key) => key + 1);
    } catch (error) {
      setActionError(getErrorMessage(error, 'Could not activate schedule.'));
    } finally {
      setWorkingScheduleId(null);
    }
  };

  const handleConfirmDeactivate = async () => {
    if (!scheduleToDeactivate) {
      return;
    }

    setWorkingScheduleId(scheduleToDeactivate.id);
    setSuccessMessage('');
    setActionError('');

    try {
      await deactivateSchedule(scheduleToDeactivate.id);
      setSuccessMessage('Schedule deactivated successfully.');
      setScheduleToDeactivate(null);
      setReloadKey((key) => key + 1);
    } catch (error) {
      setActionError(getErrorMessage(error, 'Could not deactivate schedule.'));
    } finally {
      setWorkingScheduleId(null);
    }
  };

  return (
    <div className="min-h-screen bg-background font-body-md text-on-background">
      <style>{".material-symbols-outlined {\r\n            font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;\r\n        }\r\n        .glass-card {\r\n            background: rgba(255, 255, 255, 0.7);\r\n            backdrop-filter: blur(20px);\r\n            border: 1px solid rgba(255, 255, 255, 0.2);\r\n            box-shadow: 0 8px 32px 0 rgba(0, 105, 107, 0.08);\r\n        }"}</style>

      <ManagerLayout
        headerTitle="Manage Show Schedules"
        headerDescription="Create and maintain schedule capacity, timing, venue, and pricing."
      >
        <div className="space-y-unit-lg">
          <ManagerPageHeader
            title="Schedule Operations"
            description="Manage schedule availability without crossing into administrator user or role workflows."
            actions={(
              <>
                <button className="rounded-full bg-primary px-unit-lg py-2 font-label-lg text-on-primary transition hover:shadow-md" type="button" onClick={openCreateForm}>
                  <span className="material-symbols-outlined mr-1 text-[18px]">add</span>
                  Create Schedule
                </button>
                <button className="rounded-full border border-outline-variant px-unit-md py-2 text-label-lg text-on-surface-variant hover:bg-surface-container-high" type="button" onClick={() => setReloadKey((key) => key + 1)}>
                  Refresh
                </button>
              </>
            )}
          />
          {successMessage && (
            <div className="rounded-lg border border-primary/20 bg-primary-container/20 px-unit-lg py-3 font-label-lg text-primary">
              {successMessage}
            </div>
          )}
          {actionError && (
            <div className="rounded-lg border border-error/20 bg-error/10 px-unit-lg py-3 font-label-lg text-error">
              {actionError}
            </div>
          )}

          <ManagerActionBar className="items-end">
            <div className="min-w-[200px] flex-1 space-y-unit-xs">
              <label className="text-label-md uppercase text-on-surface-variant" htmlFor="filter-show">
                Show
              </label>
              <select className="w-full rounded-md border-none bg-surface-container-low text-body-sm focus:ring-2 focus:ring-primary" id="filter-show" name="showId" value={filters.showId} onChange={handleFilterChange}>
                <option value="">All Shows</option>
                {shows.map((show) => (
                  <option key={show.id} value={show.id}>
                    {show.title}
                  </option>
                ))}
              </select>
            </div>

            <div className="min-w-[200px] flex-1 space-y-unit-xs">
              <label className="text-label-md uppercase text-on-surface-variant" htmlFor="filter-venue">
                Venue
              </label>
              <select className="w-full rounded-md border-none bg-surface-container-low text-body-sm focus:ring-2 focus:ring-primary" id="filter-venue" name="venueId" value={filters.venueId} onChange={handleFilterChange}>
                <option value="">All Venues</option>
                {venues.map((venue) => (
                  <option key={venue.id} value={venue.id}>
                    {venue.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="min-w-[150px] flex-1 space-y-unit-xs">
              <label className="text-label-md uppercase text-on-surface-variant" htmlFor="filter-status">
                Status
              </label>
              <select className="w-full rounded-md border-none bg-surface-container-low text-body-sm focus:ring-2 focus:ring-primary" id="filter-status" name="status" value={filters.status} onChange={handleFilterChange}>
                <option value="">All Statuses</option>
                <option value="ACTIVE">ACTIVE</option>
                <option value="INACTIVE">INACTIVE</option>
              </select>
            </div>

            <div className="min-w-[260px] flex-1 space-y-unit-xs">
              <label className="text-label-md uppercase text-on-surface-variant">Start Date Range</label>
              <div className="flex items-center rounded-md bg-surface-container-low px-unit-sm">
                <input className="min-w-0 bg-transparent text-body-sm focus:ring-0" name="fromTime" type="datetime-local" value={filters.fromTime} onChange={handleFilterChange} />
                <span className="px-unit-xs text-on-surface-variant">-</span>
                <input className="min-w-0 bg-transparent text-body-sm focus:ring-0" name="toTime" type="datetime-local" value={filters.toTime} onChange={handleFilterChange} />
              </div>
            </div>

            <button className="rounded-lg border border-outline-variant px-unit-md py-unit-sm text-label-lg text-on-surface-variant hover:bg-surface-variant/30" type="button" onClick={clearFilters}>
              Clear
            </button>
          </ManagerActionBar>

          <div className="grid grid-cols-1 gap-unit-lg md:grid-cols-4">
            <ManagerStatCard label="Total Schedules" value={stats.total} />
            <ManagerStatCard label="Active On Page" value={stats.active} tone="secondary" />
            <ManagerStatCard label="Inactive On Page" value={stats.inactive} tone="tertiary" />
            <ManagerStatCard label="Available Tickets" value={stats.availableTickets} tone="neutral" />
          </div>

          <div className="glass-card overflow-hidden rounded-lg">
            {isLoading ? (
              <div className="space-y-3 p-unit-lg">
                {Array.from({ length: 5 }).map((_, index) => (
                  <div className="h-20 animate-pulse rounded-lg bg-surface-container-low" key={index} />
                ))}
              </div>
            ) : loadError ? (
              <div className="p-unit-xl text-center">
                <span className="material-symbols-outlined text-5xl text-error">error</span>
                <h3 className="mt-unit-sm font-headline-md text-headline-md text-on-surface">Could not load schedules</h3>
                <p className="mt-2 text-body-md text-error">{loadError}</p>
                <button className="mt-unit-lg rounded-md bg-primary px-unit-lg py-unit-md font-label-lg text-on-primary" type="button" onClick={() => setReloadKey((key) => key + 1)}>
                  Try Again
                </button>
              </div>
            ) : schedules.length === 0 ? (
              <div className="p-unit-xl text-center">
                <span className="material-symbols-outlined text-5xl text-primary">event_busy</span>
                <h3 className="mt-unit-sm font-headline-md text-headline-md text-on-surface">No schedules found</h3>
                <p className="mt-2 text-body-md text-on-surface-variant">Create a schedule or adjust the current filters.</p>
                <button className="mt-unit-lg rounded-md bg-primary px-unit-lg py-unit-md font-label-lg text-on-primary" type="button" onClick={openCreateForm}>
                  Create Schedule
                </button>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-left">
                    <thead>
                      <tr className="bg-surface-container font-label-lg text-on-surface-variant">
                        <th className="px-unit-lg py-unit-md">Schedule ID</th>
                        <th className="px-unit-lg py-unit-md">Show</th>
                        <th className="px-unit-lg py-unit-md">Venue</th>
                        <th className="px-unit-lg py-unit-md">Start Time</th>
                        <th className="px-unit-lg py-unit-md">End Time</th>
                        <th className="px-unit-lg py-unit-md text-center">Standard A/C</th>
                        <th className="px-unit-lg py-unit-md text-center">VIP A/C</th>
                        <th className="px-unit-lg py-unit-md text-center">Family A/C</th>
                        <th className="px-unit-lg py-unit-md text-center">Total Available</th>
                        <th className="px-unit-lg py-unit-md">Standard Price</th>
                        <th className="px-unit-lg py-unit-md">Status</th>
                        <th className="px-unit-lg py-unit-md text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-outline-variant/10">
                      {schedules.map((schedule) => (
                          <tr className={`group transition-colors hover:bg-surface-container-low ${schedule.status === 'INACTIVE' ? 'opacity-70' : ''}`} key={schedule.id}>
                            <td className="px-unit-lg py-unit-md font-mono text-[12px] text-on-surface-variant" title={schedule.id}>{truncateId(schedule.id)}</td>
                            <td className="px-unit-lg py-unit-md">
                              <span className="font-bold text-primary">{schedule.showTitle}</span>
                            </td>
                            <td className="px-unit-lg py-unit-md text-on-surface-variant">{schedule.venueName || 'TBA'}</td>
                            <td className="px-unit-lg py-unit-md font-medium">{formatDateTime(schedule.startTime)}</td>
                            <td className="px-unit-lg py-unit-md text-on-surface-variant">{formatDateTime(schedule.endTime)}</td>
                            <td className="px-unit-lg py-unit-md text-center font-bold">{schedule.standardAvailableTickets ?? 'TBA'}/{schedule.standardCapacity ?? 'TBA'}</td>
                            <td className="px-unit-lg py-unit-md text-center font-bold">{schedule.vipAvailableTickets ?? 'TBA'}/{schedule.vipCapacity ?? 'TBA'}</td>
                            <td className="px-unit-lg py-unit-md text-center font-bold">{schedule.familyAvailableTickets ?? 'TBA'}/{schedule.familyCapacity ?? 'TBA'}</td>
                            <td className="px-unit-lg py-unit-md text-center font-bold">{schedule.totalAvailableTickets ?? 'TBA'}</td>
                            <td className="px-unit-lg py-unit-md font-bold">{schedule.standardPrice != null ? formatCurrency(schedule.standardPrice) : 'TBA'}</td>
                            <td className="px-unit-lg py-unit-md">
                              <span className={`rounded-full px-3 py-1 text-label-md font-bold uppercase ${statusBadge(schedule.status)}`}>{schedule.status}</span>
                            </td>
                            <td className="px-unit-lg py-unit-md text-right">
                              <div className="flex justify-end gap-unit-sm">
                                <button className="rounded-full p-2 text-primary hover:bg-primary/10" type="button" onClick={() => openEditForm(schedule)}>
                                  <span className="material-symbols-outlined">edit</span>
                                </button>
                                {schedule.status === 'ACTIVE' ? (
                                  <button className="rounded-full p-2 text-error hover:bg-error/10 disabled:cursor-not-allowed disabled:opacity-50" disabled={workingScheduleId === schedule.id} type="button" onClick={() => { setActionError(''); setScheduleToDeactivate(schedule); }}>
                                    <span className="material-symbols-outlined">block</span>
                                  </button>
                                ) : (
                                  <button className="rounded-full p-2 text-primary hover:bg-primary/10 disabled:cursor-not-allowed disabled:opacity-50" disabled={workingScheduleId === schedule.id} type="button" onClick={() => handleActivate(schedule)}>
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

                <div className="flex flex-col gap-unit-md border-t border-outline-variant/10 p-unit-md md:flex-row md:items-center md:justify-between">
                  <span className="text-body-sm text-on-surface-variant">
                    Showing {schedules.length} of {pagination.totalItems} schedules
                    {pagination.totalPages > 0 ? ` · Page ${pagination.page + 1} of ${pagination.totalPages}` : ''}
                  </span>
                  <div className="flex items-center gap-unit-xs">
                    <button className="rounded-md p-unit-sm transition-colors hover:bg-surface-container-high disabled:cursor-not-allowed disabled:opacity-40" disabled={!pagination.hasPrevious} type="button" onClick={() => setCurrentPage((page) => Math.max(0, page - 1))}>
                      <span className="material-symbols-outlined">chevron_left</span>
                    </button>
                    <span className="flex h-8 min-w-8 items-center justify-center rounded-md bg-primary px-3 font-bold text-on-primary">{pagination.page + 1}</span>
                    <button className="rounded-md p-unit-sm transition-colors hover:bg-surface-container-high disabled:cursor-not-allowed disabled:opacity-40" disabled={!pagination.hasNext} type="button" onClick={() => setCurrentPage((page) => page + 1)}>
                      <span className="material-symbols-outlined">chevron_right</span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </ManagerLayout>

      {formMode && (
        <ScheduleFormModal
          formMode={formMode}
          formValues={formValues}
          shows={shows}
          venues={venueOptions}
          selectedVenue={selectedVenue}
          inventoryValidation={inventoryValidation}
          fieldErrors={fieldErrors}
          generalError={formError}
          isSaving={isSaving}
          onChange={handleFormChange}
          onClose={closeForm}
          onSubmit={handleSubmit}
        />
      )}

      {scheduleToDeactivate && (
        <ConfirmDeactivateDialog
          schedule={scheduleToDeactivate}
          isWorking={workingScheduleId === scheduleToDeactivate.id}
          error={actionError}
          onCancel={() => {
            if (!workingScheduleId) {
              setScheduleToDeactivate(null);
              setActionError('');
            }
          }}
          onConfirm={handleConfirmDeactivate}
        />
      )}
    </div>
  );
}
