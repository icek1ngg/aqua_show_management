import React, { useState, useEffect } from 'react';
import { getSessions, revokeSession, revokeAllOtherSessions } from '../../services/sessionService';
import { Laptop, Smartphone, AlertCircle, Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function SessionsPage() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [revoking, setRevoking] = useState(null);

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      const response = await getSessions();
      setSessions(response.data);
    } catch (error) {
      toast.error('Failed to load sessions');
    } finally {
      setLoading(false);
    }
  };

  const handleRevoke = async (id) => {
    try {
      setRevoking(id);
      await revokeSession(id);
      toast.success('Session revoked successfully');
      fetchSessions();
    } catch (error) {
      toast.error('Failed to revoke session');
    } finally {
      setRevoking(null);
    }
  };

  const handleRevokeAll = async () => {
    if (!window.confirm('Are you sure you want to sign out from all other devices?')) return;
    try {
      setRevoking('all');
      await revokeAllOtherSessions();
      toast.success('Successfully signed out from other devices');
      fetchSessions();
    } catch (error) {
      toast.error('Failed to sign out from other devices');
    } finally {
      setRevoking(null);
    }
  };

  const formatDevice = (userAgent) => {
    if (!userAgent) return 'Unknown Device';
    if (userAgent.includes('Mobile')) return 'Mobile Device';
    return 'Desktop Device';
  };

  const DeviceIcon = ({ userAgent }) => {
    if (!userAgent) return <Laptop className="w-6 h-6 text-gray-500" />;
    if (userAgent.includes('Mobile')) return <Smartphone className="w-6 h-6 text-blue-500" />;
    return <Laptop className="w-6 h-6 text-blue-500" />;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Active Sessions</h1>
        <p className="text-gray-600 mt-2">
          Manage your active sessions and devices. You can sign out of unrecognized devices.
        </p>
      </div>

      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-medium text-gray-900">Your Devices</h2>
          <button
            onClick={handleRevokeAll}
            disabled={revoking === 'all' || sessions.length <= 1}
            className="px-4 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-md disabled:opacity-50"
          >
            {revoking === 'all' ? 'Signing out...' : 'Sign out all other devices'}
          </button>
        </div>

        <div className="space-y-4">
          {sessions.map((session) => (
            <div
              key={session.id}
              className={`flex items-center justify-between p-4 rounded-lg border ${
                session.isCurrent ? 'border-blue-200 bg-blue-50' : 'border-gray-200'
              }`}
            >
              <div className="flex items-center space-x-4">
                <div className="p-2 bg-white rounded-full shadow-sm">
                  <DeviceIcon userAgent={session.device} />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-medium text-gray-900">
                      {formatDevice(session.device)}
                    </span>
                    {session.isCurrent && (
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        This device
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-gray-500 mt-1">
                    <p>Last active: {new Date(session.lastSeenAt).toLocaleString()}</p>
                    <p>Started: {new Date(session.createdAt).toLocaleString()}</p>
                  </div>
                </div>
              </div>
              
              {!session.isCurrent && (
                <button
                  onClick={() => handleRevoke(session.id)}
                  disabled={revoking === session.id}
                  className="px-3 py-1.5 text-sm text-red-600 hover:text-red-700 font-medium disabled:opacity-50"
                >
                  {revoking === session.id ? 'Signing out...' : 'Sign out'}
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
