import "server-only";
import { auth } from "@/auth";
import { ensureUser } from "@/lib/db";

/**
 * Oturumu dogrular ve GateHub kullanicisini yerel `users` satirina esler.
 * Oturum yoksa null doner; cagiran route 401 uretir.
 */
export async function currentUser() {
  const session = await auth();
  if (!session?.user?.id) return null;

  return ensureUser(session.user.id, session.user.name, session.user.email);
}

export function unauthorized() {
  return Response.json({ error: "Oturum açmanız gerekiyor" }, { status: 401 });
}

/** Beklenmeyen hatalari tek bicimde JSON'a cevirir. */
export function failure(error) {
  if (error.message === "DATABASE_NOT_CONFIGURED") {
    return Response.json(
      { error: "Veritabanı yapılandırılmamış (DATABASE_URL eksik)" },
      { status: 503 }
    );
  }

  console.error(error);
  return Response.json({ error: "Sunucu hatası" }, { status: 500 });
}
