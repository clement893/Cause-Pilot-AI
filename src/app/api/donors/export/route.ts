import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import ExcelJS from "exceljs";
import Papa from "papaparse";

// GET - Exporter les donateurs en CSV ou Excel
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const format = searchParams.get("format") || "csv"; // csv ou xlsx
    const status = searchParams.get("status");
    const segment = searchParams.get("segment");
    const tags = searchParams.get("tags");
    const search = searchParams.get("search");
    const ids = searchParams.get("ids"); // IDs spécifiques à exporter

    // Construire les filtres
    const where: Record<string, unknown> = {};

    if (ids) {
      where.id = { in: ids.split(",") };
    } else {
      if (status) {
        where.status = status;
      }
      if (segment) {
        where.segment = segment;
      }
      if (tags) {
        where.tags = { hasSome: tags.split(",") };
      }
      if (search) {
        where.OR = [
          { firstName: { contains: search, mode: "insensitive" } },
          { lastName: { contains: search, mode: "insensitive" } },
          { email: { contains: search, mode: "insensitive" } },
        ];
      }
    }

    // Récupérer les donateurs
    const donors = await prisma.donor.findMany({
      where,
      orderBy: { lastName: "asc" },
      include: {
        Donation: {
          orderBy: { donationDate: "desc" },
          take: 1,
        },
      },
    });

    // Préparer les données pour l'export
    const exportData = donors.map((donor) => ({
      // Informations personnelles
      "Prénom": donor.firstName,
      "Nom": donor.lastName,
      "Email": donor.email || "",
      "Téléphone": donor.phone || "",
      "Mobile": donor.mobile || "",
      "Date de naissance": donor.dateOfBirth ? new Date(donor.dateOfBirth).toLocaleDateString("fr-CA") : "",
      
      // Adresse
      "Adresse": donor.address || "",
      "Adresse 2": donor.address2 || "",
      "Ville": donor.city || "",
      "Province/État": donor.state || "",
      "Code postal": donor.postalCode || "",
      "Pays": donor.country || "",
      
      // Données professionnelles
      "Profession": donor.profession || "",
      "Employeur": donor.employer || "",
      "Titre": donor.jobTitle || "",
      "Industrie": donor.industry || "",
      
      // Statut et classification
      "Statut": donor.status,
      "Type": donor.donorType,
      "Segment": donor.segment || "",
      "Tags": donor.tags.join(", "),
      
      // Métriques
      "Total des dons": donor.totalDonations.toFixed(2),
      "Nombre de dons": donor.donationCount,
      "Don moyen": donor.averageDonation.toFixed(2),
      "Don le plus élevé": donor.highestDonation.toFixed(2),
      "Premier don": donor.firstDonationDate ? new Date(donor.firstDonationDate).toLocaleDateString("fr-CA") : "",
      "Dernier don": donor.lastDonationDate ? new Date(donor.lastDonationDate).toLocaleDateString("fr-CA") : "",
      
      // Consentements
      "Consentement email": donor.consentEmail ? "Oui" : "Non",
      "Consentement téléphone": donor.consentPhone ? "Oui" : "Non",
      "Consentement courrier": donor.consentMail ? "Oui" : "Non",
      
      // Notes
      "Notes": donor.notes || "",
      "Source": donor.source || "",
      
      // Métadonnées
      "ID": donor.id,
      "Créé le": new Date(donor.createdAt).toLocaleDateString("fr-CA"),
      "Modifié le": new Date(donor.updatedAt).toLocaleDateString("fr-CA"),
    }));

    const filename = `donateurs_export_${new Date().toISOString().split("T")[0]}`;

    if (format === "xlsx") {
      // Export Excel avec ExcelJS
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("Donateurs");

      // Ajouter les en-têtes
      if (exportData.length > 0) {
        const headers = Object.keys(exportData[0]);
        worksheet.addRow(headers);
        
        // Style des en-têtes
        const headerRow = worksheet.getRow(1);
        headerRow.font = { bold: true };
        headerRow.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFE0E0E0' }
        };

        // Ajouter les données
        exportData.forEach((row) => {
          worksheet.addRow(Object.values(row));
        });

        // Ajuster la largeur des colonnes
        headers.forEach((header, index) => {
          const column = worksheet.getColumn(index + 1);
          column.width = Math.max(header.length + 2, 15);
        });
      }

      const buffer = await workbook.xlsx.writeBuffer();

      return new NextResponse(buffer, {
        headers: {
          "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "Content-Disposition": `attachment; filename="${filename}.xlsx"`,
        },
      });
    } else {
      // Export CSV
      const csv = Papa.unparse(exportData, {
        quotes: true,
        delimiter: ",",
      });

      // Ajouter BOM pour UTF-8 (pour Excel)
      const bom = "\uFEFF";
      const csvWithBom = bom + csv;

      return new NextResponse(csvWithBom, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="${filename}.csv"`,
        },
      });
    }
  } catch (error) {
    console.error("Error exporting donors:", error);
    return NextResponse.json(
      { error: "Erreur lors de l'export des donateurs" },
      { status: 500 }
    );
  }
}
