import axios from "axios";

export interface FastApiErrorItem {
  loc?: Array<string | number>;
  msg?: string;
  type?: string;
}

const FIELD_TRANSLATIONS: Record<string, string> = {
  identifier: "Email",
  email: "Email",
  username: "Username",
  password: "Password",
  full_name: "Nama Lengkap",
  role: "Peran (Role)",
  nama_chatbot: "Nama Chatbot",
  chatbot_name: "Nama Chatbot",
  otoritas: "Otoritas",
  addon_prompt: "Prompt Tambahan",
  is_active: "Status Aktif",
  sheet_url: "URL Google Sheets",
  sheet_name: "Nama Tab Sheet",
  tahun: "Tahun",
  kpi_name: "Nama KPI",
  target: "Target",
  realisasi: "Realisasi",
  keterangan: "Keterangan",
  description: "Deskripsi",
  limit: "Batas Tampilan",
  page: "Halaman",
  search: "Pencarian",
};

const MSG_TRANSLATIONS: Record<string, string> = {
  "field required": "wajib diisi",
  "value is not a valid email address": "format email tidak valid",
  "string should have at least 8 characters": "minimal harus 8 karakter",
  "value is not a valid integer": "harus berupa angka bulat",
  "value is not a valid float": "harus berupa angka desimal",
  "ensure this value has at most": "karakter melebihi batas maksimal",
  "none is not an allowed value": "tidak boleh kosong",
  "value is not a valid uuid": "format ID (UUID) tidak valid",
};

/**
 * Menerjemahkan satu item kesalahan validasi dari FastAPI (Pydantic) ke bahasa Indonesia.
 */
export function translateValidationItem(item: FastApiErrorItem): string {
  if (!item) return "";
  
  let rawField = "field";
  if (Array.isArray(item.loc) && item.loc.length > 0) {
    const lastLoc = item.loc[item.loc.length - 1];
    rawField = String(lastLoc);
  }
  
  const fieldName = FIELD_TRANSLATIONS[rawField] || rawField;
  const rawMsg = item.msg ? item.msg.toLowerCase() : "";
  
  let translatedMsg = "";
  for (const [key, trans] of Object.entries(MSG_TRANSLATIONS)) {
    if (rawMsg.includes(key)) {
      translatedMsg = trans;
      break;
    }
  }
  
  if (!translatedMsg) {
    translatedMsg = item.msg || "tidak valid";
  }
  
  return `Kolom "${fieldName}" ${translatedMsg}`;
}

/**
 * Mengubah objek error Axios/Pydantic/HTTP ke pesan error bahasa Indonesia yang ramah pengguna.
 */
export function extractFriendlyErrorMessage(error: unknown, fallback: string = "Terjadi kesalahan sistem"): string {
  if (!error) return fallback;

  // 1. Tangani error koneksi / network
  if (axios.isAxiosError(error)) {
    if (error.code === "ECONNABORTED") {
      return "Permintaan waktu habis (timeout). Silakan coba beberapa saat lagi.";
    }
    if (error.message === "Network Error" || !error.response) {
      return "Gagal terhubung ke server. Pastikan koneksi internet Anda aktif atau server backend sedang berjalan.";
    }
  }

  const err = error as any;
  const responseData = err.response?.data;
  const status = err.response?.status || err.status;

  // 2. Tangani berdasarkan HTTP Status Code
  if (status === 502 || status === 503 || status === 504) {
    return "Server backend sedang tidak dapat dihubungi atau sedang dalam pemeliharaan (maintenance).";
  }
  if (status === 500) {
    return "Terjadi kesalahan internal pada server (500). Silakan hubungi administrator jika masalah berlanjut.";
  }
  if (status === 403) {
    const detail = responseData?.detail;
    if (typeof detail === "string") {
      const lowered = detail.toLowerCase();
      if (
        lowered.includes("spreadsheet") ||
        lowered.includes("google sheets") ||
        lowered.includes("service account") ||
        lowered.includes("share") ||
        lowered.includes("izin") ||
        lowered.includes("akses")
      ) {
        return detail;
      }
    }
    return "Akses ditolak (403). Anda tidak memiliki izin untuk melakukan aksi ini.";
  }
  if (status === 404) {
    return "Data atau halaman tidak ditemukan (404).";
  }
  if (status === 401) {
    const detail = responseData?.detail;
    if (typeof detail === "string") {
      const lowered = detail.toLowerCase();
      if (lowered.includes("incorrect") || lowered.includes("salah")) {
        return "Email atau password salah. Silakan periksa kembali.";
      }
      if (lowered.includes("inactive") || lowered.includes("tidak aktif")) {
        return "Akun Anda dinonaktifkan. Silakan hubungi administrator.";
      }
      if (lowered.includes("expired") || lowered.includes("kadaluwarsa") || lowered.includes("sesi")) {
        return "Sesi Anda telah berakhir. Silakan masuk kembali.";
      }
    }
    return "Sesi masuk tidak sah atau telah berakhir. Silakan masuk kembali.";
  }

  // 3. Tangani detail kesalahan dari response data
  let detail = responseData?.detail || err.message || err;

  if (typeof detail === "string" && detail.trim()) {
    try {
      const trimmed = detail.trim();
      if ((trimmed.startsWith("[") && trimmed.endsWith("]")) || (trimmed.startsWith("{") && trimmed.endsWith("}"))) {
        detail = JSON.parse(trimmed);
      }
    } catch {}
  }

  if (typeof detail === "string" && detail.trim()) {
    const lowered = detail.toLowerCase();
    
    // Penanganan error duplikasi database / unique constraint
    if (lowered.includes("already exists") || lowered.includes("duplicate key")) {
      if (lowered.includes("username")) return "Username sudah digunakan oleh akun lain.";
      if (lowered.includes("email")) return "Email sudah terdaftar. Silakan gunakan email lain.";
      if (lowered.includes("nama_chatbot") || lowered.includes("chatbot_name")) return "Nama chatbot sudah digunakan. Silakan pilih nama lain.";
      return "Data tersebut sudah terdaftar di dalam sistem.";
    }

    // Penanganan error constraint relasi data (foreign key)
    if (lowered.includes("violates foreign key constraint") || lowered.includes("foreign key")) {
      return "Aksi tidak dapat dilakukan karena data ini terhubung dengan data lain di sistem.";
    }

    if (lowered.includes("value_error.missing")) {
      return "Beberapa kolom wajib diisi masih kosong.";
    }

    // Penanganan pesan auth default
    if (lowered === "incorrect email or password" || lowered === "incorrect username or password") {
      return "Email atau password salah.";
    }
    if (lowered === "user is inactive" || lowered === "akun tidak aktif") {
      return "Akun Anda dinonaktifkan. Silakan hubungi administrator.";
    }
    
    return detail;
  }

  // 4. Tangani list validasi FastAPI / Pydantic (biasanya array)
  if (Array.isArray(detail) && detail.length > 0) {
    const items = detail as FastApiErrorItem[];
    const firstInvalid = items.find(item => item && (item.msg || item.type));
    if (firstInvalid) {
      return translateValidationItem(firstInvalid);
    }
    
    const mapped = items
      .map(item => translateValidationItem(item))
      .filter(Boolean)
      .join("; ");
      
    if (mapped) return mapped;
  }

  return fallback;
}
