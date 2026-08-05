import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import LandingClient from "./landing-client";

export default async function LandingPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  return <LandingClient userSession={session} />;
}
