import { redirect } from "next/navigation";

export default async function AnalyticsRedirectPage() {
  redirect("/dashboard");
}
