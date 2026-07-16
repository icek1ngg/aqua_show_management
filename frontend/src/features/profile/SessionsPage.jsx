import { useCallback, useEffect, useState } from 'react';

import { getSessions, revokeAllOtherSessions, revokeSession } from '../../services/sessionService';

function getDevicePresentation(userAgent) {
  const normalizedAgent = userAgent?.toLowerCase() || '';

  if (normalizedAgent.includes('mobile')) {
    return { icon: 'smartphone', label: 'Mobile Device' };
  }
  if (normalizedAgent.includes('mac')) {
    return { icon: 'laptop_mac', label: 'Mac Device' };
  }
  if (normalizedAgent.includes('windows')) {
    return { icon: 'desktop_windows', label: 'Desktop Device' };
  }
  return { icon: 'computer', label: userAgent ? 'Desktop Device' : 'Unknown Device' };
}

function SessionDevice({ session, revoking, onRevoke }) {
  const device = getDevicePresentation(session.device);

  return (
    <article
      className={`flex items-center justify-between gap-3 rounded-2xl border p-3 transition sm:p-4 ${
        session.isCurrent
          ? 'border-cyan-200 bg-cyan-50/80'
          : 'border-slate-200 hover:border-cyan-200 hover:bg-cyan-50/40'
      }`}
    >
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-cyan-100 bg-white text-cyan-700 shadow-sm">
          <span className="material-symbols-outlined text-xl">{device.icon}</span>
        </div>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h4 className="truncate text-sm font-black text-slate-900">{device.label}</h4>
            {session.isCurrent ? (
              <span className="rounded-md bg-emerald-100 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider text-emerald-700">
                This device
              </span>
            ) : null}
          </div>
          <p className="mt-1 text-xs text-slate-500">
            {session.isCurrent ? 'Active now' : `Last active: ${new Date(session.lastSeenAt).toLocaleString()}`}
          </p>
        </div>
      </div>

      {!session.isCurrent ? (
        <button
          className="shrink-0 rounded-full px-2 py-1 text-xs font-bold text-rose-600 transition hover:bg-rose-50 hover:text-rose-700 disabled:cursor-not-allowed disabled:opacity-50"
          type="button"
          disabled={revoking === session.id}
          onClick={() => onRevoke(session.id)}
        >
          {revoking === session.id ? 'Signing out...' : 'Sign out'}
        </button>
      ) : null}
    </article>
  );
}

export default function ActiveSessionsPanel() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [revoking, setRevoking] = useState(null);
  const [message, setMessage] = useState({ type: '', text: '' });

  const fetchSessions = useCallback(async () => {
    try {
      const response = await getSessions();
      setSessions(response.data);
    } catch {
      setMessage({ type: 'error', text: 'Failed to load sessions' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  const handleRevoke = async (id) => {
    try {
      setRevoking(id);
      setMessage({ type: '', text: '' });
      await revokeSession(id);
      setMessage({ type: 'success', text: 'Session revoked successfully' });
      await fetchSessions();
    } catch {
      setMessage({ type: 'error', text: 'Failed to revoke session' });
    } finally {
      setRevoking(null);
    }
  };

  const handleRevokeAll = async () => {
    if (!window.confirm('Are you sure you want to sign out from all other devices?')) {
      return;
    }

    try {
      setRevoking('all');
      setMessage({ type: '', text: '' });
      await revokeAllOtherSessions();
      setMessage({ type: 'success', text: 'Successfully signed out from other devices' });
      await fetchSessions();
    } catch {
      setMessage({ type: 'error', text: 'Failed to sign out from other devices' });
    } finally {
      setRevoking(null);
    }
  };

  return (
    <section className="rounded-[2rem] border border-cyan-100 bg-white p-5 shadow-[0_12px_40px_rgba(8,145,178,0.08)] sm:p-6">
      <div className="mb-5">
        <h2 className="text-lg font-black text-slate-950">Active Sessions</h2>
        <p className="mt-1 text-sm leading-6 text-slate-500">Manage your active sessions and devices.</p>
      </div>

      {message.text ? (
        <div
          className={`mb-4 rounded-xl px-3 py-2 text-sm font-semibold ${
            message.type === 'error' ? 'bg-rose-50 text-rose-700' : 'bg-emerald-50 text-emerald-700'
          }`}
          role="alert"
        >
          {message.text}
        </div>
      ) : null}

      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 className="text-sm font-bold text-slate-800">Your Devices</h3>
        <button
          className="rounded-full px-2 py-1 text-xs font-bold text-rose-600 transition hover:bg-rose-50 hover:text-rose-700 disabled:cursor-not-allowed disabled:opacity-40"
          type="button"
          disabled={loading || revoking === 'all' || sessions.length <= 1}
          onClick={handleRevokeAll}
        >
          {revoking === 'all' ? 'Signing out...' : 'Sign out all'}
        </button>
      </div>

      {loading ? (
        <div className="flex min-h-32 items-center justify-center" role="status" aria-label="Loading active sessions">
          <span className="material-symbols-outlined animate-spin text-3xl text-cyan-700">progress_activity</span>
        </div>
      ) : sessions.length > 0 ? (
        <div className="space-y-3">
          {sessions.map((session) => (
            <SessionDevice key={session.id} session={session} revoking={revoking} onRevoke={handleRevoke} />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-cyan-200 bg-cyan-50/50 px-4 py-6 text-center text-sm text-slate-500">
          No active sessions found.
        </div>
      )}
    </section>
  );
}
