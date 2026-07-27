import { handleUpload } from "@vercel/blob/client";
import { auth } from "@/auth";

/**
 * Gorseller tarayicidan dogrudan Vercel Blob'a yuklenir; bu route sadece
 * oturumu dogrulayip yukleme token'i uretir. Boylece Vercel fonksiyonlarinin
 * ~4,5 MB istek govdesi siniri devreye girmez.
 */
export async function POST(request) {
  const body = await request.json();

  try {
    const result = await handleUpload({
      request,
      body,
      onBeforeGenerateToken: async () => {
        const session = await auth();
        if (!session?.user?.id) throw new Error("Oturum açmanız gerekiyor");

        return {
          allowedContentTypes: ["image/jpeg", "image/png", "image/webp"],
          addRandomSuffix: true,
          maximumSizeInBytes: 8 * 1024 * 1024,
          tokenPayload: JSON.stringify({ userId: session.user.id }),
        };
      },
      onUploadCompleted: async () => {
        // Satir, istemci yukleme bittikten sonra /api/questions ile yaziliyor.
      },
    });

    return Response.json(result);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 400 });
  }
}
