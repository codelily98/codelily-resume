import { FileText, LockKeyhole } from "lucide-react";
import { canCreateFirstAccount } from "@/lib/supabase/admin";
import { signIn, signUp } from "@/app/login/actions";

type SearchParams = Promise<{ error?: string; message?: string; next?: string }>;

export const dynamic = "force-dynamic";

export default async function LoginPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  let registrationOpen = false;
  try {
    registrationOpen = await canCreateFirstAccount();
  } catch {
    // The actionable configuration message is rendered below.
  }

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

      <section className="auth-form-shell" aria-label={registrationOpen ? "첫 계정 만들기" : "로그인"}>
        <div className="auth-form-heading">
          <p>{registrationOpen ? "처음 오셨군요" : "다시 오신 것을 환영합니다"}</p>
          <h2>{registrationOpen ? "Lilyume 계정 만들기" : "Lilyume 로그인"}</h2>
          <span>{registrationOpen ? "첫 계정만 만들 수 있으며 이후 공개 가입은 자동으로 닫힙니다." : "등록한 이메일과 비밀번호를 입력해 주세요."}</span>
        </div>

        {params.error ? <p className="auth-notice error" role="alert">{params.error}</p> : null}
        {params.message ? <p className="auth-notice success" role="status">{params.message}</p> : null}

        <form className="auth-form" action={registrationOpen ? signUp : signIn}>
          <input type="hidden" name="next" value={params.next ?? "/"} />
          <label className="field-label" htmlFor="email">이메일</label>
          <input className="input" id="email" name="email" type="email" autoComplete="email" placeholder="name@example.com" required />
          <label className="field-label" htmlFor="password">비밀번호</label>
          <input className="input" id="password" name="password" type="password" autoComplete={registrationOpen ? "new-password" : "current-password"} minLength={8} required />
          <button className="button button-primary button-md auth-submit" type="submit">
            {registrationOpen ? "내 계정 만들기" : "로그인"}
          </button>
        </form>
      </section>
    </main>
  );
}
