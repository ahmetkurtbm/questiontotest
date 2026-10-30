import { describe, expect, it } from "vitest";
import { ensureUser } from "@/lib/db";
import { createTest, insertQuestions, listQuestions, questionCounts } from "@/lib/questions";

// Gerçek SQL, demo modundaki PGlite üzerinde çalışır; her test kendi kullanıcısını açar.
let counter = 0;
const newOwner = async () => (await ensureUser(`test-${++counter}`, "Test", null)).id;

const item = (overrides = {}) => ({
  questionUrl: "/api/images/q",
  solutionUrl: null,
  subject: "Türev Kavramı",
  difficulty: "Kolay",
  answer: "A",
  ...overrides,
});

describe("insertQuestions", () => {
  it("numaraları kullanıcı başına sırayla verir", async () => {
    const [first, second] = [await newOwner(), await newOwner()];
    const saved = await insertQuestions(first, [item(), item()]);
    expect(saved.map((q) => q.no)).toEqual([1, 2]);
    expect((await insertQuestions(first, [item()]))[0].no).toBe(3);
    expect((await insertQuestions(second, [item()]))[0].no).toBe(1);
  });

  it("aynı anda gelen eklemelerde numara çakışmaz", async () => {
    const owner = await newOwner();
    const batches = await Promise.all([1, 2, 3].map(() => insertQuestions(owner, [item(), item()])));
    const numbers = batches.flat().map((q) => q.no).sort((a, b) => a - b);
    expect(numbers).toEqual([1, 2, 3, 4, 5, 6]);
  });
});

describe("listQuestions", () => {
  it("başka kullanıcının sorularını göstermez", async () => {
    const [owner, other] = [await newOwner(), await newOwner()];
    await insertQuestions(other, [item({ subject: "Gizli Konu" })]);
    await insertQuestions(owner, [item()]);
    const { items, total } = await listQuestions(owner, { search: "Gizli" });
    expect(items).toEqual([]);
    expect(total).toBe(0);
    expect((await listQuestions(owner)).total).toBe(1);
  });

  it("konu, zorluk, cevap, numara ve aramayla süzer", async () => {
    const owner = await newOwner();
    await insertQuestions(owner, [
      item({ subject: "Üçgenler", difficulty: "Zor", answer: "B" }),
      item({ subject: "Türev Kavramı", difficulty: "Kolay", answer: "C" }),
    ]);
    expect((await listQuestions(owner, { subject: "Üçgenler" })).items.map((q) => q.no)).toEqual([1]);
    expect((await listQuestions(owner, { difficulty: "Kolay" })).items.map((q) => q.no)).toEqual([2]);
    expect((await listQuestions(owner, { answer: "B" })).items.map((q) => q.no)).toEqual([1]);
    expect((await listQuestions(owner, { no: 2 })).items.map((q) => q.no)).toEqual([2]);
    expect((await listQuestions(owner, { search: "Türev" })).items.map((q) => q.no)).toEqual([2]);
  });

  it("sayfalar ve sayfa boyutunu sınırlar", async () => {
    const owner = await newOwner();
    await insertQuestions(owner, Array.from({ length: 5 }, () => item()));
    const second = await listQuestions(owner, { page: 2, pageSize: 2 });
    expect(second.items.map((q) => q.no)).toEqual([3, 4]);
    expect(second).toMatchObject({ total: 5, totalPages: 3, page: 2 });
    expect((await listQuestions(owner, { pageSize: 1000 })).pageSize).toBe(48);
    expect((await listQuestions(owner, { page: -3 })).page).toBe(1);
  });

  it("soru yokken de en az bir sayfa bildirir", async () => {
    expect((await listQuestions(await newOwner())).totalPages).toBe(1);
  });
});

describe("questionCounts", () => {
  it("konu ve zorluk başına sayar, çözümlüleri ayırır", async () => {
    const owner = await newOwner();
    await insertQuestions(owner, [
      item({ difficulty: "Kolay", solutionUrl: "/api/images/s" }),
      item({ difficulty: "Zor" }),
      item({ subject: "Üçgenler", difficulty: "Orta" }),
    ]);
    const { topics, totals } = await questionCounts(owner);
    expect(topics).toContainEqual({ topic: "Üçgenler", kolay: 0, orta: 1, zor: 0, total: 1 });
    expect(totals).toEqual({ all: 3, kolay: 1, orta: 1, zor: 1, withSolution: 1 });
  });
});

describe("createTest", () => {
  it("satırlar arasında aynı soruyu tekrar seçmez", async () => {
    const owner = await newOwner();
    await insertQuestions(owner, Array.from({ length: 4 }, () => item()));
    const { questions, shortages } = await createTest(owner, [
      { subject: "Türev Kavramı", count: 2 },
      { subject: "", count: 2 },
    ]);
    expect(new Set(questions.map((q) => q.id)).size).toBe(4);
    expect(shortages).toEqual([]);
  });

  it("eksik soruları raporlar", async () => {
    const owner = await newOwner();
    await insertQuestions(owner, [item({ subject: "Üçgenler", difficulty: "Zor" })]);
    const { questions, shortages } = await createTest(owner, [
      { subject: "Üçgenler", difficulty: "Zor", count: 3 },
      { count: 1 },
    ]);
    expect(questions).toHaveLength(1);
    expect(shortages).toEqual([
      { subject: "Üçgenler", difficulty: "Zor", wanted: 3, got: 1 },
      { subject: "Tüm konular", difficulty: "Tüm zorluklar", wanted: 1, got: 0 },
    ]);
  });

  it("başka kullanıcının sorusunu seçmez, sıfır adetli satırı atlar", async () => {
    const [owner, other] = [await newOwner(), await newOwner()];
    await insertQuestions(other, [item()]);
    expect(await createTest(owner, [{ count: 0 }])).toEqual({ questions: [], shortages: [] });
    expect((await createTest(owner, [{ count: 1 }])).questions).toEqual([]);
  });
});
