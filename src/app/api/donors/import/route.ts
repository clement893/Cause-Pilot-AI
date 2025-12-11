import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import ExcelJS from "exceljs";
import Papa from "papaparse";

// Mapping des colonnes françaises vers les champs de la base de données
const COLUMN_MAPPING: Record<string, string> = {
  // Informations personnelles
  "prénom": "firstName",
  "prenom": "firstName",
  "first_name": "firstName",
  "firstname": "firstName",
  "nom": "lastName",
  "last_name": "lastName",
  "lastname": "lastName",
  "email": "email",
  "courriel": "email",
  "téléphone": "phone",
  "telephone": "phone",
  "phone": "phone",
  "mobile": "mobile",
  "cellulaire": "mobile",
  "date_de_naissance": "dateOfBirth",
  "date de naissance": "dateOfBirth",
  "birthday": "dateOfBirth",
  "birthdate": "dateOfBirth",
  
  // Adresse
  "adresse": "address",
  "address": "address",
  "adresse_2": "address2",
  "adresse 2": "address2",
  "address2": "address2",
  "ville": "city",
  "city": "city",
  "province": "state",
  "état": "state",
  "etat": "state",
  "state": "state",
  "code_postal": "postalCode",
  "code postal": "postalCode",
  "postal_code": "postalCode",
  "postalcode": "postalCode",
  "zip": "postalCode",
  "pays": "country",
  "country": "country",
  
  // Données professionnelles
  "profession": "profession",
  "employeur": "employer",
  "employer": "employer",
  "company": "employer",
  "entreprise": "employer",
  "titre": "jobTitle",
  "job_title": "jobTitle",
  "jobtitle": "jobTitle",
  "poste": "jobTitle",
  "industrie": "industry",
  "industry": "industry",
  "secteur": "industry",
  
  // Statut et classification
  "statut": "status",
  "status": "status",
  "type": "donorType",
  "donor_type": "donorType",
  "donortype": "donorType",
  "segment": "segment",
  "tags": "tags",
  
  // Consentements
  "consentement_email": "consentEmail",
  "consentement email": "consentEmail",
  "consent_email": "consentEmail",
  "email_consent": "consentEmail",
  "consentement_téléphone": "consentPhone",
  "consentement telephone": "consentPhone",
  "consent_phone": "consentPhone",
  "phone_consent": "consentPhone",
  "consentement_courrier": "consentMail",
  "consentement courrier": "consentMail",
  "consent_mail": "consentMail",
  "mail_consent": "consentMail",
  
  // Notes
  "notes": "notes",
  "commentaires": "notes",
  "comments": "notes",
  "source": "source",
};

// Valeurs valides pour les enums
const VALID_STATUS = ["ACTIVE", "INACTIVE", "LAPSED", "DECEASED", "DO_NOT_CONTACT", "PENDING"];
const VALID_DONOR_TYPE = ["INDIVIDUAL", "CORPORATE", "FOUNDATION", "GOVERNMENT", "ANONYMOUS"];

interface ImportRow {
  [key: string]: string | number | boolean | null | undefined;
}

interface ImportResult {
  success: boolean;
  created: number;
  updated: number;
  skipped: number;
  errors: Array<{ row: number; field: string; message: string }>;
}

// Fonction pour normaliser les noms de colonnes
function normalizeColumnName(name: string): string {
  return name.toLowerCase().trim().replace(/\s+/g, "_");
}

// Fonction pour mapper une colonne vers un champ de la base de données
function mapColumn(columnName: string): string | null {
  const normalized = normalizeColumnName(columnName);
  return COLUMN_MAPPING[normalized] || null;
}

// Fonction pour parser une valeur booléenne
function parseBoolean(value: string | number | boolean | null | undefined): boolean {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value !== 0;
  if (!value) return false;
  const str = String(value).toLowerCase().trim();
  return ["oui", "yes", "true", "1", "vrai", "x"].includes(str);
}

// Fonction pour parser une date
function parseDate(value: string | number | null | undefined): Date | null {
  if (!value) return null;
  const date = new Date(value);
  return isNaN(date.getTime()) ? null : date;
}

// Fonction pour valider et nettoyer les données d'un donateur
function validateAndCleanDonor(row: ImportRow, rowIndex: number): { data: Record<string, unknown> | null; errors: Array<{ row: number; field: string; message: string }> } {
  const errors: Array<{ row: number; field: string; message: string }> = [];
  const data: Record<string, unknown> = {};

  // Mapper les colonnes
  for (const [column, value] of Object.entries(row)) {
    const field = mapColumn(column);
    if (field && value !== null && value !== undefined && value !== "") {
      data[field] = value;
    }
  }

  // Validation du prénom (obligatoire)
  if (!data.firstName || String(data.firstName).trim() === "") {
    errors.push({ row: rowIndex, field: "firstName", message: "Le prénom est obligatoire" });
  } else {
    data.firstName = String(data.firstName).trim();
  }

  // Validation du nom (obligatoire)
  if (!data.lastName || String(data.lastName).trim() === "") {
    errors.push({ row: rowIndex, field: "lastName", message: "Le nom est obligatoire" });
  } else {
    data.lastName = String(data.lastName).trim();
  }

  // Validation de l'email (optionnel mais doit être valide si présent)
  if (data.email) {
    const emailStr = String(data.email).trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailStr)) {
      errors.push({ row: rowIndex, field: "email", message: "Format d'email invalide" });
    } else {
      data.email = emailStr;
    }
  }

  // Validation du statut
  if (data.status) {
    const statusStr = String(data.status).toUpperCase().trim();
    if (!VALID_STATUS.includes(statusStr)) {
      errors.push({ row: rowIndex, field: "status", message: `Statut invalide: ${data.status}` });
    } else {
      data.status = statusStr;
    }
  } else {
    data.status = "ACTIVE";
  }

  // Validation du type de donateur
  if (data.donorType) {
    const typeStr = String(data.donorType).toUpperCase().trim();
    if (!VALID_DONOR_TYPE.includes(typeStr)) {
      errors.push({ row: rowIndex, field: "donorType", message: `Type de donateur invalide: ${data.donorType}` });
    } else {
      data.donorType = typeStr;
    }
  } else {
    data.donorType = "INDIVIDUAL";
  }

  // Parser les booléens
  if (data.consentEmail !== undefined) {
    data.consentEmail = parseBoolean(data.consentEmail as string);
  }
  if (data.consentPhone !== undefined) {
    data.consentPhone = parseBoolean(data.consentPhone as string);
  }
  if (data.consentMail !== undefined) {
    data.consentMail = parseBoolean(data.consentMail as string);
  }

  // Parser les dates
  if (data.dateOfBirth) {
    const date = parseDate(data.dateOfBirth as string);
    if (date) {
      data.dateOfBirth = date;
    } else {
      delete data.dateOfBirth;
    }
  }

  // Parser les tags (séparés par virgule)
  if (data.tags) {
    const tagsStr = String(data.tags);
    data.tags = tagsStr.split(",").map((t) => t.trim()).filter((t) => t);
  } else {
    data.tags = [];
  }

  // Nettoyer les champs texte
  const textFields = ["phone", "mobile", "address", "address2", "city", "state", "postalCode", "country", "profession", "employer", "jobTitle", "industry", "segment", "notes", "source"];
  for (const field of textFields) {
    if (data[field]) {
      data[field] = String(data[field]).trim();
    }
  }

  // Si pas de pays, mettre Canada par défaut
  if (!data.country) {
    data.country = "Canada";
  }

  if (errors.length > 0) {
    return { data: null, errors };
  }

  return { data, errors: [] };
}

// POST - Importer des donateurs depuis un fichier CSV ou Excel
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const updateExisting = formData.get("updateExisting") === "true";
    const skipErrors = formData.get("skipErrors") === "true";

    if (!file) {
      return NextResponse.json(
        { error: "Aucun fichier fourni" },
        { status: 400 }
      );
    }

    const filename = file.name.toLowerCase();
    const buffer = await file.arrayBuffer();
    let rows: ImportRow[] = [];

    // Parser le fichier selon son format
    if (filename.endsWith(".xlsx") || filename.endsWith(".xls")) {
      // Parser Excel avec ExcelJS
      const workbook = new ExcelJS.Workbook();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await workbook.xlsx.load(buffer as any);
      const worksheet = workbook.worksheets[0];
      
      if (worksheet) {
        const headers: string[] = [];
        worksheet.getRow(1).eachCell((cell, colNumber) => {
          headers[colNumber - 1] = String(cell.value || '').trim();
        });
        
        worksheet.eachRow((row, rowNumber) => {
          if (rowNumber === 1) return; // Skip header row
          const rowData: ImportRow = {};
          row.eachCell((cell, colNumber) => {
            const header = headers[colNumber - 1];
            if (header) {
              rowData[header] = cell.value as string | number | boolean | null;
            }
          });
          if (Object.keys(rowData).length > 0) {
            rows.push(rowData);
          }
        });
      }
    } else if (filename.endsWith(".csv")) {
      // Parser CSV
      const text = new TextDecoder("utf-8").decode(buffer);
      const result = Papa.parse<ImportRow>(text, {
        header: true,
        skipEmptyLines: true,
        transformHeader: (header) => header.trim(),
      });
      rows = result.data;
    } else {
      return NextResponse.json(
        { error: "Format de fichier non supporté. Utilisez CSV ou Excel (.xlsx, .xls)" },
        { status: 400 }
      );
    }

    if (rows.length === 0) {
      return NextResponse.json(
        { error: "Le fichier est vide ou ne contient pas de données valides" },
        { status: 400 }
      );
    }

    const result: ImportResult = {
      success: true,
      created: 0,
      updated: 0,
      skipped: 0,
      errors: [],
    };

    // Traiter chaque ligne
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowIndex = i + 2; // +2 car ligne 1 = en-têtes, et on commence à 0

      const { data, errors } = validateAndCleanDonor(row, rowIndex);

      if (errors.length > 0) {
        result.errors.push(...errors);
        if (!skipErrors) {
          result.success = false;
          continue;
        }
        result.skipped++;
        continue;
      }

      if (!data) {
        result.skipped++;
        continue;
      }

      try {
        // Vérifier si le donateur existe déjà (par email)
        let existingDonor = null;
        if (data.email) {
          existingDonor = await prisma.donor.findUnique({
            where: { email: data.email as string },
          });
        }

        if (existingDonor) {
          if (updateExisting) {
            // Mettre à jour le donateur existant
            await prisma.donor.update({
              where: { id: existingDonor.id },
              data: data as Prisma.DonorUpdateInput,
            });
            result.updated++;
          } else {
            result.skipped++;
          }
        } else {
          // Créer un nouveau donateur
          await prisma.donor.create({
            data: data as Prisma.DonorCreateInput,
          });
          result.created++;
        }
      } catch (dbError) {
        console.error(`Error processing row ${rowIndex}:`, dbError);
        result.errors.push({
          row: rowIndex,
          field: "database",
          message: dbError instanceof Error ? dbError.message : "Erreur de base de données",
        });
        if (!skipErrors) {
          result.success = false;
        }
        result.skipped++;
      }
    }

    // Mettre à jour le success final
    result.success = result.errors.length === 0 || skipErrors;
    
    return NextResponse.json({
      ...result,
      message: `Import terminé: ${result.created} créés, ${result.updated} mis à jour, ${result.skipped} ignorés`,
    });
  } catch (error) {
    console.error("Error importing donors:", error);
    return NextResponse.json(
      { error: "Erreur lors de l'import des donateurs" },
      { status: 500 }
    );
  }
}

// GET - Télécharger un template d'import
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const format = searchParams.get("format") || "csv";

  const templateData = [
    {
      "Prénom": "Jean",
      "Nom": "Dupont",
      "Email": "jean.dupont@exemple.com",
      "Téléphone": "514-555-1234",
      "Mobile": "514-555-5678",
      "Date de naissance": "1980-05-15",
      "Adresse": "123 rue Principale",
      "Adresse 2": "App. 4",
      "Ville": "Montréal",
      "Province/État": "QC",
      "Code postal": "H2X 1Y4",
      "Pays": "Canada",
      "Profession": "Ingénieur",
      "Employeur": "Tech Corp",
      "Titre": "Directeur",
      "Industrie": "Technologie",
      "Statut": "ACTIVE",
      "Type": "INDIVIDUAL",
      "Segment": "Donateurs réguliers",
      "Tags": "fidèle, événement2024",
      "Consentement email": "Oui",
      "Consentement téléphone": "Non",
      "Consentement courrier": "Oui",
      "Notes": "Donateur depuis 2020",
      "Source": "Site web",
    },
  ];

  const filename = `template_import_donateurs`;

  if (format === "xlsx") {
    const worksheet = XLSX.utils.json_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Template");

    const colWidths = Object.keys(templateData[0]).map((key) => ({
      wch: Math.max(key.length + 2, 15),
    }));
    worksheet["!cols"] = colWidths;

    const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filename}.xlsx"`,
      },
    });
  } else {
    const csv = Papa.unparse(templateData, { quotes: true });
    const bom = "\uFEFF";

    return new NextResponse(bom + csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}.csv"`,
      },
    });
  }
}
