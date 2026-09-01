'use client';

import Link from 'next/link';
import { type FormEvent, type ReactNode, useMemo, useState } from 'react';

type IdentifierType = 'email' | 'phone';

type PasswordRequirementProps = {
  valid: boolean;
  children: ReactNode;
};

function PasswordRequirement({ valid, children }: PasswordRequirementProps) {
  return (
    <li
      className={
        valid
          ? 'flex items-center gap-1.5 text-primary'
          : 'flex items-center gap-1.5 text-muted-foreground'
      }
    >
      <span
        aria-hidden="true"
        className="flex size-4 shrink-0 items-center justify-center"
      >
        {valid ? '✓' : '○'}
      </span>

      <span>{children}</span>
    </li>
  );
}

export default function SignUpPage() {
  const [displayName, setDisplayName] = useState('');
  const [identifierType, setIdentifierType] = useState<IdentifierType>('email');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [confirmedPassword, setConfirmedPassword] = useState('');
  const [message, setMessage] = useState<string | null>(null);

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

  const canSubmit =
    displayName.trim().length >= 2 &&
    identifier.trim().length > 0 &&
    meetsRequirements &&
    passwordsMatch;

  function selectIdentifierType(type: IdentifierType) {
    setIdentifierType(type);
    setIdentifier('');
    setMessage(null);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!canSubmit) {
      return;
    }

    const normalizedIdentifier =
      identifierType === 'email'
        ? identifier.trim().toLowerCase()
        : identifier.trim().replace(/[\s()-]/g, '');

    const payload =
      identifierType === 'email'
        ? {
            displayName: displayName.trim(),
            email: normalizedIdentifier,
            password,
          }
        : {
            displayName: displayName.trim(),
            phone: normalizedIdentifier,
            password,
          };

    console.log('Future POST /auth/register payload:', payload);

    setMessage(
      'Account creation will be connected after the authentication service is ready.',
    );
  }

  return (
    <section className="w-full max-w-md rounded-2xl border bg-card px-6 py-6 text-card-foreground shadow-lg">
      <div className="text-center">
        <h1 className="text-xl font-semibold">Create your account</h1>

        <p className="mt-1.5 text-sm text-muted-foreground">
          A calm place for focused conversation.
        </p>
      </div>

      <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium">Name</span>

          <input
            autoComplete="name"
            autoFocus
            className="w-full rounded-xl border bg-background px-4 py-2.5 text-sm outline-none transition focus:ring-2 focus:ring-ring/30"
            maxLength={50}
            minLength={2}
            onChange={(event) => {
              setDisplayName(event.target.value);
              setMessage(null);
            }}
            placeholder="Alex Morgan"
            required
            value={displayName}
          />
        </label>

        <div>
          <span className="mb-1.5 block text-sm font-medium">
            Create account with
          </span>

          <div className="grid grid-cols-2 rounded-xl bg-muted p-1">
            <button
              className={`rounded-lg px-4 py-1.5 text-sm transition ${
                identifierType === 'email'
                  ? 'bg-card font-medium text-primary shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              onClick={() => selectIdentifierType('email')}
              type="button"
            >
              Email
            </button>

            <button
              className={`rounded-lg px-4 py-1.5 text-sm transition ${
                identifierType === 'phone'
                  ? 'bg-card font-medium text-primary shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              onClick={() => selectIdentifierType('phone')}
              type="button"
            >
              Phone
            </button>
          </div>
        </div>

        <label className="block">
          <span className="mb-1.5 block text-sm font-medium">
            {identifierType === 'email' ? 'Email' : 'Phone number'}
          </span>

          <input
            autoComplete={identifierType === 'email' ? 'email' : 'tel'}
            className="w-full rounded-xl border bg-background px-4 py-2.5 text-sm outline-none transition focus:ring-2 focus:ring-ring/30"
            inputMode={identifierType === 'email' ? 'email' : 'tel'}
            onChange={(event) => {
              setIdentifier(event.target.value);
              setMessage(null);
            }}
            pattern={
              identifierType === 'phone'
                ? String.raw`\+[1-9][0-9]{7,14}`
                : undefined
            }
            placeholder={
              identifierType === 'email' ? 'you@company.com' : '+15065551234'
            }
            required
            type={identifierType === 'email' ? 'email' : 'tel'}
            value={identifier}
          />
        </label>

        <label className="block">
          <span className="mb-1.5 block text-sm font-medium">Password</span>

          <input
            autoComplete="new-password"
            className="w-full rounded-xl border bg-background px-4 py-2.5 text-sm outline-none transition focus:ring-2 focus:ring-ring/30"
            onChange={(event) => {
              setPassword(event.target.value);
              setMessage(null);
            }}
            placeholder="Create a password"
            required
            type="password"
            value={password}
          />
        </label>

        <section className="rounded-xl bg-muted/60 p-3">
          <h2 className="text-xs font-medium">Password must include:</h2>

          <ul className="mt-2 grid gap-x-4 gap-y-1 text-xs sm:grid-cols-2">
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
          <span className="mb-1.5 block text-sm font-medium">
            Confirm password
          </span>

          <input
            aria-invalid={confirmedPassword.length > 0 && !passwordsMatch}
            autoComplete="new-password"
            className="w-full rounded-xl border bg-background px-4 py-2.5 text-sm outline-none transition focus:ring-2 focus:ring-ring/30 aria-invalid:border-destructive aria-invalid:ring-destructive/20"
            onChange={(event) => {
              setConfirmedPassword(event.target.value);
              setMessage(null);
            }}
            placeholder="Repeat your password"
            required
            type="password"
            value={confirmedPassword}
          />

          {confirmedPassword.length > 0 && !passwordsMatch && (
            <p className="mt-1.5 text-xs text-destructive">
              Passwords do not match.
            </p>
          )}
        </label>

        {message && (
          <p className="rounded-xl bg-muted px-3 py-2.5 text-xs text-muted-foreground">
            {message}
          </p>
        )}

        <button
          className="w-full rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          disabled={!canSubmit}
          type="submit"
        >
          Create account
        </button>
      </form>

      <p className="mt-4 text-center text-sm text-muted-foreground">
        Already have an account?{' '}
        <Link
          className="font-medium text-primary transition hover:opacity-70"
          href="/sign-in"
        >
          Sign in
        </Link>
      </p>
    </section>
  );
}
