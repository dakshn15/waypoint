import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export const geminiModel = genAI.getGenerativeModel({
  model: "gemini-2.0-flash",
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

export function buildTripPrompt(request: TripRequest): string {
  const startDate = new Date(request.startDate);
  const endDate = new Date(request.endDate);
  const days = Math.max(
    1,
    Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
  );

  const perPersonPerDayBudget = Math.round(request.budget / (days * request.travelers));

  return `You are an elite travel concierge and travel planner. Create a highly realistic, detailed ${days}-day travel itinerary tailored to the following specifications:

**Destination:** ${request.destination}
**Travel Dates:** ${request.startDate} to ${request.endDate} (${days} days, ${days - 1} nights)
**Travelers:** ${request.travelers} person(s)
**Total Budget:** ${request.currency} ${request.budget.toLocaleString()} (${request.currency} ${perPersonPerDayBudget.toLocaleString()} per person/day for ALL expenses)
**Travel Style:** ${request.travelStyle}
**Interests:** ${request.interests.join(", ") || "General sightseeing, culture, local dining"}
**Stay Preference:** ${request.stayPreference}
**Transport Preference:** ${request.transportPreference}

### Budget & Feasibility Directives:
1. **Realistic Allocation:** Allocate ~35% accommodation, ~25% transport, ~20% activities, ~15% food/dining, ~5% misc.
2. **Style Alignment:** 
   - If Travel Style is LUXURY/PREMIUM: Recommend 5-star / 4-star hotels, gourmet dining, private transfers, and top-tier experiences.
   - If Travel Style is BUDGET/STANDARD: Recommend clean boutique hotels, hostels, authentic local eateries, and efficient public/private transport.
3. **If Budget is Tight:** Adapt the itinerary dynamically to match ${request.currency} ${request.budget.toLocaleString()}. Prioritize free landmarks, local markets, street food, and budget-friendly stays. Add a practical budget tip in the "tips" array.

Generate a COMPLETE day-by-day itinerary. Respond ONLY with valid JSON (no markdown block, no code fence, no commentary) in this exact JSON schema:

{
  "title": "Evocative, catchy title for the trip",
  "summary": "2-3 sentence engaging overview highlighting key experiences",
  "totalEstimatedCost": <number in ${request.currency}>,
  "costBreakdown": {
    "accommodation": <number>,
    "transport": <number>,
    "activities": <number>,
    "food": <number>,
    "miscellaneous": <number>
  },
  "tips": ["Destination-specific tip 1", "Budget tip 2", "Local transport tip 3", "Culture tip 4", "Packing tip 5"],
  "itinerary": [
    {
      "dayNumber": 1,
      "title": "Day theme / title",
      "description": "Brief summary of the day's focus",
      "activities": [
        {
          "time": "09:00 AM",
          "title": "Specific activity name",
          "description": "Detailed description of experience",
          "location": "Specific location or area in ${request.destination}",
          "duration": "2 hours",
          "type": "SIGHTSEEING",
          "estimatedCost": <number>
        }
      ],
      "hotel": {
        "name": "Specific hotel/resort name matching ${request.travelStyle}",
        "area": "Neighborhood / district in ${request.destination}",
        "pricePerNight": <number>,
        "rating": 4.5
      },
      "transport": {
        "type": "FLIGHT",
        "from": "Origin / Station",
        "to": "Hotel / Destination",
        "cost": <number>,
        "duration": "2 hours"
      }
    }
  ]
}

Rules:
- Each day must contain 3 to 5 realistic, chronological activities with realistic times (e.g. 09:00 AM, 01:00 PM, 04:30 PM, 07:30 PM).
- Allowed Activity Types: SIGHTSEEING, ADVENTURE, DINING, SHOPPING, RELAXATION, CULTURAL, TRANSPORTATION, CHECK_IN, CHECK_OUT
- Allowed Transport Types: FLIGHT, TRAIN, BUS, CAR, FERRY, WALK
- All costs must be in ${request.currency}.
- Set "transport" to null on middle days without intercity transfers.
- Set "hotel" to null on the final departure day.`;
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

    const parsed: GeneratedTrip = JSON.parse(cleaned);
    return parsed;
  } catch (error) {
    console.error("[AI] Error generating trip with Gemini API. Falling back to local mock generator.", error);
    return generateMockTrip(request);
  }
}

// ==========================================
// Offline Mock AI Generators (Quota Fallback)
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

export function generateMockTrip(request: TripRequest): GeneratedTrip {
  const startDate = new Date(request.startDate);
  const endDate = new Date(request.endDate);
  const days = Math.max(
    1,
    Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
  );

  const destKey = request.destination.toLowerCase().includes("goa") ? "goa"
    : request.destination.toLowerCase().includes("paris") ? "paris"
    : request.destination.toLowerCase().includes("delhi") ? "delhi"
    : (request.destination.toLowerCase().includes("kerala") || request.destination.toLowerCase().includes("munnar") || request.destination.toLowerCase().includes("alleppey")) ? "kerala"
    : "generic";

  const destObj = destinationData[destKey];
  const hotelName = `${destObj.hotelPrefixes[Math.floor(Math.random() * destObj.hotelPrefixes.length)]} (${request.travelStyle})`;
  const hotelArea = destObj.areas[0];

  const pref = (request.transportPreference || "Flight").toLowerCase();
  
  let arrivalTitle = `Arrival in ${request.destination}`;
  let arrivalDesc = `Land in the city, meet the airport transfers, and enjoy a scenic drive to the hotel.`;
  let arrivalLoc = `${request.destination} Airport`;
  let arrivalHub = "Airport/Terminal";
  let arrivalType = "FLIGHT";

  let departureTitle = "Airport Departure Transfer";
  let departureDesc = `Cab transfer to the airport terminal for your flight back home.`;
  let departureLoc = `${request.destination} Airport Terminal`;

  if (pref.includes("train")) {
    arrivalTitle = `Arrival at ${request.destination} Station`;
    arrivalDesc = `Arrive at the railway station, meet your driver, and transfer to the hotel.`;
    arrivalLoc = `${request.destination} Railway Station`;
    arrivalHub = "Railway Station";
    arrivalType = "TRAIN";
    
    departureTitle = "Railway Station Transfer";
    departureDesc = `Cab transfer to the railway station for your train journey back home.`;
    departureLoc = `${request.destination} Railway Station`;
  } else if (pref.includes("bus")) {
    arrivalTitle = `Arrival at ${request.destination} Bus Stand`;
    arrivalDesc = `Arrive at the bus terminal, find your taxi, and transfer to your hotel.`;
    arrivalLoc = `${request.destination} Bus Terminal`;
    arrivalHub = "Bus Stand";
    arrivalType = "BUS";
    
    departureTitle = "Bus Stand Transfer";
    departureDesc = `Cab transfer to the bus station for your journey back home.`;
    departureLoc = `${request.destination} Bus Terminal`;
  } else if (pref.includes("drive") || pref.includes("car")) {
    arrivalTitle = `Road Trip Arrival in ${request.destination}`;
    arrivalDesc = `Drive into the city, check in at the hotel parking lobby, and unpack.`;
    arrivalLoc = `${request.destination} Hotel Parking`;
    arrivalHub = "City Entry Point";
    arrivalType = "CAR";
    
    departureTitle = "Scenic Drive Home";
    departureDesc = `Pack up your vehicle and begin your road trip back home.`;
    departureLoc = `${request.destination} Highway Exit`;
  }

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
    `Carry some cash in local currency (${request.currency}) for minor market transactions.`,
    "Check visa requirements and keep digital copies of essential travel papers on your phone.",
    "Download offline maps of the area to navigate seamlessly without cellular network.",
    "Try traditional delicacies in hygienic local eateries to experience the culture.",
    `Dress comfortably in layers appropriate for weather in ${request.destination}.`
  ];

  const dailyItinerary: GeneratedDay[] = [];
  const pricePerNight = Math.round(costBreakdown.accommodation / days);

  for (let i = 1; i <= days; i++) {
    const isFirstDay = i === 1;
    const isLastDay = i === days;
    const dayActivities = [];

    // Select dynamic activities based on day index, avoiding duplicates
    const sightIndex1 = (i * 2 - 2) % destObj.sightseeings.length;
    const sightIndex2 = (i * 2 - 1) % destObj.sightseeings.length;
    const advIndex = (i - 1) % destObj.adventures.length;
    const dineIndex1 = (i * 2 - 2) % destObj.dinings.length;
    const dineIndex2 = (i * 2 - 1) % destObj.dinings.length;
    const shopIndex = (i - 1) % destObj.shoppings.length;
    const cultIndex = (i - 1) % destObj.culturals.length;

    if (isFirstDay) {
      dayActivities.push({
        time: "10:00 AM",
        title: arrivalTitle,
        description: arrivalDesc,
        location: arrivalLoc,
        duration: "1.5 hours",
        type: "TRANSPORTATION",
        estimatedCost: Math.round(costBreakdown.transport / days / 2),
      });
      dayActivities.push({
        time: "12:00 PM",
        title: "Hotel Check-in & Rest",
        description: `Complete registration, unpack bags, and freshen up at ${hotelName}.`,
        location: hotelName,
        duration: "1 hour",
        type: "CHECK_IN",
        estimatedCost: 0,
      });
      dayActivities.push({
        time: "02:00 PM",
        title: destObj.dinings[dineIndex1],
        description: `Savor your first delicious regional meal of the trip at a popular neighborhood spot.`,
        location: destObj.areas[0],
        duration: "1.5 hours",
        type: "DINING",
        estimatedCost: Math.round(costBreakdown.food / days / 2),
      });
      dayActivities.push({
        time: "04:30 PM",
        title: destObj.sightseeings[sightIndex1],
        description: `Take a relaxing introductory walk around key city squares and capture great photos.`,
        location: destObj.areas[0],
        duration: "2 hours",
        type: "SIGHTSEEING",
        estimatedCost: Math.round(costBreakdown.activities / days / 2),
      });
    } else if (isLastDay) {
      dayActivities.push({
        time: "09:00 AM",
        title: "Farewell Breakfast & Checkout",
        description: `Enjoy a lazy breakfast and pack up. Complete checkout formalities at ${hotelName}.`,
        location: hotelName,
        duration: "1.5 hours",
        type: "CHECK_OUT",
        estimatedCost: 0,
      });
      dayActivities.push({
        time: "11:00 AM",
        title: destObj.shoppings[shopIndex],
        description: `Do final shopping for souvenirs, spices, crafts, and gifts to take back home.`,
        location: destObj.areas[1 % destObj.areas.length],
        duration: "2 hours",
        type: "SHOPPING",
        estimatedCost: Math.round(costBreakdown.activities / days / 2),
      });
      dayActivities.push({
        time: "01:30 PM",
        title: destObj.dinings[dineIndex2],
        description: `Indulge in a final delicious lunch, recollecting the best moments of the trip.`,
        location: destObj.areas[1 % destObj.areas.length],
        duration: "1.5 hours",
        type: "DINING",
        estimatedCost: Math.round(costBreakdown.food / days / 2),
      });
      dayActivities.push({
        time: "04:00 PM",
        title: departureTitle,
        description: departureDesc,
        location: departureLoc,
        duration: "1.5 hours",
        type: "TRANSPORTATION",
        estimatedCost: Math.round(costBreakdown.transport / days / 2),
      });
    } else {
      // Middle days: dynamic sightseeing, adventures, cultural experiences, dining
      if (i % 2 === 0) {
        dayActivities.push({
          time: "09:00 AM",
          title: destObj.adventures[advIndex],
          description: `Participate in a thrilling outdoor adventure activity customized for this region.`,
          location: destObj.areas[i % destObj.areas.length],
          duration: "3 hours",
          type: "ADVENTURE",
          estimatedCost: Math.round(costBreakdown.activities / days / 2),
        });
        dayActivities.push({
          time: "01:00 PM",
          title: destObj.dinings[dineIndex1],
          description: `Relish traditional delicacies at a handpicked local restaurant.`,
          location: destObj.areas[i % destObj.areas.length],
          duration: "1.5 hours",
          type: "DINING",
          estimatedCost: Math.round(costBreakdown.food / days / 2),
        });
        dayActivities.push({
          time: "03:30 PM",
          title: destObj.sightseeings[sightIndex2],
          description: `Visit historic landmarks, museums, or botanical sites.`,
          location: destObj.areas[i % destObj.areas.length],
          duration: "2 hours",
          type: "SIGHTSEEING",
          estimatedCost: Math.round(costBreakdown.activities / days / 2),
        });
        dayActivities.push({
          time: "07:00 PM",
          title: "Evening Sunset Walk & Dinner",
          description: `Watch the sunset from a popular viewpoint, followed by a warm dinner.`,
          location: destObj.areas[i % destObj.areas.length],
          duration: "2.5 hours",
          type: "DINING",
          estimatedCost: Math.round(costBreakdown.food / days / 2),
        });
      } else {
        dayActivities.push({
          time: "09:30 AM",
          title: destObj.sightseeings[sightIndex1],
          description: `Explore landmark heritage spots with architectural marvels.`,
          location: destObj.areas[i % destObj.areas.length],
          duration: "2.5 hours",
          type: "SIGHTSEEING",
          estimatedCost: Math.round(costBreakdown.activities / days / 2),
        });
        dayActivities.push({
          time: "01:00 PM",
          title: "Regional Lunch",
          description: `Enjoy typical homestyle dishes and refreshing local juices.`,
          location: destObj.areas[i % destObj.areas.length],
          duration: "1 hour",
          type: "DINING",
          estimatedCost: Math.round(costBreakdown.food / days / 2),
        });
        dayActivities.push({
          time: "03:00 PM",
          title: destObj.culturals[cultIndex],
          description: `Learn about historical facts and watch a traditional art performance.`,
          location: destObj.areas[i % destObj.areas.length],
          duration: "2 hours",
          type: "CULTURAL",
          estimatedCost: Math.round(costBreakdown.activities / days / 2),
        });
        dayActivities.push({
          time: "06:00 PM",
          title: "Leisure Market Stroll",
          description: `Bargain for local crafts, fabrics, and handmade jewelry in local stalls.`,
          location: destObj.areas[i % destObj.areas.length],
          duration: "2 hours",
          type: "SHOPPING",
          estimatedCost: 0,
        });
      }
    }

    const dayTitles = [
      "Arrival & Initial Exploration",
      `Discovering ${request.destination}'s Scenic Sights`,
      `Thrilling Adventures & Activities`,
      `Cultural Highlights & Traditional Cuisine`,
      `Local Artistry & Hidden Gems`,
      `Coastal Walks & Sunset Views`,
      `Final Souvenir Shopping & Departure`
    ];

    const dayTitle = dayTitles[Math.min(i - 1, dayTitles.length - 1)];

    dailyItinerary.push({
      dayNumber: i,
      title: isFirstDay ? "Welcome & Orientation Tour" : isLastDay ? "Farewell & Souvenirs shopping" : `${dayTitle}`,
      description: `A day filled with unique attractions, local food tasting, and beautiful views of ${request.destination}.`,
      activities: dayActivities,
      hotel: isLastDay ? null : {
        name: hotelName,
        area: hotelArea,
        pricePerNight,
        rating: 4.6,
      },
      transport: isFirstDay ? {
        type: arrivalType,
        from: arrivalHub,
        to: hotelName,
        cost: Math.round(costBreakdown.transport / days / 2),
        duration: "45 mins",
      } : null,
    });
  }

  return {
    title: `${request.travelStyle} Adventure in ${request.destination}`,
    summary: `A carefully designed ${days}-day ${request.travelStyle.toLowerCase()} itinerary in ${request.destination} covering rich sightseeing spots, local food tasting, and boutique hotel accommodations for ${request.travelers} traveler(s).`,
    totalEstimatedCost,
    costBreakdown,
    tips,
    itinerary: dailyItinerary,
  };
}
