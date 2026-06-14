# Search Term Analyzer

Penganalisis search terms Google Ads berasaskan pelayar. Berjalan sepenuhnya dalam browser — tiada backend, tiada server, tiada data dihantar keluar.

Antara muka menggunakan Tailwind CSS (Play CDN), Google Sans Flex, Space Grotesk, dan komponen CSS tersuai dalam `styles.css`.

---

## Cara Guna Pantas

1. Pergi ke **Google Ads → Keywords → Search terms**
2. Tetapkan julat tarikh (disyorkan 30–90 hari)
3. Download laporan sebagai **CSV**
4. Upload ke app menggunakan butang **Upload CSV** atau drag & drop
5. Analisis automatik dipaparkan serta-merta

Klik butang **? Panduan** dalam app untuk tutorial langkah demi langkah yang lengkap.

---

## Jalankan Secara Lokal

Buka `index.html` dalam browser, atau mulakan server lokal:

```bash
python3 -m http.server 8080
```

Kemudian buka `http://localhost:8080`

---

## Export dari Google Ads

Pergi ke **Keywords → Search terms**, tetapkan julat tarikh, dan klik ikon Download (↓) → pilih CSV.

Kolum yang disyorkan untuk diaktifkan:

| Kolum | Keperluan |
|---|---|
| Search term | **Wajib** |
| Campaign | Disyorkan |
| Ad group | Disyorkan |
| Cost | **Wajib** |
| Clicks | **Wajib** |
| Impressions | **Wajib** |
| CTR | Disyorkan |
| Conversions | Pilihan (tapi diperlukan untuk analisis ROAS/CPA) |
| Conversion value | Pilihan |
| Search impr. share | Disyorkan |
| Device | Pilihan |

Format yang disokong: `.csv`, `.tsv`, `.txt` (UTF-8 atau UTF-16).

Parser secara automatik melangkau baris pengepala Google Ads dan baris bermula dengan `Total:`.

---

## Penerangan Label Strategik

Setiap search term diklasifikasikan secara automatik kepada satu label:

| Label | Maksud | Tindakan |
|---|---|---|
| **Opportunity** | ROAS tinggi, CTR kukuh, atau konversi dengan impression share rendah | Naikkan bid, scale, asingkan ke ad group tersendiri |
| **Problem** | Spend melebihi target CPA tanpa konversi, atau ROAS < 1.00x | Tambah sebagai negative keyword, audit landing page |
| **Weakness** | Impressions tinggi tapi CTR rendah, atau CPA melebihi target | Perbaiki teks iklan, optimumkan landing page |
| **Threat** | Mengandungi kata junk (percuma, kerja, pdf) atau nama kompetitor | Tambah sebagai negative segera |
| **Neutral** | Prestasi stabil, tiada isyarat kuat | Pantau sahaja |

---

## Fungsi Utama

### 📊 Analisis Automatik
- Klasifikasi 5 label strategik (Opportunity, Problem, Weakness, Threat, Neutral)
- Skor keutamaan 0–100 untuk setiap term
- Pengesanan intent pengguna: Transactional, Commercial, Navigational, Informational, General
- KPI ringkasan: jumlah spend, konversi, ROAS, bilangan masalah

### 🚫 Negative Keyword Builder
- Pilih terms secara manual atau guna **Auto Select** untuk pilih semua Threat
- Format: Exact `[term]`, Phrase `"term"`, atau Broad
- Level: Account, Campaign, atau Ad Group
- Export terus dalam format **Google Ads Editor CSV**

### 📈 Breakdown & Segmen
- Breakdown prestasi mengikut Campaign dan Ad Group
- Bucket strategik: Scale Candidates, Hidden Gems, Budget Bleeding, Negative Candidates
- Segmen: Brand Terms, Location Terms, Recurring Phrases (N-gram 1–4)

### 🔄 Comparison Mode
- Upload dua fail untuk bandingkan dua tempoh
- Kenal pasti terms yang berulang, baru, dan hilang
- Track perubahan spend dan konversi

### 🤖 AI Strategy Brief
- Jana ringkasan strategik siap-pakai untuk ChatGPT atau team
- Copy prompt dengan satu klik

### 💾 Session Save & Restore
- Simpan sesi kerja (data + pilihan + tetapan) dalam browser localStorage
- Restore untuk teruskan kerja kemudian
- Data tidak meninggalkan peranti anda

### ⚙️ Tetapan Lanjutan
- Target CPA, minimum waste spend, ROAS minimum, CTR benchmark
- Impression share limit, minimum clicks, high impression threshold
- Senarai kompetitor tersuai
- Kata junk tambahan (khusus industri)

### 🌙 Dark Mode
- Toggle antara mod cerah dan gelap
- Pilihan disimpan dalam localStorage

---

## Metrik yang Dipaparkan

| Metrik | Formula | Maksud |
|---|---|---|
| Cost | — | Jumlah perbelanjaan untuk term |
| CTR | Clicks ÷ Impressions × 100 | Peratusan tayangan yang diklik |
| ROAS | Conv. Value ÷ Cost | Pulangan per ringgit dibelanjakan |
| CPA | Cost ÷ Conversions | Kos per konversi |
| Impression Share | — | % tayangan yang diterima vs yang layak |
| Priority Score | Dikira oleh app | 0–100, semakin tinggi semakin urgent |

---

## Deploy ke Cloudflare Pages

**Manual (Direct Upload):**
1. Buka Cloudflare Dashboard → Workers & Pages
2. Create application → Pages → Direct Upload
3. Upload folder projek ini

**Via Git:**
1. Push folder ini ke GitHub
2. Buat Cloudflare Pages project dari repo
3. Build command: kosongkan
4. Output directory: `/` (jika folder ini adalah root repo)

---

## Struktur Fail

```
├── index.html      # Struktur HTML utama
├── app.js          # Logik JavaScript (parsing, klasifikasi, render)
├── styles.css      # Komponen CSS tersuai + dark mode + modal
├── sample/
│   └── google-ads-search-terms.csv   # Data contoh
└── README.md
```

---

## Privasi & Keselamatan

- ✅ Semua pemprosesan berlaku **dalam browser** — tiada data dihantar ke luar
- ✅ Tiada backend, tiada API calls, tiada tracking
- ✅ Berfungsi sepenuhnya secara offline selepas muat pertama
- ✅ Fail CSV tidak disimpan kekal (kecuali klik Save, yang menggunakan localStorage)
