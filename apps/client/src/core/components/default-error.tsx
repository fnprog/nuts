import { ErrorComponentProps } from "@tanstack/react-router";

export function DefaultError({ error, reset: _reset }: ErrorComponentProps) {
  <div
    className="mx-auto max-w-md rounded-lg border border-zinc-200 bg-white p-8 text-center shadow-xl dark:border-zinc-800 dark:bg-zinc-900"
    role="alert"
    aria-live="assertive"
  >
    <svg
      aria-hidden="true"
      className="mx-auto mb-3 h-10 w-10 text-red-500 dark:text-red-400"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={2}
      stroke="currentColor"
    >
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 9l-6 6m0-6l6 6" />
    </svg>
    <h2 className="mb-2 text-xl font-bold text-red-700 dark:text-red-300">Oops! Something went wrong</h2>
    <p className="mb-4 text-sm text-zinc-700 dark:text-zinc-300">
      {error instanceof Error ? error.message : "Sorry, an unexpected error occurred. Please try again."}
    </p>
    <button
      onClick={() => window.location.reload()}
      className="mt-2 rounded-md bg-red-100 px-4 py-2 font-medium text-red-700 shadow-sm transition-colors hover:bg-red-200 dark:bg-red-950 dark:text-red-300 dark:hover:bg-red-800"
    >
      Reload Page
    </button>
    <p className="mt-2 text-xs text-zinc-400">If the error persists, please contact support.</p>
  </div>;
}
