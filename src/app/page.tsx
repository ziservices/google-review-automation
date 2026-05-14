import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto flex max-w-3xl flex-col items-center px-6 py-24 text-center">
        <p className="mb-3 rounded-full bg-slate-200 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-700">
          Google Review Automation
        </p>
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          Review funnel is live
        </h1>
        <p className="mt-4 max-w-xl text-base text-slate-600 sm:text-lg">
          Use your business review link to collect ratings, route happy users to
          Google, and capture private feedback for low ratings.
        </p>

        <div className="mt-10 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/admin"
            className="rounded-xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-700"
          >
            Open Admin Dashboard
          </Link>
          <Link
            href="/review/test-business"
            className="rounded-xl border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-800 transition hover:bg-slate-100"
          >
            Open Review Flow (Test)
          </Link>
        </div>
      </div>
    </main>
  );
}
