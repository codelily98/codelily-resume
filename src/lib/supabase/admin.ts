import "server-only";

import { createClient } from "@supabase/supabase-js";

function createSupabaseAdminClient() {
  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secretKey = process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !secretKey) throw new Error("Supabase 관리자 환경 변수가 설정되지 않았습니다.");

  return createClient(url, secretKey, {
    auth: { autoRefreshToken: false, detectSessionInUrl: false, persistSession: false },
  });
}

export async function canCreateFirstAccount() {
  const { data, error } = await createSupabaseAdminClient().auth.admin.listUsers({ page: 1, perPage: 1 });
  if (error) throw error;
  return data.users.length === 0;
}

export async function createFirstAccount(email: string, password: string) {
  const client = createSupabaseAdminClient();
  const { data: existing, error: listError } = await client.auth.admin.listUsers({ page: 1, perPage: 1 });
  if (listError) throw listError;
  if (existing.users.length > 0) return null;

  const { data, error } = await client.auth.admin.createUser({ email, password, email_confirm: true });
  if (error) throw error;
  return data.user;
}
