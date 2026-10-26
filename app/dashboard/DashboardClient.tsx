import { requireSession } from "@/app/lib/auth/require-session";
import DashboardClient from "./DashboardClient";

export default async function DashboardPage() {
  await requireSession();

  return <DashboardClient />;
}