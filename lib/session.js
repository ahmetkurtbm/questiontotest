import "server-only";
import { ensureUser } from "@/lib/db";

/**
 * Uygulama tek öğretmenin kendi bilgisayarında (ya da herkese açık demoda)
 * kullanılır; hesap sistemi yoktur. Bütün sorular bu yerel kullanıcıya bağlanır,
 * şema ileride çok kullanıcıya geçmek için owner_id'yi korur.
 */
export async function currentUser() {
  return ensureUser("local", "Öğretmen", null);
}

/** Beklenmeyen hataları tek biçimde JSON'a çevirir. */
export function failure(error) {
  // 42P01 = undefined_table: yerel veritabanına şema henüz uygulanmamış.
  if (error.code === "42P01") {
    return Response.json(
      { error: "Veritabanı tabloları yok. `npm run db:setup` komutunu çalıştırın." },
      { status: 503 }
    );
  }

  console.error(error);
  return Response.json({ error: "Sunucu hatası" }, { status: 500 });
}
