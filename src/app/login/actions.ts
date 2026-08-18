"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createFirstAccount } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const credentialsSchema = z.object({
  email: z.email("이메일 주소를 확인해 주세요."),
  password: z.string().min(8, "비밀번호는 8자 이상 입력해 주세요.").max(72),
  next: z.string().optional(),
});

function safeNext(value?: string) {
  return value?.startsWith("/") && !value.startsWith("//") ? value : "/";
}

function loginRedirect(kind: "error" | "message", message: string, next?: string): never {
  const params = new URLSearchParams({ [kind]: message });
  if (next) params.set("next", safeNext(next));
  redirect(`/login?${params.toString()}`);
}

export async function signIn(formData: FormData) {
  const parsed = credentialsSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) loginRedirect("error", parsed.error.issues[0]?.message ?? "입력값을 확인해 주세요.");

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });
  if (error) loginRedirect("error", "이메일 또는 비밀번호가 올바르지 않습니다.", parsed.data.next);
  redirect(safeNext(parsed.data.next));
}

export async function signUp(formData: FormData) {
  const parsed = credentialsSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) loginRedirect("error", parsed.error.issues[0]?.message ?? "입력값을 확인해 주세요.");

  let user;
  try {
    user = await createFirstAccount(parsed.data.email, parsed.data.password);
  } catch {
    loginRedirect("error", "계정을 만들지 못했습니다. 잠시 후 다시 시도해 주세요.");
  }
  if (!user) loginRedirect("error", "Lilyume 계정이 이미 설정되어 있습니다. 기존 계정으로 로그인해 주세요.");

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword({ email: parsed.data.email, password: parsed.data.password });
  if (error) loginRedirect("message", "계정을 만들었습니다. 등록한 정보로 로그인해 주세요.", parsed.data.next);
  redirect(safeNext(parsed.data.next));
}
