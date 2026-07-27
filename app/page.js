"use client";

import { useState } from "react";
import Header from "@/components/Header";
import PhotoField from "@/components/PhotoField";
import { QuestionMetaFields } from "@/components/MetaFields";
import { useToast } from "@/components/Toast";
import { api } from "@/lib/api";
import { uploadMany } from "@/lib/upload";

const EMPTY_META = { subject: "Doğal Sayılar", difficulty: "Kolay", answer: "A" };

export default function AddQuestion() {
  const toast = useToast();
  const [questionImage, setQuestionImage] = useState(null);
  const [solutionImage, setSolutionImage] = useState(null);
  const [meta, setMeta] = useState(EMPTY_META);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!questionImage) {
      toast.error("Önce soru fotoğrafı yükleyin");
      return;
    }

    setSaving(true);
    try {
      // Görseller önce doğrudan Blob'a yüklenir; API'ye yalnızca URL gider.
      const [questionUrl, solutionUrl] = await uploadMany([
        { dataUrl: questionImage, prefix: "soru" },
        { dataUrl: solutionImage, prefix: "cozum" },
      ]);

      const saved = await api.createQuestion({ questionUrl, solutionUrl, ...meta });

      toast.success(`${saved.no}. soru kaydedildi`);
      setLastSaved(saved);
      // Konu/zorluk korunuyor: ayni konudan arka arkaya soru girmek yaygin.
      setQuestionImage(null);
      setSolutionImage(null);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Header />
      <main className="page">
        <div className="container-narrow stack">
          <div className="page-head">
            <h1>Fotoğraftan soru ekle</h1>
            <p className="sub">
              Soru fotoğrafını yükleyin, gerekirse kırpın. Çözüm fotoğrafı isteğe bağlıdır ve
              yüklerseniz test PDF'inin sonuna çözüm sayfası olarak eklenir.
            </p>
          </div>

          <form className="stack" onSubmit={handleSubmit}>
            <section className="card">
              <PhotoField
                label="Soru fotoğrafı"
                hint="Sorunun net göründüğü bir fotoğraf seçin"
                value={questionImage}
                onChange={setQuestionImage}
                onError={toast.error}
              />
            </section>

            <section className="card">
              <PhotoField
                label="Çözüm fotoğrafı"
                hint="Çözümü de eklemek isterseniz yükleyin"
                value={solutionImage}
                onChange={setSolutionImage}
                optional
                onError={toast.error}
              />
            </section>

            <section className="card">
              <div className="card-head">
                <span className="card-title">Soru bilgileri</span>
              </div>
              <QuestionMetaFields value={meta} onChange={setMeta} idPrefix="add" />
            </section>

            <button
              type="submit"
              className="btn btn-primary btn-block"
              disabled={saving || !questionImage}
            >
              {saving ? (
                <>
                  <span className="spinner" /> Kaydediliyor…
                </>
              ) : (
                "Soruyu kaydet"
              )}
            </button>
          </form>

          {lastSaved && (
            <div className="card saved-strip">
              <img src={lastSaved.questionUrl} alt={`${lastSaved.no}. soru`} />
              <div className="stack-sm">
                <strong>{lastSaved.no}. soru eklendi</strong>
                <span className="text-sm muted">
                  {lastSaved.subject} · {lastSaved.difficulty} · Cevap {lastSaved.answer}
                  {lastSaved.solutionUrl ? " · Çözümlü" : ""}
                </span>
              </div>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
