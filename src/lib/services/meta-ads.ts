import { callPipeboard, META_ADS_ENDPOINT } from "./pipeboard-client";

const EP = META_ADS_ENDPOINT;

export async function getAdAccounts(): Promise<Record<string, unknown>[]> {
  const raw = await callPipeboard(EP, "get_ad_accounts", {});
  if (Array.isArray(raw)) return raw as Record<string, unknown>[];
  const data = raw as Record<string, unknown>;
  return (data.accounts || data.data || []) as Record<string, unknown>[];
}

export async function getAccountInfo(accountId: string): Promise<Record<string, unknown>> {
  return (await callPipeboard(EP, "get_account_info", { account_id: accountId })) as Record<string, unknown>;
}

export async function getCampaigns(
  accountId: string,
  statusFilter?: string,
  limit = 25
): Promise<Record<string, unknown>[]> {
  const args: Record<string, unknown> = { account_id: accountId, limit };
  if (statusFilter) args.status_filter = statusFilter;
  const raw = await callPipeboard(EP, "get_campaigns", args);
  if (Array.isArray(raw)) return raw as Record<string, unknown>[];
  const data = raw as Record<string, unknown>;
  return (data.campaigns || data.data || []) as Record<string, unknown>[];
}

export async function getCampaignDetails(campaignId: string): Promise<Record<string, unknown>> {
  return (await callPipeboard(EP, "get_campaign_details", { campaign_id: campaignId })) as Record<string, unknown>;
}

export async function getInsights(
  accountId: string,
  dateRange?: { since: string; until: string },
  level?: string
): Promise<Record<string, unknown>> {
  const args: Record<string, unknown> = { account_id: accountId };
  if (dateRange) {
    args.since = dateRange.since;
    args.until = dateRange.until;
  }
  if (level) args.level = level;
  return (await callPipeboard(EP, "get_insights", args)) as Record<string, unknown>;
}

export async function bulkGetInsights(
  accountId: string,
  objectIds: string[],
  level?: string
): Promise<Record<string, unknown>[]> {
  const args: Record<string, unknown> = { account_id: accountId, object_ids: objectIds };
  if (level) args.level = level;
  const raw = await callPipeboard(EP, "bulk_get_insights", args);
  if (Array.isArray(raw)) return raw as Record<string, unknown>[];
  const data = raw as Record<string, unknown>;
  return (data.insights || data.data || []) as Record<string, unknown>[];
}

export async function getAdsets(accountId: string, limit = 25): Promise<Record<string, unknown>[]> {
  const raw = await callPipeboard(EP, "get_adsets", { account_id: accountId, limit });
  if (Array.isArray(raw)) return raw as Record<string, unknown>[];
  const data = raw as Record<string, unknown>;
  return (data.adsets || data.data || []) as Record<string, unknown>[];
}

export async function getAds(accountId: string, limit = 25): Promise<Record<string, unknown>[]> {
  const raw = await callPipeboard(EP, "get_ads", { account_id: accountId, limit });
  if (Array.isArray(raw)) return raw as Record<string, unknown>[];
  const data = raw as Record<string, unknown>;
  return (data.ads || data.data || []) as Record<string, unknown>[];
}

export async function searchInterests(query: string): Promise<Record<string, unknown>[]> {
  const raw = await callPipeboard(EP, "search_interests", { query });
  if (Array.isArray(raw)) return raw as Record<string, unknown>[];
  const data = raw as Record<string, unknown>;
  return (data.interests || data.data || []) as Record<string, unknown>[];
}

export async function estimateAudienceSize(
  accountId: string,
  targetingSpec: Record<string, unknown>
): Promise<Record<string, unknown>> {
  return (await callPipeboard(EP, "estimate_audience_size", {
    account_id: accountId,
    targeting_spec: targetingSpec,
  })) as Record<string, unknown>;
}
