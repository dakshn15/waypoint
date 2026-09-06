import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "./db";
import { sendEmail, passwordResetEmail } from "./email";

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
    async sendResetPassword({ user, url }) {
      const template = passwordResetEmail({
        userName: user.name,
        resetUrl: url,
      });

      await sendEmail({
        to: user.email,
        subject: template.subject,
        html: template.html,
      });
    },
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
        input: false,
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
        before: async (user) => {
          // Role fields are server-owned. Public registration always starts as
          // a traveler; the authenticated agency-upgrade action creates an
          // agency owner explicitly after sign-up.
          return { data: { ...user, role: "TRAVELER" } };
        },
      },
    },
  },
});
