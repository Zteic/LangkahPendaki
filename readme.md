# 🏔️ Langkah Pendaki

Sistem Informasi Penyewaan Alat Outdoor berbasis Web yang dirancang untuk membantu proses penyewaan perlengkapan pendakian gunung secara digital, mulai dari pengelolaan inventaris, transaksi pelanggan, hingga pelaporan bisnis secara real-time.

Aplikasi ini menggunakan Supabase sebagai Backend-as-a-Service (BaaS) dan PostgreSQL sebagai basis data cloud sehingga dapat diakses secara online tanpa memerlukan server backend terpisah.

Live : https://zteic.github.io/LangkahPendaki/project-folder/index.html

---

## 📸 Tentang Proyek

Langkah Pendaki dikembangkan untuk memenuhi kebutuhan operasional toko penyewaan alat outdoor dengan menghadirkan sistem yang:

- Mempermudah pelanggan dalam melakukan penyewaan alat.
- Membantu admin mengelola stok inventaris.
- Menyediakan monitoring transaksi secara real-time.
- Menghasilkan laporan bisnis secara otomatis.
- Terintegrasi penuh dengan database cloud Supabase.


## 🗄️ Struktur Database

Sistem menggunakan tiga tabel utama pada Supabase PostgreSQL.

### Users

```sql
CREATE TABLE public.users (
    id BIGSERIAL PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    password_hash TEXT,
    role TEXT DEFAULT 'customer',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_users_username ON public.users(username);
CREATE INDEX idx_users_email ON public.users(email);
```

### Inventory

```sql
CREATE TABLE public.inventory (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    price INT NOT NULL,
    stock INT NOT NULL,
    image TEXT
);
```

### User History

```sql
CREATE TABLE public.user_history (
    id SERIAL PRIMARY KEY,
    username_customer TEXT NOT NULL,
    "user" TEXT NOT NULL,
    amount INT NOT NULL,
    status TEXT NOT NULL,
    payment_proof TEXT,
    rental_date DATE,
    return_date DATE,
    "date" DATE DEFAULT NOW(),
    items JSONB,
    "startDate" TEXT,
    "expectedReturnDate" TEXT,
    "returnDate" TEXT
);
```

---

## 🧰 Teknologi yang Digunakan

### Frontend

- HTML5
- CSS3
- Tailwind CSS
- JavaScript ES6+
- Font Awesome

### Backend & Database

- Supabase
- PostgreSQL

### Library

- Supabase JS SDK
- Chart.js
- jsPDF
- jsPDF AutoTable

---


## 🚀 Cara Menjalankan Proyek

### 1. Clone Repository

```bash
git clone https://github.com/username/langkah-pendaki.git
```

### 2. Masuk ke Folder Proyek

```bash
cd langkah-pendaki
```

### 3. Konfigurasi Supabase

Buat file konfigurasi Supabase dan masukkan:

```javascript
const SUPABASE_URL = "YOUR_SUPABASE_URL";
const SUPABASE_ANON_KEY = "YOUR_SUPABASE_ANON_KEY";
```

### 4. Jalankan Aplikasi

Gunakan Live Server atau web server lokal lainnya.

---

## 👨‍💻 Tim Pengembang

### Kelompok 2

| Nama | Peran |
|--------|--------|
| Rivaldi | Full Stack Developer & Database Administrator & Frontend Developer |
| Vira Indrianti | UI/UX Designer |

---

## 📄 Lisensi

Proyek ini dibuat untuk keperluan akademik dan pembelajaran.

© 2026 Kelompok 2 - Langkah Pendaki
