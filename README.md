# QuestionToTest

Fotoğraftan ve PDF'ten soru bankası oluşturup, istediğiniz konu/zorluk karışımında test
PDF'i üreten Next.js uygulaması. Giriş GateHub SSO ile yapılır, her kullanıcının soru
bankası kendisine özeldir.

## Mimari

| Katman | Teknoloji |
| --- | --- |
| Uygulama | Next.js 15 (App Router), tek Vercel projesi |
| Kimlik | NextAuth v5 → GateHub OIDC sağlayıcısı (`receiptflow` ile aynı desen) |
| Veri | Postgres (Neon), `pg` ile doğrudan sorgu |
| Görseller | Vercel Blob — tarayıcıdan doğrudan yükleme |

Görseller **veritabanında değil Blob'da** tutulur, tabloda yalnızca URL vardır. Yükleme
tarayıcıdan doğrudan Blob'a yapıldığı için Vercel fonksiyonlarının ~4,5 MB istek gövdesi
sınırı devreye girmez.

## Ekranlar

| Adres | Ne yapar |
| --- | --- |
| `/` | Fotoğraftan tek soru ekleme. Çözüm fotoğrafı isteğe bağlı, kırpma desteklenir. |
| `/pdf` | PDF sayfalarını görüntüleyip soruları ve çözümleri kırparak toplu aktarma. |
| `/sorular` | Soru bankası: filtre/arama, sayfalama, düzenleme ve silme. |
| `/test` | Konu/zorluk karışımı belirleyip test üretme ve PDF indirme. |
| `/login` | GateHub ile giriş. |

## Kurulum

### 1. GateHub istemcisi

GateHub panelinden iki OAuth istemcisi kaydedin (bir istemci tek callback URL tutar):

- `questiontotest` → `https://<vercel-domain>/api/auth/callback/gatehub`
- `questiontotest-dev` → `http://localhost:3100/api/auth/callback/gatehub`

### 2. Ortam değişkenleri

`.env.example` dosyasını `.env.local` olarak kopyalayıp doldurun:

```
AUTH_SECRET=              # openssl rand -base64 32
GATEHUB_ISSUER=https://gatehub-ahmetkurt.vercel.app/api/auth
GATEHUB_CLIENT_ID=
GATEHUB_CLIENT_SECRET=
DATABASE_URL=             # Neon connection string
BLOB_READ_WRITE_TOKEN=    # Vercel Blob (Vercel'de otomatik enjekte edilir)
```

### 3. Veritabanı

```bash
npm install
```

```bash
npm run db:init
```

### 4. Çalıştırma

```bash
npm run dev
```

## Eski verinin taşınması

Dosya tabanlı eski bankadaki (`tahsinaslanbackend/data/questions.json`) sorular Blob +
Postgres'e taşınır. Önce uygulamaya bir kez GateHub ile giriş yapın (kullanıcı satırı
oluşsun), sonra `users` tablosundan `external_user_id` değerini alıp:

```bash
node scripts/migrate-json-to-db.mjs <gatehub-sub>
```

## Notlar

- **PDF Türkçe karakterler:** `@react-pdf/renderer`'ın varsayılan Helvetica fontu WinAnsi
  kodlaması kullandığı için `ş ğ İ ı` basılamıyordu. `public/fonts/` altındaki Liberation
  Sans (SIL Open Font License) gömülerek çözüldü.
- **React 19 uyumu:** `@react-pdf/renderer` v3 React 19 ile peer uyumsuzdur ve temiz
  kurulumu (dolayısıyla Vercel derlemesini) kırar. v4'te sabitlenmiştir — düşürmeyin.
- **Görsel boyutu:** yüklenen fotoğraflar Blob'a gitmeden önce en uzun kenarı 1400px
  olacak şekilde küçültülüp JPEG'e çevrilir.
- **`/api` middleware dışındadır:** route'lar oturumu kendisi kontrol edip JSON 401
  döner. Middleware'e bırakılırsa `fetch`'e HTML login sayfası gider.
- **Mobil uyum:** tüm ekranlar 375px genişlikten itibaren yatay kaydırma olmadan çalışır;
  form alanları 16px (iOS'un otomatik yakınlaştırmasını önler), dokunma hedefleri ≥44px.

## Dizin yapısı

```
app/
  page.js, pdf/, sorular/, test/   dört ekran (client component)
  login/page.js                    GateHub girişi
  api/                             route handler'lar
  theme.css, pages.css             tasarım sistemi
auth.js                            NextAuth + GateHub OIDC
middleware.js                      rota koruma
components/                        Header, PhotoField, MetaFields, Toast
lib/
  db.js          pg Pool + ensureUser
  questions.js   veri erişimi + test seçim mantığı
  api.js         istemci tarafı çağrılar
  upload.js      Blob'a doğrudan yükleme
  image.js       kırpma / küçültme
  subjects.js    konu listesi (tek kaynak)
  pdf/           test PDF'i (sorular + cevap anahtarı + çözümler)
database/schema.sql
scripts/         db:init, migrate-json-to-db, copy-pdf-worker
```
