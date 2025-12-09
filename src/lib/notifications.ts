import { prisma } from "@/lib/prisma";

type NotificationType = 
  | "NEW_DONATION"
  | "MAJOR_DONATION"
  | "RECURRING_CANCELLED"
  | "RECURRING_FAILED"
  | "NEW_DONOR"
  | "DONOR_MILESTONE"
  | "DONOR_INACTIVE"
  | "CAMPAIGN_GOAL_50"
  | "CAMPAIGN_GOAL_75"
  | "CAMPAIGN_GOAL_100"
  | "CAMPAIGN_ENDING"
  | "CAMPAIGN_ENDED"
  | "FORM_SUBMISSION"
  | "FORM_ERROR"
  | "EMAIL_BOUNCED"
  | "EMAIL_CAMPAIGN_SENT"
  | "EMAIL_LOW_OPEN_RATE"
  | "P2P_NEW_FUNDRAISER"
  | "P2P_GOAL_REACHED"
  | "SYSTEM_ALERT"
  | "SYSTEM_INFO";

type NotificationCategory = 
  | "DONATIONS"
  | "DONORS"
  | "CAMPAIGNS"
  | "FORMS"
  | "EMAILS"
  | "P2P"
  | "SYSTEM";

type NotificationPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

interface CreateNotificationParams {
  type: NotificationType;
  category: NotificationCategory;
  priority?: NotificationPriority;
  title: string;
  message: string;
  actionUrl?: string;
  actionLabel?: string;
  metadata?: Record<string, unknown>;
  donorId?: string;
  campaignId?: string;
  donationId?: string;
  formId?: string;
  userId?: number;
}

export async function createNotification(params: CreateNotificationParams) {
  try {
    const notification = await prisma.notification.create({
      data: {
        type: params.type,
        category: params.category,
        priority: params.priority || "MEDIUM",
        title: params.title,
        message: params.message,
        actionUrl: params.actionUrl,
        actionLabel: params.actionLabel,
        metadata: params.metadata ? JSON.stringify(params.metadata) : null,
        donorId: params.donorId,
        campaignId: params.campaignId,
        donationId: params.donationId,
        formId: params.formId,
        userId: params.userId,
      },
    });
    return notification;
  } catch (error) {
    console.error("Error creating notification:", error);
    return null;
  }
}

// Notifications pour les dons
export async function notifyNewDonation(donation: {
  id: string;
  amount: number;
  donorName: string;
  donorId?: string;
  campaignName?: string;
  isRecurring?: boolean;
}) {
  const isMajor = donation.amount >= 1000;
  
  return createNotification({
    type: isMajor ? "MAJOR_DONATION" : "NEW_DONATION",
    category: "DONATIONS",
    priority: isMajor ? "HIGH" : "MEDIUM",
    title: isMajor ? "Don majeur reçu !" : "Nouveau don reçu",
    message: `${donation.donorName} a fait un don de ${donation.amount.toLocaleString("fr-CA", { style: "currency", currency: "CAD" })}${donation.campaignName ? ` pour ${donation.campaignName}` : ""}${donation.isRecurring ? " (récurrent)" : ""}`,
    actionUrl: `/donors/${donation.donorId}`,
    actionLabel: "Voir le donateur",
    donorId: donation.donorId,
    donationId: donation.id,
    metadata: {
      amount: donation.amount,
      isRecurring: donation.isRecurring,
      campaignName: donation.campaignName,
    },
  });
}

// Notifications pour les donateurs
export async function notifyNewDonor(donor: {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
}) {
  return createNotification({
    type: "NEW_DONOR",
    category: "DONORS",
    priority: "LOW",
    title: "Nouveau donateur",
    message: `${donor.firstName} ${donor.lastName} vient de rejoindre votre base de donateurs`,
    actionUrl: `/donors/${donor.id}`,
    actionLabel: "Voir le profil",
    donorId: donor.id,
  });
}

export async function notifyDonorMilestone(donor: {
  id: string;
  firstName: string;
  lastName: string;
  totalDonated: number;
  milestone: number;
}) {
  return createNotification({
    type: "DONOR_MILESTONE",
    category: "DONORS",
    priority: "MEDIUM",
    title: "Jalon atteint !",
    message: `${donor.firstName} ${donor.lastName} a atteint ${donor.milestone.toLocaleString("fr-CA", { style: "currency", currency: "CAD" })} de dons cumulés`,
    actionUrl: `/donors/${donor.id}`,
    actionLabel: "Voir le profil",
    donorId: donor.id,
    metadata: {
      totalDonated: donor.totalDonated,
      milestone: donor.milestone,
    },
  });
}

// Notifications pour les campagnes
export async function notifyCampaignProgress(campaign: {
  id: string;
  name: string;
  goalAmount: number;
  totalRaised: number;
  progress: number;
}) {
  let type: NotificationType;
  let title: string;
  let priority: NotificationPriority = "MEDIUM";

  if (campaign.progress >= 100) {
    type = "CAMPAIGN_GOAL_100";
    title = "Objectif atteint !";
    priority = "HIGH";
  } else if (campaign.progress >= 75) {
    type = "CAMPAIGN_GOAL_75";
    title = "75% de l'objectif atteint";
  } else if (campaign.progress >= 50) {
    type = "CAMPAIGN_GOAL_50";
    title = "50% de l'objectif atteint";
  } else {
    return null;
  }

  return createNotification({
    type,
    category: "CAMPAIGNS",
    priority,
    title,
    message: `La campagne "${campaign.name}" a atteint ${campaign.progress.toFixed(0)}% de son objectif (${campaign.totalRaised.toLocaleString("fr-CA", { style: "currency", currency: "CAD" })} / ${campaign.goalAmount.toLocaleString("fr-CA", { style: "currency", currency: "CAD" })})`,
    actionUrl: `/campaigns/${campaign.id}`,
    actionLabel: "Voir la campagne",
    campaignId: campaign.id,
    metadata: {
      progress: campaign.progress,
      totalRaised: campaign.totalRaised,
      goalAmount: campaign.goalAmount,
    },
  });
}

export async function notifyCampaignEnding(campaign: {
  id: string;
  name: string;
  endDate: Date;
  daysRemaining: number;
}) {
  return createNotification({
    type: "CAMPAIGN_ENDING",
    category: "CAMPAIGNS",
    priority: campaign.daysRemaining <= 3 ? "HIGH" : "MEDIUM",
    title: "Campagne se termine bientôt",
    message: `La campagne "${campaign.name}" se termine dans ${campaign.daysRemaining} jour(s)`,
    actionUrl: `/campaigns/${campaign.id}`,
    actionLabel: "Voir la campagne",
    campaignId: campaign.id,
    metadata: {
      endDate: campaign.endDate,
      daysRemaining: campaign.daysRemaining,
    },
  });
}

// Notifications pour les emails
export async function notifyEmailCampaignSent(emailCampaign: {
  id: string;
  name: string;
  recipientCount: number;
}) {
  return createNotification({
    type: "EMAIL_CAMPAIGN_SENT",
    category: "EMAILS",
    priority: "LOW",
    title: "Campagne email envoyée",
    message: `La campagne "${emailCampaign.name}" a été envoyée à ${emailCampaign.recipientCount} destinataires`,
    actionUrl: `/emails/${emailCampaign.id}`,
    actionLabel: "Voir les statistiques",
    metadata: {
      recipientCount: emailCampaign.recipientCount,
    },
  });
}

// Notifications système
export async function notifySystemAlert(alert: {
  title: string;
  message: string;
  priority?: NotificationPriority;
}) {
  return createNotification({
    type: "SYSTEM_ALERT",
    category: "SYSTEM",
    priority: alert.priority || "HIGH",
    title: alert.title,
    message: alert.message,
  });
}

// Vérifier et créer des notifications pour les donateurs inactifs
export async function checkInactiveDonors() {
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const inactiveDonors = await prisma.donor.findMany({
    where: {
      status: "ACTIVE",
      lastDonationDate: { lt: sixMonthsAgo },
      totalDonated: { gte: 100 },
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      totalDonated: true,
      lastDonationDate: true,
    },
    take: 10,
  });

  if (inactiveDonors.length > 0) {
    return createNotification({
      type: "DONOR_INACTIVE",
      category: "DONORS",
      priority: "MEDIUM",
      title: "Donateurs inactifs à relancer",
      message: `${inactiveDonors.length} donateur(s) avec un historique de dons significatif n'ont pas donné depuis plus de 6 mois`,
      actionUrl: "/donors?status=inactive",
      actionLabel: "Voir les donateurs",
      metadata: {
        count: inactiveDonors.length,
        totalValue: inactiveDonors.reduce((sum, d) => sum + d.totalDonated, 0),
      },
    });
  }

  return null;
}
