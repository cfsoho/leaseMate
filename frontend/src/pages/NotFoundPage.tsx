import { Link } from "react-router-dom";

export function NotFoundPage() {
  return (
    <main className="grid min-h-screen place-items-center p-6">
      <section className="grid w-full max-w-[420px] gap-[18px] rounded-lg border border-slate-200 bg-white p-6">
        <p className="mb-1.5 text-xs font-bold uppercase tracking-wide text-slate-500">
          404
        </p>
        <h1 className="text-3xl font-bold leading-tight text-slate-950">
          Page not found
        </h1>
        <Link
          className="inline-flex min-h-8 items-center justify-center gap-1.5 rounded-md border border-slate-300 bg-white px-2.5 text-sm font-semibold text-slate-800 hover:bg-slate-50"
          to="/dashboard"
        >
          Back to dashboard
        </Link>
      </section>
    </main>
  );
}
