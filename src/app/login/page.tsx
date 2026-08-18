import { FileText, LockKeyhole } from "lucide-react";
import Link from "next/link";
import { signIn, signUp } from "@/app/login/actions";

type SearchParams = Promise<{ error?: string; message?: string; next?: string; mode?: string }>;

export const dynamic = "force-dynamic";

export default async function LoginPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const isSignUp = params.mode === "signup";
  const modeHref = isSignUp
    ? `/login${params.next ? `?next=${encodeURIComponent(params.next)}` : ""}`
    : `/login?${new URLSearchParams({ mode: "signup", ...(params.next ? { next: params.next } : {}) })}`;

  return (
    <main className="auth-page">
      <section className="auth-intro" aria-labelledby="auth-title">
        <span className="auth-brand"><span className="brand-mark"><FileText aria-hidden="true" size={18} /></span>Lilyume</span>
        <div>
          <p className="auth-eyebrow">개인 이력서 작업 공간</p>
          <h1 id="auth-title">어디서든 이어 쓰고,<br />제출할 때는 깔끔하게.</h1>
          <p>이력서와 증빙 파일을 내 계정 안에서 관리하고 A4 PDF로 바로 저장하세요.</p>
        </div>
        <p className="auth-privacy"><LockKeyhole aria-hidden="true" size={16} />로그인한 사용자만 이력서와 첨부파일에 접근할 수 있습니다.</p>
      </section>

      <section className="auth-form-shell" aria-label={isSignUp ? "회원가입" : "로그인"}>
        <div className="auth-form-heading">
          <p>{isSignUp ? "새로운 이력서를 시작하세요" : "다시 오신 것을 환영합니다"}</p>
          <h2>{isSignUp ? "Lilyume 회원가입" : "Lilyume 로그인"}</h2>
          <span>{isSignUp ? "이메일 확인 후 나만의 이력서 작업공간을 사용할 수 있습니다." : "등록한 이메일과 비밀번호를 입력해 주세요."}</span>
        </div>

        {params.error ? <p className="auth-notice error" role="alert">{params.error}</p> : null}
        {params.message ? <p className="auth-notice success" role="status">{params.message}</p> : null}

        <form className="auth-form" action={isSignUp ? signUp : signIn}>
          <input type="hidden" name="next" value={params.next ?? "/"} />
          <label className="field-label" htmlFor="email">이메일</label>
          <input className="input" id="email" name="email" type="email" autoComplete="email" placeholder="name@example.com" required />
          <label className="field-label" htmlFor="password">비밀번호</label>
          <input className="input" id="password" name="password" type="password" autoComplete={isSignUp ? "new-password" : "current-password"} minLength={8} required />
          {isSignUp ? <>
            <label className="field-label" htmlFor="confirmPassword">비밀번호 확인</label>
            <input className="input" id="confirmPassword" name="confirmPassword" type="password" autoComplete="new-password" minLength={8} required />
          </> : null}
          <button className="button button-primary button-md auth-submit" type="submit">
            {isSignUp ? "회원가입" : "로그인"}
          </button>
        </form>
        <p className="auth-mode-switch">
          {isSignUp ? "이미 계정이 있으신가요?" : "아직 계정이 없으신가요?"}
          <Link href={modeHref}>{isSignUp ? "로그인" : "회원가입"}</Link>
        </p>
      </section>
    </main>
  );
}
