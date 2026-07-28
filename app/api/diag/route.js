import { auth } from "@/auth";

/**
 * Kurulum teshisi. Yalnizca degiskenin TANIMLI OLUP OLMADIGINI ve Blob ile
 * ilgili degisken ISIMLERINI dondurur - hicbir degeri disari vermez.
 * Oturum acmis kullanici disinda erisilemez.
 */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Oturum açmanız gerekiyor" }, { status: 401 });
  }

  const isSet = (key) => Boolean(process.env[key] && process.env[key].length > 0);

  return Response.json({
    beklenenler: {
      DATABASE_URL: isSet("DATABASE_URL"),
      BLOB_READ_WRITE_TOKEN: isSet("BLOB_READ_WRITE_TOKEN"),
      AUTH_SECRET: isSet("AUTH_SECRET"),
      GATEHUB_ISSUER: isSet("GATEHUB_ISSUER"),
      GATEHUB_CLIENT_ID: isSet("GATEHUB_CLIENT_ID"),
      GATEHUB_CLIENT_SECRET: isSet("GATEHUB_CLIENT_SECRET"),
    },
    // Farkli isimle enjekte edilmis olabilir (Vercel onek ekleyebiliyor).
    blobIcerenDegiskenler: Object.keys(process.env).filter((key) =>
      key.toUpperCase().includes("BLOB")
    ),
    ortam: process.env.VERCEL_ENV || "bilinmiyor",
    deployment: process.env.VERCEL_DEPLOYMENT_ID || "bilinmiyor",
  });
}
