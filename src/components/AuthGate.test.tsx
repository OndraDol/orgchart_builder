import { createHash } from 'node:crypto';

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { App } from '../App';
import { AuthGate } from './AuthGate';

const originalCrypto = globalThis.crypto;

async function sha256Hex(value: string): Promise<string> {
  if (globalThis.crypto?.subtle) {
    const hash = await globalThis.crypto.subtle.digest(
      'SHA-256',
      new TextEncoder().encode(value),
    );

    return Array.from(new Uint8Array(hash))
      .map((byte) => byte.toString(16).padStart(2, '0'))
      .join('');
  }

  return createHash('sha256').update(value).digest('hex');
}

describe('AuthGate', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    Object.defineProperty(globalThis, 'crypto', {
      configurable: true,
      value: originalCrypto,
    });
    sessionStorage.clear();
  });

  it('unlocks with the configured hash', async () => {
    const password = 'demo';
    const hashHex = await sha256Hex(password);
    const onUnlock = vi.fn();

    render(<AuthGate passwordHash={hashHex} onUnlock={onUnlock} />);

    await userEvent.type(screen.getByLabelText('Temporary password'), password);
    await userEvent.click(screen.getByRole('button', { name: 'Unlock editor' }));

    expect(onUnlock).toHaveBeenCalled();
  });

  it('shows an error and stays locked when the password is wrong', async () => {
    const passwordHash = await sha256Hex('demo');
    const onUnlock = vi.fn();

    render(<AuthGate passwordHash={passwordHash} onUnlock={onUnlock} />);

    await userEvent.type(screen.getByLabelText('Temporary password'), 'wrong');
    await userEvent.click(screen.getByRole('button', { name: 'Unlock editor' }));

    expect(await screen.findByText('Password does not match.')).toBeInTheDocument();
    expect(onUnlock).not.toHaveBeenCalled();
  });

  it('unlocks in memory when sessionStorage cannot be written', async () => {
    const password = 'demo';
    const hashHex = await sha256Hex(password);
    const onUnlock = vi.fn();
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('storage unavailable');
    });

    render(<AuthGate passwordHash={hashHex} onUnlock={onUnlock} />);

    await userEvent.type(screen.getByLabelText('Temporary password'), password);
    await userEvent.click(screen.getByRole('button', { name: 'Unlock editor' }));

    expect(onUnlock).toHaveBeenCalled();
  });

  it('shows an error when browser password hashing is unavailable', async () => {
    const onUnlock = vi.fn();

    Object.defineProperty(globalThis, 'crypto', {
      configurable: true,
      value: {},
    });

    render(<AuthGate passwordHash={await sha256Hex('demo')} onUnlock={onUnlock} />);

    await userEvent.type(screen.getByLabelText('Temporary password'), 'demo');
    await userEvent.click(screen.getByRole('button', { name: 'Unlock editor' }));

    expect(
      await screen.findByText('Password hashing is not available in this browser.'),
    ).toBeInTheDocument();
    expect(onUnlock).not.toHaveBeenCalled();
  });
});

describe('App', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    sessionStorage.clear();
  });

  it('starts locked when sessionStorage cannot be read', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('storage unavailable');
    });

    expect(() => render(<App />)).not.toThrow();
    expect(screen.getByLabelText('Temporary password')).toBeInTheDocument();
  });
});
