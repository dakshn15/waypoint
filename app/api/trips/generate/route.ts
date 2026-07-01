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

    // Validate required fields
    if (!destination || !startDate || !endDate || !budget) {
      return NextResponse.json(
        { error: "Missing required fields: destination, startDate, endDate, budget" },
        { status: 400 }
      );
    }

    // Build request payload for AI planner
    const tripRequest: TripRequest = {
      destination,
      startDate,
      endDate,
      travelers: parseInt(travelers) || 2,
      budget: parseFloat(budget),
      currency,
      travelStyle,
      interests,
      stayPreference,
      transportPreference,
    };

    // Generate the trip using Gemini AI
    const generatedTrip = await generateTrip(tripRequest);

    // Calculate days
    const start = new Date(startDate);
    const end = new Date(endDate);
    const days = Math.max(
      1,
      Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
    );

    // Save trip to database
    const trip = await prisma.trip.create({
      data: {
        userId: session.user.id,
        title: generatedTrip.title,
        status: "GENERATED",
        destinations: [{ name: destination, country: "" }],
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
