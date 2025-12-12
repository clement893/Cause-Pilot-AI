import { NextRequest, NextResponse } from "next/server";
import { auth, isSuperAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/super-admin/stats - Statistiques globales de la plateforme
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Non authentifié" },
        { status: 401 }
      );
    }

    // Seuls les super admins peuvent voir les stats globales
    const isSuper = await isSuperAdmin(session.user.id);
    if (!isSuper) {
      return NextResponse.json(
        { success: false, error: "Accès refusé" },
        { status: 403 }
      );
    }

    // Statistiques des organisations
    const [
      totalOrganizations,
      activeOrganizations,
      organizationsByPlan,
      organizationsByStatus,
    ] = await Promise.all([
      prisma.organization.count(),
      prisma.organization.count({ where: { status: "ACTIVE" } }),
      prisma.organization.groupBy({
        by: ["plan"],
        _count: { plan: true },
      }),
      prisma.organization.groupBy({
        by: ["status"],
        _count: { status: true },
      }),
    ]);

    // Statistiques des utilisateurs admin
    const [
      totalAdminUsers,
      activeAdminUsers,
      adminUsersByRole,
    ] = await Promise.all([
      prisma.adminUser.count(),
      prisma.adminUser.count({ where: { status: "ACTIVE" } }),
      prisma.adminUser.groupBy({
        by: ["role"],
        _count: { role: true },
      }),
    ]);

    // Statistiques des donateurs et dons (globales)
    const [
      totalDonors,
      totalDonations,
      donationStats,
    ] = await Promise.all([
      prisma.donor.count(),
      prisma.donation.count(),
      prisma.donation.aggregate({
        _sum: { amount: true },
        _avg: { amount: true },
        _max: { amount: true },
      }),
    ]);

    // Statistiques des campagnes
    const [
      totalCampaigns,
      activeCampaigns,
    ] = await Promise.all([
      prisma.campaign.count(),
      prisma.campaign.count({ where: { status: "ACTIVE" } }),
    ]);

    // Organisations récentes
    const recentOrganizations = await prisma.organization.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        slug: true,
        plan: true,
        status: true,
        createdAt: true,
      },
    });

    // Activité récente (audit logs)
    const recentActivity = await prisma.adminAuditLog.findMany({
      take: 10,
      orderBy: { createdAt: "desc" },
      include: {
        adminUser: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        organizations: {
          total: totalOrganizations,
          active: activeOrganizations,
          byPlan: organizationsByPlan.reduce((acc, item) => {
            acc[item.plan] = item._count.plan;
            return acc;
          }, {} as Record<string, number>),
          byStatus: organizationsByStatus.reduce((acc, item) => {
            acc[item.status] = item._count.status;
            return acc;
          }, {} as Record<string, number>),
        },
        adminUsers: {
          total: totalAdminUsers,
          active: activeAdminUsers,
          byRole: adminUsersByRole.reduce((acc, item) => {
            acc[item.role] = item._count.role;
            return acc;
          }, {} as Record<string, number>),
        },
        donors: {
          total: totalDonors,
        },
        donations: {
          total: totalDonations,
          totalAmount: donationStats._sum.amount || 0,
          averageAmount: donationStats._avg.amount || 0,
          maxAmount: donationStats._max.amount || 0,
        },
        campaigns: {
          total: totalCampaigns,
          active: activeCampaigns,
        },
        recentOrganizations,
        recentActivity,
      },
    });
  } catch (error) {
    console.error("Error fetching stats:", error);
    return NextResponse.json(
      { success: false, error: "Erreur lors de la récupération des statistiques" },
      { status: 500 }
    );
  }
}
