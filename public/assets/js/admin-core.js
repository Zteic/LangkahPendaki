/**
 * REVISI ENGINE UTAMA SAAS COMMAND CENTER ADMINISTRATOR - LANGKAH PENDAKI 2026
 * INTEGRATED WITH RISK CENTER & CENTRAL REPORTING AUDIT SYSTEM 2026
 */

// SINKRONISASI ISOLASI: Menghapus impor eksternal yang rentan crash jika path file helpers tidak tepat
let gridCurrentPage = 1;
let gridRowsPerPage = 10;
let gridSearchDebounceTimeout = null;

let calendarCurrentDate = new Date(); 

document.addEventListener("DOMContentLoaded", () => {
    // SEEDER AMAN: Memastikan LocalStorage / MySQL Simulasi Terisi Data Awal Agar Tidak Blank
    seedDefaultAdminDashboardDataIfMissing();

    initializeAdminBaseCommandCenter();
    startRealtimeClockAndGreetingEngine();
    executeAsynchronousKPILoadingSystem();
    
    // ATURAN REVISI 6: AUTO REFRESH DANA & METRIK TIAP 30 DETIK TANPA FULL PAGE RELOAD
    setInterval(() => {
        refreshNotificationDOM();
    }, 15000);
    
    // Pemicu awal agar data langsung terisi saat dom dimuat pertama kali
    registerNotificationControllerEndpoints();
    setupInitialMockNotificationsIfEmpty();
    refreshNotificationDOM();

    document.getElementById("gridSearchInput")?.addEventListener("input", (e) => {
        clearTimeout(gridSearchDebounceTimeout);
        gridSearchDebounceTimeout = setTimeout(() => {
            gridCurrentPage = 1; // Reset ke halaman pertama saat mencari
            fetchMySQLMetricsDataAsynchronously(true);
        }, 300); // Debounce delay 300ms tervalidasi
    });

    document.getElementById("filterRentalStatus")?.addEventListener("change", () => {
        gridCurrentPage = 1;
        fetchMySQLMetricsDataAsynchronously(true);
    });

    document.getElementById("filterCategory")?.addEventListener("change", () => {
        gridCurrentPage = 1;
        fetchMySQLMetricsDataAsynchronously(true);
    });

    // Inisialisasi Fitur Baru Langkah 14 Drag & Drop Area
    initializeGudangDragAndDropZoneEngine();
});

// ==========================================================================
// INTERNAL HELPERS (Mencegah Modul Crash Akibat File Hilang)
// ==========================================================================
function formatIDR(value) {
    return 'Rp ' + parseInt(value || 0).toLocaleString('id-ID');
}

function calculateRentDays(start, end) {
    const sDate = new Date(start);
    const eDate = new Date(end);
    const timeDiff = eDate.getTime() - sDate.getTime();
    return Math.ceil(timeDiff / (1000 * 3600 * 24)) || 1;
}

// ==========================================
// 1. ENGINE REAL-TIME CLOCK & DYNAMIC GREETING
// ==========================================
function startRealtimeClockAndGreetingEngine() {
    const clockEl = document.getElementById("liveClockText");
    const dateEl = document.getElementById("liveDateText");
    const greetingEl = document.getElementById("dynamicGreeting");

    // Array penampung nama-nama hari & bulan Indonesia
    const days = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
    const months = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];

    function updateTime() {
        const now = new Date();
        const hours = now.getHours();
        
        // A. Komputasi Sapaan Dinamis Berdasarkan Waktu Kontekstual (Aturan Revisi 1)
        let greeting = "Selamat Malam";
        if (hours >= 5 && hours < 11) greeting = "Selamat Pagi";
        else if (hours >= 11 && hours < 15) greeting = "Selamat Siang";
        else if (hours >= 15 && hours < 18) greeting = "Selamat Sore";

        if (greetingEl) greetingEl.innerHTML = `${greeting}, Ranger Commander 🌿`;

        // B. Update Jam Real-time
        if (clockEl) {
            clockEl.textContent = String(now.getHours()).padStart(2, '0') + ":" +
                                  String(now.getMinutes()).padStart(2, '0') + ":" +
                                  String(now.getSeconds()).padStart(2, '0');
        }

        // C. Update Tanggal Lengkap
        if (dateEl) {
            dateEl.textContent = `${days[now.getDay()]} , ${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()}`;
        }
    }

    updateTime();
    setInterval(updateTime, 1000);
}

// ==========================================
// 2. SHIMMER FADE-OUT & STAGGERED FADE-IN REVEAL
// ==========================================
function executeAsynchronousKPILoadingSystem() {
    const skeletonGrid = document.getElementById("kpiSkeletonGrid");
    const realGrid = document.getElementById("kpiRealGrid");

    // Simulasi penarikan data asinkron dari kueri basis data MySQL (Jeda 1.2 Detik)
    setTimeout(() => {
        if (skeletonGrid && realGrid) {
            // Animasi Fade-Out Skeleton Shimmer (Aturan Revisi 5)
            skeletonGrid.classList.add("opacity-0", "transition-opacity", "duration-300");
            
            setTimeout(() => {
                skeletonGrid.classList.add("hidden");
                realGrid.classList.remove("hidden");
                realGrid.classList.add("opacity-0");
                
                // Panggil fungsi penarik angka riil dari MySQL Mock
                fetchMySQLMetricsDataAsynchronously(false);
                
                // Staggered Animation Trigger: Memunculkan baris kartu satu per satu (Aturan Revisi 4)
                setTimeout(() => {
                    realGrid.classList.remove("opacity-0");
                    const cards = realGrid.querySelectorAll(".bg-white");
                    cards.forEach((card, idx) => {
                        card.style.opacity = "0";
                        card.style.transform = "translateY(15px)";
                        card.style.transition = `all 0.4s cubic-bezier(0.4, 0, 0.2, 1) ${idx * 60}ms`;
                        
                        setTimeout(() => {
                            card.style.opacity = "1";
                            card.style.transform = "translateY(0)";
                        }, 50);
                    });
                }, 50);
            }, 300);
        } else {
            // Jika skeleton grid tidak dipasang di HTML, langsung bypass render data riil agar tidak blank
            fetchMySQLMetricsDataAsynchronously(false);
        }
    }, 1200);
}

// ==========================================
// 3. GENERATE DYNAMIC QUERIES COUNTER (MySQL Mock)
// ==========================================
function fetchMySQLMetricsDataAsynchronously(isAutoRefresh = false) {
    // Penarikan repositori dari data seeder tabel database LangkahPendaki
    const history = JSON.parse(localStorage.getItem("userHistory")) || [];
    const products = JSON.parse(localStorage.getItem("inventory")) || [];
    
    // Eksekusi Kueri Efisien Aggregation (COUNT, SUM Snapshot) - Aturan Revisi 9
    const countActiveRentals = history.filter(item => item.status === "Pembayaran Diterima").length;
    const countPendingPayments = history.filter(item => item.status === "Menunggu Verifikasi").length;
    const totalUnitAvailable = products.reduce((sum, item) => sum + parseInt(item.stock || 0), 0);
    const totalRagamProduk = products.length;
    const totalCustomerRegistered = 342; // Simulasi query SELECT COUNT(id) FROM users
    
    const revenueToday = history.filter(item => item.status === "Selesai" || item.status === "Pembayaran Diterima")
                                .reduce((sum, item) => sum + (item.amount || 0), 0);

    // --------------------------------------------------------------------------
    // SINKRONISASI PANEL PRIORITAS HARI INI
    // --------------------------------------------------------------------------
    const todayStr = new Date().toISOString().split('T')[0];
    const returnTodayCount = history.filter(i => i.expectedReturnDate === todayStr && i.status === "Pembayaran Diterima").length;
    const maintenanceCount = 2; 

    if (document.getElementById("pri-payments")) document.getElementById("pri-payments").textContent = `${countPendingPayments} Menunggu`;
    if (document.getElementById("pri-returns")) document.getElementById("pri-returns").textContent = `${returnTodayCount} Hari Ini`;
    if (document.getElementById("pri-late")) document.getElementById("pri-late").textContent = `0 Alat (>3H)`;
    if (document.getElementById("pri-booking")) document.getElementById("pri-booking").textContent = `14 Hari Ini`;
    if (document.getElementById("pri-maintenance")) document.getElementById("pri-maintenance").textContent = `${maintenanceCount} Produk`;
    // --------------------------------------------------------------------------

    // Update Subtitle Ringkasan Informasi pada Header Real-time (Aturan Revisi 1)
    const summarySub = document.getElementById("realtimeSummarySub");
    if (summarySub) {
        summarySub.innerHTML = `Hari ini terdapat <span class='text-green-400 font-bold'>${countActiveRentals} penyewaan aktif</span> dan <span class='text-[#D4A017] font-bold'>${countPendingPayments} berkas invoice</span> yang memerlukan perhatian verifikasi Anda.`;
    }

    // Trigger Animasi Angka Berjalan dari 0 ke Nilai Akhir (Aturan Revisi 4)
    animateKPIIncrementalCounter("admin-kpi-active", countActiveRentals, isAutoRefresh);
    animateKPIIncrementalCounter("admin-kpi-today", 14, isAutoRefresh); 
    animateKPIIncrementalCounter("admin-kpi-pending", countPendingPayments, isAutoRefresh);
    animateKPIIncrementalCounter("admin-kpi-stock", totalUnitAvailable, isAutoRefresh);
    animateKPIIncrementalCounter("admin-kpi-out", 8, isAutoRefresh);
    animateKPIIncrementalCounter("admin-kpi-broken", 2, isAutoRefresh);
    animateKPIIncrementalCounter("admin-kpi-customers", totalCustomerRegistered, isAutoRefresh);
    animateKPIIncrementalCounter("admin-kpi-tools-count", totalRagamProduk, isAutoRefresh);
    
    // Spesial Perlakuan Format Finansial Mata Uang Rupiah Indonesia
    animateKPIIncrementalCounter("admin-kpi-rev-today", revenueToday, isAutoRefresh, true);
    animateKPIIncrementalCounter("admin-kpi-rev-month", revenueToday * 14.5, isAutoRefresh, true);

    calculateAndRenderBusinessIntelligence(history, products);
    renderInteractiveRentalCalendar(history, products);
    renderQRTrackingSummaryAndSeed();
    // Refresh Tabel Sisi Bawah
    renderAdminTableDataScope();
}

/**
 * Logika Mekanisme Animasi Incremental Counter Jalur Halus 60 FPS
 */
function animateKPIIncrementalCounter(elementId, targetValue, isAutoRefresh, isCurrency = false) {
    const el = document.getElementById(elementId);
    if (!el) return;

    if (isAutoRefresh && el.dataset.rawVal == targetValue) return;
    
    el.dataset.rawVal = targetValue;
    
    if (isAutoRefresh) {
        el.style.opacity = "0.3";
        setTimeout(() => {
            el.textContent = isCurrency ? formatIDR(targetValue) : targetValue.toLocaleString('id-ID');
            el.style.opacity = "1";
        }, 150);
        return;
    }

    let startTimestamp = null;
    const duration = 1000;

    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        const currentCount = Math.floor(progress * targetValue);
        
        el.textContent = isCurrency ? formatIDR(currentCount) : currentCount.toLocaleString('id-ID');
        
        if (progress < 1) {
            window.requestAnimationFrame(step);
        } else {
            el.textContent = isCurrency ? formatIDR(targetValue) : targetValue.toLocaleString('id-ID');
        }
    };

    window.requestAnimationFrame(step);
}

// ==========================================
// 4. CORE CONTROLLER HANDLER GLOBAL
// ==========================================
function initializeAdminBaseCommandCenter() {
    const tabs = document.querySelectorAll(".menu");
    tabs.forEach(tab => {
        tab.addEventListener("click", () => {
            const pageTitle = document.getElementById("pageTitle");
            if (pageTitle) pageTitle.innerText = tab.innerText.trim();
        });
    });
}

function registerNotificationControllerEndpoints() {
    window.handleNotificationReadClick = (id) => {
        NotificationService.markAsRead(id);
    };

    window.handleNotificationReadAllClick = () => {
        NotificationService.markAllRead();
    };
}

function renderAdminTableDataScope() {
    const history = JSON.parse(localStorage.getItem("userHistory")) || [];
    const tableWrapper = document.getElementById("smartDataGridTableWrapper");
    if (!tableWrapper) return;

    const searchQuery = document.getElementById("gridSearchInput")?.value.toLowerCase() || "";
    const filterStatus = document.getElementById("filterRentalStatus")?.value || "Semua";
    const filterCat = document.getElementById("filterCategory")?.value || "Semua";

    let filteredData = history.filter(item => {
        const matchesSearch = item.user.toLowerCase().includes(searchQuery) || 
                              item.invoice_number.toLowerCase().includes(searchQuery) ||
                              (item.items && item.items.some(i => i.name.toLowerCase().includes(searchQuery)));
        
        const matchesStatus = filterStatus === "Semua" || item.status === filterStatus;
        const matchesCategory = filterCat === "Semua" || (item.items && item.items.some(i => i.category === filterCat));

        return matchesSearch && matchesStatus && matchesCategory;
    });

    if (filteredData.length === 0) {
        tableWrapper.innerHTML = `
            <div class="text-center py-10 bg-white text-stone-400">
                <p class="text-3xl mb-1">📊</p>
                <p class="text-xs font-semibold">Belum ada data penyewaan yang cocok dengan filter.</p>
            </div>`;
        return;
    }

    const totalData = filteredData.length;
    const totalPages = Math.ceil(totalData / gridRowsPerPage);
    const offset = (gridCurrentPage - 1) * gridRowsPerPage;
    const paginatedData = filteredData.slice(offset, offset + gridRowsPerPage);

    let htmlGrid = `
        <div class="overflow-x-auto">
            <table class="w-full text-left border-collapse text-xs">
                <thead>
                    <tr class="bg-stone-50 border-b border-stone-200 text-stone-500 font-bold uppercase tracking-wider sticky top-0 z-10">
                        <th class="p-3 w-10 text-center"><input type="checkbox" id="gridSelectAll" onclick="toggleGridSelectAllRows(this)"></th>
                        <th class="p-3">Pelanggan / Invoice</th>
                        <th class="p-3">Item Perlengkapan</th>
                        <th class="p-3">Mulai - Deadline</th>
                        <th class="p-3">Denda Berjalan</th>
                        <th class="p-3">Status Log</th>
                        <th class="p-3 text-center">Aksi</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-stone-100 bg-white">`;

    paginatedData.forEach(item => {
        const today = new Date();
        const deadlineDate = new Date(item.expectedReturnDate);
        let daysLate = 0;
        let runningDenda = 0;

        if (today > deadlineDate && item.status === "Pembayaran Diterima") {
            const timeDiff = today.getTime() - deadlineDate.getTime();
            daysLate = Math.ceil(timeDiff / (1000 * 3600 * 24));
            runningDenda = daysLate * 50000;
        }

        let badgeClass = "bg-stone-100 text-stone-600 border-stone-200";
        let statusLabel = item.status;
        let priorityRowClass = "";

        if (item.status === "Pembayaran Diterima") {
            badgeClass = "bg-green-50 text-green-700 border-green-200";
            statusLabel = "Sedang Disewa";
            if (daysLate > 0) {
                badgeClass = "bg-red-50 text-red-600 border-red-200 animate-pulse";
                statusLabel = `Terlambat ${daysLate} Hari`;
                priorityRowClass = "bg-red-50/20";
            }
        } else if (item.status === "Menunggu Verifikasi") {
            badgeClass = "bg-amber-50 text-amber-600 border-amber-200";
            statusLabel = "Menunggu Verifikasi";
            priorityRowClass = "bg-amber-50/20";
        } else if (item.status === "Selesai") {
            badgeClass = "bg-blue-50 text-blue-700 border-blue-200";
            statusLabel = "Sudah Kembali";
        }

        htmlGrid += `
            <tr class="hover:bg-stone-50/80 transition-colors duration-150 ${priorityRowClass}" id="grid-row-${item.id}">
                <td class="p-3 text-center"><input type="checkbox" class="grid-row-checkbox" value="${item.id}" onclick="syncGridBulkActionToolbar()"></td>
                <td class="p-3">
                    <div class="font-bold text-stone-900">${item.user}</div>
                    <div class="text-[10px] text-stone-400 font-mono tracking-wide">${item.invoice_number}</div>
                </td>
                <td class="p-3 text-stone-600 font-medium">${item.items ? item.items.map(i => i.name).join(", ") : "Gear Alat"}</td>
                <td class="p-3 text-stone-500 font-semibold">
                    <div>${item.startDate || "Hari Ini"}</div>
                    <div class="text-[10px] ${daysLate > 0 ? 'text-red-500' : 'text-stone-400'}">Batas: ${item.expectedReturnDate}</div>
                </td>
                <td class="p-3 font-bold ${runningDenda > 0 ? 'text-red-600' : 'text-stone-700'}">${formatIDR(runningDenda)}</td>
                <td class="p-3"><span class="status-badge border ${badgeClass}">${statusLabel}</span></td>
                <td class="p-3 text-center">
                    <button onclick="alert('Membuka rincian invoice: ' + '${item.invoice_number}')" class="btn-return !py-1 !px-2.5 hover:bg-black transition text-[11px]">Detail</button>
                </td>
            </tr>`;
    });

    htmlGrid += `</tbody></table></div>`;

    const fromEntry = offset + 1;
    const toEntry = Math.min(offset + gridRowsPerPage, totalData);
    
    htmlGrid += `
        <div class="bg-stone-50 px-4 py-3 border-t border-stone-100 flex flex-col sm:flex-row justify-between items-center gap-3 text-stone-500 font-semibold text-[11px] mt-4 rounded-b-xl">
            <div>Menampilkan ${fromEntry}-${toEntry} dari ${totalData} data penyewaan</div>
            <div class="flex items-center space-x-1">
                <button onclick="changeGridPage(${gridCurrentPage - 1})" ${gridCurrentPage === 1 ? 'disabled' : ''} class="px-2.5 py-1.5 bg-white border border-stone-200 rounded-lg hover:bg-stone-100 transition disabled:opacity-40 disabled:cursor-not-allowed">Prev</button>
                <span class="px-3 py-1.5 bg-[#355E3B] text-white rounded-lg font-bold">${gridCurrentPage} / ${totalPages}</span>
                <button onclick="changeGridPage(${gridCurrentPage + 1})" ${gridCurrentPage === totalPages ? 'disabled' : ''} class="px-2.5 py-1.5 bg-white border border-stone-200 rounded-lg hover:bg-stone-100 transition disabled:opacity-40 disabled:cursor-not-allowed">Next</button>
            </div>
        </div>`;

    tableWrapper.innerHTML = htmlGrid;
}

window.changeGridPage = function(pageTarget) {
    gridCurrentPage = pageTarget;
    renderAdminTableDataScope();
};

window.toggleGridSelectAllRows = function(masterCheckbox) {
    const checkboxes = document.querySelectorAll(".grid-row-checkbox");
    checkboxes.forEach(cb => cb.checked = masterCheckbox.checked);
    window.syncGridBulkActionToolbar();
};

window.syncGridBulkActionToolbar = function() {
    const checkboxes = document.querySelectorAll(".grid-row-checkbox:checked");
    const toolbar = document.getElementById("bulkActionToolbar");
    const countBadge = document.getElementById("bulkSelectCount");

    if (toolbar) {
        if (checkboxes.length > 0) {
            if(countBadge) countBadge.textContent = checkboxes.length;
            toolbar.classList.remove("hidden");
            setTimeout(() => toolbar.classList.remove("opacity-0", "scale-95"), 10);
        } else {
            toolbar.classList.add("opacity-0", "scale-95");
            setTimeout(() => toolbar.classList.add("hidden"), 200);
        }
    }
};

// ==========================================
// SERVICE REGISTRY FOR NOTIFICATION CENTER
// ==========================================
export const NotificationService = {
    getUnread() {
        const notifications = JSON.parse(localStorage.getItem("notifications")) || [];
        return notifications.filter(n => n.is_read === 0);
    },
    getLatest() {
        const notifications = JSON.parse(localStorage.getItem("notifications")) || [];
        return notifications.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 5);
    },
    markAsRead(id) {
        let notifications = JSON.parse(localStorage.getItem("notifications")) || [];
        notifications = notifications.map(n => n.id === parseInt(id) ? { ...n, is_read: 1 } : n);
        localStorage.setItem("notifications", JSON.stringify(notifications));
        refreshNotificationDOM();
    },
    markAllRead() {
        let notifications = JSON.parse(localStorage.getItem("notifications")) || [];
        notifications = notifications.map(n => ({ ...n, is_read: 1 }));
        localStorage.setItem("notifications", JSON.stringify(notifications));
        refreshNotificationDOM();
    },
    createNotification(title, message, type, icon, color, refId = null, refType = null) {
        let notifications = JSON.parse(localStorage.getItem("notifications")) || [];
        const newNotif = {
            id: Date.now(),
            title, message, type, icon, color,
            reference_id: refId,
            reference_type: refType,
            is_read: 0,
            created_at: new Date().toISOString()
        };
        notifications.push(newNotif);
        localStorage.setItem("notifications", JSON.stringify(notifications));
        refreshNotificationDOM();
    }
};

function setupInitialMockNotificationsIfEmpty() {
    if (!localStorage.getItem("notifications")) {
        const initialNotifs = [
            { id: 1, title: "Validasi Berkas Baru", message: "Rivaldi mengunggah KTP untuk Invoice #LP-1024.", type: "user", icon: "fa-user-shield", color: "text-amber-500", is_read: 0, created_at: new Date().toISOString() }
        ];
        localStorage.setItem("notifications", JSON.stringify(initialNotifs));
    }
}

function refreshNotificationDOM() {
    const badge = document.getElementById("notificationBadge");
    const container = document.getElementById("notificationListItemsContainer");
    if (!container) return;

    const unread = NotificationService.getUnread();
    const latest = NotificationService.getLatest();

    if (badge) {
        if (unread.length > 0) {
            badge.textContent = unread.length;
            badge.classList.remove("hidden");
        } else {
            badge.classList.add("hidden");
        }
    }

    container.innerHTML = "";
    if (latest.length === 0) {
        container.innerHTML = `<div class="p-4 text-center text-stone-400 text-xs font-semibold">Tidak ada pemberitahuan baru.</div>`;
        return;
    }

    latest.forEach(n => {
        const bgReadStatus = n.is_read === 0 ? "bg-stone-50/80 font-bold" : "bg-white text-stone-500";
        container.innerHTML += `
            <div onclick="handleNotificationReadClick(${n.id})" class="p-3 flex items-start gap-2.5 cursor-pointer hover:bg-stone-100 transition ${bgReadStatus}">
                <div class="w-7 h-7 rounded-lg bg-stone-100 flex items-center justify-center ${n.color} shrink-0"><i class="fa-solid ${n.icon} text-xs"></i></div>
                <div class="text-left flex-1 min-w-0">
                    <p class="text-xs font-serif text-stone-900 leading-tight truncate">${n.title}</p>
                    <p class="text-[10px] text-stone-500 leading-normal line-clamp-2 mt-0.5">${n.message}</p>
                </div>
            </div>`;
    });
}

window.toggleNotificationDropdownMenu = function() {
    const menu = document.getElementById("notificationDropdownMenu");
    if (!menu) return;
    if (menu.classList.contains("hidden")) {
        menu.classList.remove("hidden");
        setTimeout(() => {
            menu.classList.remove("opacity-0", "scale-95");
            menu.classList.add("opacity-100", "scale-100");
        }, 10);
    } else {
        menu.classList.remove("opacity-100", "scale-100");
        menu.classList.add("opacity-0", "scale-95");
        setTimeout(() => menu.classList.add("hidden"), 300);
    }
};

// ==========================================
// 5. ENGINE INTEGRASI BUSINESS INTELLIGENCE & ANALYTICS
// ==========================================
function calculateAndRenderBusinessIntelligence(history, products) {
    const categoryPieContainer = document.getElementById("biCategoryPieContainer");
    if (categoryPieContainer) {
        const totalRevenue = history.reduce((sum, item) => sum + (item.amount || 0), 0) || 1;
        const categories = ["Tenda", "Carrier", "Gear"];
        
        categoryPieContainer.innerHTML = "";
        categories.forEach((cat, idx) => {
            const catRevenue = history.filter(item => item.items && item.items.some(i => i.category === cat || idx === 0))
                                      .reduce((sum, item) => sum + (item.amount * 0.3), 0);
            const percentage = Math.min(Math.floor((catRevenue / totalRevenue) * 100) + 15, 45);
            
            categoryPieContainer.innerHTML += `
                <div class="text-xs">
                    <div class="flex justify-between font-semibold text-stone-600 mb-1">
                        <span>${cat}</span><span>${percentage}%</span>
                    </div>
                    <div class="w-full bg-stone-100 h-2 rounded-full overflow-hidden">
                        <div class="h-full bg-green-700 transition-all duration-1000" style="width: ${percentage}%"></div>
                    </div>
                </div>`;
        });
    }

    const rorEl = document.getElementById("biMetricRor");
    const newCustEl = document.getElementById("biMetricNewCust");
    const inactiveCustEl = document.getElementById("biMetricInactiveCust");
    
    if (rorEl) rorEl.textContent = "68% Repeat Customer";
    if (newCustEl) newCustEl.textContent = "14 Member Baru";
    if (inactiveCustEl) inactiveCustEl.textContent = "3 Member";

    if (document.getElementById("biDendaMonth")) document.getElementById("biDendaMonth").textContent = formatIDR(450000);
    if (document.getElementById("biDendaUnpaid")) document.getElementById("biDendaUnpaid").textContent = formatIDR(125000);
    if (document.getElementById("biDendaCountUser")) document.getElementById("biDendaCountUser").textContent = "2 Pendaki Overdue";

    const recContainer = document.getElementById("biSmartRecommendations");
    const confidenceEl = document.getElementById("biConfidencePercent");
    
    if (recContainer) {
        const lowStockItems = products.filter(p => parseInt(p.stock) <= parseInt(p.minimum_stock || p.min_stock || 2));
        recContainer.innerHTML = "";
        
        if (lowStockItems.length > 0) {
            recContainer.innerHTML += `
                <div class="flex items-start space-x-2">
                    <span class="text-amber-400">⚠️</span>
                    <p>Stok seri <strong class="text-white">${lowStockItems[0].name}</strong> kritis. Berdasarkan moving average, estimasi habis dalam 5 days. Rekomendasi restok: +12 Unit.</p>
                </div>`;
        }
        
        recContainer.innerHTML += `
            <div class="flex items-start space-x-2">
                <span class="text-green-400">📈</span>
                <p>Tren penyewaan alat naik 18% dibanding pekan lalu. Kategori <strong class="text-white">Tenda Shelter</strong> menyumbang performa tertinggi.</p>
            </div>`;
            
        if (confidenceEl) confidenceEl.textContent = "87%";
    }

    const narrativeContainer = document.getElementById("biNarrativeContainer");
    if (narrativeContainer) {
        narrativeContainer.innerHTML = `
            <ul class="list-disc pl-4 space-y-2 text-stone-600">
                <li>Revenue bulan ini diproyeksikan menyentuh <strong class="text-stone-900">${formatIDR(42500000)}</strong> berdasarkan histori tren 30 days ke belakang.</li>
                <li>Produk <strong class="text-stone-900">Carrier 60L</strong> menjadi komoditas paling diminati dengan durasi sewa rata-rata 4.2 days.</li>
                <li>Aktivitas puncak (*Peak Season*) terdeteksi pada akhir pekan dengan rasio utilisasi logistik gudang mencapai 82%.</li>
            </ul>`;
    }

    const chartCanvas = document.getElementById("biRevenueChartCanvas");
    if (chartCanvas) {
        chartCanvas.innerHTML = "";
        const mockWeeklyData = [30, 45, 25, 60, 82, 40, 65];
        const daysLabel = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];
        
        mockWeeklyData.forEach((val, i) => {
            chartCanvas.innerHTML += `
                <div class="flex-1 flex flex-col items-center group h-full justify-end">
                    <div class="text-[9px] font-bold text-green-700 opacity-0 group-hover:opacity-100 transition-opacity mb-1">${val}%</div>
                    <div class="w-full bg-stone-100 group-hover:bg-green-100 rounded-t-md transition-all duration-500 relative" style="height: ${val}%">
                        <div class="absolute inset-0 bg-[#355E3B] rounded-t-md transform scale-y-0 origin-bottom group-hover:scale-y-100 transition-transform duration-300"></div>
                    </div>
                    <span class="text-[9px] text-stone-400 font-bold mt-2">${daysLabel[i]}</span>
                </div>`;
        });
        
        const peakBadge = document.getElementById("biPeakBadge");
        if (peakBadge) {
            peakBadge.textContent = "🔥 Peak Day (Jumat - Sabtu)";
        }
        
        const aovText = document.getElementById("biAovValueText");
        if (aovText) {
            const totalOrders = history.length || 1;
            const totalRev = history.filter(item => item.status === "Selesai" || item.status === "Pembayaran Diterima")
                                     .reduce((sum, item) => sum + (item.amount || 0), 0);
            aovText.textContent = formatIDR(totalOrders > 0 ? Math.floor(totalRev / totalOrders) : 0);
        }
    }
}

window.switchBIChartPeriod = function(period, element) {
    const buttons = document.querySelectorAll("#biPeriodTabs button");
    buttons.forEach(b => b.className = "px-3 py-1.5 rounded-lg transition");
    element.className = "px-3 py-1.5 rounded-lg active bg-[#355E3B] text-white transition";
    
    const chartCanvas = document.getElementById("biRevenueChartCanvas");
    if (chartCanvas) {
        chartCanvas.style.opacity = "0.5";
        setTimeout(() => {
            chartCanvas.style.opacity = "1";
        }, 200);
    }
};

window.executeBulkAction = function(actionType) {
    const checkedBoxes = document.querySelectorAll(".grid-row-checkbox:checked");
    const selectedIds = Array.from(checkedBoxes).map(cb => cb.value);

    if (selectedIds.length === 0) return alert("Pilih data tabel terlebih dahulu!");

    if (actionType === 'complete') {
        let history = JSON.parse(localStorage.getItem("userHistory")) || [];
        history = history.map(item => {
            if (selectedIds.includes(String(item.id))) {
                return { ...item, status: "Selesai" };
            }
            return item;
        });
        localStorage.setItem("userHistory", JSON.stringify(history));
        alert(`Sukses memproses ${selectedIds.length} data secara massal.`);
    } else if (actionType === 'print') {
        alert(`Mencetak ${selectedIds.length} berkas invoice secara massal...`);
    } else if (actionType === 'delete') {
        if (confirm(`Apakah Anda yakin ingin menghapus ${selectedIds.length} baris data dari MySQL?`)) {
            let history = JSON.parse(localStorage.getItem("userHistory")) || [];
            history = history.filter(item => !selectedIds.includes(String(item.id)));
            localStorage.setItem("userHistory", JSON.stringify(history));
        }
    }

    const masterCb = document.getElementById("gridSelectAll");
    if (masterCb) masterCb.checked = false;
    
    fetchMySQLMetricsDataAsynchronously(true);
};

window.exportGridData = function(formatType) {
    const filterStatus = document.getElementById("filterRentalStatus")?.value || "Semua";
    const filterCat = document.getElementById("filterCategory")?.value || "Semua";
    alert(`Mengekspor seluruh data logistik berstatus "${filterStatus}" dan kategori "${filterCat}" ke dalam format Berkas ${formatType.toUpperCase()}...`);
};

// ==========================================
// 8. CUSTOM INTERACTIVE RENTAL CALENDAR ENGINE
// ==========================================
function renderInteractiveRentalCalendar(history, products) {
    const calendarGrid = document.getElementById("adminCalendarGridCells");
    const monthYearTitle = document.getElementById("currentCalendarMonthYear");
    const agendaListContainer = document.getElementById("calendarTodayAgendaList");
    const calendarFilter = document.getElementById("calendarEventFilter")?.value || "Semua";

    if (!calendarGrid || !monthYearTitle) return;

    const year = calendarCurrentDate.getFullYear();
    const month = calendarCurrentDate.getMonth();

    const monthsName = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
    monthYearTitle.textContent = `${monthsName[month]} ${year}`;

    const firstDayIndex = new Date(year, month, 1).getDay();
    const totalDaysInMonth = new Date(year, month + 1, 0).getDate();
    const totalDaysInPrevMonth = new Date(year, month, 0).getDate();

    calendarGrid.innerHTML = "";

    for (let x = firstDayIndex; x > 0; x--) {
        const prevDay = totalDaysInPrevMonth - x + 1;
        calendarGrid.innerHTML += `<div class="bg-stone-50/40 text-stone-300 p-1 border border-stone-100 rounded-lg opacity-40 select-none font-semibold">${prevDay}</div>`;
    }

    const dateEventMap = {};
    history.forEach(item => {
        if (!item.expectedReturnDate) return;
        const eventDateStr = item.expectedReturnDate.split('T')[0];
        
        if (calendarFilter !== "Semua") {
            if (calendarFilter === "Disewa" && item.status !== "Pembayaran Diterima") return;
            if (calendarFilter === "Menunggu Verifikasi" && item.status !== "Menunggu Verifikasi") return;
            if (calendarFilter === "Terlambat" && item.status === "Selesai") return; 
        }

        if (!dateEventMap[eventDateStr]) dateEventMap[eventDateStr] = [];
        dateEventMap[eventDateStr].push(item);
    });

    const todayStr = new Date().toISOString().split('T')[0];

    for (let day = 1; day <= totalDaysInMonth; day++) {
        const currentLoopDateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const dayEvents = dateEventMap[currentLoopDateStr] || [];
        
        const isPeakDay = dayEvents.length >= 2;
        const dayBadgeText = isPeakDay ? `<span class="text-[8px] px-1 bg-orange-100 text-orange-600 rounded font-bold animate-pulse">🔥 Peak</span>` : "";
        const todayBorder = currentLoopDateStr === todayStr ? 'border-green-700 ring-2 ring-green-100 bg-green-50/20' : 'border-stone-100 bg-stone-50/30';

        let dotsHtml = '<div class="flex gap-0.5 mt-1 overflow-hidden">';
        dayEvents.slice(0, 3).forEach(ev => {
            let colorDot = "bg-stone-400";
            if (ev.status === "Pembayaran Diterima") colorDot = "bg-blue-600";
            else if (ev.status === "Menunggu Verifikasi") colorDot = "bg-amber-500";
            else if (ev.status === "Selesai") colorDot = "bg-green-600";
            
            dotsHtml += `<span title="${ev.user} - ${ev.invoice_number} (${ev.status})" class="w-1.5 h-1.5 rounded-full ${colorDot} block transform hover:scale-125 transition-transform"></span>`;
        });
        dotsHtml += '</div>';

        calendarGrid.innerHTML += `
            <div onclick="alert('Tanggal ${day}: Terdapat ${dayEvents.length} operasional sewa.')" class="p-1 border rounded-lg transition-all duration-200 hover:bg-white hover:border-green-700 hover:shadow-sm cursor-pointer flex flex-col justify-between ${todayBorder}">
                <div class="flex justify-between items-center font-bold text-stone-700">${day} ${dayBadgeText}</div>
                ${dotsHtml}
            </div>`;
    }

    if (!agendaListContainer) return;
    agendaListContainer.innerHTML = "";

    const activeRentals = history.filter(item => item.status === "Pembayaran Diterima");

    if (activeRentals.length === 0) {
        agendaListContainer.innerHTML = `<p class="text-stone-400 text-center py-8 font-medium italic">Tidak ada tenggat pengembalian alat hari ini.</p>`;
        return;
    }

    activeRentals.slice(0, 4).forEach(item => {
        const now = new Date();
        const deadline = new Date(item.expectedReturnDate);
        const timeDiff = deadline.getTime() - now.getTime();

        let countdownText = "Terlambat";
        let badgeColor = "bg-red-50 text-red-600 border-red-100";

        if (timeDiff > 0) {
            const diffDays = Math.floor(timeDiff / (1000 * 3600 * 24));
            const diffHours = Math.floor((timeDiff % (1000 * 3600 * 24)) / (1000 * 3600));
            
            if (diffDays > 0) countdownText = `${diffDays} Hari Lagi`;
            else countdownText = `${diffHours} Jam Lagi`;
            
            badgeColor = "bg-green-50 text-green-700 border-green-100";
        }

        agendaListContainer.innerHTML += `
            <div class="p-2 bg-stone-50 rounded-lg border border-stone-100 flex justify-between items-center transform hover:translate-x-0.5 transition-transform duration-150">
                <div class="min-w-0 flex-1 pr-2">
                    <span class="font-bold text-stone-800 truncate block">${item.user}</span>
                    <span class="text-stone-400 text-[10px] block truncate">${item.items ? item.items.map(i=>i.name).join(", ") : "Gear"}</span>
                </div>
                <span class="px-2 py-0.5 rounded border text-[9px] font-bold uppercase tracking-wider whitespace-nowrap ${badgeColor}">${countdownText}</span>
            </div>`;
    });
}

window.navigateAdminCalendar = function(direction) {
    if (direction === 0) calendarCurrentDate = new Date();
    else calendarCurrentDate.setMonth(calendarCurrentDate.getMonth() + direction);
    fetchMySQLMetricsDataAsynchronously(true);
};

function renderQRTrackingSummaryAndSeed() {
    if (!localStorage.getItem("product_units")) {
        const mockUnits = [
            { id: 101, product_id: "PROD-1", qr_code: "QR-CRR-0001", serial_number: "CRR-0001", status: "Available", condition: "Sangat Baik", notes: "Pembelian Vendor 2025" },
            { id: 102, product_id: "PROD-1", qr_code: "QR-CRR-0002", serial_number: "CRR-0002", status: "Rented", condition: "Baik", notes: "Sedang dibawa ke Gn. Gede" },
            { id: 103, product_id: "PROD-2", qr_code: "QR-TND-0001", serial_number: "TND-0001", status: "Maintenance", condition: "Dicuci", notes: "Masuk pasca sewa robek kecil" }
        ];
        const mockHistories = [
            { id: 1, unit_id: 101, activity: "Aset didaftarkan ke MySQL database.", timestamp: new Date().toISOString() },
            { id: 2, unit_id: 102, activity: "Scan Check-Out: Disewa oleh Pendaki Agus (INV-01).", timestamp: new Date().toISOString() },
            { id: 3, unit_id: 103, activity: "Scan Check-In: Unit kembali dari Budi. Kondisi kotor.", timestamp: new Date().toISOString() }
        ];
        localStorage.setItem("product_units", JSON.stringify(mockUnits));
        localStorage.setItem("unit_histories", JSON.stringify(mockHistories));
    }

    const units = JSON.parse(localStorage.getItem("product_units")) || [];
    if (document.getElementById("qr-total-asset")) document.getElementById("qr-total-asset").textContent = units.length;
    if (document.getElementById("qr-rented-asset")) document.getElementById("qr-rented-asset").textContent = units.filter(u => u.status === "Rented").length;
    if (document.getElementById("qr-maint-asset")) document.getElementById("qr-maint-asset").textContent = units.filter(u => u.status === "Maintenance").length;
    if (document.getElementById("qr-lost-asset")) document.getElementById("qr-lost-asset").textContent = units.filter(u => u.status === "Lost" || u.status === "Damaged").length;
}

window.executeAssetQRScannerSimulator = function() {
    const inputEl = document.getElementById("assetScannerSimulatorInput");
    if (!inputEl || !inputEl.value.trim()) return alert("Silakan ketik atau scan kode Serial Number unit!");

    const searchValue = inputEl.value.trim().toUpperCase();
    let units = JSON.parse(localStorage.getItem("product_units")) || [];
    let histories = JSON.parse(localStorage.getItem("unit_histories")) || [];

    const targetUnit = units.find(u => u.serial_number === searchValue || u.qr_code === "QR-" + searchValue || u.qr_code === searchValue);

    if (!targetUnit) {
        alert(`Aset dengan kode ID "${searchValue}" tidak ditemukan di database MySQL.`);
        return;
    }

    if (targetUnit.status === "Available") {
        targetUnit.status = "Rented";
        histories.push({
            id: Date.now(),
            unit_id: targetUnit.id,
            activity: "Scan Check-Out Kilat: Status beralih ke [Rented] untuk sirkulasi lapangan.",
            timestamp: new Date().toISOString()
        });
        NotificationService.createNotification("Aset Keluar Toko", `Unit ${targetUnit.serial_number} berhasil di-scan out untuk pendakian.`, "booking", "fa-qrcode", "text-blue-600");
        alert(`[SCAN CHECK-OUT SUKSES]\nUnit ${targetUnit.serial_number} berhasil divalidasi keluar gudang.`);
    } else if (targetUnit.status === "Rented") {
        targetUnit.status = "Available";
        histories.push({
            id: Date.now(),
            unit_id: targetUnit.id,
            activity: "Scan Check-In Sukses: Unit kembali ke gudang, status [Available].",
            timestamp: new Date().toISOString()
        });
        NotificationService.createNotification("Aset Kembali Baik", `Unit ${targetUnit.serial_number} telah kembali dan masuk rak penyimpanan.`, "return", "fa-circle-check", "text-emerald-600");
        alert(`[SCAN CHECK-IN SUKSES]\nUnit ${targetUnit.serial_number} kembali ke gudang dengan aman.`);
    }

    localStorage.setItem("product_units", JSON.stringify(units));
    localStorage.setItem("unit_histories", JSON.stringify(histories));
    inputEl.value = "";

    window.openAssetQRDetailModal(targetUnit.id);
    fetchMySQLMetricsDataAsynchronously(true);
};

window.openAssetQRDetailModal = function(unitId) {
    const units = JSON.parse(localStorage.getItem("product_units")) || [];
    const histories = JSON.parse(localStorage.getItem("unit_histories")) || [];
    const target = units.find(u => u.id === parseInt(unitId));

    if (!target) return;

    const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${target.qr_code}`;
    
    document.getElementById("assetModalQRImage").src = qrApiUrl;
    document.getElementById("assetModalLabelCode").textContent = target.qr_code;
    document.getElementById("assetModalProdName").textContent = target.serial_number.startsWith("CRR") ? "Carrier Eiger Backpack 60L" : "Tenda Dome Borneo 4P";
    document.getElementById("assetModalSerial").textContent = `Serial: ${target.serial_number}`;
    document.getElementById("assetModalCondition").textContent = `Kondisi: ${target.condition}`;

    const badge = document.getElementById("assetModalStatusBadge");
    badge.className = "status-badge border ";
    if (target.status === "Available") badge.className += "bg-green-50 text-green-700 border-green-200";
    else if (target.status === "Rented") badge.className += "bg-blue-50 text-blue-700 border-blue-200";
    else if (target.status === "Maintenance") badge.className += "bg-amber-50 text-amber-600 border-amber-200";
    badge.textContent = target.status;

    const logContainer = document.getElementById("assetModalTimelineLog");
    logContainer.innerHTML = "";
    const currentUnitLogs = histories.filter(h => h.unit_id === target.id).sort((a,b) => b.id - a.id);

    currentUnitLogs.forEach(log => {
        const timeFormatted = new Date(log.timestamp).toLocaleDateString('id-ID', {day:'numeric', month:'short'});
        logContainer.innerHTML += `
            <div class="mb-2 relative">
                <span class="absolute -left-[17px] top-1 w-2 h-2 rounded-full bg-stone-400 border border-white"></span>
                <div class="text-stone-400 text-[9px] font-bold">${timeFormatted}</div>
                <p class="text-stone-700 leading-tight">${log.activity}</p>
            </div>`;
    });

    const btnMaint = document.getElementById("btnActionToggleMaintenance");
    if (target.status === "Maintenance") {
        btnMaint.textContent = "Selesaikan Maintenance";
        btnMaint.className = "bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded-lg transition flex-1 text-center";
        btnMaint.onclick = () => window.toggleUnitMaintenanceState(target.id, "Available");
    } else {
        btnMaint.textContent = "Masuk Maintenance";
        btnMaint.className = "bg-stone-900 hover:bg-black text-white font-bold px-4 py-2 rounded-lg transition flex-1 text-center";
        btnMaint.onclick = () => window.toggleUnitMaintenanceState(target.id, "Maintenance");
    }

    const modal = document.getElementById("assetDetailQRModal");
    modal.classList.remove("pointer-events-none", "opacity-0");
    modal.querySelector(".transform").classList.remove("scale-95");
    modal.querySelector(".transform").classList.add("scale-100");
};

window.closeAssetQRDetailModal = function() {
    const modal = document.getElementById("assetDetailQRModal");
    if (!modal) return;
    modal.classList.add("pointer-events-none", "opacity-0");
    modal.querySelector(".transform").classList.remove("scale-100");
    modal.querySelector(".transform").classList.add("scale-95");
};

window.toggleUnitMaintenanceState = function(unitId, targetStatus) {
    let units = JSON.parse(localStorage.getItem("product_units")) || [];
    let histories = JSON.parse(localStorage.getItem("unit_histories")) || [];
    const target = units.find(u => u.id === unitId);

    if (target) {
        target.status = targetStatus;
        target.condition = targetStatus === "Maintenance" ? "Proses Cuci / Repair" : "Sangat Baik";
        
        histories.push({
            id: Date.now(),
            unit_id: target.id,
            activity: targetStatus === "Maintenance" ? "Unit ditarik dari rak untuk proses pencucian/repair." : "Proses perbaikan selesai. Unit masuk rak penyimpanan.",
            timestamp: new Date().toISOString()
        });

        localStorage.setItem("product_units", JSON.stringify(units));
        localStorage.setItem("unit_histories", JSON.stringify(histories));
        
        NotificationService.createNotification(
            targetStatus === "Maintenance" ? "Unit Masuk Maintenance" : "Maintenance Selesai",
            `Aset fisik ${target.serial_number} diperbarui ke status [${targetStatus}].`,
            "maintenance", "fa-screwdriver-wrench", targetStatus === "Maintenance" ? "text-amber-500" : "text-emerald-600"
        );
        
        window.closeAssetQRDetailModal();
        fetchMySQLMetricsDataAsynchronously(true);
    }
};

window.triggerBulkQRGeneration = function() {
    let units = JSON.parse(localStorage.getItem("product_units")) || [];
    let histories = JSON.parse(localStorage.getItem("unit_histories")) || [];
    const startIndex = units.length + 1;

    for (let i = 0; i < 10; i++) {
        const nextId = startIndex + i;
        const serialStr = `CRR-${String(nextId).padStart(4, '0')}`;
        const newUnit = {
            id: Date.now() + i,
            product_id: "PROD-1",
            qr_code: `QR-${serialStr}`,
            serial_number: serialStr,
            status: "Available",
            condition: "Sangat Baik",
            notes: "Bulk Generated System Automata"
        };
        units.push(newUnit);
        histories.push({
            id: Date.now() + i + 100,
            unit_id: newUnit.id,
            activity: "Aset dibuat massal via Command Bulk QR Generator.",
            timestamp: new Date().toISOString()
        });
    }

    localStorage.setItem("product_units", JSON.stringify(units));
    localStorage.setItem("unit_histories", JSON.stringify(histories));
    
    alert("Sukses mengeksekusi BULK ACTION: 10 Seri unit fisik & stiker QR Code berhasil di-generate ke database.");
    fetchMySQLMetricsDataAsynchronously(true);
};

// ==========================================
// RISK & VERIFICATION CENTER SCRIPT ENGINE LOGIC - (SINKRON MYSQL & DOM)
// ==========================================
let adminVerificationKpiRefreshIntervalId = null;
let riskSearchDebounceTimerId = null;
let currentRiskViewerActiveIndex = 0;
let currentRiskViewerImagesArray = [];
let currentRiskViewerCanvasZoomScale = 1;
let currentRiskViewerCanvasRotationDegree = 0;
let cachedRiskViewerActiveDocumentBackup = null;

function animateRiskKpiCounter(elementId, targetValue) {
    const el = document.getElementById(elementId);
    if (!el) return;
    
    let startValue = 0;
    const duration = 450; 
    const startTime = performance.now();
    
    function updateFrame(currentTime) {
        const elapsedTime = currentTime - startTime;
        if (elapsedTime >= duration) {
            el.textContent = targetValue.toLocaleString('id-ID');
            return;
        }
        const progress = elapsedTime / duration;
        const currentCount = Math.floor(startValue + progress * (targetValue - startValue));
        el.textContent = currentCount.toLocaleString('id-ID');
        requestAnimationFrame(updateFrame);
    }
    requestAnimationFrame(updateFrame);
}

window.fetchLiveMysqlRiskVerificationKpiMetrics = function() {
    try {
        let pendingCount = 1;
        let approvedCount = 12;
        let rejectedCount = 2;
        let todayUpload = 4;
        let manualReview = 1;

        animateRiskKpiCounter("kpi-risk-pending", pendingCount);
        animateRiskKpiCounter("kpi-risk-approved", approvedCount);
        animateRiskKpiCounter("kpi-risk-rejected", rejectedCount);
        animateRiskKpiCounter("kpi-risk-today", todayUpload);
        animateRiskKpiCounter("kpi-risk-manual", manualReview);
    } catch (error) {
        console.error("Gagal menarik data asinkron agregasi KPI Risk Center:", error);
    }
};

window.triggerRiskSearchWithDebounce = function() {
    const stateText = document.getElementById("riskSearchStateText");
    if (stateText) {
        stateText.textContent = "Sedang mengetik...";
        stateText.parentElement.className = "bg-amber-50 border border-amber-200 text-amber-700 rounded-xl p-2.5 flex items-center justify-center gap-2 select-none shadow-sm animate-pulse";
    }
    clearTimeout(riskSearchDebounceTimerId);
    riskSearchDebounceTimerId = setTimeout(() => {
        window.executeLiveRiskSearchFilter();
    }, 300);
};

window.executeLiveRiskSearchFilter = function() {
    const searchInput = document.getElementById("riskSmartSearchInput");
    const statusSelect = document.getElementById("riskFilterStatusSelect");
    const timeSelect = document.getElementById("riskFilterTimeSelect");
    const stateText = document.getElementById("riskSearchStateText");
    const cardContainer = document.getElementById("riskVerificationCentralCardContainer");

    if (!cardContainer) return;

    const query = searchInput ? searchInput.value.toLowerCase().trim() : "";
    const filterStatus = statusSelect ? statusSelect.value : "Semua";
    const filterTime = timeSelect ? timeSelect.value : "Semua";

    cardContainer.innerHTML = "";
    if (stateText) {
        stateText.textContent = "Loading MySQL...";
        stateText.parentElement.className = "bg-stone-800 border border-stone-700 text-stone-400 rounded-xl p-2.5 flex items-center justify-center gap-2 select-none shadow-inner animate-pulse";
    }

    for (let i = 1; i <= 3; i++) {
        cardContainer.innerHTML += `
            <div class="bg-white rounded-2xl border border-stone-200/40 p-4 shadow-sm flex flex-col justify-between overflow-hidden text-xs font-semibold select-none">
                <div class="flex items-center justify-between gap-3 pb-3 border-b border-stone-100">
                    <div class="flex items-center gap-3 w-full">
                        <div class="w-10 h-10 rounded-xl animate-shimmer shrink-0"></div>
                        <div class="space-y-2 flex-1">
                            <div class="h-3.5 bg-stone-200 rounded animate-shimmer w-3/4"></div>
                            <div class="h-2.5 bg-stone-100 rounded animate-shimmer w-1/2"></div>
                        </div>
                    </div>
                    <div class="w-16 h-5 bg-stone-100 rounded-md animate-shimmer shrink-0"></div>
                </div>
                <div class="py-3 space-y-3 flex-1">
                    <div class="grid grid-cols-2 gap-2">
                        <div class="space-y-1">
                            <div class="h-2 bg-stone-100 rounded animate-shimmer w-1/3"></div>
                            <div class="h-3 bg-stone-200 rounded animate-shimmer w-5/6"></div>
                        </div>
                        <div class="space-y-1 flex flex-col items-end">
                            <div class="h-2 bg-stone-100 rounded animate-shimmer w-1/3"></div>
                            <div class="h-3 bg-stone-200 rounded animate-shimmer w-2/3"></div>
                        </div>
                    </div>
                    <div class="space-y-1.5 pt-1">
                        <div class="h-2.5 bg-stone-100 rounded animate-shimmer w-1/4"></div>
                        <div class="w-full h-1.5 bg-stone-100 rounded-full animate-shimmer"></div>
                    </div>
                </div>
                <div class="pt-3 border-t border-stone-100 w-full">
                    <div class="w-full h-9 bg-stone-100 rounded-xl animate-shimmer"></div>
                </div>
            </div>`;
    }

    setTimeout(() => {
        const mockVerificationDb = [
            { id: 1, user_id: 2, name: "Rivaldi Petualang", email: "rivaldi@gmail.com", phone: "087711223344", nik: "3216012408980002", invoice: "LP-INV-001", status: "pending", date: "14 Juni 2026 - 08:30 WIB", passed_checks: 3, label_tgl: "Hari Ini" },
            { id: 2, user_id: 3, name: "Agus Solo Climber", email: "agus@gmail.com", phone: "081299887766", nik: "3216012408980003", invoice: "LP-INV-002", status: "approved", date: "14 Juni 2026 - 09:00 WIB", passed_checks: 6, label_tgl: "Hari Ini" },
            { id: 3, user_id: 4, name: "Budi Backpacker", email: "budi@gmail.com", phone: "085611223344", nik: "3216012408980004", invoice: "LP-INV-003", status: "rejected", date: "13 Juni 2026 - 14:00 WIB", passed_checks: 1, label_tgl: "Minggu Ini" }
        ];

        const filteredResults = mockVerificationDb.filter(v => {
            const matchTeks = query === "" ||
                              v.name.toLowerCase().includes(query) ||
                              v.email.toLowerCase().includes(query) ||
                              v.nik.includes(query) ||
                              v.invoice.toLowerCase().includes(query);

            const matchStatus = filterStatus === "Semua" || v.status.toLowerCase() === filterStatus.toLowerCase();
            let matchWaktu = true;
            if (filterTime === "Hari Ini") matchWaktu = (v.label_tgl === "Hari Ini");

            return matchTeks && matchStatus && matchWaktu;
        });

        if (stateText) {
            stateText.textContent = `${filteredResults.length} Berkas Cocok`;
            stateText.parentElement.className = "bg-green-50 border border-green-200 text-green-700 rounded-xl p-2.5 flex items-center justify-center gap-2 select-none shadow-sm";
        }

        cardContainer.innerHTML = "";
        
        if (filteredResults.length === 0) {
            cardContainer.innerHTML = `
                <div class="col-span-full p-8 text-center text-stone-400 font-medium font-serif bg-white rounded-xl border border-stone-200/60 shadow-sm">
                    🔍 Tidak ada kartu dokumen verifikasi risiko yang lolos penyaringan.
                </div>`;
            return;
        }

        filteredResults.forEach(res => {
            let badgeClass = "bg-amber-50 text-amber-700 border-amber-200";
            if (res.status === "approved") badgeClass = "bg-green-50 text-green-700 border-green-200";
            if (res.status === "rejected") badgeClass = "bg-rose-50 text-rose-700 border-rose-200";

            const persentaseKelayakan = Math.round((res.passed_checks / 6) * 100);
            let progressColor = "bg-amber-500";
            if (persentaseKelayakan === 100) progressColor = "bg-green-600";
            if (persentaseKelayakan <= 30) progressColor = "bg-rose-500";

            cardContainer.innerHTML += `
                <div class="bg-white rounded-2xl border border-stone-200/60 p-4 shadow-sm hover:shadow-xl hover:border-stone-300 transition-all duration-300 flex flex-col justify-between overflow-hidden text-xs font-semibold group relative text-left fade-in-smooth" id="risk-card-item-${res.id}">
                    <div class="absolute top-2.5 right-2.5 z-30">
                        <input type="checkbox" name="riskSelectedBulkRow" value="${res.id}" onchange="evaluateRiskBulkToolbarState()" class="rounded border-stone-300 bg-white/90 text-[#355E3B] focus:ring-0 w-4 h-4 shadow-md cursor-pointer transition-transform duration-200 active:scale-90">
                    </div>
                    
                    <div class="flex items-start justify-between gap-3 pb-3 border-b border-stone-100">
                        <div class="flex items-center gap-3 pr-4">
                            <div class="w-10 h-10 rounded-xl bg-gradient-to-tr from-stone-800 to-stone-700 text-white flex items-center justify-center text-xs font-black shadow-inner tracking-wider select-none shrink-0 uppercase">
                                ${res.name.substring(0, 2)}
                            </div>
                            <div class="min-w-0">
                                <h4 class="text-stone-900 font-serif text-sm font-bold truncate leading-tight group-hover:text-[#355E3B] transition" title="${res.name}">${res.name}</h4>
                                <span class="text-[10px] text-stone-400 font-sans font-medium tracking-wide block truncate mt-0.5">${res.email}</span>
                            </div>
                        </div>
                        <span class="status-badge border uppercase tracking-wider text-[9px] px-2 py-0.5 rounded-md shrink-0 font-extrabold ${badgeClass}">${res.status}</span>
                    </div>

                    <div class="py-3 space-y-2 flex-1">
                        <div class="grid grid-cols-2 gap-2 text-[11px]">
                            <div>
                                <span class="text-stone-400 font-medium block">Nomor NIK KTP</span>
                                <span class="font-mono font-bold text-stone-800 tracking-wide">${res.nik}</span>
                            </div>
                            <div class="text-right">
                                <span class="text-stone-400 font-medium block">Nomor Invoice</span>
                                <span class="font-mono font-bold text-[#355E3B] uppercase">${res.invoice}</span>
                            </div>
                        </div>

                        <div class="space-y-1 pt-1">
                            <div class="flex justify-between items-center text-[10px] uppercase font-bold text-stone-400 tracking-wide">
                                <span>Rasio Akurasi Data</span>
                                <span class="text-stone-700 font-mono font-black">${persentaseKelayakan}%</span>
                            </div>
                            <div class="w-full h-1.5 bg-stone-100 rounded-full overflow-hidden border border-stone-200/30 relative">
                                <div class="h-full ${progressColor} transition-all duration-500 ease-out" style="width: ${persentaseKelayakan}%"></div>
                            </div>
                            <span class="text-[9px] text-stone-400 font-medium block mt-0.5">Diupload pada: <strong class="text-stone-500">${res.date}</strong></span>
                        </div>
                    </div>

                    <div class="pt-3 border-t border-stone-100 w-full">
                        <button onclick="openRiskReviewWorkflowWindow(${res.id})" class="w-full bg-stone-900 hover:bg-black text-white font-bold py-2.5 rounded-xl text-center text-[11px] transition active:scale-98 tracking-wide flex items-center justify-center gap-1.5 shadow-sm">
                            <i class="fa-solid fa-user-check text-[10px]"></i> Tinjau & Review Dokumen
                        </button>
                    </div>
                </div>`;
        });
    }, 600);
};

window.openRiskReviewWorkflowWindow = function(verificationId) {
    const modal = document.getElementById("riskDocumentFullscreenViewerModal");
    const title = document.getElementById("riskViewerModalTitleName");
    
    if (!modal) return;

    const mockVerificationDb = [
        { id: 1, user_id: 2, name: "Rivaldi Petualang", nik: "3216012408980002", ktp: "https://images.unsplash.com/photo-1554774853-aae0a22c8aa4?w=800", selfie: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800", support: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=800" },
        { id: 2, user_id: 3, name: "Agus Solo Climber", nik: "3216012408980003", ktp: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=800", selfie: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800", support: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800" },
        { id: 3, user_id: 4, name: "Budi Backpacker", nik: "3216012408980004", ktp: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=800", selfie: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=800", support: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800" }
    ];

    const targetRecord = mockVerificationDb.find(v => v.id === parseInt(verificationId));
    if (!targetRecord) return alert("Gagal mengurai lampiran dokumen dari server.");

    if (title) title.textContent = `Pusat Review Berkas: ${targetRecord.name}`;

    currentRiskViewerImagesArray = [
        { label: "FOTO KTP UTAMA", url: targetRecord.ktp },
        { label: "SELFIE + KTP PENYEWA", url: targetRecord.selfie },
        { label: "DOKUMEN PENDUKUNG (KK/STNK)", url: targetRecord.support }
    ];

    currentRiskViewerActiveIndex = 0;
    currentRiskViewerCanvasZoomScale = 1;
    currentRiskViewerCanvasRotationDegree = 0;

    const hiddenVerifIdInput = document.getElementById("riskViewerCurrentActiveVerifId");
    if (hiddenVerifIdInput) hiddenVerifIdInput.value = verificationId;

    const inputsChecklist = document.querySelectorAll("#riskVerificationChecklistDOMWrapper input[type='checkbox']");
    inputsChecklist.forEach(chk => chk.checked = false);

    const noteField = document.getElementById("riskViewerAdminNoteInput");
    if (noteField) noteField.value = "";

    modal.classList.remove("opacity-0", "pointer-events-none");
    window.renderRiskViewerTargetImageSourceFrame();
    window.fetchRiskDocumentVersionHistoryList(verificationId);
    window.fetchLiveGudangVerificationTimelineLogs(verificationId);
    window.populateLiveRiskOcrEngineComparativeFields(verificationId);
    window.executeLiveRiskNikDuplicationScanner(verificationId, targetRecord.nik, targetRecord.user_id);
};

window.renderRiskViewerTargetImageSourceFrame = function() {
    const targetSource = document.getElementById("riskViewerCanvasSourceTarget");
    const labelType = document.getElementById("riskViewerModalDocTypeLabel");
    const labelIndex = document.getElementById("riskViewerModalIndexLabel");
    const wrapper = document.getElementById("riskViewerCanvasImageWrapper");

    if (!targetSource || currentRiskViewerImagesArray.length === 0) return;

    currentRiskViewerCanvasZoomScale = 1;
    currentRiskViewerCanvasRotationDegree = 0;
    if (wrapper) {
        wrapper.style.transform = `scale(${currentRiskViewerCanvasZoomScale}) rotate(${currentRiskViewerCanvasRotationDegree}deg)`;
    }

    const currentDoc = currentRiskViewerImagesArray[currentRiskViewerActiveIndex];
    targetSource.src = currentDoc.url;
    if (labelType) labelType.textContent = currentDoc.label;
    if (labelIndex) labelIndex.textContent = `${currentRiskViewerActiveIndex + 1}/${currentRiskViewerImagesArray.length}`;
};

window.navigateRiskViewerCarouselGroup = function(direction) {
    currentRiskViewerActiveIndex += direction;
    if (currentRiskViewerActiveIndex >= currentRiskViewerImagesArray.length) currentRiskViewerActiveIndex = 0;
    if (currentRiskViewerActiveIndex < 0) currentRiskViewerActiveIndex = currentRiskViewerImagesArray.length - 1;
    window.renderRiskViewerTargetImageSourceFrame();
};

window.manipulateRiskViewerCanvasImage = function(actionType) {
    const wrapper = document.getElementById("riskViewerCanvasImageWrapper");
    if (!wrapper) return;

    if (actionType === 'zoomIn') {
        currentRiskViewerCanvasZoomScale = Math.min(currentRiskViewerCanvasZoomScale + 0.25, 3);
    } else if (actionType === 'zoomOut') {
        currentRiskViewerCanvasZoomScale = Math.max(currentRiskViewerCanvasZoomScale - 0.25, 0.5);
    } else if (actionType === 'rotateRight') {
        currentRiskViewerCanvasRotationDegree = (currentRiskViewerCanvasRotationDegree + 90) % 360;
    } else if (actionType === 'download') {
        const activeUrl = currentRiskViewerImagesArray[currentRiskViewerActiveIndex].url;
        window.open(activeUrl, '_blank');
        return;
    }
    wrapper.style.transform = `scale(${currentRiskViewerCanvasZoomScale}) rotate(${currentRiskViewerCanvasRotationDegree}deg)`;
};

window.closeRiskDocumentFullscreenViewerWindow = function() {
    const modal = document.getElementById("riskDocumentFullscreenViewerModal");
    if (!modal) return;
    modal.classList.add("opacity-0", "pointer-events-none");
};

window.injectQuickRejectionNoteTemplate = function(templateString) {
    const noteInput = document.getElementById("riskViewerAdminNoteInput");
    if (!noteInput) return;
    noteInput.value = templateString;
    window.evaluateRiskChecklistPassedLockState();
};

window.fetchRiskDocumentVersionHistoryList = function(verificationId) {
    const selector = document.getElementById("riskViewerVersionSelector");
    if (!selector) return;

    selector.innerHTML = `<option value="active">v_Active (Terbaru)</option>`;
    cachedRiskViewerActiveDocumentBackup = null;

    if (parseInt(verificationId) === 3) {
        const mockVersionHistory = [
            { version_number: 1, uploaded_at: "13 Jun 2026", ktp_path: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=800" }
        ];
        mockVersionHistory.forEach(v => {
            selector.innerHTML += `<option value="${v.version_number}">v_${v.version_number} (Arsip - ${v.uploaded_at})</option>`;
        });
        cachedRiskViewerActiveDocumentBackup = {
            ktp: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=800"
        };
    }
};

window.switchLiveActivePreviewVersionDataScope = function(selectedVersionValue) {
    const targetSource = document.getElementById("riskViewerCanvasSourceTarget");
    if (!targetSource || currentRiskViewerImagesArray.length === 0) return;

    if (selectedVersionValue === "active") {
        if (cachedRiskViewerActiveDocumentBackup) {
            currentRiskViewerImagesArray[0].url = cachedRiskViewerActiveDocumentBackup.ktp;
        }
    } else if (selectedVersionValue === "1") {
        currentRiskViewerImagesArray[0].url = "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=800";
        alert("📂 Membuka Arsip Dokumen v_1\nPerhatikan catatan kesalahan lama untuk membandingkan dengan dokumen perbaikan terbaru.");
    }
    currentRiskViewerActiveIndex = 0;
    window.renderRiskViewerTargetImageSourceFrame();
};

window.fetchLiveGudangVerificationTimelineLogs = function(verificationId) {
    const timelineWrapper = document.getElementById("riskViewerTimelineLogsWrapper");
    if (!timelineWrapper) return;

    timelineWrapper.innerHTML = `<div class="text-stone-500 animate-pulse py-1 text-[11px]">Memuat rantai log MySQL...</div>`;

    setTimeout(() => {
        const mockTimelineDatabase = {
            1: [
                { jam: "09:00 WIB", aksi: "UPLOAD", text: "Pendaki Rivaldi mengunggah berkas identitas KTP & Selfie baru.", aktor: "System" },
                { jam: "09:15 WIB", aksi: "REVIEW", text: "Ranger Commander Zteic membuka berkas untuk proses inspeksi visual.", aktor: "Zteic Ranger" }
            ],
            2: [
                { jam: "14 Jun 2026 - 08:00 WIB", aksi: "UPLOAD", text: "Pendaki Agus mengunggah berkas.", aktor: "System" },
                { jam: "14 Jun 2026 - 09:00 WIB", aksi: "APPROVED", text: "Berkas dinyatakan valid. Status pesanan beralih ke [Siap Diambil].", aktor: "Zteic Ranger" }
            ],
            3: [
                { jam: "13 Jun 2026 - 11:00 WIB", aksi: "UPLOAD", text: "Pendaki Budi melampirkan foto pengenal KTP.", aktor: "System" },
                { jam: "13 Jun 2026 - 14:00 WIB", aksi: "REJECTED", text: "Berkas ditolak otomatis oleh admin. Alasan data buram.", aktor: "Zteic Ranger" }
            ]
        };

        const logs = mockTimelineDatabase[parseInt(verificationId)] || [
            { jam: "Hari Ini", aksi: "INITIAL", text: "Berkas masuk dalam antrean sinkronisasi.", aktor: "System" }
        ];

        timelineWrapper.innerHTML = "";

        logs.forEach(log => {
            let markerCircleColor = "bg-stone-500";
            let actionTextColor = "text-stone-300";

            if (log.aksi === "APPROVED") {
                markerCircleColor = "bg-emerald-500 shadow-xs shadow-emerald-500/50";
                actionTextColor = "text-emerald-400 font-black";
            } else if (log.aksi === "REJECTED") {
                markerCircleColor = "bg-rose-500 shadow-xs shadow-rose-500/50";
                actionTextColor = "text-rose-400 font-black";
            } else if (log.aksi === "REVIEW") {
                markerCircleColor = "bg-amber-500";
                actionTextColor = "text-amber-400";
            } else if (log.aksi === "UPLOAD") {
                markerCircleColor = "bg-blue-500";
                actionTextColor = "text-blue-400";
            }

            timelineWrapper.innerHTML += `
                <div class="relative pl-3 pb-1 border-l border-stone-800 last:border-0 last:pb-0 fade-in-smooth">
                    <div class="absolute -left-[4.5px] top-1 w-2 h-2 rounded-full ${markerCircleColor} border border-stone-900 z-10"></div>
                    <div class="flex items-center gap-2 text-[9px] font-mono font-bold text-stone-500 leading-none">
                        <span>${log.jam}</span>
                        <span class="px-1 rounded bg-stone-950 border border-stone-800 uppercase text-[8px] ${actionTextColor}">${log.aksi}</span>
                        <span class="text-stone-600 font-sans">&bull; oleh [${log.aktor}]</span>
                    </div>
                    <p class="text-[11px] text-stone-400 mt-0.5 leading-tight font-sans">${log.text}</p>
                </div>`;
        });
    }, 200);
};

window.populateLiveRiskOcrEngineComparativeFields = function(verificationId) {
    const lblProfileName = document.getElementById("riskOcrProfileNameLabel");
    const lblProfileNik = document.getElementById("riskOcrProfileNikLabel");
    const inputOcrName = document.getElementById("riskOcrInputName");
    const inputOcrNik = document.getElementById("riskOcrInputNik");

    if (!lblProfileName || !inputOcrName) return;

    lblProfileName.textContent = "Loading...";
    lblProfileNik.textContent = "Loading...";
    inputOcrName.value = "";
    inputOcrNik.value = "";

    setTimeout(() => {
        const mockVerificationDb = [
            { id: 1, name: "Rivaldi Petualang", nik: "3216012408980002", ocr_name: "RIVALDI PETUALANG", ocr_nik: "3216012408980002" },
            { id: 2, name: "Agus Solo Climber", nik: "3216012408980003", ocr_name: "AGUS SOLO CLIMBER", ocr_nik: "3216012408980003" },
            { id: 3, name: "Budi Backpacker", nik: "3216012408980004", ocr_name: "BUDI BACKPACER", ocr_nik: "321601240898O0O4" }
        ];

        const target = mockVerificationDb.find(v => v.id === parseInt(verificationId));
        if (!target) return;

        lblProfileName.textContent = target.name;
        lblProfileNik.textContent = target.nik;
        inputOcrName.value = target.ocr_name;
        inputOcrNik.value = target.ocr_nik;

        if (target.nik !== target.ocr_nik || target.name.toUpperCase() !== target.ocr_name.toUpperCase()) {
            inputOcrNik.className = "w-full bg-rose-950 border border-rose-800 text-rose-300 font-mono rounded px-1.5 py-0.5 font-bold animate-pulse text-[10px]";
            console.warn(`⚠️ ALERT COMPARING DATA FLAGGED: Terdeteksi ketidakcocokan karakter teks asli pada ID #${verificationId}`);
        } else {
            inputOcrNik.className = "w-full bg-stone-900 border border-stone-800 rounded px-1.5 py-0.5 text-stone-200 outline-none font-mono font-bold text-[10px]";
        }
    }, 350);
};

window.executeLiveRiskNikDuplicationScanner = function(verifId, nikValue, userIdValue) {
    const alertBox = document.getElementById("riskViewerFraudDuplicateNikAlertBox");
    const bypassCheckbox = document.getElementById("riskFraudBypassOverrideCheckbox");

    if (!alertBox) return;

    alertBox.classList.add("hidden");
    if (bypassCheckbox) bypassCheckbox.checked = false;

    setTimeout(() => {
        const isFraudMatchDetected = (parseInt(verifId) === 1);
        if (isFraudMatchDetected) {
            alertBox.classList.remove("hidden");
            alertBox.classList.add("flex");
            console.warn(`🚨 FRAUD BARRIER DETECTED: Nomor NIK KTP [${nikValue}] terindikasi kloning akun multi-user!`);
        }
        window.evaluateRiskChecklistPassedLockState();
    }, 400);
};

window.evaluateRiskChecklistPassedLockState = function() {
    const chkPhoto = document.getElementById("chk-photo-clear");
    const chkName = document.getElementById("chk-name-match");
    const chkNik = document.getElementById("chk-nik-readable");
    const chkBlur = document.getElementById("chk-not-blur");
    const chkCut = document.getElementById("chk-not-cut");
    const chkExpired = document.getElementById("chk-not-expired");
    const noteInput = document.getElementById("riskViewerAdminNoteInput");
    const alertBox = document.getElementById("riskViewerFraudDuplicateNikAlertBox");
    const bypassCheckbox = document.getElementById("riskFraudBypassOverrideCheckbox");
    
    const bottomContainer = document.querySelector("#riskDocumentFullscreenViewerModal .pt-4.border-t.border-stone-800");
    if (!bottomContainer) return;

    const isAllChecked = chkPhoto?.checked && chkName?.checked && chkNik?.checked && 
                         chkBlur?.checked && chkCut?.checked && chkExpired?.checked;
                         
    const noteTextLength = noteInput ? noteInput.value.trim().length : 0;
    const isFraudAlertActive = alertBox && !alertBox.classList.contains("hidden");
    const isFraudBypassChecked = bypassCheckbox ? bypassCheckbox.checked : false;
    
    let isApproveAllowed = isAllChecked;
    if (isFraudAlertActive && !isFraudBypassChecked) {
        isApproveAllowed = false;
    }

    if (isApproveAllowed) {
        let buttonLabelText = `<i class="fa-solid fa-unlock-keyhole text-[10px]"></i> Konfirmasi & Approve Berkas`;
        if (isFraudAlertActive && isFraudBypassChecked) {
            buttonLabelText = `<i class="fa-solid fa-user-shield text-[10px]"></i> Force Approve (Bypass Fraud Check)`;
        }

        bottomContainer.innerHTML = `
            <input type="hidden" id="riskViewerCurrentActiveVerifId" value="${document.getElementById("riskViewerCurrentActiveVerifId")?.value}">
            <button id="btnRiskActionApproveRelease" onclick="window.commitRiskChecklistMutationToMysql()" class="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-xl text-center transition tracking-wide text-[11px] active:scale-98 shadow-md flex items-center justify-center gap-1.5 cursor-pointer fade-in-smooth">
                ${buttonLabelText}
            </button>
            <p class="text-[9px] text-stone-500 text-center leading-normal">Seluruh parameter terpenuhi, berkas dinyatakan lolos verifikasi keamanan.</p>`;
    } else {
        const isRejectButtonActive = noteTextLength > 0;
        const rejectDisabledAttr = isRejectButtonActive ? "" : "disabled";
        const rejectBtnClass = isRejectButtonActive ? "bg-rose-600 hover:bg-rose-700 text-white cursor-pointer active:scale-98 shadow-md" : "bg-stone-800 text-stone-600 cursor-not-allowed";

        let bottomWarningHint = "Penuhi semua checklist untuk APPROVE, atau tulis alasan catatan di atas jika ingin REJECT.";
        if (isFraudAlertActive && isAllChecked && !isFraudBypassChecked) {
            bottomWarningHint = "⚠️ Otorisasi Ditahan: Dokumen terindikasi fraud. Berikan tanda centang pada opsi [Bypass Approve] di panel atas jika data fisik dinyatakan legal oleh admin.";
        }

        bottomContainer.innerHTML = `
            <input type="hidden" id="riskViewerCurrentActiveVerifId" value="${document.getElementById("riskViewerCurrentActiveVerifId")?.value}">
            <div class="grid grid-cols-1 gap-2 w-full">
                <button disabled class="w-full bg-stone-800 text-stone-500 font-bold py-2.5 rounded-xl text-center tracking-wide text-[11px] cursor-not-allowed flex items-center justify-center gap-1.5">
                    <i class="fa-solid fa-lock text-[10px]"></i> Konfirmasi & Approve Berkas
                </button>
                <button id="btnRiskActionRejectExecution" ${rejectDisabledAttr} onclick="window.executeRiskVerificationRejectCommand()" class="w-full font-bold py-2.5 rounded-xl text-center transition tracking-wide text-[11px] flex items-center justify-center gap-1.5 ${rejectBtnClass}">
                    <i class="fa-regular fa-circle-xmark text-[10px]"></i> Tolak & Reject Berkas (Wajib Isi Catatan)
                </button>
            </div>
            <p class="text-[9px] text-rose-500 text-center leading-normal font-medium mt-1">${bottomWarningHint}</p>`;
    }
};

window.commitRiskChecklistMutationToMysql = function() {
    const verifId = document.getElementById("riskViewerCurrentActiveVerifId")?.value;
    alert(`✅ SUKSES APPROVE!\nBerkas ID #${verifId} dinyatakan VALID. Status pesanan otomatis beralih menjadi [Siap Diambil] di MySQL.`);
    window.closeRiskDocumentFullscreenViewerWindow();
    window.fetchLiveMysqlRiskVerificationKpiMetrics();
    window.executeLiveRiskSearchFilter();
    window.fetchLiveMysqlRiskAuditLogsStream();
};

window.executeRiskVerificationRejectCommand = function() {
    const verifId = document.getElementById("riskViewerCurrentActiveVerifId")?.value;
    const adminNoteText = document.getElementById("riskViewerAdminNoteInput")?.value.trim();

    if (!adminNoteText) {
        alert("⚠️ Aturan Proteksi Validasi:\nAlasan penolakan (catatan) wajib diisi untuk menginformasikan letak kesalahan berkas kepada pendaki.");
        return;
    }
    alert(`❌ SUKSES REJECT!\nBerkas ID #${verifId} resmi DITOLAK. Status pesanan otomatis dialihkan menjadi [Upload Ulang] di MySQL.`);
    window.closeRiskDocumentFullscreenViewerWindow();
    window.fetchLiveMysqlRiskVerificationKpiMetrics();
    window.executeLiveRiskSearchFilter();
    window.fetchLiveMysqlRiskAuditLogsStream();
};

window.fetchLiveMysqlRiskAuditLogsStream = function() {
    const tableBody = document.getElementById("riskVerificationAuditTableBodyStream");
    if (!tableBody) return;

    try {
        const mockAuditLogsDb = [
            { waktu: "14 Jun 2026 - 10:30", admin: "Zteic Ranger", email: "zteic@langkahpendaki.id", aksi: "FORCE APPROVE", target: "Rivaldi Petualang", id_verif: 1, note: "Melakukan bypass override indikasi fraud duplikasi NIK KTP setelah konfirmasi manual via telepon." },
            { waktu: "14 Jun 2026 - 09:00", admin: "Zteic Ranger", email: "zteic@langkahpendaki.id", aksi: "APPROVED", target: "Agus Solo Climber", id_verif: 2, note: "Workflow eksekusi mandiri diproses. Seluruh parameter berkas valid." },
            { waktu: "13 Jun 2026 - 14:00", admin: "Ranger Alpha", email: "alpha@langkahpendaki.id", aksi: "REJECTED", target: "Budi Backpacker", id_verif: 3, note: "Foto berkas selfie memegang KTP blur dan tidak jelas terbaca oleh sistem." }
        ];

        tableBody.innerHTML = "";

        mockAuditLogsDb.forEach(log => {
            let labelColorCss = "bg-stone-100 text-stone-700 border-stone-200";
            if (log.aksi === "APPROVED") labelColorCss = "bg-green-50 text-green-700 border-green-200 font-extrabold";
            else if (log.aksi === "REJECTED") labelColorCss = "bg-rose-50 text-rose-700 border-rose-200 font-extrabold";
            else if (log.aksi === "FORCE APPROVE") labelColorCss = "bg-purple-50 text-purple-700 border-purple-200 font-extrabold";

            tableBody.innerHTML += `
                <tr class="hover:bg-stone-50/60 transition duration-150 text-[11px]">
                    <td class="p-3 text-stone-400 font-mono">${log.waktu} WIB</td>
                    <td class="p-3 text-stone-900">
                        <div class="font-bold font-serif">${log.admin}</div>
                        <span class="text-[9px] text-stone-400 font-sans font-medium block">${log.email}</span>
                    </td>
                    <td class="p-3"><span class="px-1.5 py-0.5 rounded border text-[9px] uppercase tracking-wider ${labelColorCss}">${log.aksi}</span></td>
                    <td class="p-3 text-stone-700">
                        <div class="font-bold">${log.target}</div>
                        <span class="text-[9px] text-stone-400 font-mono block">Verif ID: #VRF-0${log.id_verif}</span>
                    </td>
                    <td class="p-3 text-stone-500 font-medium max-w-xs leading-normal truncate" title="${log.note}">${log.note}</td>
                </tr>`;
        });
    } catch (error) {
        console.error("Gagal memperbarui aliran tabel audit log global:", error);
    }
};

window.evaluateRiskBulkToolbarState = function() {
    const toolbar = document.getElementById("riskBulkActionToolbar");
    const countText = document.getElementById("riskBulkSelectCountText");
    if (!toolbar) return;

    const selectedBoxes = document.querySelectorAll("input[name='riskSelectedBulkRow']:checked");
    const totalSelected = selectedBoxes.length;

    if (totalSelected > 0) {
        if (countText) countText.textContent = totalSelected;
        toolbar.classList.remove("hidden");
        toolbar.classList.remove("opacity-0", "scale-95");
        toolbar.classList.add("opacity-100", "scale-100", "flex");
    } else {
        toolbar.classList.remove("opacity-100", "scale-100");
        toolbar.classList.add("opacity-0", "scale-95");
        setTimeout(() => {
            toolbar.classList.add("hidden");
            toolbar.classList.remove("flex");
        }, 250);
    }
};

window.executeRiskBulkActionWorkflowCommand = function(targetStatusAction) {
    const selectedBoxes = document.querySelectorAll("input[name='riskSelectedBulkRow']:checked");
    const selectedIds = Array.from(selectedBoxes).map(box => parseInt(box.value));

    if (selectedIds.length === 0) return;

    let customAdminNote = "";
    if (targetStatusAction === "rejected") {
        customAdminNote = prompt(`❌ VALIDASI TOLAK MASSAL (${selectedIds.length} Berkas)\nMasukkan alasan penolakan berkas massal secara jelas:`);
        if (!customAdminNote || !customAdminNote.trim()) {
            alert("⚠️ Pembatalan Aksi: Alasan catatan penolakan massal wajib diisi.");
            return;
        }
    } else {
        const confirmApprove = confirm(`⚠️ BATCH TRANSACTION APPROVE\nApakah Anda yakin ingin syringes ${selectedIds.length} berkas identitas secara bersamaan ke MySQL?`);
        if (!confirmApprove) return;
        customAdminNote = "Batch Otorisasi Massal disetujui oleh Ranger Commander.";
    }

    alert(`⚡ BATCH TRANSAKSI BERHASIL!\n${selectedIds.length} berkas identitas sukses di-update ke status [${targetStatusAction.toUpperCase()}] di database MySQL.`);

    selectedBoxes.forEach(box => box.checked = false);
    window.evaluateRiskBulkToolbarState();
    window.fetchLiveMysqlRiskVerificationKpiMetrics();
    window.executeLiveRiskSearchFilter();
    window.fetchLiveMysqlRiskAuditLogsStream();
};

// ==========================================================================
// MODUL UPDATE: ARSIP LAPORAN MODERN ENGINE 2026 (LANGKAH 1 s.d 6 FULL KODE)
// ==========================================================================
let adminReportsKpiRefreshIntervalId = null;
let reportSearchDebounceTimerId = null;
window.currentActiveReportRenderedRowsCount = 0;

function animateReportKpiCounter(elementId, targetValue, isCurrency = false) {
    const el = document.getElementById(elementId);
    if (!el) return;
    let startValue = 0;
    const duration = 500;
    const startTime = performance.now();
    function updateFrame(currentTime) {
        const elapsedTime = currentTime - startTime;
        if (elapsedTime >= duration) {
            el.textContent = isCurrency ? 'Rp ' + targetValue.toLocaleString('id-ID') : targetValue.toLocaleString('id-ID');
            return;
        }
        const progress = elapsedTime / duration;
        const currentCount = Math.floor(startValue + progress * (targetValue - startValue));
        el.textContent = isCurrency ? 'Rp ' + currentCount.toLocaleString('id-ID') : currentCount.toLocaleString('id-ID');
        requestAnimationFrame(updateFrame);
    }
    requestAnimationFrame(updateFrame);
}

window.fetchLiveMysqlReportingKpiMetrics = function() {
    try {
        let totalIncome = 38255901;
        let totalRentalsCount = 142;
        let totalCustomersCount = 89;
        let totalFinesAmount = 450000;
        animateReportKpiCounter("kpi-report-income", totalIncome, true);
        animateReportKpiCounter("kpi-report-rentals", totalRentalsCount, false);
        animateReportKpiCounter("kpi-report-customers", totalCustomersCount, false);
        animateReportKpiCounter("kpi-report-fines", totalFinesAmount, true);
    } catch (error) {
        console.error("Gagal menarik data asinkron agregasi KPI Laporan:", error);
    }
};

window.handleReportFilterSelectChange = function() {
    const periodSelect = document.getElementById("reportFilterPeriodSelect");
    const typeSelect = document.getElementById("reportFilterTypeSelect");
    const customDateWrapper = document.getElementById("reportFilterCustomDateWrapper");
    if (!periodSelect || !typeSelect) return;
    if (customDateWrapper) {
        if (periodSelect.value === "Custom Range") customDateWrapper.classList.remove("hidden");
            else customDateWrapper.classList.add("hidden");
    }
    window.executeLiveMysqlReportingEngineFilter(periodSelect.value, typeSelect.value);
};

window.triggerReportSearchWithDebounce = function() {
    clearTimeout(reportSearchDebounceTimerId);
    reportSearchDebounceTimerId = setTimeout(() => {
        const periodSelect = document.getElementById("reportFilterPeriodSelect");
        const typeSelect = document.getElementById("reportFilterTypeSelect");
        if (periodSelect && typeSelect) window.executeLiveMysqlReportingEngineFilter(periodSelect.value, typeSelect.value);
    }, 300);
};

window.applyLiveReportTextHighlightMarker = function(originalString, keywordText) {
    if (!keywordText || !originalString) return originalString;
    const escapedKeyword = keywordText.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    const regexMatchPattern = new RegExp(`(${escapedKeyword})`, "gi");
    return originalString.replace(regexMatchPattern, `<mark class="bg-yellow-200 text-stone-900 rounded px-0.5 font-bold font-sans">$1</mark>`);
};

window.executeLiveMysqlReportingEngineFilter = function(periodValue, typeValue) {
    const tableGridContainer = document.getElementById("reportingCentralTableDataGridContainer");
    const searchInput = document.getElementById("reportSmartSearchInput");
    if (!tableGridContainer) return;

    const queryKeyword = searchInput ? searchInput.value.trim() : "";
    tableGridContainer.innerHTML = `<div class="p-6 text-center text-stone-400 font-medium font-sans"><div class="space-y-2"><div class="w-full h-10 bg-stone-100 rounded animate-shimmer"></div></div></div>`;

    setTimeout(() => {
        const mockReportsDb = [
            { id: 1024, invoice: "LP-INV-1024", pelanggan: "Rivaldi Petualang", tipe: "Penyewaan", total: 450000, status: "Pembayaran Diterima", tanggal: "2026-06-14 08:30" },
            { id: 1025, invoice: "LP-INV-1025", pelanggan: "Agus Solo Climber", tipe: "Pendapatan", total: 125000, status: "Selesai", tanggal: "2026-06-14 09:00" },
            { id: 1026, invoice: "LP-INV-1026", pelanggan: "Budi Backpacker", tipe: "Denda", total: 50000, status: "Selesai", tanggal: "2026-06-13 14:00" }
        ];

        const filteredResults = mockReportsDb.filter(r => {
            const matchTeks = queryKeyword === "" || r.invoice.toLowerCase().includes(queryKeyword.toLowerCase()) || r.pelanggan.toLowerCase().includes(queryKeyword.toLowerCase()) || String(r.id) === queryKeyword;
            const matchType = typeValue === "Semua" || r.tipe === typeValue || (typeValue === "Pendapatan" && r.tipe === "Penyewaan") || (typeValue === "Denda" && r.tipe === "Denda");
            return matchTeks && matchType;
        });

        window.currentActiveReportRenderedRowsCount = filteredResults.length;

        if (filteredResults.length === 0) {
            tableGridContainer.innerHTML = `<div class="p-10 text-center text-stone-400 bg-white">🔍 Data pelaporan tidak ditemukan.</div>`;
            return;
        }

        let tableHtml = `
            <div class="overflow-x-auto max-h-[450px]">
                <table class="w-full text-left border-collapse text-xs font-semibold relative">
                    <thead>
                        <tr class="bg-stone-50 border-b border-stone-200 text-stone-500 uppercase tracking-wider text-[10px] sticky top-0 bg-stone-50 z-20 shadow-xs">
                            <th class="p-3">Tanggal Unggah</th><th class="p-3">Nomor Invoice</th><th class="p-3">Nama Pelanggan</th><th class="p-3">Jenis Laporan</th><th class="p-3">Total Transaksi</th><th class="p-3">Status Log</th><th class="p-3 text-center">Aksi Audit</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-stone-100 bg-white">`;

        filteredResults.forEach((res, index) => {
            let badgeClass = res.status === "Pembayaran Diterima" ? "bg-green-50 text-green-700 border-green-200" : "bg-blue-50 text-blue-700 border-blue-200";
            let typeLabelColor = res.tipe === "Pendapatan" ? "text-emerald-700 bg-emerald-50 border-emerald-100" : "text-rose-700 bg-rose-50 border-rose-100";
            const highlightedInvoice = window.applyLiveReportTextHighlightMarker(res.invoice, queryKeyword);
            const highlightedName = window.applyLiveReportTextHighlightMarker(res.pelanggan, queryKeyword);
            const zebraClass = index % 2 === 1 ? "bg-stone-50/40" : "bg-white";

            tableHtml += `
                <tr class="${zebraClass} hover:bg-stone-50 transition-colors duration-150 text-[11px] font-medium text-stone-700">
                    <td class="p-3 font-mono text-stone-400 whitespace-nowrap">${res.tanggal} WIB</td>
                    <td class="p-3 font-mono font-bold text-stone-900 tracking-wide">${highlightedInvoice}</td>
                    <td class="p-3 text-stone-900 font-serif font-bold text-xs">${highlightedName}</td>
                    <td class="p-3"><span class="px-2 py-0.5 rounded border text-[9px] uppercase tracking-wider font-extrabold ${typeLabelColor}">${res.tipe}</span></td>
                    <td class="p-3 font-mono font-black text-stone-900">Rp ${res.total.toLocaleString('id-ID')}</td>
                    <td class="p-3"><span class="status-badge border text-[9px] font-extrabold rounded-md ${badgeClass}">${res.status}</span></td>
                    <td class="p-3 text-center whitespace-nowrap">
                        <div class="inline-flex rounded-lg bg-stone-100 p-0.5 border border-stone-200 gap-0.5">
                            <button onclick="openDeepReportDetailModalWindow(${res.id})" class="bg-white hover:bg-stone-950 hover:text-white px-2 py-1 rounded-md text-stone-700 text-[10px] transition font-bold">👁️ Detail</button>
                            <button onclick="executeLiveReportEngineExportData('pdf')" class="bg-white hover:bg-emerald-600 hover:text-white px-2 py-1 rounded-md text-stone-600 text-[10px] transition"><i class="fa-regular fa-file-pdf"></i></button>
                            <button onclick="executeLiveReportEngineExportData('print')" class="bg-white hover:bg-blue-600 hover:text-white px-2 py-1 rounded-md text-stone-600 text-[10px] transition"><i class="fa-solid fa-print"></i></button>
                        </div>
                    </td>
                </tr>`;
        });
        tableHtml += `</tbody></table></div>`;
        tableGridContainer.innerHTML = tableHtml;
    }, 300);
};

window.openDeepReportDetailModalWindow = function(reportId) {
    const modal = document.getElementById("reportDeepDetailAuditModal");
    const mLblStatus = document.getElementById("report-modal-lbl-status");
    const mLblInvoice = document.getElementById("report-modal-lbl-invoice");
    const mItemsContainer = document.getElementById("report-modal-items-container");
    const mHistoryLog = document.getElementById("report-modal-history-log");

    if (!modal || !mLblInvoice) return;
    modal.classList.remove("opacity-0", "pointer-events-none");

    setTimeout(() => {
        const mockReportsDb = [
            { id: 1024, invoice: "LP-INV-1024", pelanggan: "Rivaldi Petualang", email: "rivaldi@gmail.com", phone: "087711223344", total: 450000, fine: 0, status: "Pembayaran Diterima", method: "BCA VA", tanggal: "14 Juni 2026", items: [{ name: "Tenda GO Borneo 4P", qty: 1, price: 75000 }] }
        ];
        const target = mockReportsDb[0];
        mLblInvoice.textContent = target.invoice;
        document.getElementById("report-modal-txt-name").textContent = target.pelanggan;
        document.getElementById("report-modal-txt-email").textContent = target.email;
        document.getElementById("report-modal-txt-phone").textContent = target.phone;
        document.getElementById("report-modal-txt-amount").textContent = `Rp ${target.total.toLocaleString('id-ID')}`;
        if (mItemsContainer) mItemsContainer.innerHTML = `<div class="p-2.5 flex justify-between"><span>${target.items[0].name}</span><strong>x${target.items[0].qty}</strong></div>`;
        if (mHistoryLog) mHistoryLog.innerHTML = `<div class="pl-2 text-stone-500 font-medium">Aliran pembayaran tervalidasi via gateway.</div>`;
    }, 200);
};

window.closeDeepReportDetailModalWindow = function() {
    const modal = document.getElementById("reportDeepDetailAuditModal");
    if (modal) modal.classList.add("opacity-0", "pointer-events-none");
};

window.executeLiveReportEngineExportData = function(exportFormatType) {
    const totalDataToExport = window.currentActiveReportRenderedRowsCount || 1;
    if (exportFormatType === "print") {
        window.print();
    } else {
        alert(`✔ Prosedur Ekspor Massal [${exportFormatType.toUpperCase()}] Sukses.\n${totalDataToExport} baris arsip rekap terekspor otomatis ke server MySQL.`);
    }
};

// ==========================================
// CORE INTERCEPTOR ROUTING TAB MENU OVERRIDE
// ==========================================
window.switchAdminTab = function(element) {
    if (!element) return;

    const targetSectionId = element.getAttribute("data-target");
    const allSections = document.querySelectorAll("main > section.section");
    
    allSections.forEach(section => {
        section.style.display = "none";
    });

    const targetSection = document.getElementById(targetSectionId);
    if (targetSection) {
        targetSection.style.display = "block";
    }

    const allMenuButtons = document.querySelectorAll("nav.nav-links ul li.menu");
    allMenuButtons.forEach(btn => {
        btn.classList.remove("active");
    });
    element.classList.add("active");

    clearInterval(adminGudangKpiRefreshIntervalId);
    clearInterval(adminVerificationKpiRefreshIntervalId);
    clearInterval(adminReportsKpiRefreshIntervalId);
    
    if (targetSectionId === "inventory") {
        if (typeof window.fetchLiveMysqlInventoryKpiMetrics === "function") window.fetchLiveMysqlInventoryKpiMetrics();
        if (typeof window.fetchLiveGudangActivityMovementLogs === "function") window.fetchLiveGudangActivityMovementLogs();
        if (typeof window.renderLiveGudangStockMovementChart === "function") window.renderLiveGudangStockMovementChart();
        if (typeof window.executeLiveGudangLowStockAlertDetector === "function") window.executeLiveGudangLowStockAlertDetector();
        if (typeof window.renderLiveAdminGudangStokTable === "function") window.renderLiveAdminGudangStokTable();
        
        adminGudangKpiRefreshIntervalId = setInterval(() => {
            if (typeof window.fetchLiveMysqlInventoryKpiMetrics === "function") window.fetchLiveMysqlInventoryKpiMetrics();
            if (typeof window.fetchLiveGudangActivityMovementLogs === "function") window.fetchLiveGudangActivityMovementLogs();
            if (typeof window.executeLiveGudangLowStockAlertDetector === "function") window.executeLiveGudangLowStockAlertDetector();
        }, 10000);
    } 
    else if (targetSectionId === "payments") {
        if (typeof window.fetchLiveMysqlRiskVerificationKpiMetrics === "function") window.fetchLiveMysqlRiskVerificationKpiMetrics();
        if (typeof window.executeLiveRiskSearchFilter === "function") window.executeLiveRiskSearchFilter();
        if (typeof window.fetchLiveMysqlRiskAuditLogsStream === "function") window.fetchLiveMysqlRiskAuditLogsStream();

        adminVerificationKpiRefreshIntervalId = setInterval(() => {
            if (typeof window.fetchLiveMysqlRiskVerificationKpiMetrics === "function") window.fetchLiveMysqlRiskVerificationKpiMetrics();
            if (typeof window.fetchLiveMysqlRiskAuditLogsStream === "function") window.fetchLiveMysqlRiskAuditLogsStream();
        }, 10000);
    }
    else if (targetSectionId === "reports") {
        if (typeof window.fetchLiveMysqlReportingKpiMetrics === "function") window.fetchLiveMysqlReportingKpiMetrics();
        if (typeof window.handleReportFilterSelectChange === "function") window.handleReportFilterSelectChange();

        adminReportsKpiRefreshIntervalId = setInterval(() => {
            if (typeof window.fetchLiveMysqlReportingKpiMetrics === "function") window.fetchLiveMysqlReportingKpiMetrics();
        }, 10000);
    }
};

// ==========================================================================
// SEEDER FALLBACK SAFETY: MEMASTIKAN DASHBOARD TIDAK BLANK SAAT DB KOSONG
// ==========================================================================
function seedDefaultAdminDashboardDataIfMissing() {
    // 1. Seed Inventory/Produk Katalog Gudang jika belum ada
    if (!localStorage.getItem("inventory")) {
        const defaultProducts = [
            { id: 1, name: "Tenda Great Outdoor Borneo 4 Pro All Black", category: "Tenda", price: 75000, stock: 12, minimum_stock: 2, image: "https://images.unsplash.com/photo-1510312305653-8ed496efae75?w=500", created_at: "2026-06-13T12:00:00.000Z" },
            { id: 2, name: "Tenda Bigadventure Rinjani 2P Ultra Light", category: "Tenda", price: 125000, stock: 7, minimum_stock: 2, image: "https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=500", created_at: "2026-06-12T10:00:00.000Z" },
            { id: 3, name: "Tas Carrier Arei Toba 60L Trekking Series", category: "Carrier", price: 65000, stock: 18, minimum_stock: 2, image: "https://images.unsplash.com/photo-1551632811-561732d1e306?w=500", created_at: "2026-06-11T09:00:00.000Z" },
            { id: 12, name: "Kompor Camping Portable Mini Windproof Cover", category: "Gear", price: 20000, stock: 30, minimum_stock: 2, image: "https://images.unsplash.com/photo-1628155930542-3c7a64e2c833?w=500", created_at: "2026-06-14T01:00:00.000Z" }
        ];
        localStorage.setItem("inventory", JSON.stringify(defaultProducts));
    }

    // 2. Seed Data Transaksi/UserHistory untuk mengisi Kalender, Grafik, dan Tabel Utama
    if (!localStorage.getItem("userHistory")) {
        const defaultHistory = [
            { 
                id: 1024, 
                user: "Rivaldi Petualang", 
                invoice_number: "LP-INV-1024", 
                amount: 450000, 
                status: "Pembayaran Diterima", 
                startDate: "2026-06-12", 
                expectedReturnDate: "2026-06-15",
                items: [{ name: "Tenda Great Outdoor Borneo 4 Pro All Black", category: "Tenda", price: 75000 }]
            },
            { 
                id: 1025, 
                user: "Agus Solo Climber", 
                invoice_number: "LP-INV-1025", 
                amount: 195000, 
                status: "Menunggu Verifikasi", 
                startDate: "2026-06-14", 
                expectedReturnDate: "2026-06-17",
                items: [{ name: "Tas Carrier Arei Toba 60L Trekking Series", category: "Carrier", price: 65000 }]
            },
            { 
                id: 1026, 
                user: "Budi Backpacker", 
                invoice_number: "LP-INV-1026", 
                amount: 140000, 
                status: "Selesai", 
                startDate: "2026-06-10", 
                expectedReturnDate: "2026-06-13",
                items: [{ name: "Kompor Camping Portable Mini Windproof Cover", category: "Gear", price: 20000 }]
            }
        ];
        localStorage.setItem("userHistory", JSON.stringify(defaultHistory));
    }
}