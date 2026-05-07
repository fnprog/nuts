export function DefaultPending() {
  return (
    <div className="flex min-h-[220px] items-center justify-center bg-white dark:bg-zinc-900" role="status" aria-live="polite">
      <div className="flex flex-col items-center space-y-2 text-center">
        <svg className="text-primary mb-1 h-7 w-7 animate-spin opacity-90" fill="none" viewBox="0 0 24 24" role="img" aria-label="Loading">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
        </svg>
        <span className="mt-0.5 text-sm font-medium text-zinc-700 dark:text-zinc-200">Loading, one moment…</span>
        <span className="text-xs text-zinc-400">Preparing your data securely</span>
      </div>
    </div>
  );
}
