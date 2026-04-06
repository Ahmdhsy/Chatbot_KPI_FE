# Token Cleanup & Duplicate Token Fix (Updated)

## Problem
Terdapat dua akses token yang disimpan di localStorage dengan naming convention yang tidak konsisten:
- `accessToken` (camelCase - salah)
- `access_token` (snake_case - benar sesuai API)

Ini menyebabkan refresh token mechanism tidak berjalan dengan baik.

## Solution
Diubah ke naming convention yang benar (`access_token` dan `refresh_token`) dan ditambahkan cleanup function yang akan menghapus semua duplicate token keys.

## Changes Made

### 1. **Updated Storage Keys** 
Changed from:
- ❌ `accessToken` → ✅ `access_token`
- ❌ `refreshToken` → ✅ `refresh_token`

Konsisten dengan API response yang menggunakan `access_token` dan `refresh_token`.

### 2. **Cleanup Function** (`cleanupDuplicateTokens`)
- Mendeteksi semua key di localStorage yang mengandung kata "token" dan "access"
- Menghapus semua duplicate keys kecuali `access_token` yang standard
- Dipanggil secara otomatis di:
  - Initialization (saat app pertama kali load)
  - Login process
  - Token refresh
  - Logout process

### 3. **Token Storage Optimization**
- Sebelum menyimpan token baru, semua token lama dihapus terlebih dahulu
- Menggunakan sequence: `remove → set` untuk menghindari duplikat
- Diterapkan pada:
  - `setupRefreshCallback()` - Saat interceptor trigger refresh
  - `login()` - Saat user login
  - `refreshAccessToken()` - Saat manual token refresh
  - `logout()` - Saat user logout

### 4. **Updated API Client**
- Changed `localStorage.getItem("accessToken")` → `localStorage.getItem("access_token")`
- Used in request interceptor untuk menambahkan Authorization header

### 5. **Enhanced Logging**
Added detailed logging untuk debugging:
```
[AuthContext] Login successful - tokens stored
[AuthContext] Access token refreshed successfully
[AuthContext] Removing duplicate token key: xxx
[AuthContext] Logout complete - all tokens cleared
[API Request] Authorization header set with Bearer token
```

## localStorage Keys (After Fix)
- ✅ `access_token` - Single access token
- ✅ `refresh_token` - Single refresh token
- ✅ `user` - User data (JSON)
- ✅ `tokenExpiresAt` - Token expiry timestamp

## Files Modified
- `src/context/AuthContext.tsx` - Updated semua references ke token keys
- `src/services/apiClientWithAuth.ts` - Updated untuk menggunakan `access_token`

## How to Test

1. **Inspect Application Storage**
   - Open DevTools → Application → Local Storage
   - Pastikan hanya ada satu `access_token` key (bukan `accessToken`)
   - Pastikan hanya ada satu `refresh_token` key (bukan `refreshToken`)
   - Check tidak ada duplicate keys

2. **Monitor Token Refresh**
   - Buka DevTools → Console
   - Lihat log messages dari `[AuthContext]` dan `[API Request]`
   - Verifikasi refresh token berjalan sebelum token expire

3. **Test Logout**
   - Login → Check localStorage
   - Logout → Verify semua token-related keys hilang
   - Cek tidak ada ghost/duplicate tokens tersisa

## Expected Behavior After Fix

1. **Login**
   - Hanya 1 `access_token` disimpan (snake_case)
   - Hanya 1 `refresh_token` disimpan (snake_case)
   - Console menunjukkan successful login message

2. **Token Refresh**
   - Automatic refresh terjadi 1 menit sebelum token expire
   - Old tokens dihapus, new tokens disimpan
   - No duplicate keys created

3. **API Requests**
   - Authorization header: `Bearer <access_token>`
   - Token automatically added ke setiap request
   - 401 error trigger automatic token refresh

4. **Logout**
   - Semua token-related keys dihapus
   - No ghost/leftover tokens di localStorage
   - Cleanup logs muncul di console

## Notes
- Function `cleanupDuplicateTokens()` bersifat idempotent (aman dipanggil berkali-kali)
- No breaking changes - backward compatible dengan logic yang ada
- Naming convention sekarang konsisten dengan backend API (`access_token`, `refresh_token`)
- Bisa manually dipanggil untuk cleanup existing duplicates jika diperlukan
