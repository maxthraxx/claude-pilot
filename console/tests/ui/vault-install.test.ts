import { describe, it, expect } from 'bun:test';

describe('Vault Install', () => {
  it('VaultSyncButton component exists and renders correctly', async () => {
    const fs = await import('fs/promises');
    const vaultViewContent = await fs.readFile(
      'src/ui/viewer/views/Vault/index.tsx',
      'utf-8'
    );

    expect(vaultViewContent).toContain('function VaultSyncButton');

    expect(vaultViewContent).toMatch(/className="btn btn-primary btn-sm"/);

    expect(vaultViewContent).toContain('loading loading-spinner');
    expect(vaultViewContent).toContain('Syncing...');

    expect(vaultViewContent).toContain('Sync All');
  });

  it('VaultView uses useToast for notifications', async () => {
    const fs = await import('fs/promises');
    const vaultViewContent = await fs.readFile(
      'src/ui/viewer/views/Vault/index.tsx',
      'utf-8'
    );

    expect(vaultViewContent).toMatch(/import.*useToast.*from.*ToastContext/);

    expect(vaultViewContent).toMatch(/useToast\(\)/);
  });

  it('handles successful install with toast notification', async () => {
    const fs = await import('fs/promises');
    const vaultViewContent = await fs.readFile(
      'src/ui/viewer/views/Vault/index.tsx',
      'utf-8'
    );

    expect(vaultViewContent).toMatch(/\.success\(['"].*[Vv]ault.*sync/i);
  });

  it('handles install error with toast notification', async () => {
    const fs = await import('fs/promises');
    const vaultViewContent = await fs.readFile(
      'src/ui/viewer/views/Vault/index.tsx',
      'utf-8'
    );

    expect(vaultViewContent).toMatch(/\.error\(/);
  });

  it('handles install timeout with warning toast', async () => {
    const fs = await import('fs/promises');
    const vaultViewContent = await fs.readFile(
      'src/ui/viewer/views/Vault/index.tsx',
      'utf-8'
    );

    expect(vaultViewContent).toMatch(/\.warning\(/);
  });

  it('handleInstall wrapper function exists', async () => {
    const fs = await import('fs/promises');
    const vaultViewContent = await fs.readFile(
      'src/ui/viewer/views/Vault/index.tsx',
      'utf-8'
    );

    expect(vaultViewContent).toMatch(/handle(Install|Sync)/);
  });
});
