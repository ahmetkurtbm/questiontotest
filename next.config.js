/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ["@electric-sql/pglite", "pg"],
  // Demo modu migration dosyalarını ve PGlite'ın WASM dosyalarını çalışma anında okur.
  outputFileTracingIncludes: {
    "/**/*": [
      "./db/migrations/*.sql",
      "./node_modules/@electric-sql/pglite/dist/{pglite.wasm,pglite.data,initdb.wasm}",
    ],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
    ];
  },
  webpack: (config) => {
    // @react-pdf/renderer ve pdfjs-dist Node'a ozgu "canvas" modulunu opsiyonel
    // olarak cozmeye calisiyor; tarayici derlemesinde devre disi birakiyoruz.
    config.resolve.alias = { ...config.resolve.alias, canvas: false };
    return config;
  },
};

module.exports = nextConfig;
