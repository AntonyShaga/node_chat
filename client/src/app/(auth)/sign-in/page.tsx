'use client';

import Link from 'next/link';
import { type FormEvent, useState } from 'react';

export default function SignInPage() {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!identifier.trim() || !password) {
      setMessage('Enter your email or phone number and password');

      return;
    }

    setMessage(
      'Sign-in will be connected after the authentication service is ready.',
    );
  }

  return (
    <section className="w-full max-w-md rounded-2xl border bg-card px-6 py-8 text-card-foreground shadow-lg sm:px-8">
      <div className="mt-6 text-center">
        <h1 className="text-2xl font-semibold">Welcome back</h1>

        <p className="mt-2 text-muted-foreground">
          Sign in to continue to your workspace.
        </p>
      </div>

      <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
        <label className="block">
          <span className="mb-2 block font-medium">Email or phone number</span>

          <input
            autoComplete="username"
            autoFocus
            className="w-full rounded-xl border bg-background px-4 py-3 outline-none transition focus:ring-2 focus:ring-ring/30"
            onChange={(event) => {
              setIdentifier(event.target.value);
              setMessage(null);
            }}
            placeholder="you@company.com or +15065551234"
            required
            value={identifier}
          />
        </label>

        <label className="block">
          <span className="mb-2 block font-medium">Password</span>

          <input
            autoComplete="current-password"
            className="w-full rounded-xl border bg-background px-4 py-3 outline-none transition focus:ring-2 focus:ring-ring/30"
            minLength={8}
            onChange={(event) => {
              setPassword(event.target.value);
              setMessage(null);
            }}
            placeholder="Enter your password"
            required
            type="password"
            value={password}
          />
        </label>

        <div className="flex items-center justify-between gap-4 text-sm">
          <label className="flex items-center gap-2 text-muted-foreground">
            <input
              checked={rememberMe}
              className="size-4 accent-primary"
              onChange={(event) => setRememberMe(event.target.checked)}
              type="checkbox"
            />
            Remember me
          </label>

          <Link
            className="font-medium text-primary transition hover:opacity-70"
            href="/forgot-password"
          >
            Forgot password?
          </Link>
        </div>

        {message && (
          <p className="rounded-xl bg-muted px-4 py-3 text-sm text-muted-foreground">
            {message}
          </p>
        )}

        <button
          className="w-full rounded-xl bg-primary px-4 py-3 font-medium text-primary-foreground transition hover:opacity-90"
          type="submit"
        >
          Sign in
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        New to node chat?{' '}
        <Link
          className="font-medium text-primary transition hover:opacity-70"
          href="/sign-up"
        >
          Create an account
        </Link>
      </p>
    </section>
  );
}
