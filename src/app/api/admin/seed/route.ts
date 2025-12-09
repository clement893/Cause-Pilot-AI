import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Données québécoises réalistes
const firstNames = [
  "Jean", "Marie", "Pierre", "Sophie", "Michel", "Isabelle", "François", "Nathalie",
  "André", "Julie", "Claude", "Chantal", "Daniel", "Sylvie", "Robert", "Diane",
  "Marc", "Louise", "Alain", "Hélène", "Jacques", "Monique", "Yves", "Céline",
  "Paul", "Martine", "Luc", "Johanne", "Serge", "Lucie", "Guy", "Manon",
  "Martin", "Caroline", "Éric", "Véronique", "Patrick", "Stéphanie", "Richard", "Anne"
];

const lastNames = [
  "Tremblay", "Gagnon", "Roy", "Côté", "Bouchard", "Gauthier", "Morin", "Lavoie",
  "Fortin", "Gagné", "Ouellet", "Pelletier", "Bélanger", "Lévesque", "Bergeron", "Leblanc",
  "Paquette", "Girard", "Simard", "Boucher", "Caron", "Beaulieu", "Cloutier", "Dubé",
  "Poirier", "Fournier", "Lapointe", "Leclerc", "Lefebvre", "Martel", "Thibault", "Mercier"
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
  "boulevard René-Lévesque", "rue Notre-Dame", "avenue Laurier", "rue Saint-Denis",
  "boulevard de la Côte-Vertu", "rue Sherbrooke", "avenue Mont-Royal", "rue Jean-Talon"
];

const segments = [
  "Donateur régulier", "Grand donateur", "Nouveau donateur", "Donateur occasionnel",
  "Bénévole-donateur", "Donateur corporatif", "Donateur majeur", "Donateur fidèle"
];

const sources = [
  "Site web", "Événement", "Référence", "Réseaux sociaux", "Publipostage",
  "Téléphone", "Email", "Partenaire", "Bouche à oreille"
];

const campaignNames = [
  "Campagne annuelle 2024", "Urgence humanitaire", "Projet éducation",
  "Fonds de développement", "Campagne de Noël", "Course solidaire",
  "Gala de charité", "Collecte printemps", "Campagne été solidaire"
];

const paymentMethods = ["CREDIT_CARD", "DEBIT", "BANK_TRANSFER", "CHECK", "CASH", "PAYPAL"] as const;

function randomElement<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomDate(start: Date, end: Date): Date {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

function generatePostalCode(prefix: string): string {
  const letters = "ABCDEFGHJKLMNPRSTUVWXYZ";
  const digits = "0123456789";
  return `${prefix}${randomElement(digits.split(""))}${randomElement(letters.split(""))} ${randomElement(digits.split(""))}${randomElement(letters.split(""))}${randomElement(digits.split(""))}`;
}

function generatePhone(): string {
  const areaCodes = ["514", "438", "450", "418", "819", "581", "579"];
  return `(${randomElement(areaCodes)}) ${randomInt(200, 999)}-${randomInt(1000, 9999)}`;
}

function generateEmail(firstName: string, lastName: string): string {
  const domains = ["gmail.com", "outlook.com", "yahoo.ca", "hotmail.com", "videotron.ca", "bell.net"];
  const cleanFirst = firstName.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const cleanLast = lastName.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const formats = [
    `${cleanFirst}.${cleanLast}`,
    `${cleanFirst}${cleanLast}`,
    `${cleanFirst}_${cleanLast}`,
    `${cleanFirst}${randomInt(1, 99)}`,
    `${cleanFirst}.${cleanLast}${randomInt(1, 99)}`
  ];
  return `${randomElement(formats)}@${randomElement(domains)}`;
}

// POST /api/admin/seed - Exécuter le seed
export async function POST(request: NextRequest) {
  try {
    // Vérifier le header d'autorisation (simple protection)
    const authHeader = request.headers.get("x-admin-key");
    if (authHeader !== "seed-admin-2024") {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    console.log("🌱 Starting seed...");

    // Nettoyer les données existantes
    console.log("🧹 Cleaning existing data...");
    await prisma.donation.deleteMany();
    await prisma.donorPreference.deleteMany();
    await prisma.donor.deleteMany();
    await prisma.campaign.deleteMany();

    // Créer des campagnes
    console.log("📢 Creating campaigns...");
    const campaigns = await Promise.all(
      campaignNames.map(async (name, index) => {
        const startDate = new Date(2023, index % 12, 1);
        const endDate = new Date(2024, (index + 3) % 12, 28);
        const goal = randomInt(5, 50) * 10000;
        
        return prisma.campaign.create({
          data: {
            name,
            description: `Description de la campagne ${name}`,
            campaignType: "FUNDRAISING",
            status: randomElement(["ACTIVE", "COMPLETED", "DRAFT"] as const),
            goalAmount: goal,
            totalRaised: 0,
            donationCount: 0,
            startDate,
            endDate,
            slug: `campaign-${index}-${Date.now()}`,
          },
        });
      })
    );

    // Créer des donateurs avec donations
    console.log("👥 Creating donors with donations...");
    const donorCount = 50;
    let totalDonationsCreated = 0;
    
    for (let i = 0; i < donorCount; i++) {
      const firstName = randomElement(firstNames);
      const lastName = randomElement(lastNames);
      const cityData = randomElement(cities);
      const email = generateEmail(firstName, lastName);
      
      // Nombre de donations pour ce donateur (1 à 15)
      const numDonations = randomInt(1, 15);
      
      // Générer les donations d'abord pour calculer les statistiques
      const donationData: Array<{
        amount: number;
        date: Date;
        campaignId: string;
        campaignName: string;
        paymentMethod: typeof paymentMethods[number];
      }> = [];
      
      for (let j = 0; j < numDonations; j++) {
        const campaign = randomElement(campaigns);
        donationData.push({
          amount: randomInt(1, 100) * 10 + randomInt(0, 9),
          date: randomDate(new Date(2022, 0, 1), new Date()),
          campaignId: campaign.id,
          campaignName: campaign.name,
          paymentMethod: randomElement(paymentMethods),
        });
      }
      
      // Trier par date
      donationData.sort((a, b) => a.date.getTime() - b.date.getTime());
      
      // Calculer les statistiques
      const totalDonations = donationData.reduce((sum, d) => sum + d.amount, 0);
      const donationCountForDonor = donationData.length;
      const averageDonation = totalDonations / donationCountForDonor;
      const highestDonation = Math.max(...donationData.map(d => d.amount));
      const firstDonationDate = donationData[0].date;
      const lastDonationDate = donationData[donationData.length - 1].date;
      
      // Créer le donateur
      const donor = await prisma.donor.create({
        data: {
          firstName,
          lastName,
          email,
          phone: generatePhone(),
          mobile: Math.random() > 0.3 ? generatePhone() : null,
          address: `${randomInt(1, 9999)} ${randomElement(streets)}`,
          city: cityData.city,
          state: cityData.state,
          postalCode: generatePostalCode(cityData.postalPrefix),
          country: "Canada",
          status: randomElement(["ACTIVE", "ACTIVE", "ACTIVE", "INACTIVE", "LAPSED"] as const),
          donorType: randomElement(["INDIVIDUAL", "INDIVIDUAL", "INDIVIDUAL", "CORPORATE", "FOUNDATION"] as const),
          segment: randomElement(segments),
          source: randomElement(sources),
          notes: Math.random() > 0.5 ? `Donateur ${randomElement(["fidèle", "engagé", "régulier", "généreux"])}. ${randomElement(["Préfère les communications par email.", "Intéressé par les projets éducatifs.", "Participe aux événements.", ""])}` : null,
          consentEmail: Math.random() > 0.2,
          consentPhone: Math.random() > 0.6,
          consentMail: Math.random() > 0.5,
          totalDonations,
          donationCount: donationCountForDonor,
          averageDonation,
          highestDonation,
          firstDonationDate,
          lastDonationDate,
          tags: Math.random() > 0.5 ? [randomElement(["VIP", "Bénévole", "Membre", "Parrain", "Ambassadeur"])] : [],
        },
      });
      
      // Créer les donations
      for (const donation of donationData) {
        await prisma.donation.create({
          data: {
            donorId: donor.id,
            amount: donation.amount,
            donationDate: donation.date,
            status: "COMPLETED",
            paymentMethod: donation.paymentMethod,
            campaignId: donation.campaignId,
            campaignName: donation.campaignName,
            isRecurring: Math.random() > 0.8,
            isAnonymous: Math.random() > 0.95,
            receiptNumber: `REC-${new Date().getFullYear()}-${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
          },
        });
        totalDonationsCreated++;
      }
      
      // Mettre à jour les statistiques de la campagne
      for (const donation of donationData) {
        await prisma.campaign.update({
          where: { id: donation.campaignId },
          data: {
            totalRaised: { increment: donation.amount },
            donationCount: { increment: 1 },
          },
        });
      }
    }
    
    // Statistiques finales
    const finalDonorCount = await prisma.donor.count();
    const finalDonationCount = await prisma.donation.count();
    const totalAmount = await prisma.donation.aggregate({ _sum: { amount: true } });
    const campaignCount = await prisma.campaign.count();
    
    return NextResponse.json({
      success: true,
      message: "Seed completed successfully",
      stats: {
        donors: finalDonorCount,
        donations: finalDonationCount,
        campaigns: campaignCount,
        totalAmount: totalAmount._sum.amount || 0,
      },
    });
  } catch (error) {
    console.error("Seed error:", error);
    return NextResponse.json(
      { success: false, error: "Seed failed" },
      { status: 500 }
    );
  }
}
