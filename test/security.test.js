import { afterEach, describe, expect, it, vi } from "vitest";
import { query } from "@/lib/db";
import { demoQuotaError } from "@/lib/image-quota";
import { isOwnImageUrl } from "@/lib/images";
import { MAX_ROW_COUNT, MAX_TEST_ROWS, validateQuestion, validateTestRows } from "@/lib/questions";
import { clientIp, createRateLimiter } from "@/lib/rate-limit";
import { POST as detect } from "@/app/api/ai/detect/route";
import { POST as bulk } from "@/app/api/questions/bulk/route";
import { POST as createTestRoute } from "@/app/api/create-test/route";
import { POST as uploadImage } from "@/app/api/images/route";
import { PUT as updateQuestion } from "@/app/api/questions/[id]/route";
import nextConfig from "../next.config.js";

const UUID = "11111111-1111-4111-8111-111111111111";
const post = (url, body, headers = {}) =>
  new Request(`http://localhost${url}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });

afterEach(() => {
  vi.unstubAllEnvs();
  delete globalThis.aiDetectLimiter;
});

describe("demo görsel kotası", () => {
  it("sınır aşılınca 507 döner, altındayken kabul eder", async () => {
    expect(await demoQuotaError(10)).toBeNull();
    const { rows } = await query("SELECT count(*)::int AS c FROM images");
    expect(await demoQuotaError(10, { maxImages: rows[0].c })).toMatch(/kota/);
    expect(await demoQuotaError(10, { maxBytes: 5 })).toMatch(/kota/);
  });

  it("yerel Postgres modunda sınır uygulanmaz", async () => {
    vi.stubEnv("DATABASE_URL", "postgres://yok");
    expect(await demoQuotaError(1e12)).toBeNull();
  });

  it("yükleme rotası kota dolunca 507 verir", async () => {
    const png = () => new Request("http://localhost/api/images", { method: "POST", headers: { "Content-Type": "image/png" }, body: new Uint8Array([1, 2, 3]) });
    expect((await uploadImage(png())).status).toBe(200);
    // Kotayı doldurmadan yolu denemek için eklemeyi 300'e tamamla.
    await query("INSERT INTO images (content_type, data) SELECT 'image/png', '\x01'::bytea FROM generate_series(1, 300)");
    const response = await uploadImage(png());
    expect(response.status).toBe(507);
    expect((await response.json()).error).toMatch(/kota/);
    await query("DELETE FROM images");
  });
});

describe("yapay zekâ endpoint'i", () => {
  it("IP başına sınırı uygular ve eski kayıtları temizler", () => {
    const limiter = createRateLimiter({ windowMs: 1000, maxKeys: 3 });
    expect([1, 2, 3].map(() => limiter.allow("a", 2, 0))).toEqual([true, true, false]);
    expect(limiter.allow("a", 2, 1001)).toBe(true);
    ["b", "c", "d", "e"].forEach((key) => limiter.allow(key, 2, 2000));
    expect(limiter.size()).toBeLessThanOrEqual(3);
  });

  it("IP'yi başlık önceliğine göre alır", () => {
    const h = (o) => new Headers(o);
    expect(clientIp(h({ "x-vercel-forwarded-for": "1.1.1.1, 2.2.2.2", "x-real-ip": "3.3.3.3" }))).toBe("1.1.1.1");
    expect(clientIp(h({ "x-real-ip": "3.3.3.3", "x-forwarded-for": "4.4.4.4" }))).toBe("3.3.3.3");
    expect(clientIp(h({ "x-forwarded-for": "4.4.4.4, 5.5.5.5" }))).toBe("4.4.4.4");
  });

  it("anahtar yokken 503 döner", async () => {
    vi.stubEnv("GEMINI_API_KEY", "");
    expect((await detect(post("/api/ai/detect", {}))).status).toBe(503);
  });

  it("saatlik sınırı aşınca 429, büyük gövdede 413 döner", async () => {
    vi.stubEnv("GEMINI_API_KEY", "test");
    vi.stubEnv("AI_DETECT_HOURLY_LIMIT", "2");
    const headers = { "x-real-ip": "9.9.9.9" };
    expect((await detect(post("/api/ai/detect", { image: "x" }, headers))).status).toBe(400);
    expect((await detect(post("/api/ai/detect", "x".repeat(8 * 1024 * 1024), headers))).status).toBe(413);
    expect((await detect(post("/api/ai/detect", { image: "x" }, headers))).status).toBe(429);
    expect((await detect(post("/api/ai/detect", { image: "x" }, { "x-real-ip": "8.8.8.8" }))).status).toBe(400);
  });
});

describe("toplu kayıt", () => {
  it("200'den fazla soruda 413 döner", async () => {
    const response = await bulk(post("/api/questions/bulk", { questions: new Array(201).fill({}) }));
    expect(response.status).toBe(413);
  });
});

describe("test oluşturma sınırları", () => {
  it("satır ve adet sınırlarını denetler", async () => {
    expect(validateTestRows(new Array(MAX_TEST_ROWS).fill({ count: 1 }))).toBeNull();
    expect(validateTestRows(new Array(MAX_TEST_ROWS + 1).fill({ count: 1 })).status).toBe(413);
    expect(validateTestRows([{ count: MAX_ROW_COUNT + 1 }]).status).toBe(400);
    expect((await createTestRoute(post("/api/create-test", { rows: [{ count: 101 }] }))).status).toBe(400);
    expect((await createTestRoute(post("/api/create-test", { rows: new Array(51).fill({ count: 1 }) }))).status).toBe(413);
  });
});

describe("görsel adresi doğrulama", () => {
  it("yalnızca uygulamanın kendi adreslerini kabul eder", () => {
    expect(isOwnImageUrl(`/api/images/${UUID}`)).toBe(true);
    expect(isOwnImageUrl("/demo/soru-01.png")).toBe(true);
    for (const bad of ["https://evil.example/x.png", "//evil.example/x.png", "/demo/../etc", "/api/images/1", "javascript:alert(1)", 5]) {
      expect(isOwnImageUrl(bad)).toBe(false);
    }
  });

  it("validateQuestion dış adresleri reddeder", () => {
    const base = { questionUrl: `/api/images/${UUID}`, subject: "Türev Kavramı", difficulty: "Kolay", answer: "A" };
    expect(validateQuestion(base).error).toBeUndefined();
    expect(validateQuestion({ ...base, questionUrl: "https://evil.example/a.png" }).error).toMatch(/geçersiz/);
    expect(validateQuestion({ ...base, solutionUrl: "https://evil.example/a.png" }).error).toMatch(/geçersiz/);
  });

  it("güncelleme dış çözüm adresini reddeder", async () => {
    const { rows } = await query("SELECT id FROM questions LIMIT 1");
    const put = (solutionUrl) =>
      updateQuestion(new Request("http://localhost/x", { method: "PUT", body: JSON.stringify({ solutionUrl }) }), { params: Promise.resolve({ id: rows[0].id }) });
    expect((await put("https://evil.example/a.png")).status).toBe(400);
    expect((await put(`/api/images/${UUID}`)).status).toBe(200);
  });
});

describe("güvenlik başlıkları", () => {
  it("üç başlığı tanımlar, CSP eklemez", async () => {
    const [rule] = await nextConfig.headers();
    const keys = rule.headers.map((h) => h.key);
    expect(keys).toEqual(["X-Frame-Options", "X-Content-Type-Options", "Referrer-Policy"]);
    expect(rule.headers[0].value).toBe("DENY");
  });
});
