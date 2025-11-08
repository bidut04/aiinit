import bcrypt from "bcryptjs";
import { PrismaClient, UserRole, Prisma } from "@prisma/client";
import { config } from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

// Prisma client
const prisma = new PrismaClient();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env from root
config({ path: join(__dirname, "..", ".env") });

// Type for table check query result
type TableCheckResult = { exists: boolean };

// Type for created user with profile
type UserWithProfile = Prisma.UserGetPayload<{
  include: { superAdminProfile: true };
}>;

async function createSuperAdmin(): Promise<void> {
  const email = "barunbhowmick727@gmail.com";
  const password = "bIDYUT@1234";

  try {
    console.log("🔄 Connecting to database...");
    console.log(
      "📍 Database:",
      process.env.DATABASE_URL?.split("@")[1]?.split("/")[1] || "Unknown"
    );

    await prisma.$connect();
    console.log("✅ Database connected successfully\n");

    // Check if User table exists
    console.log("🔍 Checking if User table exists...");
    const tableCheck = await prisma.$queryRaw<TableCheckResult[]>`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'User'
      ) as exists;
    `;

    if (!tableCheck[0]?.exists) {
      console.error("\n❌ User table does not exist!");
      console.error("Run: cd packages/database && pnpm prisma db push && pnpm prisma generate\n");
      process.exit(1);
    }
    console.log("✅ User table exists\n");

    // Hash the password
    console.log("🔐 Hashing password...");
    const hashedPassword = await bcrypt.hash(password, 12);

    // Check if user already exists
    console.log("🔍 Checking for existing user...");
    const existingUser = await prisma.user.findUnique({
      where: { email },
      include: { superAdminProfile: true },
    });

    if (existingUser) {
      console.log("⚠️  User already exists with this email");
      console.log("📧 Email:", existingUser.email);
      console.log("👤 Name:", existingUser.name);
      console.log("🆔 User ID:", existingUser.id);
      console.log("🔑 Role:", existingUser.role);

      // Upgrade role to SUPERADMIN if not already
      if (existingUser.role !== UserRole.SUPERADMIN) {
        console.log("\n🔄 Updating user role to SUPERADMIN...");
        
        await prisma.user.update({
          where: { id: existingUser.id },
          data: {
            role: UserRole.SUPERADMIN,
            emailVerified: existingUser.emailVerified || new Date(),
          },
        });

        // Create SuperAdminProfile if missing
        if (!existingUser.superAdminProfile) {
          console.log("🔄 Creating SuperAdminProfile...");
          await prisma.superAdminProfile.create({
            data: {
              userId: existingUser.id,
              hashedPassword,
              twoFactorEnabled: true,
            },
          });
        } else {
          // Update existing profile password
          console.log("🔄 Updating SuperAdminProfile password...");
          await prisma.superAdminProfile.update({
            where: { userId: existingUser.id },
            data: { hashedPassword },
          });
        }

        console.log("✅ User upgraded to SUPERADMIN\n");
      } else {
        console.log("\n✓ User is already a SUPERADMIN");
        
        // Update password if profile exists
        if (existingUser.superAdminProfile) {
          console.log("🔄 Updating password...");
          await prisma.superAdminProfile.update({
            where: { userId: existingUser.id },
            data: { hashedPassword },
          });
          console.log("✅ Password updated\n");
        }
      }
      
      console.log("\n🔒 Login Credentials:");
      console.log("Email:", email);
      console.log("Password:", password);
      return;
    }

    console.log("📝 Creating super admin user...");

    const user: UserWithProfile = await prisma.user.create({
      data: {
        email,
        name: "Super Admin",
        role: UserRole.SUPERADMIN,
        emailVerified: new Date(),
        isActive: true,
        superAdminProfile: {
          create: {
            hashedPassword,
            twoFactorEnabled: true,
          },
        },
      },
      include: {
        superAdminProfile: true,
      },
    });

    console.log("\n✅ Super admin created successfully!");
    console.log("━".repeat(50));
    console.log("📧 Email:", user.email);
    console.log("👤 Name:", user.name);
    console.log("🆔 User ID:", user.id);
    console.log("🔑 Role:", user.role);
    console.log("✓ Email Verified:", user.emailVerified ? "Yes" : "No");
    console.log("✓ Account Active:", user.isActive ? "Yes" : "No");
    console.log(
      "🔐 2FA Enabled:",
      user.superAdminProfile?.twoFactorEnabled ? "Yes" : "No"
    );
    console.log("━".repeat(50));
    console.log("\n🔒 Login Credentials:");
    console.log("Email:", email);
    console.log("Password:", password);
    console.log("━".repeat(50));
  } catch (error: unknown) {
    console.error("\n❌ Error creating super admin");
    
    if (error instanceof Error) {
      console.error("Error Message:", error.message);
    }

    // Handle Prisma errors
    if (error && typeof error === "object" && "code" in error) {
      const prismaError = error as { code: string; meta?: any };
      
      switch (prismaError.code) {
        case "P2021":
          console.error("\n⚠️  Database tables do not exist!");
          console.error("Run: cd packages/database && pnpm prisma db push && pnpm prisma generate");
          break;
        case "P2002":
          console.error("\n⚠️  Email already registered");
          console.error("This shouldn't happen as we check for existing users first");
          break;
        case "P2003":
          console.error("\n⚠️  Foreign key constraint failed");
          console.error("Check your database schema relationships");
          break;
        case "P2025":
          console.error("\n⚠️  Record not found");
          break;
        default:
          console.error("\n⚠️  Unexpected Prisma error occurred");
          console.error("Error code:", prismaError.code);
          if (prismaError.meta) {
            console.error("Meta:", prismaError.meta);
          }
      }
    }

    if (error instanceof Error && error.stack) {
      console.error("\n📋 Stack trace:");
      console.error(error.stack);
    }

    process.exit(1);
  } finally {
    await prisma.$disconnect();
    console.log("\n👋 Database connection closed");
  }
}

// Run the function
createSuperAdmin()
  .then(() => {
    console.log("\n✨ Script completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n💥 Unhandled error:", error);
    process.exit(1);
  });