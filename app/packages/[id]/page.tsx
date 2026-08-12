import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { Badge } from "@/components/ui/badge";
import { Clock, Star, ArrowLeft, ShieldCheck, Check, X, MapPin, CalendarDays, Hotel, Plane } from "lucide-react";
import Link from "next/link";
import BookingForm from "./booking-form";
import { FavoriteButton } from "@/components/favorite-button";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

// Demo data for fallback
const DEMO_PACKAGES = [
  {
    id: "1",
    title: "Golden Triangle Tour",
    description: "Explore Delhi, Agra, and Jaipur — India's most iconic destinations.",
    highlights: ["Visit the Taj Mahal at sunrise", "Explore Jaipur's Amber Fort", "Shop in historic Delhi markets"],
    inclusions: ["4-star hotel stays", "Daily breakfast", "Private AC car and driver", "Local tour guides"],
    exclusions: ["Monument entry fees", "Lunch & dinner", "Flights/trains to Delhi", "Personal expenses"],
    destinations: ["Delhi", "Agra", "Jaipur"],
    duration: 7,
    basePrice: 24999,
    currency: "INR",
    rating: 4.8,
    reviews: 124,
    difficulty: "EASY",
  },
  {
    id: "2",
    title: "Kerala Backwaters Bliss",
    description: "Cruise through serene backwaters, explore tea gardens, and relax on pristine beaches.",
    highlights: ["Overnight stay in a private luxury houseboat", "Explore Munnar's sprawling tea estates", "Relax on Kovalam's sandy shores"],
    inclusions: ["3-star resort stays & houseboat", "Houseboat meals included", "AC sedan transportation", "Spice plantation tour"],
    exclusions: ["Airfare/train fare", "Sightseeing entry charges", "Any activities like boat ride/jeep safari", "Tips"],
    destinations: ["Kochi", "Munnar", "Alleppey"],
    duration: 5,
    basePrice: 18999,
    currency: "INR",
    rating: 4.9,
    reviews: 89,
    difficulty: "EASY",
  },
  {
    id: "3",
    title: "Himalayan Adventure",
    description: "Trek through breathtaking mountain trails and experience Himalayan culture.",
    highlights: ["Drive through high-altitude Khardung La pass", "Camp under the stars in Nubra Valley", "Visit Pangong Lake on the Indo-China border"],
    inclusions: ["Camp & hotel accommodations", "Breakfast & Dinner", "Inner Line Permits", "Oxygen cylinders in vehicle"],
    exclusions: ["Flights to/from Leh", "Lunch", "Adventure activities like rafting", "Travel insurance"],
    destinations: ["Manali", "Leh", "Nubra Valley"],
    duration: 10,
    basePrice: 35999,
    currency: "INR",
    rating: 4.7,
    reviews: 67,
    difficulty: "CHALLENGING",
  },
  {
    id: "4",
    title: "Goa Beach Paradise",
    description: "Sun, sand, and seafood — the ultimate Goa beach vacation experience.",
    highlights: ["Enjoy water sports on Baga Beach", "Explore historic Portuguese churches", "Watch sunset from Chapora Fort"],
    inclusions: ["Beach resort stay", "Airport transfers", "Scuba diving and water sports package", "South Goa sightseeing"],
    exclusions: ["Meals other than breakfast", "Sightseeing entry fees", "Flight bookings", "Personal expenses"],
    destinations: ["North Goa", "South Goa"],
    duration: 4,
    basePrice: 12999,
    currency: "INR",
    rating: 4.6,
    reviews: 210,
    difficulty: "EASY",
  },
  {
    id: "5",
    title: "Rajasthan Royal Heritage",
    description: "Step back in time to explore majestic forts, palaces, and desert landscapes.",
    highlights: ["Boat ride on Udaipur's Lake Pichola", "Desert camel safari & camp in Jaisalmer", "Visit Mehrangarh Fort in Jodhpur"],
    inclusions: ["Heritage hotel stays & desert camp", "Breakfast included", "AC SUV transport", "Desert cultural show with dinner"],
    exclusions: ["Flights/trains", "Monument entry tickets", "Guides fee", "Camera charges"],
    destinations: ["Udaipur", "Jodhpur", "Jaisalmer"],
    duration: 8,
    basePrice: 29999,
    currency: "INR",
    rating: 4.8,
    reviews: 93,
    difficulty: "MODERATE",
  },
  {
    id: "6",
    title: "Northeast Explorer",
    description: "Discover the untouched beauty of India's northeast — lush valleys and tribal culture.",
    highlights: ["Visit clean village Mawlynnong", "Trek to Double Decker Living Root Bridges", "Spot one-horned rhinos in Kaziranga"],
    inclusions: ["Hotel stays", "Daily breakfast", "AC vehicle transport", "Kaziranga Elephant Safari"],
    exclusions: ["Airfare/train fare", "Lunches/dinners", "National park entry and camera fee", "Personal laundry"],
    destinations: ["Shillong", "Cherrapunji", "Kaziranga"],
    duration: 6,
    basePrice: 22999,
    currency: "INR",
    rating: 4.9,
    reviews: 42,
    difficulty: "MODERATE",
  },
];

interface PageProps {
  params: Promise<{ id: string }>;
}

function getDemoItineraries(packageId: string, duration: number, destinations: string[]) {
  const itineraries = [];
  const destName = destinations[0] || "Destination";

  // A pool of unique activities to prevent repetitive days
  const activityPools: Record<string, {
    sightseeings: string[];
    adventures: string[];
    dinings: string[];
    shoppings: string[];
    culturals: string[];
  }> = {
    goa: {
      sightseeings: ["Fort Aguada & Lighthouse Walk", "Basilica of Bom Jesus tour", "Dona Paula Viewpoint", "Mangueshi Temple visit"],
      adventures: ["Parasailing & jet-skiing at Baga", "Dudhsagar Waterfalls jeep safari", "Scuba diving at Grand Island", "Crocodile spotting river cruise"],
      dinings: ["Goan fish curry lunch at Mum's Kitchen", "Sunset beach dinner at Curlies Shack", "Traditional vindaloo at Florentine", "Bebinca dessert at local bakery"],
      shoppings: ["Anjuna Wednesday Flea Market", "Mapusa Local Bazaar", "Panjim Municipal Market", "Mackie's Night Market"],
      culturals: ["Fontainhas Latin Quarter walk", "Ancestral Goa museum visit", "Spice Farm tour with lunch", "Goan folk dance cruise"]
    },
    delhi: {
      sightseeings: ["Red Fort Mughal architectural tour", "Qutub Minar ancient tower", "Humayun's Tomb garden tour", "India Gate war memorial walk"],
      adventures: ["Rickshaw ride in Old Delhi streets", "Early morning cycle tour in Lutyens Delhi", "Ziplining at Adventure Island", "Rock climbing at Sanjay Van"],
      dinings: ["Chole Bhature at Connaught Place", "Mughlai Feast at Karim's", "Butter Chicken at Moti Mahal", "Dahi Bhalla at Chandni Chowk"],
      shoppings: ["Chandni Chowk bazaar bargaining", "Khan Market premium book & fashion shopping", "Janpath traditional handicrafts", "Dilli Haat regional artisan stalls"],
      culturals: ["Akshardham Temple light show", "Lotus Temple silent meditation", "National Museum history walk", "Sufi Qawwali at Nizamuddin Dargah"]
    },
    kerala: {
      sightseeings: ["Fort Kochi Chinese Fishing Nets walk", "Munnar Tea Museum guided tour", "Athirappilly Waterfalls scenic view", "Eravikulam National Park Nilgiri Tahr view"],
      adventures: ["Alleppey canal kayaking", "Periyar tiger reserve forest trek", "Kolukkumalai peak jeep safari", "Bamboo rafting in Periyar lake"],
      dinings: ["Sadhya lunch on banana leaf", "Karimeen Pollichathu seafood dinner", "Munnar local tea & banana fritters", "Malabar Parotta & chicken curry"],
      shoppings: ["Kochi spice market shopping", "Alleppey coir handicrafts shopping", "Thekkady aromatic oils", "Trivandrum handloom garments"],
      culturals: ["Kathakali dance performance at center", "Kalaripayattu martial arts show", "Overnight stay in a traditional houseboat", "Kumarakom bird sanctuary tour"]
    },
    generic: {
      sightseeings: ["Historic Cathedral architectural walk", "Central Plaza landmark tour", "Panoramic Hilltop Viewpoint", "Botanical Conservatory tour"],
      adventures: ["Mountain hiking & nature trail trek", "Biking excursion along the riverfront", "Ziplining over the valley forests", "Kayaking tour in the scenic bay"],
      dinings: ["Traditional Breakfast at a local cafe", "Signature Lunch Feast of regional dishes", "Fine-dining Dinner with scenic sunset view", "Local dessert and pastries tasting"],
      shoppings: ["Traditional handicrafts bazaar walk", "Bustling shopping street fashion browsing", "Local souvenir market gifts shopping", "Artisan workshop crafts purchase"],
      culturals: ["National History Museum tour", "Art Gallery contemporary paintings tour", "Traditional folk music & dance concert", "Cooking masterclass with local chef"]
    }
  };

  const cleanDestName = destName.toLowerCase();
  const destKey = cleanDestName.includes("goa") ? "goa"
    : cleanDestName.includes("delhi") || cleanDestName.includes("jaipur") || cleanDestName.includes("agra") ? "delhi"
      : (cleanDestName.includes("kerala") || cleanDestName.includes("munnar") || cleanDestName.includes("alleppey") || cleanDestName.includes("kochi")) ? "kerala"
        : "generic";

  const pool = activityPools[destKey];

  for (let i = 1; i <= duration; i++) {
    const dest = destinations[(i - 1) % destinations.length] || destName;
    const isFirstDay = i === 1;
    const isLastDay = i === duration;

    // Choose index modulo list length to avoid undefined
    const sightIndex1 = (i * 2 - 2) % pool.sightseeings.length;
    const sightIndex2 = (i * 2 - 1) % pool.sightseeings.length;
    const advIndex = (i - 1) % pool.adventures.length;
    const dineIndex1 = (i * 2 - 2) % pool.dinings.length;
    const dineIndex2 = (i * 2 - 1) % pool.dinings.length;
    const shopIndex = (i - 1) % pool.shoppings.length;
    const cultIndex = (i - 1) % pool.culturals.length;

    const dayActivities = [];

    if (isFirstDay) {
      dayActivities.push({
        id: `act-${packageId}-${i}-1`,
        time: "10:00 AM",
        title: `Arrival at ${dest}`,
        description: `Meet your driver and transfer to your accommodation. Receive a brief orientation of the local area.`,
        location: `${dest} Transit Terminal`,
        duration: "1.5 hours",
        type: "TRANSPORTATION",
        cost: 0,
      });
      dayActivities.push({
        id: `act-${packageId}-${i}-2`,
        time: "12:00 PM",
        title: "Hotel Check-in & Rest",
        description: `Unpack and refresh at your hotel.`,
        location: `${dest} Resort`,
        duration: "1 hour",
        type: "CHECK_IN",
        cost: 0,
      });
      dayActivities.push({
        id: `act-${packageId}-${i}-3`,
        time: "02:00 PM",
        title: pool.dinings[dineIndex1],
        description: `Savor local flavors at a handpicked restaurant nearby.`,
        location: `${dest} Market District`,
        duration: "1.5 hours",
        type: "DINING",
        cost: 0,
      });
      dayActivities.push({
        id: `act-${packageId}-${i}-4`,
        time: "04:30 PM",
        title: pool.sightseeings[sightIndex1],
        description: `Stroll through iconic streets and landmarks to kick off your trip.`,
        location: `${dest} Historical Zone`,
        duration: "2 hours",
        type: "SIGHTSEEING",
        cost: 0,
      });
    } else if (isLastDay) {
      dayActivities.push({
        id: `act-${packageId}-${i}-1`,
        time: "09:00 AM",
        title: "Farewell Breakfast & Checkout",
        description: `Enjoy a final breakfast and check out from your hotel.`,
        location: `${dest} Accommodation`,
        duration: "1.5 hours",
        type: "CHECK_OUT",
        cost: 0,
      });
      dayActivities.push({
        id: `act-${packageId}-${i}-2`,
        time: "11:00 AM",
        title: pool.shoppings[shopIndex],
        description: `Pick up local souvenirs, spices, and gifts for family and friends.`,
        location: `${dest} Central Market`,
        duration: "2 hours",
        type: "SHOPPING",
        cost: 0,
      });
      dayActivities.push({
        id: `act-${packageId}-${i}-3`,
        time: "01:30 PM",
        title: pool.dinings[dineIndex2],
        description: `Enjoy a relaxed final lunch before departure.`,
        location: `${dest} Food Center`,
        duration: "1.5 hours",
        type: "DINING",
        cost: 0,
      });
      dayActivities.push({
        id: `act-${packageId}-${i}-4`,
        time: "04:00 PM",
        title: "Departure Transfer",
        description: `AC vehicle transfer back to the transit hub for your journey home.`,
        location: `${dest} Airport/Station`,
        duration: "1.5 hours",
        type: "TRANSPORTATION",
        cost: 0,
      });
    } else {
      // Middle days
      if (i % 2 === 0) {
        dayActivities.push({
          id: `act-${packageId}-${i}-1`,
          time: "09:00 AM",
          title: pool.adventures[advIndex],
          description: `Kickstart your morning with an exciting outdoor activity.`,
          location: `${dest} Activity Hub`,
          duration: "3 hours",
          type: "ADVENTURE",
          cost: 0,
        });
        dayActivities.push({
          id: `act-${packageId}-${i}-2`,
          time: "01:00 PM",
          title: pool.dinings[dineIndex1],
          description: `Relax over a traditional regional lunch.`,
          location: `${dest} Food Quarter`,
          duration: "1 hour",
          type: "DINING",
          cost: 0,
        });
        dayActivities.push({
          id: `act-${packageId}-${i}-3`,
          time: "03:00 PM",
          title: pool.sightseeings[sightIndex2],
          description: `Discover key viewpoints, architectural sights, or local museums.`,
          location: `${dest} Heritage Site`,
          duration: "2 hours",
          type: "SIGHTSEEING",
          cost: 0,
        });
      } else {
        dayActivities.push({
          id: `act-${packageId}-${i}-1`,
          time: "09:30 AM",
          title: pool.sightseeings[sightIndex1],
          description: `Tour historical structures and take in panoramic views of the area.`,
          location: `${dest} Landmark Area`,
          duration: "2.5 hours",
          type: "SIGHTSEEING",
          cost: 0,
        });
        dayActivities.push({
          id: `act-${packageId}-${i}-2`,
          time: "01:00 PM",
          title: "Leisurely Lunch",
          description: `Savor regional dishes and seasonal beverages.`,
          location: `${dest} Diner`,
          duration: "1 hour",
          type: "DINING",
          cost: 0,
        });
        dayActivities.push({
          id: `act-${packageId}-${i}-3`,
          time: "03:00 PM",
          title: pool.culturals[cultIndex],
          description: `Engage with local guides to learn about region-specific traditions and folk arts.`,
          location: `${dest} Cultural Center`,
          duration: "2.5 hours",
          type: "CULTURAL",
          cost: 0,
        });
      }
    }

    itineraries.push({
      dayNumber: i,
      title: isFirstDay ? `Welcome & Orientation Tour` : isLastDay ? `Farewell & Souvenir Shopping` : `Exploring the Wonders of ${dest}`,
      description: `Experience the best sights, flavors, and local activities around ${dest}.`,
      activities: dayActivities,
      hotel: isLastDay ? null : {
        name: `${dest} Grand Resort & Spa`,
        address: `${dest} City Center`,
        rating: 4.8,
        pricePerNight: 5000,
      },
      transport: isFirstDay ? {
        type: "CAR",
        from: "Airport/Station",
        to: `${dest} Grand Resort`,
        cost: 0,
      } : null,
    });
  }
  return itineraries;
}

export default async function PackageDetailPage({ params }: PageProps) {
  const { id } = await params;

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  const isFavorited = session
    ? !!(await prisma.favorite.findUnique({
      where: {
        userId_packageId: {
          userId: session.user.id,
          packageId: id,
        },
      },
    }))
    : false;

  let pkg: any = null;

  // 1. Try to find in DB first
  try {
    const dbPkg = await prisma.package.findUnique({
      where: { id },
      include: {
        agency: true,
        reviews: true,
        itineraries: {
          include: {
            activities: true,
            hotel: true,
            transport: true,
          },
          orderBy: { dayNumber: "asc" },
        },
      },
    });

    if (dbPkg) {
      const destinationsArray = Array.isArray(dbPkg.destinations)
        ? (dbPkg.destinations as any[]).map((d) => d.name || d)
        : [];

      const avgRating = dbPkg.reviews.length > 0
        ? dbPkg.reviews.reduce((sum, r) => sum + r.rating, 0) / dbPkg.reviews.length
        : 4.8;

      pkg = {
        id: dbPkg.id,
        isDb: true,
        title: dbPkg.title,
        description: dbPkg.description,
        highlights: dbPkg.highlights,
        inclusions: dbPkg.inclusions,
        exclusions: dbPkg.exclusions,
        destinations: destinationsArray,
        duration: dbPkg.duration,
        basePrice: Number(dbPkg.basePrice),
        currency: dbPkg.currency,
        difficulty: dbPkg.difficulty || "EASY",
        rating: parseFloat(avgRating.toFixed(1)),
        reviews: dbPkg.reviews.length,
        agencyName: dbPkg.agency.name,
        itineraries: dbPkg.itineraries && dbPkg.itineraries.length > 0
          ? dbPkg.itineraries
          : getDemoItineraries(dbPkg.id, dbPkg.duration, destinationsArray),
        departureDates: dbPkg.departureDates && dbPkg.departureDates.length > 0
          ? dbPkg.departureDates
          : [
            new Date(Date.now() + 24 * 60 * 60 * 1000 * 10),
            new Date(Date.now() + 24 * 60 * 60 * 1000 * 20),
            new Date(Date.now() + 24 * 60 * 60 * 1000 * 30),
            new Date(Date.now() + 24 * 60 * 60 * 1000 * 45),
          ],
      };
    }
  } catch (e) {
    console.error("DB Query failed:", e);
  }

  // 2. Fall back to demo data if not found in DB
  if (!pkg) {
    const demo = DEMO_PACKAGES.find((d) => d.id === id);
    if (demo) {
      pkg = {
        ...demo,
        isDb: false,
        agencyName: "Waypoint Verified Partner",
        itineraries: getDemoItineraries(demo.id, demo.duration, demo.destinations),
        departureDates: [
          new Date(Date.now() + 24 * 60 * 60 * 1000 * 15), // 15 days from now
          new Date(Date.now() + 24 * 60 * 60 * 1000 * 30), // 30 days from now
          new Date(Date.now() + 24 * 60 * 60 * 1000 * 45), // 45 days from now
        ],
      };
    }
  }

  if (!pkg) {
    notFound();
  }

  pkg.isFavorited = isFavorited;

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/packages" className="flex items-center gap-2 text-sm font-medium hover:text-secondary transition-colors">
            <ArrowLeft className="h-4 w-4" /> Back to Packages
          </Link>
          <div className="flex items-center gap-4">
            <FavoriteButton
              packageId={id}
              initialFavorited={pkg.isFavorited}
            />
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-gradient-to-tr from-secondary to-secondary flex items-center justify-center">
                <span className="text-white font-bold text-xs">W</span>
              </div>
              <span className="font-bold text-sm text-slate-900">Waypoint</span>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Header */}
      <div className="bg-gradient-to-br from-secondary to-slate-900 text-white py-16 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <Badge className="bg-secondary text-white hover:bg-secondary/90 px-3 py-1 text-xs">
              {pkg.difficulty}
            </Badge>
            <Badge variant="outline" className="text-slate-300 border-slate-700 px-3 py-1 text-xs">
              <Clock className="h-3.5 w-3.5 mr-1 text-secondary inline" />
              {pkg.duration} Days
            </Badge>
            <div className="flex items-center gap-1 text-sm text-slate-300 ml-2">
              <Star className="h-4 w-4 fill-primary text-primary" />
              <span className="font-semibold text-white">{pkg.rating}</span>
              <span>({pkg.reviews || 12} reviews)</span>
            </div>
          </div>

          <h1 className="text-3xl md:text-5xl font-bold mb-4 tracking-tight">
            {pkg.title}
          </h1>

          <p className="text-slate-300 text-lg max-w-3xl mb-0 leading-relaxed">
            {pkg.description}
          </p>
        </div>
      </div>

      {/* Main Body Grid */}
      <div className="container mx-auto max-w-6xl px-4 py-12">
        <div className="grid gap-8 lg:grid-cols-3">

          {/* Details (Left 2 cols) */}
          <div className="lg:col-span-2 space-y-8">

            {/* Visual Header Banner */}
            <div className="h-64 md:h-96 rounded-2xl bg-gradient-to-tr from-secondary/20 to-secondary/30 border border-slate-200 flex flex-col items-center justify-center relative overflow-hidden group shadow-xl">
              <MapPin className="h-16 w-16 text-secondary animate-pulse" />
              <div className="absolute bottom-4 left-4 right-4 text-center bg-black/40 backdrop-blur-md border border-white/10 p-3 rounded-xl">
                <span className="text-xs text-slate-300">Route Map & Destinations</span>
                <div className="text-sm font-semibold text-white mt-1">
                  {pkg.destinations.join(" → ")}
                </div>
              </div>
            </div>

            {/* highlights */}
            {pkg.highlights && pkg.highlights.length > 0 && (
              <div className="bg-white p-6 md:p-8 rounded-2xl border border-slate-200 shadow-sm">
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-slate-900">
                  <ShieldCheck className="h-5 w-5 text-secondary" />
                  Tour Highlights
                </h2>
                <ul className="grid gap-3 sm:grid-cols-2">
                  {pkg.highlights.map((h: string, i: number) => (
                    <li key={i} className="flex gap-2 text-sm text-slate-600 align-top animate-fade-in">
                      <span className="text-secondary font-bold">✦</span>
                      <span>{h}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Inclusions & Exclusions */}
            <div className="grid gap-6 sm:grid-cols-2">
              {/* Inclusions */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <h3 className="text-lg font-bold mb-4 text-secondary flex items-center gap-2">
                  <Check className="h-5 w-5" /> Inclusions
                </h3>
                <ul className="space-y-2.5">
                  {pkg.inclusions && pkg.inclusions.length > 0 ? (
                    pkg.inclusions.map((inc: string, i: number) => (
                      <li key={i} className="flex gap-2 text-sm text-slate-600">
                        <Check className="h-4 w-4 text-secondary shrink-0 mt-0.5" />
                        <span>{inc}</span>
                      </li>
                    ))
                  ) : (
                    <li className="text-sm text-slate-600">Accommodations and daily activities</li>
                  )}
                </ul>
              </div>

              {/* Exclusions */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <h3 className="text-lg font-bold mb-4 text-rose-600 flex items-center gap-2">
                  <X className="h-5 w-5" /> Exclusions
                </h3>
                <ul className="space-y-2.5">
                  {pkg.exclusions && pkg.exclusions.length > 0 ? (
                    pkg.exclusions.map((exc: string, i: number) => (
                      <li key={i} className="flex gap-2 text-sm text-slate-600">
                        <X className="h-4 w-4 text-rose-500 shrink-0 mt-0.5" />
                        <span>{exc}</span>
                      </li>
                    ))
                  ) : (
                    <li className="text-sm text-slate-600">Personal expenses, laundry, tips</li>
                  )}
                </ul>
              </div>
            </div>

            {/* Day-by-Day Itinerary */}
            {pkg.itineraries && pkg.itineraries.length > 0 && (
              <div className="bg-white p-6 md:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
                <h2 className="text-xl font-bold mb-2 flex items-center gap-2 text-slate-900">
                  <CalendarDays className="h-5 w-5 text-secondary" />
                  Day-by-Day Itinerary
                </h2>
                <p className="text-sm text-slate-600 mt-0.5">Explore the detailed daily tour plans, sightseeing stops, and activities.</p>

                <div className="space-y-6 mt-4">
                  {pkg.itineraries.map((day: any) => (
                    <div key={day.dayNumber} className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50/50">
                      <div className="p-4 bg-slate-100/60 border-b border-slate-200 flex items-center gap-3">
                        <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-secondary to-secondary flex items-center justify-center text-white font-bold text-sm shadow">
                          {day.dayNumber}
                        </div>
                        <div>
                          <h3 className="font-semibold text-slate-900">{day.title}</h3>
                          {day.description && <p className="text-xs text-slate-600 mt-0.5">{day.description}</p>}
                        </div>
                      </div>

                      <div className="p-5 space-y-4">
                        {/* Transport */}
                        {day.transport && (
                          <div className="flex items-center gap-3 bg-secondary/10 border border-secondary/20 rounded-lg p-3 text-xs">
                            <Plane className="h-4 w-4 text-secondary" />
                            <div>
                              <span className="font-semibold text-slate-900">Transfer: {day.transport.from} → {day.transport.to}</span>
                              <span className="text-slate-600 block mt-0.5">Mode: {day.transport.type}</span>
                            </div>
                          </div>
                        )}

                        {/* Activities */}
                        <div className="space-y-4 pl-2 border-l border-slate-200 ml-4">
                          {day.activities?.map((act: any, aIdx: number) => (
                            <div key={act.id || aIdx} className="relative pl-6">
                              <span className="absolute left-[-21px] top-1.5 h-2.5 w-2.5 rounded-full bg-secondary border-2 border-white shadow-sm" />
                              <div className="text-xs font-semibold text-secondary">{act.time}</div>
                              <h4 className="text-sm font-semibold mt-0.5 text-slate-900">{act.title}</h4>
                              {act.description && <p className="text-xs text-slate-600 mt-1 leading-relaxed">{act.description}</p>}
                              <div className="text-xs text-slate-500 mt-1.5 flex gap-3 flex-wrap">
                                <span>📍 {act.location}</span>
                                <span>⏱️ {act.duration}</span>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Hotel */}
                        {day.hotel && (
                          <div className="flex items-center gap-3 bg-[#E8AA9B]/10 border border-[#E8AA9B]/20 rounded-lg p-3 text-xs mt-2">
                            <Hotel className="h-4 w-4 text-primary" />
                            <div>
                              <span className="font-semibold text-slate-900">Accommodation: {day.hotel.name}</span>
                              <span className="text-slate-600 block mt-0.5">{day.hotel.address} • Rating: ⭐{day.hotel.rating}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Agency/Partner info */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-500">Organized By</span>
                <h4 className="text-md font-bold text-slate-900 mt-0.5">{pkg.agencyName}</h4>
              </div>
              <Badge variant="outline" className="border-secondary/30 text-secondary bg-secondary/5 px-2.5 py-1">
                Verified Agency Partner
              </Badge>
            </div>

          </div>

          {/* Booking form (Right 1 col) */}
          <div>
            <BookingForm
              packageId={pkg.isDb ? pkg.id : undefined}
              basePrice={pkg.basePrice}
              currency={pkg.currency}
              duration={pkg.duration}
              departureDates={pkg.departureDates || []}
            />
          </div>

        </div>
      </div>
    </div>
  );
}
