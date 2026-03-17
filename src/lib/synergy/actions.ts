import type { ModuleId, SynergyPayload, KeywordsPrefill, TrendsPrefill, AEOPrefill, CompetitorsPrefill, ContentPrefill, ShoppingPrefill, YouTubePrefill } from "./types";
import { MODULE_ROUTES } from "./types";

const STORAGE_KEY = "miq:synergy-prefill";
const TTL_MS = 5 * 60 * 1000; // 5 minutes

export function sendToModule(
  source: ModuleId,
  target: ModuleId,
  data: KeywordsPrefill | TrendsPrefill | AEOPrefill | CompetitorsPrefill | ContentPrefill | ShoppingPrefill | YouTubePrefill,
  label: string
): string {
  const payload: SynergyPayload = {
    source,
    target,
    data,
    label,
    timestamp: Date.now(),
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  return MODULE_ROUTES[target];
}

export function consumeSynergyPayload(target: ModuleId): SynergyPayload | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;

    const payload: SynergyPayload = JSON.parse(raw);

    // Check target matches
    if (payload.target !== target) return null;

    // Check TTL
    if (Date.now() - payload.timestamp > TTL_MS) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }

    // Consume (remove from storage)
    localStorage.removeItem(STORAGE_KEY);
    return payload;
  } catch {
    localStorage.removeItem(STORAGE_KEY);
    return null;
  }
}
