import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  const agencyUser = await prisma.user.upsert({
    where: { email: "agency@waypoint.dev" },
    update: {},
    create: {
      name: "Wanderlust Travels",
      email: "agency@waypoint.dev",
      role: "AGENCY",
      emailVerified: true,
    },
  });

  const agency = await prisma.agency.upsert({
    where: { slug: "wanderlust-travels" },
    update: {},
    create: {
      ownerId: agencyUser.id,
      name: "Wanderlust Travels",
      slug: "wanderlust-travels",
      description: "Premier travel agency specializing in luxury North India, South India, and Himalayan tours.",
      logo: "https://images.unsplash.com/photo-1599305445671-ac291c95aaa9?w=200",
      phone: "+91 98765 43210",
      website: "https://wanderlust.example.com",
      address: "Connaught Place, New Delhi, India",
      verified: true,
    },
  });

  const travelerUser = await prisma.user.upsert({
    where: { email: "traveler@waypoint.dev" },
    update: {},
    create: {
      name: "Rahul Sharma",
      email: "traveler@waypoint.dev",
      role: "TRAVELER",
      emailVerified: true,
    },
  });

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
        interests: ["Trekking", "Photography", "Local Food"],
      },
    },
  });

  // Package definitions
  const packageDefinitions = [
    {
      slug: "golden-triangle-tour",
      title: "Golden Triangle Tour",
      description: "Explore Delhi, Agra, and Jaipur — India's most iconic destinations. Visit the magnificent Taj Mahal, explore the Red Fort, and shop in vibrant bazaars.",
      highlights: ["Visit the Taj Mahal at sunrise", "Explore Jaipur's Amber Fort", "Shop in historic Chandni Chowk", "Traditional Rajasthani dinner"],
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
      inclusions: ["4-star hotel stays", "Daily breakfast", "Private AC car and driver", "Local tour guides", "Airport transfers"],
      exclusions: ["Monument entry fees", "Lunch & dinner", "Flights/trains to Delhi", "Personal expenses"],
      images: ["/images/packages/golden-triangle.jpg"],
    },
    {
      slug: "kerala-backwaters-bliss",
      title: "Kerala Backwaters Bliss",
      description: "Cruise through serene backwaters, explore tea gardens, and relax on pristine beaches in God's Own Country.",
      highlights: ["Overnight luxury houseboat stay", "Explore Munnar tea estates", "Relax on Kovalam beaches", "Spice plantation walk"],
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
      inclusions: ["3-star resort & houseboat", "Houseboat meals included", "AC sedan transport", "Spice plantation tour"],
      exclusions: ["Airfare/train fare", "Entry charges", "Activities like boat ride", "Tips"],
      images: ["/images/packages/kerala-backwaters.jpg"],
    },
    {
      slug: "himalayan-adventure-trek",
      title: "Himalayan Adventure",
      description: "Trek through breathtaking mountain trails and experience the raw beauty of the Himalayas.",
      highlights: ["Drive through Khardung La pass", "Camp under stars in Nubra Valley", "Visit Pangong Lake", "Local monastery visits"],
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
      inclusions: ["Camp & hotel accommodations", "Breakfast & Dinner", "Inner Line Permits", "Oxygen cylinders in vehicle"],
      exclusions: ["Flights to/from Leh", "Lunch", "Adventure activities like rafting"],
      images: ["/images/packages/himalayan-adventure.jpg"],
    },
    {
      slug: "goa-beach-paradise",
      title: "Goa Beach Paradise",
      description: "Sun, sand, and seafood — the ultimate Goa beach vacation experience with water sports and nightlife.",
      highlights: ["Enjoy water sports on Baga Beach", "Explore historic Portuguese churches", "Watch sunset from Chapora Fort", "Cruise along the Mandovi river"],
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
      inclusions: ["Beach resort stay", "Airport transfers", "Water sports package", "South Goa sightseeing"],
      exclusions: ["Lunch & dinner", "Flight tickets", "Personal expenses"],
      images: ["/images/packages/goa-beach.jpg"],
    },
    {
      slug: "rajasthan-royal-heritage",
      title: "Rajasthan Royal Heritage",
      description: "Step back in time to explore majestic forts, lake palaces, and golden desert landscapes of Rajasthan.",
      highlights: ["Boat ride on Lake Pichola", "Desert camel safari & camp in Jaisalmer", "Visit Mehrangarh Fort in Jodhpur", "Traditional folk dinner"],
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
      inclusions: ["Heritage hotel stays & desert camp", "Daily breakfast", "AC SUV transport", "Desert cultural show"],
      exclusions: ["Monument entry tickets", "Guide fee & camera charges"],
      images: ["/images/packages/rajasthan-heritage.jpg"],
    },
    {
      slug: "northeast-explorer",
      title: "Northeast Explorer",
      description: "Discover the untouched beauty of India's northeast — lush valleys, living root bridges, and tribal culture.",
      highlights: ["Visit clean village Mawlynnong", "Double Decker Living Root Bridges trek", "Kaziranga Elephant Safari", "Shillong highlands tour"],
      duration: 6,
      maxGroupSize: 12,
      difficulty: "MODERATE" as const,
      status: "PUBLISHED" as const,
      featured: true,
      basePrice: 22999,
      currency: "INR",
      destinations: [
        { name: "Shillong", country: "India", lat: 25.5788, lng: 91.8933 },
        { name: "Cherrapunji", country: "India", lat: 25.2702, lng: 91.7323 },
        { name: "Kaziranga", country: "India", lat: 26.5775, lng: 93.1711 },
      ],
      inclusions: ["Hotel stays", "Daily breakfast", "AC vehicle transport", "Kaziranga Elephant Safari"],
      exclusions: ["Airfare/train fare", "National park entry and camera fee"],
      images: ["/images/packages/northeast-explorer.jpg"],
    },
    {
      slug: "varanasi-spiritual-ganges",
      title: "Varanasi Spiritual Ganges",
      description: "Experience the spiritual soul of India with evening Ganga Aarti, ancient temple walks, and sunrise boat rides.",
      highlights: ["Ganga Aarti at Dashashwamedh Ghat", "Sunrise boat ride on Ganges", "Sarnath Buddhist stupa walk", "Silk weaving artisan tour"],
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
      inclusions: ["Heritage hotel stay", "Daily breakfast", "Private AC sedan transfers", "Private boat rides & local guide"],
      exclusions: ["Airfare/train fare", "Monument entry fees"],
      images: ["/images/packages/varanasi-ganges.jpg"],
    },
    {
      slug: "kashmir-valley-gulmarg",
      title: "Kashmir Valley & Gulmarg",
      description: "Discover Paradise on Earth — stay in luxury houseboats on Dal Lake, ride gondolas over Gulmarg snow slopes, and explore Betaab Valley.",
      highlights: ["Shikara ride & houseboat stay on Dal Lake", "Gulmarg Gondola ride to Apharwat peak", "Pahalgam Valley pine forest walk", "Mughal Gardens (Shalimar & Nishat) tour"],
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
        { name: "Pahalgam", country: "India", lat: 34.0161, lng: 75.3150 },
      ],
      inclusions: ["Luxury houseboat & resort stay", "Breakfast & Dinner included", "Private AC vehicle for all transfers", "Shikara ride on Dal Lake"],
      exclusions: ["Airfare to/from Srinagar", "Gondola ticket charges"],
      images: ["/images/packages/kashmir-valley.jpg"],
    },
  ];

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
        inclusions: def.inclusions,
        exclusions: def.exclusions,
        images: def.images,
      },
    });

    // Create sample reviews if none exist
    const reviewCount = await prisma.review.count({ where: { packageId: pkg.id } });
    if (reviewCount === 0) {
      await prisma.review.create({
        data: {
          packageId: pkg.id,
          userId: travelerUser.id,
          rating: 5,
          comment: `Unbelievable experience! Everything on this ${def.title} was planned to perfection. Highly recommended!`,
        },
      });
    }
  }

  console.log(`✅ ${packageDefinitions.length} packages created/updated in seed with reviews!`);
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
