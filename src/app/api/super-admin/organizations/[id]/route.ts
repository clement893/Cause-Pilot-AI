import { NextRequest, NextResponse } from "next/server";
import { auth, isSuperAdmin, hasOrganizationAccess } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/super-admin/organizations/[id] - Détails d'une organisation
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Non authentifié" },
        { status: 401 }
      );
    }

    const { id } = await params;

    // Vérifier l'accès
    const hasAccess = await hasOrganizationAccess(session.user.id, id);
    if (!hasAccess) {
      return NextResponse.json(
        { success: false, error: "Accès refusé" },
        { status: 403 }
      );
    }

    const organization = await prisma.organization.findUnique({
      where: { id },
      include: {
        OrganizationMember: {
          include: {
            // Note: userId fait référence à User, pas AdminUser
          },
        },
        AdminOrganizationAccess: {
          include: {
            AdminUser: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true,
                status: true,
              },
            },
          },
        },
        _count: {
          select: {
            OrganizationMember: true,
            DashboardLayout: true,
          },
        },
      },
    });

    if (!organization) {
      return NextResponse.json(
        { success: false, error: "Organisation non trouvée" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: organization });
  } catch (error) {
    console.error("Error fetching organization:", error);
    return NextResponse.json(
      { success: false, error: "Erreur lors de la récupération de l'organisation" },
      { status: 500 }
    );
  }
}

// PUT /api/super-admin/organizations/[id] - Mettre à jour une organisation
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Non authentifié" },
        { status: 401 }
      );
    }

    const { id } = await params;

    // Vérifier l'accès
    const hasAccess = await hasOrganizationAccess(session.user.id, id);
    if (!hasAccess) {
      return NextResponse.json(
        { success: false, error: "Accès refusé" },
        { status: 403 }
      );
    }

    const body = await request.json();

    // Si le slug change, vérifier qu'il est unique
    if (body.slug) {
      const existingOrg = await prisma.organization.findFirst({
        where: {
          slug: body.slug,
          NOT: { id },
        },
      });

      if (existingOrg) {
        return NextResponse.json(
          { success: false, error: "Ce slug est déjà utilisé" },
          { status: 409 }
        );
      }
    }

    const organization = await prisma.organization.update({
      where: { id },
      data: {
        name: body.name,
        slug: body.slug,
        description: body.description,
        logoUrl: body.logoUrl,
        primaryColor: body.primaryColor,
        secondaryColor: body.secondaryColor,
        legalName: body.legalName,
        charityNumber: body.charityNumber,
        taxId: body.taxId,
        address: body.address,
        city: body.city,
        state: body.state,
        postalCode: body.postalCode,
        country: body.country,
        phone: body.phone,
        email: body.email,
        website: body.website,
        timezone: body.timezone,
        currency: body.currency,
        language: body.language,
        status: body.status,
        plan: body.plan,
        maxUsers: body.maxUsers,
        maxDonors: body.maxDonors,
        maxCampaigns: body.maxCampaigns,
      },
    });

    // Log d'audit
    await prisma.adminAuditLog.create({
      data: {
        action: "UPDATE",
        entityType: "Organization",
        entityId: organization.id,
        description: `Mise à jour de l'organisation ${organization.name}`,
        adminUserId: session.user.id,
        metadata: { changes: body },
      },
    });

    return NextResponse.json({ success: true, data: organization });
  } catch (error) {
    console.error("Error updating organization:", error);
    return NextResponse.json(
      { success: false, error: "Erreur lors de la mise à jour de l'organisation" },
      { status: 500 }
    );
  }
}

// DELETE /api/super-admin/organizations/[id] - Supprimer une organisation
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Non authentifié" },
        { status: 401 }
      );
    }

    const { id } = await params;

    // Seuls les super admins peuvent supprimer des organisations
    const isSuper = await isSuperAdmin(session.user.id);
    if (!isSuper) {
      return NextResponse.json(
        { success: false, error: "Accès refusé - Super admin requis" },
        { status: 403 }
      );
    }

    const organization = await prisma.organization.findUnique({
      where: { id },
    });

    if (!organization) {
      return NextResponse.json(
        { success: false, error: "Organisation non trouvée" },
        { status: 404 }
      );
    }

    // Supprimer l'organisation (cascade supprimera les relations)
    await prisma.organization.delete({
      where: { id },
    });

    // Log d'audit
    await prisma.adminAuditLog.create({
      data: {
        action: "DELETE",
        entityType: "Organization",
        entityId: id,
        description: `Suppression de l'organisation ${organization.name}`,
        adminUserId: session.user.id,
        metadata: { organizationName: organization.name },
      },
    });

    return NextResponse.json({ success: true, message: "Organisation supprimée" });
  } catch (error) {
    console.error("Error deleting organization:", error);
    return NextResponse.json(
      { success: false, error: "Erreur lors de la suppression de l'organisation" },
      { status: 500 }
    );
  }
}
