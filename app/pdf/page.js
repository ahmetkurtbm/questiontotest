"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import ReactCrop from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import * as pdfjsLib from "pdfjs-dist/build/pdf";
import Header from "@/components/Header";
import { AnswerSelect, DifficultySelect, SubjectSelect } from "@/components/MetaFields";
import { useToast } from "@/components/Toast";
import { cropImageElement } from "@/lib/image";
import { api } from "@/lib/api";
import { uploadMany } from "@/lib/upload";

// Worker public/ altindan servis ediliyor (CDN bagimliligi yok).
pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.js";

const RENDER_WIDTH = 1500;

export default function ImportPdf() {
  const toast = useToast();
  const docRef = useRef(null);
  const imageRef = useRef(null);
  const pageCacheRef = useRef(new Map());

  const [fileName, setFileName] = useState("");
  const [pageCount, setPageCount] = useState(0);
  // Ayni sayfa sayisina sahip ikinci bir PDF acildiginda da yeniden render
  // edilmesi icin.
  const [docVersion, setDocVersion] = useState(0);
  const [pageIndex, setPageIndex] = useState(1);
  const [pageImage, setPageImage] = useState(null);
  const [rendering, setRendering] = useState(false);
  const [crop, setCrop] = useState();

  const [defaults, setDefaults] = useState({ subject: "Doğal Sayılar", difficulty: "Kolay" });
  const [items, setItems] = useState([]);
  const [targetId, setTargetId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(null);

  const renderPage = useCallback(async (index) => {
    const doc = docRef.current;
    if (!doc) return;

    const cached = pageCacheRef.current.get(index);
    if (cached) {
      setPageImage(cached);
      return;
    }

    setRendering(true);
    try {
      const page = await doc.getPage(index);
      const base = page.getViewport({ scale: 1 });
      const viewport = page.getViewport({ scale: RENDER_WIDTH / base.width });

      const canvas = document.createElement("canvas");
      canvas.width = viewport.width;
      canvas.height = viewport.height;

      await page.render({ canvasContext: canvas.getContext("2d"), viewport }).promise;

      const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
      pageCacheRef.current.set(index, dataUrl);
      setPageImage(dataUrl);
    } catch (error) {
      toast.error("Sayfa görüntülenemedi: " + error.message);
    } finally {
      setRendering(false);
    }
  }, [toast]);

  useEffect(() => {
    if (pageCount > 0) renderPage(pageIndex);
  }, [pageIndex, pageCount, docVersion, renderPage]);

  const handleFile = async (event) => {
    const file = event.target.files && event.target.files[0];
    event.target.value = "";
    if (!file) return;

    setRendering(true);
    try {
      const buffer = await file.arrayBuffer();
      const doc = await pdfjsLib.getDocument({ data: buffer }).promise;

      docRef.current = doc;
      pageCacheRef.current = new Map();
      setFileName(file.name);
      setPageCount(doc.numPages);
      setPageIndex(1);
      setCrop(undefined);
      setPageImage(null);
      setDocVersion((version) => version + 1);
    } catch (error) {
      toast.error("PDF açılamadı: " + error.message);
      setRendering(false);
    }
  };

  const readCrop = () => {
    if (!crop || !crop.width || !crop.height || !imageRef.current) {
      toast.error("Önce sayfa üzerinde bir alan seçin");
      return null;
    }
    return cropImageElement(imageRef.current, crop);
  };

  const addQuestion = () => {
    const image = readCrop();
    if (!image) return;

    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    setItems((current) => [
      ...current,
      {
        id,
        questionImage: image,
        solutionImage: null,
        subject: defaults.subject,
        difficulty: defaults.difficulty,
        answer: "A",
        page: pageIndex,
      },
    ]);
    setTargetId(id);
    setCrop(undefined);
  };

  const addSolution = () => {
    if (!targetId) {
      toast.error("Önce çözümün ait olduğu soruyu seçin");
      return;
    }

    const image = readCrop();
    if (!image) return;

    setItems((current) =>
      current.map((item) => (item.id === targetId ? { ...item, solutionImage: image } : item))
    );
    setCrop(undefined);
    toast.success("Çözüm eklendi");
  };

  const updateItem = (id, patch) => {
    setItems((current) => current.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  };

  const removeItem = (id) => {
    setItems((current) => current.filter((item) => item.id !== id));
    setTargetId((current) => (current === id ? null : current));
  };

  const applyDefaultsToAll = () => {
    setItems((current) => current.map((item) => ({ ...item, ...defaults })));
    toast.info("Konu ve zorluk tüm sorulara uygulandı");
  };

  const saveAll = async () => {
    if (items.length === 0) return;

    setSaving(true);
    try {
      // Görseller tek tek doğrudan Blob'a gider; kayıt isteği sadece URL
      // taşıdığı için toplu aktarım Vercel'in istek gövdesi sınırına takılmaz.
      const entries = [];
      items.forEach((item) => {
        entries.push({ dataUrl: item.questionImage, prefix: "soru" });
        entries.push({ dataUrl: item.solutionImage, prefix: "cozum" });
      });

      const urls = await uploadMany(entries, (done, total) =>
        setUploadProgress({ done, total })
      );

      const payload = items.map((item, index) => ({
        questionUrl: urls[index * 2],
        solutionUrl: urls[index * 2 + 1],
        subject: item.subject,
        difficulty: item.difficulty,
        answer: item.answer,
      }));

      const { saved } = await api.createQuestionsBulk(payload);
      toast.success(`${saved.length} soru kaydedildi`);
      setItems([]);
      setTargetId(null);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setSaving(false);
      setUploadProgress(null);
    }
  };

  const targetIndex = items.findIndex((item) => item.id === targetId);
  const solutionCount = items.filter((item) => item.solutionImage).length;

  return (
    <>
      <Header />
      <main className="page">
        <div className="container stack">
          <div className="page-head">
            <h1>PDF'ten toplu soru çek</h1>
            <p className="sub">
              PDF sayfası üzerinde soruyu kutu içine alıp listeye ekleyin. Çözümleri de aynı
              şekilde ilgili sorunun üzerine iliştirebilirsiniz.
            </p>
          </div>

          <section className="card">
            <div className="row-between">
              <div className="stack-sm">
                <span className="card-title">{fileName || "PDF seçilmedi"}</span>
                {pageCount > 0 && (
                  <span className="card-hint">
                    {pageCount} sayfa · {pageIndex}. sayfa görüntüleniyor
                  </span>
                )}
              </div>
              <label className="btn btn-outline btn-sm" style={{ cursor: "pointer" }}>
                {pageCount > 0 ? "Başka PDF" : "PDF seç"}
                <input
                  type="file"
                  accept="application/pdf"
                  className="visually-hidden-input"
                  onChange={handleFile}
                />
              </label>
            </div>

            {pageCount === 0 ? (
              <div className="empty" style={{ marginTop: 16 }}>
                <strong>Bir PDF yükleyin</strong>
                Sayfalar burada görüntülenecek, soruları kırparak toplu şekilde
                soru bankasına aktarabileceksiniz.
              </div>
            ) : (
              <>
                <div className="pdf-toolbar">
                  <button
                    type="button"
                    className="btn btn-outline btn-sm"
                    disabled={pageIndex <= 1}
                    onClick={() => setPageIndex((page) => Math.max(1, page - 1))}
                  >
                    ‹ Önceki
                  </button>
                  <span className="badge badge-brand">
                    {pageIndex} / {pageCount}
                  </span>
                  <button
                    type="button"
                    className="btn btn-outline btn-sm"
                    disabled={pageIndex >= pageCount}
                    onClick={() => setPageIndex((page) => Math.min(pageCount, page + 1))}
                  >
                    Sonraki ›
                  </button>
                </div>

                <div className="crop-stage pdf-stage">
                  {rendering && (
                    <div className="stage-loading">
                      <span className="spinner spinner-dark" /> Sayfa hazırlanıyor…
                    </div>
                  )}
                  {pageImage && (
                    <ReactCrop crop={crop} onChange={(pixelCrop) => setCrop(pixelCrop)}>
                      <img ref={imageRef} src={pageImage} alt={`Sayfa ${pageIndex}`} />
                    </ReactCrop>
                  )}
                </div>

                <div className="row" style={{ marginTop: 14 }}>
                  <button type="button" className="btn btn-primary btn-sm" onClick={addQuestion}>
                    + Soru olarak ekle
                  </button>
                  <button
                    type="button"
                    className="btn btn-outline btn-sm"
                    onClick={addSolution}
                    disabled={!targetId}
                  >
                    {targetIndex >= 0
                      ? `Çözüm olarak ekle (#${targetIndex + 1})`
                      : "Çözüm olarak ekle"}
                  </button>
                  {crop && crop.width > 0 && (
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      onClick={() => setCrop(undefined)}
                    >
                      Seçimi temizle
                    </button>
                  )}
                </div>
              </>
            )}
          </section>

          <section className="card">
            <div className="card-head">
              <span className="card-title">Yeni eklenenler için varsayılan</span>
              {items.length > 0 && (
                <button type="button" className="btn btn-ghost btn-sm" onClick={applyDefaultsToAll}>
                  Hepsine uygula
                </button>
              )}
            </div>
            <div className="form-grid">
              <div className="field" style={{ gridColumn: "1 / -1" }}>
                <label>Konu</label>
                <SubjectSelect
                  value={defaults.subject}
                  onChange={(subject) => setDefaults((d) => ({ ...d, subject }))}
                />
              </div>
              <div className="field">
                <label>Zorluk</label>
                <DifficultySelect
                  value={defaults.difficulty}
                  onChange={(difficulty) => setDefaults((d) => ({ ...d, difficulty }))}
                />
              </div>
            </div>
          </section>

          <section className="stack">
            <div className="row-between">
              <h2>Aktarılacak sorular ({items.length})</h2>
              {items.length > 0 && (
                <span className="badge">{solutionCount} çözümlü</span>
              )}
            </div>

            {items.length === 0 ? (
              <div className="empty">
                <strong>Henüz soru eklemediniz</strong>
                Sayfa üzerinde bir soruyu kutu içine alıp “Soru olarak ekle” deyin.
              </div>
            ) : (
              <div className="staged-grid">
                {items.map((item, index) => (
                  <article
                    key={item.id}
                    className={`card staged-card ${item.id === targetId ? "is-target" : ""}`}
                  >
                    <div className="row-between">
                      <span className="badge badge-brand">#{index + 1}</span>
                      <span className="card-hint">Sayfa {item.page}</span>
                    </div>

                    <div className="staged-images">
                      <figure>
                        <figcaption>Soru</figcaption>
                        <img src={item.questionImage} alt={`${index + 1}. soru`} />
                      </figure>
                      {item.solutionImage && (
                        <figure>
                          <figcaption>Çözüm</figcaption>
                          <img src={item.solutionImage} alt={`${index + 1}. çözüm`} />
                        </figure>
                      )}
                    </div>

                    <div className="stack-sm">
                      <SubjectSelect
                        value={item.subject}
                        onChange={(subject) => updateItem(item.id, { subject })}
                      />
                      <div className="row" style={{ flexWrap: "nowrap" }}>
                        <DifficultySelect
                          value={item.difficulty}
                          onChange={(difficulty) => updateItem(item.id, { difficulty })}
                        />
                        <AnswerSelect
                          value={item.answer}
                          onChange={(answer) => updateItem(item.id, { answer })}
                        />
                      </div>
                    </div>

                    <div className="row">
                      <button
                        type="button"
                        className={`btn btn-sm ${item.id === targetId ? "btn-primary" : "btn-outline"}`}
                        onClick={() => setTargetId(item.id)}
                      >
                        {item.id === targetId ? "Çözüm hedefi ✓" : "Çözüm hedefi yap"}
                      </button>
                      {item.solutionImage && (
                        <button
                          type="button"
                          className="btn btn-ghost btn-sm"
                          onClick={() => updateItem(item.id, { solutionImage: null })}
                        >
                          Çözümü sil
                        </button>
                      )}
                      <button
                        type="button"
                        className="btn btn-danger btn-sm"
                        onClick={() => removeItem(item.id)}
                      >
                        Sil
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>
      </main>

      {items.length > 0 && (
        <div className="action-bar">
          <div className="container row-between">
            <span className="text-sm">
              {uploadProgress ? (
                <>
                  Görseller yükleniyor: <strong>{uploadProgress.done}</strong> /{" "}
                  {uploadProgress.total}
                </>
              ) : (
                <>
                  <strong>{items.length}</strong> soru kaydedilecek
                </>
              )}
            </span>
            <button type="button" className="btn btn-primary" onClick={saveAll} disabled={saving}>
              {saving ? (
                <>
                  <span className="spinner" /> Kaydediliyor…
                </>
              ) : (
                "Tümünü kaydet"
              )}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
