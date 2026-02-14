import { useState, useCallback, useEffect, useRef } from "react";
import type { VaultStatus } from "./useStats";

interface VaultAsset {
  name: string;
  version: string;
  type: string;
  clients: string[];
  status: string;
  scope: string;
}

interface VaultCatalogItem {
  name: string;
  type: string;
  latestVersion: string;
  versionsCount: number;
  updatedAt?: string;
}

export interface MergedAsset {
  name: string;
  type: string;
  latestVersion: string;
  versionsCount: number;
  updatedAt?: string;
  installedVersion: string | null;
  installed: boolean;
  hasUpdate: boolean;
  scope: string | null;
  clients: string[];
}

export interface AssetDetail {
  name: string;
  type: string;
  metadata: {
    description: string | null;
    authors: string[];
    keywords: string[];
  };
  versions: Array<{
    version: string;
    createdAt: string | null;
    filesCount: number;
  }>;
}

interface UseVaultResult {
  vaultStatus: VaultStatus | null;
  mergedAssets: MergedAsset[];
  isLoading: boolean;
  error: string | null;
  fetchDetail: (name: string) => Promise<void>;
  detailCache: Map<string, AssetDetail>;
  loadingDetails: Set<string>;
  detailErrors: Map<string, string>;
  installAll: () => Promise<void>;
  isInstalling: boolean;
  installError: string | null;
  refresh: () => Promise<void>;
}

const POLL_INTERVAL_MS = 2_000;
const MAX_POLLS = 30;

function parseVersion(v: string | null | undefined): number {
  if (!v) return NaN;
  const stripped = v.replace(/^v/i, "");
  return parseInt(stripped, 10);
}

export function mergeAssets(
  catalog: VaultCatalogItem[],
  assets: VaultAsset[],
): MergedAsset[] {
  const assetMap = new Map<string, VaultAsset>();
  for (const a of assets) {
    assetMap.set(a.name, a);
  }

  return catalog.map((item) => {
    const installed = assetMap.get(item.name);
    const installedVersion = installed?.version ?? null;

    const latestNum = parseVersion(item.latestVersion);
    const installedNum = parseVersion(installedVersion);
    const hasUpdate =
      installed != null &&
      !isNaN(latestNum) &&
      !isNaN(installedNum) &&
      installedNum < latestNum;

    return {
      name: item.name,
      type: item.type,
      latestVersion: item.latestVersion,
      versionsCount: item.versionsCount,
      updatedAt: item.updatedAt,
      installedVersion,
      installed: installed != null,
      hasUpdate,
      scope: installed?.scope ?? null,
      clients: installed?.clients ?? [],
    };
  });
}

export function useVault(): UseVaultResult {
  const [vaultStatus, setVaultStatus] = useState<VaultStatus | null>(null);
  const [mergedAssets, setMergedAssets] = useState<MergedAsset[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const detailCacheRef = useRef(new Map<string, AssetDetail>());
  const loadingDetailsRef = useRef(new Set<string>());
  const detailErrorsRef = useRef(new Map<string, string>());
  const [, forceUpdate] = useState(0);
  const [isInstalling, setIsInstalling] = useState(false);
  const [installError, setInstallError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/vault/status");
      if (!res.ok) throw new Error(`Status fetch failed: ${res.status}`);
      const data: VaultStatus = await res.json();
      if (!mountedRef.current) return;
      setVaultStatus(data);
      setMergedAssets(mergeAssets(data.catalog, data.assets));
      setError(null);
    } catch (err) {
      if (!mountedRef.current) return;
      setError((err as Error).message);
    } finally {
      if (mountedRef.current) setIsLoading(false);
    }
  }, []);

  const fetchDetail = useCallback(
    async (name: string) => {
      if (detailCacheRef.current.has(name) || loadingDetailsRef.current.has(name)) return;
      loadingDetailsRef.current.add(name);
      detailErrorsRef.current.delete(name);
      forceUpdate((c) => c + 1);
      try {
        const res = await fetch(`/api/vault/detail/${encodeURIComponent(name)}`);
        if (!res.ok) throw new Error(`Detail fetch failed: ${res.status}`);
        const data: AssetDetail = await res.json();
        if (mountedRef.current) {
          detailCacheRef.current.set(name, data);
        }
      } catch (err) {
        if (mountedRef.current) {
          detailErrorsRef.current.set(name, (err as Error).message);
          console.error("Failed to fetch vault detail:", name, err);
        }
      } finally {
        loadingDetailsRef.current.delete(name);
        if (mountedRef.current) forceUpdate((c) => c + 1);
      }
    },
    [],
  );

  const installAll = useCallback(async () => {
    setIsInstalling(true);
    setInstallError(null);

    try {
      const res = await fetch("/api/vault/install", { method: "POST" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: "Install failed" }));
        throw new Error(data.error || "Install failed");
      }

      let polls = 0;
      while (polls < MAX_POLLS) {
        await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
        if (!mountedRef.current) return;
        polls++;

        const statusRes = await fetch("/api/vault/status");
        if (!statusRes.ok) continue;
        const statusData: VaultStatus = await statusRes.json();

        if (!statusData.isInstalling) {
          detailCacheRef.current.clear();
          detailErrorsRef.current.clear();
          if (mountedRef.current) {
            setVaultStatus(statusData);
            setMergedAssets(mergeAssets(statusData.catalog, statusData.assets));
            setIsInstalling(false);
          }
          return;
        }
      }

      if (mountedRef.current) {
        setInstallError("Install taking longer than expected");
        setIsInstalling(false);
        await fetchStatus();
      }
    } catch (err) {
      if (mountedRef.current) {
        setInstallError((err as Error).message);
        setIsInstalling(false);
      }
    }
  }, [fetchStatus]);

  useEffect(() => {
    mountedRef.current = true;
    fetchStatus();
    return () => {
      mountedRef.current = false;
    };
  }, [fetchStatus]);

  return {
    vaultStatus,
    mergedAssets,
    isLoading,
    error,
    fetchDetail,
    detailCache: detailCacheRef.current,
    loadingDetails: loadingDetailsRef.current,
    detailErrors: detailErrorsRef.current,
    installAll,
    isInstalling,
    installError,
    refresh: fetchStatus,
  };
}
