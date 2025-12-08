export type FormType = "ONE_TIME" | "RECURRING" | "TICKETING" | "IN_MEMORIAM" | "PEER_TO_PEER" | "PLEDGE";
export type FormStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED" | "SCHEDULED";
export type RecurringFrequency = "WEEKLY" | "BIWEEKLY" | "MONTHLY" | "QUARTERLY" | "YEARLY";
export type FormFieldType = "TEXT" | "EMAIL" | "PHONE" | "NUMBER" | "TEXTAREA" | "SELECT" | "RADIO" | "CHECKBOX" | "DATE" | "HIDDEN";
export type FieldWidth = "FULL" | "HALF" | "THIRD";
export type PaymentStatus = "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED" | "REFUNDED" | "CANCELLED";

export interface DonationForm {
  id: string;
  createdAt: string;
  updatedAt: string;
  name: string;
  slug: string;
  description: string | null;
  formType: FormType;
  status: FormStatus;
  suggestedAmounts: number[];
  minimumAmount: number;
  maximumAmount: number | null;
  allowCustomAmount: boolean;
  defaultAmount: number | null;
  recurringOptions: RecurringFrequency[];
  defaultRecurring: RecurringFrequency | null;
  primaryColor: string;
  secondaryColor: string;
  logoUrl: string | null;
  bannerUrl: string | null;
  thankYouMessage: string | null;
  thankYouRedirectUrl: string | null;
  collectPhone: boolean;
  collectAddress: boolean;
  collectEmployer: boolean;
  collectComment: boolean;
  collectDedication: boolean;
  allowAnonymous: boolean;
  metaTitle: string | null;
  metaDescription: string | null;
  campaignId: string | null;
  campaignName: string | null;
  totalCollected: number;
  donationCount: number;
  averageDonation: number;
  startDate: string | null;
  endDate: string | null;
  goalAmount: number | null;
  fields?: FormField[];
  _count?: {
    submissions: number;
  };
}

export interface FormField {
  id: string;
  name: string;
  label: string;
  fieldType: FormFieldType;
  placeholder: string | null;
  helpText: string | null;
  defaultValue: string | null;
  options: string[];
  isRequired: boolean;
  minLength: number | null;
  maxLength: number | null;
  pattern: string | null;
  sortOrder: number;
  isVisible: boolean;
  width: FieldWidth;
  showIf: string | null;
  formId: string;
}

export interface DonationSubmission {
  id: string;
  createdAt: string;
  amount: number;
  currency: string;
  paymentStatus: PaymentStatus;
  transactionId: string | null;
  email: string;
  firstName: string;
  lastName: string;
  isRecurring: boolean;
  recurringFrequency: RecurringFrequency | null;
  isAnonymous: boolean;
  receiptNumber: string | null;
  formId: string;
  donorId: string | null;
  form?: {
    name: string;
    slug: string;
  };
  donor?: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

export interface FormCreateInput {
  name: string;
  description?: string;
  formType?: FormType;
  status?: FormStatus;
  suggestedAmounts?: number[];
  minimumAmount?: number;
  maximumAmount?: number;
  allowCustomAmount?: boolean;
  defaultAmount?: number;
  recurringOptions?: RecurringFrequency[];
  defaultRecurring?: RecurringFrequency;
  primaryColor?: string;
  secondaryColor?: string;
  logoUrl?: string;
  bannerUrl?: string;
  thankYouMessage?: string;
  thankYouRedirectUrl?: string;
  collectPhone?: boolean;
  collectAddress?: boolean;
  collectEmployer?: boolean;
  collectComment?: boolean;
  collectDedication?: boolean;
  allowAnonymous?: boolean;
  campaignId?: string;
  campaignName?: string;
  startDate?: string;
  endDate?: string;
  goalAmount?: number;
}

export const FORM_TYPE_LABELS: Record<FormType, string> = {
  ONE_TIME: "Don unique",
  RECURRING: "Don récurrent",
  TICKETING: "Billetterie",
  IN_MEMORIAM: "In Memoriam",
  PEER_TO_PEER: "Collecte P2P",
  PLEDGE: "Promesse de don",
};

export const FORM_STATUS_LABELS: Record<FormStatus, string> = {
  DRAFT: "Brouillon",
  PUBLISHED: "Publié",
  ARCHIVED: "Archivé",
  SCHEDULED: "Planifié",
};

export const FORM_STATUS_COLORS: Record<FormStatus, string> = {
  DRAFT: "bg-gray-100 text-gray-800",
  PUBLISHED: "bg-green-100 text-green-800",
  ARCHIVED: "bg-red-100 text-red-800",
  SCHEDULED: "bg-blue-100 text-blue-800",
};
