import { callTool } from "./mcp-client";
import type {
  InterestData,
  RelatedQuery,
  RelatedTopic,
  RegionInterest,
  TimelinePoint,
} from "@/lib/types/trends";

const SERVICE = "google-trends";
const TIMEOUT = 12000;

interface RawTimelineEntry {
  date?: string;
  timestamp?: string;
  values?: Array<{ query?: string; value?: string | number; extracted_value?: number }>;
}

interface RawRelatedQuery {
  position?: number;
  query?: string;
  values?: string | number;
  extracted_value?: number;
  link?: string;
}

interface RawRelatedTopic {
  topic?: { title?: string; type?: string };
  value?: string;
  extracted_value?: number;
  link?: string;
}

export async function getInterestOverTime(
  query: string,
  timeframe = "today 12-m",
  country = ""
): Promise<InterestData> {
  const args: Record<string, unknown> = { query, timeframe };
  if (country) args.country = country;

  const raw = (await callTool(SERVICE, "get_interest_over_time", args, TIMEOUT)) as {
    query?: string;
    timeframe?: string;
    country?: string;
    interest_over_time?: { timeline_data?: RawTimelineEntry[] };
  };

  const timelineData = raw?.interest_over_time?.timeline_data || [];

  const timeline: TimelinePoint[] = timelineData.map((entry) => ({
    date: entry.date || "",
    timestamp: entry.timestamp || "",
    value:
      entry.values?.[0]?.extracted_value ??
      (typeof entry.values?.[0]?.value === "number"
        ? entry.values[0].value
        : parseInt(String(entry.values?.[0]?.value || "0"), 10)),
  }));

  return {
    query: raw?.query || query,
    timeframe: raw?.timeframe || timeframe,
    country: raw?.country || country,
    timeline,
  };
}

export async function getRelatedQueries(
  query: string,
  country = ""
): Promise<RelatedQuery[]> {
  const args: Record<string, unknown> = { query };
  if (country) args.country = country;

  const raw = (await callTool(SERVICE, "get_related_queries", args, TIMEOUT)) as {
    related_queries?: {
      top?: RawRelatedQuery[];
      rising?: RawRelatedQuery[];
    };
  };

  const results: RelatedQuery[] = [];
  const rq = raw?.related_queries;

  if (rq?.top) {
    for (const item of rq.top) {
      results.push({
        position: item.position ?? results.length + 1,
        query: item.query || "",
        value: item.extracted_value ?? (typeof item.values === "number" ? item.values : parseInt(String(item.values || "0"), 10)),
        type: "top",
      });
    }
  }

  if (rq?.rising) {
    for (const item of rq.rising) {
      results.push({
        position: item.position ?? results.length + 1,
        query: item.query || "",
        value: item.extracted_value ?? (typeof item.values === "number" ? item.values : parseInt(String(item.values || "0"), 10)),
        type: "rising",
      });
    }
  }

  return results;
}

export async function getRelatedTopics(
  query: string,
  country = ""
): Promise<RelatedTopic[]> {
  const args: Record<string, unknown> = { query };
  if (country) args.country = country;

  const raw = (await callTool(SERVICE, "get_related_topics", args, TIMEOUT)) as {
    related_topics?: {
      top?: RawRelatedTopic[];
      rising?: RawRelatedTopic[];
    };
  };

  const results: RelatedTopic[] = [];
  const rt = raw?.related_topics;

  if (rt?.top) {
    for (const item of rt.top) {
      results.push({
        title: item.topic?.title || "",
        type: item.topic?.type || "",
        value: item.extracted_value ?? parseInt(String(item.value || "0"), 10),
        category: "top",
      });
    }
  }

  if (rt?.rising) {
    for (const item of rt.rising) {
      results.push({
        title: item.topic?.title || "",
        type: item.topic?.type || "",
        value: item.extracted_value ?? parseInt(String(item.value || "0"), 10),
        category: "rising",
      });
    }
  }

  return results;
}

export async function getInterestByRegion(
  query: string,
  country = ""
): Promise<RegionInterest[]> {
  const args: Record<string, unknown> = { query };
  if (country) args.country = country;

  const raw = (await callTool(SERVICE, "get_interest_by_region", args, TIMEOUT)) as {
    interest_by_region?: Array<{
      name?: string;
      geo?: string;
      value?: string | number;
      extracted_value?: number;
      max_value_index?: number;
    }>;
  };

  const regions = raw?.interest_by_region || [];

  return regions
    .map((r) => ({
      name: r.name || r.geo || "",
      value: r.extracted_value ?? (typeof r.value === "number" ? r.value : parseInt(String(r.value || "0"), 10)),
    }))
    .filter((r) => r.value > 0)
    .sort((a, b) => b.value - a.value);
}
