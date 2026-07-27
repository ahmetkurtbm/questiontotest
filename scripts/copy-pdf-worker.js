// pdf.js worker'i public/ altina kopyalar. Boylece CDN'e bagimli kalmadan
// ve pdfjs-dist surumuyle her zaman uyumlu sekilde servis edilir.
const fs = require("fs");
const path = require("path");

const source = path.join(
  __dirname,
  "..",
  "node_modules",
  "pdfjs-dist",
  "build",
  "pdf.worker.min.js"
);
const target = path.join(__dirname, "..", "public", "pdf.worker.min.js");

try {
  fs.copyFileSync(source, target);
  console.log("pdf.worker.min.js public/ altina kopyalandi");
} catch (error) {
  console.warn("pdf.worker.min.js kopyalanamadi:", error.message);
}
