import { callPipeboard, GOOGLE_ADS_ENDPOINT } from "./pipeboard-client";

const EP = GOOGLE_ADS_ENDPOINT;

export async function listCustomers(): Promise<Record<string, unknown>[]> {
  const raw = await callPipeboard(EP, "list_google_ads_customers", {});
  if (Array.isArray(raw)) return raw as Record<string, unknown>[];
  const data = raw as Record<string, unknown>;
  return (data.customers || data.data || []) as Record<string, unknown>[];
}

export async function getAccountInfo(customerId: string): Promise<Record<string, unknown>> {
  return (await callPipeboard(EP, "get_google_ads_account_info", { customer_id: customerId })) as Record<string, unknown>;
}

export async function getCampaigns(
  customerId: string,
  statusFilter?: string
): Promise<Record<string, unknown>[]> {
  const args: Record<string, unknown> = { customer_id: customerId };
  if (statusFilter) args.status_filter = statusFilter;
  const raw = await callPipeboard(EP, "get_google_ads_campaigns", args);
  if (Array.isArray(raw)) return raw as Record<string, unknown>[];
  const data = raw as Record<string, unknown>;
  return (data.campaigns || data.data || []) as Record<string, unknown>[];
}

export async function getCampaignMetrics(
  customerId: string,
  dateRange?: string,
  campaignIds?: string[],
  segmentByDate?: boolean
): Promise<Record<string, unknown>[]> {
  const args: Record<string, unknown> = { customer_id: customerId };
  if (dateRange) args.date_range = dateRange;
  if (campaignIds?.length) args.campaign_ids = campaignIds;
  if (segmentByDate) args.segment_by_date = true;
  const raw = await callPipeboard(EP, "get_google_ads_campaign_metrics", args);
  if (Array.isArray(raw)) return raw as Record<string, unknown>[];
  const data = raw as Record<string, unknown>;
  return (data.campaigns || data.metrics || data.data || []) as Record<string, unknown>[];
}

export async function getKeywords(
  customerId: string,
  campaignId?: string,
  adGroupId?: string
): Promise<Record<string, unknown>[]> {
  const args: Record<string, unknown> = { customer_id: customerId };
  if (campaignId) args.campaign_id = campaignId;
  if (adGroupId) args.ad_group_id = adGroupId;
  const raw = await callPipeboard(EP, "get_google_ads_keywords", args);
  if (Array.isArray(raw)) return raw as Record<string, unknown>[];
  const data = raw as Record<string, unknown>;
  return (data.keywords || data.data || []) as Record<string, unknown>[];
}

export async function getKeywordMetrics(
  customerId: string,
  dateRange?: string,
  campaignId?: string
): Promise<Record<string, unknown>[]> {
  const args: Record<string, unknown> = { customer_id: customerId };
  if (dateRange) args.date_range = dateRange;
  if (campaignId) args.campaign_id = campaignId;
  const raw = await callPipeboard(EP, "get_google_ads_keyword_metrics", args);
  if (Array.isArray(raw)) return raw as Record<string, unknown>[];
  const data = raw as Record<string, unknown>;
  return (data.keywords || data.metrics || data.data || []) as Record<string, unknown>[];
}

export async function getSearchTermsReport(
  customerId: string,
  dateRange?: string,
  campaignId?: string
): Promise<Record<string, unknown>[]> {
  const args: Record<string, unknown> = { customer_id: customerId };
  if (dateRange) args.date_range = dateRange;
  if (campaignId) args.campaign_id = campaignId;
  const raw = await callPipeboard(EP, "get_google_ads_search_terms_report", args);
  if (Array.isArray(raw)) return raw as Record<string, unknown>[];
  const data = raw as Record<string, unknown>;
  return (data.search_terms || data.data || []) as Record<string, unknown>[];
}

export async function getGeoPerformance(
  customerId: string,
  dateRange?: string,
  campaignId?: string
): Promise<Record<string, unknown>[]> {
  const args: Record<string, unknown> = { customer_id: customerId };
  if (dateRange) args.date_range = dateRange;
  if (campaignId) args.campaign_id = campaignId;
  const raw = await callPipeboard(EP, "get_google_ads_geo_performance", args);
  if (Array.isArray(raw)) return raw as Record<string, unknown>[];
  const data = raw as Record<string, unknown>;
  return (data.geo || data.locations || data.data || []) as Record<string, unknown>[];
}

export async function getDevicePerformance(
  customerId: string,
  dateRange?: string,
  campaignId?: string
): Promise<Record<string, unknown>[]> {
  const args: Record<string, unknown> = { customer_id: customerId };
  if (dateRange) args.date_range = dateRange;
  if (campaignId) args.campaign_id = campaignId;
  const raw = await callPipeboard(EP, "get_google_ads_device_performance", args);
  if (Array.isArray(raw)) return raw as Record<string, unknown>[];
  const data = raw as Record<string, unknown>;
  return (data.devices || data.data || []) as Record<string, unknown>[];
}

export async function getAdGroups(
  customerId: string,
  campaignId?: string
): Promise<Record<string, unknown>[]> {
  const args: Record<string, unknown> = { customer_id: customerId };
  if (campaignId) args.campaign_id = campaignId;
  const raw = await callPipeboard(EP, "get_google_ads_ad_groups", args);
  if (Array.isArray(raw)) return raw as Record<string, unknown>[];
  const data = raw as Record<string, unknown>;
  return (data.ad_groups || data.data || []) as Record<string, unknown>[];
}
