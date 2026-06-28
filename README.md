# 🥕 RootFacts — Fakta Unik Sayuran AI

**RootFacts** adalah aplikasi web asisten berbasis AI yang dapat **mengenali jenis sayuran melalui kamera** secara real-time, lalu **menghasilkan fakta menarik (fun fact)** tentang sayuran tersebut secara otomatis — semuanya berjalan **langsung di browser**, tanpa server backend.

🔗 **Demo:** lihat `STUDENT.txt` untuk URL deployment.

---

## 🎯 Tujuan Aplikasi

Aplikasi ini dibuat untuk mendemonstrasikan integrasi dua kemampuan AI yang berjalan sepenuhnya di sisi klien (on-device AI):

1. **Si Mata (Computer Vision)** — Mendeteksi & mengklasifikasikan jenis sayuran dari feed kamera menggunakan model machine learning yang sudah dilatih sebelumnya.
2. **Si Otak (Generative AI)** — Begitu sayuran berhasil dikenali, model bahasa lokal menghasilkan fun fact unik tentang sayuran tersebut secara dinamis, tanpa memanggil API eksternal apa pun.

Seluruh proses AI (deteksi gambar maupun generasi teks) berjalan **100% di perangkat pengguna**, menjadikannya privat (tidak ada data yang dikirim ke server) dan tetap bisa diakses **secara offline** setelah dimuat pertama kali, berkat dukungan PWA (Progressive Web App).

---

## ✨ Fitur Utama

### Computer Vision
- Deteksi sayuran real-time melalui kamera (depan/belakang) menggunakan **TensorFlow.js**
- **Backend Adaptif**: otomatis memeriksa dukungan WebGPU (`navigator.gpu`), dan fallback ke WebGL bila tidak tersedia
- **FPS Limit** yang dapat diatur lewat slider, untuk menyeimbangkan performa & konsumsi resource
- Indikator loading model dengan persentase real-time saat inisialisasi
- Manajemen memori disiplin menggunakan `tf.tidy()` di setiap siklus prediksi

### Generative AI
- Fun fact dihasilkan secara lokal menggunakan **Transformers.js** (model `Xenova/LaMini-Flan-T5-77M`, kuantisasi `q4`)
- **Persona Dinamis** — pilih gaya bahasa: Normal, Lucu, Sejarah, Profesional, atau Santai
- Parameter generasi (`temperature`, `max_new_tokens`, `top_p`, `do_sample`) sudah dioptimasi agar tetap responsif
- Fitur **Salin ke Papan Klip** untuk berbagi hasil fun fact
- **Backend Adaptif** WebGPU dengan fallback otomatis ke WASM
- Mekanisme *locking* & *cooldown* untuk mencegah hasil yang tidak konsisten saat deteksi berubah cepat

### Offline & PWA
- Dapat **diinstal** sebagai aplikasi (Add to Home Screen / tombol Install di address bar)
- Berjalan **sepenuhnya offline** setelah kunjungan pertama — termasuk model AI (TensorFlow.js & Transformers.js), aset statis, dan font eksternal — berkat **Service Worker** (Workbox) yang men-*precache* seluruh berkas penting
- Dideploy ke **Netlify** dengan Web App Manifest lengkap

---

## 🛠️ Tech Stack

| Kategori | Teknologi |
|---|---|
| Framework | React 19 + Vite |
| Computer Vision | TensorFlow.js (`@tensorflow/tfjs`, `tfjs-backend-webgpu`) |
| Generative AI | Transformers.js (`@huggingface/transformers`) |
| PWA / Offline | `vite-plugin-pwa` (Workbox) |
| Ikon | `lucide-react` |
| Linting | ESLint (flat config) |
| Deployment | Netlify |

---

## 📁 Struktur Proyek

```
root-facts-react/
├── public/
│   ├── model/              # Model TensorFlow.js (model.json, weights.bin, metadata.json)
│   ├── icons/               # Ikon PWA (192x192, 512x512, apple-touch-icon)
│   └── favicon.ico
├── src/
│   ├── components/
│   │   ├── Header.jsx          # Status model AI
│   │   ├── CameraSection.jsx    # Kontrol kamera, FPS, persona
│   │   └── InfoPanel.jsx        # Hasil deteksi & fun fact
│   ├── hooks/
│   │   └── useAppState.js       # State management terpusat
│   ├── services/
│   │   ├── CameraService.js     # Wrapper MediaStream API
│   │   ├── DetectionService.js  # Wrapper TensorFlow.js
│   │   └── RootFactsService.js  # Wrapper Transformers.js
│   ├── utils/
│   │   ├── config.js            # Konfigurasi & validasi
│   │   ├── common.js            # Helper umum (delay, error message, dll)
│   │   └── ui.js                 # Helper tampilan
│   ├── App.jsx                   # Orkestrasi utama aplikasi
│   └── main.jsx
├── vite.config.js          # Konfigurasi Vite + PWA/Workbox
├── eslint.config.mjs
└── STUDENT.txt              # URL deployment
```

---

## 🚀 Cara Menjalankan (Development)

### Prasyarat
- Node.js (versi LTS terbaru direkomendasikan)
- Browser modern dengan dukungan kamera (Chrome/Edge direkomendasikan untuk WebGPU)

### Instalasi

```bash
npm install
```

### Menjalankan Development Server

```bash
npm run dev
```

Buka browser ke `http://localhost:3001` dan izinkan akses kamera saat diminta.

> ⚠️ **Catatan:** `npm run dev` cocok untuk development, tapi **tidak representatif** untuk menguji mode offline (Service Worker dev-mode tidak melakukan precaching penuh). Gunakan `npm run preview` untuk pengujian offline yang akurat.

### Build untuk Production

```bash
npm run build
```

Hasil build akan tersedia di folder `dist/`.

### Preview Build Production (Rekomendasi untuk Tes Offline)

```bash
npm run preview
```

Buka `http://localhost:4173`, lalu di DevTools (F12) → tab **Network** → centang **Offline** → reload halaman untuk memverifikasi aplikasi tetap berfungsi tanpa koneksi internet.

### Linting

```bash
npm run lint
```

---

## 📖 Cara Menggunakan Aplikasi

1. **Tunggu model AI siap** — status di header akan menunjukkan persentase loading, lalu berubah menjadi "Model AI Siap"
2. **Pilih kamera** (Depan/Belakang) dan atur **FPS Limit** sesuai kebutuhan perangkat
3. **Pilih gaya bahasa (Persona)** untuk fun fact yang akan dihasilkan
4. Tekan tombol **Scan** (ikon kamera) untuk mengaktifkan kamera
5. **Arahkan kamera ke sayuran** — begitu terdeteksi dengan confidence ≥ 70%, aplikasi akan otomatis menampilkan nama sayuran dan menghasilkan fun fact
6. Gunakan tombol **Salin** untuk menyalin fun fact ke papan klip
7. Tekan tombol **Scan** lagi untuk menghentikan kamera dan mereset hasil

---

## 🌐 Deployment

Aplikasi ini dideploy ke **Netlify**. Untuk deploy ulang:

```bash
npm run build
```

Lalu upload folder `dist/` ke Netlify (drag & drop di [app.netlify.com/drop](https://app.netlify.com/drop), atau hubungkan repository Git untuk auto-deploy dengan build command `npm run build` dan publish directory `dist`).

---

## ⚠️ Catatan & Keterbatasan

- Model dilatih menggunakan dataset sederhana, sehingga hasil deteksi mungkin tidak selalu 100% akurat. Disarankan menggunakan latar belakang polos dan pencahayaan yang cukup terang.
- Performa AI (terutama Generative AI) bergantung pada spesifikasi perangkat pengguna — perangkat dengan dukungan WebGPU akan mendapatkan performa terbaik.
- Kunjungan pertama membutuhkan koneksi internet untuk mengunduh model AI (± puluhan MB); setelah itu aplikasi dapat diakses offline.

---

## 📄 Lisensi

Proyek ini dibuat untuk keperluan submission tugas akhir pada program belajar **Dicoding Indonesia**.
