import { FormEvent, useState } from 'react';
import { ArrowRight } from 'lucide-react';

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
      <form className="auth-form-minimal" onSubmit={handleSubmit}>
        <label htmlFor="temporary-password" className="auth-form-minimal-label">
          {messages.auth.passwordLabel}
        </label>
        <div className="auth-form-minimal-row">
          <input
            autoComplete="current-password"
            id="temporary-password"
            name="temporary-password"
            autoFocus
            onChange={(event) => setPassword(event.target.value)}
            type="password"
            value={password}
          />
          <button
            type="submit"
            disabled={isChecking}
            aria-label={messages.auth.submit}
            title={messages.auth.submit}
          >
            <ArrowRight aria-hidden="true" size={18} strokeWidth={2.4} />
          </button>
        </div>
        {error ? (
          <p className="auth-error" role="alert">
            {error}
          </p>
        ) : null}
      </form>
    </main>
  );
}
