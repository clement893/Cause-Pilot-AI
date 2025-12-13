import { NextRequest, NextResponse } from "next/server";
import { DonorStatus, DonorType, CommunicationChannel, CommunicationFrequency, Donor, Prisma } from "@prisma/client";
import { withRateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import { getMainPrisma } from "@/lib/prisma-org";
import { getPrismaForOrganization } from "@/lib/prisma-multi";

// Vérification de sécurité pour la route seed
function checkSeedAccess(request: NextRequest): { allowed: boolean; error?: string } {
  // Toujours permettre l'accès (le middleware gère déjà la sécurité)
  // En production, vous pouvez ajouter une vérification de token ici si nécessaire
  const seedToken = request.headers.get("x-seed-token");
  const expectedToken = process.env.SEED_SECRET_TOKEN;
  
  // Si un token est configuré ET fourni, le vérifier
  if (expectedToken && seedToken) {
    if (seedToken !== expectedToken) {
      return {
        allowed: false,
        error: "Invalid seed token."
      };
    }
  }
  
  console.warn("⚠️  Seed route accessed");
  
  return { allowed: true };
}

// Données québécoises réalistes
const firstNames = [
  "Jean", "Marie", "Pierre", "Sophie", "Michel", "Isabelle", "François", "Nathalie",
  "André", "Julie", "Claude", "Caroline", "Martin", "Sylvie", "Robert", "Chantal",
  "Daniel", "Martine", "Luc", "Diane", "Jacques", "Hélène", "Yves", "Monique",
  "Marc", "Louise", "Alain", "Nicole", "Benoit", "Anne", "Éric", "Jocelyne",
  "Philippe", "Lucie", "Guy", "Josée", "Stéphane", "Mélanie", "Richard", "Véronique",
  "Paul", "Catherine", "Simon", "Émilie", "David", "Geneviève", "Alexandre", "Valérie",
  "Mathieu", "Karine"
];

const lastNames = [
  "Tremblay", "Gagnon", "Roy", "Côté", "Bouchard", "Gauthier", "Morin", "Lavoie",
  "Fortin", "Gagné", "Ouellet", "Pelletier", "Bélanger", "Lévesque", "Bergeron", "Leblanc",
  "Paquette", "Girard", "Simard", "Boucher", "Caron", "Beaulieu", "Cloutier", "Dubé",
  "Poirier", "Fournier", "Lapointe", "Leclerc", "Lefebvre", "Landry", "Martel", "Bédard",
  "Thibault", "Vaillancourt", "Charron", "Giroux", "Blais", "Dufour", "Poulin", "Savard",
  "Nadeau", "Mercier", "Proulx", "Demers", "Dumont", "Perron", "Champagne", "Lemieux",
  "Arsenault", "Hébert"
];

const cities = [
  { city: "Montréal", state: "QC", postalPrefix: "H" },
  { city: "Québec", state: "QC", postalPrefix: "G" },
  { city: "Laval", state: "QC", postalPrefix: "H" },
  { city: "Gatineau", state: "QC", postalPrefix: "J" },
  { city: "Longueuil", state: "QC", postalPrefix: "J" },
  { city: "Sherbrooke", state: "QC", postalPrefix: "J" },
  { city: "Saguenay", state: "QC", postalPrefix: "G" },
  { city: "Lévis", state: "QC", postalPrefix: "G" },
  { city: "Trois-Rivières", state: "QC", postalPrefix: "G" },
  { city: "Terrebonne", state: "QC", postalPrefix: "J" },
];

const streets = [
  "rue Principale", "boulevard Saint-Laurent", "avenue du Parc", "rue Sainte-Catherine",
  "boulevard René-Lévesque", "rue Sherbrooke", "avenue Laurier", "rue Saint-Denis",
  "boulevard de la Côte-Vertu", "rue Notre-Dame"
];

const professions = [
  "Ingénieur", "Médecin", "Avocat", "Comptable", "Enseignant", "Infirmier",
  "Architecte", "Pharmacien", "Dentiste", "Notaire", "Gestionnaire", "Consultant",
  "Entrepreneur", "Directeur", "Analyste", "Développeur", "Retraité", "Fonctionnaire"
];

const employers = [
  "Hydro-Québec", "Desjardins", "Banque Nationale", "CGI", "Bombardier", "SNC-Lavalin",
  "Bell Canada", "Vidéotron", "Metro Inc.", "Couche-Tard", "Saputo", "CAE",
  "Université de Montréal", "Gouvernement du Québec", "Retraité", "Travailleur autonome"
];

const sources = [
  "Site web", "Événement gala", "Référence ami", "Campagne email", "Réseaux sociaux",
  "Publipostage", "Télémarketing", "Partenariat entreprise"
];

const segments = ["VIP", "Récurrent mensuel", "Donateur majeur", "Premier don", "Fidèle 5+ ans", null];
const statuses: DonorStatus[] = ["ACTIVE", "ACTIVE", "ACTIVE", "ACTIVE", "INACTIVE", "LAPSED", "PENDING"];
const donorTypes: DonorType[] = ["INDIVIDUAL", "INDIVIDUAL", "INDIVIDUAL", "CORPORATE", "FOUNDATION"];
const channels: CommunicationChannel[] = ["EMAIL", "PHONE", "MAIL", "SMS"];
const frequencies: CommunicationFrequency[] = ["MONTHLY", "QUARTERLY", "YEARLY", "BIWEEKLY"];

function randomElement<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generatePostalCode(prefix: string): string {
  const letters = "ABCEGHJKLMNPRSTVWXYZ";
  const digits = "0123456789";
  return `${prefix}${randomElement(digits.split(""))}${randomElement(letters.split(""))} ${randomElement(digits.split(""))}${randomElement(letters.split(""))}${randomElement(digits.split(""))}`;
}

function generatePhone(): string {
  const areaCodes = ["514", "438", "450", "418", "581", "819"];
  return `(${randomElement(areaCodes)}) ${randomInt(200, 999)}-${randomInt(1000, 9999)}`;
}

function generateEmail(firstName: string, lastName: string, index: number): string {
  const domains = ["gmail.com", "outlook.com", "hotmail.com", "videotron.ca", "bell.net"];
  const normalized = (str: string) => str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  return `${normalized(firstName)}.${normalized(lastName)}${index}@${randomElement(domains)}`;
}

function generateBirthDate(): Date {
  const year = randomInt(1945, 1995);
  const month = randomInt(0, 11);
  const day = randomInt(1, 28);
  return new Date(year, month, day);
}

function generateDonations(): { total: number; count: number; average: number; highest: number; lastDate: Date | null; firstDate: Date | null } {
  const count = randomInt(0, 25);
  if (count === 0) {
    return { total: 0, count: 0, average: 0, highest: 0, lastDate: null, firstDate: null };
  }
  
  const donations: number[] = [];
  for (let i = 0; i < count; i++) {
    const amount = randomInt(25, 500) * (Math.random() > 0.9 ? randomInt(2, 10) : 1);
    donations.push(amount);
  }
  
  const total = donations.reduce((a, b) => a + b, 0);
  const highest = Math.max(...donations);
  const average = total / count;
  
  const daysAgo = randomInt(1, 730);
  const lastDate = new Date();
  lastDate.setDate(lastDate.getDate() - daysAgo);
  
  const firstDate = new Date(Date.now() - randomInt(365, 2555) * 24 * 60 * 60 * 1000);
  
  return { total, count, average, highest, lastDate, firstDate };
}

export async function POST(request: NextRequest) {
  // Vérifier l'accès en production
  const accessCheck = checkSeedAccess(request);
  if (!accessCheck.allowed) {
    return NextResponse.json(
      { success: false, error: accessCheck.error },
      { status: 403 }
    );
  }

  // Appliquer le rate limiting (1 requête par heure)
  const { allowed, headers } = withRateLimit(request, RATE_LIMITS.seed);
  if (!allowed) {
    return NextResponse.json(
      { success: false, error: "Rate limit exceeded. Try again later." },
      { status: 429, headers }
    );
  }

  try {
    // Récupérer les organisations existantes depuis la base principale
    const mainPrisma = getMainPrisma();
    const organizations = await mainPrisma.organization.findMany({
      orderBy: { createdAt: "asc" },
      take: 2,
      select: {
        id: true,
        name: true,
        databaseUrl: true,
      },
    });

    console.log(`📋 Organisations trouvées: ${organizations.length}`);
    organizations.forEach(org => {
      console.log(`  - ${org.name} (ID: ${org.id}, DB: ${org.databaseUrl ? 'Dédiée' : 'Partagée'})`);
    });

    if (organizations.length === 0) {
      return NextResponse.json(
        { success: false, error: "Aucune organisation trouvée. Veuillez créer au moins 2 organisations d'abord." },
        { status: 400 }
      );
    }

    if (organizations.length < 2) {
      return NextResponse.json(
        { success: false, error: `Seulement ${organizations.length} organisation(s) trouvée(s). Veuillez créer 2 organisations.` },
        { status: 400 }
      );
    }

    const allDonors: Donor[] = [];
    const donorsPerOrg = 30; // 30 donateurs par organisation

    // Créer des donateurs pour chaque organisation dans leur base dédiée
    for (let orgIndex = 0; orgIndex < organizations.length; orgIndex++) {
      const organization = organizations[orgIndex];
      
      console.log(`📦 Traitement de l'organisation: ${organization.name} (ID: ${organization.id})`);
      
      // Vérifier si l'organisation utilise une base de données dédiée
      const hasDedicatedDB = !!organization.databaseUrl;
      console.log(`  ${hasDedicatedDB ? '🔒 Base de données dédiée' : '🔓 Base de données partagée'}`);
      
      // Obtenir l'instance Prisma pour cette organisation
      let orgPrisma;
      try {
        orgPrisma = await getPrismaForOrganization(organization.id);
        console.log(`✅ Instance Prisma obtenue pour ${organization.name}`);
      } catch (error) {
        console.error(`❌ Erreur lors de l'obtention de l'instance Prisma pour ${organization.name}:`, error);
        throw new Error(`Impossible de se connecter à la base de données de l'organisation ${organization.name}: ${error instanceof Error ? error.message : String(error)}`);
      }
      
      // Supprimer les données existantes dans le bon ordre pour cette organisation
      try {
        console.log(`🧹 Nettoyage des données existantes pour ${organization.name}...`);
        await orgPrisma.communication.deleteMany();
        await orgPrisma.donorCustomField.deleteMany();
        await orgPrisma.donorPreference.deleteMany();
        await orgPrisma.donation.deleteMany();
        await orgPrisma.donor.deleteMany();
        console.log(`✅ Données nettoyées pour ${organization.name}`);
      } catch (error) {
        console.error(`❌ Erreur lors du nettoyage pour ${organization.name}:`, error);
        // Continuer même si le nettoyage échoue (peut-être qu'il n'y a pas de données)
      }

      console.log(`👥 Création de ${donorsPerOrg} donateurs pour ${organization.name}...`);
      for (let i = 0; i < donorsPerOrg; i++) {
        try {
          const firstName = randomElement(firstNames);
          const lastName = randomElement(lastNames);
          const location = randomElement(cities);
          const donations = generateDonations();
          const status = randomElement(statuses);
          const donorType = randomElement(donorTypes);

          const donorData: Prisma.DonorUncheckedCreateInput = {
              firstName,
              lastName,
              email: `${firstName.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")}.${lastName.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")}${orgIndex}${i}@${randomElement(["gmail.com", "outlook.com", "hotmail.com", "videotron.ca"])}`,
              phone: generatePhone(),
              mobile: Math.random() > 0.3 ? generatePhone() : null,
              dateOfBirth: Math.random() > 0.2 ? generateBirthDate() : null,
              address: `${randomInt(1, 9999)} ${randomElement(streets)}`,
              address2: Math.random() > 0.8 ? `App. ${randomInt(1, 20)}` : null,
              city: location.city,
              state: location.state,
              postalCode: generatePostalCode(location.postalPrefix),
              country: "Canada",
              profession: Math.random() > 0.2 ? randomElement(professions) : null,
              employer: Math.random() > 0.3 ? randomElement(employers) : null,
              jobTitle: Math.random() > 0.5 ? randomElement(["Directeur", "Gestionnaire", "Analyste", "Conseiller", "Spécialiste"]) : null,
              industry: Math.random() > 0.4 ? randomElement(["Énergie", "Finance", "Technologie", "Santé", "Éducation", "Construction", "Télécommunications"]) : null,
              status,
              donorType,
              segment: randomElement(segments),
              tags: Math.random() > 0.5 ? [randomElement(["fidèle", "généreux", "engagé", "bénévole", "ambassadeur"])] : [],
              source: randomElement(sources),
              notes: Math.random() > 0.7 ? `Donateur ${status === "ACTIVE" ? "actif et engagé" : "à relancer"}. ${Math.random() > 0.5 ? "Intéressé par les événements." : ""}` : null,
              totalDonations: donations.total,
              donationCount: donations.count,
              averageDonation: donations.average,
              highestDonation: donations.highest,
              lastDonationDate: donations.lastDate,
              firstDonationDate: donations.firstDate,
              consentEmail: Math.random() > 0.2,
              consentPhone: Math.random() > 0.5,
              consentMail: Math.random() > 0.3,
              // Ne pas inclure organizationId si l'organisation utilise une base dédiée
              // car la table Organization n'existe pas dans les bases dédiées
              ...(hasDedicatedDB ? {} : { organizationId: organization.id }),
          };

          const donor = await orgPrisma.donor.create({
            data: donorData,
          });

          // Créer les préférences séparément
          await orgPrisma.donorPreference.create({
            data: {
              donorId: donor.id,
              preferredChannel: randomElement(channels),
              preferredFrequency: randomElement(frequencies),
              preferredLanguage: Math.random() > 0.15 ? "fr" : "en",
              causesOfInterest: Math.random() > 0.4 ? [randomElement(["Éducation", "Santé", "Environnement", "Culture", "Pauvreté"])] : [],
            },
          });

          allDonors.push(donor);
        } catch (error) {
          console.error(`❌ Erreur lors de la création du donateur ${i + 1} pour ${organization.name}:`, error);
          throw new Error(`Erreur lors de la création du donateur ${i + 1} pour ${organization.name}: ${error instanceof Error ? error.message : String(error)}`);
        }
      }
      console.log(`✅ ${donorsPerOrg} donateurs créés pour ${organization.name}`);
    }

    const activeCount = allDonors.filter(d => d.status === "ACTIVE").length;
    const totalDonations = allDonors.reduce((sum, d) => sum + d.totalDonations, 0);

    // Statistiques par organisation
    // Pour les bases dédiées, tous les donateurs créés appartiennent à cette organisation
    const orgStats = organizations.map((org, orgIndex) => {
      // Calculer le nombre de donateurs créés pour cette organisation
      const donorsCreatedForOrg = donorsPerOrg;
      const startIndex = orgIndex * donorsPerOrg;
      const endIndex = startIndex + donorsPerOrg;
      const orgDonors = allDonors.slice(startIndex, endIndex);
      const orgActiveCount = orgDonors.filter(d => d.status === "ACTIVE").length;
      const orgTotalDonations = orgDonors.reduce((sum, d) => sum + d.totalDonations, 0);
      
      return {
        organizationId: org.id,
        organizationName: org.name,
        totalDonors: orgDonors.length,
        activeDonors: orgActiveCount,
        totalDonations: orgTotalDonations,
      };
    });

    return NextResponse.json({
      success: true,
      message: `${allDonors.length} donateurs créés avec succès répartis sur ${organizations.length} organisations!`,
      data: {
        totalDonors: allDonors.length,
        activeDonors: activeCount,
        totalDonations: totalDonations,
        organizations: orgStats,
      },
    });
  } catch (error) {
    console.error("❌ Seed error:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;
    console.error("Error details:", { errorMessage, errorStack });
    return NextResponse.json(
      { 
        success: false, 
        error: "Erreur lors du seeding", 
        details: errorMessage,
        stack: process.env.NODE_ENV === "development" ? errorStack : undefined
      },
      { status: 500 }
    );
  }
}
