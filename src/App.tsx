import { useState } from 'react';

import { AuthGate } from './components/AuthGate';

type ViteImportMeta = ImportMeta & {
  env?: {
    VITE_APP_PASSWORD_HASH?: string;
  };
};

function readStoredUnlockState(): boolean {
  try {
    return sessionStorage.getItem('orgchart-builder.unlocked') === 'true';
  } catch {
    return false;
  }
}

export function App() {
  const [isUnlocked, setIsUnlocked] = useState(readStoredUnlockState);
  const passwordHash =
    (import.meta as ViteImportMeta).env?.VITE_APP_PASSWORD_HASH ?? '';

  if (!isUnlocked) {
    return (
      <AuthGate
        passwordHash={passwordHash}
        onUnlock={() => setIsUnlocked(true)}
      />
    );
  }

  return (
    <main className="workspace">
      <section className="empty-workspace">
        <h1>Orgchart Builder</h1>
        <p>Editor workspace loads in the next task.</p>
      </section>
    </main>
  );
}
