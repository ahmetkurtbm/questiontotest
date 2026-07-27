import { ToastProvider } from "@/components/Toast";
import "./theme.css";
import "./pages.css";

export const metadata = {
  title: "QuestionToTest",
  description:
    "Fotoğraf ve PDF'ten soru bankası oluşturup karışık test hazırlama aracı",
  manifest: "/manifest.json",
  icons: { icon: "/favicon.svg", apple: "/favicon.svg" },
};

export const viewport = {
  themeColor: "#4f46e5",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }) {
  return (
    <html lang="tr">
      <body>
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
