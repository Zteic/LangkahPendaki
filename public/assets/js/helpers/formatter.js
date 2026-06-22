/**
 * REUSABLE FORMATTER & UTILITIES ENGINE 2026
 */

/**
 * Format Angka Menjadi Rupiah Indonesia Berstandar Internasional
 * @param {number} value - Nominal Angka
 * @returns {string} String terformat Rp
 */
export const formatIDR = (value) => {
    if (isNaN(value) || value === null) return "Rp 0";
    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(value);
};

/**
 * Menghitung Jumlah Hari Selisih Antara Dua String Tanggal
 * @param {string} start - Tanggal Awal (YYYY-MM-DD)
 * @param {string} end - Tanggal Akhir (YYYY-MM-DD)
 * @returns {number} Jumlah Hari Selisih (Minimal 1 Hari)
 */
export const calculateRentDays = (start, end) => {
    if (!start || !end) return 1;
    const dateStart = new Date(start);
    const dateEnd = new Date(end);
    
    // Reset Jam untuk akurasi perhitungan kalender murni
    dateStart.setHours(0,0,0,0);
    dateEnd.setHours(0,0,0,0);
    
    const timeDiff = dateEnd.getTime() - dateStart.getTime();
    if (timeDiff <= 0) return 1;
    
    return Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
};

/**
 * Membuat String Invoice Acak Unik untuk Sistem Pesanan Toko
 * @returns {string} ID Invoice Unik e.g., INV/20260613/LP-9821
 */
export const generateInvoiceNumber = () => {
    const today = new Date();
    const dateStr = today.getFullYear() +
                    String(today.getMonth() + 1).padStart(2, '0') +
                    String(today.getDate()).padStart(2, '0');
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    return `INV/${dateStr}/LP-${randomSuffix}`;
};