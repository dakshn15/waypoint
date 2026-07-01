import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "./db";

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    },
  },
  user: {
    additionalFields: {
      role: {
        type: "string",
        required: false,
        defaultValue: "TRAVELER",
      },
      phone: {
        type: "string",
        required: false,
      },
    },
  },
  databaseHooks: {
    user: {
      create: {
        after: async (user) => {
          if (user.role === "AGENCY") {
            const baseSlug = user.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
            await prisma.agency.create({
              data: {
                name: user.name,
                slug: `${baseSlug}-${user.id.substring(0, 5)}`,
                ownerId: user.id,
                email: user.email,
              },
            });
          }
        },
      },
    },
  },
});
