// Types pour le module Base Donateurs

export type DonorStatus = "ACTIVE" | "INACTIVE" | "LAPSED" | "DECEASED" | "DO_NOT_CONTACT" | "PENDING";

export type DonorType = "INDIVIDUAL" | "CORPORATE" | "FOUNDATION" | "GOVERNMENT" | "ANONYMOUS";

export type CommunicationChannel = "EMAIL" | "PHONE" | "SMS" | "MAIL" | "SOCIAL_MEDIA";

export type CommunicationFrequency = "WEEKLY" | "BIWEEKLY" | "MONTHLY" | "QUARTERLY" | "YEARLY" | "NEVER";

export interface DonorPreference {
  id: string;
  preferredChannel: CommunicationChannel;
  preferredFrequency: CommunicationFrequency;
  preferredLanguage: string;
  causesOfInterest: string[];
  preferredAmount?: number;
  birthday?: string;
  anniversary?: string;
}

export interface Donor {
  id: string;
  createdAt: string;
  updatedAt: string;
  
  // Informations personnelles
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  mobile?: string;
  dateOfBirth?: string;
  
  // Adresse
  address?: string;
  address2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country: string;
  
  // Données professionnelles
  profession?: string;
  employer?: string;
  jobTitle?: string;
  industry?: string;
  
  // Statut et classification
  status: DonorStatus;
  donorType: DonorType;
  segment?: string;
  tags: string[];
  
  // Métriques
  totalDonations: number;
  donationCount: number;
  averageDonation: number;
  highestDonation: number;
  lastDonationDate?: string;
  firstDonationDate?: string;
  
  // Notes
  notes?: string;
  source?: string;
  
  // Conformité
  consentEmail: boolean;
  consentPhone: boolean;
  consentMail: boolean;
  consentDate?: string;
  optOutDate?: string;
  
  // Relations
  preferences?: DonorPreference;
  _count?: {
    donations: number;
  };
}

export interface DonorFormData {
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  mobile?: string;
  dateOfBirth?: string;
  address?: string;
  address2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country: string;
  profession?: string;
  employer?: string;
  jobTitle?: string;
  industry?: string;
  status: DonorStatus;
  donorType: DonorType;
  segment?: string;
  tags: string[];
  notes?: string;
  source?: string;
  consentEmail: boolean;
  consentPhone: boolean;
  consentMail: boolean;
  preferences?: {
    preferredChannel: CommunicationChannel;
    preferredFrequency: CommunicationFrequency;
    preferredLanguage: string;
    causesOfInterest: string[];
  };
}

export interface DonorSearchFilters {
  query?: string;
  status?: DonorStatus[];
  donorType?: DonorType[];
  segment?: string[];
  city?: string;
  state?: string;
  country?: string;
  minTotalDonations?: number;
  maxTotalDonations?: number;
  minDonationCount?: number;
  lastDonationAfter?: string;
  lastDonationBefore?: string;
  createdAfter?: string;
  createdBefore?: string;
  hasEmailConsent?: boolean;
  tags?: string[];
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface DonorStats {
  overview: {
    totalDonors: number;
    activeDonors: number;
    inactiveDonors: number;
    lapsedDonors: number;
    newDonorsThisMonth: number;
    newDonorsLastMonth: number;
    growthRate: number;
  };
  byType: Array<{ type: DonorType; count: number }>;
  bySegment: Array<{ segment: string; count: number }>;
  donations: {
    totalAmount: number;
    averagePerDonor: number;
    averageDonation: number;
    highestDonation: number;
  };
  consent: {
    email: number;
    phone: number;
    mail: number;
    emailRate: number;
    phoneRate: number;
    mailRate: number;
  };
  topDonors: Array<{
    id: string;
    firstName: string;
    lastName: string;
    email?: string;
    totalDonations: number;
    donationCount: number;
    lastDonationDate?: string;
  }>;
  recentDonors: Array<{
    id: string;
    firstName: string;
    lastName: string;
    email?: string;
    createdAt: string;
    source?: string;
  }>;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
