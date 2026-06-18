// ============================================================
// prisma/seed.ts — Database Seeder
// ============================================================
//
// 🎓 TEACHING: What is seeding?
//
// Seeding = populating the database with initial data.
// Some data must exist before the app can work:
//   - Default expense categories ("Food", "Transport", etc.)
//   - Admin accounts
//   - Configuration records
//
// Running `npm run db:seed` executes this file.
// Prisma calls it with `prisma db seed` under the hood.
//
// IMPORTANT: Seed files should be IDEMPOTENT — running them
// multiple times should produce the same result without
// duplicating data. We use `upsert` for this.
//
// 🎓 TEACHING: upsert = "update if exists, insert if not"
//   It's like saying: "Create this if it doesn't exist,
//   otherwise update it." Perfect for seeds.
// ============================================================

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// ── Default Categories ───────────────────────────────────────
// These are system-wide categories available to all users.
// userId = null means "belongs to everyone"
//
// Design decision: We include both emoji icons and hex colors
// so the UI can display them richly without any extra config.
const DEFAULT_CATEGORIES = [
  { name: "Food & Dining",    icon: "🍕", color: "#FF6B6B" },
  { name: "Transportation",   icon: "🚗", color: "#4ECDC4" },
  { name: "Shopping",         icon: "🛍️", color: "#45B7D1" },
  { name: "Entertainment",    icon: "🎬", color: "#96CEB4" },
  { name: "Healthcare",       icon: "🏥", color: "#FF8B94" },
  { name: "Housing",          icon: "🏠", color: "#A8E6CF" },
  { name: "Education",        icon: "📚", color: "#FFD93D" },
  { name: "Travel",           icon: "✈️", color: "#6C5CE7" },
  { name: "Utilities",        icon: "⚡", color: "#74B9FF" },
  { name: "Personal Care",    icon: "💄", color: "#FD79A8" },
  { name: "Fitness",          icon: "💪", color: "#55EFC4" },
  { name: "Subscriptions",    icon: "📱", color: "#FDCB6E" },
  { name: "Gifts & Donations",icon: "🎁", color: "#E17055" },
  { name: "Business",        icon: "💼", color: "#636E72" },
  { name: "Investments",     icon: "📈", color: "#00B894" },
  { name: "Other",           icon: "📦", color: "#B2BEC3" },
];

async function main() {
  console.log("🌱 Starting database seed...");

  // ── Seed Default Categories ─────────────────────────────
  console.log(`📂 Seeding ${DEFAULT_CATEGORIES.length} default categories...`);

  for (const category of DEFAULT_CATEGORIES) {
    // Prisma can't use `null` in compound unique `where` clauses,
    // so we use findFirst + create instead of upsert.
    const existing = await prisma.category.findFirst({
      where: { name: category.name, userId: null },
    });

    if (existing) {
      // Update icon/color if changed
      await prisma.category.update({
        where: { id: existing.id },
        data: { icon: category.icon, color: category.color },
      });
    } else {
      await prisma.category.create({
        data: {
          name: category.name,
          icon: category.icon,
          color: category.color,
          isDefault: true,
          // userId is null = system-wide default category
        },
      });
    }
  }

  console.log("✅ Default categories seeded successfully");

  // ── Optional: Seed Demo User (Development Only) ─────────
  if (process.env["NODE_ENV"] === "development") {
    const bcryptModule = await import("bcryptjs");
    const bcrypt = bcryptModule.default ?? bcryptModule;
    const demoEmail = "demo@expensetracker.com";

    await prisma.user.upsert({
      where: { email: demoEmail },
      update: {},
      create: {
        email: demoEmail,
        name: "Demo User",
        passwordHash: await bcrypt.hash("demo123456", 12),
        defaultCurrency: "USD",
        timezone: "America/New_York",
      },
    });

    console.log(`✅ Demo user seeded: ${demoEmail} / demo123456`);
  }

  console.log("🎉 Database seed complete!");
}

// ── Run and handle errors ────────────────────────────────────
main()
  .catch((error) => {
    console.error("❌ Seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    // Always disconnect Prisma when done
    // Otherwise the process hangs waiting for the DB connection to close
    await prisma.$disconnect();
  });
