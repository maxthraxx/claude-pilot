import { Icon, Badge, Tabs } from "../../components/ui";
import type { MergedAsset, AssetDetail } from "../../hooks/useVault";
import { VaultAssetDetail } from "./VaultAssetDetail";

const TYPE_ICONS: Record<string, string> = {
  skill: "lucide:wand-2",
  rule: "lucide:scale",
  command: "lucide:terminal",
  agent: "lucide:bot",
  hook: "lucide:webhook",
  mcp: "lucide:plug",
};

const TYPE_BADGE_VARIANT: Record<
  string,
  "primary" | "info" | "accent" | "ghost"
> = {
  skill: "primary",
  rule: "info",
  command: "accent",
  agent: "ghost",
  hook: "ghost",
  mcp: "ghost",
};

const TABS = [
  { id: "all", label: "All" },
  { id: "skill", label: "Skills" },
  { id: "rule", label: "Rules" },
  { id: "command", label: "Commands" },
  { id: "agent", label: "Agents" },
  { id: "hook", label: "Hooks" },
  { id: "mcp", label: "MCP" },
];

interface VaultAssetTableProps {
  assets: MergedAsset[];
  searchQuery: string;
  activeTab: string;
  onTabChange: (tab: string) => void;
  onSearchChange: (query: string) => void;
  expandedAsset: string | null;
  onAssetClick: (name: string) => void;
  fetchDetail: (name: string) => Promise<void>;
  detailCache: Map<string, AssetDetail>;
  loadingDetails: Set<string>;
}

export function VaultAssetTable({
  assets,
  searchQuery,
  activeTab,
  onTabChange,
  onSearchChange,
  expandedAsset,
  onAssetClick,
  fetchDetail,
  detailCache,
  loadingDetails,
}: VaultAssetTableProps) {
  const filtered = assets.filter((a) => {
    const matchesTab = activeTab === "all" || a.type === activeTab;
    const matchesSearch =
      !searchQuery || a.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesSearch;
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <Tabs tabs={TABS} activeTab={activeTab} onTabChange={onTabChange} />
        <input
          type="text"
          placeholder="Search assets..."
          className="input input-bordered input-sm w-60"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-8 text-base-content/50">
          {searchQuery
            ? `No assets matching "${searchQuery}"`
            : "No assets in this category"}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="table w-full">
            <thead>
              <tr>
                <th>Name</th>
                <th>Type</th>
                <th>Installed</th>
                <th>Latest</th>
                <th>Scope</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((asset) => (
                <AssetRow
                  key={asset.name}
                  asset={asset}
                  isExpanded={expandedAsset === asset.name}
                  onClick={() => onAssetClick(asset.name)}
                  fetchDetail={fetchDetail}
                  detail={detailCache.get(asset.name) ?? null}
                  isLoadingDetail={loadingDetails.has(asset.name)}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function AssetRow({
  asset,
  isExpanded,
  onClick,
  fetchDetail,
  detail,
  isLoadingDetail,
}: {
  asset: MergedAsset;
  isExpanded: boolean;
  onClick: () => void;
  fetchDetail: (name: string) => Promise<void>;
  detail: AssetDetail | null;
  isLoadingDetail: boolean;
}) {
  const iconName = TYPE_ICONS[asset.type] ?? "lucide:package";
  const badgeVariant = TYPE_BADGE_VARIANT[asset.type] ?? "ghost";

  const handleClick = () => {
    onClick();
    if (!isExpanded && !detail && !isLoadingDetail) {
      fetchDetail(asset.name);
    }
  };

  return (
    <>
      <tr
        className="cursor-pointer hover:bg-base-200 transition-colors"
        onClick={handleClick}
      >
        <td>
          <div className="flex items-center gap-2">
            <Icon icon={iconName} size={16} className="text-base-content/50" />
            <span className="font-medium">{asset.name}</span>
            {asset.hasUpdate && (
              <Badge variant="warning" size="sm">
                update
              </Badge>
            )}
          </div>
        </td>
        <td>
          <Badge variant={badgeVariant} size="sm">
            {asset.type}
          </Badge>
        </td>
        <td className="font-mono text-sm">
          {asset.installedVersion ?? "\u2014"}
        </td>
        <td className="font-mono text-sm">v{asset.latestVersion}</td>
        <td className="text-sm text-base-content/60">
          {asset.scope ?? "\u2014"}
        </td>
      </tr>
      {isExpanded && (
        <tr>
          <td colSpan={5} className="p-0">
            <VaultAssetDetail
              detail={detail}
              isLoading={isLoadingDetail}
              onRetry={() => fetchDetail(asset.name)}
            />
          </td>
        </tr>
      )}
    </>
  );
}
