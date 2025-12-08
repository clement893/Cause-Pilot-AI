import { NextResponse } from "next/server";
import { PrismaClient, DonorStatus, DonorType, CommunicationChannel, CommunicationFrequency } from "@prisma/client";

const prisma = new PrismaClient();

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

export async function POST() {
  try {
    // Supprimer les données existantes dans le bon ordre
    await prisma.communication.deleteMany();
    await prisma.donorCustomField.deleteMany();
    await prisma.donorPreference.deleteMany();
    await prisma.donation.deleteMany();
    await prisma.donor.deleteMany();

    const donors = [];

    for (let i = 0; i < 50; i++) {
      const firstName = randomElement(firstNames);
      const lastName = randomElement(lastNames);
      const location = randomElement(cities);
      const donations = generateDonations();
      const status = randomElement(statuses);
      const donorType = randomElement(donorTypes);

      const donor = await prisma.donor.create({
        data: {
          firstName,
          lastName,
          email: generateEmail(firstName, lastName, i),
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
          jobTitle: Math.random() > 0.5 ? randomElement(["Directeur", "Gestionnaire", "Analyste", "Conseiller"]) : null,
          industry: Math.random() > 0.4 ? randomElement(["Énergie", "Finance", "Technologie", "Santé", "Éducation"]) : null,
          status,
          donorType,
          segment: randomElement(segments),
          tags: Math.random() > 0.5 ? [randomElement(["fidèle", "généreux", "engagé", "bénévole"])] : [],
          source: randomElement(sources),
          notes: Math.random() > 0.7 ? `Donateur ${status === "ACTIVE" ? "actif et engagé" : "à relancer"}.` : null,
          totalDonations: donations.total,
          donationCount: donations.count,
          averageDonation: donations.average,
          highestDonation: donations.highest,
          lastDonationDate: donations.lastDate,
          firstDonationDate: donations.firstDate,
          consentEmail: Math.random() > 0.2,
          consentPhone: Math.random() > 0.5,
          consentMail: Math.random() > 0.3,
          preferences: {
            create: {
              preferredChannel: randomElement(channels),
              preferredFrequency: randomElement(frequencies),
              preferredLanguage: Math.random() > 0.15 ? "fr" : "en",
              causesOfInterest: Math.random() > 0.4 ? [randomElement(["Éducation", "Santé", "Environnement"])] : [],
            },
          },
        },
      });

      donors.push(donor);
    }

    const activeCount = donors.filter(d => d.status === "ACTIVE").length;
    const totalDonations = donors.reduce((sum, d) => sum + d.totalDonations, 0);

    return NextResponse.json({
      success: true,
      message: "50 donateurs créés avec succès!",
      data: {
        totalDonors: donors.length,
        activeDonors: activeCount,
        totalDonations: totalDonations,
      },
    });
  } catch (error) {
    console.error("Seed error:", error);
    return NextResponse.json(
      { success: false, error: "Erreur lors du seeding", details: String(error) },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
