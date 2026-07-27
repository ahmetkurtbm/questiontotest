export { auth as middleware } from "@/auth";

export const config = {
  runtime: "nodejs",
  // /api tamamen disarida: route'lar oturumu kendisi kontrol edip JSON 401
  // donuyor. Middleware'e birakilirsa fetch'e HTML login sayfasi gider.
  matcher: [
    "/((?!api|login|_next/static|_next/image|favicon.svg|fonts|manifest.json|pdf.worker.min.js).*)",
  ],
};
