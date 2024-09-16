import React, { useEffect, useState } from "react";
import AddIcon from "../assets/icons/add-icon.svg";
import DeleteIcon from "../assets/icons/delete-icon.svg";
import "./CreateTest.css";
import CreateTestPdf from "./CreateTestPdf";
import CreateAnswerPdf from "./CreateAnswerPdf";
import { useNavigate } from "react-router-dom";
import Cookies from "js-cookie";
import Header from "./Header";

export default function CreateTest() {
  const navigate = useNavigate();

  useEffect(() => {
    if (Cookies.get("login") !== "tahsin") {
      navigate("/login");
    } else {
      fetch("http://localhost:5000/questions/count")
        .then((response) => {
          if (!response.ok) {
            throw new Error("Network response was not ok");
          }
          return response.json();
        })
        .then((data) => {
          setMaxCounts(data);
        })
        .catch((error) =>
          console.error("Error fetching question counts:", error)
        );
    }
  }, [navigate]);

  const [divs, setDivs] = useState([]);
  const [nextId, setNextId] = useState(0);
  const [maxCounts, setMaxCounts] = useState([]);
  const [firstDiv, setFirstDiv] = useState(["Kolay", "Doğal Sayılar", 0]);
  const [questions, setQuestions] = useState([]);

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

  const handleQuestionCount = (subject, difficulty) => {
    const topicData = maxCounts.find((item) => item.topic === subject);

    if (!topicData || topicData[difficulty.toLowerCase()] === undefined) {
      return 0;
    } else {
      return parseInt(topicData[difficulty.toLowerCase()], 10); // Sayıyı integer olarak döndür
    }
  };

  const addDiv = () => {
    setDivs((prevDivs) => [
      ...prevDivs,
      {
        id: nextId,
        subject: subjects[0],
        difficulty: "Kolay",
        count: handleQuestionCount(subjects[0], "Kolay"),
      },
    ]);
    setNextId((prevId) => prevId + 1);
  };

  const deleteRow = (id) => {
    setDivs((prevDivs) => prevDivs.filter((div) => div.id !== id));
  };

  const updateDiv = (id, key, value) => {
    setDivs((prevDivs) =>
      prevDivs.map((div) =>
        div.id === id
          ? {
              ...div,
              [key]: value,
              count: handleQuestionCount(div.subject, div.difficulty),
            }
          : div
      )
    );
  };

  const handleCreateTestInstall = async (e) => {
    e.preventDefault();
    try {
      // İlk divi divs listesine ekleyin
      const updatedDivs = [
        {
          id: "first-div",
          difficulty: firstDiv[0],
          subject: firstDiv[1],
          count: firstDiv[2],
        },
        ...divs,
      ];

      const response = await fetch("http://localhost:5000/create-test", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ selectedQuestions: updatedDivs }),
      });

      const data = await response.json();
      setQuestions(data);
    } catch (error) {
      console.error("Error creating test:", error);
    }
  };

  return (
    <div>
      <Header />
      <div className="create-main">
        <label>Soru zorluk seviyesini, konusunu, ve sayısını seçiniz</label>
        <form className="test-form" onSubmit={(e) => e.preventDefault()}>
          <button
            type="submit"
            className="btn-create-test"
            onClick={handleCreateTestInstall}
          >
            Test oluştur
          </button>
          <div className="install-test">
            {questions.length > 0 && <CreateTestPdf questions={questions} />}
            {questions.length > 0 && <CreateAnswerPdf questions={questions} />}
          </div>

          <div className="create-test">
            <div className="first-div">
              <div>
                <label>Zorluk seviyesini seçiniz</label>
                <select
                  className="select-difficulty"
                  onChange={(e) =>
                    setFirstDiv([e.target.value, firstDiv[1], firstDiv[2]])
                  }
                  value={firstDiv[0]}
                >
                  <option value="Kolay">Kolay</option>
                  <option value="Orta">Orta</option>
                  <option value="Zor">Zor</option>
                </select>
              </div>
              <div>
                <label>Konu tipini seçiniz</label>
                <select
                  className="select-subject"
                  onChange={(e) =>
                    setFirstDiv([firstDiv[0], e.target.value, firstDiv[2]])
                  }
                  value={firstDiv[1]}
                >
                  {subjects.map((subject, index) => (
                    <option key={index} value={subject}>
                      {subject}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label>Soru sayısını seçiniz</label>
                <input
                  className="select-number"
                  type="number"
                  min="0"
                  max={handleQuestionCount(firstDiv[1], firstDiv[0])}
                  value={firstDiv[2]}
                  onChange={(e) =>
                    setFirstDiv([
                      firstDiv[0],
                      firstDiv[1],
                      Number(e.target.value),
                    ])
                  }
                  placeholder="0"
                />
              </div>
            </div>
          </div>
          <div id="dynamic-container">
            {divs.map((div) => (
              <div className="dynamic-divs" key={div.id}>
                <div className="line-test"></div>
                <div className="dynamic-div-body">
                  <div className="dynamic-div">
                    <label>Zorluk seviyesini seçiniz</label>
                    <select
                      className="select-difficulty"
                      value={div.difficulty}
                      onChange={(e) =>
                        updateDiv(div.id, "difficulty", e.target.value)
                      }
                    >
                      <option value="Kolay">Kolay</option>
                      <option value="Orta">Orta</option>
                      <option value="Zor">Zor</option>
                    </select>
                  </div>
                  <div className="dynamic-div">
                    <label>Konu tipini seçiniz</label>
                    <select
                      className="select-subject"
                      value={div.subject}
                      onChange={(e) =>
                        updateDiv(div.id, "subject", e.target.value)
                      }
                    >
                      {subjects.map((subject, index) => (
                        <option key={index} value={subject}>
                          {subject}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="dynamic-div">
                    <label>Soru sayısını seçiniz</label>
                    <input
                      className="select-number"
                      type="number"
                      min="0"
                      max={handleQuestionCount(div.subject, div.difficulty)}
                      placeholder="0"
                      onChange={(e) =>
                        updateDiv(div.id, "count", e.target.value)
                      }
                    />
                  </div>
                  <img
                    onClick={() => deleteRow(div.id)}
                    src={DeleteIcon}
                    alt="delete"
                  />
                </div>
              </div>
            ))}
          </div>
          <img
            src={AddIcon}
            alt="add"
            style={{ cursor: "pointer" }}
            onClick={addDiv}
          />
        </form>
      </div>
    </div>
  );
}
