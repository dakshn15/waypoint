import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { generateTrip, type TripRequest } from "@/lib/ai";
import { headers } from "next/headers";

export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json(
        { error: "You must be logged in to generate a trip." },
        { status: 401 }
      );
    }

    const body = await req.json();

    const {
      destination,
      destinations,
      startDate,
      endDate,
      travelers,
      budget,
      currency = "INR",
      travelStyle = "STANDARD",
      interests = [],
      stayPreference = "Hotel",
      transportPreference = "Flight",
    } = body;

    // Build canonical destination string from either destinations array or single string
    const destArray: string[] = Array.isArray(destinations) && destinations.length > 0
      ? destinations
      : destination ? [destination.trim()] : [];
    const destString = destArray.join(", ");

    // Validate required fields
    if (destArray.length === 0 || !startDate || !endDate || !budget) {
      return NextResponse.json(
        { error: "Missing required fields: destination(s), startDate, endDate, budget" },
        { status: 400 }
      );
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return NextResponse.json(
        { error: "Invalid date format provided." },
        { status: 400 }
      );
    }

    if (end <= start) {
      return NextResponse.json(
        { error: "Return/End date must be after Departure/Start date." },
        { status: 400 }
      );
    }

    const days = Math.max(
      1,
      Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1
    );

    if (days > 30) {
      return NextResponse.json(
        { error: "Trip duration cannot exceed 30 days for AI generation." },
        { status: 400 }
      );
    }

    const numTravelers = parseInt(travelers) || 1;
    if (numTravelers < 1) {
      return NextResponse.json(
        { error: "Number of travelers must be at least 1." },
        { status: 400 }
      );
    }

    const numBudget = parseFloat(budget);
    if (isNaN(numBudget) || numBudget <= 0) {
      return NextResponse.json(
        { error: "Please provide a valid budget amount." },
        { status: 400 }
      );
    }

    // Absolute minimum threshold check (₹500 per person per day)
    const minViableBudget = days * numTravelers * 500;
    if (numBudget < minViableBudget) {
      return NextResponse.json(
        { 
          error: `Your budget of ${currency} ${numBudget.toLocaleString()} is too low for a ${days}-day trip for ${numTravelers} traveler(s). Minimum viable budget is ${currency} ${minViableBudget.toLocaleString()}.` 
        },
        { status: 400 }
      );
    }

    // Build request payload for AI planner
    const tripRequest: TripRequest = {
      destination: destString,
      startDate,
      endDate,
      travelers: numTravelers,
      budget: numBudget,
      currency,
      travelStyle,
      interests: Array.isArray(interests) ? interests : [],
      stayPreference: stayPreference || "Hotel",
      transportPreference: transportPreference || "Flight",
    };

    // Generate the trip using Gemini AI
    const generatedTrip = await generateTrip(tripRequest);

    // Save trip to database
    const trip = await prisma.trip.create({
      data: {
        userId: session.user.id,
        title: generatedTrip.title,
        status: "GENERATED",
        destinations: destArray.map((name) => ({ name, country: "" })),
        startDate: start,
        endDate: end,
        travelers: tripRequest.travelers,
        budget: tripRequest.budget,
        currency: tripRequest.currency,
        travelStyle: tripRequest.travelStyle as any,
        interests: tripRequest.interests,
        stayPreference: tripRequest.stayPreference,
        transportPref: tripRequest.transportPreference,
        aiResponse: generatedTrip as any,
        costBreakdown: generatedTrip.costBreakdown as any,
        itineraries: {
          create: generatedTrip.itinerary.map((day) => ({
            dayNumber: day.dayNumber,
            title: day.title,
            description: day.description || "",
            activities: {
              create: day.activities.map((act) => ({
                title: act.title,
                description: act.description,
                time: act.time,
                duration: act.duration,
                location: act.location,
                cost: act.estimatedCost || 0,
                type: act.type as any,
              })),
            },
            ...(day.hotel
              ? {
                  hotel: {
                    create: {
                      name: day.hotel.name,
                      address: day.hotel.area,
                      rating: day.hotel.rating,
                      pricePerNight: day.hotel.pricePerNight,
                    },
                  },
                }
              : {}),
            ...(day.transport
              ? {
                  transport: {
                    create: {
                      type: day.transport.type as any,
                      from: day.transport.from,
                      to: day.transport.to,
                      cost: day.transport.cost,
                      departureTime: null,
                      arrivalTime: null,
                    },
                  },
                }
              : {}),
          })),
        },
      },
    });

    return NextResponse.json({
      success: true,
      tripId: trip.id,
      trip: generatedTrip,
    });
  } catch (error: any) {
    console.error("[TRIP_GENERATE_ERROR]", error);

    // Handle JSON parse errors from AI response
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: "AI generated an invalid response. Please try again." },
        { status: 502 }
      );
    }

    return NextResponse.json(
      { error: error.message || "Failed to generate trip. Please try again." },
      { status: 500 }
    );
  }
}
