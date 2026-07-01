import { PrismaClient } from "@prisma/client";
import { hashPassword } from "better-auth/crypto";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");
  const defaultPasswordHash = await hashPassword("password123");

  // Ensure passwords are updated even if the users/accounts already exist (Prisma upsert update: {} workaround)
  await prisma.account.updateMany({
    where: {
      id: {
        in: ["admin-account", "agency-account", "traveler-account"],
      },
    },
    data: {
      password: defaultPasswordHash,
    },
  });

  // Create demo admin user (password: admin123)
  const admin = await prisma.user.upsert({
    where: { email: "admin@waypoint.dev" },
    update: {},
    create: {
      name: "Admin User",
      email: "admin@waypoint.dev",
      emailVerified: true,
      role: "ADMIN",
      accounts: {
        create: {
          id: "admin-account",
          accountId: "admin-account-id",
          providerId: "credential",
          accessToken: null,
          refreshToken: null,
          password: defaultPasswordHash,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      },
    },
  });
  console.log("✅ Admin user created:", admin.email);

  // Create demo agency user
  const agencyUser = await prisma.user.upsert({
    where: { email: "agency@waypoint.dev" },
    update: {},
    create: {
      name: "Wanderlust Travels",
      email: "agency@waypoint.dev",
      emailVerified: true,
      role: "AGENCY",
      accounts: {
        create: {
          id: "agency-account",
          accountId: "agency-account-id",
          providerId: "credential",
          accessToken: null,
          refreshToken: null,
          password: defaultPasswordHash,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      },
    },
  });

  // Create agency
  const agency = await prisma.agency.upsert({
    where: { ownerId: agencyUser.id },
    update: {},
    create: {
      name: "Wanderlust Travels",
      slug: "wanderlust-travels",
      description:
        "Premium travel experiences across India and Southeast Asia. Expert curated itineraries since 2015.",
      ownerId: agencyUser.id,
      email: "agency@waypoint.dev",
      phone: "+91 98765 43210",
      website: "https://wanderlust.example.com",
      verified: true,
      active: true,
    },
  });
  console.log("✅ Agency created:", agency.name);

  // Create demo packages
  const packages = await Promise.all([
    prisma.package.upsert({
      where: { slug: "golden-triangle-tour" },
      update: {},
      create: {
        agencyId: agency.id,
        title: "Golden Triangle Tour",
        slug: "golden-triangle-tour",
        description:
          "Explore Delhi, Agra, and Jaipur — India's most iconic destinations. Visit the magnificent Taj Mahal, explore the Red Fort, and shop in vibrant bazaars.",
        highlights: [
          "Visit the Taj Mahal at sunrise",
          "Explore Jaipur's Amber Fort",
          "Shop in historic Chandni Chowk",
          "Traditional Rajasthani dinner",
        ],
        duration: 7,
        maxGroupSize: 15,
        difficulty: "EASY",
        status: "PUBLISHED",
        featured: true,
        basePrice: 24999,
        currency: "INR",
        destinations: [
          { name: "Delhi", country: "India", lat: 28.6139, lng: 77.209 },
          { name: "Agra", country: "India", lat: 27.1767, lng: 78.0081 },
          { name: "Jaipur", country: "India", lat: 26.9124, lng: 75.7873 },
        ],
        inclusions: [
          "4-star hotel stays",
          "Daily breakfast",
          "Private AC car and driver",
          "Local tour guides",
          "Airport transfers",
        ],
        exclusions: [
          "Monument entry fees",
          "Lunch & dinner",
          "Flights/trains to Delhi",
          "Personal expenses",
          "Travel insurance",
        ],
        images: [],
      },
    }),
    prisma.package.upsert({
      where: { slug: "kerala-backwaters-bliss" },
      update: {},
      create: {
        agencyId: agency.id,
        title: "Kerala Backwaters Bliss",
        slug: "kerala-backwaters-bliss",
        description:
          "Cruise through serene backwaters, explore tea gardens, and relax on pristine beaches in God's Own Country.",
        highlights: [
          "Overnight luxury houseboat stay",
          "Explore Munnar tea estates",
          "Relax on Kovalam beaches",
          "Spice plantation walk",
        ],
        duration: 5,
        maxGroupSize: 12,
        difficulty: "EASY",
        status: "PUBLISHED",
        featured: true,
        basePrice: 18999,
        currency: "INR",
        destinations: [
          { name: "Kochi", country: "India", lat: 9.9312, lng: 76.2673 },
          { name: "Munnar", country: "India", lat: 10.0889, lng: 77.0595 },
          { name: "Alleppey", country: "India", lat: 9.4981, lng: 76.3388 },
        ],
        inclusions: [
          "3-star resort & houseboat",
          "Houseboat meals included",
          "AC sedan transport",
          "Spice plantation tour",
        ],
        exclusions: [
          "Airfare/train fare",
          "Entry charges",
          "Activities like boat ride",
          "Tips",
        ],
        images: [],
      },
    }),
    prisma.package.upsert({
      where: { slug: "himalayan-adventure-trek" },
      update: {},
      create: {
        agencyId: agency.id,
        title: "Himalayan Adventure",
        slug: "himalayan-adventure-trek",
        description:
          "Trek through breathtaking mountain trails and experience the raw beauty of the Himalayas.",
        highlights: [
          "Drive through Khardung La pass",
          "Camp under stars in Nubra Valley",
          "Visit Pangong Lake",
          "Local monastery visits",
        ],
        duration: 10,
        maxGroupSize: 10,
        difficulty: "CHALLENGING",
        status: "PUBLISHED",
        basePrice: 35999,
        currency: "INR",
        destinations: [
          { name: "Manali", country: "India", lat: 32.2396, lng: 77.1887 },
          { name: "Leh", country: "India", lat: 34.1526, lng: 77.5771 },
          {
            name: "Nubra Valley",
            country: "India",
            lat: 34.6865,
            lng: 77.5713,
          },
        ],
        inclusions: [
          "Camp & hotel accommodations",
          "Breakfast & Dinner",
          "Inner Line Permits",
          "Oxygen cylinders in vehicle",
        ],
        exclusions: [
          "Flights to/from Leh",
          "Lunch",
          "Adventure activities like rafting",
          "Travel insurance",
        ],
        images: [],
      },
    }),
  ]);

  console.log(`✅ ${packages.length} packages created`);

  // Create demo traveler
  const traveler = await prisma.user.upsert({
    where: { email: "traveler@waypoint.dev" },
    update: {},
    create: {
      name: "Rahul Sharma",
      email: "traveler@waypoint.dev",
      emailVerified: true,
      role: "TRAVELER",
      accounts: {
        create: {
          id: "traveler-account",
          accountId: "traveler-account-id",
          providerId: "credential",
          accessToken: null,
          refreshToken: null,
          password: defaultPasswordHash,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      },
    },
  });
  console.log("✅ Traveler user created:", traveler.email);

  // Create a demo booking
  const booking = await prisma.booking.create({
    data: {
      userId: traveler.id,
      agencyId: agency.id,
      packageId: packages[0].id,
      status: "CONFIRMED",
      travelers: [
        { name: "Rahul Sharma", age: 28 },
        { name: "Priya Sharma", age: 26 },
      ],
      specialRequests: "Vegetarian meals preferred",
      totalAmount: 49998,
      currency: "INR",
      travelDate: new Date("2026-07-15"),
      returnDate: new Date("2026-07-22"),
    },
  });
  console.log("✅ Demo booking created:", booking.bookingNumber);

  // Create demo reviews
  await prisma.review.createMany({
    data: [
      {
        userId: traveler.id,
        packageId: packages[0].id,
        rating: 5,
        title: "Amazing experience!",
        comment:
          "The Golden Triangle Tour was absolutely incredible. The Taj Mahal at sunrise was breathtaking. Highly recommended!",
      },
    ],
    skipDuplicates: true,
  });
  console.log("✅ Demo reviews created");

  console.log("\n🎉 Database seeded successfully!");
  console.log("\nDemo accounts:");
  console.log("  Admin:    admin@waypoint.dev");
  console.log("  Agency:   agency@waypoint.dev");
  console.log("  Traveler: traveler@waypoint.dev");
  console.log("  (Use Better Auth registration to create proper password-hashed accounts)");
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
