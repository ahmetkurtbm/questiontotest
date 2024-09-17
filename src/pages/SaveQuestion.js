import React, { useState } from "react";
import "./SaveQuestion.css";
import Header from "./Header";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import ReactCrop from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";

function SaveQuestion() {
  const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

  const [difficulty, setDifficulty] = useState("Kolay");
  const [subject, setSubject] = useState("Doğal Sayılar");
  const [subjectSearch, setSubjectSearch] = useState("");
  const [answer, setAnswer] = useState("A");

  const [cropQ, setCropQ] = useState();
  const [cropA, setCropA] = useState();
  const [base64question, setBase64question] = useState();
  const [outputQuestion, setOutputQuestion] = useState();
  const [base64answer, setBase64answer] = useState();
  const [outputAnswer, setOutputAnswer] = useState();

  const handleImageQ = (event) => {
    const file = event.target.files[0];

    const reader = new FileReader();

    reader.onload = function () {
      setBase64question(reader.result);
    };

    reader.readAsDataURL(file);
  };

  const handleImageA = (event) => {
    const file = event.target.files[0];

    const reader = new FileReader();

    reader.onload = function () {
      setBase64answer(reader.result);
    };

    reader.readAsDataURL(file);
  };

  const getCroppedImageQ = () => {
    const canvas = document.createElement("canvas");
    const myImage = document.getElementById("question");

    const scaleX = myImage.naturalWidth / myImage.width;
    const scaleY = myImage.naturalHeight / myImage.height;

    canvas.width = cropQ.width;
    canvas.height = cropQ.height;
    const ctx = canvas.getContext("2d");

    const pixelRatio = window.devicePixelRatio;
    canvas.width = cropQ.width * pixelRatio;
    canvas.height = cropQ.height * pixelRatio;
    ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    ctx.imageSmoothingQuality = "high";

    ctx.drawImage(
      myImage,
      cropQ.x * scaleX,
      cropQ.y * scaleY,
      cropQ.width * scaleX,
      cropQ.height * scaleY,
      0,
      0,
      cropQ.width,
      cropQ.height
    );

    // Converting to base64
    const base64Image = canvas.toDataURL("image/png", 1.0);
    setOutputQuestion(base64Image);
  };

  const getCroppedImageA = () => {
    const canvas = document.createElement("canvas");
    const myImage = document.getElementById("answer-img");

    const scaleX = myImage.naturalWidth / myImage.width;
    const scaleY = myImage.naturalHeight / myImage.height;

    canvas.width = cropA.width;
    canvas.height = cropA.height;
    const ctx = canvas.getContext("2d");

    const pixelRatio = window.devicePixelRatio;
    canvas.width = cropA.width * pixelRatio;
    canvas.height = cropA.height * pixelRatio;
    ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    ctx.imageSmoothingQuality = "high";

    ctx.drawImage(
      myImage,
      cropA.x * scaleX,
      cropA.y * scaleY,
      cropA.width * scaleX,
      cropA.height * scaleY,
      0,
      0,
      cropA.width,
      cropA.height
    );

    // Converting to base64
    const base64Image = canvas.toDataURL("image/jpeg");
    setOutputAnswer(base64Image);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const data = {
      fileQuestion:
        outputQuestion === undefined ? base64question : outputQuestion,
      fileAnswer: outputAnswer === undefined ? base64answer : outputAnswer,
      difficulty,
      subject,
      answer,
    };

    try {
      const response = await fetch(`${BACKEND_URL}/question`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        const data = await response.json();
        console.log("Success:", data);

        toast.success("Soru Başarıyla Kaydedildi!", {
          autoClose: 3000,
        });

        setTimeout(window.location.reload(), 3000);
      } else {
        console.error("Error:", response.statusText);
        toast.warning("Soru Kaydedilirken Bir Hata Oluştu!", {
          autoClose: 3000,
        });
      }
    } catch (error) {
      console.error("Error:", error);
      toast.warning("Soru Kaydedilirken Bir Hata Oluştu!", {
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

  const filteredSubjects = subjects.filter((subj) =>
    subj.toLowerCase().includes(subjectSearch.toLowerCase())
  );

  return (
    <div>
      <Header />
      <ToastContainer />
      <div className="save-question-main">
        <div className="save-question">
          <form onSubmit={handleSubmit} className="form-container">
            <div className="form-options">
              <div className="form-group">
                <label className="label-class">Soru Yükle</label>
                <div className="file-input">
                  <label className="label-class" htmlFor="file-question">
                    <i className="fa fa-2x fa-camera"></i>
                  </label>
                  <input
                    className="input-file"
                    type="file"
                    id="file-question"
                    accept="image/png, image/jpg, image/gif, image/jpeg"
                    onChange={(event) => {
                      handleImageQ(event);
                    }}
                  />
                  <label
                    className="label-class-2"
                    style={{ cursor: "pointer" }}
                    htmlFor="file-question"
                  >
                    Fotoğraf seçiniz
                  </label>
                </div>
              </div>
              <div className="form-group">
                <label className="label-class">Cevap Yükle</label>
                <div className="file-input">
                  <label className="label-class" htmlFor="file-answer">
                    <i className="fa fa-2x fa-camera"></i>
                  </label>
                  <input
                    className="input-file"
                    type="file"
                    id="file-answer"
                    accept="image/png, image/jpg, image/gif, image/jpeg"
                    onChange={(event) => {
                      handleImageA(event);
                    }}
                  />
                  <label
                    className="label-class-2"
                    style={{ cursor: "pointer" }}
                    htmlFor="file-answer"
                  >
                    Fotoğraf seçiniz
                  </label>
                </div>
              </div>
              <div className="form-group">
                <label className="label-class" htmlFor="difficulty">
                  Zorluk Seviyesi
                </label>
                <select
                  className="select-option"
                  id="difficulty"
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value)}
                >
                  <option value="Kolay">Kolay</option>
                  <option value="Orta">Orta</option>
                  <option value="Zor">Zor</option>
                </select>
              </div>
              <div className="form-group">
                <label className="label-class" htmlFor="subject">
                  Konu
                </label>
                <input
                  className="input-text"
                  type="text"
                  placeholder="Konu Ara..."
                  value={subjectSearch}
                  onChange={(e) => setSubjectSearch(e.target.value)}
                />
                <select
                  className="select-option"
                  id="subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                >
                  {filteredSubjects.map((subj, index) => (
                    <option key={index} value={subj}>
                      {subj}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="label-class" htmlFor="answer">
                  Cevap
                </label>
                <select
                  className="select-option"
                  id="answer"
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                >
                  <option value="A">A</option>
                  <option value="B">B</option>
                  <option value="C">C</option>
                  <option value="D">D</option>
                  <option value="E">E</option>
                </select>
              </div>
              <button className="btn-save-question" type="submit">
                Kaydet
              </button>
            </div>
            <div className="preview">
              <label className="question-lbl">Soru</label>

              {base64question && (
                <div className="react-crop">
                  <ReactCrop
                    crop={cropQ}
                    aspect={4 / 3}
                    onChange={(c) => setCropQ(c)}
                  >
                    <img id="question" src={base64question} alt="Selected Q" />
                  </ReactCrop>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={getCroppedImageQ}
                  >
                    Kırp
                  </button>
                </div>
              )}
              {outputQuestion && <img src={outputQuestion} alt="Cropped Q" />}
            </div>
            <div className="preview">
              <label className="answer-lbl">Cevap</label>

              {base64answer && (
                <div className="react-crop">
                  <ReactCrop
                    crop={cropA}
                    aspect={4 / 3}
                    onChange={(c) => setCropA(c)}
                  >
                    <img id="answer-img" src={base64answer} alt="Selected A" />
                  </ReactCrop>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={getCroppedImageA}
                  >
                    Kırp
                  </button>
                </div>
              )}
              {outputAnswer && <img src={outputAnswer} alt="Cropped A" />}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default SaveQuestion;
