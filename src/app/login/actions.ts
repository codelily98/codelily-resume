"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const credentialsSchema = z.object({
  email: z.email("이메일 주소를 확인해 주세요."),
  password: z.string().min(8, "비밀번호는 8자 이상 입력해 주세요.").max(72),
  next: z.string().optional(),
});

const signUpSchema = credentialsSchema.extend({
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "비밀번호 확인이 일치하지 않습니다.",
  path: ["confirmPassword"],
});

function safeNext(value?: string) {
  return value?.startsWith("/") && !value.startsWith("//") ? value : "/";
}

function signUpErrorMessage(code?: string) {
  switch (code) {
    case "email_address_not_authorized":
      return "현재 가입 확인 메일 발송 설정이 완료되지 않았습니다. 관리자에게 문의해 주세요.";
    case "over_email_send_rate_limit":
      return "가입 확인 메일 요청이 많습니다. 잠시 후 다시 시도해 주세요.";
    case "signup_disabled":
      return "현재 신규 회원가입이 중지되어 있습니다.";
    case "weak_password":
      return "더 안전한 비밀번호를 입력해 주세요.";
    default:
      return "회원가입을 완료하지 못했습니다. 이메일과 비밀번호를 확인해 주세요.";
  }
}

function loginRedirect(kind: "error" | "message", message: string, next?: string, mode?: "signup"): never {
  const params = new URLSearchParams({ [kind]: message });
  if (next) params.set("next", safeNext(next));
  if (mode) params.set("mode", mode);
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
  const parsed = signUpSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    loginRedirect("error", parsed.error.issues[0]?.message ?? "입력값을 확인해 주세요.", undefined, "signup");
  }

  const requestHeaders = await headers();
  const origin = process.env.NEXT_PUBLIC_SITE_URL ?? requestHeaders.get("origin");
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: origin ? {
      emailRedirectTo: `${origin}/auth/confirm?next=${encodeURIComponent(safeNext(parsed.data.next))}`,
    } : undefined,
  });

  if (error) {
    loginRedirect("error", signUpErrorMessage(error.code), parsed.data.next, "signup");
  }
  if (data.session) redirect(safeNext(parsed.data.next));
  loginRedirect("message", "가입 확인 메일을 보냈습니다. 메일의 링크를 누른 뒤 로그인해 주세요.", parsed.data.next);
}
