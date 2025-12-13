import bcrypt from "bcryptjs";

// Note: bcryptjs est une implémentation JavaScript pure de bcrypt
// Elle est plus lente que bcrypt natif mais fonctionne partout

/**
 * Hash un mot de passe
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

/**
 * Vérifie un mot de passe contre un hash
 */
export async function verifyPassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

