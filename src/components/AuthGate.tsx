import { FormEvent, useState } from 'react';
import { LockKeyhole } from 'lucide-react';

type AuthGateProps = {
  passwordHash: string;
  onUnlock: () => void;
};

async function sha256Hex(value: string): Promise<string> {
  const hash = await crypto.subtle.digest(
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
      setError('Password hash is not configured for this build.');
      return;
    }

    setIsChecking(true);
    setError(null);

    try {
      const enteredHash = await sha256Hex(password);

      if (enteredHash === passwordHash) {
        sessionStorage.setItem('orgchart-builder.unlocked', 'true');
        onUnlock();
        return;
      }

      setError('Password does not match.');
    } finally {
      setIsChecking(false);
    }
  }

  return (
    <main className="auth-shell">
      <section className="auth-panel" aria-labelledby="auth-title">
        <div className="auth-icon" aria-hidden="true">
          <LockKeyhole size={24} strokeWidth={2.2} />
        </div>
        <div className="auth-copy">
          <p className="eyebrow">Private workspace</p>
          <h1 id="auth-title">Orgchart Builder</h1>
          <p>
            Enter the temporary password to open the editor workspace. This is a
            temporary frontend gate for early access, not server-side
            authentication.
          </p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <label htmlFor="temporary-password">Temporary password</label>
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
            {isChecking ? 'Checking...' : 'Unlock editor'}
          </button>
        </form>
      </section>
    </main>
  );
}
