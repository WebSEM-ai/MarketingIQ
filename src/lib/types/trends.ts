export interface TrendQuery {
  query: string;
  timeframe: string;
  country: string;
}

export interface TimelinePoint {
  date: string;
  timestamp: string;
  value: number;
}

export interface InterestData {
  query: string;
  timeframe: string;
  country: string;
  timeline: TimelinePoint[];
}

export interface RelatedQuery {
  position: number;
  query: string;
  value: number;
  type: "top" | "rising";
}

export interface RelatedTopic {
  title: string;
  type: string;
  value: number;
  category: "top" | "rising";
}

export interface RegionInterest {
  name: string;
  value: number;
}

export interface TrendAnalysis {
  query: string;
  interest: InterestData;
  relatedQueries: RelatedQuery[];
  relatedTopics: RelatedTopic[];
  regions: RegionInterest[];
  aiInsights?: string;
}
