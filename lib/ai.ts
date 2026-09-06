import { GoogleGenerativeAI } from "@google/generative-ai";
import { z } from "zod";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export const geminiModel = genAI.getGenerativeModel({
  model: "gemini-2.0-flash",
  generationConfig: {
    responseMimeType: "application/json",
  },
});

export interface TripRequest {
  destination: string;
  startDate: string;
  endDate: string;
  travelers: number;
  budget: number;
  currency: string;
  travelStyle: string;
  interests: string[];
  stayPreference: string;
  transportPreference: string;
}

export interface GeneratedDay {
  dayNumber: number;
  title: string;
  description: string;
  activities: Array<{
    time: string;
    title: string;
    description: string;
    location: string;
    duration: string;
    type: string;
    estimatedCost: number;
  }>;
  hotel: {
    name: string;
    area: string;
    pricePerNight: number;
    rating: number;
  } | null;
  transport: {
    type: string;
    from: string;
    to: string;
    cost: number;
    duration: string;
  } | null;
}

export interface GeneratedTrip {
  title: string;
  summary: string;
  totalEstimatedCost: number;
  costBreakdown: {
    accommodation: number;
    transport: number;
    activities: number;
    food: number;
    miscellaneous: number;
  };
  tips: string[];
  itinerary: GeneratedDay[];
}

const generatedTripSchema = z.object({
  title: z.string().trim().min(1).max(160),
  summary: z.string().trim().min(1).max(2_000),
  totalEstimatedCost: z.number().finite().nonnegative(),
  costBreakdown: z.object({
    accommodation: z.number().finite().nonnegative(),
    transport: z.number().finite().nonnegative(),
    activities: z.number().finite().nonnegative(),
    food: z.number().finite().nonnegative(),
    miscellaneous: z.number().finite().nonnegative(),
  }),
  tips: z.array(z.string().trim().min(1).max(500)).max(20),
  itinerary: z.array(z.object({
    dayNumber: z.number().int().positive(),
    title: z.string().trim().min(1).max(200),
    description: z.string().trim().max(2_000),
    activities: z.array(z.object({
      time: z.string().trim().max(50),
      title: z.string().trim().min(1).max(200),
      description: z.string().trim().max(2_000),
      location: z.string().trim().max(300),
      duration: z.string().trim().max(100),
      type: z.enum(["SIGHTSEEING", "ADVENTURE", "DINING", "SHOPPING", "RELAXATION", "CULTURAL", "TRANSPORTATION", "CHECK_IN", "CHECK_OUT"]),
      estimatedCost: z.number().finite().nonnegative(),
    })).max(20),
    hotel: z.object({
      name: z.string().trim().min(1).max(200),
      area: z.string().trim().max(300),
      pricePerNight: z.number().finite().nonnegative(),
      rating: z.number().finite().min(0).max(5),
    }).nullable(),
    transport: z.object({
      type: z.enum(["FLIGHT", "TRAIN", "BUS", "CAR", "FERRY", "WALK"]),
      from: z.string().trim().min(1).max(300),
      to: z.string().trim().min(1).max(300),
      cost: z.number().finite().nonnegative(),
      duration: z.string().trim().max(100),
    }).nullable(),
  })).min(1).max(30),
});

function validateGeneratedTrip(candidate: unknown, expectedDays: number): GeneratedTrip | null {
  const parsed = generatedTripSchema.safeParse(candidate);
  if (!parsed.success) return null;
  const days = parsed.data.itinerary.map((day) => day.dayNumber).sort((a, b) => a - b);
  if (days.length !== expectedDays || days.some((day, index) => day !== index + 1)) return null;
  return parsed.data;
}

/**
 * Smart Day-to-City Mapper for Multi-Destination Trips
 * Allocates days so earlier cities get minimal travel days and later cities get maximum exploration.
 * E.g., 3 days for ["Goa", "Agra"] -> Day 1: Goa, Day 2: Agra, Day 3: Agra.
 */
function buildDayCityMap(days: number, destList: string[]): string[] {
  const map: string[] = [];
  const numCities = destList.length;

  if (numCities <= 1) {
    return Array(days).fill(destList[0] || "Destination");
  }

  if (days <= numCities) {
    for (let i = 0; i < days; i++) {
      map.push(destList[i]);
    }
    return map;
  }

  const daysPerCity = Math.floor(days / numCities);
  const remainder = days % numCities;

  const cityDayCounts = Array(numCities).fill(daysPerCity);
  // Distribute remainder from LAST city backwards so destination cities get more time
  for (let r = 0; r < remainder; r++) {
    const targetIdx = numCities - 1 - r;
    cityDayCounts[targetIdx] += 1;
  }

  for (let idx = 0; idx < numCities; idx++) {
    for (let c = 0; c < cityDayCounts[idx]; c++) {
      map.push(destList[idx]);
    }
  }

  return map;
}

export function buildTripPrompt(request: TripRequest): string {
  const startDate = new Date(request.startDate);
  const endDate = new Date(request.endDate);
  const days = Math.max(
    1,
    Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
  );

  const perPersonPerDayBudget = Math.round(request.budget / (days * request.travelers));
  const totalPerPerson = Math.round(request.budget / request.travelers);

  // Detect multi-destination trips
  const destList = request.destination.split(",").map((d) => d.trim()).filter(Boolean);
  const isMultiCity = destList.length > 1;

  let multiCityGuide = "";
  if (isMultiCity) {
    const dayCityMap = buildDayCityMap(days, destList);

    // Group days per city for clear prompt instructions
    const cityRanges: Record<string, number[]> = {};
    dayCityMap.forEach((city, idx) => {
      if (!cityRanges[city]) cityRanges[city] = [];
      cityRanges[city].push(idx + 1);
    });

    const scheduleStr = Object.entries(cityRanges)
      .map(([city, dayNums]) => `- **${city}**: Day ${dayNums[0]}${dayNums.length > 1 ? ` to Day ${dayNums[dayNums.length - 1]}` : ""} (${dayNums.length} day${dayNums.length > 1 ? "s" : ""})`)
      .join("\n");

    multiCityGuide = `
### 🚨 MANDATORY MULTI-CITY ROUTE ALLOCATION PLAN:
This trip covers ${destList.length} DISTINCT DESTINATIONS in this exact sequential route: **${destList.join(" → ")}**.
You MUST divide the ${days} days among these destinations as follows:
${scheduleStr}

**STRICT MULTI-CITY RULES:**
1. **NO CONCATENATED PLACES:** NEVER write "Arrival in ${request.destination}" or "${request.destination} Airport". Write ONLY the specific city name for that day (e.g. "Arrival in ${destList[0]}" on Day 1).
2. **GEOGRAPHIC ISOLATION:**
${Object.entries(cityRanges).map(([c, nums]) => `   - Days ${nums.join(", ")} MUST take place ONLY in "${c}". Do NOT mention any other destination on those days.`).join("\n")}
3. **INTERCITY TRANSFERS:** On the day of moving between cities, add a TRANSPORTATION activity showing the journey (e.g. "${destList[0]} to ${destList[1] || "Next Stop"} Transfer") using ${request.transportPreference}, followed by CHECK_IN at a new hotel in the new city.
4. **FINAL DAY MUST COMPLETE THE TRIP:** On Day ${days} (the final day), after morning/afternoon sightseeing in ${destList[destList.length - 1]}, you MUST include a final DEPARTURE TRANSPORTATION activity taking the travelers back home. NEVER end a trip abruptly.
5. **CITY-SPECIFIC HOTELS:** Provide a new hotel for each destination city. Do NOT use a hotel from ${destList[0]} when the traveler is in another city.
6. **DAY TITLES:** Include the current city name in each day's title (e.g. "Day 1: ${destList[0]} - Heritage & Highlights").
`;
  }

  return `You are a world-class luxury travel concierge and itinerary architect. Generate a flawless, highly accurate ${days}-day travel itinerary.

## TRIP PARAMETERS
- **Destination${isMultiCity ? "s" : ""}:** ${isMultiCity ? destList.join(" → ") : request.destination}
- **Duration:** ${days} Days (${days - 1} Nights) — ${request.startDate} to ${request.endDate}
- **Travelers:** ${request.travelers} Person(s)
- **Total Budget:** ${request.currency} ${request.budget.toLocaleString()} (${request.currency} ${perPersonPerDayBudget.toLocaleString()} / person / day)
- **Travel Style:** ${request.travelStyle}
- **Interests:** ${request.interests.join(", ") || "Sightseeing, Local Food, Culture"}
- **Stay Preference:** ${request.stayPreference}
- **Transport Preference:** ${request.transportPreference}
${multiCityGuide}

## ITINERARY EXECUTION RULES:

1. **GEOGRAPHIC ACCURACY (CRITICAL):**
   - Every attraction, landmark, restaurant, and hotel MUST be a REAL place that exists in the specific city assigned for that day.
   - For location fields, write EXACT neighborhoods or areas in that city (e.g., "Mall Road, Shimla" or "Baga Beach, North Goa"). NEVER write "${request.destination}" as a single location name.

2. **CHRONOLOGICAL DAILY FLOW:**
   - **Morning (08:30 AM - 11:30 AM):** Breakfast & main morning attraction.
   - **Lunch (12:30 PM - 02:00 PM):** Named local restaurant in that area.
   - **Afternoon (02:30 PM - 05:30 PM):** Afternoon sightseeing or activity.
   - **Evening/Dinner (06:30 PM - 09:30 PM):** Sunset viewpoint / market walk, followed by dinner at a named local eatery.

3. **REALISTIC NO-REPEAT ACTIVITIES:**
   - NEVER repeat the same activity or restaurant across different days.
   - Do NOT use vague titles like "Arrival in ${request.destination}" or "Explore local places". Give specific names (e.g. "Morning Stroll at The Ridge & Christ Church").

4. **DAY 1 & FINAL DAY STRUCTURE:**
   - **Day 1:** Arrival in ${destList[0]} → Hotel Check-in → Afternoon Exploration → Dinner.
   - **Final Day (Day ${days}):** Final morning activity → Hotel Checkout → Departure Transport back home.

5. **TITLE & SUMMARY:**
   - **title:** Create a captivating 5-8 word title for the trip (e.g., "${isMultiCity ? `${destList[0]} to ${destList[destList.length - 1]} Grand Tour: Peaks, Valleys & Heritage` : `Enchanting ${request.destination}: Culture & Coastline`}"). NEVER include words like "STANDARD", "BUDGET", "LUXURY", or "Itinerary".
   - **summary:** Write a compelling 2-3 sentence overview describing the overall journey across ${isMultiCity ? destList.join(", ") : request.destination}.

Respond ONLY with valid JSON (no markdown wrapper, no extra text). Use this exact schema:

{
  "title": "Evocative magazine title",
  "summary": "Immersive 2-3 sentence teaser overview",
  "totalEstimatedCost": ${request.budget},
  "costBreakdown": {
    "accommodation": ${Math.round(request.budget * 0.35)},
    "transport": ${Math.round(request.budget * 0.25)},
    "activities": ${Math.round(request.budget * 0.20)},
    "food": ${Math.round(request.budget * 0.15)},
    "miscellaneous": ${Math.round(request.budget * 0.05)}
  },
  "tips": ["Destination tip 1", "Transport tip 2", "Food tip 3", "Budget tip 4", "Packing tip 5"],
  "itinerary": [
    {
      "dayNumber": 1,
      "title": "Day 1: ${destList[0]} - Arrival & First Impressions",
      "description": "Welcome to ${destList[0]}. Check into your hotel and explore local highlights.",
      "activities": [
        {
          "time": "10:00 AM",
          "title": "Arrival & Transfer in ${destList[0]}",
          "description": "Meet driver at ${destList[0]} terminal and transfer to your stay.",
          "location": "Airport / Railway Station, ${destList[0]}",
          "duration": "1.5 hours",
          "type": "TRANSPORTATION",
          "estimatedCost": 1500
        }
      ],
      "hotel": {
        "name": "Hotel Name in ${destList[0]}",
        "area": "Popular Area, ${destList[0]}",
        "pricePerNight": 3500,
        "rating": 4.5
      },
      "transport": {
        "type": "${request.transportPreference.toUpperCase()}",
        "from": "Home City",
        "to": "${destList[0]}",
        "cost": 3000,
        "duration": "2 hours"
      }
    }
  ]
}

STRICT: Generate ALL ${days} DAYS in the itinerary array.`;
}

export async function generateTrip(request: TripRequest): Promise<GeneratedTrip> {
  try {
    if (!process.env.GEMINI_API_KEY) {
      console.warn("[AI] GEMINI_API_KEY is not defined, running in mock fallback mode.");
      return generateMockTrip(request);
    }

    const prompt = buildTripPrompt(request);
    const result = await geminiModel.generateContent(prompt);
    const response = result.response;
    const text = response.text();

    // Clean the response - remove markdown code blocks if present
    let cleaned = text.trim();
    if (cleaned.startsWith("```json")) {
      cleaned = cleaned.slice(7);
    } else if (cleaned.startsWith("```")) {
      cleaned = cleaned.slice(3);
    }
    if (cleaned.endsWith("```")) {
      cleaned = cleaned.slice(0, -3);
    }
    cleaned = cleaned.trim();

    const expectedDays = Math.ceil(
      (new Date(request.endDate).getTime() - new Date(request.startDate).getTime()) / 86_400_000
    );
    const parsed = validateGeneratedTrip(JSON.parse(cleaned), expectedDays);
    if (!parsed) throw new Error("AI response did not match the required itinerary schema.");
    return parsed;
  } catch (error) {
    console.error("[AI] Error generating trip with Gemini API. Falling back to local mock generator.", error);
    return generateMockTrip(request);
  }
}

// ==========================================
// Offline Mock AI Generators (Multi-City Aware)
// ==========================================

const destinationData: Record<string, {
  hotelPrefixes: string[];
  areas: string[];
  sightseeings: string[];
  adventures: string[];
  dinings: string[];
  shoppings: string[];
  culturals: string[];
}> = {
  goa: {
    hotelPrefixes: ["Calangute Beach Resort", "Anjuna Heritage Villa", "Taj Exotica Palace", "Vagator Cliffside Inn"],
    areas: ["North Goa Beach Belt", "South Goa Quiet Coast", "Panjim Latin Quarter", "Ponda Spice Country"],
    sightseeings: ["Aguada Fort & Lighthouse walk", "Basilica of Bom Jesus tour", "Dona Paula Viewpoint visit", "Se Cathedral architecture walk"],
    adventures: ["Baga beach jet-skiing & parasailing", "Dudhsagar Waterfalls jeep safari", "Mandovi River white-water rafting", "Scuba diving at Grand Island"],
    dinings: ["Goan Fish Curry lunch at Mum's Kitchen", "Seafood Dinner at Curlies Beach Shack", "Traditional Vindaloo at Florentine", "Bebinca dessert tasting at Confeitaria"],
    shoppings: ["Anjuna Wednesday Flea Market browsing", "Mapusa local Friday Bazaar exploration", "Panjim municipal market walk", "Mackie's Night Bazaar souvenir shopping"],
    culturals: ["Fontainhas Latin Quarter walking tour", "Ancestral Goan Museum visit", "Sahakari Spice Farm spice tour", "Folk dance show at Mandovi river cruise"]
  },
  agra: {
    hotelPrefixes: ["Oberoi Amarvilas", "Agra Palace Hotel", "Taj View Retreat", "Heritage Mughal Inn"],
    areas: ["Taj Ganj District", "Fatehpur Sikri Zone", "Agra Fort Heritage Belt", "Mehtab Bagh Riverside"],
    sightseeings: ["Sunrise Taj Mahal Guided Tour", "Agra Fort Mughal Palace Exploration", "Mehtab Bagh Sunset Taj View", "Fatehpur Sikri Royal Complex Tour"],
    adventures: ["Tonga Ride to Taj Mahal Gate", "Yamuna River Bank Sunset Photography", "Heritage Old Agra Street Walk"],
    dinings: ["Authentic Mughlai Biryani & Korma Feast", "Petha Dessert Tasting at Panchhi Petha", "Rooftop Taj View Dinner at Bellevue", "Bedai & Jalebi Breakfast in Old Agra"],
    shoppings: ["Parchin Kari Marble Inlay Handicrafts Shopping", "Sadur Bazaar Leather Goods Bargaining", "Agra Zardozi Embroidery Market"],
    culturals: ["Mohabbat the Taj Cultural Live Show", "Mughal Craftsmans Masterclass", "Kinari Bazaar Heritage Walk"]
  },
  shimla: {
    hotelPrefixes: ["Wildflower Hall Spa Resort", "The Oberoi Cecil", "Shimla Haveli Suites", "Cedar Ridge Retreat"],
    areas: ["Mall Road & Ridge District", "Kufri Alpine Slopes", "Mashobra Pine Forest", "Chail Palace Valley"],
    sightseeings: ["The Ridge & Christ Church Heritage Stroll", "Jakhoo Temple & Hanuman Statue Viewpoint", "Viceregal Lodge Architecture Walk", "Kufri Fun World & Valley View"],
    adventures: ["Kufri Pony Trek to Mahasu Peak", "Ice Skating at Shimla Rink", "Himalayan Forest Trail Hike", "Toy Train Scenic Ride to Summer Hill"],
    dinings: ["Himachali Dham Lunch at Cafe Simla Times", "Traditional Chana Madra at Cecil Restaurant", "Bakery Treats at Wake & Bake Cafe", "Hot Siddu & Tea at Mall Road Eatery"],
    shoppings: ["Lakkar Bazaar Wooden Handicrafts Shopping", "Mall Road Woolens & Shawls Bargaining", "Himachal Emporium Souvenir Hunt", "Lower Bazaar Local Spice Market"],
    culturals: ["Gaiety Theatre Cultural Heritage Tour", "Army Heritage Museum Visit", "State Museum Art & Artifacts Gallery", "Sunset Photography at Scandal Point"]
  },
  manali: {
    hotelPrefixes: ["Solang Valley Resort", "The Serenity Manali", "Himalayan Heights Hotel", "Old Manali Riverside Inn"],
    areas: ["Old Manali Cafe Street", "Solang Valley Snow Point", "Vashisht Hot Springs", "Naggar Castle Art Zone"],
    sightseeings: ["Hadimba Temple & Pine Forest Walk", "Naggar Castle & Roerich Art Gallery", "Vashisht Hot Water Springs Visit", "Jogini Waterfall Trek"],
    adventures: ["Solang Valley Paragliding & Zorbing", "Beas River White Water Rafting", "Rohtang Pass Snow Scooter Safari", "Atal Tunnel & Sissu Day Excursion"],
    dinings: ["Trout Fish Lunch at Johnson's Cafe", "Wood-fired Pizza at Cafe 1947", "Traditional Thukpa & Momos at Chopsticks", "Apple Cider Tasting at Local Orchards"],
    shoppings: ["Old Manali Handicrafts & Bohemian Shop Stroll", "Mall Road Kullu Shawls Shopping", "Tibetan Market Artifacts Browsing", "Fresh Apple Jam & Honey Purchase"],
    culturals: ["Tibetan Monastery Prayer Wheel Tour", "Traditional Kullu Folk Music Show", "Organic Apple Farm Walk", "Old Manali Village Heritage Trail"]
  },
  kashmir: {
    hotelPrefixes: ["Luxury Shikara Houseboat", "The Lalit Grand Palace", "Gulmarg Alpine Resort", "Pahalgam Valley View Hotel"],
    areas: ["Dal Lake Houseboat Belt", "Gulmarg Gondola Meadows", "Pahalgam Betaab Valley", "Srinagar Mughal Gardens"],
    sightseeings: ["Shikara Ride on Dal Lake at Sunset", "Mughal Gardens Shalimar & Nishat Walk", "Shankaracharya Temple Hilltop View", "Hazratbal Shrine Lakefront Visit"],
    adventures: ["Gulmarg Gondola Ride Phase 2 Snow Slopes", "Pahalgam Horse Riding in Betaab Valley", "Aru Valley Scenic Trek", "White Water Rafting on Lidder River"],
    dinings: ["Authentic 12-Course Wazwan Feast", "Rogan Josh & Sheermal at Ahdoos", "Kahwa Tea & Bakarkhani at Local Bakery", "Fresh Trout Fish Lunch in Pahalgam"],
    shoppings: ["Pashmina Shawls & Stoles Shopping", "Kashmiri Hand-Knotted Carpet Browsing", "Saffron & Dry Fruits Buying in Pampore", "Papiermâché Artifacts Hunt"],
    culturals: ["Heritage Wooden Houseboat Stay Experience", "Traditional Rabab Music Performance", "Old City Zaina Kadal Wooden Architecture Walk", "Floating Vegetable Market Dawn Boat Tour"]
  },
  paris: {
    hotelPrefixes: ["Hotel Plaza Athénée", "Le Meurice", "Montmartre Boutique Suites", "Latin Quarter Cozy Inn"],
    areas: ["Champs-Élysées District", "Montmartre Artist Quarter", "Marais Historical Center", "Seine Riverbanks"],
    sightseeings: ["Eiffel Tower Summit panoramic tour", "Arc de Triomphe historical tour", "Notre-Dame Cathedral exterior tour", "Place de la Concorde walk"],
    adventures: ["Seine River speedboat excursion", "Catacombs of Paris underground tour", "Rent a bicycle for City center exploration", "Disneyland Paris rollercoaster rides"],
    dinings: ["Croissants & Café at Cafe de Flore", "Fine Dining Dinner at Le Jules Verne", "Classic Crêpe tasting in Montparnasse", "Duck Confit dinner at a bistro in Marais"],
    shoppings: ["Rue de Rivoli fashion browsing", "Galeries Lafayette luxury shopping", "Shakespeare and Company book buying", "Vintage fashion hunt in Le Marais"],
    culturals: ["Louvre Museum masterpieces tour", "Musée d'Orsay Impressionist art tour", "Palace of Versailles garden excursion", "Sainte-Chapelle stained glass tour"]
  },
  delhi: {
    hotelPrefixes: ["The Leela Palace", "The Imperial", "Connaught Place Grand", "Karol Bagh Heritage Hotel"],
    areas: ["Connaught Place CP", "Nizamuddin & Humayun area", "Old Delhi Walled City", "Saket District"],
    sightseeings: ["Red Fort Mughal architectural tour", "Qutub Minar ancient tower tour", "India Gate War Memorial walk", "Humayun's Tomb garden tour"],
    adventures: ["Old Delhi narrow street rickshaw ride", "Rent a cycle for Lutyens Delhi early morning tour", "Rock climbing at Sanjay Van", "Aero Sports at Adventure Island"],
    dinings: ["Chole Bhature feast at Chache Di Hatti", "Mughlai Mughlai Dinner at Karim's", "Butter Chicken tasting at Moti Mahal", "Dahi Bhalla snack at Natraj Cafe"],
    shoppings: ["Chandni Chowk spice & jewelry browsing", "Khan Market premium book & fashion shopping", "Janpath traditional handicrafts bargaining", "Dilli Haat regional artisan stalls"],
    culturals: ["Akshardham Temple musical fountain show", "Lotus Temple silent meditation tour", "National Museum history walk", "Qawwali night at Nizamuddin Dargah"]
  },
  kerala: {
    hotelPrefixes: ["Munnar Tea Valley Resort", "Alleppey Luxury Houseboats", "Kovalam Cliffside Palace", "Thekkady Spice Village"],
    areas: ["Munnar Tea Garden Valleys", "Alleppey Backwaters Lagoons", "Kochi Fort Heritage Street", "Thekkady Forest Trails"],
    sightseeings: ["Fort Kochi Chinese Fishing Nets walk", "Munnar Tea Museum guided tour", "Athirappilly Waterfalls scenic view", "Bekal Fort coastline exploration"],
    adventures: ["Alleppey Kayaking in narrow canals", "Thekkady Periyar Tiger Reserve forest trek", "Munnar jeep safari to Kolukkumalai", "Bamboo rafting in Periyar Lake"],
    dinings: ["Traditional Sadhya lunch on banana leaf", "Karimeen Pollichathu seafood dinner", "Munnar tea tasting with banana fritters", "Malabar Parotta & Beef fry at local eatery"],
    shoppings: ["Kochi spice market purchasing", "Coir handicrafts shopping at Alleppey", "Aromatic oils buying in Thekkady", "Kasavu saree shopping at Trivandrum"],
    culturals: ["Kathakali dance performance at theater", "Kalaripayattu martial arts show", "Overnight stay in a traditional houseboat", "Kumarakom bird sanctuary tour"]
  },
  generic: {
    hotelPrefixes: ["Grand Vista Hotel", "Boutique Oasis Resort", "Classic Central Inn", "Metropolitan Palace"],
    areas: ["Downtown City Center", "Old Town Historic District", "Waterfront Promenade", "Scenic Mountain View"],
    sightseeings: ["Historic Cathedral architectural walk", "Central Plaza landmark landmark tour", "Panoramic Hilltop Viewpoint visit", "Botanical Conservatory tour"],
    adventures: ["Mountain hiking & nature trail trek", "Biking excursion along the riverfront", "Ziplining over the valley forests", "Kayaking tour in the scenic bay"],
    dinings: ["Traditional Breakfast at a local cafe", "Signature Lunch Feast of regional dishes", "Fine-dining Dinner with scenic sunset view", "Local dessert and pastries tasting"],
    shoppings: ["Traditional handicrafts bazaar walk", "Bustling shopping street fashion browsing", "Local souvenir market gifts shopping", "Artisan workshop crafts purchase"],
    culturals: ["National History Museum tour", "Art Gallery contemporary paintings tour", "Traditional folk music & dance concert", "Cooking masterclass with local chef"]
  }
};

function getDestinationData(city: string) {
  const lower = city.toLowerCase();
  if (lower.includes("goa")) return destinationData.goa;
  if (lower.includes("agra")) return destinationData.agra;
  if (lower.includes("shimla")) return destinationData.shimla;
  if (lower.includes("manali")) return destinationData.manali;
  if (lower.includes("kashmir") || lower.includes("srinagar") || lower.includes("gulmarg") || lower.includes("pahalgam")) return destinationData.kashmir;
  if (lower.includes("paris")) return destinationData.paris;
  if (lower.includes("delhi")) return destinationData.delhi;
  if (lower.includes("kerala") || lower.includes("munnar") || lower.includes("alleppey")) return destinationData.kerala;
  return {
    hotelPrefixes: [`${city} Grand Resort`, `${city} Palace Hotel`, `${city} Heritage Villa`, `${city} Central Suites`],
    areas: [`${city} City Center`, `${city} Historic Quarter`, `${city} Lakefront Promenade`, `${city} Scenic Valleys`],
    sightseeings: [`${city} Iconic Landmarks & City Tour`, `${city} Historic Fortress & Museum Visit`, `${city} Scenic Viewpoint & Botanical Park`],
    adventures: [`${city} Nature Trail Trekking`, `${city} Riverfront Cycling Excursion`, `${city} Panoramic Cable Car Ride`],
    dinings: [`Local Delicacies Tasting in ${city}`, `Fine Dining Dinner with ${city} Skyline Views`, `Authentic Regional Lunch at ${city} Cafe`],
    shoppings: [`${city} Traditional Bazaar & Handicrafts Stroll`, `${city} Souvenir & Local Crafts Shopping`],
    culturals: [`${city} Heritage & Cultural Walk`, `${city} Traditional Folk Performance`],
  };
}

export function generateMockTrip(request: TripRequest): GeneratedTrip {
  const startDate = new Date(request.startDate);
  const endDate = new Date(request.endDate);
  const days = Math.max(
    1,
    Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
  );

  // Parse destinations list cleanly
  const destList = request.destination.split(",").map((d) => d.trim()).filter(Boolean);
  if (destList.length === 0) destList.push("Custom Destination");
  const isMultiCity = destList.length > 1;

  // Build day-to-city map using smart allocator
  const dayCityMap = buildDayCityMap(days, destList);

  const pref = (request.transportPreference || "Flight").toLowerCase();
  let defaultTransportType = "FLIGHT";
  if (pref.includes("train")) defaultTransportType = "TRAIN";
  else if (pref.includes("bus")) defaultTransportType = "BUS";
  else if (pref.includes("car") || pref.includes("drive")) defaultTransportType = "CAR";

  const totalBudget = request.budget;
  const costBreakdown = {
    accommodation: Math.round(totalBudget * 0.35),
    transport: Math.round(totalBudget * 0.25),
    activities: Math.round(totalBudget * 0.20),
    food: Math.round(totalBudget * 0.12),
    miscellaneous: Math.round(totalBudget * 0.08),
  };
  const totalEstimatedCost = Object.values(costBreakdown).reduce((a, b) => a + b, 0);

  const tips = [
    `Carry some cash in local currency (${request.currency}) for minor market transactions in ${destList[0]}.`,
    "Check visa requirements and keep digital copies of essential travel papers on your phone.",
    "Download offline maps of the area to navigate seamlessly without cellular network.",
    "Try traditional delicacies in hygienic local eateries to experience the culture.",
    `Dress comfortably in layers appropriate for weather in ${destList.join(", ")}.`
  ];

  const dailyItinerary: GeneratedDay[] = [];
  const pricePerNight = Math.round(costBreakdown.accommodation / days);

  // Track hotels per city
  const cityHotelMap: Record<string, { name: string; area: string }> = {};

  for (let i = 1; i <= days; i++) {
    const isFirstDay = i === 1;
    const isLastDay = i === days;
    const currentCity = dayCityMap[i - 1];
    const prevCity = i > 1 ? dayCityMap[i - 2] : null;
    const isCityTransferDay = !isFirstDay && currentCity !== prevCity;

    // Get city destination data
    const destObj = getDestinationData(currentCity);

    if (!cityHotelMap[currentCity]) {
      const hPrefix = destObj.hotelPrefixes[Math.floor(Math.random() * destObj.hotelPrefixes.length)];
      cityHotelMap[currentCity] = {
        name: `${hPrefix} (${request.travelStyle})`,
        area: destObj.areas[0],
      };
    }
    const currentHotel = cityHotelMap[currentCity];

    const dayActivities = [];

    const sightIndex1 = (i * 2 - 2) % destObj.sightseeings.length;
    const sightIndex2 = (i * 2 - 1) % destObj.sightseeings.length;
    const advIndex = (i - 1) % destObj.adventures.length;
    const dineIndex1 = (i * 2 - 2) % destObj.dinings.length;
    const dineIndex2 = (i * 2 - 1) % destObj.dinings.length;

    if (isFirstDay) {
      dayActivities.push({
        time: "10:00 AM",
        title: `Arrival in ${currentCity}`,
        description: `Land in ${currentCity}, meet your driver, and enjoy a smooth transfer to your hotel.`,
        location: `${currentCity} Terminal / Station`,
        duration: "1.5 hours",
        type: "TRANSPORTATION",
        estimatedCost: Math.round(costBreakdown.transport / days / 2),
      });
      dayActivities.push({
        time: "12:00 PM",
        title: `Check-in at ${currentHotel.name}`,
        description: `Complete registration, unpack bags, and freshen up at ${currentHotel.name}.`,
        location: `${currentHotel.area}, ${currentCity}`,
        duration: "1 hour",
        type: "CHECK_IN",
        estimatedCost: 0,
      });
      dayActivities.push({
        time: "02:00 PM",
        title: destObj.dinings[dineIndex1],
        description: `Savor your first delicious regional meal of the trip in ${currentCity}.`,
        location: destObj.areas[0],
        duration: "1.5 hours",
        type: "DINING",
        estimatedCost: Math.round(costBreakdown.food / days / 2),
      });
      dayActivities.push({
        time: "04:30 PM",
        title: destObj.sightseeings[sightIndex1],
        description: `Take a relaxing introductory walk around key ${currentCity} landmarks.`,
        location: destObj.areas[0],
        duration: "2 hours",
        type: "SIGHTSEEING",
        estimatedCost: Math.round(costBreakdown.activities / days / 2),
      });
    } else if (isLastDay) {
      // Check if last day ALSO happens to be a city transfer day (e.g. 2 cities in 2 days)
      if (isCityTransferDay) {
        dayActivities.push({
          time: "08:30 AM",
          title: `Intercity Transfer: ${prevCity} → ${currentCity}`,
          description: `Check out from ${prevCity} stay and travel to ${currentCity} via scenic ${request.transportPreference} route.`,
          location: `${prevCity} to ${currentCity} Transit`,
          duration: "2.5 hours",
          type: "TRANSPORTATION",
          estimatedCost: Math.round(costBreakdown.transport / days),
        });
        dayActivities.push({
          time: "11:30 AM",
          title: `Check-in & Exploration in ${currentCity}`,
          description: `Arrive in ${currentCity}, check in at ${currentHotel.name}, and start exploring.`,
          location: `${currentHotel.area}, ${currentCity}`,
          duration: "1 hour",
          type: "CHECK_IN",
          estimatedCost: 0,
        });
        dayActivities.push({
          time: "01:00 PM",
          title: destObj.dinings[dineIndex1],
          description: `Savor iconic local delicacies for lunch in ${currentCity}.`,
          location: destObj.areas[0],
          duration: "1.5 hours",
          type: "DINING",
          estimatedCost: Math.round(costBreakdown.food / days / 2),
        });
        dayActivities.push({
          time: "03:00 PM",
          title: destObj.sightseeings[sightIndex1],
          description: `Explore the top iconic landmark of ${currentCity}.`,
          location: destObj.areas[0],
          duration: "2 hours",
          type: "SIGHTSEEING",
          estimatedCost: Math.round(costBreakdown.activities / days / 2),
        });
        dayActivities.push({
          time: "05:30 PM",
          title: `Departure Transfer from ${currentCity}`,
          description: `Cab transfer to the terminal for your journey back home.`,
          location: `${currentCity} Departure Terminal`,
          duration: "1.5 hours",
          type: "TRANSPORTATION",
          estimatedCost: Math.round(costBreakdown.transport / days / 2),
        });
      } else {
        // Standard last day in current city
        dayActivities.push({
          time: "09:00 AM",
          title: `Farewell Checkout from ${currentHotel.name}`,
          description: `Enjoy breakfast and complete checkout formalities at ${currentHotel.name}.`,
          location: `${currentHotel.area}, ${currentCity}`,
          duration: "1.5 hours",
          type: "CHECK_OUT",
          estimatedCost: 0,
        });
        dayActivities.push({
          time: "11:00 AM",
          title: destObj.shoppings[0],
          description: `Do final shopping for souvenirs, spices, and gifts in ${currentCity}.`,
          location: destObj.areas[1 % destObj.areas.length],
          duration: "2 hours",
          type: "SHOPPING",
          estimatedCost: Math.round(costBreakdown.activities / days / 2),
        });
        dayActivities.push({
          time: "01:30 PM",
          title: destObj.dinings[dineIndex2],
          description: `Indulge in a final delicious lunch before departure.`,
          location: destObj.areas[1 % destObj.areas.length],
          duration: "1.5 hours",
          type: "DINING",
          estimatedCost: Math.round(costBreakdown.food / days / 2),
        });
        dayActivities.push({
          time: "04:00 PM",
          title: `Departure Transfer from ${currentCity}`,
          description: `Cab transfer to the terminal for your journey back home.`,
          location: `${currentCity} Departure Terminal`,
          duration: "1.5 hours",
          type: "TRANSPORTATION",
          estimatedCost: Math.round(costBreakdown.transport / days / 2),
        });
      }
    } else if (isCityTransferDay) {
      dayActivities.push({
        time: "08:30 AM",
        title: `Intercity Transfer: ${prevCity} → ${currentCity}`,
        description: `Check out from ${prevCity} stay and travel to ${currentCity} via scenic ${request.transportPreference} route.`,
        location: `${prevCity} to ${currentCity} Transit`,
        duration: "3 hours",
        type: "TRANSPORTATION",
        estimatedCost: Math.round(costBreakdown.transport / days),
      });
      dayActivities.push({
        time: "12:00 PM",
        title: `Hotel Check-in in ${currentCity}`,
        description: `Check in at ${currentHotel.name} in ${currentCity} and unpack.`,
        location: `${currentHotel.area}, ${currentCity}`,
        duration: "1 hour",
        type: "CHECK_IN",
        estimatedCost: 0,
      });
      dayActivities.push({
        time: "01:30 PM",
        title: destObj.dinings[dineIndex1],
        description: `Enjoy authentic ${currentCity} local delicacies for lunch.`,
        location: destObj.areas[0],
        duration: "1.5 hours",
        type: "DINING",
        estimatedCost: Math.round(costBreakdown.food / days / 2),
      });
      dayActivities.push({
        time: "03:30 PM",
        title: destObj.sightseeings[sightIndex1],
        description: `Explore local attractions in ${currentCity}.`,
        location: destObj.areas[0],
        duration: "2.5 hours",
        type: "SIGHTSEEING",
        estimatedCost: Math.round(costBreakdown.activities / days / 2),
      });
      dayActivities.push({
        time: "07:00 PM",
        title: `Evening Sunset Walk & Dinner in ${currentCity}`,
        description: `Watch the sunset in ${currentCity}, followed by a warm dinner.`,
        location: destObj.areas[0],
        duration: "2 hours",
        type: "DINING",
        estimatedCost: Math.round(costBreakdown.food / days / 2),
      });
    } else {
      // Middle days within same city
      if (i % 2 === 0) {
        dayActivities.push({
          time: "09:00 AM",
          title: destObj.adventures[advIndex],
          description: `Participate in outdoor adventure activities in ${currentCity}.`,
          location: destObj.areas[i % destObj.areas.length],
          duration: "3 hours",
          type: "ADVENTURE",
          estimatedCost: Math.round(costBreakdown.activities / days / 2),
        });
        dayActivities.push({
          time: "01:00 PM",
          title: destObj.dinings[dineIndex1],
          description: `Relish traditional delicacies at a handpicked ${currentCity} restaurant.`,
          location: destObj.areas[i % destObj.areas.length],
          duration: "1.5 hours",
          type: "DINING",
          estimatedCost: Math.round(costBreakdown.food / days / 2),
        });
        dayActivities.push({
          time: "03:30 PM",
          title: destObj.sightseeings[sightIndex2],
          description: `Visit historic landmarks and sights in ${currentCity}.`,
          location: destObj.areas[i % destObj.areas.length],
          duration: "2 hours",
          type: "SIGHTSEEING",
          estimatedCost: Math.round(costBreakdown.activities / days / 2),
        });
        dayActivities.push({
          time: "07:00 PM",
          title: `Evening Walk & Dinner in ${currentCity}`,
          description: `Watch the sunset in ${currentCity}, followed by dinner.`,
          location: destObj.areas[i % destObj.areas.length],
          duration: "2.5 hours",
          type: "DINING",
          estimatedCost: Math.round(costBreakdown.food / days / 2),
        });
      } else {
        dayActivities.push({
          time: "09:30 AM",
          title: destObj.sightseeings[sightIndex1],
          description: `Explore iconic heritage spots in ${currentCity}.`,
          location: destObj.areas[i % destObj.areas.length],
          duration: "2.5 hours",
          type: "SIGHTSEEING",
          estimatedCost: Math.round(costBreakdown.activities / days / 2),
        });
        dayActivities.push({
          time: "01:00 PM",
          title: `Regional ${currentCity} Lunch`,
          description: `Enjoy typical homestyle dishes and refreshing local drinks.`,
          location: destObj.areas[i % destObj.areas.length],
          duration: "1 hour",
          type: "DINING",
          estimatedCost: Math.round(costBreakdown.food / days / 2),
        });
        dayActivities.push({
          time: "03:00 PM",
          title: destObj.culturals[0],
          description: `Learn about historical facts and watch a traditional art performance.`,
          location: destObj.areas[i % destObj.areas.length],
          duration: "2 hours",
          type: "CULTURAL",
          estimatedCost: Math.round(costBreakdown.activities / days / 2),
        });
        dayActivities.push({
          time: "06:00 PM",
          title: `${currentCity} Market Stroll`,
          description: `Bargain for local crafts, fabrics, and handmade souvenirs.`,
          location: destObj.areas[i % destObj.areas.length],
          duration: "2 hours",
          type: "SHOPPING",
          estimatedCost: 0,
        });
      }
    }

    const dayTitle = isFirstDay
      ? `Day 1: ${currentCity} - Arrival & Orientation`
      : isCityTransferDay
      ? `Day ${i}: ${prevCity} → ${currentCity} Journey & Sights`
      : isLastDay
      ? `Day ${i}: ${currentCity} - Souvenir Hunting & Departure`
      : `Day ${i}: ${currentCity} - Sights & Flavors`;

    dailyItinerary.push({
      dayNumber: i,
      title: dayTitle,
      description: `Explore the unique attractions, local food, and sights of ${currentCity}.`,
      activities: dayActivities,
      hotel: isLastDay ? null : {
        name: currentHotel.name,
        area: currentHotel.area,
        pricePerNight,
        rating: 4.6,
      },
      transport: isFirstDay ? {
        type: defaultTransportType,
        from: "Home Terminal",
        to: currentHotel.name,
        cost: Math.round(costBreakdown.transport / days / 2),
        duration: "45 mins",
      } : isCityTransferDay ? {
        type: defaultTransportType,
        from: prevCity || "Previous Stop",
        to: currentCity,
        cost: Math.round(costBreakdown.transport / days),
        duration: "3 hours",
      } : isLastDay ? {
        type: defaultTransportType,
        from: `${currentCity} Center`,
        to: "Home Terminal",
        cost: Math.round(costBreakdown.transport / days / 2),
        duration: "1.5 hours",
      } : null,
    });
  }

  const tripTitle = isMultiCity
    ? `${destList[0]} to ${destList[destList.length - 1]} Grand Odyssey: Multi-City Journey`
    : `Sunkissed ${destList[0]}: Sights, Flavors & Coastal Trails`;

  const tripSummary = isMultiCity
    ? `Embark on a magnificent ${days}-day journey across ${destList.join(" → ")}. Experience the distinct heritage, local cuisine, and iconic landmarks of each stop with ${request.travelers} traveler(s).`
    : `Immerse yourself in a handpicked ${days}-day journey across ${destList[0]}. Discover iconic monuments, sample authentic local food, and enjoy boutique stays tailored for ${request.travelers} traveler(s).`;

  return {
    title: tripTitle,
    summary: tripSummary,
    totalEstimatedCost,
    costBreakdown,
    tips,
    itinerary: dailyItinerary,
  };
}
