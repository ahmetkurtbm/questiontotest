"use client";

import { ToastContainer, toast } from "react-toastify";
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Modal } from "flowbite-react";
import Cookies from "js-cookie";
import Header from "./Header";
import "react-toastify/dist/ReactToastify.css";
import "./AllQuestions.css";

export default function AllQuestions() {
  const navigate = useNavigate();

  useEffect(() => {
    if (Cookies.get("login") !== "tahsin") {
      navigate("/login");
    }
    const handleGetQuestionCount = async () => {
      try {
        const response = await fetch(`http://localhost:5000/questionsCount`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });
        if (response.ok) {
          const count = await response.json();
          setTotalQuestions(count);
        }
      } catch (error) {
        console.error(error);
      }
    };
    handleGetQuestionCount();
  }, [navigate]);

  const [questions, setQuestions] = useState([]);
  const [filter, setFilter] = useState({
    difficulty: "",
    subject: "",
    answer: "",
    search: "",
    number: "",
  });
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    id: "",
    difficulty: "",
    subject: "",
    answer: "",
  });

  const [openModal, setOpenModal] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState();

  const pageNumbers = [];

  useEffect(() => {
    setLoading(true);
    const fetchQuestions = async () => {
      try {
        const response = await fetch(`http://localhost:5000/questions`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            pageNumber: currentPage,
          }),
        });
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        const data = await response.json();
        setQuestions(data);
      } catch (error) {
        console.error("Error fetching questions:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchQuestions();
  }, [currentPage]);

  const handleDelete = async (id) => {
    try {
      const response = await fetch(`http://localhost:5000/question/${id}`, {
        method: "DELETE",
      });
      if (response.ok) {
        setQuestions(questions.filter((question) => question._id !== id));
        toast.success("Soru Başarıyla Silindi!", {
          autoClose: 3000,
        });
      } else {
        console.error("Error deleting question:", response.statusText);
        toast.success("Soru Silinirken Bir Hata Oluştu!", {
          autoClose: 3000,
        });
      }
    } catch (error) {
      console.error("Error deleting question:", error);
      toast.success("Soru Silinirken Bir Hata Oluştu!", {
        autoClose: 3000,
      });
    }
  };

  const subjects = [
    "Doğal Sayılar",
    "Tam Sayılar",
    "Rasyonel Sayılar",
    "İrrasyonel Sayılar",
    "Reel Sayılar",
    "Karmaşık Sayılar",
    "Birinci Dereceden Denklemler ve Eşitsizlikler",
    "İkinci Dereceden Denklemler ve Eşitsizlikler",
    "Mutlak Değer Denklemleri ve Eşitsizlikleri",
    "Rasyonel Denklemler ve Eşitsizlikler",
    "Fonksiyon Kavramı ve Fonksiyonların Gösterimi",
    "Fonksiyonların Özellikleri",
    "Birleşik Fonksiyon",
    "Ters Fonksiyon",
    "Polinom Kavramı",
    "Polinomlarda İşlemler",
    "Polinomların Çarpanlara Ayrılması",
    "Polinomların Kökleri ve Katsayıları Arasındaki İlişkiler",
    "Karmaşık Sayı Kavramı",
    "Karmaşık Sayılarla İşlemler",
    "Karmaşık Sayıların Kutupsal ve Üstel Gösterimi",
    "Logaritma Fonksiyonunun Tanımı ve Özellikleri",
    "Logaritmik Denklemler ve Eşitsizlikler",
    "Üstel Fonksiyonların Tanımı ve Özellikleri",
    "Logaritmik Fonksiyonların Tanımı ve Özellikleri",
    "Üstel ve Logaritmik Denklemler ve Eşitsizlikler",
    "Kümeler ve Alt Kümeler",
    "Kümelerde İşlemler",
    "Kartezyen Çarpım",
    "Venn Şemaları",
    "Permütasyon Kavramı ve Hesaplamaları",
    "Kombinasyon Kavramı ve Hesaplamaları",
    "Binom Teoremi ve Binom Açılımı",
    "Temel Olasılık Kavramları",
    "Olasılık Kuralları",
    "Koşullu Olasılık",
    "Bağımsız ve Bağımlı Olaylar",
    "Olasılık Dağılımları",
    "Veri Toplama ve Düzenleme",
    "Merkezi Eğilim ve Yayılma Ölçüleri",
    "Olasılık Dağılımları",
    "İstatistiksel Grafikler",
    "Trigonometrik Fonksiyonlar",
    "Trigonometrik Denklemler ve Eşitsizlikler",
    "Trigonometrik Kimlikler",
    "Trigonometrik Fonksiyonların Grafikleri",
    "Aritmetik Diziler ve Seriler",
    "Geometrik Diziler ve Seriler",
    "Harmonik Diziler",
    "Dizilerde Limit ve Yakınsama",
    "Matris Kavramı ve Matrislerde İşlemler",
    "Determinant Kavramı ve Hesaplamaları",
    "Matris ve Determinant Uygulamaları",
    "Doğrunun Analitik İncelenmesi",
    "Çemberin Analitik İncelenmesi",
    "Elips",
    "Hiperbol",
    "Parabol",
    "Doğrular ve Açı Kavramı",
    "Üçgenler",
    "Çokgenler",
    "Daire ve Daire Dilimleri",
    "Uzay Geometri",
    "Türev Kavramı",
    "Türev Alma Kuralları",
    "Türev Uygulamaları",
    "Fonksiyonların Maksimum ve Minimum Değerleri",
    "Fonksiyonların Eğimi ve Teğet Doğruları",
    "İntegral Kavramı",
    "Belirli ve Belirsiz İntegraller",
    "İntegral Alma Kuralları",
    "İntegral Uygulamaları",
    "Alan Hesaplamaları",
  ];

  const handleFilterChange = (e) => {
    setFilter({ ...filter, [e.target.name]: e.target.value });
  };

  const filteredQuestions = questions.filter((question) => {
    const numberTemp = filter.number.toString();
    const questionNoTemp = question.no.toString();
    return (
      (filter.difficulty ? question.difficulty === filter.difficulty : true) &&
      (filter.subject ? question.subject === filter.subject : true) &&
      (filter.answer ? question.answer === filter.answer : true) &&
      (numberTemp ? questionNoTemp === numberTemp : true) &&
      (filter.search
        ? question.subject
            .toLowerCase()
            .includes(filter.search.toLowerCase()) ||
          question.difficulty
            .toLowerCase()
            .includes(filter.search.toLowerCase()) ||
          questionNoTemp.toLowerCase().includes(filter.search.toLowerCase()) ||
          question.answer.toLowerCase().includes(filter.search.toLowerCase())
        : true)
    );
  });

  const handleFormChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleGetQuestion = async (e, id) => {
    e.preventDefault();
    try {
      const response = await fetch(`http://localhost:5000/question/${id}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });
      if (response.ok) {
        const getQuestion = await response.json();
        console.log(getQuestion);
        setSelectedQuestion(getQuestion);
        setOpenModal(true);

        toast.success("Soru Başarıyla Getirildi!", {
          autoClose: 3000,
        });
      } else {
        console.error("Error updating question:", response.statusText);
        toast.warning("Soru Getirilirken Hata Oluştu!", {
          autoClose: 3000,
        });
      }
    } catch (error) {
      console.error("Error updating question:", error);
      toast.warning("Soru Getirilirken Hata Oluştu!", {
        autoClose: 3000,
      });
    }
  };

  const handleFormSubmit = async (e, id) => {
    e.preventDefault();
    try {
      const response = await fetch(`http://localhost:5000/question/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          difficulty: formData.difficulty || undefined,
          subject: formData.subject || undefined,
          answer: formData.answer || undefined,
        }),
      });
      if (response.ok) {
        const updatedQuestion = await response.json();
        setQuestions(
          questions.map((question) =>
            question._id === id ? updatedQuestion : question
          )
        );
        toast.success("Soru Başarıyla Güncellendi!", {
          autoClose: 3000,
        });
      } else {
        console.error("Error updating question:", response.statusText);
        toast.warning("Soru Güncellenirken Hata Oluştu!", {
          autoClose: 3000,
        });
      }
    } catch (error) {
      console.error("Error updating question:", error);
      toast.warning("Soru Güncellenirken Hata Oluştu!", {
        autoClose: 3000,
      });
    }
  };

  for (
    let i = 1;
    i <= Math.ceil(totalQuestions["totalQuestions"] / itemsPerPage);
    i++
  ) {
    pageNumbers.push(i);
  }

  return (
    <div className="all-questions-main">
      <Header />
      <ToastContainer />
      <div className="all-questions-header">
        <div className="question-change-info-header">
          <select
            className="select-zorluk"
            name="difficulty"
            value={filter.difficulty}
            onChange={handleFilterChange}
          >
            <option value="">Zorluk Seçin</option>
            <option value="Kolay">Kolay</option>
            <option value="Orta">Orta</option>
            <option value="Zor">Zor</option>
          </select>
          <select
            className="select-konu"
            name="subject"
            value={filter.subject}
            onChange={handleFilterChange}
          >
            <option value="">Konu Seçin</option>
            {subjects.map((subj, index) => (
              <option key={index} value={subj}>
                {subj}
              </option>
            ))}
          </select>
          <input
            type="number"
            name="number"
            className="numberSearch"
            placeholder="Soru Numarası Girin"
            value={filter.number}
            onChange={handleFilterChange}
          />
        </div>
        <div className="search">
          <input
            type="text"
            name="search"
            placeholder="Ara..."
            value={filter.search}
            onChange={handleFilterChange}
          />
        </div>
      </div>
      <div className="question-container">
        {loading ? (
          <h2>Yükleniyor...</h2>
        ) : (
          filteredQuestions.map((question) => (
            <div key={question._id} className="question">
              <form
                onSubmit={(e) => handleFormSubmit(e, question._id)}
                className="question-form"
              >
                <p>
                  <strong>Soru : </strong> {question.no}
                </p>
                <img
                  className="question-img"
                  src={question.fileQuestion}
                  alt="img"
                  onClick={(e) => handleGetQuestion(e, question._id)}
                />
                <p>
                  <strong>Cevap : </strong> {question.no}
                </p>
                <img
                  className="question-img"
                  src={question.fileAnswer}
                  alt="img"
                  onClick={(e) => handleGetQuestion(e, question._id)}
                />
                <div className="question-details">
                  <p>
                    <strong>Konu : </strong> {question.subject}
                  </p>
                  {/* <p>
                  <strong>Zorluk : </strong> {question.difficulty}
                </p>
                <p>
                  <strong>Cevap : </strong> {question.answer}
                </p> */}
                </div>
                <div className="question-change">
                  <div className="question-change-info">
                    <select
                      className="select-konu"
                      name="subject"
                      value={formData.subject || question.subject}
                      onChange={handleFormChange}
                    >
                      {subjects.map((subj, index) => (
                        <option key={index} value={subj}>
                          {subj}
                        </option>
                      ))}
                    </select>

                    <select
                      className="select-zorluk"
                      name="difficulty"
                      value={formData.difficulty || question.difficulty}
                      onChange={handleFormChange}
                    >
                      <option value="Kolay">Kolay</option>
                      <option value="Orta">Orta</option>
                      <option value="Zor">Zor</option>
                    </select>

                    <select
                      className="select-zorluk"
                      name="answer"
                      value={formData.answer || question.answer}
                      onChange={handleFormChange}
                    >
                      <option value="A">A</option>
                      <option value="B">B</option>
                      <option value="C">C</option>
                      <option value="D">D</option>
                      <option value="E">E</option>
                    </select>
                  </div>
                  <div className="question-button">
                    <button className="update-button" type="submit">
                      Kaydet
                    </button>
                    <button
                      className="delete-button"
                      type="button"
                      onClick={() => handleDelete(question._id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </form>
            </div>
          ))
        )}
      </div>
      <div className="pagi-line"></div>
      <div className="pagination">
        {pageNumbers.map((number) => (
          <button
            key={number}
            onClick={() => setCurrentPage(number)}
            className={currentPage === number ? "active" : ""}
          >
            {number}
          </button>
        ))}
      </div>

      {selectedQuestion ? (
        <div
          className="modal-overlay"
          style={{ zIndex: openModal ? 1000 : -1000 }}
        >
          <Modal
            show={openModal}
            onClose={() => setOpenModal(false)}
            style={{
              width: "100%",
              height: "55rem",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              margin: "auto",
              zIndex: 1001,
              borderRadius: "20px",
            }}
            popup
            size="md"
          >
            <Modal.Header>
              {/* <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  width: "100%",
                }}
              >
                <button
                  className="btn btn-danger"
                  style={{
                    color: "white",
                    backgroundColor: "red",
                    width: "10%",
                    padding: "0.5rem 1rem",
                  }}
                  onClick={() => setOpenModal(false)}
                >
                  Kapat
                </button>
              </div> */}
            </Modal.Header>
            <Modal.Body style={{ height: "100%", width: "100%" }}>
              <div className="question-container-modal">
                <form
                  onSubmit={(e) => handleFormSubmit(e, selectedQuestion._id)}
                  className="question-form-modal"
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "center",
                      gap: "1rem",
                    }}
                  >
                    <div style={{ width: "50%" }}>
                      <p>
                        <strong>Soru</strong>
                      </p>

                      <img
                        className="question-img-modal"
                        src={selectedQuestion.fileQuestion}
                        alt="img"
                      />
                    </div>
                    <div style={{ width: "50%" }}>
                      <p>
                        <strong>Cevap</strong>
                      </p>
                      <img
                        className="question-img-modal"
                        src={selectedQuestion.fileAnswer}
                        alt="img"
                      />
                    </div>
                  </div>

                  <div className="question-details">
                    <p>
                      <strong>Konu : </strong> {selectedQuestion.subject}
                    </p>
                  </div>
                  <div className="question-change">
                    <div className="question-change-info">
                      <select
                        className="select-konu"
                        name="subject"
                        value={formData.subject || selectedQuestion.subject}
                        onChange={handleFormChange}
                      >
                        {subjects.map((subj, index) => (
                          <option key={index} value={subj}>
                            {subj}
                          </option>
                        ))}
                      </select>

                      <select
                        className="select-zorluk"
                        name="difficulty"
                        value={
                          formData.difficulty || selectedQuestion.difficulty
                        }
                        onChange={handleFormChange}
                      >
                        <option value="Kolay">Kolay</option>
                        <option value="Orta">Orta</option>
                        <option value="Zor">Zor</option>
                      </select>

                      <select
                        className="select-zorluk"
                        name="answer"
                        value={formData.answer || selectedQuestion.answer}
                        onChange={handleFormChange}
                      >
                        <option value="A">A</option>
                        <option value="B">B</option>
                        <option value="C">C</option>
                        <option value="D">D</option>
                        <option value="E">E</option>
                      </select>
                    </div>
                    <div className="question-button">
                      <button className="update-button" type="submit">
                        Kaydet
                      </button>
                      <button
                        className="delete-button"
                        type="button"
                        onClick={() => handleDelete(selectedQuestion._id)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </Modal.Body>
          </Modal>
        </div>
      ) : (
        <p>Resim Mevcut Değil</p>
      )}
    </div>
  );
}
