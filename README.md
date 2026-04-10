# 🚚 Fleetify Logistics - Invoicing System

Aplikasi Web Invoicing System yang dibangun untuk memenuhi Technical Test Fleetify Logistics. Sistem ini dirancang dengan arsitektur **Zero-Trust**, **ACID Database Transaction**, dan penanganan antarmuka yang optimal.

## 🚀 Cara Menjalankan (Zero-Setup)
Aplikasi ini di-bundle menggunakan **Multi-stage Docker** untuk ukuran yang ringan dan deployment yang instan.

1. Buka Terminal di root folder.
2. Jalankan perintah:
   ```bash
   docker-compose up -d --build
3. Database PostgreSQL akan otomatis berjalan dan melakukan Seeding data awal.
4. Buka Aplikasi di: http://localhost:3000

🔐 Akun Testing
Gunakan akun default berikut yang sudah otomatis terbuat di database:

Role Admin: admin / Password: admin (Mengirim payload JSON secara utuh).

Role Kerani: kerani / Password: kerani (Harga & Subtotal dibuang dari payload JSON saat submit).

Developed by Fadli Kurniawan for Fleetify Technical Test.