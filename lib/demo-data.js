// Demo verisi. Görseller public/demo/ altında: her soru için bir PNG ve dört soruluk
// örnek bir deneme sayfası. Demo modunda soru bankası bu sorularla açılır; yapay zekâ
// anahtarı yokken örnek sayfada "bulunan sorular" sonucu da buradan gösterilir
// (kutular sayfa genişliği/yüksekliğine oranla, 0-1 arası).

export const DEMO_QUESTIONS = [
  {
    "url": "/demo/soru-01.png",
    "subject": "Doğal Sayılar",
    "difficulty": "Kolay",
    "answer": "A"
  },
  {
    "url": "/demo/soru-02.png",
    "subject": "Doğal Sayılar",
    "difficulty": "Orta",
    "answer": "B"
  },
  {
    "url": "/demo/soru-03.png",
    "subject": "Tam Sayılar",
    "difficulty": "Kolay",
    "answer": "B"
  },
  {
    "url": "/demo/soru-04.png",
    "subject": "Rasyonel Sayılar",
    "difficulty": "Kolay",
    "answer": "E"
  },
  {
    "url": "/demo/soru-05.png",
    "subject": "Rasyonel Sayılar",
    "difficulty": "Orta",
    "answer": "D"
  },
  {
    "url": "/demo/soru-06.png",
    "subject": "Birinci Dereceden Denklemler ve Eşitsizlikler",
    "difficulty": "Kolay",
    "answer": "C"
  },
  {
    "url": "/demo/soru-07.png",
    "subject": "Birinci Dereceden Denklemler ve Eşitsizlikler",
    "difficulty": "Orta",
    "answer": "D"
  },
  {
    "url": "/demo/soru-08.png",
    "subject": "Mutlak Değer Denklemleri ve Eşitsizlikleri",
    "difficulty": "Zor",
    "answer": "C"
  },
  {
    "url": "/demo/soru-09.png",
    "subject": "Polinomlarda İşlemler",
    "difficulty": "Orta",
    "answer": "C"
  },
  {
    "url": "/demo/soru-10.png",
    "subject": "Polinomların Çarpanlara Ayrılması",
    "difficulty": "Zor",
    "answer": "D"
  },
  {
    "url": "/demo/soru-11.png",
    "subject": "Fonksiyon Kavramı ve Fonksiyonların Gösterimi",
    "difficulty": "Kolay",
    "answer": "E"
  },
  {
    "url": "/demo/soru-12.png",
    "subject": "Birleşik Fonksiyon",
    "difficulty": "Zor",
    "answer": "B"
  }
];

export const DEMO_PAGE = {
  image: "/demo/ornek-sayfa.png",
  questions: [
  {
    "box": {
      "x": 0.0484,
      "y": 0.0912,
      "width": 0.4274,
      "height": 0.2166
    },
    "subject": "Birinci Dereceden Denklemler ve Eşitsizlikler",
    "difficulty": "Kolay",
    "answer": "C"
  },
  {
    "box": {
      "x": 0.5242,
      "y": 0.0912,
      "width": 0.4274,
      "height": 0.2166
    },
    "subject": "Birinci Dereceden Denklemler ve Eşitsizlikler",
    "difficulty": "Orta",
    "answer": "D"
  },
  {
    "box": {
      "x": 0.0484,
      "y": 0.5131,
      "width": 0.4274,
      "height": 0.2166
    },
    "subject": "Polinomlarda İşlemler",
    "difficulty": "Orta",
    "answer": "C"
  },
  {
    "box": {
      "x": 0.5242,
      "y": 0.5131,
      "width": 0.4274,
      "height": 0.2166
    },
    "subject": "Birleşik Fonksiyon",
    "difficulty": "Zor",
    "answer": "B"
  }
],
};
