import type { HealthResponse } from '@store-rating/shared';
import { useQuery } from '@tanstack/react-query';
import { API_BASE_URL } from '@/lib/config';

async function fetchHealth(): Promise<HealthResponse> {
  const response = await fetch(`${API_BASE_URL}/health`);
  if (!response.ok) {
    throw new Error('Health check failed');
  }
  return response.json() as Promise<HealthResponse>;
}

export function App() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['health'],
    queryFn: fetchHealth,
  });

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4">
      <main className="w-full max-w-lg rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-900">Store Rating Platform</h1>
        <p className="mt-2 text-sm text-slate-600">
          Monorepo bootstrap complete. Authentication and business features arrive in later
          milestones.
        </p>

        <section className="mt-6 rounded-lg bg-slate-100 p-4">
          <h2 className="text-sm font-medium text-slate-700">API Health</h2>
          {isLoading && <p className="mt-2 text-sm text-slate-500">Checking...</p>}
          {isError && (
            <p className="mt-2 text-sm text-red-600">
              Unable to reach the API. Start the server with{' '}
              <code className="rounded bg-slate-200 px-1">npm run dev:server</code>.
            </p>
          )}
          {data && (
            <dl className="mt-2 space-y-1 text-sm text-slate-600">
              <div className="flex gap-2">
                <dt className="font-medium">Status:</dt>
                <dd>{data.status}</dd>
              </div>
              <div className="flex gap-2">
                <dt className="font-medium">Timestamp:</dt>
                <dd>{data.timestamp}</dd>
              </div>
            </dl>
          )}
        </section>
      </main>
    </div>
  );
}
