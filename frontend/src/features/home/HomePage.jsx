import { Link } from 'react-router-dom';

export default function HomePage() {
  return (
    <section className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
      <div>
        <h1 className="max-w-3xl text-4xl font-bold tracking-tight text-slate-950 sm:text-5xl">
          AquaShow Management System
        </h1>
        <p className="mt-5 max-w-2xl text-base leading-7 text-slate-600">
          Frontend foundation for show browsing, booking, ticketing, staff validation,
          management workflows, and reports.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            to="/health"
            className="rounded-md bg-cyan-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-cyan-800"
          >
            Check backend health
          </Link>
        </div>
      </div>

      <div className="rounded-lg border border-cyan-100 bg-white p-6 shadow-sm">
        <h2 className="text-base font-semibold text-slate-900">Base setup</h2>
        <dl className="mt-5 grid gap-4 text-sm">
          <div className="flex items-center justify-between gap-4 border-b border-slate-100 pb-3">
            <dt className="text-slate-500">Framework</dt>
            <dd className="font-medium text-slate-900">React + Vite</dd>
          </div>
          <div className="flex items-center justify-between gap-4 border-b border-slate-100 pb-3">
            <dt className="text-slate-500">Styling</dt>
            <dd className="font-medium text-slate-900">Tailwind CSS</dd>
          </div>
          <div className="flex items-center justify-between gap-4">
            <dt className="text-slate-500">API layer</dt>
            <dd className="font-medium text-slate-900">axios service client</dd>
          </div>
        </dl>
      </div>
    </section>
  );
}
