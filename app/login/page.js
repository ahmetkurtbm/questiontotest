import { auth, isGateHubConfigured, signIn } from "@/auth";
import { redirect } from "next/navigation";

export const metadata = { title: "Giriş — QuestionToTest" };

export default async function LoginPage() {
  const session = await auth();
  if (session?.user) redirect("/");

  const configured = isGateHubConfigured();

  return (
    <main className="page login-page">
      <div className="card login-card">
        <div className="brand" style={{ justifyContent: "center" }}>
          <span className="brand-mark">Q2T</span>
          <span className="brand-name">
            Question<em>To</em>Test
          </span>
        </div>

        <div className="stack-sm" style={{ textAlign: "center" }}>
          <h1>Giriş yapın</h1>
          <p className="muted text-sm">
            Soru bankanız hesabınıza özeldir. Devam etmek için GateHub hesabınızı kullanın.
          </p>
        </div>

        <form
          action={async () => {
            "use server";
            await signIn("gatehub", { redirectTo: "/" });
          }}
        >
          <button className="btn btn-primary btn-block" type="submit" disabled={!configured}>
            GateHub ile devam et
          </button>
        </form>

        {!configured && (
          <p className="notice text-sm">
            GateHub istemci bilgileri henüz yapılandırılmadı. <code>GATEHUB_CLIENT_ID</code> ve{" "}
            <code>GATEHUB_CLIENT_SECRET</code> ortam değişkenlerini tanımlayın.
          </p>
        )}
      </div>
    </main>
  );
}
