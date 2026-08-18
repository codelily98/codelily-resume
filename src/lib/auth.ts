import "server-only";

import type { User } from "@supabase/supabase-js";
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
