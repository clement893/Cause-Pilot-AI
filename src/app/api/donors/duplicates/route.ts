import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Algorithme de scoring de similarité
function calculateSimilarity(str1: string | null, str2: string | null): number {
  if (!str1 || !str2) return 0;
  
  const s1 = str1.toLowerCase().trim();
  const s2 = str2.toLowerCase().trim();
  
  if (s1 === s2) return 1;
  if (s1.length === 0 || s2.length === 0) return 0;
  
  // Levenshtein distance normalisée
  const maxLen = Math.max(s1.length, s2.length);
  const distance = levenshteinDistance(s1, s2);
  return 1 - (distance / maxLen);
}

function levenshteinDistance(str1: string, str2: string): number {
  const m = str1.length;
  const n = str2.length;
  const dp: number[][] = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));
  
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (str1[i - 1] === str2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
      }
    }
  }
  
  return dp[m][n];
}

// Calcul du score de doublon entre deux donateurs
interface DonorData {
  id?: string;
  email?: string | null;
  firstName: string;
  lastName: string;
  phone?: string | null;
  mobile?: string | null;
  address?: string | null;
  city?: string | null;
  postalCode?: string | null;
}

function calculateDuplicateScore(donor1: DonorData, donor2: DonorData): {
  score: number;
  matches: { field: string; score: number; value1: string | null; value2: string | null }[];
} {
  const matches: { field: string; score: number; value1: string | null; value2: string | null }[] = [];
  
  // Email exact match = très haute probabilité
  if (donor1.email && donor2.email) {
    const emailScore = donor1.email.toLowerCase() === donor2.email.toLowerCase() ? 1 : 0;
    if (emailScore > 0) {
      matches.push({ field: "email", score: emailScore, value1: donor1.email, value2: donor2.email });
    }
  }
  
  // Nom complet
  const firstNameScore = calculateSimilarity(donor1.firstName, donor2.firstName);
  const lastNameScore = calculateSimilarity(donor1.lastName, donor2.lastName);
  
  if (firstNameScore > 0.8) {
    matches.push({ field: "firstName", score: firstNameScore, value1: donor1.firstName, value2: donor2.firstName });
  }
  if (lastNameScore > 0.8) {
    matches.push({ field: "lastName", score: lastNameScore, value1: donor1.lastName, value2: donor2.lastName });
  }
  
  // Téléphone (normaliser les numéros)
  const normalizePhone = (phone: string | null) => phone?.replace(/[\s\-\.\(\)]/g, "") || null;
  const phone1 = normalizePhone(donor1.phone) || normalizePhone(donor1.mobile);
  const phone2 = normalizePhone(donor2.phone) || normalizePhone(donor2.mobile);
  
  if (phone1 && phone2 && phone1 === phone2) {
    matches.push({ field: "phone", score: 1, value1: phone1, value2: phone2 });
  }
  
  // Adresse
  if (donor1.address && donor2.address) {
    const addressScore = calculateSimilarity(donor1.address, donor2.address);
    if (addressScore > 0.7) {
      matches.push({ field: "address", score: addressScore, value1: donor1.address, value2: donor2.address });
    }
  }
  
  // Code postal
  if (donor1.postalCode && donor2.postalCode) {
    const postalScore = donor1.postalCode.replace(/\s/g, "") === donor2.postalCode.replace(/\s/g, "") ? 1 : 0;
    if (postalScore > 0) {
      matches.push({ field: "postalCode", score: postalScore, value1: donor1.postalCode, value2: donor2.postalCode });
    }
  }
  
  // Calcul du score final pondéré
  let totalScore = 0;
  const weights: Record<string, number> = {
    email: 50,      // Email identique = très fort indicateur
    firstName: 15,
    lastName: 20,
    phone: 30,      // Téléphone identique = fort indicateur
    address: 10,
    postalCode: 5,
  };
  
  let maxPossibleScore = 0;
  for (const match of matches) {
    totalScore += match.score * (weights[match.field] || 10);
  }
  
  // Score maximum possible si tous les champs correspondent
  for (const weight of Object.values(weights)) {
    maxPossibleScore += weight;
  }
  
  const normalizedScore = Math.min(100, Math.round((totalScore / maxPossibleScore) * 100));
  
  return { score: normalizedScore, matches };
}

// GET - Rechercher les doublons pour un donateur spécifique ou scanner toute la base
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const donorId = searchParams.get("donorId");
    const scanAll = searchParams.get("scanAll") === "true";
    const minScore = parseInt(searchParams.get("minScore") || "50");
    
    if (donorId) {
      // Rechercher les doublons pour un donateur spécifique
      const donor = await prisma.donor.findUnique({
        where: { id: donorId },
      });
      
      if (!donor) {
        return NextResponse.json({ error: "Donateur non trouvé" }, { status: 404 });
      }
      
      const allDonors = await prisma.donor.findMany({
        where: { id: { not: donorId } },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          phone: true,
          mobile: true,
          address: true,
          city: true,
          postalCode: true,
          createdAt: true,
        },
      });
      
      const duplicates = [];
      for (const otherDonor of allDonors) {
        const { score, matches } = calculateDuplicateScore(donor, otherDonor);
        if (score >= minScore) {
          duplicates.push({
            donor: otherDonor,
            score,
            matches,
          });
        }
      }
      
      duplicates.sort((a, b) => b.score - a.score);
      
      return NextResponse.json({
        sourceDonor: donor,
        duplicates: duplicates.slice(0, 20), // Limiter à 20 résultats
        totalFound: duplicates.length,
      });
    }
    
    if (scanAll) {
      // Scanner toute la base pour trouver les doublons
      const allDonors = await prisma.donor.findMany({
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          phone: true,
          mobile: true,
          address: true,
          city: true,
          postalCode: true,
          createdAt: true,
        },
        orderBy: { createdAt: "asc" },
      });
      
      const duplicateGroups: {
        donors: typeof allDonors;
        score: number;
        matches: { field: string; score: number; value1: string | null; value2: string | null }[];
      }[] = [];
      
      const processedPairs = new Set<string>();
      
      for (let i = 0; i < allDonors.length; i++) {
        for (let j = i + 1; j < allDonors.length; j++) {
          const pairKey = [allDonors[i].id, allDonors[j].id].sort().join("-");
          if (processedPairs.has(pairKey)) continue;
          
          const { score, matches } = calculateDuplicateScore(allDonors[i], allDonors[j]);
          
          if (score >= minScore) {
            duplicateGroups.push({
              donors: [allDonors[i], allDonors[j]],
              score,
              matches,
            });
            processedPairs.add(pairKey);
          }
        }
      }
      
      duplicateGroups.sort((a, b) => b.score - a.score);
      
      return NextResponse.json({
        duplicateGroups: duplicateGroups.slice(0, 100), // Limiter à 100 groupes
        totalFound: duplicateGroups.length,
        totalDonors: allDonors.length,
      });
    }
    
    return NextResponse.json({ error: "Paramètre donorId ou scanAll requis" }, { status: 400 });
  } catch (error) {
    console.error("Error detecting duplicates:", error);
    return NextResponse.json(
      { error: "Erreur lors de la détection des doublons" },
      { status: 500 }
    );
  }
}

// POST - Vérifier les doublons pour une liste de donateurs (utilisé pendant l'import)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { donors, minScore = 50 } = body as { donors: DonorData[]; minScore?: number };
    
    if (!donors || !Array.isArray(donors)) {
      return NextResponse.json({ error: "Liste de donateurs requise" }, { status: 400 });
    }
    
    // Récupérer tous les donateurs existants
    const existingDonors = await prisma.donor.findMany({
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        mobile: true,
        address: true,
        city: true,
        postalCode: true,
      },
    });
    
    const results: {
      index: number;
      newDonor: DonorData;
      duplicates: {
        existingDonor: typeof existingDonors[0];
        score: number;
        matches: { field: string; score: number; value1: string | null; value2: string | null }[];
      }[];
    }[] = [];
    
    for (let i = 0; i < donors.length; i++) {
      const newDonor = donors[i];
      const duplicates = [];
      
      for (const existingDonor of existingDonors) {
        const { score, matches } = calculateDuplicateScore(newDonor, existingDonor);
        if (score >= minScore) {
          duplicates.push({
            existingDonor,
            score,
            matches,
          });
        }
      }
      
      if (duplicates.length > 0) {
        duplicates.sort((a, b) => b.score - a.score);
        results.push({
          index: i,
          newDonor,
          duplicates: duplicates.slice(0, 5), // Top 5 doublons potentiels
        });
      }
    }
    
    return NextResponse.json({
      duplicatesFound: results.length,
      totalChecked: donors.length,
      results,
    });
  } catch (error) {
    console.error("Error checking duplicates:", error);
    return NextResponse.json(
      { error: "Erreur lors de la vérification des doublons" },
      { status: 500 }
    );
  }
}
