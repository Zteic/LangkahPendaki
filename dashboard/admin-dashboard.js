console.log("✅ admin-dashboard.js loaded");

const SUPABASE_URL = "https://kimbhihdhgmrutmkrdcr.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtpbWJoaWhkaGdtcnV0bWtyZGNyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIwNDA4NjMsImV4cCI6MjA5NzYxNjg2M30.z32S2vJg0071OMpuo-7P0qD-4NoZMsacLv5OeXgKlVo";

if (typeof supabase === 'undefined') {
    console.error("❌ Supabase SDK not loaded! Check CDN script.");
} else {
    console.log("✅ Supabase SDK detected");
}

const { createClient } = supabase;
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
console.log("✅ Supabase client initialized");

// ✅ GLOBAL FALLBACK GAMBAR: Tangani semua <img> yang gagal load
(function() {
    const FALLBACK_SVG = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="240"%3E%3Crect fill="%23f3f4f6" width="400" height="240"/%3E%3Ctext fill="%239ca3af" font-family="Arial" font-size="14" x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle"%3EGambar Tidak Tersedia%3C/text%3E%3C/svg%3E';
    window.addEventListener('error', function(e) {
        if (e.target && e.target.tagName === 'IMG' && !e.target.src.startsWith('data:image')) {
            e.target.onerror = null;
            e.target.src = FALLBACK_SVG;
        }
    }, true);
})();

let currentUploadedImage = "";
let currentCategoryFilter = "Semua";

// --- FUNGSI CUSTOM POP-UP ---
window.showPopup = function(message, type = "info", onConfirm = null) {
    const modal = document.getElementById("customPopup");
    if (!modal) return; 

    const msgEl = document.getElementById("popupMessage");
    const iconEl = document.getElementById("popupIcon");
    const btnOk = document.getElementById("popupBtnOk");
    const btnCancel = document.getElementById("popupBtnCancel");

    msgEl.innerText = message;
    
    // Reset onclick
    btnOk.onclick = null;
    btnCancel.onclick = null;

    if (type === "confirm") {
        btnCancel.style.display = "inline-block";
        btnOk.innerText = "Ya, Lanjutkan";
        
        btnOk.onclick = () => { modal.style.display = "none"; if(onConfirm) onConfirm(); };
        btnCancel.onclick = () => { modal.style.display = "none"; };
    } else {
        iconEl.innerText = type === "success" ? "✅" : (type === "error" ? "🔔" : "🔔");
        btnCancel.style.display = "none";
        btnOk.innerText = "OK Mengerti";
        
        btnOk.onclick = () => { modal.style.display = "none"; if(onConfirm) onConfirm(); };
    }
    modal.style.display = "flex";
};

// --- 1. NAVIGASI & ROUTING ---
const menus = document.querySelectorAll(".menu");
menus.forEach(menu => {
    menu.addEventListener("click", () => {
        menus.forEach(m => m.classList.remove("active"));
        menu.classList.add("active");
        
        const target = menu.dataset.target;
        document.querySelectorAll(".section").forEach(sec => sec.style.display = "none");
        const targetSection = document.getElementById(target);
        if (targetSection) targetSection.style.display = "block";
        
        const pageTitle = document.getElementById("pageTitle");
        if (pageTitle) pageTitle.innerText = menu.innerText.trim();

        refreshTabData(target);
    });
});

function refreshTabData(target) {
    if (target === "dashboard") loadDashboardData();
    if (target === "inventory") filterAndRenderInventory();
    if (target === "payments") loadAdminPayments();
    if (target === "reports") loadReportData();
}

// --- 2. DASHBOARD ---
async function loadDashboardData() {
    console.log("📊 Loading Dashboard Data from Supabase...");
    
    try {
        // QUERY 1: Ambil semua transaksi dari user_history
        const { data: history, error: historyError } = await supabaseClient.from('user_history').select('*');
        if (historyError) throw new Error("Error fetching history: " + historyError.message);
        
        // QUERY 2: Ambil semua inventory
        const { data: inventory, error: inventoryError } = await supabaseClient.from('inventory').select('*');
        if (inventoryError) throw new Error("Error fetching inventory: " + inventoryError.message);
        
        const historyData = history || [];
        const inventoryData = inventory || [];
        
        console.log("✅ Loaded:", historyData.length, "transactions,", inventoryData.length, "products");
        
        // KALKULASI 1: Penyewaan Aktif (status = "Pembayaran Diterima")
        const activeRentals = historyData.filter(item => item.status === "Pembayaran Diterima");
        
        // KALKULASI 2: Total Stok Tersedia
        const totalStock = inventoryData.reduce((sum, item) => sum + parseInt(item.stock || 0), 0);
        
        // KALKULASI 3: Pembayaran Menunggu Verifikasi
        const pendingPayments = historyData.filter(item => item.status === "Menunggu Verifikasi");
        
        // KALKULASI 4: Total Pendapatan (status BUKAN "Menunggu Verifikasi" atau "Pending")
        const successfulTransactions = historyData.filter(item => 
            item.status !== "Menunggu Verifikasi" && 
            item.status !== "Pending" &&
            item.status !== "Dibatalkan"
        );
        
        let totalRevenue = 0;
        successfulTransactions.forEach(transaction => {
            totalRevenue += parseInt(transaction.amount || 0);
        });
        
        // Format currency menggunakan Intl.NumberFormat
        const formattedRevenue = new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(totalRevenue);
        
        // UPDATE UI - Statistics Cards
        if(document.getElementById("stat-active")) {
            document.getElementById("stat-active").textContent = activeRentals.length;
        }
        
        if(document.getElementById("stat-stock")) {
            document.getElementById("stat-stock").textContent = totalStock;
        }
        
        if(document.getElementById("stat-pending")) {
            document.getElementById("stat-pending").textContent = pendingPayments.length;
        }
        
        if(document.getElementById("stat-revenue")) {
            document.getElementById("stat-revenue").textContent = formattedRevenue;
        }
        
        console.log("💰 Total Revenue:", formattedRevenue, "from", successfulTransactions.length, "transactions");
        
        // RENDER TABEL KONFIRMASI PENGEMBALIAN BARANG
        const recentBody = document.getElementById("recentRentalsBody");
        if (!recentBody) return;
        
        recentBody.innerHTML = "";
        
        if (activeRentals.length === 0) {
            recentBody.innerHTML = `<tr><td colspan="6" align="center" style="padding: 40px; color: #9CA3AF;">Tidak ada penyewaan aktif saat ini.</td></tr>`;
            return;
        }
        
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        activeRentals.forEach(item => {
            let statusText = "Sedang Aktif";
            let statusClass = "status-badge active";
            let lateFee = 0; 
            let lateText = ""; 
            
            // Cek keterlambatan berdasarkan return_date atau expectedReturnDate
            const returnDateField = item.return_date || item.expectedReturnDate;
            
            if (returnDateField) {
                let expDate;
                
                // Parse berbagai format tanggal
                if (returnDateField.includes('-')) {
                    const parts = returnDateField.split('-');
                    expDate = new Date(parts[0], parts[1] - 1, parts[2]);
                } else if (returnDateField.includes('/')) {
                    expDate = new Date(returnDateField);
                } else {
                    expDate = new Date(returnDateField);
                }
                
                expDate.setHours(0, 0, 0, 0);
                
                if (today > expDate) {
                    statusText = "Terlambat Dikembalikan";
                    statusClass = "status-badge red";
                    
                    const diffTime = Math.abs(today - expDate);
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                    
                    lateFee = diffDays * (item.amount || 0);
                    lateText = `<br><small style="color: #EF4444; font-weight: bold; display: block; margin-top: 5px;">⚠️ Denda Rp ${lateFee.toLocaleString()} (${diffDays} Hari Terlambat)</small>`;
                }
            }
            
            // Ambil nama customer dari berbagai field yang mungkin
            const customerName = item.username_customer || item.user || 'Customer';
            
            // Parse items jika dalam format JSONB
            let itemsDisplay = 'Barang tidak terdeteksi';
            if (item.items) {
                if (typeof item.items === 'string') {
                    try {
                        const parsedItems = JSON.parse(item.items);
                        itemsDisplay = parsedItems.map(i => i.name).join(", ");
                    } catch (e) {
                        itemsDisplay = item.items;
                    }
                } else if (Array.isArray(item.items)) {
                    itemsDisplay = item.items.map(i => i.name).join(", ");
                }
            }
            
            recentBody.innerHTML += `
                <tr style="border-bottom: 1px solid #F3F4F6;">
                    <td style="padding: 14px;"><strong style="color: #1F2937;">${customerName}</strong></td>
                    <td style="padding: 14px;"><small style="color: #6B7280;">${itemsDisplay}</small></td>
                    <td style="padding: 14px; color: #6B7280;">${item.startDate || item.rental_date || "-"}</td>
                    <td style="padding: 14px; color: #6B7280;">${returnDateField || "-"}</td>
                    <td style="padding: 14px;">
                        <span class="${statusClass}">${statusText}</span>
                        ${lateText}
                    </td>
                    <td style="padding: 14px;">
                        <button onclick="finishRental(${item.id}, ${lateFee})" class="btn-return" style="padding: 8px 16px; background: #10B981; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 600; font-size: 13px; transition: all 0.2s;">
                            ✅ Selesaikan
                        </button>
                    </td>
                </tr>`;
        });
        
        console.log("✅ Dashboard loaded successfully!");
        
    } catch (error) {
        console.error("❌ Error loading dashboard:", error);
        alert("Error loading dashboard data: " + error.message);
    }
}

window.finishRental = async function(id, lateFee = 0) {
    let confirmMsg = "Konfirmasi bahwa barang sudah kembali dan pesanan selesai?";
    if (lateFee > 0) {
        confirmMsg = `PERINGATAN! Barang terlambat dikembalikan.\n\nTerdapat denda sebesar Rp ${lateFee.toLocaleString()}.\nPastikan pelanggan sudah membayar denda ini sebelum Anda menekan Lanjutkan.\n\nLanjutkan selesaikan pesanan?`;
    }
    
    showPopup(confirmMsg, "confirm", async () => {
        const updateData = {
            status: "Selesai",
            returnDate: new Date().toLocaleDateString('id-ID')
        };
        
        if (lateFee > 0) {
            const { data: currentItem } = await supabaseClient.from('user_history').select('amount').eq('id', id).single();
            updateData.amount = (currentItem?.amount || 0) + lateFee;
        }

        const { error } = await supabaseClient.from('user_history').update(updateData).eq('id', id);

        if (!error) {
            localStorage.removeItem("currentTransaction");
            showPopup("Pesanan Selesai! Data (termasuk denda) telah dipindahkan ke Reports.", "success", () => {
                loadDashboardData();
            });
        }
    });
};

// --- 3. PAYMENTS ---
async function loadAdminPayments() {
    const { data: history, error } = await supabaseClient.from('user_history').select('*');
    const table = document.getElementById("paymentTableAdmin");
    if (!table || error) return;

    const pendingPayments = history.filter(item => item.status === "Menunggu Verifikasi");

    table.innerHTML = "";
    if (pendingPayments.length === 0) {
        table.innerHTML = `<tr><td colspan="5" align="center">Tidak ada transaksi yang perlu divalidasi.</td></tr>`;
        return;
    }

    pendingPayments.forEach(item => {
        // ✅ DEFENSIF: Cegah Base64 URL dicampur dengan base URL
        let proofSrc = '';
        let proofHtml = 'No Proof';
        
        if (item.payment_proof && typeof item.payment_proof === 'string') {
            const rawProof = item.payment_proof.trim();
            // Cek apakah data:image atau URL biasa
            if (rawProof.startsWith('data:image')) {
                // ✅ BASE64: Gunakan onclick handler (bukan href) untuk hindari 502
                proofSrc = rawProof;
                // Escape single quotes untuk JavaScript string
                const escapedProof = rawProof.replace(/'/g, "\\'");
                proofHtml = `<img src="${proofSrc}" style="width:50px; height:50px; border-radius:4px; object-fit:cover; cursor:pointer;" onclick="window.open('${escapedProof}')" title="Klik untuk lihat bukti">`;
            } else {
                proofSrc = rawProof;
                proofHtml = `<a href="${proofSrc}" target="_blank"><img src="${proofSrc}" style="width:50px; height:50px; border-radius:4px; object-fit:cover;"></a>`;
            }
        }
        
        table.innerHTML += `
            <tr>
                <td>${item.date}</td>
                <td>${item.username_customer || item.user}</td>
                <td>Rp ${(item.amount || 0).toLocaleString()}</td>
                <td align="center">
                    ${proofHtml}
                </td>
                <td>
                    <button onclick="approvePayment(${item.id})" class="btn-primary" style="padding: 5px 10px;">TERIMA & MULAI</button>
                </td>
            </tr>`;
    });
}

window.approvePayment = function(id) {
    showPopup("Terima pembayaran dan mulai durasi sewa hari ini?", "confirm", async () => {
        const now = new Date();
        const dateStr = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') + '-' + String(now.getDate()).padStart(2, '0');

        const { error } = await supabaseClient
            .from('user_history')
            .update({ status: "Pembayaran Diterima", startDate: dateStr })
            .eq('id', id);

        if (!error) {
            showPopup("Pembayaran Diterima! Status sekarang 'Sedang Aktif'.", "success", () => {
                loadAdminPayments();
                loadDashboardData();
            });
        }
    });
};

// --- 4. REPORTS (BUSINESS ANALYTICS) ---
let reportFilterMode = "all";
let reportDateFrom = "";
let reportDateTo = "";
let allReportData = [];

async function loadReportData() {
    const { data, error } = await supabaseClient.from('user_history').select('*');
    allReportData = data || [];
    renderAllReports();
}

function getFilteredReportData() {
    let data = [...allReportData];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (reportFilterMode === "today") {
        data = data.filter(item => {
            const d = new Date(item.date);
            return d.toDateString() === today.toDateString();
        });
    } else if (reportFilterMode === "week") {
        const weekAgo = new Date(today);
        weekAgo.setDate(weekAgo.getDate() - 7);
        data = data.filter(item => new Date(item.date) >= weekAgo);
    } else if (reportFilterMode === "month") {
        const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
        data = data.filter(item => new Date(item.date) >= monthStart);
    } else if (reportFilterMode === "year") {
        const yearStart = new Date(today.getFullYear(), 0, 1);
        data = data.filter(item => new Date(item.date) >= yearStart);
    } else if (reportFilterMode === "custom" && reportDateFrom && reportDateTo) {
        const from = new Date(reportDateFrom);
        const to = new Date(reportDateTo);
        to.setHours(23, 59, 59, 999);
        data = data.filter(item => {
            const d = new Date(item.date);
            return d >= from && d <= to;
        });
    }
    return data;
}

function renderAllReports() {
    const filtered = getFilteredReportData();
    renderRevenueBreakdown(filtered);
    renderTopRentalItems(filtered);
    renderTopCustomers(filtered);
    renderStatusBreakdown(filtered);
    renderReportTable(filtered);
}

function renderRevenueBreakdown(data) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

    const validData = data.filter(i => i.status === "Pembayaran Diterima" || i.status === "Selesai");

    const revToday = validData.filter(i => new Date(i.date) >= today).reduce((s, i) => s + (i.amount || 0), 0);
    const revWeek = validData.filter(i => new Date(i.date) >= weekAgo).reduce((s, i) => s + (i.amount || 0), 0);
    const revMonth = validData.filter(i => new Date(i.date) >= monthStart).reduce((s, i) => s + (i.amount || 0), 0);
    const revTotal = validData.reduce((s, i) => s + (i.amount || 0), 0);

    document.getElementById("revenueToday").textContent = "Rp " + revToday.toLocaleString();
    document.getElementById("revenueWeek").textContent = "Rp " + revWeek.toLocaleString();
    document.getElementById("revenueMonth").textContent = "Rp " + revMonth.toLocaleString();
    document.getElementById("revenueTotal").textContent = "Rp " + revTotal.toLocaleString();

    const prevWeekData = allReportData.filter(i => {
        const d = new Date(i.date);
        const prevStart = new Date(weekAgo);
        prevStart.setDate(prevStart.getDate() - 7);
        return d >= prevStart && d < weekAgo && (i.status === "Pembayaran Diterima" || i.status === "Selesai");
    });
    const prevWeekRev = prevWeekData.reduce((s, i) => s + (i.amount || 0), 0);
    const badge = document.getElementById("revenueTrendBadge");
    if (badge) {
        if (revWeek >= prevWeekRev && prevWeekRev > 0) {
            const pct = Math.round(((revWeek - prevWeekRev) / prevWeekRev) * 100);
            badge.textContent = "↑ +" + pct + "%";
            badge.style.color = "#10B981";
            badge.style.background = "#ECFDF5";
        } else if (prevWeekRev > 0) {
            const pct = Math.round(((prevWeekRev - revWeek) / prevWeekRev) * 100);
            badge.textContent = "↓ -" + pct + "%";
            badge.style.color = "#EF4444";
            badge.style.background = "#FEF2F2";
        } else {
            badge.textContent = "— Baru";
            badge.style.color = "#6B7280";
            badge.style.background = "#F3F4F6";
        }
    }
}

function renderTopRentalItems(data) {
    const container = document.getElementById("topRentalItems");
    if (!container) return;

    const itemCounts = {};
    data.forEach(tx => {
        if (tx.items) {
            try {
                // ✅ SAFE PARSING JSONB - Standardisasi
                let rawItems = typeof tx.items === 'string' ? JSON.parse(tx.items) : tx.items;
                let itemsArray = Array.isArray(rawItems) ? rawItems : (rawItems?.items || []);
                
                // Loop aman setelah validasi array
                if (Array.isArray(itemsArray) && itemsArray.length > 0) {
                    itemsArray.forEach(item => {
                        const name = item.name || "Unknown";
                        itemCounts[name] = (itemCounts[name] || 0) + (item.qty || 1);
                    });
                }
            } catch (e) {
                console.error("Error parsing items in renderTopRentalItems:", e, tx.items);
            }
        }
    });

    const sorted = Object.entries(itemCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);

    if (sorted.length === 0) {
        container.innerHTML = '<div style="text-align:center; padding:30px; color:#9CA3AF;">Belum ada data penyewaan</div>';
        return;
    }

    const maxCount = sorted[0][1];
    const medals = ["🥇", "🥈", "🥉", "🏅", "🏅"];
    const colors = ["#D4A017", "#9CA3AF", "#CD7F32", "#355E3B", "#355E3B"];

    container.innerHTML = sorted.map((item, i) => {
        const pct = Math.round((item[1] / maxCount) * 100);
        return `
            <div style="display:flex; align-items:center; gap:14px; padding:14px 0; ${i < sorted.length - 1 ? "border-bottom:1px solid #F3F4F6;" : ""}">
                <span style="font-size:24px; width:36px; text-align:center;">${medals[i]}</span>
                <div style="flex:1;">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
                        <span style="font-size:14px; font-weight:600; color:#1F2937;">${item[0]}</span>
                        <span style="font-size:13px; font-weight:700; color:${colors[i]};">${item[1]}x disewa</span>
                    </div>
                    <div style="height:8px; background:#F3F4F6; border-radius:4px; overflow:hidden;">
                        <div style="height:100%; width:${pct}%; background:linear-gradient(90deg, ${colors[i]}, ${colors[i]}88); border-radius:4px; transition:width 0.6s ease;"></div>
                    </div>
                    <div style="font-size:11px; color:#9CA3AF; margin-top:4px;">${pct}% dari total</div>
                </div>
            </div>`;
    }).join("");
}

function renderTopCustomers(data) {
    const container = document.getElementById("topCustomers");
    if (!container) return;

    const userCounts = {};
    data.forEach(tx => {
        const user = tx.user || "Unknown";
        userCounts[user] = (userCounts[user] || 0) + 1;
    });

    const sorted = Object.entries(userCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);

    if (sorted.length === 0) {
        container.innerHTML = '<div style="text-align:center; padding:30px; color:#9CA3AF;">Belum ada data customer</div>';
        return;
    }

    const maxCount = sorted[0][1];
    const avatarColors = ["#355E3B", "#8DAA91", "#D4A017", "#6366F1", "#EC4899"];

    container.innerHTML = sorted.map((item, i) => {
        const initial = item[0].charAt(0).toUpperCase();
        const isLoyal = item[1] >= 5;
        return `
            <div style="display:flex; align-items:center; gap:14px; padding:14px 0; ${i < sorted.length - 1 ? "border-bottom:1px solid #F3F4F6;" : ""}">
                <div style="width:44px; height:44px; border-radius:50%; background:${avatarColors[i % avatarColors.length]}; display:flex; align-items:center; justify-content:center; color:white; font-weight:700; font-size:16px; flex-shrink:0;">${initial}</div>
                <div style="flex:1;">
                    <div style="display:flex; justify-content:space-between; align-items:center;">
                        <div>
                            <span style="font-size:14px; font-weight:600; color:#1F2937;">${item[0]}</span>
                            ${isLoyal ? '<span style="font-size:10px; font-weight:700; color:#D4A017; background:#FEF9C3; padding:2px 8px; border-radius:10px; margin-left:8px;">⭐ LOYAL</span>' : ''}
                        </div>
                        <span style="font-size:13px; font-weight:600; color:#6B7280;">${item[1]} transaksi</span>
                    </div>
                    <div style="height:6px; background:#F3F4F6; border-radius:3px; overflow:hidden; margin-top:8px;">
                        <div style="height:100%; width:${Math.round((item[1] / maxCount) * 100)}%; background:${avatarColors[i % avatarColors.length]}; border-radius:3px; transition:width 0.6s ease;"></div>
                    </div>
                </div>
            </div>`;
    }).join("");
}

function renderStatusBreakdown(data) {
    const container = document.getElementById("statusBreakdown");
    if (!container) return;

    const total = data.length || 1;
    const statuses = [
        { key: "Selesai", label: "Selesai", color: "#10B981", bg: "#ECFDF5", icon: "✅" },
        { key: "Pembayaran Diterima", label: "Aktif", color: "#3B82F6", bg: "#EFF6FF", icon: "🔵" },
        { key: "Menunggu Verifikasi", label: "Pending", color: "#F59E0B", bg: "#FFFBEB", icon: "⏳" },
        { key: "Terlambat", label: "Terlambat", color: "#EF4444", bg: "#FEF2F2", icon: "🔴" }
    ];

    const statusCounts = {};
    data.forEach(tx => { statusCounts[tx.status] = (statusCounts[tx.status] || 0) + 1; });

    const lateCount = data.filter(tx => {
        if (tx.status === "Pembayaran Diterima" && tx.expectedReturnDate) {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const parts = tx.expectedReturnDate.split("-");
            const expDate = new Date(parts[0], parts[1] - 1, parts[2]);
            expDate.setHours(0, 0, 0, 0);
            return today > expDate;
        }
        return false;
    }).length;

    container.innerHTML = '<div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(200px, 1fr)); gap:16px;">' +
        statuses.map(s => {
            let count = s.key === "Terlambat" ? lateCount : (statusCounts[s.key] || 0);
            const pct = Math.round((count / total) * 100);
            return `
                <div style="padding:20px; background:${s.bg}; border-radius:14px; border:1px solid ${s.color}22;">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
                        <span style="font-size:13px; font-weight:600; color:#6B7280;">${s.icon} ${s.label}</span>
                        <span style="font-size:20px; font-weight:700; color:${s.color};">${count}</span>
                    </div>
                    <div style="height:8px; background:rgba(0,0,0,0.06); border-radius:4px; overflow:hidden;">
                        <div style="height:100%; width:${pct}%; background:${s.color}; border-radius:4px; transition:width 0.6s ease;"></div>
                    </div>
                    <div style="font-size:11px; color:#9CA3AF; margin-top:6px;">${pct}% dari total</div>
                </div>`;
        }).join("") + "</div>";
}

function renderReportTable(data) {
    const reportBody = document.getElementById("reportTableBody");
    const countEl = document.getElementById("reportDataCount");
    if (!reportBody) return;

    if (countEl) countEl.textContent = data.length + " transaksi";

    if (data.length === 0) {
        reportBody.innerHTML = '<tr><td colspan="5" style="padding:40px; text-align:center; color:#9CA3AF;">Tidak ada data untuk filter ini.</td></tr>';
        return;
    }

    const reversed = data.slice().reverse();
    reportBody.innerHTML = reversed.map(item => {
        const statusMap = {
            "Selesai": { cls: "success", bg: "#ECFDF5", color: "#065F46" },
            "Pembayaran Diterima": { cls: "active", bg: "#EFF6FF", color: "#1E40AF" },
            "Menunggu Verifikasi": { cls: "pending", bg: "#FFFBEB", color: "#92400E" },
            "Dibatalkan": { cls: "red", bg: "#FEF2F2", color: "#991B1B" }
        };
        const st = statusMap[item.status] || { bg: "#F3F4F6", color: "#6B7280" };

        // ✅ SAFE PARSING JSONB - Standardisasi
        let itemNames = "-";
        if (item.items) {
            try {
                let rawItems = typeof item.items === 'string' ? JSON.parse(item.items) : item.items;
                let itemsArray = Array.isArray(rawItems) ? rawItems : (rawItems?.items || []);
                if (Array.isArray(itemsArray) && itemsArray.length > 0) {
                    itemNames = itemsArray.map(i => i.name || 'Produk').join(", ");
                }
            } catch (e) {
                console.error("Error parsing items in renderReportTable:", e);
                itemNames = "Error parsing";
            }
        }

        return `<tr style="border-bottom:1px solid #F3F4F6; transition:background 0.2s;" onmouseover="this.style.background='#F9FAFB'" onmouseout="this.style.background=''">
            <td style="padding:14px 24px; font-size:13px; color:#6B7280; white-space:nowrap;">${item.date || "-"}</td>
            <td style="padding:14px 24px; font-size:14px; font-weight:600; color:#1F2937;">${item.user || item.username_customer || "-"}</td>
            <td style="padding:14px 24px; font-size:13px; color:#6B7280; max-width:250px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${itemNames}</td>
            <td style="padding:14px 24px; font-size:14px; font-weight:600; color:#1F2937;">Rp ${(item.amount || 0).toLocaleString()}</td>
            <td style="padding:14px 24px;">
                <span style="display:inline-block; padding:5px 12px; border-radius:20px; font-size:11px; font-weight:700; background:${st.bg}; color:${st.color}; text-transform:uppercase; letter-spacing:0.3px;">${item.status}</span>
            </td>
        </tr>`;
    }).join("");
}

function filterReportTable() {
    const search = (document.getElementById("reportSearch")?.value || "").toLowerCase();
    const clearBtn = document.getElementById("reportSearchClear");
    if (clearBtn) clearBtn.style.display = search ? "block" : "none";

    let filtered = getFilteredReportData();

    if (search) {
        filtered = filtered.filter(item => {
            const userMatch = (item.user || item.username_customer || "").toLowerCase().includes(search);
            
            // ✅ SAFE PARSING JSONB for search
            let itemMatch = false;
            if (item.items) {
                try {
                    let rawItems = typeof item.items === 'string' ? JSON.parse(item.items) : item.items;
                    let itemsArray = Array.isArray(rawItems) ? rawItems : (rawItems?.items || []);
                    itemMatch = Array.isArray(itemsArray) && itemsArray.some(i => (i.name || "").toLowerCase().includes(search));
                } catch (e) {
                    // Ignore parse errors in search
                }
            }
            
            const statusMatch = (item.status || "").toLowerCase().includes(search);
            const dateMatch = (item.date || "").toLowerCase().includes(search);
            return userMatch || itemMatch || statusMatch || dateMatch;
        });
    }

    renderReportTable(filtered);
    const countEl = document.getElementById("reportDataCount");
    if (countEl) countEl.textContent = filtered.length + " transaksi";
}

function exportReportPDF() {
    const data = getFilteredReportData();
    if (data.length === 0) { alert("Tidak ada data untuk di-export!"); return; }

    let content = "LANGKAH PENDAKI - BUSINESS ANALYTICS REPORT\n";
    content += "Generated: " + new Date().toLocaleString("id-ID") + "\n";
    content += "=".repeat(60) + "\n\n";

    const revTotal = data.filter(i => ["Pembayaran Diterima", "Selesai"].includes(i.status))
        .reduce((s, i) => s + (i.amount || 0), 0);
    content += "TOTAL PENDAPATAN: Rp " + revTotal.toLocaleString() + "\n";
    content += "TOTAL TRANSAKSI: " + data.length + "\n\n";

    content += "RIWAYAT TRANSAKSI:\n";
    content += "-".repeat(60) + "\n";
    data.slice().reverse().forEach((item, i) => {
        // ✅ SAFE PARSING JSONB for export
        let items = "-";
        if (item.items) {
            try {
                let rawItems = typeof item.items === 'string' ? JSON.parse(item.items) : item.items;
                let itemsArray = Array.isArray(rawItems) ? rawItems : (rawItems?.items || []);
                if (Array.isArray(itemsArray) && itemsArray.length > 0) {
                    items = itemsArray.map(x => x.name || 'Produk').join(", ");
                }
            } catch (e) {
                items = "Error parsing";
            }
        }
        content += (i + 1) + ". " + (item.date || "-") + " | " + (item.user || item.username_customer || "-") + " | " + items + " | Rp " + (item.amount || 0).toLocaleString() + " | " + (item.status || "-") + "\n";
    });

    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "LangkahPendaki_Report_" + new Date().toISOString().slice(0, 10) + ".txt";
    a.click();
    URL.revokeObjectURL(url);
    alert("Report berhasil di-export!");
}

function exportReportCSV() {
    const data = getFilteredReportData();
    if (data.length === 0) { alert("Tidak ada data untuk di-export!"); return; }

    let csv = "Tanggal,Customer,Item,Total Bayar,Status\n";
    data.slice().reverse().forEach(item => {
        // ✅ SAFE PARSING JSONB for CSV export
        let items = "-";
        if (item.items) {
            try {
                let rawItems = typeof item.items === 'string' ? JSON.parse(item.items) : item.items;
                let itemsArray = Array.isArray(rawItems) ? rawItems : (rawItems?.items || []);
                if (Array.isArray(itemsArray) && itemsArray.length > 0) {
                    items = itemsArray.map(x => x.name || 'Produk').join("; ");
                }
            } catch (e) {
                items = "Error parsing";
            }
        }
        csv += '"' + (item.date || "") + '","' + (item.user || item.username_customer || "") + '","' + items + '",' + (item.amount || 0) + ',"' + (item.status || "") + '"\n';
    });

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "LangkahPendaki_Report_" + new Date().toISOString().slice(0, 10) + ".csv";
    a.click();
    URL.revokeObjectURL(url);
    alert("CSV berhasil di-export!");
}

// --- 5. INVENTORY (PRODUCT MANAGEMENT DASHBOARD) ---
let inventorySort = "newest";

// Image upload handler for Add Item
document.getElementById("itemImage")?.addEventListener("change", function(e) {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(event) {
            currentUploadedImage = event.target.result;
            const wrap = document.getElementById("imagePreviewContainer");
            const img = document.getElementById("imagePreview");
            const placeholder = document.getElementById("addImagePlaceholder");
            if (img && wrap) { img.src = currentUploadedImage; wrap.style.display = "block"; }
            if (placeholder) placeholder.style.display = "none";
        };
        reader.readAsDataURL(file);
    }
});

// Image upload handler for Edit Item
document.getElementById("editItemPhoto")?.addEventListener("change", function(e) {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(event) {
            currentUploadedImage = event.target.result;
            const wrap = document.getElementById("editImagePreviewWrap");
            if (wrap) wrap.innerHTML = '<img src="' + event.target.result + '" style="max-width:100%; height:180px; object-fit:cover; border-radius:12px; border:1px solid #E5E7EB;">';
        };
        reader.readAsDataURL(file);
    }
});

function removeAddItemImage() {
    currentUploadedImage = "";
    const wrap = document.getElementById("imagePreviewContainer");
    const placeholder = document.getElementById("addImagePlaceholder");
    const input = document.getElementById("itemImage");
    if (wrap) wrap.style.display = "none";
    if (placeholder) placeholder.style.display = "block";
    if (input) input.value = "";
}

window.openAddItemModal = function() {
    currentUploadedImage = "";
    document.getElementById("addItemModal").style.display = "flex";
    const wrap = document.getElementById("imagePreviewContainer");
    const placeholder = document.getElementById("addImagePlaceholder");
    const input = document.getElementById("itemImage");
    if (wrap) wrap.style.display = "none";
    if (placeholder) placeholder.style.display = "block";
    if (input) input.value = "";
    ["itemName", "itemStock", "itemPrice"].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = "";
    });
};

window.closeAddItemModal = function() {
    document.getElementById("addItemModal").style.display = "none";
};

window.openEditModal = async function(id) {
    const { data: items, error } = await supabaseClient.from('inventory').select('*');
    const item = items?.find(i => i.id === id);
    if (!item) return;

    document.getElementById("editItemId").value = item.id;
    document.getElementById("editItemName").value = item.name;
    document.getElementById("editItemCategory").value = item.category || "Tenda";
    document.getElementById("editItemStock").value = item.stock;
    document.getElementById("editItemPrice").value = item.price;

    // ✅ RESOLVE IMAGE PATH untuk preview modal
    let previewSrc = '';
    if (item.image && typeof item.image === 'string' && item.image.trim() !== '') {
        const rawImage = item.image.trim();
        if (rawImage.startsWith('data:image')) {
            previewSrc = rawImage; // Base64 langsung
        } else if (rawImage.startsWith('http://') || rawImage.startsWith('https://')) {
            previewSrc = rawImage; // URL absolut
        } else if (rawImage.startsWith('../')) {
            previewSrc = rawImage; // Sudah relatif
        } else if (rawImage.startsWith('public/')) {
            previewSrc = '../' + rawImage;
        } else if (rawImage.startsWith('/')) {
            previewSrc = '..' + rawImage;
        } else {
            previewSrc = '../' + rawImage;
        }
    }

    const wrap = document.getElementById("editImagePreviewWrap");
    if (previewSrc) {
        wrap.innerHTML = '<img src="' + previewSrc + '" style="max-width:100%; height:180px; object-fit:cover; border-radius:12px; border:1px solid #E5E7EB;" onerror="this.onerror=null; this.src=\'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22400%22 height=%22240%22%3E%3Crect fill=%22%23f3f4f6%22 width=%22400%22 height=%22240%22/%3E%3Ctext fill=%22%239ca3af%22 font-size=%2214%22 x=%2250%25%22 y=%2250%25%22 dominant-baseline=%22middle%22 text-anchor=%22middle%22%3ENo Image%3C/text%3E%3C/svg%3E\';">';
    } else {
        wrap.innerHTML = '<p style="font-size:13px; color:#9CA3AF;">Klik untuk mengganti foto</p>';
    }
    currentUploadedImage = item.image || "";
    document.getElementById("editItemModal").style.display = "flex";
};

window.closeEditModal = function() {
    document.getElementById("editItemModal").style.display = "none";
    // Reset currentUploadedImage agar tidak terbawa ke operasi lain
    currentUploadedImage = "";
};

window.saveEditItem = async function() {
    const id = parseInt(document.getElementById("editItemId").value);
    const name = document.getElementById("editItemName").value.trim();
    const category = document.getElementById("editItemCategory").value;
    const stock = parseInt(document.getElementById("editItemStock").value);
    const price = parseInt(document.getElementById("editItemPrice").value);

    if (!name || isNaN(stock) || isNaN(price)) {
        return showPopup("Lengkapi semua data dengan benar!", "error");
    }

    const updateData = {
        name: name,
        category: category,
        stock: stock,
        price: price
    };
    
    // ✅ Kirim gambar hanya jika user benar-benar mengupload file baru
    // currentUploadedImage di-set oleh openEditModal (dari DB) DAN oleh FileReader (dari upload baru)
    // Untuk deteksi file baru: cek apakah currentUploadedImage dimulai dengan 'data:image'
    if (currentUploadedImage && currentUploadedImage.startsWith('data:image')) {
        updateData.image = currentUploadedImage;
    } else if (currentUploadedImage && !currentUploadedImage.startsWith('data:image')) {
        // Jika bukan base64 (path biasa), tetap kirim biar tidak hilang
        updateData.image = currentUploadedImage;
    }

    const { error } = await supabaseClient.from('inventory').update(updateData).eq('id', id);

    if (error) {
        showPopup("Gagal memperbarui: " + error.message, "error");
    } else {
        closeEditModal();
        showPopup("Barang berhasil diperbarui!", "success", () => {
            filterAndRenderInventory();
            loadDashboardData();
        });
    }
};

window.addItem = async function() {
    const categoryInput = document.getElementById("itemCategory");
    const nameInput = document.getElementById("itemName");
    const stockInput = document.getElementById("itemStock");
    const priceInput = document.getElementById("itemPrice");

    if (!nameInput.value || !stockInput.value || !priceInput.value) {
        return showPopup("Lengkapi semua data terlebih dahulu!", "error");
    }

    const { error } = await supabaseClient.from('inventory').insert([{
        id: Date.now(),
        category: categoryInput.value,
        name: nameInput.value,
        stock: parseInt(stockInput.value),
        price: parseInt(priceInput.value),
        image: currentUploadedImage
    }]);

    if (error) {
        showPopup("Gagal menyimpan barang: " + error.message, "error");
    } else {
        closeAddItemModal();
        showPopup("Barang berhasil ditambahkan ke gudang cloud!", "success", () => {
            filterAndRenderInventory();
            loadDashboardData();
        });
    }
};

window.updateStock = async function(id) {
    const el = document.getElementById("edit-stock-" + id);
    if (!el) return;
    const newStock = el.value;
    
    if (newStock >= 0) {
        const { error } = await supabaseClient.from('inventory').update({ stock: parseInt(newStock) }).eq('id', id);
        
        if (!error) {
            showPopup("Stok berhasil diperbarui!", "success", () => {
                filterAndRenderInventory();
                loadDashboardData();
            });
        }
    }
};

window.deleteItem = function(id) {
    showPopup("Hapus barang ini dari gudang cloud?", "confirm", async () => {
        const { error } = await supabaseClient.from('inventory').delete().eq('id', id);
        if (!error) {
            filterAndRenderInventory();
            loadDashboardData();
        }
    });
};

async function filterAndRenderInventory() {
    const { data, error } = await supabaseClient.from('inventory').select('*');
    let items = data || [];
    if (error) console.error(error.message);
    
    const search = (document.getElementById("inventorySearch")?.value || "").toLowerCase();
    const clearBtn = document.getElementById("invSearchClear");
    if (clearBtn) clearBtn.style.display = search ? "block" : "none";

    if (search) {
        items = items.filter(i =>
            (i.name || "").toLowerCase().includes(search) ||
            (i.category || "").toLowerCase().includes(search)
        );
    }

    if (currentCategoryFilter !== "Semua") {
        items = items.filter(i => i.category === currentCategoryFilter);
    }

    const sortVal = document.getElementById("inventorySort")?.value || "newest";
    switch (sortVal) {
        case "newest": items.sort((a, b) => b.id - a.id); break;
        case "oldest": items.sort((a, b) => a.id - b.id); break;
        case "name-az": items.sort((a, b) => (a.name || "").localeCompare(b.name || "")); break;
        case "name-za": items.sort((a, b) => (b.name || "").localeCompare(a.name || "")); break;
        case "price-high": items.sort((a, b) => (b.price || 0) - (a.price || 0)); break;
        case "price-low": items.sort((a, b) => (a.price || 0) - (b.price || 0)); break;
        case "stock-high": items.sort((a, b) => (b.stock || 0) - (a.stock || 0)); break;
        case "stock-low": items.sort((a, b) => (a.stock || 0) - (b.stock || 0)); break;
    }

    renderInventoryCards(items);
    updateInventoryAnalytics();
}

function getStockStatus(stock) {
    if (stock <= 2) return { label: "Kritis", color: "#EF4444", bg: "#FEF2F2", icon: "🔴" };
    if (stock <= 5) return { label: "Menipis", color: "#F59E0B", bg: "#FFFBEB", icon: "🟡" };
    return { label: "Aman", color: "#10B981", bg: "#ECFDF5", icon: "🟢" };
}

function renderInventoryCards(items) {
    const grid = document.getElementById("inventoryGrid");
    if (!grid) return;

    if (items.length === 0) {
        grid.innerHTML = `
            <div style="grid-column:1/-1; text-align:center; padding:80px 20px;">
                <div style="font-size:64px; margin-bottom:16px; opacity:0.4;">📦</div>
                <h3 style="font-size:20px; font-weight:700; color:#1F2937; margin-bottom:8px;">Gudang Masih Kosong</h3>
                <p style="color:#9CA3AF; font-size:14px; margin-bottom:24px;">Tambahkan barang pertama untuk mulai mengelola inventory.</p>
                <button onclick="openAddItemModal()" class="btn-primary" style="padding:12px 28px; font-size:14px;">➕ Tambah Barang</button>
            </div>`;
        return;
    }

    grid.innerHTML = items.map(item => {
        // ✅ DEFENSIF RESOLUSI PATH GAMBAR + BASE64 PROTECTION
        let imgPath = item.image || '';
        if (imgPath && typeof imgPath === 'string' && imgPath.trim() !== '') {
            imgPath = imgPath.trim();
            
            // PRIORITAS UTAMA: Base64 - langsung pakai
            if (imgPath.startsWith('data:image')) {
                // Gunakan langsung tanpa modifikasi
            }
            // URL absolut
            else if (imgPath.startsWith('http://') || imgPath.startsWith('https://')) {
                // Gunakan langsung
            }
            // Path 'public/'
            else if (imgPath.startsWith('public/')) {
                imgPath = '../' + imgPath;
            }
            // Path 'dashboard/public/'
            else if (imgPath.startsWith('dashboard/public/')) {
                imgPath = imgPath.replace('dashboard/public/', '../public/');
            }
            // Path dengan '../' atau '/' - gunakan langsung
            else if (imgPath.startsWith('../') || imgPath.startsWith('/')) {
                // Gunakan langsung
            }
            // Default: tambahkan '../'
            else {
                imgPath = '../' + imgPath;
            }
        } else {
            imgPath = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="240"%3E%3Crect fill="%23f3f4f6" width="400" height="240"/%3E%3Ctext fill="%239ca3af" font-family="Arial" font-size="14" x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle"%3ENo Image%3C/text%3E%3C/svg%3E';
        }
        
        const status = getStockStatus(item.stock || 0);
        const catColors = { "Tenda": "#3B82F6", "Carrier": "#F59E0B", "Gear": "#10B981", "Peripherals": "#8B5CF6" };
        const catColor = catColors[item.category] || "#6B7280";

        return `
            <div class="product-mgmt-card" style="background:white; border:1px solid #E5E7EB; border-radius:16px; overflow:hidden; transition:all 0.3s; box-shadow:0 1px 3px rgba(0,0,0,0.04);" onmouseover="this.style.transform='translateY(-4px)'; this.style.boxShadow='0 12px 28px rgba(0,0,0,0.1)'" onmouseout="this.style.transform=''; this.style.boxShadow='0 1px 3px rgba(0,0,0,0.04)'">
                <div style="height:180px; overflow:hidden; background:#F3F4F6;">
                    <img src="${imgPath}" alt="${item.name}" style="width:100%; height:100%; object-fit:cover;" onerror="this.onerror=null; this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22400%22 height=%22240%22%3E%3Crect fill=%22%23f3f4f6%22 width=%22400%22 height=%22240%22/%3E%3Ctext fill=%22%239ca3af%22 font-size=%2214%22 x=%2250%25%22 y=%2250%25%22 dominant-baseline=%22middle%22 text-anchor=%22middle%22%3ENo Image%3C/text%3E%3C/svg%3E';">
                </div>
                <div style="padding:20px;">
                    <div style="display:flex; justify-content:space-between; align-items:start; margin-bottom:12px;">
                        <span style="display:inline-block; padding:4px 10px; border-radius:6px; font-size:11px; font-weight:700; background:${catColor}15; color:${catColor};">${item.category || 'Lainnya'}</span>
                        <span style="display:inline-flex; align-items:center; gap:4px; padding:4px 10px; border-radius:6px; font-size:11px; font-weight:700; background:${status.bg}; color:${status.color};">${status.icon} ${status.label}</span>
                    </div>
                    <h3 style="font-size:16px; font-weight:700; color:#1F2937; margin-bottom:4px; line-height:1.3;">${item.name}</h3>
                    <div style="display:flex; align-items:baseline; gap:4px; margin-bottom:12px;">
                        <span style="font-size:20px; font-weight:700; color:var(--primary);">Rp ${(item.price || 0).toLocaleString()}</span>
                        <span style="font-size:12px; color:#9CA3AF;">/hari</span>
                    </div>
                    <div style="display:flex; justify-content:space-between; align-items:center; padding-top:12px; border-top:1px solid #F3F4F6;">
                        <span style="font-size:13px; color:#6B7280; font-weight:500;">Stok: <strong>${item.stock || 0}</strong> unit</span>
                        <div style="display:flex; gap:6px;">
                            <button onclick="openEditModal(${item.id})" style="padding:6px 12px; background:#EFF6FF; color:#2563EB; border:none; border-radius:8px; cursor:pointer; font-size:12px; font-weight:600; transition:0.2s;" onmouseover="this.style.background='#DBEAFE'" onmouseout="this.style.background='#EFF6FF'">✏️ Edit</button>
                            <button onclick="deleteItem(${item.id})" style="padding:6px 12px; background:#FEF2F2; color:#EF4444; border:none; border-radius:8px; cursor:pointer; font-size:12px; font-weight:600; transition:0.2s;" onmouseover="this.style.background='#FEE2E2'" onmouseout="this.style.background='#FEF2F2'">🗑️</button>
                        </div>
                    </div>
                </div>
            </div>`;
    }).join("");
}

async function updateInventoryAnalytics() {
    const { data: items, error } = await supabaseClient.from('inventory').select('*');
    const inventoryData = items || [];

    const totalProducts = inventoryData.length;
    const totalStock = inventoryData.reduce((s, i) => s + (i.stock || 0), 0);
    const categories = [...new Set(inventoryData.map(i => i.category).filter(Boolean))];
    const criticalItems = inventoryData.filter(i => (i.stock || 0) <= 2);
    const totalValue = inventoryData.reduce((s, i) => s + ((i.price || 0) * (i.stock || 0)), 0);

    const mostExpensive = inventoryData.length > 0 ? inventoryData.reduce((a, b) => (a.price || 0) > (b.price || 0) ? a : b) : null;
    const mostStock = inventoryData.length > 0 ? inventoryData.reduce((a, b) => (a.stock || 0) > (b.stock || 0) ? a : b) : null;
    const almostEmpty = inventoryData.filter(i => (i.stock || 0) > 0 && (i.stock || 0) <= 5);

    const setText = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
    setText("invTotalProducts", totalProducts);
    setText("invTotalStock", totalStock);
    setText("invTotalCategories", categories.length);
    setText("invCriticalStock", criticalItems.length);
    setText("invTotalValue", "Rp " + totalValue.toLocaleString());
    setText("invMostExpensive", mostExpensive ? mostExpensive.name + " (Rp " + (mostExpensive.price || 0).toLocaleString() + "/hari)" : "-");
    setText("invMostStock", mostStock ? mostStock.name + " (" + (mostStock.stock || 0) + " unit)" : "-");
    setText("invAlmostEmpty", almostEmpty.length > 0 ? almostEmpty.map(i => i.name).join(", ") : "Semua aman");
}

// --- 6. LOGOUT ---
document.getElementById("logoutBtn")?.addEventListener("click", () => {
    showPopup("Apakah Anda yakin ingin keluar?", "confirm", () => {
        window.location.href = "../project-folder/index.html";
    });
});

// --- CHARTS INITIALIZATION ---
let rentalChart = null;
let categoryChart = null;

async function initCharts() {
    const { data: history, error: historyError } = await supabaseClient.from('user_history').select('*');
    const { data: inventory, error: inventoryError } = await supabaseClient.from('inventory').select('*');
    
    const historyData = history || [];
    const inventoryData = inventory || [];
    
    const rentalCtx = document.getElementById('rentalChart');
    if (rentalCtx) {
        const monthlyData = [0, 0, 0, 0, 0, 0];
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun'];
        
        historyData.forEach(item => {
            if (item.date) {
                const month = new Date(item.date).getMonth();
                if (month >= 0 && month < 6) monthlyData[month]++;
            }
        });
        
        if (rentalChart) rentalChart.destroy();
        rentalChart = new Chart(rentalCtx, {
            type: 'line',
            data: {
                labels: months,
                datasets: [{
                    label: 'Penyewaan',
                    data: monthlyData,
                    borderColor: '#355E3B',
                    backgroundColor: 'rgba(53, 94, 59, 0.1)',
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    y: { beginAtZero: true, ticks: { stepSize: 1 } }
                }
            }
        });
    }
    
    const categoryCtx = document.getElementById('categoryChart');
    if (categoryCtx) {
        const categories = {};
        inventoryData.forEach(item => {
            const cat = item.category || 'Lainnya';
            categories[cat] = (categories[cat] || 0) + 1;
        });
        
        if (categoryChart) categoryChart.destroy();
        categoryChart = new Chart(categoryCtx, {
            type: 'doughnut',
            data: {
                labels: Object.keys(categories),
                datasets: [{
                    data: Object.values(categories),
                    backgroundColor: ['#355E3B', '#8DAA91', '#D4A017', '#6B7280'],
                    borderWidth: 2,
                    borderColor: '#fff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: { position: 'bottom' }
                }
            }
        });
    }
}

// Update loadDashboardData to init charts
const originalLoadDashboard = loadDashboardData;
loadDashboardData = async function() {
    await originalLoadDashboard();
    setTimeout(() => initCharts(), 100);
};

// DEBUG PAYMENT ISSUE
function debugPayments() {
    console.log("=== DEBUG PAYMENTS ===");
    console.log("Fetching from Supabase user_history table...");
    console.log("=====================");
}

// Call debug when payments tab is opened
const originalLoadAdminPayments = loadAdminPayments;
loadAdminPayments = async function() {
    debugPayments();
    await originalLoadAdminPayments();
};

// AUTO REFRESH PAYMENTS EVERY 5 SECONDS
let autoRefreshInterval = null;

function startAutoRefresh() {
    if (autoRefreshInterval) clearInterval(autoRefreshInterval);
    autoRefreshInterval = setInterval(() => {
        const activeTab = document.querySelector('.menu.active');
        if (activeTab && activeTab.dataset.target === 'payments') {
            loadAdminPayments();
        }
    }, 5000);
}

// Start auto refresh when DOM loaded
document.addEventListener('DOMContentLoaded', async () => {
    startAutoRefresh();
    await loadDashboardData();

    // Filter pill buttons
    const pills = document.querySelectorAll("#inventoryTabs .filter-pill");
    pills.forEach(btn => {
        btn.addEventListener("click", (e) => {
            pills.forEach(b => b.classList.remove("active"));
            e.target.classList.add("active");
            currentCategoryFilter = e.target.dataset.filter;
            filterAndRenderInventory();
        });
    });

    // Report filter event listeners
    const quickFilter = document.getElementById("reportFilterQuick");
    if (quickFilter) {
        quickFilter.addEventListener("change", (e) => {
            reportFilterMode = e.target.value;
            const customRange = document.getElementById("customDateRange");
            if (customRange) customRange.style.display = reportFilterMode === "custom" ? "block" : "none";
            renderAllReports();
        });
    }

    const dateFrom = document.getElementById("reportDateFrom");
    const dateTo = document.getElementById("reportDateTo");
    if (dateFrom) dateFrom.addEventListener("change", () => {
        reportDateFrom = dateFrom.value;
        if (reportDateFrom && reportDateTo) renderAllReports();
    });
    if (dateTo) dateTo.addEventListener("change", () => {
        reportDateTo = dateTo.value;
        if (reportDateFrom && reportDateTo) renderAllReports();
    });
});

// === MODERN ENHANCEMENTS V2.0 ===

// Display Current Date
function displayCurrentDate() {
    const dateEl = document.getElementById('currentDate');
    if (dateEl) {
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        const today = new Date().toLocaleDateString('id-ID', options);
        dateEl.textContent = today;
    }
}

// Dark Mode Toggle
const darkModeToggle = document.getElementById('darkModeToggle');
if (darkModeToggle) {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    
    darkModeToggle.addEventListener('click', () => {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        darkModeToggle.querySelector('span').textContent = newTheme === 'dark' ? '??' : '??';
    });
    
    if (savedTheme === 'dark') {
        darkModeToggle.querySelector('span').textContent = '??';
    }
}

// Update notification counts
async function updateNotificationCounts() {
    console.log("🔔 Updating Notification Counts from Supabase...");
    
    try {
        // QUERY 1: Ambil semua transaksi
        const { data: history, error: historyError } = await supabaseClient.from('user_history').select('*');
        if (historyError) throw new Error("Error fetching history: " + historyError.message);
        
        // QUERY 2: Ambil semua inventory
        const { data: inventory, error: inventoryError } = await supabaseClient.from('inventory').select('*');
        if (inventoryError) throw new Error("Error fetching inventory: " + inventoryError.message);
        
        const historyData = history || [];
        const inventoryData = inventory || [];
        
        // NOTIFIKASI 1: Pembayaran Menunggu Verifikasi
        const pendingPayments = historyData.filter(item => item.status === 'Menunggu Verifikasi').length;
        
        // NOTIFIKASI 2: Penyewaan Terlambat (Pembayaran Diterima tapi melewati tanggal kembali)
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const lateRentals = historyData.filter(item => {
            if (item.status === 'Pembayaran Diterima') {
                const returnDateField = item.return_date || item.expectedReturnDate;
                
                if (returnDateField) {
                    let expDate;
                    
                    // Parse berbagai format tanggal
                    if (returnDateField.includes('-')) {
                        const parts = returnDateField.split('-');
                        expDate = new Date(parts[0], parts[1] - 1, parts[2]);
                    } else if (returnDateField.includes('/')) {
                        expDate = new Date(returnDateField);
                    } else {
                        expDate = new Date(returnDateField);
                    }
                    
                    expDate.setHours(0, 0, 0, 0);
                    return today > expDate;
                }
            }
            return false;
        }).length;
        
        // NOTIFIKASI 3: Stok Hampir Habis (stock <= 2)
        const lowStock = inventoryData.filter(item => {
            const stock = parseInt(item.stock || 0);
            return stock > 0 && stock <= 2;
        }).length;
        
        // NOTIFIKASI 4: Stok Habis Total (stock = 0)
        const outOfStock = inventoryData.filter(item => parseInt(item.stock || 0) === 0).length;
        
        // TOTAL NOTIFIKASI
        const totalNotifications = pendingPayments + lateRentals + lowStock;
        
        // UPDATE UI ELEMENTS
        const pendingEl = document.getElementById('pendingPaymentsCount');
        const lateEl = document.getElementById('lateRentalsCount');
        const lowStockEl = document.getElementById('lowStockCount');
        const totalNotif = document.getElementById('totalNotifications');
        
        if (pendingEl) pendingEl.textContent = pendingPayments;
        if (lateEl) lateEl.textContent = lateRentals;
        if (lowStockEl) lowStockEl.textContent = lowStock;
        if (totalNotif) totalNotif.textContent = totalNotifications;
        
        // Log untuk debugging
        console.log("📊 Notification Stats:");
        console.log("  💳 Pending Payments:", pendingPayments);
        console.log("  ⚠️ Late Rentals:", lateRentals);
        console.log("  📦 Low Stock:", lowStock);
        console.log("  🚫 Out of Stock:", outOfStock);
        console.log("  🔔 Total Notifications:", totalNotifications);
        
    } catch (error) {
        console.error("❌ Error updating notifications:", error);
    }
}

// Initialize enhancements on load
window.addEventListener('load', async () => {
    displayCurrentDate();
    await updateNotificationCounts();
    await loadDashboardData();
    startAutoRefresh();
});

// Update notification counts when dashboard loads
const originalDashboardLoad2 = loadDashboardData;
if (typeof originalDashboardLoad2 === 'function') {
    loadDashboardData = async function() {
        await originalDashboardLoad2();
        await updateNotificationCounts();
    };
}
