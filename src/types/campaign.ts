export type CampaignType =
  | "FUNDRAISING"
  | "ANNUAL_FUND"
  | "CAPITAL"
  | "EMERGENCY"
  | "EVENT"
  | "PEER_TO_PEER"
  | "CROWDFUNDING"
  | "MATCHING"
  | "PLANNED_GIVING";

export type CampaignStatus =
  | "DRAFT"
  | "SCHEDULED"
  | "ACTIVE"
  | "PAUSED"
  | "COMPLETED"
  | "CANCELLED"
  | "ARCHIVED";

export type CampaignPriority = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export type DonorLevel =
  | "SUPPORTER"
  | "CONTRIBUTOR"
  | "PATRON"
  | "BENEFACTOR"
  | "CHAMPION"
  | "VISIONARY";

export interface CampaignMilestone {
  id: string;
  title: string;
  description?: string;
  targetAmount?: number;
  targetDate?: string;
  isCompleted: boolean;
  completedAt?: string;
  actualAmount?: number;
  sortOrder: number;
  icon?: string;
  color?: string;
}

export interface CampaignDonor {
  id: string;
  totalDonated: number;
  donationCount: number;
  firstDonationDate?: string;
  lastDonationDate?: string;
  largestDonation: number;
  donorLevel: DonorLevel;
  isRecurring: boolean;
  isMajorDonor: boolean;
  notes?: string;
  donorId: string;
}

export interface CampaignUpdate {
  id: string;
  title: string;
  content: string;
  imageUrl?: string;
  videoUrl?: string;
  isPublished: boolean;
  publishedAt?: string;
  viewCount: number;
  shareCount: number;
}

export interface CampaignTeamMember {
  id: string;
  name: string;
  role?: string;
  email?: string;
  phone?: string;
  photoUrl?: string;
  bio?: string;
  personalGoal?: number;
  totalRaised: number;
  donorCount: number;
  sortOrder: number;
  isVisible: boolean;
}

export interface Campaign {
  id: string;
  createdAt: string;
  updatedAt: string;
  name: string;
  slug: string;
  description?: string;
  shortDescription?: string;
  campaignType: CampaignType;
  status: CampaignStatus;
  priority: CampaignPriority;
  startDate?: string;
  endDate?: string;
  launchDate?: string;
  goalAmount?: number;
  minimumGoal?: number;
  stretchGoal?: number;
  totalRaised: number;
  donationCount: number;
  donorCount: number;
  averageDonation: number;
  largestDonation: number;
  conversionRate: number;
  primaryColor: string;
  secondaryColor: string;
  logoUrl?: string;
  bannerUrl?: string;
  thumbnailUrl?: string;
  thankYouMessage?: string;
  impactStatement?: string;
  metaTitle?: string;
  metaDescription?: string;
  ogImage?: string;
  isPublic: boolean;
  allowP2P: boolean;
  enableMatching: boolean;
  matchingRatio?: number;
  matchingCap?: number;
  category?: string;
  tags: string[];
  milestones?: CampaignMilestone[];
  donors?: CampaignDonor[];
  updates?: CampaignUpdate[];
  team?: CampaignTeamMember[];
  _count?: {
    donors: number;
    forms: number;
    updates: number;
    team: number;
  };
  progress?: number;
  daysRemaining?: number | null;
}

export interface CampaignFormData {
  name: string;
  description?: string;
  shortDescription?: string;
  campaignType: CampaignType;
  status: CampaignStatus;
  priority: CampaignPriority;
  startDate?: string;
  endDate?: string;
  launchDate?: string;
  goalAmount?: number;
  minimumGoal?: number;
  stretchGoal?: number;
  primaryColor: string;
  secondaryColor: string;
  logoUrl?: string;
  bannerUrl?: string;
  thumbnailUrl?: string;
  thankYouMessage?: string;
  impactStatement?: string;
  isPublic: boolean;
  allowP2P: boolean;
  enableMatching: boolean;
  matchingRatio?: number;
  matchingCap?: number;
  category?: string;
  tags: string[];
}

export const CAMPAIGN_TYPE_LABELS: Record<CampaignType, string> = {
  FUNDRAISING: "Collecte générale",
  ANNUAL_FUND: "Campagne annuelle",
  CAPITAL: "Campagne de capital",
  EMERGENCY: "Urgence/Crise",
  EVENT: "Événement",
  PEER_TO_PEER: "Peer-to-Peer",
  CROWDFUNDING: "Financement participatif",
  MATCHING: "Campagne avec matching",
  PLANNED_GIVING: "Dons planifiés",
};

export const CAMPAIGN_STATUS_LABELS: Record<CampaignStatus, string> = {
  DRAFT: "Brouillon",
  SCHEDULED: "Planifiée",
  ACTIVE: "Active",
  PAUSED: "En pause",
  COMPLETED: "Terminée",
  CANCELLED: "Annulée",
  ARCHIVED: "Archivée",
};

export const CAMPAIGN_PRIORITY_LABELS: Record<CampaignPriority, string> = {
  LOW: "Basse",
  MEDIUM: "Moyenne",
  HIGH: "Haute",
  CRITICAL: "Critique",
};

export const DONOR_LEVEL_LABELS: Record<DonorLevel, string> = {
  SUPPORTER: "Supporteur",
  CONTRIBUTOR: "Contributeur",
  PATRON: "Patron",
  BENEFACTOR: "Bienfaiteur",
  CHAMPION: "Champion",
  VISIONARY: "Visionnaire",
};
