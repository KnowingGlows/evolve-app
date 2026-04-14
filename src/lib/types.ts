export interface User {
  uid: string;
  email: string;
  displayName: string;
  brands: string[];
  createdAt: string;
}

export interface Brand {
  id: string;
  name: string;
  ownerId: string;
  members: BrandMember[];
  team: TeamMember[];
  settings: BrandSettings;
  createdAt: string;
}

export interface BrandMember {
  userId: string;
  email: string;
  role: "owner" | "editor" | "viewer";
}

export interface TeamMember {
  role: string;
  name: string;
}

export interface BrandSettings {
  adHitRate: string;
  researchDocUrl: string;
}

export interface CreativeEntry {
  id: string;
  status: "Idea" | "Testing" | "Learning" | "Done";
  batch: string;
  author: string;
  concept: string;
  desire: string;
  angle: string;
  hypothesis: string;
  format: "Static" | "Video" | "Carousel" | "UGC";
  type: "Ideation" | "Iteration" | "Scale";
  result: "" | "Winning" | "Losing" | "Learning";
  brief: string;
  adLink: string;
  variable: string;
  learnings: string;
  createdAt: string;
}

export interface AdsLogEntry {
  id: string;
  date: string;
  note: string;
  isRecap?: boolean;
}

export interface CroEntry {
  id: string;
  status: "Idea" | "Testing" | "Done";
  date: string;
  author: string;
  concept: string;
  explanation: string;
  url: string;
  coupon: string;
  offer: string;
  sellingPoint: string;
  avatar: string;
  result: "" | "Winning" | "Losing";
  testStart: string;
  learnings: string;
  createdAt: string;
}

export interface DesireEntry {
  id: string;
  text: string;
  createdAt: string;
}

export interface AngleEntry {
  id: string;
  product: string;
  feature: string;
  benefit: string;
  desire: string;
  subAvatar: string;
  angle: string;
  createdAt: string;
}

export interface AvatarEntry {
  id: string;
  name: string;
  desc: string;
  createdAt: string;
}

export interface AwarenessEntry {
  id: string;
  product: string;
  most: string;
  productAware: string;
  solution: string;
  problem: string;
  unaware: string;
  createdAt: string;
}

export interface CreatorEntry {
  id: string;
  name: string;
  audience: string;
  youtube: string;
  tiktok: string;
  instagram: string;
  trends: string;
  notes: string;
  createdAt: string;
}

export interface CroRoadmapEntry {
  id: string;
  status: "Idea" | "In Progress" | "Done";
  page: string;
  author: string;
  concept: string;
  explanation: string;
  adLink: string;
  offer: string;
  createdAt: string;
}

export interface CalendarData {
  id: string;
  year: number;
  grossProfitMargin: number;
  targetMER: number;
  targetYearlyRevenue: number;
  targetYearlySpend: number;
  months: Record<string, MonthData>;
  events: CalendarEvents;
}

export interface MonthData {
  targetRevenuePercent: number;
  targetRevenue: number;
  actualRevenue: number;
  targetSpend: number;
  actualSpend: number;
  targetMER: number;
}

export interface CalendarEvents {
  keyEvents: string[];
  salesPromos: string[];
  winningAds: string[];
  winningLPs: string[];
  productLaunches: string[];
}
