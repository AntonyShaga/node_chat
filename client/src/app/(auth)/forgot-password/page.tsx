'use client';

import Link from 'next/link';
import { type FormEvent, useState } from 'react';

export default function ForgotPasswordPage() {
  const [identifier, setIdentifier] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const normalizedIdentifier = identifier.trim();

    if (!normalizedIdentifier) {
      return;
    }

    console.log('Future POST /auth/password/forgot payload:', {
      identifier: normalizedIdentifier,
    });

    setIsSubmitted(true);
  }

  return (
    <section className="w-full max-w-md rounded-2xl border bg-card px-6 py-8 text-card-foreground shadow-lg sm:px-8">
      <div className="mt-6 text-center">
        <h1 className="text-2xl font-semibold">Forgot your password?</h1>

        <p className="mt-2 text-muted-foreground">
          Enter your email or phone number and we&apos;ll send you reset
          instructions.
        </p>
      </div>

      {isSubmitted ? (
        <div className="mt-8">
          <div className="rounded-xl bg-primary/10 px-4 py-4 text-sm text-primary">
            If an account exists for this email or phone number, reset
            instructions will be sent shortly.
          </div>

          <Link
            className="mt-6 flex w-full items-center justify-center rounded-xl border px-4 py-3 font-medium transition hover:bg-muted"
            href="/sign-in"
          >
            Back to sign in
          </Link>
        </div>
      ) : (
        <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
          <label className="block">
            <span className="mb-2 block font-medium">
              Email or phone number
            </span>

            <input
              autoComplete="username"
              autoFocus
              className="w-full rounded-xl border bg-background px-4 py-3 outline-none transition focus:ring-2 focus:ring-ring/30"
              onChange={(event) => setIdentifier(event.target.value)}
              placeholder="you@company.com or +15065551234"
              required
              value={identifier}
            />
          </label>

          <button
            className="w-full rounded-xl bg-primary px-4 py-3 font-medium text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={!identifier.trim()}
            type="submit"
          >
            Send reset instructions
          </button>

          <Link
            className="flex items-center justify-center gap-2 text-sm font-medium text-muted-foreground transition hover:text-foreground"
            href="/sign-in"
          >
            <span aria-hidden="true">←</span>
            Back to sign in
          </Link>
        </form>
      )}
    </section>
  );
}
