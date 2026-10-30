import { afterEach, describe, expect, it, vi } from "vitest";
import { api } from "@/lib/api";

const respond = (status, body) => new Response(body, { status });

afterEach(() => vi.unstubAllGlobals());

describe("api istemcisi", () => {
  it("JSON gövdeyle istek atar ve yanıtı döner", async () => {
    const fetchMock = vi.fn(async () => respond(200, '{"id":1}'));
    vi.stubGlobal("fetch", fetchMock);
    await expect(api.createTest([{ count: 1 }])).resolves.toEqual({ id: 1 });
    const [path, options] = fetchMock.mock.calls[0];
    expect(path).toBe("/api/create-test");
    expect(options.method).toBe("POST");
    expect(JSON.parse(options.body)).toEqual({ rows: [{ count: 1 }] });
  });

  it("sunucunun hata mesajını iletir", async () => {
    vi.stubGlobal("fetch", async () => respond(400, '{"error":"Konu zorunlu"}'));
    await expect(api.counts()).rejects.toThrow("Konu zorunlu");
  });

  it("gövdesiz hatada durum kodunu söyler", async () => {
    vi.stubGlobal("fetch", async () => respond(500, ""));
    await expect(api.counts()).rejects.toThrow("İstek başarısız (500)");
  });

  it("ağ hatasını anlaşılır mesaja çevirir", async () => {
    vi.stubGlobal("fetch", async () => {
      throw new TypeError("failed to fetch");
    });
    await expect(api.counts()).rejects.toThrow("Sunucuya ulaşılamadı");
  });
});
