# QuestionToTest

Fotoğraftan ve PDF'ten soru bankası oluşturup, istediğiniz konu/zorluk karışımında test PDF'i
üreten Next.js uygulaması. PDF sayfasındaki soruları **yapay zekâ (Claude) bulur**: her soruyu
kırpar, konusunu ve zorluğunu etiketler, cevabını önerir; öğretmen yalnızca kontrol edip kaydeder.

## Hangi sorunu çözüyor

Öğretmenler yaprak test hazırlarken kitaplardan ve PDF'lerden soruları tek tek kesip Word'e
yapıştırır, konu ve cevap anahtarını elle tutar. QuestionToTest bunu üç adıma indirir: PDF'i aç,
"Soruları yapay zekâyla bul" de, kontrol edip kaydet. Test oluştururken konu ve zorluk karışımı
seçilir; cevap anahtarı ve çözümler PDF'e otomatik eklenir.

## Çalışma modları

| Mod | Ne zaman | Veri | Yapay zekâ |
|---|---|---|---|
| **Demo** | `DATABASE_URL` boşken (Vercel) | [PGlite](https://pglite.dev): Postgres sunucu sürecinin içinde, 12 örnek soruyla açılır | Anahtar yoksa "Örnek deneme sayfasıyla dene" ile hazır sonuç gösterilir |
| **Yerel** | `DATABASE_URL` tanımlıyken | Docker'daki PostgreSQL 17, kalıcı | `ANTHROPIC_API_KEY` ile gerçek analiz |

Hesap sistemi yoktur; uygulama tek öğretmenin kendi bilgisayarında kullanılmak üzere tasarlandı.
Görseller ayrı bir dosya deposu gerektirmesin diye veritabanında (`images` tablosu) tutulur.

> `/api/ai/detect` ucu kimlik doğrulaması içermez. `ANTHROPIC_API_KEY`'i herkese açık bir
> dağıtıma eklemeyin; aksi halde API kullanımınızı herkes tüketebilir.

## Ekranlar

| Adres | Ne yapar |
| --- | --- |
| `/` | Fotoğraftan tek soru ekleme. Çözüm fotoğrafı isteğe bağlı, kırpma desteklenir. |
| `/pdf` | PDF sayfasındaki soruları yapay zekâyla bulup kırpma ya da elle kırparak toplu aktarma. |
| `/sorular` | Soru bankası: filtre/arama, sayfalama, düzenleme ve silme. |
| `/test` | Konu/zorluk karışımı belirleyip test üretme ve PDF indirme. |

## Kurulum

```bash
npm install
docker compose up -d   # PostgreSQL 17, localhost:5438
cp .env.example .env.local   # ANTHROPIC_API_KEY'i ekleyin
npm run db:setup       # migration'lar
npm run dev            # http://localhost:3100
```

`.env.local` olmadan `npm run dev` demo modunda açılır; Docker gerekmez.

## Yapay zekâ ile soru bulma

`app/api/ai/detect/route.js` sayfa görselini Claude'a (`claude-opus-5-5`) gönderir ve yapılandırılmış
çıktı (JSON şeması) ister: her soru için sayfaya oranla kutu (0-1), konu listesinden konu, zorluk
ve önerilen cevap. Model emin değilse cevap `null` döner ve arayüz öğretmenden seçmesini ister.
Kutular tarayıcıda sayfa görselinden kırpılır; kaydetmeden önce hepsi düzenlenebilir.

## Veritabanı ve yedekleme

Şema `db/migrations/` altındadır; `npm run db:setup` yalnızca uygulanmamış migration'ları çalıştırır,
`npm run db:reset` yerel veritabanını sıfırdan kurar. Kalıcı veri yalnızca yerel veritabanındadır:
`docker compose exec db pg_dump -U questiontotest questiontotest > yedek.sql`.

## Notlar

- **PDF Türkçe karakterler:** `@react-pdf/renderer`'ın varsayılan Helvetica fontu WinAnsi
  kodlaması kullandığı için `ş ğ İ ı` basılamıyordu. `public/fonts/` altındaki Liberation
  Sans (SIL Open Font License) gömülerek çözüldü.
- **React 19 uyumu:** `@react-pdf/renderer` v3 React 19 ile peer uyumsuzdur ve temiz
  kurulumu (dolayısıyla Vercel derlemesini) kırar. v4'te sabitlenmiştir — düşürmeyin.
- **Görsel boyutu:** yüklenen fotoğraflar kaydedilmeden önce en uzun kenarı 1400px
  olacak şekilde küçültülüp JPEG'e çevrilir.
- **Mobil uyum:** tüm ekranlar 375px genişlikten itibaren yatay kaydırma olmadan çalışır;
  form alanları 16px (iOS'un otomatik yakınlaştırmasını önler), dokunma hedefleri ≥44px.

## Dizin yapısı

```
app/
  page.js, pdf/, sorular/, test/   dört ekran (client component)
  api/ai/detect/                   Claude ile soru bulma
  api/images/                      görsel yükleme ve sunma
  api/questions/, api/create-test/ soru bankası ve test seçimi
components/                        Header, PhotoField, MetaFields, Toast
lib/
  db.js          PostgreSQL ya da demo modunda PGlite
  questions.js   veri erişimi + test seçim mantığı
  demo-data.js   örnek sorular ve örnek sayfanın hazır analizi
  upload.js      görsel yükleme
  image.js       kırpma / küçültme
  subjects.js    konu listesi (tek kaynak)
  pdf/           test PDF'i (sorular + cevap anahtarı + çözümler)
db/migrations/   şema
public/demo/     örnek soru görselleri ve örnek deneme sayfası
scripts/         db.mjs (db:setup / db:reset), copy-pdf-worker
```
