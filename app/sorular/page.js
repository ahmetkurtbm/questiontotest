"use client";

import { useCallback, useEffect, useState } from "react";
import Header from "@/components/Header";
import {
  AnswerSelect,
  DifficultyBadge,
  DifficultySelect,
  SubjectSelect,
} from "@/components/MetaFields";
import { useToast } from "@/components/Toast";
import { api } from "@/lib/api";

const PAGE_SIZE = 12;
const EMPTY_FILTER = { subject: "", difficulty: "", answer: "", search: "" };

export default function QuestionBank() {
  const toast = useToast();
  const [filter, setFilter] = useState(EMPTY_FILTER);
  const [appliedFilter, setAppliedFilter] = useState(EMPTY_FILTER);
  const [page, setPage] = useState(1);
  const [result, setResult] = useState({ items: [], total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState(null);

  // Arama kutusuna her harfte istek atmamak icin kisa bir gecikme.
  useEffect(() => {
    const timer = setTimeout(() => setAppliedFilter(filter), 300);
    return () => clearTimeout(timer);
  }, [filter]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      // Filtreler sunucuda tum veri setine uygulaniyor; onceden sadece
      // ekrandaki 8 kayit filtrelendigi icin arama ise yaramiyordu.
      setResult(await api.listQuestions({ ...appliedFilter, page, pageSize: PAGE_SIZE }));
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  }, [appliedFilter, page, toast]);

  useEffect(() => {
    load();
  }, [load]);

  const setFilterField = (key, value) => {
    setFilter((current) => ({ ...current, [key]: value }));
    setPage(1);
  };

  const handleSave = async (question, patch) => {
    try {
      const updated = await api.updateQuestion(question.id, patch);
      setResult((current) => ({
        ...current,
        items: current.items.map((item) => (item.id === updated.id ? updated : item)),
      }));
      setDetail((current) => (current && current.id === updated.id ? updated : current));
      toast.success(`${updated.no}. soru güncellendi`);
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleDelete = async (question) => {
    if (!window.confirm(`${question.no}. soru silinsin mi?`)) return;

    try {
      await api.deleteQuestion(question.id);
      toast.success("Soru silindi");
      setDetail(null);
      load();
    } catch (error) {
      toast.error(error.message);
    }
  };

  const hasFilter = Object.values(filter).some(Boolean);

  return (
    <>
      <Header />
      <main className="page">
        <div className="container stack">
          <div className="page-head">
            <h1>Soru bankası</h1>
            <p className="sub">
              {result.total} soru kayıtlı. Konu, zorluk veya cevaba göre filtreleyip
              düzenleyebilirsiniz.
            </p>
          </div>

          <section className="card">
            <div className="filter-grid">
              <div className="field" style={{ gridColumn: "1 / -1" }}>
                <label>Ara</label>
                <input
                  className="input"
                  type="search"
                  placeholder="Soru no, konu veya zorluk…"
                  value={filter.search}
                  onChange={(e) => setFilterField("search", e.target.value)}
                />
              </div>
              <div className="field">
                <label>Konu</label>
                <SubjectSelect
                  allowAny
                  value={filter.subject}
                  onChange={(value) => setFilterField("subject", value)}
                />
              </div>
              <div className="field">
                <label>Zorluk</label>
                <DifficultySelect
                  allowAny
                  value={filter.difficulty}
                  onChange={(value) => setFilterField("difficulty", value)}
                />
              </div>
              <div className="field">
                <label>Cevap</label>
                <AnswerSelect
                  allowAny
                  value={filter.answer}
                  onChange={(value) => setFilterField("answer", value)}
                />
              </div>
              {hasFilter && (
                <div className="field" style={{ justifyContent: "flex-end" }}>
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    onClick={() => {
                      setFilter(EMPTY_FILTER);
                      setPage(1);
                    }}
                  >
                    Filtreleri temizle
                  </button>
                </div>
              )}
            </div>
          </section>

          {loading ? (
            <div className="empty">
              <span className="spinner spinner-dark" style={{ margin: "0 auto" }} />
            </div>
          ) : result.items.length === 0 ? (
            <div className="empty">
              <strong>Soru bulunamadı</strong>
              {hasFilter ? "Filtreleri gevşetmeyi deneyin." : "İlk sorunuzu ekleyerek başlayın."}
            </div>
          ) : (
            <div className="question-grid">
              {result.items.map((question) => (
                <QuestionCard
                  key={question.id}
                  question={question}
                  onOpen={() => setDetail(question)}
                  onSave={handleSave}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )}

          {result.totalPages > 1 && (
            <Pagination page={page} totalPages={result.totalPages} onChange={setPage} />
          )}
        </div>
      </main>

      {detail && (
        <div className="modal-backdrop" onClick={() => setDetail(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <h2>{detail.no}. soru</h2>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => setDetail(null)}>
                Kapat
              </button>
            </div>
            <div className="detail-images">
              <figure>
                <figcaption>Soru</figcaption>
                <img src={detail.questionUrl} alt="Soru" />
              </figure>
              {detail.solutionUrl ? (
                <figure>
                  <figcaption>Çözüm</figcaption>
                  <img src={detail.solutionUrl} alt="Çözüm" />
                </figure>
              ) : (
                <div className="empty text-sm">Bu soruya çözüm eklenmemiş.</div>
              )}
            </div>
            <div className="row" style={{ marginTop: 16 }}>
              <DifficultyBadge value={detail.difficulty} />
              <span className="badge">Cevap {detail.answer}</span>
              <span className="badge">{detail.subject}</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function QuestionCard({ question, onOpen, onSave, onDelete }) {
  // Her kartin kendi taslagi var; onceden tek bir formData tum kartlari
  // birbirine baglayip yanlis kaydetmelere yol aciyordu.
  const [draft, setDraft] = useState({
    subject: question.subject,
    difficulty: question.difficulty,
    answer: question.answer,
  });

  useEffect(() => {
    setDraft({
      subject: question.subject,
      difficulty: question.difficulty,
      answer: question.answer,
    });
  }, [question]);

  const dirty =
    draft.subject !== question.subject ||
    draft.difficulty !== question.difficulty ||
    draft.answer !== question.answer;

  return (
    <article className="card question-card">
      <div className="row-between">
        <span className="badge badge-brand">Soru {question.no}</span>
        <div className="row" style={{ gap: 6 }}>
          <DifficultyBadge value={question.difficulty} />
          {question.solutionUrl && <span className="badge">Çözümlü</span>}
        </div>
      </div>

      <button type="button" className="question-thumb" onClick={onOpen}>
        <img src={question.questionUrl} alt={`${question.no}. soru`} />
        <span className="question-thumb-hint">Büyüt</span>
      </button>

      <div className="stack-sm">
        <SubjectSelect value={draft.subject} onChange={(subject) => setDraft((d) => ({ ...d, subject }))} />
        <div className="row" style={{ flexWrap: "nowrap" }}>
          <DifficultySelect
            value={draft.difficulty}
            onChange={(difficulty) => setDraft((d) => ({ ...d, difficulty }))}
          />
          <AnswerSelect value={draft.answer} onChange={(answer) => setDraft((d) => ({ ...d, answer }))} />
        </div>
      </div>

      <div className="row">
        <button
          type="button"
          className="btn btn-primary btn-sm"
          disabled={!dirty}
          onClick={() => onSave(question, draft)}
        >
          {dirty ? "Kaydet" : "Kayıtlı"}
        </button>
        <span className="spacer" />
        <button type="button" className="btn btn-danger btn-sm" onClick={() => onDelete(question)}>
          Sil
        </button>
      </div>
    </article>
  );
}

function Pagination({ page, totalPages, onChange }) {
  // Cok sayfada butonlar tasmasin diye pencere halinde gosteriliyor.
  const reach = 2;
  const pages = [];
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || Math.abs(i - page) <= reach) pages.push(i);
    else if (pages[pages.length - 1] !== "…") pages.push("…");
  }

  return (
    <nav className="pagination">
      <button
        type="button"
        className="btn btn-outline btn-sm"
        disabled={page <= 1}
        onClick={() => onChange(page - 1)}
      >
        ‹
      </button>
      {pages.map((item, index) =>
        item === "…" ? (
          <span key={`gap-${index}`} className="muted">
            …
          </span>
        ) : (
          <button
            key={item}
            type="button"
            className={`btn btn-sm ${item === page ? "btn-primary" : "btn-outline"}`}
            onClick={() => onChange(item)}
          >
            {item}
          </button>
        )
      )}
      <button
        type="button"
        className="btn btn-outline btn-sm"
        disabled={page >= totalPages}
        onClick={() => onChange(page + 1)}
      >
        ›
      </button>
    </nav>
  );
}
