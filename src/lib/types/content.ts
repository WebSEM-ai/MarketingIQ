export interface ContentInput {
  business: string;
  audience: string;
  goals: string;
  competitors?: string;
  existingContent?: string;
}

export interface CalendarItem {
  week: number;
  title: string;
  type: "blog" | "social" | "video" | "email" | "landing" | "infographic";
  topic: string;
  keywords: string[];
  channel: string;
  goal: string;
}

export interface TopicCluster {
  pillar: string;
  subtopics: string[];
  contentTypes: string[];
  priority: "high" | "medium" | "low";
}

export interface GapItem {
  area: string;
  description: string;
  opportunity: string;
  priority: "high" | "medium" | "low";
}

export interface ContentStrategy {
  input: ContentInput;
  calendar: CalendarItem[];
  clusters: TopicCluster[];
  gaps: GapItem[];
  aiStrategy?: string;
}
