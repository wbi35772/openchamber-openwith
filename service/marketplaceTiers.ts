/**
 * Curated install tiers for the marketplace, keyed by repository (owner/repo).
 *
 * T0: install first — agent control, context inspection, unattended
 *     automation, container workflow, throughput and cost visibility.
 * T1: worth installing when the matching local stack exists (local inference
 *     servers, LiteLLM gateway, DCP plugin, multi-agent workflows, disk moves).
 * T2: redundant or environment-specific — overlaps a stronger entry, or only
 *     works with a proprietary backend, subscription or host platform.
 *
 * The catalog can list the same project twice (official entry plus a GitHub
 * entry, sometimes with a renamed repository), so tiers resolve by repo URL
 * first and fall back to the entry id. Entries without a tier stay unlabelled.
 * Tiers are curated for this workspace; they describe fit, not quality.
 */
import type { MarketplaceTier } from '../shared/types.ts';

export const MARKETPLACE_TIERS: Record<string, MarketplaceTier> = {
  // T0 — core control plane
  "otagamo/openchamber-mcps": "T0",
  "chenyuhao0628/openchamber-skills": "T0",
  "chenyuhao0628/openchamber-agents": "T0",
  "chenyuhao0628/openchamber-prompt": "T0",
  "leoporoluo/openchamber-providers": "T0",

  // T0 — context and trajectory inspection
  "jmocoder/openchamber-context-inspector": "T0",
  "mel0nyrame/openchamber-context-map": "T0",
  "gadarianzhang/openchamber-trajectory": "T0",

  // T0 — automation, containers, frontend loop
  "openchamber/openchamber-extension-docker": "T0",
  "open-tecmz/openchamber-queue": "T0",
  "mannu150/openchamber-kanban": "T0",
  "lastonoga/openchamber-design-studio": "T0",

  // T0 — throughput and cost (Balance and token-usage are alternatives)
  "wwwzzzxxx/openchamber-live-tps": "T0",
  "chenyuhao0628/openchamber-balance": "T0",
  "seanjin0513/openchamber-token-usage": "T0",

  // T1 — install when the dependency is actually present
  "dae51d/openchamber-onvtop": "T1",
  "oroszgy/openchamber-litellm-usage": "T1",
  "royalcat/openchamber-dcp-rc-stats": "T1",
  "phototonic/openchamber-progress": "T1",
  "cv-superding/opencode-relocator": "T1",

  // T2 — billing and peak-clock duplicates
  "shedowe19/openchamber-deepseek-usage-de": "T2",
  "zoregixo865/openchamber-deepseek-peak-clock": "T2",
  "neoscaler/openchamber-deepseek-peak": "T2",
  "shusonglu/openchamber-deepseek-usage": "T2",
  "xiaodke-rgb/openchamber-session-usage": "T2",

  // T2 — throughput duplicates
  "airtaxi/openchamber-tps": "T2",
  "xhj845/opencode-tps": "T2",

  // T2 — todo and board duplicates
  "boureaujm/openchamber-taskpanel": "T2",
  "richkershaw/openchamber-sessionfocuspanel": "T2",
  "mradwankhalil/openchamber-session-todos": "T2",
  "maicarons/openchamber-ticket-board": "T2",
  "blackkcold/openchamber-todo-bridge": "T2",
  "chaos-318/openchamber-session-usage": "T2",
  "jeanjo1310/openchamber-extension-containers": "T2",

  // T2 — overlaps native host features
  "open-tecmz/openchamber-openwith": "T2",
  "pylotlight/openchamber-files-ext": "T2",
  "fuchs-alexander/openchamber-system-monitor": "T2",
  "guochen-thlg/git-manage": "T2",
  "mltstephane/openchamber-git-graph": "T2",
  "airtaxi/openchamber-wakatime": "T2",
  "q-wind520/openchamber-translator": "T2",
  "withlinda/openchamber-everforest-theme-extension": "T2",
  "lilitik1679-afk/openchamber-oc-bg": "T2",

  // T2 — panels for external memory or compression backends
  "bitexpert/openchamber-engram-plugin": "T2",
  "yulimfish/openchamber-memory-graph-ui": "T2",
  "claymor333/openchamber-magic-context": "T2",
  "gaojunran/openchamber-magic-context": "T2",
  "mradwankhalil/openchamber-squeez-stats": "T2",
  "seanjin0513/openchamber-ai-memory": "T2",
  "mradwankhalil/openchamber-context-mode-stats": "T2",
  "ali3nz/singularity-repoql": "T2",
  "seanjin0513/openchamber-billion-context": "T2",

  // T2 — vendor subscription quota bars
  "dai1012/openchamber-commandcode-usage": "T2",
  "dorne/commandcode-usage": "T2",
  "lilixxs/openchamber-magpie-usage": "T2",
  "infinity4b/openchamber-magpie-usage": "T2",
  "edigorin/openchamber-token-plan-usage": "T2",
  "pgquiles/opencode-muse": "T2",
  "thelast0802/opencode-workbuddy-provider": "T2",
  "derlt/openchamber-mistral-quota": "T2",

  // T2 — hardware or OS specific
  "mikebuckets171/mlx-scope-openchamber": "T2",
  "bemany/openchamber-ios-simulator": "T2",
  "wichardriezebos/even-terminal-opencode": "T2",
  "josuegalre/openchamber-droplet": "T2",
  "kotobarsik/openchamber-ru-installer": "T2",
  "icebluerabbit/openchamber-flake": "T2",
  "cnagnn/openchamber-bin": "T2",
  "airtaxi/openchamber-windows-arm64": "T2",
};

const REPO_IN_URL = /github\.com[/:]([^/\s]+)\/([^/#?\s]+)/i;

const normalizeRepo = (value: string | undefined): string | undefined => {
  if (!value) return undefined;
  const match = REPO_IN_URL.exec(value);
  const full = match ? `${match[1]}/${match[2]}` : value;
  return full.replace(/\.git$/i, '').replace(/\/+$/, '').toLowerCase();
};

/** Resolve the curated tier for a catalog entry, by repository or by id. */
export const marketplaceTierOf = (entry: {
  id: string;
  repoUrl?: string;
  installUrl?: string;
}): MarketplaceTier | undefined =>
  MARKETPLACE_TIERS[normalizeRepo(entry.repoUrl) ?? ''] ??
  MARKETPLACE_TIERS[normalizeRepo(entry.installUrl) ?? ''] ??
  MARKETPLACE_TIERS[entry.id];
