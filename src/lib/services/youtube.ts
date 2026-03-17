import { callTool } from "./mcp-client";
import type { YouTubeVideo, YouTubeChannel, YouTubeShort, VideoRanking } from "@/lib/types/youtube";

const SERVICE = "youtube";
const TIMEOUT = 15000;

export async function searchVideos(
  query: string,
  country?: string
): Promise<YouTubeVideo[]> {
  const args: Record<string, unknown> = { query };
  if (country) args.country = country.toLowerCase();

  const raw = (await callTool(SERVICE, "search_videos", args, TIMEOUT)) as Record<string, unknown>;
  const results = (raw.videos || raw.results || []) as Array<Record<string, unknown>>;
  if (!Array.isArray(results)) return [];

  return results.map((v, idx) => {
    const channel = (v.channel || {}) as Record<string, unknown>;
    const thumb = (v.thumbnail || {}) as Record<string, string>;
    return {
      position: (v.position as number) || idx + 1,
      id: (v.id as string) || "",
      title: (v.title as string) || "",
      link: (v.link as string) || "",
      description: v.description as string | undefined,
      views: (v.views as number) ?? null,
      channel: {
        id: (channel.id as string) || "",
        title: (channel.title as string) || "",
        link: channel.link as string | undefined,
        thumbnail: channel.thumbnail as string | undefined,
        isVerified: (channel.is_verified as boolean) || false,
      },
      length: v.length as string | undefined,
      publishedTime: (v.published_time as string) || undefined,
      badges: Array.isArray(v.badges) ? (v.badges as string[]) : undefined,
      thumbnail: typeof thumb === "object" ? { static: thumb.static, rich: thumb.rich } : undefined,
    };
  });
}

export async function searchChannels(
  query: string,
  country?: string
): Promise<YouTubeChannel[]> {
  const args: Record<string, unknown> = { query };
  if (country) args.country = country.toLowerCase();

  const raw = (await callTool(SERVICE, "search_channels", args, TIMEOUT)) as Record<string, unknown>;
  const results = (raw.channels || raw.results || []) as Array<Record<string, unknown>>;
  if (!Array.isArray(results)) return [];

  return results.map((c) => ({
    id: (c.id as string) || (c.channel_id as string) || "",
    title: (c.title as string) || "",
    link: c.link as string | undefined,
    thumbnail: c.thumbnail as string | undefined,
    description: c.description as string | undefined,
    subscribers: (c.subscribers as string) || (c.subscriber_count as string) || undefined,
    videoCount: (c.video_count as number) || (c.videos as number) || undefined,
    isVerified: (c.is_verified as boolean) || false,
  }));
}

export async function searchShorts(
  query: string,
  country?: string
): Promise<YouTubeShort[]> {
  const args: Record<string, unknown> = { query };
  if (country) args.country = country.toLowerCase();

  const raw = (await callTool(SERVICE, "search_shorts", args, TIMEOUT)) as Record<string, unknown>;
  const results = (raw.shorts || raw.results || []) as Array<Record<string, unknown>>;
  if (!Array.isArray(results)) return [];

  return results.map((s) => ({
    id: (s.id as string) || (s.video_id as string) || "",
    title: (s.title as string) || "",
    link: (s.link as string) || "",
    views: (s.views as number) ?? null,
    thumbnail: (s.thumbnail as string) || undefined,
  }));
}

export async function getVideoDetails(
  videoId: string,
  country?: string
): Promise<Record<string, unknown>> {
  const args: Record<string, unknown> = { video_id: videoId };
  if (country) args.country = country.toLowerCase();

  return (await callTool(SERVICE, "get_video_details", args, TIMEOUT)) as Record<string, unknown>;
}

export async function getVideoTranscripts(
  videoId: string,
  lang?: string
): Promise<string> {
  const args: Record<string, unknown> = { video_id: videoId };
  if (lang) args.lang = lang;

  const raw = await callTool(SERVICE, "get_video_transcripts", args, TIMEOUT);
  if (typeof raw === "string") return raw;
  const data = raw as Record<string, unknown>;
  return (data.transcript as string) || (data.text as string) || JSON.stringify(data);
}

export async function getVideoComments(
  videoId: string,
  country?: string
): Promise<Array<Record<string, unknown>>> {
  const args: Record<string, unknown> = { video_id: videoId };
  if (country) args.country = country.toLowerCase();

  const raw = (await callTool(SERVICE, "get_video_comments", args, TIMEOUT)) as Record<string, unknown>;
  const comments = (raw.comments || raw.results || []) as Array<Record<string, unknown>>;
  return Array.isArray(comments) ? comments : [];
}

export async function getYouTubeTrends(
  category?: string,
  country?: string
): Promise<YouTubeVideo[]> {
  const args: Record<string, unknown> = {};
  if (category) args.category = category;
  if (country) args.country = country.toLowerCase();

  const raw = (await callTool(SERVICE, "get_youtube_trends", args, TIMEOUT)) as Record<string, unknown>;
  const results = (raw.videos || raw.trending || raw.results || []) as Array<Record<string, unknown>>;
  if (!Array.isArray(results)) return [];

  return results.map((v, idx) => {
    const channel = (v.channel || {}) as Record<string, unknown>;
    const thumb = (v.thumbnail || {}) as Record<string, string>;
    return {
      position: (v.position as number) || idx + 1,
      id: (v.id as string) || (v.video_id as string) || "",
      title: (v.title as string) || "",
      link: (v.link as string) || "",
      description: v.description as string | undefined,
      views: (v.views as number) ?? null,
      channel: {
        id: (channel.id as string) || "",
        title: (channel.title as string) || "",
        link: channel.link as string | undefined,
        thumbnail: channel.thumbnail as string | undefined,
        isVerified: (channel.is_verified as boolean) || false,
      },
      length: v.length as string | undefined,
      publishedTime: (v.published_time as string) || undefined,
      badges: Array.isArray(v.badges) ? (v.badges as string[]) : undefined,
      thumbnail: typeof thumb === "object" ? { static: thumb.static, rich: thumb.rich } : undefined,
    };
  });
}

export async function bulkFindVideoPosition(
  keywords: string[],
  videoUrl: string,
  country?: string
): Promise<VideoRanking[]> {
  const args: Record<string, unknown> = {
    keywords: keywords.slice(0, 10),
    video_url: videoUrl,
  };
  if (country) args.country = country.toLowerCase();

  const raw = (await callTool(SERVICE, "bulk_find_video_position", args, 20000)) as Record<string, unknown>;
  const results = (raw.results || raw.positions || []) as Array<Record<string, unknown>>;
  if (!Array.isArray(results)) return [];

  return results.map((r) => ({
    keyword: (r.keyword as string) || "",
    position: (r.position as number) ?? null,
  }));
}
