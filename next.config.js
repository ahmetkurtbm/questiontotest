/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    // @react-pdf/renderer ve pdfjs-dist Node'a ozgu "canvas" modulunu opsiyonel
    // olarak cozmeye calisiyor; tarayici derlemesinde devre disi birakiyoruz.
    config.resolve.alias = { ...config.resolve.alias, canvas: false };
    return config;
  },
};

module.exports = nextConfig;
