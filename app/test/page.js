"use client";

import { useEffect, useMemo, useState } from "react";
import Header from "@/components/Header";
import { DifficultyBadge, DifficultySelect, SubjectSelect } from "@/components/MetaFields";
import { useToast } from "@/components/Toast";
import { api } from "@/lib/api";

const newRow = () => ({
  id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  subject: "",
  difficulty: "",
  count: 5,
});

export default function CreateTest() {
  const toast = useToast();
  const [counts, setCounts] = useState({ topics: [], totals: { all: 0 } });
  const [rows, setRows] = useState([newRow()]);
  const [settings, setSettings] = useState({
    title: "Kazanım Kavrama Testi",
    subtitle: "Ad Soyad: ............  Puan: ......",
    perPage: 6,
    includeAnswerKey: true,
    includeSolutions: true,
  });
  const [generated, setGenerated] = useState(null);
  const [busy, setBusy] = useState(false);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    api.counts().then(setCounts).catch((error) => toast.error(error.message));
  }, [toast]);

  // Bir satirin kriterlerine uyan toplam soru sayisi (satirlar arasi paylasim
  // sunucuda cozuluyor, burada ust sinir gostermek icin).
  const availableFor = useMemo(() => {
    return (row) => {
      const { topics, totals } = counts;
      const key = row.difficulty ? row.difficulty.toLocaleLowerCase("tr") : null;

      if (!row.subject) return key ? totals[key] || 0 : totals.all || 0;

      const topic = topics.find((item) => item.topic === row.subject);
      if (!topic) return 0;
      return key ? topic[key] || 0 : topic.total || 0;
    };
  }, [counts]);

  const requestedTotal = rows.reduce((sum, row) => sum + (Number(row.count) || 0), 0);

  const updateRow = (id, patch) =>
    setRows((current) => current.map((row) => (row.id === id ? { ...row, ...patch } : row)));

  const handleGenerate = async () => {
    if (requestedTotal === 0) {
      toast.error("En az bir satıra soru sayısı girin");
      return;
    }

    setBusy(true);
    try {
      const payload = rows.map(({ subject, difficulty, count }) => ({
        subject,
        difficulty,
        count: Number(count) || 0,
      }));

      const data = await api.createTest(payload);
      setGenerated(data);

      if (data.shortages.length > 0) {
        const detail = data.shortages
          .map((item) => `${item.subject} / ${item.difficulty}: ${item.got}/${item.wanted}`)
          .join(" · ");
        toast.info(`Bazı satırlarda yeterli soru yok — ${detail}`);
      } else {
        toast.success(`${data.questions.length} soruluk test hazır`);
      }
    } catch (error) {
      toast.error(error.message);
      setGenerated(null);
    } finally {
      setBusy(false);
    }
  };

  const handleDownload = async () => {
    setDownloading(true);
    try {
      // react-pdf yalnızca tarayıcıda çalışır; SSR grafiğine girmesin diye
      // tıklama anında dinamik yükleniyor.
      const { downloadTestPdf } = await import("@/lib/pdf/TestDocument");
      await downloadTestPdf({ questions: generated.questions, ...settings });
    } catch (error) {
      toast.error("PDF oluşturulamadı: " + error.message);
    } finally {
      setDownloading(false);
    }
  };

  const solvedCount = generated
    ? generated.questions.filter((question) => question.solutionUrl).length
    : 0;

  return (
    <>
      <Header />
      <main className="page">
        <div className="container stack">
          <div className="page-head">
            <h1>Test oluştur</h1>
            <p className="sub">
              İstediğiniz konu ve zorluklardan soru sayısı belirtin; sorular karıştırılarak
              tekrarsız şekilde seçilir. Bankada {counts.totals.all || 0} soru var.
            </p>
          </div>

          <section className="card">
            <div className="card-head">
              <span className="card-title">Soru dağılımı</span>
              <span className="card-hint">Boş bırakılan alan “farketmez” demektir</span>
            </div>

            <div className="stack-sm">
              {rows.map((row, index) => {
                const available = availableFor(row);
                const tooMany = Number(row.count) > available;

                return (
                  <div key={row.id} className="mix-row">
                    <span className="mix-index">{index + 1}</span>
                    <div className="field">
                      <label>Konu</label>
                      <SubjectSelect
                        allowAny
                        value={row.subject}
                        onChange={(subject) => updateRow(row.id, { subject })}
                      />
                    </div>
                    <div className="field">
                      <label>Zorluk</label>
                      <DifficultySelect
                        allowAny
                        value={row.difficulty}
                        onChange={(difficulty) => updateRow(row.id, { difficulty })}
                      />
                    </div>
                    <div className="field mix-count">
                      <label>Adet</label>
                      <input
                        className="input"
                        type="number"
                        min="0"
                        max={available}
                        value={row.count}
                        onChange={(e) => updateRow(row.id, { count: e.target.value })}
                      />
                      <span className={`text-xs ${tooMany ? "warn-text" : "muted"}`}>
                        havuzda {available}
                      </span>
                    </div>
                    <button
                      type="button"
                      className="btn btn-ghost btn-icon"
                      aria-label="Satırı sil"
                      disabled={rows.length === 1}
                      onClick={() => setRows((current) => current.filter((r) => r.id !== row.id))}
                    >
                      ✕
                    </button>
                  </div>
                );
              })}
            </div>

            <div className="row" style={{ marginTop: 14 }}>
              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={() => setRows((current) => [...current, newRow()])}
              >
                + Satır ekle
              </button>
              <span className="spacer" />
              <span className="badge badge-brand">Toplam {requestedTotal} soru</span>
            </div>
          </section>

          <section className="card">
            <div className="card-head">
              <span className="card-title">PDF ayarları</span>
            </div>
            <div className="form-grid">
              <div className="field" style={{ gridColumn: "1 / -1" }}>
                <label>Test başlığı</label>
                <input
                  className="input"
                  value={settings.title}
                  onChange={(e) => setSettings((s) => ({ ...s, title: e.target.value }))}
                />
              </div>
              <div className="field" style={{ gridColumn: "1 / -1" }}>
                <label>Üst bilgi satırı</label>
                <input
                  className="input"
                  value={settings.subtitle}
                  onChange={(e) => setSettings((s) => ({ ...s, subtitle: e.target.value }))}
                />
              </div>
              <div className="field">
                <label>Sayfa başına soru</label>
                <select
                  className="select"
                  value={settings.perPage}
                  onChange={(e) => setSettings((s) => ({ ...s, perPage: Number(e.target.value) }))}
                >
                  <option value={2}>2 (çok büyük)</option>
                  <option value={4}>4 (büyük)</option>
                  <option value={6}>6 (önerilen)</option>
                  <option value={8}>8 (sık)</option>
                </select>
              </div>
              <div className="field">
                <label>İçerik</label>
                <label className="check">
                  <input
                    type="checkbox"
                    checked={settings.includeAnswerKey}
                    onChange={(e) =>
                      setSettings((s) => ({ ...s, includeAnswerKey: e.target.checked }))
                    }
                  />
                  Cevap anahtarını ekle
                </label>
                <label className="check">
                  <input
                    type="checkbox"
                    checked={settings.includeSolutions}
                    onChange={(e) =>
                      setSettings((s) => ({ ...s, includeSolutions: e.target.checked }))
                    }
                  />
                  Çözümleri sona ekle
                </label>
              </div>
            </div>
          </section>

          <button
            type="button"
            className="btn btn-primary btn-block"
            onClick={handleGenerate}
            disabled={busy}
          >
            {busy ? (
              <>
                <span className="spinner" /> Sorular seçiliyor…
              </>
            ) : (
              "Testi oluştur"
            )}
          </button>

          {generated && (
            <section className="stack">
              <div className="row-between">
                <h2>Önizleme</h2>
                <div className="row" style={{ gap: 6 }}>
                  <span className="badge badge-brand">{generated.questions.length} soru</span>
                  <span className="badge">{solvedCount} çözümlü</span>
                </div>
              </div>

              {generated.shortages.length > 0 && (
                <div className="notice">
                  Şu satırlarda istenen kadar soru bulunamadı:{" "}
                  {generated.shortages
                    .map((item) => `${item.subject} / ${item.difficulty} (${item.got}/${item.wanted})`)
                    .join(", ")}
                </div>
              )}

              <div className="preview-grid">
                {generated.questions.map((question, index) => (
                  <figure key={question.id} className="preview-item">
                    <img src={question.questionUrl} alt={`${index + 1}. soru`} />
                    <figcaption>
                      <span className="badge badge-brand">{index + 1}</span>
                      <DifficultyBadge value={question.difficulty} />
                      <span className="badge">{question.answer}</span>
                      {question.solutionUrl && <span className="badge">Çözümlü</span>}
                    </figcaption>
                  </figure>
                ))}
              </div>
            </section>
          )}
        </div>
      </main>

      {generated && (
        <div className="action-bar">
          <div className="container row-between">
            <span className="text-sm">
              <strong>{generated.questions.length}</strong> soru
              {settings.includeAnswerKey && " · cevap anahtarı"}
              {settings.includeSolutions && solvedCount > 0 && ` · ${solvedCount} çözüm`}
            </span>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleDownload}
              disabled={downloading}
            >
              {downloading ? (
                <>
                  <span className="spinner" /> PDF hazırlanıyor…
                </>
              ) : (
                "PDF indir"
              )}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
