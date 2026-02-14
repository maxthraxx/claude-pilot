import { describe, it, expect } from 'bun:test';
import { SEQUENCE_SHORTCUTS } from '../../src/ui/viewer/constants/shortcuts';

describe('Vault Navigation', () => {
  it('exports VaultView from views/index.ts', async () => {
    const viewsModule = await import('../../src/ui/viewer/views/index');
    expect(viewsModule.VaultView).toBeDefined();
    expect(typeof viewsModule.VaultView).toBe('function');
  });

  it('has vault route in App.tsx routes', async () => {
    const fs = await import('fs/promises');
    const appContent = await fs.readFile(
      'src/ui/viewer/App.tsx',
      'utf-8'
    );

    expect(appContent).toContain('VaultView');

    expect(appContent).toMatch(/path:\s*['"]\/vault['"]/);
  });

  it('has Vault nav item in sidebar with correct icon', async () => {
    const fs = await import('fs/promises');
    const sidebarContent = await fs.readFile(
      'src/ui/viewer/layouts/Sidebar/SidebarNav.tsx',
      'utf-8'
    );

    expect(sidebarContent).toContain("label: 'Vault'");

    expect(sidebarContent).toContain('lucide:archive');

    expect(sidebarContent).toMatch(/#\/vault/);
  });

  it('has Go to Vault command in command palette', async () => {
    const fs = await import('fs/promises');
    const paletteContent = await fs.readFile(
      'src/ui/viewer/components/CommandPalette.tsx',
      'utf-8'
    );

    expect(paletteContent).toContain('Go to Vault');

    expect(paletteContent).toContain('G V');

    expect(paletteContent).toMatch(/onNavigate\(['"]\/vault['"]\)/);
  });

  it('has g v keyboard shortcut sequence', () => {
    const vaultShortcut = SEQUENCE_SHORTCUTS.find(
      (s) => s.action === 'navigate:/vault'
    );

    expect(vaultShortcut).toBeDefined();
    expect(vaultShortcut?.sequence).toEqual(['g', 'v']);
    expect(vaultShortcut?.description).toContain('Vault');
  });
});
