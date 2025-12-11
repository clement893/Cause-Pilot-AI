import { prisma } from "@/lib/prisma";

// Types pour les configurations
interface EmailConfig {
  templateId?: string;
  subject: string;
  body: string;
  fromName?: string;
}

interface WaitConfig {
  days?: number;
  hours?: number;
  minutes?: number;
}

interface TagConfig {
  tag: string;
}

interface NotifyConfig {
  message: string;
  notifyOwner?: boolean;
}

// Exécuter une automatisation pour un donateur
export async function executeAutomation(
  automationId: string,
  context: {
    donorId?: string;
    donationId?: string;
    campaignId?: string;
  }
) {
  const automation = await prisma.automation.findUnique({
    where: { id: automationId },
    include: {
      actions: {
        where: { parentActionId: null },
        orderBy: { order: "asc" },
      },
    },
  });

  if (!automation || automation.status !== "ACTIVE") {
    return null;
  }

  // Créer l'exécution
  const execution = await prisma.automationExecution.create({
    data: {
      automationId,
      donorId: context.donorId,
      donationId: context.donationId,
      campaignId: context.campaignId,
      status: "RUNNING",
    },
  });

  try {
    // Exécuter chaque action
    const results: Record<string, unknown>[] = [];
    for (const action of automation.actions) {
      const result = await executeAction(action, context);
      results.push({ actionId: action.id, ...result });

      // Mettre à jour la progression
      await prisma.automationExecution.update({
        where: { id: execution.id },
        data: {
          actionsExecuted: { increment: 1 },
          currentActionOrder: action.order,
        },
      });

      // Si l'action est un WAIT, planifier la suite
      if (action.actionType === "WAIT") {
        const config = action.config as WaitConfig;
        const delayMs =
          (config.days || 0) * 86400000 +
          (config.hours || 0) * 3600000 +
          (config.minutes || 0) * 60000;

        await prisma.automationExecution.update({
          where: { id: execution.id },
          data: {
            status: "WAITING",
            scheduledFor: new Date(Date.now() + delayMs),
          },
        });
        return { execution, status: "WAITING" };
      }
    }

    // Marquer comme terminé
    await prisma.automationExecution.update({
      where: { id: execution.id },
      data: {
        status: "COMPLETED",
        completedAt: new Date(),
        results: JSON.parse(JSON.stringify(results)),
      },
    });

    // Mettre à jour les stats de l'automatisation
    await prisma.automation.update({
      where: { id: automationId },
      data: {
        totalExecutions: { increment: 1 },
        successfulExecutions: { increment: 1 },
        lastExecutedAt: new Date(),
      },
    });

    return { execution, status: "COMPLETED", results };
  } catch (error) {
    // Marquer comme échoué
    await prisma.automationExecution.update({
      where: { id: execution.id },
      data: {
        status: "FAILED",
        completedAt: new Date(),
        error: error instanceof Error ? error.message : "Erreur inconnue",
      },
    });

    await prisma.automation.update({
      where: { id: automationId },
      data: {
        totalExecutions: { increment: 1 },
        failedExecutions: { increment: 1 },
        lastExecutedAt: new Date(),
      },
    });

    throw error;
  }
}

// Exécuter une action spécifique
async function executeAction(
  action: { id: string; actionType: string; config: unknown },
  context: { donorId?: string; donationId?: string; campaignId?: string }
): Promise<{ success: boolean; message?: string }> {
  const config = action.config as Record<string, unknown>;

  switch (action.actionType) {
    case "SEND_EMAIL":
      return await sendEmail(config as unknown as EmailConfig, context);

    case "ADD_TAG":
      return await addTag(config as unknown as TagConfig, context);

    case "REMOVE_TAG":
      return await removeTag(config as unknown as TagConfig, context);

    case "NOTIFY_TEAM":
      return await notifyTeam(config as unknown as NotifyConfig, context);

    case "WAIT":
      return { success: true, message: "Attente planifiée" };

    default:
      return { success: true, message: `Action ${action.actionType} non implémentée` };
  }
}

// Actions spécifiques
async function sendEmail(
  config: EmailConfig,
  context: { donorId?: string }
): Promise<{ success: boolean; message?: string }> {
  if (!context.donorId) {
    return { success: false, message: "Pas de donateur spécifié" };
  }

  const donor = await prisma.donor.findUnique({
    where: { id: context.donorId },
  });

  if (!donor?.email) {
    return { success: false, message: "Donateur sans email" };
  }

  // Remplacer les variables dans le sujet et le corps
  const subject = replaceVariables(config.subject, donor);
  const body = replaceVariables(config.body, donor);

  // Envoyer l'email via l'API SendGrid existante
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || ""}/api/emails/send`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        to: donor.email,
        subject,
        html: body,
        fromName: config.fromName,
      }),
    });

    if (response.ok) {
      // Enregistrer la communication
      await prisma.communication.create({
        data: {
          donorId: context.donorId,
          type: "OTHER",
          channel: "EMAIL",
          subject,
          content: body,
          sentAt: new Date(),
          status: "SENT",
        },
      });

      return { success: true, message: "Email envoyé" };
    } else {
      return { success: false, message: "Échec de l'envoi" };
    }
  } catch {
    return { success: false, message: "Erreur lors de l'envoi" };
  }
}

async function addTag(
  config: TagConfig,
  context: { donorId?: string }
): Promise<{ success: boolean; message?: string }> {
  if (!context.donorId) {
    return { success: false, message: "Pas de donateur spécifié" };
  }

  const donor = await prisma.donor.findUnique({
    where: { id: context.donorId },
  });

  if (!donor) {
    return { success: false, message: "Donateur non trouvé" };
  }

  const currentTags = donor.tags || [];
  if (!currentTags.includes(config.tag)) {
    await prisma.donor.update({
      where: { id: context.donorId },
      data: {
        tags: [...currentTags, config.tag],
      },
    });
  }

  return { success: true, message: `Tag "${config.tag}" ajouté` };
}

async function removeTag(
  config: TagConfig,
  context: { donorId?: string }
): Promise<{ success: boolean; message?: string }> {
  if (!context.donorId) {
    return { success: false, message: "Pas de donateur spécifié" };
  }

  const donor = await prisma.donor.findUnique({
    where: { id: context.donorId },
  });

  if (!donor) {
    return { success: false, message: "Donateur non trouvé" };
  }

  const currentTags = donor.tags || [];
  await prisma.donor.update({
    where: { id: context.donorId },
    data: {
      tags: currentTags.filter((t) => t !== config.tag),
    },
  });

  return { success: true, message: `Tag "${config.tag}" retiré` };
}

async function notifyTeam(
  config: NotifyConfig,
  context: { donorId?: string }
): Promise<{ success: boolean; message?: string }> {
  let message = config.message;

  if (context.donorId) {
    const donor = await prisma.donor.findUnique({
      where: { id: context.donorId },
    });
    if (donor) {
      message = replaceVariables(message, donor);
    }
  }

  // Créer une notification
  await prisma.notification.create({
    data: {
      type: "SYSTEM_ALERT",
      category: "SYSTEM",
      title: "Automatisation",
      message,
      priority: "MEDIUM",
    },
  });

  return { success: true, message: "Équipe notifiée" };
}

// Remplacer les variables dans un texte
function replaceVariables(
  text: string,
  donor: { firstName: string; lastName: string; email?: string | null; totalDonations?: number }
): string {
  return text
    .replace(/\{\{firstName\}\}/g, donor.firstName)
    .replace(/\{\{lastName\}\}/g, donor.lastName)
    .replace(/\{\{email\}\}/g, donor.email || "")
    .replace(/\{\{fullName\}\}/g, `${donor.firstName} ${donor.lastName}`)
    .replace(/\{\{totalDonations\}\}/g, donor.totalDonations?.toFixed(2) || "0");
}

// Vérifier et exécuter les triggers automatiques
export async function checkAndExecuteTriggers() {
  const now = new Date();

  // 1. Vérifier les donateurs inactifs
  await checkInactiveDonors();

  // 2. Vérifier les anniversaires de don
  await checkDonationAnniversaries();

  // 3. Vérifier les anniversaires de donateurs
  await checkDonorBirthdays();

  // 4. Vérifier les opportunités d'upgrade
  await checkUpgradeOpportunities();

  // 5. Reprendre les exécutions en attente
  await resumeWaitingExecutions(now);
}

async function checkInactiveDonors() {
  const automations = await prisma.automation.findMany({
    where: {
      status: "ACTIVE",
      triggerType: "INACTIVE_DONOR",
    },
  });

  for (const automation of automations) {
    const config = automation.triggerConfig as { inactiveDays?: number } | null;
    const inactiveDays = config?.inactiveDays || 180;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - inactiveDays);

    const inactiveDonors = await prisma.donor.findMany({
      where: {
        status: "ACTIVE",
        lastDonationDate: {
          lt: cutoffDate,
        },
        // Éviter de relancer plusieurs fois
        NOT: {
          tags: {
            has: `automation_inactive_${automation.id}`,
          },
        },
      },
      take: 50,
    });

    for (const donor of inactiveDonors) {
      await executeAutomation(automation.id, { donorId: donor.id });
      // Marquer comme traité
      await prisma.donor.update({
        where: { id: donor.id },
        data: {
          tags: [...(donor.tags || []), `automation_inactive_${automation.id}`],
        },
      });
    }
  }
}

async function checkDonationAnniversaries() {
  const automations = await prisma.automation.findMany({
    where: {
      status: "ACTIVE",
      triggerType: "DONATION_ANNIVERSARY",
    },
  });

  const today = new Date();
  const oneYearAgo = new Date(today);
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

  for (const automation of automations) {
    const donations = await prisma.donation.findMany({
      where: {
        donationDate: {
          gte: new Date(oneYearAgo.setHours(0, 0, 0, 0)),
          lt: new Date(oneYearAgo.setHours(23, 59, 59, 999)),
        },
        status: "COMPLETED",
      },
      include: {
        donor: true,
      },
      take: 50,
    });

    for (const donation of donations) {
      await executeAutomation(automation.id, {
        donorId: donation.donorId,
        donationId: donation.id,
      });
    }
  }
}

async function checkDonorBirthdays() {
  const automations = await prisma.automation.findMany({
    where: {
      status: "ACTIVE",
      triggerType: "DONOR_BIRTHDAY",
    },
  });

  const today = new Date();
  const month = today.getMonth() + 1;
  const day = today.getDate();

  for (const automation of automations) {
    const donors = await prisma.donor.findMany({
      where: {
        dateOfBirth: {
          not: null,
        },
        status: "ACTIVE",
      },
    });

    // Filtrer par jour/mois d'anniversaire
    const birthdayDonors = donors.filter((donor) => {
      if (!donor.dateOfBirth) return false;
      const dob = new Date(donor.dateOfBirth);
      return dob.getMonth() + 1 === month && dob.getDate() === day;
    });

    for (const donor of birthdayDonors) {
      await executeAutomation(automation.id, { donorId: donor.id });
    }
  }
}

async function checkUpgradeOpportunities() {
  const automations = await prisma.automation.findMany({
    where: {
      status: "ACTIVE",
      triggerType: "UPGRADE_OPPORTUNITY",
    },
  });

  for (const automation of automations) {
    const config = automation.triggerConfig as { minDonations?: number } | null;
    const minDonations = config?.minDonations || 3;

    // Trouver les donateurs avec X+ dons ponctuels mais pas de don récurrent
    const donors = await prisma.donor.findMany({
      where: {
        donationCount: {
          gte: minDonations,
        },
        status: "ACTIVE",
        NOT: {
          tags: {
            has: `automation_upgrade_${automation.id}`,
          },
        },
      },
      take: 50,
    });

    // Vérifier qu'ils n'ont pas de don récurrent
    for (const donor of donors) {
      const hasRecurring = await prisma.donation.findFirst({
        where: {
          donorId: donor.id,
          isRecurring: true,
          status: "COMPLETED",
        },
      });

      if (!hasRecurring) {
        await executeAutomation(automation.id, { donorId: donor.id });
        // Marquer comme traité
        await prisma.donor.update({
          where: { id: donor.id },
          data: {
            tags: [...(donor.tags || []), `automation_upgrade_${automation.id}`],
          },
        });
      }
    }
  }
}

async function resumeWaitingExecutions(now: Date) {
  const waitingExecutions = await prisma.automationExecution.findMany({
    where: {
      status: "WAITING",
      scheduledFor: {
        lte: now,
      },
    },
    include: {
      automation: {
        include: {
          actions: {
            orderBy: { order: "asc" },
          },
        },
      },
    },
  });

  for (const execution of waitingExecutions) {
    // Reprendre l'exécution à partir de l'action suivante
    const remainingActions = execution.automation.actions.filter(
      (a) => a.order > execution.currentActionOrder
    );

    if (remainingActions.length === 0) {
      await prisma.automationExecution.update({
        where: { id: execution.id },
        data: {
          status: "COMPLETED",
          completedAt: new Date(),
        },
      });
      continue;
    }

    await prisma.automationExecution.update({
      where: { id: execution.id },
      data: { status: "RUNNING" },
    });

    // Continuer l'exécution...
    // (logique similaire à executeAutomation)
  }
}

// Déclencher une automatisation après un événement
export async function triggerAutomation(
  triggerType: string,
  context: {
    donorId?: string;
    donationId?: string;
    campaignId?: string;
  }
) {
  const automations = await prisma.automation.findMany({
    where: {
      status: "ACTIVE",
      triggerType: triggerType as never,
    },
  });

  for (const automation of automations) {
    await executeAutomation(automation.id, context);
  }
}
