import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import { authOptions } from "./auth-options";

export async function requireSession() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  return session;
}