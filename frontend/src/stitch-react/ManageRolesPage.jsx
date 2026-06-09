import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import { getAdminUsers } from '../services/adminUserService.js';
import { assignUserRole, getRoles, getUserRole } from '../services/adminRoleService.js';

const roleOrder = ['USER', 'STAFF', 'MANAGER', 'ADMIN'];

const roleMeta = {
  USER: {
    icon: 'person',
    border: 'border-primary',
    color: 'text-primary',
    bg: 'bg-primary/10',
  },
  STAFF: {
    icon: 'badge',
    border: 'border-secondary',
    color: 'text-secondary',
    bg: 'bg-secondary/10',
  },
  MANAGER: {
    icon: 'supervisor_account',
    border: 'border-primary-container',
    color: 'text-on-primary-container',
    bg: 'bg-primary-container/20',
  },
  ADMIN: {
    icon: 'shield_person',
    border: 'border-on-secondary-fixed',
    color: 'text-on-secondary-fixed',
    bg: 'bg-on-secondary-fixed/10',
  },
};

function getErrorMessage(error, fallback) {
  return error?.response?.data?.message || error?.message || fallback;
}

function formatEnum(value) {
  return value ? value.replaceAll('_', ' ') : 'TBA';
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

function roleClasses(role) {
  if (role === 'ADMIN') {
    return 'bg-on-secondary-fixed/10 text-on-secondary-fixed';
  }

  if (role === 'MANAGER') {
    return 'bg-primary-container/20 text-on-primary-container';
  }

  if (role === 'STAFF') {
    return 'bg-secondary/10 text-secondary';
  }

  return 'bg-primary/10 text-primary';
}

function statusClass(status) {
  if (status === 'ACTIVE') {
    return 'text-primary';
  }

  if (status === 'DISABLED') {
    return 'text-error';
  }

  return 'text-tertiary';
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
      <span className="font-body-md">{label}</span>
    </Link>
  );
}

function RoleCard({ role }) {
  const meta = roleMeta[role.name] || roleMeta.USER;

  return (
    <div className={`glass-card flex flex-col gap-unit-md rounded-lg border-t-4 p-unit-lg ${meta.border}`}>
      <div className="flex items-start justify-between">
        <div className={`rounded-lg p-unit-sm ${meta.bg}`}>
          <span className={`material-symbols-outlined ${meta.color}`}>{meta.icon}</span>
        </div>
        <span className="rounded-full bg-surface-container px-unit-sm py-unit-xs text-label-md text-on-surface-variant">Enum role</span>
      </div>
      <div>
        <h3 className={`font-headline-md ${meta.color}`}>{role.name}</h3>
        <p className="mt-unit-xs font-body-sm text-on-surface-variant">{role.description || 'No description returned.'}</p>
      </div>
      <div className="mt-auto rounded-lg bg-surface-container-low p-unit-md">
        <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Authority</p>
        <p className="mt-1 font-label-lg text-on-surface">ROLE_{role.name}</p>
      </div>
    </div>
  );
}

function ConfirmRoleDialog({ user, currentRole, targetRole, isWorking, error, onCancel, onConfirm }) {
  const demotingAdmin = currentRole === 'ADMIN' && targetRole !== 'ADMIN';

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-on-background/40 p-unit-lg backdrop-blur-sm">
      <button className="absolute inset-0" type="button" aria-label="Cancel role assignment" onClick={onCancel} />
      <div className="glass-card relative w-full max-w-md rounded-lg p-unit-lg text-center shadow-2xl">
        <div className={`mx-auto mb-unit-lg flex h-16 w-16 items-center justify-center rounded-full ${demotingAdmin ? 'bg-error/10' : 'bg-primary/10'}`}>
          <span className={`material-symbols-outlined text-4xl ${demotingAdmin ? 'text-error' : 'text-primary'}`}>admin_panel_settings</span>
        </div>
        <h3 className="font-headline-md text-headline-md font-bold text-on-surface">Confirm Role Change</h3>
        <p className="mt-unit-sm text-body-md text-on-surface-variant">
          Change <strong>{user?.fullName || user?.email}</strong> from <strong>{formatEnum(currentRole)}</strong> to <strong>{formatEnum(targetRole)}</strong>.
        </p>
        {demotingAdmin && (
          <p className="mt-unit-md rounded-md bg-error/10 p-unit-sm text-label-md font-bold text-error">
            This removes administrator access immediately. Backend will reject the change if this is the last active admin.
          </p>
        )}
        {error && <p className="mt-unit-md rounded-md bg-error/10 p-unit-sm text-label-md font-bold text-error">{error}</p>}
        <div className="mt-unit-lg flex gap-unit-md">
          <button className="flex-1 rounded-md border border-outline-variant px-unit-md py-unit-md font-label-lg text-on-surface-variant hover:bg-surface-container-high" disabled={isWorking} type="button" onClick={onCancel}>
            Cancel
          </button>
          <button className="flex-1 rounded-md bg-primary px-unit-md py-unit-md font-label-lg text-on-primary hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60" disabled={isWorking} type="button" onClick={onConfirm}>
            {isWorking ? 'Assigning...' : 'Confirm Role'}
          </button>
        </div>
      </div>
    </div>
  );
}

function RoleAssignmentModal({
  users,
  roles,
  selectedUserId,
  targetRole,
  currentRoleInfo,
  isUserLoading,
  isRoleLoading,
  userError,
  roleError,
  onClose,
  onSearch,
  onSelectUser,
  onSelectRole,
  onSubmit,
}) {
  const selectedUser = users.find((user) => user.id === selectedUserId);
  const currentRole = currentRoleInfo?.role || selectedUser?.role;

  return (
    <div className="fixed inset-0 z-[100]">
      <button className="absolute inset-0 bg-on-secondary-fixed/40 backdrop-blur-sm" type="button" aria-label="Close role modal" onClick={onClose} />
      <div className="absolute left-1/2 top-1/2 w-full max-w-xl -translate-x-1/2 -translate-y-1/2 p-unit-lg">
        <div className="overflow-hidden rounded-lg bg-surface shadow-xl">
          <div className="flex items-center justify-between border-b border-outline-variant/20 p-unit-lg">
            <div>
              <h5 className="font-headline-md text-on-surface">Assign User Role</h5>
              <p className="text-body-sm text-on-surface-variant">Search a user, confirm the current role, then choose a target role.</p>
            </div>
            <button className="text-on-surface-variant hover:text-on-surface" type="button" onClick={onClose}>
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>

          <div className="space-y-unit-md p-unit-lg">
            {userError && <p className="rounded-md bg-error/10 p-unit-sm text-label-md font-bold text-error">{userError}</p>}
            {roleError && <p className="rounded-md bg-error/10 p-unit-sm text-label-md font-bold text-error">{roleError}</p>}

            <div className="space-y-unit-xs">
              <label className="font-label-lg text-on-surface-variant" htmlFor="role-user-search">Search Users</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-unit-md top-1/2 -translate-y-1/2 text-on-surface-variant">search</span>
                <input
                  className="w-full rounded-lg border border-outline-variant/20 bg-surface-container py-unit-md pl-unit-xl pr-unit-md focus:border-primary focus:ring-primary"
                  id="role-user-search"
                  placeholder="Search by name, email, phone..."
                  type="search"
                  onChange={onSearch}
                />
              </div>
            </div>

            <div className="max-h-56 overflow-y-auto rounded-lg border border-outline-variant/20">
              {isUserLoading && (
                <div className="p-unit-lg text-center text-on-surface-variant">
                  <span className="material-symbols-outlined animate-spin align-middle text-primary">progress_activity</span>
                  <span className="ml-unit-sm">Loading users...</span>
                </div>
              )}
              {!isUserLoading && users.length === 0 && (
                <div className="p-unit-lg text-center text-on-surface-variant">No users match this search.</div>
              )}
              {!isUserLoading &&
                users.map((user) => (
                  <button
                    key={user.id}
                    className={`flex w-full items-center justify-between gap-unit-md border-b border-outline-variant/10 p-unit-md text-left last:border-b-0 hover:bg-primary/5 ${selectedUserId === user.id ? 'bg-primary/10' : ''}`}
                    type="button"
                    onClick={() => onSelectUser(user)}
                  >
                    <div className="flex items-center gap-unit-md">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-container font-bold text-on-primary-container">{initials(user)}</div>
                      <div>
                        <p className="font-body-md font-bold text-on-surface">{user.fullName || 'Unnamed User'}</p>
                        <p className="font-body-sm text-on-surface-variant">{user.email}</p>
                      </div>
                    </div>
                    <span className={`rounded-full px-unit-sm py-1 text-label-md ${roleClasses(user.role)}`}>{user.role}</span>
                  </button>
                ))}
            </div>

            <div className="rounded-lg bg-surface-container-low p-unit-md">
              <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Selected User Current Role</p>
              {isRoleLoading ? (
                <p className="mt-1 text-body-sm text-on-surface-variant">Loading current role...</p>
              ) : selectedUser ? (
                <div className="mt-unit-sm flex flex-wrap items-center justify-between gap-unit-md">
                  <div>
                    <p className="font-label-lg text-on-surface">{selectedUser.fullName || selectedUser.email}</p>
                    <p className="text-body-sm text-on-surface-variant">{currentRoleInfo?.email || selectedUser.email}</p>
                  </div>
                  <span className={`rounded-full px-unit-md py-unit-xs text-label-md font-bold ${roleClasses(currentRole)}`}>{formatEnum(currentRole)}</span>
                </div>
              ) : (
                <p className="mt-1 text-body-sm text-on-surface-variant">Select a user to view their current role.</p>
              )}
            </div>

            <div className="space-y-unit-xs">
              <label className="font-label-lg text-on-surface-variant">Select Target Role</label>
              <div className="grid grid-cols-2 gap-unit-sm">
                {roles.map((role) => (
                  <button
                    key={role.name}
                    className={`rounded-lg border-2 p-unit-md text-left transition-all ${targetRole === role.name ? 'border-primary bg-primary/5' : 'border-outline-variant/20 hover:border-primary/40'}`}
                    type="button"
                    onClick={() => onSelectRole(role.name)}
                  >
                    <p className={targetRole === role.name ? 'font-label-lg text-primary' : 'font-label-lg text-on-surface'}>{role.name}</p>
                    <p className="line-clamp-2 text-[10px] text-on-surface-variant">{role.description}</p>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-unit-sm rounded-lg bg-tertiary-container/10 p-unit-md">
              <span className="material-symbols-outlined text-[20px] text-tertiary">info</span>
              <p className="text-body-sm text-on-tertiary-container">Role changes take effect immediately and may change access to sensitive operations.</p>
            </div>
          </div>

          <div className="flex gap-unit-md bg-surface-container-low p-unit-lg">
            <button className="flex-1 rounded-full border border-outline py-unit-md font-label-lg transition-all hover:bg-surface" type="button" onClick={onClose}>
              Cancel
            </button>
            <button className="flex-1 rounded-full bg-primary py-unit-md font-label-lg text-white shadow-md transition-all hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60" disabled={!selectedUserId || !targetRole || targetRole === currentRole} type="button" onClick={onSubmit}>
              Review Change
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ManageRolesPage() {
  const [roles, setRoles] = useState([]);
  const [users, setUsers] = useState([]);
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
  const [modalKeyword, setModalKeyword] = useState('');
  const [isRoleListLoading, setIsRoleListLoading] = useState(true);
  const [isUserLoading, setIsUserLoading] = useState(true);
  const [isCurrentRoleLoading, setIsCurrentRoleLoading] = useState(false);
  const [roleListError, setRoleListError] = useState('');
  const [userError, setUserError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [reloadKey, setReloadKey] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [currentRoleInfo, setCurrentRoleInfo] = useState(null);
  const [targetRole, setTargetRole] = useState('');
  const [pendingAssignment, setPendingAssignment] = useState(null);
  const [assignmentError, setAssignmentError] = useState('');
  const [isAssigning, setIsAssigning] = useState(false);

  useEffect(() => {
    let isActive = true;

    async function loadRoles() {
      setIsRoleListLoading(true);
      setRoleListError('');

      try {
        const response = await getRoles();
        const items = Array.isArray(response) ? response : [];
        const sorted = [...items].sort((left, right) => roleOrder.indexOf(left.name) - roleOrder.indexOf(right.name));

        if (isActive) {
          setRoles(sorted);
        }
      } catch (error) {
        if (isActive) {
          setRoles([]);
          setRoleListError(getErrorMessage(error, 'Could not load roles.'));
        }
      } finally {
        if (isActive) {
          setIsRoleListLoading(false);
        }
      }
    }

    loadRoles();

    return () => {
      isActive = false;
    };
  }, [reloadKey]);

  useEffect(() => {
    let isActive = true;

    async function loadUsers() {
      setIsUserLoading(true);
      setUserError('');

      try {
        const response = await getAdminUsers({
          keyword,
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
        setUserError(getErrorMessage(error, 'Could not load users for role assignment.'));
      } finally {
        if (isActive) {
          setIsUserLoading(false);
        }
      }
    }

    loadUsers();

    return () => {
      isActive = false;
    };
  }, [keyword, currentPage, pagination.size, reloadKey]);

  async function loadCurrentRole(user) {
    setSelectedUserId(user.id);
    setCurrentRoleInfo(null);
    setTargetRole(user.role || '');
    setAssignmentError('');
    setIsCurrentRoleLoading(true);

    try {
      const response = await getUserRole(user.id);
      setCurrentRoleInfo(response);
      setTargetRole(response.role || user.role || '');
    } catch (error) {
      setAssignmentError(getErrorMessage(error, 'Could not load current user role.'));
    } finally {
      setIsCurrentRoleLoading(false);
    }
  }

  function openModal(user = null) {
    setIsModalOpen(true);
    setAssignmentError('');
    setModalKeyword('');

    if (user) {
      loadCurrentRole(user);
    } else {
      setSelectedUserId('');
      setCurrentRoleInfo(null);
      setTargetRole('');
    }
  }

  function closeModal() {
    if (isAssigning) {
      return;
    }

    setIsModalOpen(false);
    setSelectedUserId('');
    setCurrentRoleInfo(null);
    setTargetRole('');
    setAssignmentError('');
  }

  function reviewAssignment() {
    const user = users.find((item) => item.id === selectedUserId);
    const currentRole = currentRoleInfo?.role || user?.role;

    if (!user || !targetRole || targetRole === currentRole) {
      return;
    }

    setPendingAssignment({
      user,
      currentRole,
      targetRole,
    });
    setAssignmentError('');
  }

  async function confirmAssignment() {
    if (!pendingAssignment?.user?.id || !pendingAssignment.targetRole) {
      return;
    }

    setIsAssigning(true);
    setAssignmentError('');
    setSuccessMessage('');

    try {
      await assignUserRole(pendingAssignment.user.id, pendingAssignment.targetRole);
      setSuccessMessage(`Role updated for ${pendingAssignment.user.fullName || pendingAssignment.user.email}.`);
      setPendingAssignment(null);
      closeModal();
      setReloadKey((key) => key + 1);
    } catch (error) {
      setAssignmentError(getErrorMessage(error, 'Could not assign role.'));
    } finally {
      setIsAssigning(false);
    }
  }

  const modalUsers = useMemo(() => {
    const query = modalKeyword.trim().toLowerCase();

    if (!query) {
      return users;
    }

    return users.filter((user) => (
      user.email?.toLowerCase().includes(query)
      || user.fullName?.toLowerCase().includes(query)
      || user.phoneNumber?.toLowerCase().includes(query)
    ));
  }, [users, modalKeyword]);

  const selectedUser = users.find((user) => user.id === selectedUserId);
  const currentRole = currentRoleInfo?.role || selectedUser?.role;
  const startItem = users.length === 0 ? 0 : pagination.page * pagination.size + 1;
  const endItem = users.length === 0 ? 0 : startItem + users.length - 1;

  return (
    <div className="min-h-screen overflow-x-hidden bg-background">
      <style>{`body {
            font-family: 'Plus Jakarta Sans', sans-serif;
            background-color: #f1fbfb;
        }
        .glass-card {
            background: rgba(255, 255, 255, 0.7);
            backdrop-filter: blur(20px);
            border: 1px solid rgba(255, 255, 255, 0.2);
            box-shadow: 0 8px 32px 0 rgba(0, 31, 40, 0.05);
        }
        .material-symbols-outlined {
            font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
        }`}</style>

      <aside className="fixed left-0 top-0 z-50 flex h-full w-sidebar-width flex-col bg-on-secondary-fixed py-unit-lg shadow-lg">
        <div className="mb-unit-xl px-unit-lg">
          <h1 className="font-headline-md text-headline-md font-bold text-primary-fixed">AquaShow MS</h1>
          <p className="font-body-md text-body-md text-primary-fixed/70">Management System</p>
        </div>
        <nav className="flex-1 space-y-unit-xs">
          <SidebarLink icon="dashboard" label="Dashboard" to="/manager/dashboard" />
          <SidebarLink icon="theater_comedy" label="Shows" to="/manager/shows" />
          <SidebarLink icon="water_drop" label="Venues" to="/manager/venues" />
          <SidebarLink icon="calendar_month" label="Schedules" to="/manager/schedules" />
          <SidebarLink icon="event_seat" label="Bookings" to="/manager/bookings" />
          <SidebarLink icon="analytics" label="Reports" to="/manager/reports" />
          <SidebarLink icon="group" label="Users" to="/admin/users" />
          <SidebarLink active icon="admin_panel_settings" label="Roles" to="/admin/roles" />
        </nav>
        <div className="mt-auto px-unit-lg">
          <Link className="block w-full rounded-lg bg-primary-fixed py-unit-md text-center font-label-lg text-on-primary-fixed transition-transform active:scale-[0.98]" to="/manager/schedules">
            Quick Schedule
          </Link>
        </div>
      </aside>

      <main className="ml-sidebar-width min-h-screen">
        <header className="sticky top-0 z-40 flex items-center justify-between border-b border-outline-variant/20 bg-surface/70 px-unit-lg py-unit-sm shadow-sm backdrop-blur-md">
          <div className="flex flex-1 items-center gap-unit-lg">
            <h2 className="font-headline-md text-headline-md font-extrabold text-primary">Manage Roles</h2>
            <div className="relative w-full max-w-md">
              <span className="material-symbols-outlined absolute left-unit-md top-1/2 -translate-y-1/2 text-on-surface-variant">search</span>
              <input
                className="w-full rounded-full border-none bg-surface-container py-2 pl-unit-xl pr-unit-md text-body-sm focus:ring-2 focus:ring-primary"
                placeholder="Search users for role assignment..."
                type="search"
                value={keyword}
                onChange={(event) => {
                  setKeyword(event.target.value);
                  setCurrentPage(0);
                }}
              />
            </div>
          </div>
          <div className="flex items-center gap-unit-md">
            <button className="rounded-full p-unit-sm transition-colors duration-150 hover:bg-surface-container-high/50 active:scale-95" type="button">
              <span className="material-symbols-outlined text-on-surface-variant">notifications</span>
            </button>
            <button className="rounded-full p-unit-sm transition-colors duration-150 hover:bg-surface-container-high/50 active:scale-95" type="button">
              <span className="material-symbols-outlined text-on-surface-variant">help_outline</span>
            </button>
            <button className="rounded-full p-unit-sm transition-colors duration-150 hover:bg-surface-container-high/50 active:scale-95" type="button">
              <span className="material-symbols-outlined text-on-surface-variant">settings</span>
            </button>
            <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-primary-container bg-primary/10 text-primary">
              <span className="material-symbols-outlined">admin_panel_settings</span>
            </div>
          </div>
        </header>

        <div className="space-y-unit-lg p-unit-lg">
          <div className="flex items-center gap-unit-md rounded-lg border border-error/20 bg-error-container/20 p-unit-md text-on-error-container">
            <span className="material-symbols-outlined text-error">warning</span>
            <p className="font-label-lg">Role changes affect access permissions immediately for the selected user.</p>
          </div>

          {successMessage && (
            <div className="rounded-lg border border-primary/20 bg-primary/10 p-unit-md text-body-sm font-bold text-primary">
              {successMessage}
            </div>
          )}

          <section className="grid grid-cols-1 gap-unit-lg md:grid-cols-2 xl:grid-cols-4">
            {isRoleListLoading && (
              <div className="glass-card col-span-full rounded-lg p-unit-xl text-center text-on-surface-variant">
                <span className="material-symbols-outlined animate-spin align-middle text-primary">progress_activity</span>
                <span className="ml-unit-sm font-label-lg">Loading roles...</span>
              </div>
            )}

            {!isRoleListLoading && roleListError && (
              <div className="glass-card col-span-full rounded-lg border border-error/20 bg-error/10 p-unit-lg text-center">
                <p className="font-label-lg text-error">{roleListError}</p>
                <button className="mt-unit-md rounded-lg bg-error px-unit-lg py-unit-sm font-label-lg text-on-error" type="button" onClick={() => setReloadKey((key) => key + 1)}>
                  Retry
                </button>
              </div>
            )}

            {!isRoleListLoading && !roleListError && roles.length === 0 && (
              <div className="glass-card col-span-full rounded-lg p-unit-xl text-center text-on-surface-variant">
                No roles returned by backend.
              </div>
            )}

            {!isRoleListLoading && !roleListError && roles.map((role) => <RoleCard key={role.name} role={role} />)}
          </section>

          <section className="glass-card overflow-hidden rounded-lg">
            <div className="flex flex-col justify-between gap-unit-md border-b border-outline-variant/20 p-unit-lg md:flex-row md:items-center">
              <div>
                <h4 className="font-headline-md text-on-surface">User Role Assignment</h4>
                <p className="font-body-sm text-on-surface-variant">Modify individual user access by assigning one enum role.</p>
              </div>
              <button className="flex items-center gap-unit-sm rounded-full bg-primary px-unit-lg py-unit-md font-label-lg text-white shadow-md transition-all hover:opacity-90" type="button" onClick={() => openModal()}>
                <span className="material-symbols-outlined">add</span>
                Assign Role
              </button>
            </div>

            {userError && (
              <div className="m-unit-lg rounded-lg border border-error/20 bg-error/10 p-unit-lg text-center">
                <p className="font-label-lg text-error">{userError}</p>
                <button className="mt-unit-md rounded-lg bg-error px-unit-lg py-unit-sm font-label-lg text-on-error" type="button" onClick={() => setReloadKey((key) => key + 1)}>
                  Retry
                </button>
              </div>
            )}

            {!userError && (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left">
                  <thead className="bg-surface-container-low">
                    <tr>
                      <th className="px-unit-lg py-unit-md font-label-lg text-on-surface-variant">User</th>
                      <th className="px-unit-lg py-unit-md font-label-lg text-on-surface-variant">Email Address</th>
                      <th className="px-unit-lg py-unit-md font-label-lg text-on-surface-variant">Current Role</th>
                      <th className="px-unit-lg py-unit-md font-label-lg text-on-surface-variant">Status</th>
                      <th className="px-unit-lg py-unit-md text-right font-label-lg text-on-surface-variant">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant/10">
                    {isUserLoading && (
                      <tr>
                        <td className="px-unit-lg py-unit-xl text-center text-on-surface-variant" colSpan={5}>
                          <span className="material-symbols-outlined animate-spin align-middle text-primary">progress_activity</span>
                          <span className="ml-unit-sm font-label-lg">Loading users...</span>
                        </td>
                      </tr>
                    )}

                    {!isUserLoading && users.length === 0 && (
                      <tr>
                        <td className="px-unit-lg py-unit-xl text-center text-on-surface-variant" colSpan={5}>
                          <span className="material-symbols-outlined text-4xl">person_search</span>
                          <p className="mt-unit-sm font-label-lg text-on-surface">No users found</p>
                          <p className="text-body-sm">Try a different keyword.</p>
                        </td>
                      </tr>
                    )}

                    {!isUserLoading &&
                      users.map((user) => (
                        <tr key={user.id} className="transition-colors hover:bg-surface-container-lowest/50">
                          <td className="px-unit-lg py-unit-md">
                            <div className="flex items-center gap-unit-md">
                              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-container font-bold text-on-primary-container">{initials(user)}</div>
                              <div>
                                <p className="font-body-md font-bold text-on-surface">{user.fullName || 'Unnamed User'}</p>
                                <p className="font-body-sm text-on-surface-variant">{user.phoneNumber || 'No phone'}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-unit-lg py-unit-md font-body-sm text-on-surface-variant">{user.email}</td>
                          <td className="px-unit-lg py-unit-md">
                            <span className={`rounded-full px-unit-sm py-1 text-label-md ${roleClasses(user.role)}`}>{user.role}</span>
                          </td>
                          <td className="px-unit-lg py-unit-md">
                            <span className={`font-label-md ${statusClass(user.status)}`}>{formatEnum(user.status)}</span>
                          </td>
                          <td className="px-unit-lg py-unit-md text-right">
                            <button className="rounded-full p-unit-sm text-primary transition-colors hover:bg-primary/5" type="button" onClick={() => openModal(user)}>
                              <span className="material-symbols-outlined">edit_square</span>
                            </button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="flex items-center justify-between bg-surface-container-low p-unit-lg">
              <p className="text-body-sm text-on-surface-variant">
                Showing {startItem} to {endItem} of {pagination.totalItems} users
                {pagination.totalPages > 0 ? ` · Page ${pagination.page + 1} of ${pagination.totalPages}` : ''}
              </p>
              <div className="flex gap-unit-sm">
                <button
                  className="rounded-full p-unit-sm transition-colors hover:bg-surface disabled:cursor-not-allowed disabled:opacity-40"
                  disabled={isUserLoading || !pagination.hasPrevious}
                  type="button"
                  onClick={() => setCurrentPage((page) => Math.max(0, page - 1))}
                >
                  <span className="material-symbols-outlined">chevron_left</span>
                </button>
                <button className="flex h-8 min-w-8 items-center justify-center rounded-full bg-primary px-unit-sm text-label-md text-white" type="button">
                  {pagination.page + 1}
                </button>
                <button
                  className="rounded-full p-unit-sm transition-colors hover:bg-surface disabled:cursor-not-allowed disabled:opacity-40"
                  disabled={isUserLoading || !pagination.hasNext}
                  type="button"
                  onClick={() => setCurrentPage((page) => page + 1)}
                >
                  <span className="material-symbols-outlined">chevron_right</span>
                </button>
              </div>
            </div>
          </section>
        </div>
      </main>

      {isModalOpen && (
        <RoleAssignmentModal
          currentRoleInfo={currentRoleInfo}
          isRoleLoading={isCurrentRoleLoading}
          isUserLoading={isUserLoading}
          roleError={assignmentError}
          roles={roles}
          selectedUserId={selectedUserId}
          targetRole={targetRole}
          userError={userError}
          users={modalUsers}
          onClose={closeModal}
          onSearch={(event) => setModalKeyword(event.target.value)}
          onSelectRole={setTargetRole}
          onSelectUser={loadCurrentRole}
          onSubmit={reviewAssignment}
        />
      )}

      {pendingAssignment && (
        <ConfirmRoleDialog
          currentRole={pendingAssignment.currentRole}
          error={assignmentError}
          isWorking={isAssigning}
          targetRole={pendingAssignment.targetRole}
          user={pendingAssignment.user}
          onCancel={() => {
            if (!isAssigning) {
              setPendingAssignment(null);
              setAssignmentError('');
            }
          }}
          onConfirm={confirmAssignment}
        />
      )}
    </div>
  );
}
