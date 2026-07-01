<div align="center">
  <h1>🛒 POS - Frontend</h1>
  <p>Aplikasi Frontend modern berbasis Web untuk Sistem Point of Sale (POS).</p>
</div>

<br />

## ✨ Tentang Proyek

Proyek ini adalah antarmuka web (frontend) untuk mengelola operasional bisnis, inventory cabang, hingga pusat. Dibangun menggunakan teknologi web modern untuk memastikan performa yang cepat, interaktif, dan responsif. Dilengkapi dengan fitur manajemen pesanan (PO), validasi penerimaan barang, pengaturan harga, serta analitik penjualan.

## 🚀 Teknologi yang Digunakan

Aplikasi ini dikembangkan menggunakan *stack* modern:
- **[React 19](https://react.dev/)** - *Library* UI yang kuat dan reaktif.
- **[Vite](https://vitejs.dev/)** - *Build tool* yang sangat cepat untuk *development*.
- **[Tailwind CSS v4](https://tailwindcss.com/)** - *Framework* CSS *utility-first* untuk styling yang indah dan konsisten.
- **[Zustand](https://github.com/pmndrs/zustand)** - Manajemen *state* global yang ringan dan efisien.
- **[React Query / TanStack Query](https://tanstack.com/query/latest)** - *Data-fetching* dan manajemen *cache* API.
- **[React Router DOM](https://reactrouter.com/)** - Navigasi antar halaman (SPA).
- **[Recharts](https://recharts.org/)** - Visualisasi data dan grafik analitik yang interaktif.
- **[Lucide React](https://lucide.dev/)** - Koleksi ikon modern.

## 🛠️ Fitur Utama

- 📊 **Dashboard Analitik**: Pantau penjualan harian, bulanan, dan produk terlaris dengan grafik interaktif.
- 📦 **Manajemen Inventaris & PO**: Sistem request barang, validasi penerimaan barang antar Pusat & Cabang, dan pelacakan status pengiriman.
- 💵 **Pengaturan Harga**: Fleksibilitas untuk mengatur harga pusat dan harga jual secara spesifik di masing-masing cabang.
- 👥 **Role-Based Access**: Menampilkan UI dan data yang berbeda secara dinamis berdasarkan role pengguna (Pusat, Cabang, Sales, Outlet/Pelanggan).
- 📱 **Desain Elegan**: Antarmuka modern dengan *Dark Theme* yang eksklusif dan nyaman digunakan.

## 💻 Cara Menjalankan Proyek Secara Lokal

**Prasyarat:** Pastikan Anda telah menginstal [Node.js](https://nodejs.org/) (disarankan versi LTS).

1. **Buka direktori proyek**:
   ```bash
   cd pos/fe
   ```

2. **Instal dependensi aplikasi**:
   ```bash
   npm install
   ```

3. **Konfigurasi Lingkungan (*Environment*)**:
   Jika dibutuhkan, buat file `.env` di direktori proyek (*root*) sesuai dengan format URL API backend Anda (biasanya `VITE_API_URL`).

4. **Jalankan *Development Server***:
   ```bash
   npm run dev
   ```
   Aplikasi akan berjalan dan dapat diakses di `http://localhost:3000` atau melalui IP lokal Anda di jaringan yang sama.

5. **Build untuk Produksi**:
   ```bash
   npm run build
   ```
   File siap *deploy* akan digenerasi di dalam folder `dist/`.

## 📁 Struktur Direktori Utama

```text
src/
├── components/   # Komponen UI (*reusable*)
├── layouts/      # Layout rangka halaman (seperti Sidebar)
├── lib/          # *Helper functions* dan konfigurasi API (Axios)
├── pages/        # Komponen halaman-halaman utama (Dashboard, Atur Harga, dll)
├── store/        # Menyimpan *state* aplikasi secara global (Zustand)
└── App.tsx       # Berkas utama React (Router setup)
```

## 🤝 Kontribusi

Silakan buat *Issue* baru atau ajukan *Pull Request* jika Anda menemukan *bug* atau ingin menambahkan fitur baru ke aplikasi ini!

---
<div align="center">
  Dibuat dengan ❤️ untuk operasional bisnis yang lebih optimal.
</div>
