import { FormEvent, useState } from 'react';
import { LockKeyhole } from 'lucide-react';

import { messages } from '../i18n/messages';

type AuthGateProps = {
  passwordHash: string;
  onUnlock: () => void;
};

async function sha256Hex(value: string): Promise<string> {
  const hash = await globalThis.crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(value),
  );

  return Array.from(new Uint8Array(hash))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

export function AuthGate({ passwordHash, onUnlock }: AuthGateProps) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isChecking, setIsChecking] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!passwordHash) {
      setError(messages.auth.errors.notConfigured);
      return;
    }

    setIsChecking(true);
    setError(null);

    try {
      if (!globalThis.crypto?.subtle?.digest) {
        setError(messages.auth.errors.unsupported);
        return;
      }

      let enteredHash: string;

      try {
        enteredHash = await sha256Hex(password);
      } catch {
        setError(messages.auth.errors.failed);
        return;
      }

      if (enteredHash === passwordHash) {
        try {
          sessionStorage.setItem('orgchart-builder.unlocked', 'true');
        } catch {
          // Pokračujeme s in-memory odemčením, pokud úložiště prohlížeče není k dispozici.
        }
        onUnlock();
        return;
      }

      setError(messages.auth.errors.mismatch);
    } finally {
      setIsChecking(false);
    }
  }

  return (
    <main className="auth-shell">
      <section className="auth-panel" aria-labelledby="auth-title">
        <div className="auth-icon" aria-hidden="true">
          <LockKeyhole size={22} strokeWidth={2.2} />
        </div>
        <div className="auth-copy">
          <p className="eyebrow">{messages.auth.eyebrow}</p>
          <h1 id="auth-title">{messages.auth.heading}</h1>
          <p>{messages.auth.description}</p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <label htmlFor="temporary-password">{messages.auth.passwordLabel}</label>
          <input
            autoComplete="current-password"
            id="temporary-password"
            name="temporary-password"
            onChange={(event) => setPassword(event.target.value)}
            type="password"
            value={password}
          />
          {error ? (
            <p className="auth-error" role="alert">
              {error}
            </p>
          ) : null}
          <button disabled={isChecking} type="submit">
            {isChecking ? messages.auth.submitting : messages.auth.submit}
          </button>
        </form>
      </section>
    </main>
  );
}
