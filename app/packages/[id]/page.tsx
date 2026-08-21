import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { Clock, Star, MapPin, CalendarDays, Hotel, Plane, Check, X, ShieldCheck, ChevronRight, Sparkles, Users, Mountain, Utensils, Camera, ShoppingBag, Bus, Coffee, ArrowRight } from "lucide-react";
import Link from "next/link";
import BookingForm from "./booking-form";
import { FavoriteButton } from "@/components/favorite-button";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";

/* ═══════════════════════════════════════════════════════
   DESTINATION IMAGES
   ═══════════════════════════════════════════════════════ */
const DESTINATION_IMAGES: Record<string, string> = {
  delhi: "https://images.unsplash.com/photo-1587474260584-136574528ed5?q=80&w=1200&auto=format&fit=crop",
  agra: "https://images.unsplash.com/photo-1564507592333-c60657eea523?q=80&w=1200&auto=format&fit=crop",
  jaipur: "https://images.unsplash.com/photo-1477587458883-47145ed94245?q=80&w=1200&auto=format&fit=crop",
  kochi: "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?q=80&w=1200&auto=format&fit=crop",
  munnar: "https://images.unsplash.com/photo-1516815231560-d1bbd6c13a5c?q=80&w=1200&auto=format&fit=crop",
  alleppey: "https://images.unsplash.com/photo-1593693397690-362cb9666fc2?q=80&w=1200&auto=format&fit=crop",
  manali: "https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?q=80&w=1200&auto=format&fit=crop",
  leh: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?q=80&w=1200&auto=format&fit=crop",
  goa: "https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?q=80&w=1200&auto=format&fit=crop",
  udaipur: "https://images.unsplash.com/photo-1568495248636-6432b97bd949?q=80&w=1200&auto=format&fit=crop",
  jodhpur: "https://images.unsplash.com/photo-1524492412937-b28074a5d7da?q=80&w=1200&auto=format&fit=crop",
  jaisalmer: "https://images.unsplash.com/photo-1570168007204-dfb528c6958f?q=80&w=1200&auto=format&fit=crop",
  shillong: "https://images.unsplash.com/photo-1598091383021-15ddea10925d?q=80&w=1200&auto=format&fit=crop",
  kaziranga: "https://images.unsplash.com/photo-1534008897995-27a23e859048?q=80&w=1200&auto=format&fit=crop",
  "north goa": "https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?q=80&w=1200&auto=format&fit=crop",
  "south goa": "https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?q=80&w=1200&auto=format&fit=crop",
  "nubra valley": "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?q=80&w=1200&auto=format&fit=crop",
  cherrapunji: "https://images.unsplash.com/photo-1598091383021-15ddea10925d?q=80&w=1200&auto=format&fit=crop",
};
const FALLBACK_HERO = [
  "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?q=80&w=1200&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?q=80&w=1200&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?q=80&w=1200&auto=format&fit=crop",
];

function getHeroImage(destinations: string[]): string {
  for (const dest of destinations) {
    const key = dest.toLowerCase().trim();
    if (DESTINATION_IMAGES[key]) return DESTINATION_IMAGES[key];
    const first = key.split(" ")[0];
    if (DESTINATION_IMAGES[first]) return DESTINATION_IMAGES[first];
  }
  return FALLBACK_HERO[0];
}

/* ═══════════════════════════════════════════════════════
   DEMO PACKAGES
   ═══════════════════════════════════════════════════════ */
const DEMO_PACKAGES = [
  {
    id: "1", title: "Golden Triangle Tour",
    description: "Explore Delhi, Agra, and Jaipur — India's most iconic destinations. Walk through centuries of Mughal grandeur, vibrant bazaars, and pink-walled palaces on this classic heritage trail.",
    highlights: ["Visit the Taj Mahal at sunrise", "Explore Jaipur's Amber Fort", "Shop in historic Delhi markets", "Heritage walk through Old Delhi"],
    inclusions: ["4-star hotel stays", "Daily breakfast", "Private AC car and driver", "Local tour guides"],
    exclusions: ["Monument entry fees", "Lunch & dinner", "Flights/trains to Delhi", "Personal expenses"],
    destinations: ["Delhi", "Agra", "Jaipur"], duration: 7, basePrice: 24999, currency: "INR", rating: 4.8, reviews: 124, difficulty: "EASY",
  },
  {
    id: "2", title: "Kerala Backwaters Bliss",
    description: "Cruise through serene backwaters, explore tea gardens, and relax on pristine beaches. Experience the lush green paradise of God's own country.",
    highlights: ["Overnight stay in a private luxury houseboat", "Explore Munnar's sprawling tea estates", "Relax on Kovalam's sandy shores", "Traditional Kathakali performance"],
    inclusions: ["3-star resort stays & houseboat", "Houseboat meals included", "AC sedan transportation", "Spice plantation tour"],
    exclusions: ["Airfare/train fare", "Sightseeing entry charges", "Any activities like boat ride/jeep safari", "Tips"],
    destinations: ["Kochi", "Munnar", "Alleppey"], duration: 5, basePrice: 18999, currency: "INR", rating: 4.9, reviews: 89, difficulty: "EASY",
  },
  {
    id: "3", title: "Himalayan Adventure",
    description: "Trek through breathtaking mountain trails and experience Himalayan culture. Conquer the world's highest motorable passes and camp under star-filled skies.",
    highlights: ["Drive through high-altitude Khardung La pass", "Camp under the stars in Nubra Valley", "Visit Pangong Lake on the Indo-China border", "White-water rafting in Zanskar"],
    inclusions: ["Camp & hotel accommodations", "Breakfast & Dinner", "Inner Line Permits", "Oxygen cylinders in vehicle"],
    exclusions: ["Flights to/from Leh", "Lunch", "Adventure activities like rafting", "Travel insurance"],
    destinations: ["Manali", "Leh", "Nubra Valley"], duration: 10, basePrice: 35999, currency: "INR", rating: 4.7, reviews: 67, difficulty: "CHALLENGING",
  },
  {
    id: "4", title: "Goa Beach Paradise",
    description: "Sun, sand, and seafood — the ultimate Goa beach vacation experience. From thrilling water sports to peaceful sunset cruises along the Arabian Sea.",
    highlights: ["Enjoy water sports on Baga Beach", "Explore historic Portuguese churches", "Watch sunset from Chapora Fort", "Cruise along the Mandovi river"],
    inclusions: ["Beach resort stay", "Airport transfers", "Scuba diving and water sports package", "South Goa sightseeing"],
    exclusions: ["Meals other than breakfast", "Sightseeing entry fees", "Flight bookings", "Personal expenses"],
    destinations: ["North Goa", "South Goa"], duration: 4, basePrice: 12999, currency: "INR", rating: 4.6, reviews: 210, difficulty: "EASY",
  },
  {
    id: "5", title: "Rajasthan Royal Heritage",
    description: "Step back in time to explore majestic forts, palaces, and desert landscapes. Live like royalty in heritage havelis and witness the golden sands of the Thar.",
    highlights: ["Boat ride on Udaipur's Lake Pichola", "Desert camel safari & camp in Jaisalmer", "Visit Mehrangarh Fort in Jodhpur", "Traditional Rajasthani folk dinner"],
    inclusions: ["Heritage hotel stays & desert camp", "Breakfast included", "AC SUV transport", "Desert cultural show with dinner"],
    exclusions: ["Flights/trains", "Monument entry tickets", "Guides fee", "Camera charges"],
    destinations: ["Udaipur", "Jodhpur", "Jaisalmer"], duration: 8, basePrice: 29999, currency: "INR", rating: 4.8, reviews: 93, difficulty: "MODERATE",
  },
  {
    id: "6", title: "Northeast Explorer",
    description: "Discover the untouched beauty of India's northeast — lush valleys and tribal culture. Home to living root bridges, rolling hills, and exotic wildlife.",
    highlights: ["Visit clean village Mawlynnong", "Trek to Double Decker Living Root Bridges", "Spot one-horned rhinos in Kaziranga", "Explore Shillong's Scottish highlands"],
    inclusions: ["Hotel stays", "Daily breakfast", "AC vehicle transport", "Kaziranga Elephant Safari"],
    exclusions: ["Airfare/train fare", "Lunches/dinners", "National park entry and camera fee", "Personal laundry"],
    destinations: ["Shillong", "Cherrapunji", "Kaziranga"], duration: 6, basePrice: 22999, currency: "INR", rating: 4.9, reviews: 42, difficulty: "MODERATE",
  },
];

interface PageProps {
  params: Promise<{ id: string }>;
}

/* ═══════════════════════════════════════════════════════
   DEMO ITINERARY GENERATOR
   ═══════════════════════════════════════════════════════ */
function getDemoItineraries(packageId: string, duration: number, destinations: string[]) {
  const itineraries = [];
  const destName = destinations[0] || "Destination";

  const activityPools: Record<string, { sightseeings: string[]; adventures: string[]; dinings: string[]; shoppings: string[]; culturals: string[] }> = {
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
    const sI1 = (i * 2 - 2) % pool.sightseeings.length;
    const sI2 = (i * 2 - 1) % pool.sightseeings.length;
    const aI = (i - 1) % pool.adventures.length;
    const dI1 = (i * 2 - 2) % pool.dinings.length;
    const dI2 = (i * 2 - 1) % pool.dinings.length;
    const shI = (i - 1) % pool.shoppings.length;
    const cI = (i - 1) % pool.culturals.length;
    const acts = [];

    if (isFirstDay) {
      acts.push({ id: `a-${packageId}-${i}-1`, time: "10:00 AM", title: `Arrival at ${dest}`, description: `Meet your driver and transfer to your accommodation.`, location: `${dest} Transit Terminal`, duration: "1.5 hrs", type: "TRANSPORT" });
      acts.push({ id: `a-${packageId}-${i}-2`, time: "12:00 PM", title: "Hotel Check-in & Rest", description: `Unpack and refresh at your hotel.`, location: `${dest} Resort`, duration: "1 hr", type: "CHECK_IN" });
      acts.push({ id: `a-${packageId}-${i}-3`, time: "02:00 PM", title: pool.dinings[dI1], description: `Savor local flavors at a handpicked restaurant.`, location: `${dest} Market District`, duration: "1.5 hrs", type: "DINING" });
      acts.push({ id: `a-${packageId}-${i}-4`, time: "04:30 PM", title: pool.sightseeings[sI1], description: `Stroll through iconic streets and landmarks.`, location: `${dest} Historical Zone`, duration: "2 hrs", type: "SIGHTSEEING" });
    } else if (isLastDay) {
      acts.push({ id: `a-${packageId}-${i}-1`, time: "09:00 AM", title: "Farewell Breakfast & Checkout", description: `Enjoy a final breakfast and check out.`, location: `${dest} Accommodation`, duration: "1.5 hrs", type: "CHECK_OUT" });
      acts.push({ id: `a-${packageId}-${i}-2`, time: "11:00 AM", title: pool.shoppings[shI], description: `Pick up souvenirs, spices, and gifts.`, location: `${dest} Central Market`, duration: "2 hrs", type: "SHOPPING" });
      acts.push({ id: `a-${packageId}-${i}-3`, time: "01:30 PM", title: pool.dinings[dI2], description: `Enjoy a relaxed final lunch before departure.`, location: `${dest} Food Center`, duration: "1.5 hrs", type: "DINING" });
      acts.push({ id: `a-${packageId}-${i}-4`, time: "04:00 PM", title: "Departure Transfer", description: `AC vehicle transfer to the transit hub.`, location: `${dest} Airport/Station`, duration: "1.5 hrs", type: "TRANSPORT" });
    } else if (i % 2 === 0) {
      acts.push({ id: `a-${packageId}-${i}-1`, time: "09:00 AM", title: pool.adventures[aI], description: `Kickstart your morning with an outdoor activity.`, location: `${dest} Activity Hub`, duration: "3 hrs", type: "ADVENTURE" });
      acts.push({ id: `a-${packageId}-${i}-2`, time: "01:00 PM", title: pool.dinings[dI1], description: `Relax over a traditional regional lunch.`, location: `${dest} Food Quarter`, duration: "1 hr", type: "DINING" });
      acts.push({ id: `a-${packageId}-${i}-3`, time: "03:00 PM", title: pool.sightseeings[sI2], description: `Discover viewpoints and local museums.`, location: `${dest} Heritage Site`, duration: "2 hrs", type: "SIGHTSEEING" });
    } else {
      acts.push({ id: `a-${packageId}-${i}-1`, time: "09:30 AM", title: pool.sightseeings[sI1], description: `Tour historical structures and panoramic views.`, location: `${dest} Landmark Area`, duration: "2.5 hrs", type: "SIGHTSEEING" });
      acts.push({ id: `a-${packageId}-${i}-2`, time: "01:00 PM", title: "Leisurely Lunch", description: `Savor regional dishes and seasonal beverages.`, location: `${dest} Diner`, duration: "1 hr", type: "DINING" });
      acts.push({ id: `a-${packageId}-${i}-3`, time: "03:00 PM", title: pool.culturals[cI], description: `Learn about region-specific traditions and folk arts.`, location: `${dest} Cultural Center`, duration: "2.5 hrs", type: "CULTURAL" });
    }

    itineraries.push({
      dayNumber: i,
      title: isFirstDay ? `Welcome & Orientation` : isLastDay ? `Farewell & Departure` : `Exploring ${dest}`,
      description: `Experience the best of ${dest}.`,
      activities: acts,
      hotel: isLastDay ? null : { name: `${dest} Grand Resort & Spa`, address: `${dest} City Center`, rating: 4.8, pricePerNight: 5000 },
      transport: isFirstDay ? { type: "CAR", from: "Airport/Station", to: `${dest} Grand Resort`, cost: 0 } : null,
    });
  }
  return itineraries;
}

/* ═══════════════════════════════════════════════════════
   HELPERS
   ═══════════════════════════════════════════════════════ */
function difficultyColor(d: string) {
  switch (d.toUpperCase()) {
    case "EASY": return "bg-emerald-50 text-emerald-700 border-emerald-200";
    case "MODERATE": return "bg-amber-50 text-amber-700 border-amber-200";
    case "CHALLENGING": return "bg-rose-50 text-rose-700 border-rose-200";
    default: return "bg-slate-50 text-slate-600 border-slate-200";
  }
}

function activityIcon(type: string) {
  switch (type) {
    case "SIGHTSEEING": return <Camera className="h-3.5 w-3.5" />;
    case "ADVENTURE": return <Mountain className="h-3.5 w-3.5" />;
    case "DINING": return <Utensils className="h-3.5 w-3.5" />;
    case "CULTURAL": return <Sparkles className="h-3.5 w-3.5" />;
    case "SHOPPING": return <ShoppingBag className="h-3.5 w-3.5" />;
    case "TRANSPORT": case "TRANSPORTATION": return <Bus className="h-3.5 w-3.5" />;
    case "CHECK_IN": case "CHECK_OUT": return <Coffee className="h-3.5 w-3.5" />;
    default: return <MapPin className="h-3.5 w-3.5" />;
  }
}

function activityColor(type: string) {
  switch (type) {
    case "SIGHTSEEING": return "bg-primary/10 text-primary border-primary/20";
    case "ADVENTURE": return "bg-amber-50 text-amber-600 border-amber-200";
    case "DINING": return "bg-emerald-50 text-emerald-600 border-emerald-200";
    case "CULTURAL": return "bg-violet-50 text-violet-600 border-violet-200";
    case "SHOPPING": return "bg-pink-50 text-pink-600 border-pink-200";
    case "TRANSPORT": case "TRANSPORTATION": return "bg-sky-50 text-sky-600 border-sky-200";
    case "CHECK_IN": case "CHECK_OUT": return "bg-slate-100 text-slate-600 border-slate-200";
    default: return "bg-slate-50 text-slate-600 border-slate-200";
  }
}

/* ═══════════════════════════════════════════════════════
   PAGE COMPONENT
   ═══════════════════════════════════════════════════════ */
export default async function PackageDetailPage({ params }: PageProps) {
  const { id } = await params;
  const session = await auth.api.getSession({ headers: await headers() });

  const isFavorited = session
    ? !!(await prisma.favorite.findUnique({ where: { userId_packageId: { userId: session.user.id, packageId: id } } }))
    : false;

  let pkg: any = null;

  try {
    const dbPkg = await prisma.package.findUnique({
      where: { id },
      include: { agency: true, reviews: true, itineraries: { include: { activities: true, hotel: true, transport: true }, orderBy: { dayNumber: "asc" } } },
    });
    if (dbPkg) {
      const dArr = Array.isArray(dbPkg.destinations) ? (dbPkg.destinations as any[]).map((d) => d.name || d) : [];
      const avg = dbPkg.reviews.length > 0 ? dbPkg.reviews.reduce((s, r) => s + r.rating, 0) / dbPkg.reviews.length : 4.8;
      pkg = {
        id: dbPkg.id, isDb: true, title: dbPkg.title, description: dbPkg.description, highlights: dbPkg.highlights,
        inclusions: dbPkg.inclusions, exclusions: dbPkg.exclusions, destinations: dArr, duration: dbPkg.duration,
        basePrice: Number(dbPkg.basePrice), currency: dbPkg.currency, difficulty: dbPkg.difficulty || "EASY",
        rating: parseFloat(avg.toFixed(1)), reviews: dbPkg.reviews.length, agencyName: dbPkg.agency.name,
        itineraries: dbPkg.itineraries?.length ? dbPkg.itineraries : getDemoItineraries(dbPkg.id, dbPkg.duration, dArr),
        departureDates: dbPkg.departureDates?.length ? dbPkg.departureDates : [new Date(Date.now() + 864e5 * 10), new Date(Date.now() + 864e5 * 20), new Date(Date.now() + 864e5 * 30), new Date(Date.now() + 864e5 * 45)],
      };
    }
  } catch (e) { console.error("DB Query failed:", e); }

  if (!pkg) {
    const demo = DEMO_PACKAGES.find((d) => d.id === id);
    if (demo) {
      pkg = { ...demo, isDb: false, agencyName: "Waypoint Verified Partner", itineraries: getDemoItineraries(demo.id, demo.duration, demo.destinations), departureDates: [new Date(Date.now() + 864e5 * 15), new Date(Date.now() + 864e5 * 30), new Date(Date.now() + 864e5 * 45)] };
    }
  }

  if (!pkg) notFound();
  pkg.isFavorited = isFavorited;

  const heroImage = getHeroImage(pkg.destinations);

  return (
    <div className="flex flex-col min-h-screen bg-[#FAFAF9] text-slate-900 font-sans">

      {/* ═══════════════ NAVBAR ═══════════════ */}
      <SiteHeader userSession={session} />


      {/* ═══════════════ CINEMATIC HERO ═══════════════ */}
      <section className="relative w-full overflow-hidden bg-slate-950">
        <div className="relative w-full h-[450px] sm:h-[500px] md:h-[600px]">
          <img
            src={heroImage}
            alt={pkg.title}
            className="w-full h-full object-cover object-center"
          />

          {/* Gradient overlays */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#09111b]/85 via-[#09111b]/40 to-[#09111b]" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#09111b]/60 via-transparent to-transparent" />

          {/* Hero Content */}
          <div className="absolute inset-0 z-10 flex flex-col justify-end">
            <div className="container mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 pb-20 sm:pb-24 md:pb-28">

              {/* Breadcrumb */}
              <nav className="flex items-center gap-1.5 text-xs font-semibold text-white/70 mb-4 flex-wrap">
                <Link href="/" className="hover:text-white transition-colors">Home</Link>
                <ChevronRight className="h-3.5 w-3.5 text-white/40 shrink-0" />
                <Link href="/packages" className="hover:text-white transition-colors">Packages</Link>
                <ChevronRight className="h-3.5 w-3.5 text-white/40 shrink-0" />
                <span className="text-white/90 font-bold truncate max-w-[200px] sm:max-w-xs">{pkg.title}</span>
              </nav>

              {/* Title */}
              <h1 className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.08] text-white font-display mb-4 max-w-4xl">
                {pkg.title}
              </h1>

              {/* Description */}
              <p className="text-xs sm:text-sm md:text-base text-white/80 leading-relaxed max-w-2xl mb-5 line-clamp-3 sm:line-clamp-none">
                {pkg.description}
              </p>

              {/* Destinations route */}
              <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs sm:text-sm text-white/90 font-medium">
                <MapPin className="h-4 w-4 text-primary shrink-0" />
                <span className="truncate">{pkg.destinations.join("  →  ")}</span>
              </div>

            </div>
          </div>

          {/* Favorite button top-right */}
          <div className="absolute top-20 right-4 top-24 sm:right-6 md:top-28 md:right-8 z-20">
            <FavoriteButton
              packageId={id}
              initialFavorited={pkg.isFavorited}
              className="bg-black/40 backdrop-blur-md border border-white/20 rounded-full p-1.5 sm:p-3 hover:bg-black/60 transition-all text-white shadow-lg"
            />
          </div>
        </div>
      </section>


      {/* ═══════════════ FLOATING STATS STRIP ═══════════════ */}
      <section className="relative z-20">
        <div className="container mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 -mt-12 sm:-mt-14">
          <div className="bg-white border border-slate-200/90 rounded-2xl shadow-xl lg:p-8 md:p-6 p-4">
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-slate-100 lg:gap-6 gap-5">

              {/* Duration */}
              <div className="flex items-center gap-3 relative">
                <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] sm:text-[11px] font-bold uppercase tracking-widest text-slate-400">Duration</p>
                  <p className="text-sm sm:text-base md:text-lg font-extrabold text-slate-900 font-display truncate">{pkg.duration} Days</p>
                </div>
              </div>

              {/* Difficulty */}
              <div className="flex items-center gap-3 relative">
                <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-secondary/10 flex items-center justify-center shrink-0">
                  <Mountain className="h-4 w-4 sm:h-5 sm:w-5 text-secondary" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] sm:text-[11px] font-bold uppercase tracking-widest text-slate-400">Difficulty</p>
                  <p className="text-sm sm:text-base md:text-lg font-extrabold text-slate-900 font-display capitalize truncate">{pkg.difficulty.toLowerCase()}</p>
                </div>
              </div>

              {/* Rating */}
              <div className="flex items-center gap-3 relative">
                <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-amber-50 flex items-center justify-center shrink-0">
                  <Star className="h-4 w-4 sm:h-5 sm:w-5 text-amber-500 fill-amber-500" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] sm:text-[11px] font-bold uppercase tracking-widest text-slate-400">Rating</p>
                  <p className="text-sm sm:text-base md:text-lg font-extrabold text-slate-900 font-display truncate">
                    {pkg.rating} <span className="text-slate-400 font-normal text-xs">({pkg.reviews || 12})</span>
                  </p>
                </div>
              </div>

              {/* Price */}
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
                  <span className="text-sm sm:text-base font-extrabold text-emerald-600">₹</span>
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] sm:text-[11px] font-bold uppercase tracking-widest text-slate-400">Starting at</p>
                  <p className="text-sm sm:text-base md:text-lg font-extrabold text-slate-900 font-display truncate">
                    ₹{pkg.basePrice.toLocaleString("en-IN")}
                    <span className="text-slate-400 font-normal text-xs ml-0.5">/person</span>
                  </p>
                </div>
              </div>

            </div>
          </div>
        </div>
      </section>


      {/* ═══════════════ MAIN CONTENT ═══════════════ */}
      <section className="flex-1 lg:py-20 py-12">
        <div className="container mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-[1fr_380px] items-start">

            {/* ═══ LEFT COLUMN ═══ */}
            <div className="lg:space-y-8 space-y-6">

              {/* ── HIGHLIGHTS ── */}
              {pkg.highlights && pkg.highlights.length > 0 && (
                <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden">
                  <div className="sm:p-7 p-4 border-b border-slate-100 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                      <Sparkles className="h-4 w-4 text-primary" />
                    </div>
                    <h2 className="text-base sm:text-lg font-extrabold font-display text-slate-900">Tour Highlights</h2>
                  </div>
                  <div className="sm:p-7 p-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      {pkg.highlights.map((h: string, i: number) => (
                        <div key={i} className="flex gap-3 items-start">
                          <div className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                            <Check className="h-3.5 w-3.5 text-primary" />
                          </div>
                          <span className="text-sm text-slate-600 leading-relaxed">{h}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}


              {/* ── INCLUSIONS & EXCLUSIONS ── */}
              <div className="grid gap-6 sm:grid-cols-2">
                {/* Inclusions */}
                <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden">
                  <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0">
                      <Check className="h-3.5 w-3.5 text-emerald-600" />
                    </div>
                    <h3 className="text-sm font-extrabold font-display text-slate-900">What&apos;s Included</h3>
                  </div>
                  <ul className="p-5 space-y-3">
                    {(pkg.inclusions && pkg.inclusions.length > 0 ? pkg.inclusions : ["Accommodations and daily activities"]).map((inc: string, i: number) => (
                      <li key={i} className="flex gap-2.5 text-sm text-slate-600">
                        <Check className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                        <span>{inc}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                {/* Exclusions */}
                <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden">
                  <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-rose-50 flex items-center justify-center shrink-0">
                      <X className="h-3.5 w-3.5 text-rose-500" />
                    </div>
                    <h3 className="text-sm font-extrabold font-display text-slate-900">Not Included</h3>
                  </div>
                  <ul className="p-5 space-y-3">
                    {(pkg.exclusions && pkg.exclusions.length > 0 ? pkg.exclusions : ["Personal expenses, laundry, tips"]).map((exc: string, i: number) => (
                      <li key={i} className="flex gap-2.5 text-sm text-slate-600">
                        <X className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
                        <span>{exc}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>


              {/* ── DAY-BY-DAY ITINERARY ── */}
              {pkg.itineraries && pkg.itineraries.length > 0 && (
                <div className="space-y-5">
                  {/* Section Header */}
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                      <CalendarDays className="h-4.5 w-4.5 text-primary" />
                    </div>
                    <div>
                      <h2 className="text-lg sm:text-xl font-extrabold font-display text-slate-900">Day-by-Day Itinerary</h2>
                      <p className="text-xs text-slate-500 mt-0.5">Detailed daily plan with activities, dining, and accommodations</p>
                    </div>
                  </div>

                  {/* Timeline */}
                  <div className="relative">
                    {/* Vertical connector line */}
                    <div className="absolute left-[18px] top-6 bottom-6 w-px bg-slate-200 hidden sm:block" />

                    <div className="space-y-4">
                      {pkg.itineraries.map((day: any, dayIdx: number) => (
                        <div key={day.dayNumber} className="relative sm:pl-12 pl-0">
                          {/* Day number circle on the vertical line */}
                          <div className="hidden sm:flex absolute left-0 top-5 w-[37px] h-[37px] rounded-full bg-gradient-to-br from-primary to-primary/80 items-center justify-center text-white font-extrabold text-sm shadow-md border-[3px] border-[#FAFAF9] z-10">
                            {day.dayNumber}
                          </div>

                          {/* Day Card */}
                          <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden">
                            {/* Day header */}
                            <div className="px-4 sm:px-5 py-4 border-b border-slate-100 flex items-center gap-3">
                              {/* Mobile day number */}
                              <div className="sm:hidden w-8 h-8 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center text-white font-extrabold text-sm shrink-0 shadow-sm">
                                {day.dayNumber}
                              </div>
                              <div className="flex-1 min-w-0">
                                <h3 className="text-sm font-extrabold text-slate-900 font-display truncate">{day.title}</h3>
                                <p className="text-xs text-slate-500 mt-0.5 truncate">{day.description}</p>
                              </div>
                              <span className={`hidden sm:inline-flex text-[10px] px-2.5 py-1 rounded-full border font-bold uppercase tracking-wide shrink-0 ${difficultyColor(pkg.difficulty)}`}>
                                Day {day.dayNumber}
                              </span>
                            </div>

                            <div className="p-4 sm:p-5 space-y-3">
                              {/* Transport */}
                              {day.transport && (
                                <div className="flex items-center gap-3 bg-sky-50/70 border border-sky-100 rounded-xl p-3 text-xs">
                                  <div className="w-7 h-7 rounded-lg bg-sky-100 flex items-center justify-center shrink-0">
                                    <Plane className="h-3.5 w-3.5 text-sky-600" />
                                  </div>
                                  <div className="min-w-0">
                                    <span className="font-bold text-slate-900 block">Transfer: {day.transport.from} → {day.transport.to}</span>
                                    <span className="text-slate-500 block mt-0.5">Mode: {day.transport.type}</span>
                                  </div>
                                </div>
                              )}

                              {/* Activities */}
                              {day.activities?.map((act: any, aIdx: number) => (
                                <div key={act.id || aIdx} className="flex gap-3 p-3 rounded-xl hover:bg-slate-50/80 transition-colors">
                                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${activityColor(act.type)}`}>
                                    {activityIcon(act.type)}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-0.5">
                                      <span className="text-[11px] font-bold text-primary">{act.time}</span>
                                      <span className="text-[9px] text-slate-400">•</span>
                                      <span className="text-[10px] text-slate-400 font-medium">{act.duration}</span>
                                    </div>
                                    <h4 className="text-sm font-bold text-slate-900 leading-snug">{act.title}</h4>
                                    {act.description && <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{act.description}</p>}
                                    <div className="flex items-center gap-1 mt-1 text-[11px] text-slate-400">
                                      <MapPin className="h-3 w-3 shrink-0" />
                                      <span className="truncate">{act.location}</span>
                                    </div>
                                  </div>
                                </div>
                              ))}

                              {/* Hotel */}
                              {day.hotel && (
                                <div className="flex items-center gap-3 bg-primary/5 border border-primary/10 rounded-xl p-3 text-xs">
                                  <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                                    <Hotel className="h-3.5 w-3.5 text-primary" />
                                  </div>
                                  <div className="min-w-0">
                                    <span className="font-bold text-slate-900 block">{day.hotel.name}</span>
                                    <span className="text-slate-500 block mt-0.5">{day.hotel.address} • ⭐ {day.hotel.rating}</span>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}


              {/* ── AGENCY INFO ── */}
              <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden">
                <div className="sm:p-6 p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-secondary/10 flex items-center justify-center shrink-0">
                      <Users className="h-5 w-5 text-secondary" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Organized By</p>
                      <h4 className="text-base font-extrabold text-slate-900 font-display">{pkg.agencyName}</h4>
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-[10px] font-bold uppercase tracking-wide text-emerald-700">
                    <ShieldCheck className="h-3 w-3" />
                    Verified Partner
                  </span>
                </div>
              </div>

            </div>


            {/* ═══ RIGHT COLUMN — BOOKING (desktop sticky, mobile after content) ═══ */}
            <div id="booking" className="lg:sticky lg:top-28 scroll-mt-28 lg:order-2 -order-1">
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
      </section>

      {/* ═══════════════ FOOTER ═══════════════ */}
      <SiteFooter />

      {/* ═══════════════ MOBILE FLOATING BOOK BAR ═══════════════ */}
      <div
        className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-2xl border-t border-slate-200/60 shadow-[0_-6px_24px_rgba(0,0,0,0.1)]"
        style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      >
        <div className="flex items-center justify-between gap-3 px-4 py-2.5 max-w-lg mx-auto">
          <div className="min-w-0">
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-extrabold text-slate-900 font-display leading-tight">
                ₹{pkg.basePrice.toLocaleString("en-IN")}
              </span>
              <span className="text-[11px] text-slate-400 font-medium">/person</span>
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <Star className="h-3 w-3 text-amber-500 fill-amber-500" />
              <span className="text-[11px] font-bold text-slate-500">{pkg.rating}</span>
              <span className="text-[9px] text-slate-300">•</span>
              <span className="text-[11px] text-slate-400">{pkg.duration}D</span>
            </div>
          </div>
          <a
            href="#booking"
            className="inline-flex items-center justify-center gap-1.5 py-2.5 sm:px-6 px-4 bg-primary hover:bg-primary/90 text-white text-sm font-bold rounded-md shadow-md shadow-primary/20 transition-all active:scale-[0.97] shrink-0"
          >
            Book Now
            <ArrowRight className="h-3.5 w-3.5" />
          </a>
        </div>
      </div>

    </div>
  );
}
