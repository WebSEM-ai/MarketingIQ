import { callTool } from "./mcp-client";
import type { AEOPlatform, PlatformResult } from "@/lib/types/aeo";

interface TrackPromptResponse {
  platform: string;
  position: number | null;
  responseQuality: number;
  metadata: {
    totalResults: number;
    searched: boolean;
    timestamp: string;
    topUrls: string[];
    hasTargetUrl: boolean;
    responseLength: number;
    searchContextSize: string;
    searchResultsCount: number;
    responseContent: string;
  };
  analysis: {
    visibility: string;
    ranking: string;
    quality: string;
    targetUrlFound: boolean;
    recommendation: string;
  };
}

export async function trackOnPlatform(
  prompt: string,
  platform: AEOPlatform,
  targetUrl?: string
): Promise<PlatformResult> {
  const args: Record<string, unknown> = { prompt, platform };
  if (targetUrl) {
    args.targetUrl = targetUrl;
  }

  const raw = (await callTool(
    "llm-prompt-tracker",
    "track_prompt",
    args,
    25000
  )) as TrackPromptResponse;

  return {
    platform,
    position: raw.position,
    responseQuality: raw.responseQuality ?? 0,
    visibility: raw.analysis?.visibility ?? "unknown",
    targetUrlFound: raw.analysis?.targetUrlFound ?? false,
    recommendation: raw.analysis?.recommendation ?? "",
    topUrls: raw.metadata?.topUrls ?? [],
    responseContent: raw.metadata?.responseContent ?? "",
    responseLength: raw.metadata?.responseLength ?? 0,
    totalResults: raw.metadata?.totalResults ?? 0,
    timestamp: raw.metadata?.timestamp ?? new Date().toISOString(),
  };
}
