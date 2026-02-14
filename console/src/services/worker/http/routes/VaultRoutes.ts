/**
 * VaultRoutes
 *
 * API endpoints for sx Vault status and management.
 * Invokes the sx CLI via Bun.spawn with timeout and caching.
 */

import express, { type Request, type Response } from "express";
import { BaseRouteHandler } from "../BaseRouteHandler.js";
import { logger } from "../../../../utils/logger.js";

export interface VaultAsset {
  name: string;
  version: string;
  type: string;
  clients: string[];
  status: string;
  scope: string;
}

export interface VaultCatalogItem {
  name: string;
  type: string;
  latestVersion: string;
  versionsCount: number;
  updatedAt: string;
}

export interface VaultStatus {
  installed: boolean;
  version: string | null;
  configured: boolean;
  vaultUrl: string | null;
  profile: string | null;
  assets: VaultAsset[];
  catalog: VaultCatalogItem[];
  isInstalling: boolean;
}

interface VaultDetailResponse {
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

const STATUS_TIMEOUT_MS = 15_000;
const INSTALL_TIMEOUT_MS = 60_000;
const STATUS_CACHE_TTL_MS = 30_000;
const DETAIL_CACHE_TTL_MS = 60_000;

export class VaultRoutes extends BaseRouteHandler {
  private statusCache: { data: VaultStatus; timestamp: number } | null = null;
  private detailCache: Map<string, { data: VaultDetailResponse; timestamp: number }> = new Map();
  private _isInstalling = false;

  setupRoutes(app: express.Application): void {
    app.get("/api/vault/status", this.handleStatus.bind(this));
    app.post("/api/vault/install", this.handleInstall.bind(this));
    app.get("/api/vault/detail/:name", this.handleDetail.bind(this));
  }

  private handleStatus = this.wrapHandler(async (_req: Request, res: Response): Promise<void> => {
    if (this.statusCache && Date.now() - this.statusCache.timestamp < STATUS_CACHE_TTL_MS) {
      res.json({ ...this.statusCache.data, isInstalling: this._isInstalling });
      return;
    }

    const sxPath = this.resolveSxBinary();
    if (!sxPath) {
      res.json(this.emptyStatus());
      return;
    }

    try {
      const [configOutput, catalogOutput] = await Promise.all([
        this.runSxCommand([sxPath, "config", "--json"], STATUS_TIMEOUT_MS),
        this.runSxCommand([sxPath, "vault", "list", "--json"], STATUS_TIMEOUT_MS).catch(() => "[]"),
      ]);

      const config = JSON.parse(configOutput);
      const catalog: VaultCatalogItem[] = JSON.parse(catalogOutput).map((item: any) => ({
        name: item.name,
        type: item.type,
        latestVersion: item.latestVersion,
        versionsCount: item.versionsCount,
        updatedAt: item.updatedAt,
      }));

      const assets: VaultAsset[] = [];
      for (const scopeGroup of config.assets || []) {
        const scope = scopeGroup.scope || "Global";
        for (const asset of scopeGroup.assets || []) {
          assets.push({
            name: asset.name,
            version: asset.version,
            type: asset.type,
            clients: asset.clients || [],
            status: asset.status || "unknown",
            scope,
          });
        }
      }

      const status: VaultStatus = {
        installed: true,
        version: config.version?.version || null,
        configured: !!config.config?.repositoryUrl,
        vaultUrl: config.config?.repositoryUrl || null,
        profile: config.config?.profile || null,
        assets,
        catalog,
        isInstalling: this._isInstalling,
      };

      this.statusCache = { data: status, timestamp: Date.now() };
      res.json(status);
    } catch (error) {
      logger.error("HTTP", "Vault status failed", {}, error as Error);
      res.json(this.emptyStatus());
    }
  });

  private handleInstall = this.wrapHandler(async (_req: Request, res: Response): Promise<void> => {
    if (this._isInstalling) {
      res.status(409).json({ error: "Installation already in progress" });
      return;
    }

    const sxPath = this.resolveSxBinary();
    if (!sxPath) {
      res.status(500).json({ error: "sx CLI not found" });
      return;
    }

    const projectRoot = process.env.CLAUDE_PROJECT_ROOT || process.cwd();

    this._isInstalling = true;
    this.statusCache = null;
    res.json({ started: true });

    try {
      await this.runSxCommand([sxPath, "install", "--repair", "--target", projectRoot], INSTALL_TIMEOUT_MS);
      logger.info("HTTP", "Vault install --repair completed");
    } catch (error) {
      logger.error("HTTP", "Vault install failed", {}, error as Error);
    } finally {
      this._isInstalling = false;
      this.statusCache = null;
      this.detailCache.clear();
    }
  });

  private handleDetail = this.wrapHandler(async (req: Request, res: Response): Promise<void> => {
    const name = req.params.name;

    if (!name || !/^[a-zA-Z0-9-]+$/.test(name)) {
      res.status(400).json({ error: "Invalid asset name: only alphanumeric characters and hyphens allowed" });
      return;
    }

    const cached = this.detailCache.get(name);
    if (cached && Date.now() - cached.timestamp < DETAIL_CACHE_TTL_MS) {
      res.json(cached.data);
      return;
    }

    const sxPath = this.resolveSxBinary();
    if (!sxPath) {
      res.status(500).json({ error: "sx CLI not found" });
      return;
    }

    try {
      const output = await this.runSxCommand([sxPath, "vault", "show", name, "--json"], STATUS_TIMEOUT_MS);
      const data = JSON.parse(output);

      if (!data.name || !data.type) {
        logger.error("HTTP", "Unexpected sx vault show output", { name, raw: output.slice(0, 500) });
        res.status(502).json({ error: "Unexpected sx response format" });
        return;
      }

      const detail = {
        name: data.name,
        type: data.type,
        metadata: {
          description: data.metadata?.description ?? null,
          authors: data.metadata?.authors ?? [],
          keywords: data.metadata?.keywords ?? [],
        },
        versions: (data.versions ?? []).map((v: any) => ({
          version: v.version,
          createdAt: v.createdAt ?? null,
          filesCount: v.filesCount ?? 0,
        })),
      };

      this.detailCache.set(name, { data: detail, timestamp: Date.now() });
      res.json(detail);
    } catch (error) {
      const message = (error as Error).message || "";
      if (message.includes("exited with code")) {
        res.status(404).json({ error: `Asset '${name}' not found` });
      } else {
        logger.error("HTTP", "Vault detail failed", { name }, error as Error);
        res.status(502).json({ error: "Unexpected sx response format" });
      }
    }
  });

  private emptyStatus(): VaultStatus {
    return {
      installed: false,
      version: null,
      configured: false,
      vaultUrl: null,
      profile: null,
      assets: [],
      catalog: [],
      isInstalling: this._isInstalling,
    };
  }

  private resolveSxBinary(): string | null {
    const found = Bun.which("sx");
    return found || null;
  }

  private async runSxCommand(args: string[], timeoutMs: number): Promise<string> {
    const proc = Bun.spawn(args, {
      stdout: "pipe",
      stderr: "pipe",
    });

    const timeoutId = setTimeout(() => {
      try {
        proc.kill("SIGTERM");
        setTimeout(() => { try { proc.kill("SIGKILL"); } catch {} }, 1000);
      } catch {}
    }, timeoutMs);

    try {
      const [stdout, stderr] = await Promise.all([
        new Response(proc.stdout).text(),
        new Response(proc.stderr).text(),
      ]);
      const exitCode = await proc.exited;

      if (exitCode !== 0) {
        throw new Error(`sx exited with code ${exitCode}: ${stderr.slice(0, 200)}`);
      }

      return stdout;
    } finally {
      clearTimeout(timeoutId);
    }
  }
}
