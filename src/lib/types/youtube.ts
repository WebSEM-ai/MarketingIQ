export interface YouTubeVideo {
  position: number;
  id: string;
  title: string;
  link: string;
  description?: string;
  views: number | null;
  channel: {
    id: string;
    title: string;
    link?: string;
    thumbnail?: string;
    isVerified?: boolean;
  };
  length?: string;
  publishedTime?: string;
  badges?: string[];
  thumbnail?: {
    static?: string;
    rich?: string;
  };
}

export interface YouTubeChannel {
  id: string;
  title: string;
  link?: string;
  thumbnail?: string;
  description?: string;
  subscribers?: string;
  videoCount?: number;
  isVerified?: boolean;
}

export interface YouTubeShort {
  id: string;
  title: string;
  link: string;
  views: number | null;
  thumbnail?: string;
}

export interface VideoRanking {
  keyword: string;
  position: number | null;
}

export interface YouTubeAnalysis {
  query: string;
  country: string;
  videos: YouTubeVideo[];
  channels: YouTubeChannel[];
  shorts: YouTubeShort[];
  aiInsights?: string;
}
