import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || "postgresql://postgres:DSCeLISPbWoLYHDubmnLMEXLXrDQdgYl@hopper.proxy.rlwy.net:10280/railway",
    },
  },
});

async function main() {
  console.log("Applying fixes to EmailCampaign table...");

  try {
    // Check if table exists
    const tableExists = await prisma.$queryRawUnsafe<Array<{ exists: boolean }>>(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'EmailCampaign'
      ) as exists;
    `);

    if (!tableExists[0]?.exists) {
      console.log("⚠️  Table EmailCampaign does not exist yet. It will be created when migrations are run.");
      return;
    }

    // Add default UUID to id column if it doesn't exist
    await prisma.$executeRawUnsafe(`
      DO $$
      BEGIN
        -- Check if default exists, if not add it
        IF NOT EXISTS (
          SELECT 1 FROM pg_attrdef 
          WHERE adrelid = '"EmailCampaign"'::regclass 
          AND adnum = (
            SELECT attnum FROM pg_attribute 
            WHERE attrelid = '"EmailCampaign"'::regclass 
            AND attname = 'id'
          )
        ) THEN
          ALTER TABLE "EmailCampaign" ALTER COLUMN id SET DEFAULT gen_random_uuid()::text;
        END IF;
      END $$;
    `);
    console.log("✓ Added default UUID to id column");

    // Add default to updatedAt column if it doesn't exist
    await prisma.$executeRawUnsafe(`
      DO $$
      BEGIN
        -- Check if default exists, if not add it
        IF NOT EXISTS (
          SELECT 1 FROM pg_attrdef 
          WHERE adrelid = '"EmailCampaign"'::regclass 
          AND adnum = (
            SELECT attnum FROM pg_attribute 
            WHERE attrelid = '"EmailCampaign"'::regclass 
            AND attname = 'updatedAt'
          )
        ) THEN
          ALTER TABLE "EmailCampaign" ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP;
        END IF;
      END $$;
    `);
    console.log("✓ Added default to updatedAt column");

    // Update existing rows to have updatedAt = createdAt if updatedAt is null
    await prisma.$executeRawUnsafe(`
      UPDATE "EmailCampaign"
      SET "updatedAt" = "createdAt"
      WHERE "updatedAt" IS NULL;
    `);
    console.log("✓ Updated existing rows");

    console.log("✅ All fixes applied successfully!");
  } catch (error) {
    console.error("Error applying fixes:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
