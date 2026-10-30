import { describe, expect, it } from "vitest";
import { validateQuestion } from "@/lib/questions";
import { SUBJECTS } from "@/lib/subjects";
import { approximateSizeKb } from "@/lib/image";

const valid = { questionUrl: "/api/images/1", subject: "Türev Kavramı", difficulty: "Kolay", answer: "A" };

describe("validateQuestion", () => {
  it("geçerli soruyu kabul eder ve alanları düzeltir", () => {
    const { value } = validateQuestion({ ...valid, subject: "  Türev Kavramı ", difficulty: "ORTA", answer: "c" });
    expect(value).toEqual({
      questionUrl: "/api/images/1",
      solutionUrl: null,
      subject: "Türev Kavramı",
      difficulty: "Orta",
      answer: "C",
    });
  });

  it("zorluğu Türkçe küçük/büyük harf kurallarıyla eşleştirir", () => {
    expect(validateQuestion({ ...valid, difficulty: "zor" }).value.difficulty).toBe("Zor");
    expect(validateQuestion({ ...valid, difficulty: "KOLAY" }).value.difficulty).toBe("Kolay");
  });

  it.each([
    [{ ...valid, questionUrl: "" }, "Soru görseli zorunlu"],
    [{ ...valid, subject: "   " }, "Konu zorunlu"],
    [{ ...valid, difficulty: "Çok zor" }, "Zorluk Kolay/Orta/Zor olmalı"],
    [{ ...valid, difficulty: undefined }, "Zorluk Kolay/Orta/Zor olmalı"],
    [{ ...valid, answer: "F" }, "Cevap A-E arasında olmalı"],
    [{ ...valid, answer: "" }, "Cevap A-E arasında olmalı"],
    [null, "Soru görseli zorunlu"],
  ])("geçersiz girdiyi reddeder: %j", (body, error) => {
    expect(validateQuestion(body)).toEqual({ error });
  });
});

describe("konu listesi", () => {
  it("aynı konuyu iki kez içermez", () => {
    expect(new Set(SUBJECTS).size).toBe(SUBJECTS.length);
  });
});

describe("approximateSizeKb", () => {
  it("base64 uzunluğundan boyutu tahmin eder", () => {
    expect(approximateSizeKb(`data:image/jpeg;base64,${"A".repeat(4096)}`)).toBe(3);
  });

  it("boş girdide 0 döner", () => {
    expect(approximateSizeKb("")).toBe(0);
    expect(approximateSizeKb(null)).toBe(0);
  });
});
