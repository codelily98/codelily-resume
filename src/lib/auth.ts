import "server-only";

import type { User } from "@supabase/supabase-js";
import { prisma } from "@/lib/prisma";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export class AuthenticationRequiredError extends Error {
  constructor() {
    super("AUTHENTICATION_REQUIRED");
    this.name = "AuthenticationRequiredError";
  }
}

export async function requireUser(): Promise<User> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) throw new AuthenticationRequiredError();

  // The pre-Auth version stored resumes without an owner. The first authenticated
  // Lilyume account safely adopts those records once, without deleting data.
  await prisma.resume.updateMany({ where: { ownerId: null }, data: { ownerId: data.user.id } });
  return data.user;
}

export async function getOptionalUser() {
  try {
    return await requireUser();
  } catch (error) {
    if (error instanceof AuthenticationRequiredError) return null;
    throw error;
  }
}
