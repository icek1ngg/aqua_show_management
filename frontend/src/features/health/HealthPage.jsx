import { useEffect, useState } from 'react';

import { getBackendHealth } from '../../services/healthApi.js';

const initialState = {
  loading: true,
  response: null,
  error: '',
};

export default function HealthPage() {
  const [{ loading, response, error }, setHealthState] = useState(initialState);

  useEffect(() => {
    let ignore = false;

    async function loadHealth() {
      try {
        const data = await getBackendHealth();

        if (!ignore) {
          setHealthState({ loading: false, response: data, error: '' });
        }
      } catch (requestError) {
        if (!ignore) {
          setHealthState({
            loading: false,
            response: null,
            error:
              requestError.response?.data?.message ||
              requestError.message ||
              'Unable to reach backend health endpoint',
          });
        }
      }
    }

    loadHealth();

    return () => {
      ignore = true;
    };
  }, []);

  return (
    <section className="max-w-3xl">
      <h1 className="text-3xl font-bold tracking-tight text-slate-950">Backend health</h1>
      <p className="mt-3 text-base leading-7 text-slate-600">
        This page calls the ASMS backend through the centralized axios client.
      </p>

      <div className="mt-8 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        {loading && <p className="text-sm font-medium text-slate-600">Checking backend...</p>}

        {!loading && response && (
          <div>
            <p className="text-sm font-semibold text-emerald-700">Backend is reachable</p>
            <pre className="mt-4 overflow-auto rounded-md bg-slate-950 p-4 text-sm text-slate-50">
              {JSON.stringify(response, null, 2)}
            </pre>
          </div>
        )}

        {!loading && error && (
          <div>
            <p className="text-sm font-semibold text-red-700">Backend health check failed</p>
            <p className="mt-2 text-sm text-slate-600">{error}</p>
          </div>
        )}
      </div>
    </section>
  );
}
