import { useState, useCallback, useEffect, useRef } from 'react';
import { useVault } from '../../hooks/useVault';
import { useToast } from '../../context/ToastContext';
import { Icon, Badge, EmptyState } from '../../components/ui';
import { VaultSummaryCards } from './VaultSummaryCards';
import { VaultAssetTable } from './VaultAssetTable';

function formatVaultUrl(url: string): string {
  try {
    const u = new URL(url);
    return (u.host + u.pathname).replace(/\.git$/, '');
  } catch {
    return url;
  }
}

export function VaultView() {
  const {
    vaultStatus,
    mergedAssets,
    isLoading,
    error,
    fetchDetail,
    detailCache,
    loadingDetails,
    installAll,
    isInstalling,
    installError,
  } = useVault();

  const toast = useToast();
  const prevInstallingRef = useRef(isInstalling);

  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [expandedAsset, setExpandedAsset] = useState<string | null>(null);

  const handleInstall = useCallback(() => {
    installAll();
  }, [installAll]);

  const handleAssetClick = useCallback((name: string) => {
    setExpandedAsset((prev) => (prev === name ? null : name));
  }, []);

  useEffect(() => {
    const wasInstalling = prevInstallingRef.current;
    const nowInstalling = isInstalling;

    if (wasInstalling && !nowInstalling) {
      if (installError) {
        if (installError.includes('longer than expected')) {
          toast.warning(installError, 'Install Timeout');
        } else {
          toast.error(installError, 'Install Failed');
        }
      } else {
        toast.success('Vault synced successfully', 'Sync Complete');
      }
    }

    prevInstallingRef.current = isInstalling;
  }, [isInstalling, installError, toast]);

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="flex items-baseline gap-3">
          <h1 className="text-2xl font-bold">Vault</h1>
          <span className="text-xs text-base-content/40 flex items-center gap-2">
            <span className="loading loading-spinner loading-xs" />
            Loading vault data...
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="stats shadow bg-base-200 animate-pulse">
              <div className="stat">
                <div className="h-3 bg-base-300 rounded w-20 mb-2" />
                <div className="h-8 bg-base-300 rounded w-24 mb-1" />
                <div className="h-3 bg-base-300 rounded w-16" />
              </div>
            </div>
          ))}
        </div>

        <div className="card bg-base-200 animate-pulse">
          <div className="card-body">
            <div className="h-4 bg-base-300 rounded w-48 mb-4" />
            <div className="h-48 bg-base-300 rounded" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-8">
        <h1 className="text-2xl font-bold">Vault</h1>
        <div className="alert alert-error">
          <span>Failed to load vault data: {error}</span>
        </div>
      </div>
    );
  }

  if (!vaultStatus?.installed) {
    return (
      <div className="space-y-8">
        <h1 className="text-2xl font-bold">Vault</h1>
        <EmptyState
          icon="lucide:archive"
          title="sx is not installed"
          description="Run /vault in Claude Code to push or pull skills, rules, and commands."
        />
      </div>
    );
  }

  if (!vaultStatus.configured) {
    return (
      <div className="space-y-8">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold">Vault</h1>
          {vaultStatus.version && (
            <Badge variant="ghost" size="sm">sx v{vaultStatus.version}</Badge>
          )}
        </div>
        <EmptyState
          icon="lucide:archive"
          title="Vault not configured"
          description="Run /vault in Claude Code to configure your vault and push or pull skills, rules, and commands."
        />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold">Vault</h1>
          <Badge variant="success" size="sm">Connected</Badge>
          {installError && (
            <span className="text-xs text-warning">{installError}</span>
          )}
        </div>
        <VaultSyncButton
          isInstalling={isInstalling}
          onInstall={handleInstall}
        />
      </div>

      {/* Vault info */}
      <div className="flex items-center gap-2 text-sm text-base-content/60">
        {vaultStatus.vaultUrl && (
          <>
            <Icon icon="lucide:git-branch" size={16} />
            <span className="font-mono text-xs">{formatVaultUrl(vaultStatus.vaultUrl)}</span>
          </>
        )}
        {vaultStatus.version && (
          <Badge variant="ghost" size="sm">sx v{vaultStatus.version}</Badge>
        )}
        <span>Run <code className="font-mono text-xs bg-base-300 px-1 rounded">/vault</code> in Claude Code to push or pull skills, rules, and commands.</span>
      </div>

      <VaultSummaryCards assets={mergedAssets} />

      {mergedAssets.length === 0 ? (
        <EmptyState
          icon="lucide:package"
          title="No assets in vault"
          description="Push skills, rules, or commands to your vault using /vault in Claude Code."
        />
      ) : (
        <VaultAssetTable
          assets={mergedAssets}
          searchQuery={searchQuery}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          onSearchChange={setSearchQuery}
          expandedAsset={expandedAsset}
          onAssetClick={handleAssetClick}
          fetchDetail={fetchDetail}
          detailCache={detailCache}
          loadingDetails={loadingDetails}
        />
      )}
    </div>
  );
}

function VaultSyncButton({
  isInstalling,
  onInstall,
}: {
  isInstalling: boolean;
  onInstall: () => void;
}) {
  return (
    <button
      className="btn btn-primary btn-sm"
      disabled={isInstalling}
      onClick={onInstall}
    >
      {isInstalling ? (
        <>
          <span className="loading loading-spinner loading-xs" />
          Syncing...
        </>
      ) : (
        <>
          <Icon icon="lucide:refresh-cw" size={14} />
          Sync All
        </>
      )}
    </button>
  );
}
