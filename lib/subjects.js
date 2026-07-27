// Konu listesi tek kaynaktan yonetilir; onceden ayni dizi uc ayri sayfada
// kopyalanmisti ve "Olasilik Dagilimlari" iki kez geciyordu.
export const SUBJECT_GROUPS = [
  {
    group: "Sayılar",
    items: [
      "Doğal Sayılar",
      "Tam Sayılar",
      "Rasyonel Sayılar",
      "İrrasyonel Sayılar",
      "Reel Sayılar",
    ],
  },
  {
    group: "Denklemler ve Eşitsizlikler",
    items: [
      "Birinci Dereceden Denklemler ve Eşitsizlikler",
      "İkinci Dereceden Denklemler ve Eşitsizlikler",
      "Mutlak Değer Denklemleri ve Eşitsizlikleri",
      "Rasyonel Denklemler ve Eşitsizlikler",
    ],
  },
  {
    group: "Fonksiyonlar",
    items: [
      "Fonksiyon Kavramı ve Fonksiyonların Gösterimi",
      "Fonksiyonların Özellikleri",
      "Birleşik Fonksiyon",
      "Ters Fonksiyon",
    ],
  },
  {
    group: "Polinomlar",
    items: [
      "Polinom Kavramı",
      "Polinomlarda İşlemler",
      "Polinomların Çarpanlara Ayrılması",
      "Polinomların Kökleri ve Katsayıları Arasındaki İlişkiler",
    ],
  },
  {
    group: "Karmaşık Sayılar",
    items: [
      "Karmaşık Sayı Kavramı",
      "Karmaşık Sayılarla İşlemler",
      "Karmaşık Sayıların Kutupsal ve Üstel Gösterimi",
    ],
  },
  {
    group: "Üstel ve Logaritmik Fonksiyonlar",
    items: [
      "Üstel Fonksiyonların Tanımı ve Özellikleri",
      "Logaritma Fonksiyonunun Tanımı ve Özellikleri",
      "Logaritmik Fonksiyonların Tanımı ve Özellikleri",
      "Üstel ve Logaritmik Denklemler ve Eşitsizlikler",
    ],
  },
  {
    group: "Kümeler",
    items: ["Kümeler ve Alt Kümeler", "Kümelerde İşlemler", "Kartezyen Çarpım", "Venn Şemaları"],
  },
  {
    group: "Sayma ve Olasılık",
    items: [
      "Permütasyon Kavramı ve Hesaplamaları",
      "Kombinasyon Kavramı ve Hesaplamaları",
      "Binom Teoremi ve Binom Açılımı",
      "Temel Olasılık Kavramları",
      "Olasılık Kuralları",
      "Koşullu Olasılık",
      "Bağımsız ve Bağımlı Olaylar",
      "Olasılık Dağılımları",
    ],
  },
  {
    group: "İstatistik",
    items: [
      "Veri Toplama ve Düzenleme",
      "Merkezi Eğilim ve Yayılma Ölçüleri",
      "İstatistiksel Grafikler",
    ],
  },
  {
    group: "Trigonometri",
    items: [
      "Trigonometrik Fonksiyonlar",
      "Trigonometrik Kimlikler",
      "Trigonometrik Denklemler ve Eşitsizlikler",
      "Trigonometrik Fonksiyonların Grafikleri",
    ],
  },
  {
    group: "Diziler ve Seriler",
    items: [
      "Aritmetik Diziler ve Seriler",
      "Geometrik Diziler ve Seriler",
      "Harmonik Diziler",
      "Dizilerde Limit ve Yakınsama",
    ],
  },
  {
    group: "Matris ve Determinant",
    items: [
      "Matris Kavramı ve Matrislerde İşlemler",
      "Determinant Kavramı ve Hesaplamaları",
      "Matris ve Determinant Uygulamaları",
    ],
  },
  {
    group: "Analitik Geometri",
    items: [
      "Doğrunun Analitik İncelenmesi",
      "Çemberin Analitik İncelenmesi",
      "Elips",
      "Hiperbol",
      "Parabol",
    ],
  },
  {
    group: "Geometri",
    items: [
      "Doğrular ve Açı Kavramı",
      "Üçgenler",
      "Çokgenler",
      "Daire ve Daire Dilimleri",
      "Uzay Geometri",
    ],
  },
  {
    group: "Türev",
    items: [
      "Türev Kavramı",
      "Türev Alma Kuralları",
      "Türev Uygulamaları",
      "Fonksiyonların Maksimum ve Minimum Değerleri",
      "Fonksiyonların Eğimi ve Teğet Doğruları",
    ],
  },
  {
    group: "İntegral",
    items: [
      "İntegral Kavramı",
      "Belirli ve Belirsiz İntegraller",
      "İntegral Alma Kuralları",
      "İntegral Uygulamaları",
      "Alan Hesaplamaları",
    ],
  },
];

export const SUBJECTS = SUBJECT_GROUPS.flatMap((group) => group.items);

export const DIFFICULTIES = ["Kolay", "Orta", "Zor"];

export const ANSWER_KEYS = ["A", "B", "C", "D", "E"];
