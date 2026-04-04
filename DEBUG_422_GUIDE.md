# Debugging Error 422 - Step by Step

## 🔧 Langkah 1: Jalankan Debug Script

1. Buka browser dan login ke aplikasi
2. Buka **Developer Tools** (F12)
3. Pergi ke tab **Console**
4. Copy paste isi dari file `DEBUG_USERS_ENDPOINT.js` dan jalankan

## 📊 Analisis Output

Perhatikan hasil dari ketiga test:

### ✅ Jika salah satu test berhasil (Status 200):
- Catat **format endpoint** dan **parameter** yang berhasil
- Kita akan update `userService.ts` dengan format yang benar

### ❌ Jika semua test gagal (Status 422):
- Check backend logs untuk melihat **validation error detail**
- Mungkin ada field/property yang diperlukan tapi tidak dikirim

---

## 🐛 Kemungkinan Masalah & Solusi

### Masalah 1: Backend tidak recognize query params
**Gejala:** 422 saat pakai params, 200 tanpa params
**Solusi:** Endpoint tidak support pagination, kirim tanpa params

### Masalah 2: Field validation gagal
**Gejala:** Response data berisi error array dengan `loc` dan `msg`
**Solusi:** Lihat detail error, mungkin ada field yang required

### Masalah 3: Token invalid
**Gejala:** Status 401 atau 403
**Solusi:** Refresh token atau login ulang

### Masalah 4: Endpoint path berbeda
**Gejala:** 404 not found
**Solusi:** Check backend routing, path mungkin berbeda

---

## 📝 Informasi Backend

Backend endpoint: `http://localhost:8000`
Endpoint yang ditest: `/api/v1/users/users`

Cek apakah backend service running:
```bash
curl -X GET http://localhost:8000/docs
```

---

## 🚀 Update kode berdasarkan hasil

Setelah mendapat hasil dari debug script:

1. Share output lengkap
2. Saya akan update `userService.ts` sesuai format yang benar
3. Test lagi tanpa error 422

---

## 📌 Note

File yang sudah diupdate:
- `src/services/userService.ts` - Ditambahkan fallback untuk 422 error
- Sekarang coba dulu dengan `skip/limit` params
- Jika masih error, fallback ke request tanpa params

Jalankan debug script dan share hasilnya! 🔍
