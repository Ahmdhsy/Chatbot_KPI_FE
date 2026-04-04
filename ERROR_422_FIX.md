# Error 422 (Unprocessable Content) - FIX

## 📋 Masalah
Aplikasi menampilkan error `422 Unprocessable Content` saat fetching users:
```
Failed to load resource: the server responded with a status of 422 (Unprocessable Content)
[UserService] Error fetching users:
  Status: 422
  Response Data: Object
  Message: Request failed with status code 422
```

## 🔍 Penyebab
Backend API mengharapkan **parameter query** (`limit` dan `offset`) untuk endpoint GET `/api/v1/users/users`, namun frontend tidak mengirimnya.

## ✅ Solusi yang Diterapkan

### Perubahan di `userService.ts`
**File:** `src/services/userService.ts`

**Sebelum:**
```typescript
const response = await apiClientWithAuth.get<GetUsersResponse>(
  "/api/v1/users/users"
);
```

**Sesudah:**
```typescript
const response = await apiClientWithAuth.get<GetUsersResponse>(
  "/api/v1/users/users",
  {
    params: {
      limit,
      offset,
    },
  }
);
```

### Penjelasan
- Parameter `limit` dan `offset` sekarang **dikirim sebagai query parameters** (`?limit=20&offset=0`)
- Ini memenuhi validasi backend yang mengharapkan kedua parameter tersebut
- Default values: `limit=20`, `offset=0`

## 🧪 Testing
1. Server sudah distart dengan `npm run dev`
2. Cek browser console untuk memastikan tidak ada error 422 lagi
3. User list seharusnya memuat dengan baik

## 📝 HTTP Request Format
Setelah fix, request akan terlihat seperti:
```
GET /api/v1/users/users?limit=20&offset=0
Authorization: Bearer <token>
Content-Type: application/json
```

## 🔧 Catatan Tambahan
- Jika masih ada error, check:
  1. Backend running di `http://localhost:8000`
  2. Backend endpoint accept `limit` dan `offset` parameters
  3. Token authentication valid
  4. CORS headers sudah configured dengan benar
