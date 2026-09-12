import { PrismaClient, Prisma, Package, Booking } from "@prisma/client";
import { hashPassword } from "better-auth/crypto";

const prisma = new PrismaClient();

// ────────────────────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────────────────────

const DEMO_PASSWORD = "password123";

function daysFromNow(days: number): Date {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d;
}

function daysAgo(days: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d;
}

function cuid(): string {
  // Simple cuid-like ID generator for seed data
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let id = "c";
  for (let i = 0; i < 24; i++) {
    id += chars[Math.floor(Math.random() * chars.length)];
  }
  return id;
}

// ────────────────────────────────────────────────────────────────────────────
// Main
// ────────────────────────────────────────────────────────────────────────────

async function main() {
  console.log("🌱 Seeding Waypoint demo database...\n");

  const hashedPw = await hashPassword(DEMO_PASSWORD);

  // ──────────────────────────────────────────────────────────────────────────
  // 1. USERS
  // ──────────────────────────────────────────────────────────────────────────
  console.log("👤 Creating users...");

  const adminUser = await prisma.user.upsert({
    where: { email: "admin@waypoint.dev" },
    update: { name: "Daksh Nimavat", role: "ADMIN" },
    create: {
      name: "Daksh Nimavat",
      email: "admin@waypoint.dev",
      role: "ADMIN",
      emailVerified: true,
      phone: "+91 99998 00001",
    },
  });

  const agencyUser = await prisma.user.upsert({
    where: { email: "agency@waypoint.dev" },
    update: { name: "Wanderlust Travels", role: "AGENCY" },
    create: {
      name: "Wanderlust Travels",
      email: "agency@waypoint.dev",
      role: "AGENCY",
      emailVerified: true,
      phone: "+91 98765 43210",
    },
  });

  const staffUser = await prisma.user.upsert({
    where: { email: "staff@waypoint.dev" },
    update: { name: "Ananya Desai", role: "STAFF" },
    create: {
      name: "Ananya Desai",
      email: "staff@waypoint.dev",
      role: "STAFF",
      emailVerified: true,
      phone: "+91 98765 11111",
    },
  });

  const travelerUser = await prisma.user.upsert({
    where: { email: "traveler@waypoint.dev" },
    update: { name: "Rahul Sharma", role: "TRAVELER" },
    create: {
      name: "Rahul Sharma",
      email: "traveler@waypoint.dev",
      role: "TRAVELER",
      emailVerified: true,
      phone: "+91 91234 56789",
    },
  });

  const allUsers = [adminUser, agencyUser, staffUser, travelerUser];
  console.log(`   ✅ ${allUsers.length} users ready`);

  // ──────────────────────────────────────────────────────────────────────────
  // 2. ACCOUNT RECORDS (Better Auth credential login)
  // ──────────────────────────────────────────────────────────────────────────
  console.log("🔐 Creating auth accounts...");

  for (const user of allUsers) {
    const accountId = cuid();
    const existing = await prisma.account.findFirst({
      where: { userId: user.id, providerId: "credential" },
    });
    if (!existing) {
      await prisma.account.create({
        data: {
          id: accountId,
          accountId: user.id,
          providerId: "credential",
          userId: user.id,
          password: hashedPw,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });
    }
  }
  console.log("   ✅ Auth accounts ready (password: password123)");

  // ──────────────────────────────────────────────────────────────────────────
  // 3. AGENCY
  // ──────────────────────────────────────────────────────────────────────────
  console.log("🏢 Creating agency...");

  const agency = await prisma.agency.upsert({
    where: { slug: "wanderlust-travels" },
    update: {},
    create: {
      ownerId: agencyUser.id,
      name: "Wanderlust Travels",
      slug: "wanderlust-travels",
      description:
        "Premier travel agency specializing in luxury North India, South India, and Himalayan tours. With 10+ years of experience, we craft unforgettable journeys across India's most iconic destinations.",
      logo: "https://images.unsplash.com/photo-1599305445671-ac291c95aaa9?w=200",
      phone: "+91 98765 43210",
      email: "hello@wanderlust-travels.in",
      website: "https://wanderlust.example.com",
      address: "42, Rajiv Chowk, Connaught Place, New Delhi 110001, India",
      verified: true,
      commissionRate: 0.08, // 8% override (platform default is 10%)
      bankAccountName: "Wanderlust Travels Pvt Ltd",
      bankAccountNumber: "1234567890123456",
      bankIfscCode: "HDFC0001234",
      bankName: "HDFC Bank",
      upiId: "wanderlust@hdfcbank",
    },
  });
  console.log("   ✅ Wanderlust Travels created");

  // ──────────────────────────────────────────────────────────────────────────
  // 4. STAFF
  // ──────────────────────────────────────────────────────────────────────────
  console.log("👥 Creating staff...");

  await prisma.agencyStaff.upsert({
    where: { userId: staffUser.id },
    update: {},
    create: {
      userId: staffUser.id,
      agencyId: agency.id,
      role: "MANAGER",
      active: true,
    },
  });
  console.log("   ✅ Ananya Desai → Manager @ Wanderlust");

  // ──────────────────────────────────────────────────────────────────────────
  // 5. TRAVELER PROFILE
  // ──────────────────────────────────────────────────────────────────────────
  console.log("📋 Creating traveler profile...");

  await prisma.travelerProfile.upsert({
    where: { userId: travelerUser.id },
    update: {},
    create: {
      userId: travelerUser.id,
      dateOfBirth: new Date("1995-06-15"),
      nationality: "Indian",
      passportNumber: "Z1234567",
      emergencyContact: "Priya Sharma",
      emergencyPhone: "+91 98765 12345",
      travelPreferences: {
        travelStyle: "ADVENTURE",
        budgetRange: "MID_RANGE",
        dietary: ["VEGETARIAN"],
        interests: ["Trekking", "Photography", "Local Food", "Temples"],
      },
    },
  });
  console.log("   ✅ Rahul Sharma profile ready");

  // ──────────────────────────────────────────────────────────────────────────
  // 6. PACKAGES (8 published + 1 draft)
  // ──────────────────────────────────────────────────────────────────────────
  console.log("📦 Creating packages...");

  const packageDefinitions = [
    {
      slug: "golden-triangle-tour",
      title: "Golden Triangle Tour",
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
      difficulty: "EASY" as const,
      status: "PUBLISHED" as const,
      featured: true,
      basePrice: 24999,
      currency: "INR",
      destinations: [
        { name: "Delhi", country: "India", lat: 28.6139, lng: 77.209 },
        { name: "Agra", country: "India", lat: 27.1767, lng: 78.0081 },
        { name: "Jaipur", country: "India", lat: 26.9124, lng: 75.7873 },
      ],
      startPoint: "New Delhi",
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
      ],
      images: ["/images/packages/golden-triangle.jpg"],
      departureDates: [daysFromNow(15), daysFromNow(30), daysFromNow(60)],
      availableFrom: new Date(),
      availableTo: daysFromNow(180),
    },
    {
      slug: "kerala-backwaters-bliss",
      title: "Kerala Backwaters Bliss",
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
      difficulty: "EASY" as const,
      status: "PUBLISHED" as const,
      featured: true,
      basePrice: 18999,
      currency: "INR",
      destinations: [
        { name: "Kochi", country: "India", lat: 9.9312, lng: 76.2673 },
        { name: "Munnar", country: "India", lat: 10.0889, lng: 77.0595 },
        { name: "Alleppey", country: "India", lat: 9.4981, lng: 76.3388 },
      ],
      startPoint: "Kochi",
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
      images: ["/images/packages/kerala-backwaters.jpg"],
      departureDates: [daysFromNow(20), daysFromNow(45)],
      availableFrom: new Date(),
      availableTo: daysFromNow(150),
    },
    {
      slug: "himalayan-adventure-trek",
      title: "Himalayan Adventure",
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
      difficulty: "CHALLENGING" as const,
      status: "PUBLISHED" as const,
      featured: true,
      basePrice: 35999,
      currency: "INR",
      destinations: [
        { name: "Manali", country: "India", lat: 32.2396, lng: 77.1887 },
        { name: "Leh", country: "India", lat: 34.1526, lng: 77.5771 },
        { name: "Nubra Valley", country: "India", lat: 34.6865, lng: 77.5713 },
      ],
      startPoint: "Manali",
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
      ],
      images: ["/images/packages/himalayan-adventure.jpg"],
      departureDates: [daysFromNow(25), daysFromNow(55)],
      availableFrom: new Date(),
      availableTo: daysFromNow(120),
    },
    {
      slug: "goa-beach-paradise",
      title: "Goa Beach Paradise",
      description:
        "Sun, sand, and seafood — the ultimate Goa beach vacation experience with water sports and nightlife.",
      highlights: [
        "Enjoy water sports on Baga Beach",
        "Explore historic Portuguese churches",
        "Watch sunset from Chapora Fort",
        "Cruise along the Mandovi river",
      ],
      duration: 4,
      maxGroupSize: 20,
      difficulty: "EASY" as const,
      status: "PUBLISHED" as const,
      featured: true,
      basePrice: 12999,
      currency: "INR",
      destinations: [
        { name: "North Goa", country: "India", lat: 15.5494, lng: 73.7537 },
        { name: "South Goa", country: "India", lat: 15.2706, lng: 73.9591 },
      ],
      startPoint: "Goa Airport (Dabolim)",
      inclusions: [
        "Beach resort stay",
        "Airport transfers",
        "Water sports package",
        "South Goa sightseeing",
      ],
      exclusions: ["Lunch & dinner", "Flight tickets", "Personal expenses"],
      images: ["/images/packages/goa-beach.jpg"],
      departureDates: [daysFromNow(10), daysFromNow(35), daysFromNow(50)],
      availableFrom: new Date(),
      availableTo: daysFromNow(200),
    },
    {
      slug: "rajasthan-royal-heritage",
      title: "Rajasthan Royal Heritage",
      description:
        "Step back in time to explore majestic forts, lake palaces, and golden desert landscapes of Rajasthan.",
      highlights: [
        "Boat ride on Lake Pichola",
        "Desert camel safari & camp in Jaisalmer",
        "Visit Mehrangarh Fort in Jodhpur",
        "Traditional folk dinner",
      ],
      duration: 8,
      maxGroupSize: 15,
      difficulty: "MODERATE" as const,
      status: "PUBLISHED" as const,
      featured: true,
      basePrice: 29999,
      currency: "INR",
      destinations: [
        { name: "Udaipur", country: "India", lat: 24.5854, lng: 73.7125 },
        { name: "Jodhpur", country: "India", lat: 26.2389, lng: 73.0243 },
        { name: "Jaisalmer", country: "India", lat: 26.9157, lng: 70.9083 },
      ],
      startPoint: "Udaipur",
      inclusions: [
        "Heritage hotel stays & desert camp",
        "Daily breakfast",
        "AC SUV transport",
        "Desert cultural show",
      ],
      exclusions: ["Monument entry tickets", "Guide fee & camera charges"],
      images: ["/images/packages/rajasthan-heritage.jpg"],
      departureDates: [daysFromNow(18), daysFromNow(40)],
      availableFrom: new Date(),
      availableTo: daysFromNow(160),
    },
    {
      slug: "northeast-explorer",
      title: "Northeast Explorer",
      description:
        "Discover the untouched beauty of India's northeast — lush valleys, living root bridges, and tribal culture.",
      highlights: [
        "Visit clean village Mawlynnong",
        "Double Decker Living Root Bridges trek",
        "Kaziranga Elephant Safari",
        "Shillong highlands tour",
      ],
      duration: 6,
      maxGroupSize: 12,
      difficulty: "MODERATE" as const,
      status: "PUBLISHED" as const,
      featured: true,
      basePrice: 22999,
      currency: "INR",
      destinations: [
        { name: "Shillong", country: "India", lat: 25.5788, lng: 91.8933 },
        {
          name: "Cherrapunji",
          country: "India",
          lat: 25.2702,
          lng: 91.7323,
        },
        { name: "Kaziranga", country: "India", lat: 26.5775, lng: 93.1711 },
      ],
      startPoint: "Guwahati",
      inclusions: [
        "Hotel stays",
        "Daily breakfast",
        "AC vehicle transport",
        "Kaziranga Elephant Safari",
      ],
      exclusions: [
        "Airfare/train fare",
        "National park entry and camera fee",
      ],
      images: ["/images/packages/northeast-explorer.jpg"],
      departureDates: [daysFromNow(22), daysFromNow(48)],
      availableFrom: new Date(),
      availableTo: daysFromNow(140),
    },
    {
      slug: "varanasi-spiritual-ganges",
      title: "Varanasi Spiritual Ganges",
      description:
        "Experience the spiritual soul of India with evening Ganga Aarti, ancient temple walks, and sunrise boat rides.",
      highlights: [
        "Ganga Aarti at Dashashwamedh Ghat",
        "Sunrise boat ride on Ganges",
        "Sarnath Buddhist stupa walk",
        "Silk weaving artisan tour",
      ],
      duration: 5,
      maxGroupSize: 15,
      difficulty: "EASY" as const,
      status: "PUBLISHED" as const,
      featured: true,
      basePrice: 16999,
      currency: "INR",
      destinations: [
        { name: "Varanasi", country: "India", lat: 25.3176, lng: 82.9739 },
        { name: "Sarnath", country: "India", lat: 25.3811, lng: 83.0214 },
        { name: "Prayagraj", country: "India", lat: 25.4358, lng: 81.8463 },
      ],
      startPoint: "Varanasi",
      inclusions: [
        "Heritage hotel stay",
        "Daily breakfast",
        "Private AC sedan transfers",
        "Private boat rides & local guide",
      ],
      exclusions: ["Airfare/train fare", "Monument entry fees"],
      images: ["/images/packages/varanasi-ganges.jpg"],
      departureDates: [daysFromNow(12), daysFromNow(28)],
      availableFrom: new Date(),
      availableTo: daysFromNow(130),
    },
    {
      slug: "kashmir-valley-gulmarg",
      title: "Kashmir Valley & Gulmarg",
      description:
        "Discover Paradise on Earth — stay in luxury houseboats on Dal Lake, ride gondolas over Gulmarg snow slopes, and explore Betaab Valley.",
      highlights: [
        "Shikara ride & houseboat stay on Dal Lake",
        "Gulmarg Gondola ride to Apharwat peak",
        "Pahalgam Valley pine forest walk",
        "Mughal Gardens (Shalimar & Nishat) tour",
      ],
      duration: 6,
      maxGroupSize: 12,
      difficulty: "MODERATE" as const,
      status: "PUBLISHED" as const,
      featured: true,
      basePrice: 27999,
      currency: "INR",
      destinations: [
        { name: "Srinagar", country: "India", lat: 34.0837, lng: 74.7973 },
        { name: "Gulmarg", country: "India", lat: 34.0484, lng: 74.3805 },
        { name: "Pahalgam", country: "India", lat: 34.0161, lng: 75.315 },
      ],
      startPoint: "Srinagar",
      inclusions: [
        "Luxury houseboat & resort stay",
        "Breakfast & Dinner included",
        "Private AC vehicle for all transfers",
        "Shikara ride on Dal Lake",
      ],
      exclusions: [
        "Airfare to/from Srinagar",
        "Gondola ticket charges",
      ],
      images: ["/images/packages/kashmir-valley.jpg"],
      departureDates: [daysFromNow(14), daysFromNow(32)],
      availableFrom: new Date(),
      availableTo: daysFromNow(170),
    },
    // DRAFT package — shows lifecycle in agency dashboard
    {
      slug: "andaman-island-getaway",
      title: "Andaman Island Getaway",
      description:
        "Crystal-clear waters, pristine coral reefs, and secluded beaches — the Andaman Islands offer an untouched tropical paradise. Snorkel at Havelock, kayak through mangroves, and witness bioluminescent plankton at night.",
      highlights: [
        "Snorkeling at Elephant Beach",
        "Glass-bottom boat ride at North Bay",
        "Scuba diving at Havelock Island",
        "Bioluminescent plankton night tour",
      ],
      duration: 6,
      maxGroupSize: 10,
      difficulty: "MODERATE" as const,
      status: "DRAFT" as const,
      featured: false,
      basePrice: 32999,
      currency: "INR",
      destinations: [
        {
          name: "Port Blair",
          country: "India",
          lat: 11.6234,
          lng: 92.7265,
        },
        {
          name: "Havelock Island",
          country: "India",
          lat: 12.0263,
          lng: 92.9823,
        },
        {
          name: "Neil Island",
          country: "India",
          lat: 11.8313,
          lng: 93.0447,
        },
      ],
      startPoint: "Port Blair",
      inclusions: [
        "Beachfront resort stays",
        "Daily breakfast & dinner",
        "Ferry transfers between islands",
        "Snorkeling gear included",
      ],
      exclusions: [
        "Flights to/from Port Blair",
        "Scuba diving charges",
        "Personal expenses",
      ],
      images: ["https://images.unsplash.com/photo-1544550581-5f7ceaf7f796?auto=format&fit=crop&w=1920&q=80"],
      departureDates: [],
      availableFrom: null,
      availableTo: null,
    },
  ];

  const packages: Record<string, Package> = {};

  for (const def of packageDefinitions) {
    const pkg = await prisma.package.upsert({
      where: { slug: def.slug },
      update: {
        images: def.images,
        featured: def.featured,
        basePrice: def.basePrice,
        description: def.description,
        highlights: def.highlights,
        inclusions: def.inclusions,
        exclusions: def.exclusions,
        status: def.status,
        departureDates: def.departureDates,
        availableFrom: def.availableFrom,
        availableTo: def.availableTo,
        startPoint: def.startPoint,
      },
      create: {
        agencyId: agency.id,
        title: def.title,
        slug: def.slug,
        description: def.description,
        highlights: def.highlights,
        duration: def.duration,
        maxGroupSize: def.maxGroupSize,
        difficulty: def.difficulty,
        status: def.status,
        featured: def.featured,
        basePrice: def.basePrice,
        currency: def.currency,
        destinations: def.destinations,
        startPoint: def.startPoint,
        inclusions: def.inclusions,
        exclusions: def.exclusions,
        images: def.images,
        departureDates: def.departureDates,
        availableFrom: def.availableFrom,
        availableTo: def.availableTo,
      },
    });
    packages[def.slug] = pkg;
  }
  console.log(`   ✅ ${packageDefinitions.length} packages created (8 published + 1 draft)`);

  // ──────────────────────────────────────────────────────────────────────────
  // 7. ITINERARIES (for Golden Triangle & Kerala packages)
  // ──────────────────────────────────────────────────────────────────────────
  console.log("🗓️  Creating itineraries...");

  const goldenTriangle = packages["golden-triangle-tour"];
  const kerala = packages["kerala-backwaters-bliss"];

  // Check if itineraries already exist
  const existingGTItineraries = await prisma.itinerary.count({
    where: { packageId: goldenTriangle.id },
  });

  if (existingGTItineraries === 0) {
    // Golden Triangle — Day 1
    const gt1 = await prisma.itinerary.create({
      data: {
        packageId: goldenTriangle.id,
        dayNumber: 1,
        title: "Arrival in Delhi & Old Delhi Tour",
        description:
          "Arrive at Delhi airport, check in to hotel, and explore the vibrant streets of Old Delhi.",
      },
    });
    await prisma.activity.createMany({
      data: [
        {
          itineraryId: gt1.id,
          title: "Airport Pickup & Hotel Check-in",
          description: "Private AC car transfer from IGI Airport to hotel",
          time: "10:00 AM",
          duration: "1.5 hours",
          location: "Indira Gandhi International Airport",
          lat: 28.5562,
          lng: 77.1,
          type: "TRANSPORTATION",
        },
        {
          itineraryId: gt1.id,
          title: "Red Fort Visit",
          description:
            "Explore the iconic 17th-century Mughal fort, a UNESCO World Heritage Site",
          time: "02:00 PM",
          duration: "2 hours",
          location: "Red Fort, Chandni Chowk",
          lat: 28.6562,
          lng: 77.241,
          type: "SIGHTSEEING",
        },
        {
          itineraryId: gt1.id,
          title: "Chandni Chowk Street Food Walk",
          description:
            "Guided walking tour through Asia's oldest spice market with street food tastings",
          time: "04:30 PM",
          duration: "2 hours",
          location: "Chandni Chowk Market",
          lat: 28.6506,
          lng: 77.2303,
          type: "DINING",
        },
      ],
    });
    await prisma.itineraryHotel.create({
      data: {
        itineraryId: gt1.id,
        name: "The Imperial New Delhi",
        address: "Janpath, Connaught Place, New Delhi",
        rating: 4.7,
        pricePerNight: 5500,
        checkIn: "12:00 PM",
        checkOut: "11:00 AM",
      },
    });

    // Golden Triangle — Day 2
    const gt2 = await prisma.itinerary.create({
      data: {
        packageId: goldenTriangle.id,
        dayNumber: 2,
        title: "Delhi to Agra — Taj Mahal Sunrise",
        description:
          "Early morning drive to Agra for the breathtaking sunrise at the Taj Mahal.",
      },
    });
    await prisma.activity.createMany({
      data: [
        {
          itineraryId: gt2.id,
          title: "Drive to Agra",
          description: "Scenic 4-hour drive on Yamuna Expressway",
          time: "05:00 AM",
          duration: "4 hours",
          location: "Yamuna Expressway",
          lat: 27.8,
          lng: 77.5,
          type: "TRANSPORTATION",
        },
        {
          itineraryId: gt2.id,
          title: "Taj Mahal Visit",
          description:
            "Witness the marble masterpiece at golden hour — one of the Seven Wonders of the World",
          time: "09:30 AM",
          duration: "3 hours",
          location: "Taj Mahal, Agra",
          lat: 27.1751,
          lng: 78.0421,
          type: "SIGHTSEEING",
        },
        {
          itineraryId: gt2.id,
          title: "Agra Fort Visit",
          description:
            "Explore the grand Mughal fort with views of the Taj Mahal across the river",
          time: "02:00 PM",
          duration: "2 hours",
          location: "Agra Fort",
          lat: 27.1795,
          lng: 78.0211,
          type: "SIGHTSEEING",
        },
      ],
    });
    await prisma.itineraryHotel.create({
      data: {
        itineraryId: gt2.id,
        name: "ITC Mughal, A Luxury Collection Resort",
        address: "Fatehabad Road, Agra",
        rating: 4.5,
        pricePerNight: 4800,
        checkIn: "02:00 PM",
        checkOut: "12:00 PM",
      },
    });
    await prisma.itineraryTransport.create({
      data: {
        itineraryId: gt2.id,
        type: "CAR",
        from: "New Delhi",
        to: "Agra",
        departureTime: "05:00 AM",
        arrivalTime: "09:00 AM",
        cost: 3500,
        provider: "Wanderlust Fleet",
      },
    });

    // Golden Triangle — Day 3
    const gt3 = await prisma.itinerary.create({
      data: {
        packageId: goldenTriangle.id,
        dayNumber: 3,
        title: "Agra to Jaipur — Pink City Arrival",
        description:
          "Drive to the Pink City and explore Hawa Mahal and local bazaars.",
      },
    });
    await prisma.activity.createMany({
      data: [
        {
          itineraryId: gt3.id,
          title: "Drive to Jaipur via Fatehpur Sikri",
          description: "Visit the abandoned Mughal city en route to Jaipur",
          time: "08:00 AM",
          duration: "6 hours",
          location: "Fatehpur Sikri",
          lat: 27.0945,
          lng: 77.6679,
          type: "SIGHTSEEING",
        },
        {
          itineraryId: gt3.id,
          title: "Hawa Mahal Photo Stop",
          description:
            "Visit the iconic Palace of Winds with its 953 honeycomb windows",
          time: "04:00 PM",
          duration: "1 hour",
          location: "Hawa Mahal, Jaipur",
          lat: 26.9239,
          lng: 75.8267,
          type: "SIGHTSEEING",
        },
        {
          itineraryId: gt3.id,
          title: "Rajasthani Thali Dinner",
          description:
            "Authentic multi-course Rajasthani thali with folk music and dance",
          time: "07:30 PM",
          duration: "2 hours",
          location: "Chokhi Dhani, Jaipur",
          lat: 26.7811,
          lng: 75.8456,
          type: "DINING",
        },
      ],
    });
    await prisma.itineraryHotel.create({
      data: {
        itineraryId: gt3.id,
        name: "Rambagh Palace",
        address: "Bhawani Singh Road, Jaipur",
        rating: 4.8,
        pricePerNight: 7200,
        checkIn: "03:00 PM",
        checkOut: "12:00 PM",
      },
    });
    await prisma.itineraryTransport.create({
      data: {
        itineraryId: gt3.id,
        type: "CAR",
        from: "Agra",
        to: "Jaipur",
        departureTime: "08:00 AM",
        arrivalTime: "02:00 PM",
        cost: 4000,
        provider: "Wanderlust Fleet",
      },
    });
  }

  // Kerala — Day 1
  const existingKeralaItineraries = await prisma.itinerary.count({
    where: { packageId: kerala.id },
  });

  if (existingKeralaItineraries === 0) {
    const k1 = await prisma.itinerary.create({
      data: {
        packageId: kerala.id,
        dayNumber: 1,
        title: "Kochi Arrival & Fort Kochi Walk",
        description:
          "Arrive in Kochi, explore the charming Fort Kochi area with Chinese fishing nets and colonial architecture.",
      },
    });
    await prisma.activity.createMany({
      data: [
        {
          itineraryId: k1.id,
          title: "Airport Pickup",
          description: "Transfer from Cochin International Airport to Fort Kochi",
          time: "11:00 AM",
          duration: "1 hour",
          location: "Cochin International Airport",
          lat: 10.152,
          lng: 76.4019,
          type: "TRANSPORTATION",
        },
        {
          itineraryId: k1.id,
          title: "Chinese Fishing Nets",
          description:
            "Watch the iconic cantilevered fishing nets in action at the Kochi waterfront",
          time: "03:00 PM",
          duration: "1 hour",
          location: "Fort Kochi Beach",
          lat: 9.9674,
          lng: 76.2424,
          type: "SIGHTSEEING",
        },
        {
          itineraryId: k1.id,
          title: "Kathakali Dance Performance",
          description:
            "Watch a traditional Kerala classical dance performance with elaborate costumes",
          time: "06:30 PM",
          duration: "2 hours",
          location: "Kerala Kathakali Centre",
          lat: 9.9638,
          lng: 76.2432,
          type: "CULTURAL",
        },
      ],
    });
    await prisma.itineraryHotel.create({
      data: {
        itineraryId: k1.id,
        name: "Brunton Boatyard Hotel",
        address: "Calvathy Road, Fort Kochi",
        rating: 4.6,
        pricePerNight: 4200,
        checkIn: "02:00 PM",
        checkOut: "12:00 PM",
      },
    });

    // Kerala — Day 2
    const k2 = await prisma.itinerary.create({
      data: {
        packageId: kerala.id,
        dayNumber: 2,
        title: "Kochi to Munnar — Tea Garden Paradise",
        description:
          "Wind through Western Ghats to reach the misty tea plantations of Munnar.",
      },
    });
    await prisma.activity.createMany({
      data: [
        {
          itineraryId: k2.id,
          title: "Drive to Munnar",
          description: "Scenic mountain drive through spice-scented hairpin bends",
          time: "08:00 AM",
          duration: "4 hours",
          location: "Western Ghats Highway",
          lat: 10.05,
          lng: 76.9,
          type: "TRANSPORTATION",
        },
        {
          itineraryId: k2.id,
          title: "Tata Tea Museum Visit",
          description:
            "Learn the history of Munnar's tea industry with fresh tea tasting",
          time: "02:00 PM",
          duration: "2 hours",
          location: "Tata Tea Museum, Munnar",
          lat: 10.0574,
          lng: 77.0647,
          type: "CULTURAL",
        },
      ],
    });
    await prisma.itineraryHotel.create({
      data: {
        itineraryId: k2.id,
        name: "Tea County Munnar",
        address: "Devikulam Road, Munnar",
        rating: 4.3,
        pricePerNight: 3500,
        checkIn: "01:00 PM",
        checkOut: "11:00 AM",
      },
    });

    // Kerala — Day 3 (Houseboat)
    const k3 = await prisma.itinerary.create({
      data: {
        packageId: kerala.id,
        dayNumber: 3,
        title: "Munnar to Alleppey — Houseboat Cruise",
        description:
          "Drive to Alleppey and board a luxury houseboat for an overnight cruise through Kerala's famous backwaters.",
      },
    });
    await prisma.activity.createMany({
      data: [
        {
          itineraryId: k3.id,
          title: "Drive to Alleppey",
          description: "Journey from the hills to the backwater coast",
          time: "08:00 AM",
          duration: "5 hours",
          location: "Alleppey",
          lat: 9.4981,
          lng: 76.3388,
          type: "TRANSPORTATION",
        },
        {
          itineraryId: k3.id,
          title: "Houseboat Boarding & Backwater Cruise",
          description:
            "Board a traditional kettuvallam and cruise through palm-fringed canals with freshly cooked Kerala cuisine on board",
          time: "02:00 PM",
          duration: "Overnight",
          location: "Alleppey Backwaters",
          lat: 9.49,
          lng: 76.33,
          type: "RELAXATION",
        },
      ],
    });
    await prisma.itineraryHotel.create({
      data: {
        itineraryId: k3.id,
        name: "Premium Houseboat (Kettuvallam)",
        address: "Alleppey Backwaters",
        rating: 4.7,
        pricePerNight: 6500,
        checkIn: "02:00 PM",
        checkOut: "09:00 AM",
      },
    });
  }

  console.log("   ✅ Itineraries with activities, hotels & transport created");

  // ──────────────────────────────────────────────────────────────────────────
  // 8. VENDORS
  // ──────────────────────────────────────────────────────────────────────────
  console.log("🤝 Creating vendors...");

  const vendorDefs = [
    {
      name: "Taj Palace Hotels",
      category: "HOTEL" as const,
      contactEmail: "reservations@tajpalace.example.com",
      contactPhone: "+91 11 2302 6162",
      location: "New Delhi",
      description:
        "Luxury 5-star hotel chain offering heritage properties across India's major cities.",
      rating: 4.8,
    },
    {
      name: "Royal Rajasthan Transfers",
      category: "TRANSPORT" as const,
      contactEmail: "bookings@royalraj.example.com",
      contactPhone: "+91 141 400 1234",
      location: "Jaipur, Rajasthan",
      description:
        "Premium fleet of AC SUVs, tempo travelers, and luxury coaches for North India touring.",
      rating: 4.5,
    },
    {
      name: "Mountain Trail Guides",
      category: "GUIDE" as const,
      contactEmail: "trek@mountaintrail.example.com",
      contactPhone: "+91 98160 54321",
      location: "Manali, Himachal Pradesh",
      description:
        "Certified mountain guides with 15+ years of Himalayan trekking experience.",
      rating: 4.9,
    },
    {
      name: "Backwater Cruise Kerala",
      category: "ACTIVITY" as const,
      contactEmail: "cruise@backwater.example.com",
      contactPhone: "+91 477 223 8765",
      location: "Alleppey, Kerala",
      description:
        "Luxury houseboat operators offering overnight backwater cruises with traditional Kerala cuisine.",
      rating: 4.6,
    },
    {
      name: "Spice Route Restaurant",
      category: "RESTAURANT" as const,
      contactEmail: "dine@spiceroute.example.com",
      contactPhone: "+91 484 221 6789",
      location: "Fort Kochi, Kerala",
      description:
        "Award-winning restaurant serving authentic Kerala and pan-South Indian seafood cuisine.",
      rating: 4.4,
    },
  ];

  for (const vd of vendorDefs) {
    const exists = await prisma.vendor.findFirst({
      where: { agencyId: agency.id, name: vd.name },
    });
    if (!exists) {
      await prisma.vendor.create({
        data: { agencyId: agency.id, ...vd },
      });
    }
  }
  console.log(`   ✅ ${vendorDefs.length} vendors created`);

  // ──────────────────────────────────────────────────────────────────────────
  // 9. BOOKINGS (8 bookings with varied statuses)
  // ──────────────────────────────────────────────────────────────────────────
  console.log("📅 Creating bookings...");

  const bookingDefs = [
    {
      bookingNumber: "WP-84921",
      packageSlug: "golden-triangle-tour",
      status: "CONFIRMED" as const,
      travelers: [
        { name: "Rahul Sharma", age: 31, document: "Z1234567" },
        { name: "Priya Sharma", age: 28, document: "Z7654321" },
      ],
      specialRequests: "Vegetarian meals preferred. Need early check-in at Delhi hotel.",
      totalAmount: 49998,
      paidAmount: 49998,
      travelDate: daysFromNow(15),
      returnDate: daysFromNow(22),
      createdAt: daysAgo(10),
    },
    {
      bookingNumber: "WP-73019",
      packageSlug: "goa-beach-paradise",
      status: "PENDING" as const,
      travelers: [
        { name: "Rahul Sharma", age: 31, document: "Z1234567" },
      ],
      specialRequests: "Sea-facing room if possible.",
      totalAmount: 12999,
      paidAmount: 0,
      travelDate: daysFromNow(35),
      returnDate: daysFromNow(39),
      createdAt: daysAgo(2),
    },
    {
      bookingNumber: "WP-62940",
      packageSlug: "kerala-backwaters-bliss",
      status: "COMPLETED" as const,
      travelers: [
        { name: "Rahul Sharma", age: 31, document: "Z1234567" },
        { name: "Vikram Sharma", age: 58, document: "Y9876543" },
      ],
      specialRequests: "Father has mild knee issues — prefer ground floor rooms.",
      totalAmount: 37998,
      paidAmount: 37998,
      travelDate: daysAgo(45),
      returnDate: daysAgo(40),
      createdAt: daysAgo(60),
    },
    {
      bookingNumber: "WP-58102",
      packageSlug: "rajasthan-royal-heritage",
      status: "CONFIRMED" as const,
      travelers: [
        { name: "Rahul Sharma", age: 31, document: "Z1234567" },
        { name: "Priya Sharma", age: 28, document: "Z7654321" },
        { name: "Arun Sharma", age: 55, document: "X1122334" },
      ],
      specialRequests: "Need a triple-sharing room. Interested in camel safari.",
      totalAmount: 89997,
      paidAmount: 89997,
      travelDate: daysFromNow(40),
      returnDate: daysFromNow(48),
      createdAt: daysAgo(5),
    },
    {
      bookingNumber: "WP-91438",
      packageSlug: "himalayan-adventure-trek",
      status: "PROCESSING" as const,
      travelers: [
        { name: "Rahul Sharma", age: 31, document: "Z1234567" },
      ],
      specialRequests: "Need acclimatization day at Leh. Carry extra oxygen supply.",
      totalAmount: 35999,
      paidAmount: 18000,
      travelDate: daysFromNow(55),
      returnDate: daysFromNow(65),
      createdAt: daysAgo(3),
    },
    {
      bookingNumber: "WP-36271",
      packageSlug: "varanasi-spiritual-ganges",
      status: "COMPLETED" as const,
      travelers: [
        { name: "Rahul Sharma", age: 31, document: "Z1234567" },
        { name: "Meera Sharma", age: 52, document: "Y5566778" },
      ],
      specialRequests: "Early morning Ganga Aarti darshan. Pure vegetarian food only.",
      totalAmount: 33998,
      paidAmount: 33998,
      travelDate: daysAgo(90),
      returnDate: daysAgo(85),
      createdAt: daysAgo(100),
    },
    {
      bookingNumber: "WP-47590",
      packageSlug: "kashmir-valley-gulmarg",
      status: "CANCELLED" as const,
      travelers: [
        { name: "Rahul Sharma", age: 31, document: "Z1234567" },
      ],
      specialRequests: "Houseboat with upper deck.",
      totalAmount: 27999,
      paidAmount: 0,
      travelDate: daysFromNow(14),
      returnDate: daysFromNow(20),
      createdAt: daysAgo(20),
    },
    {
      bookingNumber: "WP-82014",
      packageSlug: "northeast-explorer",
      status: "CONFIRMED" as const,
      travelers: [
        { name: "Rahul Sharma", age: 31, document: "Z1234567" },
        { name: "Priya Sharma", age: 28, document: "Z7654321" },
      ],
      specialRequests: "Interested in Kaziranga Jeep Safari (not elephant). Vegetarian meals.",
      totalAmount: 45998,
      paidAmount: 45998,
      travelDate: daysFromNow(48),
      returnDate: daysFromNow(54),
      createdAt: daysAgo(7),
    },
  ];

  // Clean up legacy test booking numbers if present
  const oldBookings = await prisma.booking.findMany({
    where: {
      bookingNumber: {
        startsWith: "WP-2026-",
      },
    },
    select: { id: true },
  });
  if (oldBookings.length > 0) {
    const oldIds = oldBookings.map((b) => b.id);
    await prisma.payment.deleteMany({
      where: { bookingId: { in: oldIds } },
    });
    await prisma.booking.deleteMany({
      where: { id: { in: oldIds } },
    });
  }

  const createdBookings: Record<string, Booking> = {};

  for (const bd of bookingDefs) {
    const pkg = packages[bd.packageSlug];
    if (!pkg) continue;

    const exists = await prisma.booking.findUnique({
      where: { bookingNumber: bd.bookingNumber },
    });
    if (!exists) {
      const booking = await prisma.booking.create({
        data: {
          bookingNumber: bd.bookingNumber,
          userId: travelerUser.id,
          agencyId: agency.id,
          packageId: pkg.id,
          status: bd.status,
          travelers: bd.travelers,
          specialRequests: bd.specialRequests,
          totalAmount: bd.totalAmount,
          paidAmount: bd.paidAmount,
          currency: "INR",
          travelDate: bd.travelDate,
          returnDate: bd.returnDate,
          createdAt: bd.createdAt,
          updatedAt: bd.createdAt,
        },
      });
      createdBookings[bd.bookingNumber] = booking;
    } else {
      createdBookings[bd.bookingNumber] = exists;
    }
  }
  console.log(`   ✅ ${bookingDefs.length} bookings created`);

  // ──────────────────────────────────────────────────────────────────────────
  // 10. PAYMENTS
  // ──────────────────────────────────────────────────────────────────────────
  console.log("💳 Creating payments...");

  const paymentDefs = [
    {
      bookingNumber: "WP-84921",
      amount: 49998,
      status: "COMPLETED" as const,
      method: "UPI" as const,
      gateway: "razorpay",
      gatewayId: "order_demo_gt_001",
      providerPaymentId: "pay_demo_gt_001",
    },
    {
      bookingNumber: "WP-62940",
      amount: 37998,
      status: "COMPLETED" as const,
      method: "CARD" as const,
      gateway: "razorpay",
      gatewayId: "order_demo_kb_003",
      providerPaymentId: "pay_demo_kb_003",
    },
    {
      bookingNumber: "WP-58102",
      amount: 89997,
      status: "COMPLETED" as const,
      method: "NET_BANKING" as const,
      gateway: "razorpay",
      gatewayId: "order_demo_rr_004",
      providerPaymentId: "pay_demo_rr_004",
    },
    {
      bookingNumber: "WP-91438",
      amount: 18000,
      status: "COMPLETED" as const,
      method: "UPI" as const,
      gateway: "razorpay",
      gatewayId: "order_demo_ha_005a",
      providerPaymentId: "pay_demo_ha_005a",
    },
    {
      bookingNumber: "WP-36271",
      amount: 33998,
      status: "COMPLETED" as const,
      method: "WALLET" as const,
      gateway: "razorpay",
      gatewayId: "order_demo_vs_006",
      providerPaymentId: "pay_demo_vs_006",
    },
    {
      bookingNumber: "WP-82014",
      amount: 45998,
      status: "COMPLETED" as const,
      method: "CARD" as const,
      gateway: "razorpay",
      gatewayId: "order_demo_ne_008",
      providerPaymentId: "pay_demo_ne_008",
    },
  ];

  for (const pd of paymentDefs) {
    const booking = createdBookings[pd.bookingNumber];
    if (!booking) continue;

    const existingPayment = await prisma.payment.findFirst({
      where: {
        OR: [
          { bookingId: booking.id },
          { providerPaymentId: pd.providerPaymentId },
        ],
      },
    });

    if (existingPayment) {
      await prisma.payment.update({
        where: { id: existingPayment.id },
        data: {
          bookingId: booking.id,
          amount: pd.amount,
          status: pd.status,
          method: pd.method,
          gateway: pd.gateway,
          gatewayId: pd.gatewayId,
          providerPaymentId: pd.providerPaymentId,
        },
      });
    } else {
      await prisma.payment.create({
        data: {
          bookingId: booking.id,
          amount: pd.amount,
          currency: "INR",
          status: pd.status,
          method: pd.method,
          gateway: pd.gateway,
          gatewayId: pd.gatewayId,
          providerPaymentId: pd.providerPaymentId,
        },
      });
    }
  }
  console.log(`   ✅ ${paymentDefs.length} payments created`);

  // ──────────────────────────────────────────────────────────────────────────
  // 11. REVIEWS (diverse, varied ratings)
  // ──────────────────────────────────────────────────────────────────────────
  console.log("⭐ Creating reviews...");

  const reviewDefs = [
    {
      slug: "golden-triangle-tour",
      rating: 5,
      title: "Best trip of my life!",
      comment:
        "The Taj Mahal at sunrise was breathtaking. Our guide knew every hidden corner. Hotels were top-notch and the Rajasthani dinner in Jaipur was unforgettable. Highly recommended for first-time India visitors!",
    },
    {
      slug: "kerala-backwaters-bliss",
      rating: 5,
      title: "Kerala is truly God's Own Country",
      comment:
        "The houseboat cruise was magical — waking up surrounded by palm trees and backwaters. Munnar tea gardens were stunning. Food on the houseboat was some of the best I've ever had.",
    },
    {
      slug: "himalayan-adventure-trek",
      rating: 4,
      title: "Challenging but worth every step",
      comment:
        "Pangong Lake was unreal — the shades of blue are indescribable. The trek was tough but our guides were experienced and made us feel safe. Only -1 star because the roads to Khardung La were very rough.",
    },
    {
      slug: "goa-beach-paradise",
      rating: 4,
      title: "Perfect beach getaway",
      comment:
        "Loved the water sports at Baga Beach! Chapora Fort sunset was gorgeous. The resort was beachfront and beautiful. Would have liked one more day to explore South Goa properly.",
    },
    {
      slug: "rajasthan-royal-heritage",
      rating: 5,
      title: "Royalty at every turn",
      comment:
        "From the Lake Pichola boat ride to camping under stars in the Thar Desert — this trip was pure magic. Mehrangarh Fort is jaw-dropping. The folk dinner in Jaisalmer was a cultural feast.",
    },
    {
      slug: "northeast-explorer",
      rating: 5,
      title: "India's best-kept secret",
      comment:
        "The Living Root Bridges were surreal — nature's own engineering! Kaziranga safari was thrilling. Shillong reminded me of Scotland. This region deserves way more tourism.",
    },
    {
      slug: "varanasi-spiritual-ganges",
      rating: 4,
      title: "A spiritual awakening",
      comment:
        "The Ganga Aarti ceremony was deeply moving. Sunrise boat ride gave us a completely different perspective of the ghats. Sarnath was peaceful and educational. The city is intense but beautiful.",
    },
    {
      slug: "kashmir-valley-gulmarg",
      rating: 5,
      title: "Paradise on Earth — literally",
      comment:
        "Dal Lake houseboat stay was dreamy. The Gulmarg Gondola ride offered the most spectacular Himalayan views I've ever seen. Pahalgam valley walks were serene. Can't wait to go back in winter!",
    },
  ];

  for (const rd of reviewDefs) {
    const pkg = packages[rd.slug];
    if (!pkg) continue;

    const exists = await prisma.review.findUnique({
      where: { userId_packageId: { userId: travelerUser.id, packageId: pkg.id } },
    });
    if (!exists) {
      await prisma.review.create({
        data: {
          userId: travelerUser.id,
          packageId: pkg.id,
          rating: rd.rating,
          title: rd.title,
          comment: rd.comment,
        },
      });
    }
  }
  console.log(`   ✅ ${reviewDefs.length} reviews created`);

  // ──────────────────────────────────────────────────────────────────────────
  // 12. NOTIFICATIONS
  // ──────────────────────────────────────────────────────────────────────────
  console.log("🔔 Creating notifications...");

  const notifDefs: Prisma.NotificationUncheckedCreateInput[] = [
    {
      userId: travelerUser.id,
      title: "Booking Confirmed!",
      message:
        "Your Golden Triangle Tour booking (WP-2026-001) has been confirmed. Travel date: " +
        daysFromNow(15).toLocaleDateString() + ". Have a wonderful trip!",
      type: "BOOKING",
      read: true,
      data: { bookingNumber: "WP-2026-001" },
      createdAt: daysAgo(9),
    },
    {
      userId: travelerUser.id,
      title: "Payment Received",
      message:
        "We've received your payment of ₹49,998 for the Golden Triangle Tour. Transaction ID: pay_demo_gt_001.",
      type: "PAYMENT",
      read: true,
      data: { amount: 49998, transactionId: "pay_demo_gt_001" },
      createdAt: daysAgo(10),
    },
    {
      userId: travelerUser.id,
      title: "Rajasthan Heritage Confirmed!",
      message:
        "Your Rajasthan Royal Heritage booking (WP-2026-004) for 3 travelers has been confirmed. Get ready for a royal experience!",
      type: "BOOKING",
      read: true,
      data: { bookingNumber: "WP-2026-004" },
      createdAt: daysAgo(4),
    },
    {
      userId: travelerUser.id,
      title: "Northeast Explorer Confirmed!",
      message:
        "Your Northeast Explorer booking (WP-2026-008) has been confirmed. Adventure awaits in the hidden gems of India's northeast!",
      type: "BOOKING",
      read: false,
      data: { bookingNumber: "WP-2026-008" },
      createdAt: daysAgo(6),
    },
    {
      userId: travelerUser.id,
      title: "New Package Alert: Andaman Islands!",
      message:
        "Wanderlust Travels is launching an exciting new Andaman Island Getaway! Crystal-clear waters and coral reefs await. Stay tuned for availability.",
      type: "PROMOTION",
      read: false,
      data: { packageSlug: "andaman-island-getaway" },
      createdAt: daysAgo(1),
    },
    {
      userId: travelerUser.id,
      title: "Welcome to Waypoint!",
      message:
        "Thanks for joining Waypoint! Explore curated travel packages, build custom AI trips, and manage all your bookings in one place.",
      type: "SYSTEM",
      read: true,
      data: { onboarding: true },
      createdAt: daysAgo(120),
    },
    {
      userId: travelerUser.id,
      title: "Trip Review Reminder",
      message:
        "You recently completed the Kerala Backwaters Bliss trip. Share your experience — your review helps other travelers discover great journeys!",
      type: "TRIP",
      read: false,
      data: { packageSlug: "kerala-backwaters-bliss" },
      createdAt: daysAgo(38),
    },
    {
      userId: travelerUser.id,
      title: "Partial Payment Received",
      message:
        "We've received ₹18,000 towards your Himalayan Adventure booking (WP-2026-005). Remaining balance: ₹17,999.",
      type: "PAYMENT",
      read: false,
      data: { bookingNumber: "WP-2026-005", amount: 18000 },
      createdAt: daysAgo(2),
    },
  ];

  for (const nd of notifDefs) {
    await prisma.notification.create({ data: nd });
  }
  console.log(`   ✅ ${notifDefs.length} notifications created`);

  // ──────────────────────────────────────────────────────────────────────────
  // 13. FAVORITES
  // ──────────────────────────────────────────────────────────────────────────
  console.log("❤️  Creating favorites...");

  const favSlugs = [
    "kashmir-valley-gulmarg",
    "rajasthan-royal-heritage",
    "andaman-island-getaway",
  ];
  for (const slug of favSlugs) {
    const pkg = packages[slug];
    if (!pkg) continue;
    const exists = await prisma.favorite.findUnique({
      where: { userId_packageId: { userId: travelerUser.id, packageId: pkg.id } },
    });
    if (!exists) {
      await prisma.favorite.create({
        data: { userId: travelerUser.id, packageId: pkg.id },
      });
    }
  }
  console.log(`   ✅ ${favSlugs.length} favorites created`);

  // ──────────────────────────────────────────────────────────────────────────
  // 14. TASKS
  // ──────────────────────────────────────────────────────────────────────────
  console.log("📋 Creating tasks...");

  const staffRecord = await prisma.agencyStaff.findUnique({
    where: { userId: staffUser.id },
  });

  const taskDefs = [
    {
      title: "Confirm Golden Triangle hotel reservations",
      description:
        "Call The Imperial New Delhi and ITC Mughal Agra to confirm room blocks for WP-84921 departure on " +
        daysFromNow(15).toLocaleDateString() + ".",
      dueDate: daysFromNow(5),
      status: "COMPLETED" as const,
      priority: "HIGH" as const,
      category: "BOOKING" as const,
    },
    {
      title: "Call traveler for Himalayan trek medical clearance",
      description:
        "Booking WP-91438 includes Khardung La (18,380 ft). Contact Rahul Sharma to confirm altitude fitness certificate.",
      dueDate: daysFromNow(14),
      status: "IN_PROGRESS" as const,
      priority: "HIGH" as const,
      category: "CUSTOMER" as const,
    },
    {
      title: "Update Kerala package itinerary photos",
      description:
        "Replace placeholder images with professional photos from last month's Kerala Backwaters Bliss tour. Include houseboat, tea gardens, and Kathakali shots.",
      dueDate: daysFromNow(7),
      status: "TODO" as const,
      priority: "MEDIUM" as const,
      category: "PACKAGE" as const,
    },
    {
      title: "Review Andaman Island vendor applications",
      description:
        "Three new vendors (dive school, ferry operator, beach resort) have applied for the upcoming Andaman package. Review credentials and pricing.",
      dueDate: daysFromNow(10),
      status: "TODO" as const,
      priority: "MEDIUM" as const,
      category: "SYSTEM" as const,
    },
  ];

  for (const td of taskDefs) {
    const exists = await prisma.task.findFirst({
      where: { agencyId: agency.id, title: td.title },
    });
    if (!exists) {
      await prisma.task.create({
        data: {
          agencyId: agency.id,
          staffId: staffRecord?.id ?? null,
          ...td,
        },
      });
    }
  }
  console.log(`   ✅ ${taskDefs.length} tasks created`);

  // ──────────────────────────────────────────────────────────────────────────
  // 15. PLATFORM SETTINGS
  // ──────────────────────────────────────────────────────────────────────────
  console.log("⚙️  Initializing platform settings...");

  await prisma.platformSettings.upsert({
    where: { id: "global" },
    update: {},
    create: {
      id: "global",
      commissionRate: 0.1,
      minPayoutAmount: 500,
      payoutHoldDays: 7,
      platformName: "Waypoint",
      supportEmail: "support@waypoint.dev",
    },
  });
  console.log("   ✅ Platform settings initialized");

  // ──────────────────────────────────────────────────────────────────────────
  // 16. AUDIT LOGS
  // ──────────────────────────────────────────────────────────────────────────
  console.log("📝 Creating audit log entries...");

  const auditDefs = [
    {
      actorId: adminUser.id,
      action: "agency.verify",
      resourceType: "Agency",
      resourceId: agency.id,
      before: { verified: false },
      after: { verified: true },
      metadata: { reason: "Documents verified, GST and trade license valid" },
      createdAt: daysAgo(90),
    },
    {
      actorId: agencyUser.id,
      action: "package.publish",
      resourceType: "Package",
      resourceId: packages["golden-triangle-tour"].id,
      before: { status: "DRAFT" },
      after: { status: "PUBLISHED" },
      metadata: { packageTitle: "Golden Triangle Tour" },
      createdAt: daysAgo(60),
    },
    {
      actorId: adminUser.id,
      action: "settings.update",
      resourceType: "PlatformSettings",
      resourceId: "global",
      before: { commissionRate: 0.15 },
      after: { commissionRate: 0.1 },
      metadata: { reason: "Reduced platform commission from 15% to 10%" },
      createdAt: daysAgo(30),
    },
  ];

  for (const al of auditDefs) {
    await prisma.auditLog.create({ data: al });
  }
  console.log(`   ✅ ${auditDefs.length} audit log entries created`);

  // ──────────────────────────────────────────────────────────────────────────
  // DONE
  // ──────────────────────────────────────────────────────────────────────────
  console.log("\n🎉 Seed complete! Demo database is ready.\n");
  console.log("┌─────────────────────────────────────────────────────┐");
  console.log("│  Demo Accounts (password: password123)             │");
  console.log("├─────────────┬───────────────────────────────────────┤");
  console.log("│  Admin      │  admin@waypoint.dev                  │");
  console.log("│  Agency     │  agency@waypoint.dev                 │");
  console.log("│  Staff      │  staff@waypoint.dev                  │");
  console.log("│  Traveler   │  traveler@waypoint.dev               │");
  console.log("└─────────────┴───────────────────────────────────────┘");
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
