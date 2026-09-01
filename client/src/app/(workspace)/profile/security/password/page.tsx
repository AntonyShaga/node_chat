'use client';

import Link from 'next/link';
import { type FormEvent, useMemo, useState } from 'react';
import { ArrowLeftIcon } from '@/components/icons';

type PasswordRequirementProps = {
  valid: boolean;
  children: React.ReactNode;
};

function PasswordRequirement({ valid, children }: PasswordRequirementProps) {
  return (
    <li
      className={
        valid
          ? 'flex items-center gap-2 text-primary'
          : 'flex items-center gap-2 text-muted-foreground'
      }
    >
      <span
        aria-hidden="true"
        className="flex size-5 items-center justify-center"
      >
        {valid ? '✓' : '○'}
      </span>

      <span>{children}</span>
    </li>
  );
}

export default function ChangePasswordPage() {
  const [password, setPassword] = useState('');
  const [confirmedPassword, setConfirmedPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const requirements = useMemo(
    () => ({
      minimumLength: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      number: /\d/.test(password),
      symbol: /[^A-Za-z0-9]/.test(password),
    }),
    [password],
  );

  const meetsRequirements = Object.values(requirements).every(Boolean);

  const passwordsMatch =
    confirmedPassword.length > 0 && password === confirmedPassword;

  const canSubmit = meetsRequirements && passwordsMatch;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!canSubmit) {
      return;
    }

    setSubmitted(true);
  }

  return (
    <>
      <header className="flex min-h-16 items-center gap-3 border-b px-6 sm:px-8">
        <Link
          aria-label="Back to security settings"
          className="flex size-9 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-foreground"
          href="/profile/security"
        >
          <ArrowLeftIcon />
        </Link>

        <h1 className="text-lg font-semibold">Change password</h1>
      </header>

      <section className="flex flex-1 overflow-y-auto px-6 py-8 sm:px-8">
        <div className="mx-auto w-full max-w-xl">
          <div className="rounded-2xl border bg-card px-6 py-8 text-card-foreground shadow-sm sm:px-8">
            <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <svg
                aria-hidden="true"
                className="size-7"
                fill="none"
                viewBox="0 0 24 24"
              >
                <path
                  d="M12 3 5 6v5c0 4.6 2.9 8.6 7 10 4.1-1.4 7-5.4 7-10V6l-7-3Z"
                  stroke="currentColor"
                  strokeLinejoin="round"
                  strokeWidth="1.75"
                />

                <path
                  d="m9.5 12 1.7 1.7 3.6-3.9"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="1.75"
                />
              </svg>
            </div>

            <div className="mt-6 text-center">
              <h2 className="text-2xl font-semibold">Set a new password</h2>

              <p className="mt-2 text-muted-foreground">
                Choose a strong password for your account.
              </p>
            </div>

            <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
              <label className="block">
                <span className="mb-2 block font-medium">New password</span>

                <div className="relative">
                  <input
                    autoComplete="new-password"
                    className="w-full rounded-xl border bg-background px-4 py-3 pr-14 outline-none transition focus:ring-2 focus:ring-ring/30"
                    onChange={(event) => {
                      setPassword(event.target.value);
                      setSubmitted(false);
                    }}
                    placeholder="Choose a password"
                    required
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                  />

                  <button
                    aria-label={
                      showPassword ? 'Hide password' : 'Show password'
                    }
                    className="absolute top-1/2 right-2 flex size-10 -translate-y-1/2 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-foreground"
                    onClick={() =>
                      setShowPassword((currentValue) => !currentValue)
                    }
                    type="button"
                  >
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
              </label>

              <section className="rounded-xl bg-muted/60 p-4">
                <h3 className="text-sm font-medium">Password must include:</h3>

                <ul className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
                  <PasswordRequirement valid={requirements.minimumLength}>
                    8+ characters
                  </PasswordRequirement>

                  <PasswordRequirement valid={requirements.number}>
                    One number
                  </PasswordRequirement>

                  <PasswordRequirement valid={requirements.uppercase}>
                    One uppercase
                  </PasswordRequirement>

                  <PasswordRequirement valid={requirements.symbol}>
                    One symbol
                  </PasswordRequirement>
                </ul>
              </section>

              <label className="block">
                <span className="mb-2 block font-medium">
                  Confirm new password
                </span>

                <input
                  aria-invalid={confirmedPassword.length > 0 && !passwordsMatch}
                  autoComplete="new-password"
                  className="w-full rounded-xl border bg-background px-4 py-3 outline-none transition focus:ring-2 focus:ring-ring/30 aria-invalid:border-destructive aria-invalid:ring-destructive/20"
                  onChange={(event) => {
                    setConfirmedPassword(event.target.value);
                    setSubmitted(false);
                  }}
                  placeholder="Repeat your password"
                  required
                  type={showPassword ? 'text' : 'password'}
                  value={confirmedPassword}
                />

                {confirmedPassword.length > 0 && !passwordsMatch && (
                  <p className="mt-2 text-sm text-destructive">
                    Passwords do not match.
                  </p>
                )}
              </label>

              {submitted && (
                <p className="rounded-xl bg-muted px-4 py-3 text-sm text-muted-foreground">
                  Password updating will be connected with the authentication
                  service later.
                </p>
              )}

              <button
                className="w-full rounded-xl bg-primary px-4 py-3 font-medium text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={!canSubmit}
                type="submit"
              >
                Update password
              </button>
            </form>
          </div>
        </div>
      </section>
    </>
  );
}
