/**
 * CORE SCRIPT ENGINE CUSTOMER DASHBOARD - "SMART MEMBER CENTER 2026"
 * FILENAME: user-core.js
 */

let userHistoryActiveStatusTabState = "Semua";
let userHistorySearchDebounceTimerId = null;
let userPaymentCountdownIntervalId = null;
let reportSearchDebounceTimerId = null;
let userHistoryActiveStatusTabStateGlobal = "Semua";

document.addEventListener("DOMContentLoaded", () => {
    // Jalankan sistem orkestrasi pemuatan data ber-utilitas skeleton loader (Langkah 13)
    window.executeUserDashboardGlobalOrchestrationDataLoadingHub();
    
    // Aktifkan pemicu pengamat gerak gulir layar untuk floating toolbar & navbar (Langkah 10 & 12)
    window.addEventListener("scroll", window.handleUserDashboardScrollStateChangeDispatcher, { passive: true });
});

// ==========================================================================
// LANGKAH 13: SKELETON SHIMMER ORCHESTRATION DATA LOADING HUB
// ==========================================================================
window.executeUserDashboardGlobalOrchestrationDataLoadingHub = function() {
    const skeletonScreen = document.getElementById("userDashboardGlobalSkeletonShimmerScreen");
    console.log("🕒 MySQL Fetch Lifecycle Initiated. Shimmer Mask Engaged.");

    // Simulasikan masa latensi kueri gabungan multi-tabel basis data (Jeda 1.1 Detik)
    setTimeout(() => {
        try {
            if (typeof window.fetchLiveMysqlUserDashboardHeroMetrics === "function") window.fetchLiveMysqlUserDashboardHeroMetrics();
            if (typeof window.fetchLiveMysqlUserDashboardActivitySummary === "function") window.fetchLiveMysqlUserDashboardActivitySummary();
            if (typeof window.syncUserDashboardOrderProgressTrackingTimeline === "function") window.syncUserDashboardOrderProgressTrackingTimeline();
            if (typeof window.fetchLiveMysqlUserMiniCartSummary === "function") window.fetchLiveMysqlUserMiniCartSummary();
            if (typeof window.fetchLiveMysqlUserDashboardActiveBillingInvoice === "function") window.fetchLiveMysqlUserDashboardActiveBillingInvoice();
            if (typeof window.initializeUserPaymentProofUploadEngine === "function") window.initializeUserPaymentProofUploadEngine();
            if (typeof window.renderLiveMysqlUserHistoryCardsGrid === "function") window.renderLiveMysqlUserHistoryCardsGrid();
            if (typeof window.syncLiveMysqlUserDashboardNotificationCenter === "function") window.syncLiveMysqlUserDashboardNotificationCenter();

            if (skeletonScreen) {
                skeletonScreen.classList.add("fade-out-smooth");
                setTimeout(() => {
                    skeletonScreen.classList.add("hidden");
                    console.log("🔒 Data Rendered Perfectly. Shimmer Mask Safely Disengaged.");
                }, 300);
            }
        } catch (error) {
            console.error("Kesalahan kritis pada hub orkestrasi pemuatan data:", error);
            if (skeletonScreen) skeletonScreen.classList.add("hidden");
        }
    }, 1100);
};

// ==========================================================================
// LANGKAH 1: AUTOMATED LIVE USER PERSONAL HERO METRICS DATA SINKRONISASI
// ==========================================================================
window.fetchLiveMysqlUserDashboardHeroMetrics = function() {
    const avatarImg = document.getElementById("userHeroAvatarImage");
    const nameTxt = document.getElementById("userHeroNameText");
    const statusTxt = document.getElementById("userHeroStatusText");
    const membershipBadge = document.getElementById("userHeroMembershipBadge");
    const totalRentTxt = document.getElementById("userHeroTotalRentText");
    const pointsTxt = document.getElementById("userHeroPointsText");

    try {
        const mockUserDataFromMysql = {
            nama_user: "Rivaldi Petualang",
            status_akun: "Active",
            membership_level: "Ranger Elite",
            avatar_path: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150",
            total_penyewaan: 14,
            reward_points: 620
        };

        if (nameTxt) nameTxt.textContent = `${mockUserDataFromMysql.nama_user} 👋`;
        if (statusTxt) statusTxt.textContent = mockUserDataFromMysql.status_akun;
        if (avatarImg && mockUserDataFromMysql.avatar_path) avatarImg.src = mockUserDataFromMysql.avatar_path;
        
        if (totalRentTxt) {
            totalRentTxt.innerHTML = `${mockUserDataFromMysql.total_penyewaan} <span class="text-[10px] font-sans text-stone-400 font-normal">Trip</span>`;
        }
        if (pointsTxt) {
            pointsTxt.innerHTML = `<i class="fa-solid fa-star text-[11px] text-[#D4A017]"></i> ${mockUserDataFromMysql.reward_points} <span class="text-[10px] font-sans text-stone-400 font-normal">Pts</span>`;
        }
        if (membershipBadge) {
            let iconCrownColor = mockUserDataFromMysql.membership_level === "Ranger Elite" ? "text-red-400 animate-pulse" : "text-[#D4A017]";
            membershipBadge.innerHTML = `<i class="fa-solid fa-crown ${iconCrownColor}"></i> ${mockUserDataFromMysql.membership_level}`;
        }
    } catch (error) {
        console.error("Gagal melakukan sinkronisasi data profil personal dari MySQL:", error);
    }
};

// ==========================================================================
// LANGKAH 2: SMOOTH INCREMENTAL COUNTER ACTIVITY SUMMARY
// ==========================================================================
window.fetchLiveMysqlUserDashboardActivitySummary = function() {
    try {
        const mockSummaryDb = { pesanan_aktif: 1, total_pengeluaran: 450000, total_penyewaan: 12, poin_reward: 620 };
        window.executeUserKpiSmoothCounterRevealAnimation("user-kpi-active-orders", mockSummaryDb.pesanan_aktif, false);
        window.executeUserKpiSmoothCounterRevealAnimation("user-kpi-total-expenses", mockSummaryDb.total_pengeluaran, true);
        window.executeUserKpiSmoothCounterRevealAnimation("user-kpi-total-rentals", mockSummaryDb.total_penyewaan, false);
        window.executeUserKpiSmoothCounterRevealAnimation("user-kpi-reward-points", mockSummaryDb.poin_reward, false);
    } catch (error) {
        console.error("Gagal memuat ringkasan aktivitas dari MySQL:", error);
    }
};

window.executeUserKpiSmoothCounterRevealAnimation = function(elementId, targetEndVal, isCurrency = false) {
    const el = document.getElementById(elementId);
    if (!el) return;
    let startValue = 0;
    const duration = 600;
    const startTime = performance.now();
    function animateFrame(currentTime) {
        const elapsedTime = currentTime - startTime;
        if (elapsedTime >= duration) {
            el.textContent = isCurrency ? 'Rp ' + targetEndVal.toLocaleString('id-ID') : targetEndVal.toLocaleString('id-ID');
            return;
        }
        const progress = elapsedTime / duration;
        const currentCount = Math.floor(startValue + progress * (targetEndVal - startValue));
        el.textContent = isCurrency ? 'Rp ' + currentCount.toLocaleString('id-ID') : currentCount.toLocaleString('id-ID');
        requestAnimationFrame(animateFrame);
    }
    requestAnimationFrame(animateFrame);
};

// ==========================================================================
// LANGKAH 3: DYNAMIC TIMELINE STATUS PROGRESS HIGHLIGHTER
// ==========================================================================
window.syncUserDashboardOrderProgressTrackingTimeline = function() {
    try {
        const mockActiveOrderRow = { invoice_number: "LP-INV-1024", status_raw: "Pembayaran Diterima" };
        const invoiceLabel = document.getElementById("userProgressTrackingInvoiceLabelText");
        if (invoiceLabel) invoiceLabel.textContent = mockActiveOrderRow.invoice_number;

        let activeLevelStepIndex = 1;
        if (mockActiveOrderRow.status_raw === "Menunggu Pembayaran") activeLevelStepIndex = 2;
        else if (mockActiveOrderRow.status_raw === "Menunggu Verifikasi") activeLevelStepIndex = 3;
        else if (mockActiveOrderRow.status_raw === "Siap Diambil") activeLevelStepIndex = 4;
        else if (mockActiveOrderRow.status_raw === "Pembayaran Diterima") activeLevelStepIndex = 5;
        else if (mockActiveOrderRow.status_raw === "Selesai") activeLevelStepIndex = 6;

        const allProgressNodesList = [
            { id: "progress-node-booking", step: 1 }, { id: "progress-node-pembayaran", step: 2 },
            { id: "progress-node-validasi", step: 3 }, { id: "progress-node-siap", step: 4 },
            { id: "progress-node-disewa", step: 5 }, { id: "progress-node-selesai", step: 6 }
        ];

        allProgressNodesList.forEach(node => {
            const nodeEl = document.getElementById(node.id);
            if (!nodeEl) return;
            const circle = nodeEl.querySelector(".node-circle");
            const label = nodeEl.querySelector(".node-label");
            const desc = nodeEl.querySelector(".node-desc");

            if (node.step === activeLevelStepIndex) {
                if (circle) circle.className = "w-9 h-9 rounded-full bg-[#355E3B] text-white border-2 border-green-200 flex items-center justify-center font-black text-xs font-mono scale-110 shadow-lg z-10 node-circle animate-pulse";
                if (label) label.className = "text-[12px] text-[#355E3B] font-black block mt-2 node-label";
                if (desc) desc.className = "text-[10px] text-green-600 font-bold block node-desc mt-0.5";
            } else if (node.step < activeLevelStepIndex) {
                if (circle) circle.className = "w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-300 flex items-center justify-center font-extrabold text-xs font-mono z-10 node-circle";
                if (label) label.className = "text-[11px] text-emerald-800 font-semibold block mt-2 node-label";
                if (desc) desc.className = "text-[9px] text-emerald-500 font-medium block node-desc mt-0.5";
            } else {
                if (circle) circle.className = "w-8 h-8 rounded-full bg-stone-50 text-stone-400 border border-stone-200 flex items-center justify-center font-bold text-xs font-mono z-10 node-circle";
                if (label) label.className = "text-[11px] text-stone-400 font-bold block mt-2 node-label";
                if (desc) desc.className = "text-[9px] text-stone-400 font-medium block node-desc mt-0.5";
            }
        });
    } catch (error) {
        console.error("Gagal menjalankan modul sirkulasi tracking:", error);
    }
};

// ==========================================================================
// LANGKAH 4 & 15: ASYNCHRONOUS MINI CART & EMPTY STATE HANDLER
// ==========================================================================
window.fetchLiveMysqlUserMiniCartSummary = function() {
    try {
        const mockCartDbRow = { ragam_item: 0, volume_unit: 0, subtotal_sewa: 0 }; // KONDISI SIMULASI KEKOSONGAN (Empty State Hook)
        const lblVolume = document.getElementById("miniCartTxtTotalVolume");
        const lblSubtotal = document.getElementById("miniCartTxtSubtotalPrice");
        const lblReturnEst = document.getElementById("miniCartTxtReturnEstimation");
        const cartPanel = document.getElementById("userMiniCartInlineActionPanel");

        if (mockCartDbRow.volume_unit === 0 && cartPanel) {
            // LANGKAH 15: INJEKSI FORMAT EMPTY STATE YANG INFORMATIF (CTA BUTTON CATALOG LINK)
            cartPanel.innerHTML = `
                <div class="py-4 text-center select-none font-sans font-medium text-stone-400 flex flex-col items-center justify-center gap-2">
                    <span class="text-3xl animate-bounce">🎒</span>
                    <p class="text-xs font-bold text-stone-800 font-serif leading-tight">Keranjang Belanja Kosong</p>
                    <p class="text-[10px] text-stone-400 max-w-[180px] leading-normal mx-auto">Belum ada penyewaan. Yuk mulai cari perlengkapan untuk petualangan hebatmu!</p>
                    <button onclick="alert('Membuka tab Katalog Produk MySQL...')" class="mt-1 bg-[#355E3B] hover:bg-green-800 text-white font-bold px-4 py-1.5 rounded-xl transition text-[10px] shadow-sm transform active:scale-95 cursor-pointer">Explore Katalog Alat</button>
                </div>`;
            return;
        }

        if (lblVolume) lblVolume.textContent = `${mockCartDbRow.volume_unit} Unit (${mockCartDbRow.ragam_item} Seri)`;
        if (lblSubtotal) lblSubtotal.textContent = 'Rp ' + mockCartDbRow.subtotal_sewa.toLocaleString('id-ID');
        if (lblReturnEst) lblReturnEst.innerHTML = `17 Juni 2026 <small class="text-[9px] text-stone-400 font-bold font-sans">(Est. Sewa 3 Hari)</small>`;
    } catch (error) {
        console.error("Gagal melakukan penyelarasan mini cart:", error);
    }
};

// ==========================================================================
// LANGKAH 5: PAYMENT GATEWAY REALTIME MONITOR & COUNTDOWN
// ==========================================================================
window.startUserPaymentCountdownClockEngine = function(dueIsoString) {
    const timerStringEl = document.getElementById("paymentCountdownTimerString");
    if (!timerStringEl) return;
    const targetEndTime = new Date(dueIsoString).getTime();
    clearInterval(userPaymentCountdownIntervalId);
    userPaymentCountdownIntervalId = setInterval(() => {
        const nowTime = new Date().getTime();
        const difference = targetEndTime - nowTime;
        if (difference <= 0) {
            clearInterval(userPaymentCountdownIntervalId);
            timerStringEl.textContent = "KEDALUWARSA";
            return;
        }
        const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);
        timerStringEl.textContent = String(hours).padStart(2, '0') + ":" + String(minutes).padStart(2, '0') + ":" + String(seconds).padStart(2, '0');
    }, 1000);
};

window.fetchLiveMysqlUserDashboardActiveBillingInvoice = function() {
    try {
        const mockBillingDbRow = { invoice_number: "LP-INV-1024", total_tagihan: 450000, method: "Bank Central Asia VA", va_number: "8832112408980002", due_timestamp: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString() };
        const lblMethod = document.getElementById("userPaymentMethodLabelText");
        const lblBill = document.getElementById("userPaymentTotalBillValueText");
        const inputVa = document.getElementById("userPaymentVaNumberInputField");

        if (lblMethod) lblMethod.textContent = mockBillingDbRow.method;
        if (lblBill) lblBill.textContent = 'Rp ' + mockBillingDbRow.total_tagihan.toLocaleString('id-ID');
        if (inputVa) inputVa.value = mockBillingDbRow.va_number;
        window.startUserPaymentCountdownClockEngine(mockBillingDbRow.due_timestamp);
    } catch (error) {
        console.error("Gagal melakukan pemuatan billing:", error);
    }
};

window.copyUserPaymentVaNumberToClipboard = function() {
    const inputVa = document.getElementById("userPaymentVaNumberInputField");
    if (!inputVa) return;
    inputVa.select();
    navigator.clipboard.writeText(inputVa.value);
    alert("📋 Salin Sukses nomor VA.");
};

window.triggerAsynchronousLiveCheckPaymentStatus = function() {
    alert("🔄 Sinkronisasi Gateway Pembayaran...");
    setTimeout(() => {
        alert("✅ PEMBAYARAN TERVERIFIKASI LUNAS!");
        const summaryGrid = document.getElementById("userActivePaymentGatewayWidgetPanel");
        if (summaryGrid) summaryGrid.innerHTML = `<div class="py-6 text-center text-emerald-700 bg-emerald-50 rounded-2xl border font-bold">🎉 Sukses! Invoice Lunas. Silakan lengkapi berkas jaminan Anda.</div>`;
        if (typeof window.syncUserDashboardOrderProgressTrackingTimeline === "function") window.syncUserDashboardOrderProgressTrackingTimeline();
    }, 800);
};

// ==========================================================================
// LANGKAH 6: IMAGE INGESTION INTERCEPTOR & SKELETON LOADER
// ==========================================================================
window.initializeUserPaymentProofUploadEngine = function() {
    const dropZone = document.getElementById("userPaymentProofDragDropZone");
    if (!dropZone) return;
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eName => { dropZone.addEventListener(eName, (e) => e.preventDefault(), false); });
    dropZone.addEventListener('dragover', () => dropZone.classList.add('bg-stone-100'));
    dropZone.addEventListener('dragleave', () => dropZone.classList.remove('bg-stone-100'));
    dropZone.addEventListener('drop', (e) => { window.evaluateAndProcessUploadedProofFile(e.dataTransfer.files[0]); });
    dropZone.addEventListener('click', () => {
        const fInput = document.createElement('input'); fInput.type = 'file'; fInput.accept = 'image/*';
        fInput.onchange = () => { window.evaluateAndProcessUploadedProofFile(fInput.files[0]); }; fInput.click();
    });
};

window.evaluateAndProcessUploadedProofFile = function(fileObject) {
    const skeleton = document.getElementById("userPaymentProofSkeletonLoader");
    const previewImg = document.getElementById("userPaymentProofInstantImgPreview");
    const hintText = document.getElementById("userPaymentProofNoImageTextHint");
    const base64Input = document.getElementById("userPaymentProofBase64CachedValue");
    
    if (fileObject.size > 2 * 1024 * 1024) return alert("❌ Maksimal File 2MB.");
    if (skeleton) skeleton.classList.remove("hidden");
    if (hintText) hintText.classList.add("hidden");

    const reader = new FileReader();
    reader.onload = (e) => {
        setTimeout(() => {
            if (skeleton) skeleton.classList.add("hidden");
            if (previewImg) { previewImg.src = e.target.result; previewImg.classList.remove("hidden"); }
            if (base64Input) base64Input.value = e.target.result;
            alert("✨ SUKSES UNGGAH BUKTI BAYAR!");
            if (typeof window.syncUserDashboardOrderProgressTrackingTimeline === "function") window.syncUserDashboardOrderProgressTrackingTimeline();
        }, 800);
    };
    reader.readAsDataURL(fileObject);
};

// ==========================================================================
// LANGKAH 7: INTERACTIVE VOUCHER PROMO CLAIM ENGINE
// ==========================================================================
window.triggerAsynchronousApplyVoucherCode = function() {
    const codeInput = document.getElementById("userVoucherInputField");
    const feedbackAlert = document.getElementById("userVoucherFeedbackStatusAlert");
    const calcMatrix = document.getElementById("userVoucherCalculationMatrixWrapper");
    if (!codeInput || !feedbackAlert) return;
    const code = codeInput.value.trim().toUpperCase();
    if (!code) return;

    feedbackAlert.className = "rounded-xl px-3 py-2 text-[11px] font-medium bg-stone-50 border text-stone-500 block text-left animate-pulse";
    feedbackAlert.textContent = "⏳ Memeriksa voucher ke database MySQL...";

    setTimeout(() => {
        if (code === "PENDAKIBARU") {
            feedbackAlert.className = "rounded-xl px-3 py-2 text-[11px] font-bold bg-emerald-50 border text-emerald-700 block text-left";
            feedbackAlert.innerHTML = `🎉 VOUCHER BERHASIL! Diskon diterapkan.`;
            if (calcMatrix) calcMatrix.classList.remove("hidden");
            document.getElementById("voucherMatrixDiscountValueString").textContent = "-Rp 35.000";
            document.getElementById("voucherMatrixFinalAmountValueString").textContent = "Rp 415.000";
        } else {
            feedbackAlert.className = "rounded-xl px-3 py-2 text-[11px] font-medium bg-rose-50 border text-rose-700 block text-left";
            feedbackAlert.innerHTML = `❌ Kupon tidak valid atau kuota habis.`;
        }
    }, 450);
};

// ==========================================================================
// LANGKAH 8: TIMELINE HISTORY CARD GRID & LIVE TEXT DEBOUNCE
// ==========================================================================
window.switchUserHistoryTabStatusFilter = function(targetStatus, elementButton) {
    const buttons = document.querySelectorAll("#userHistoryStatusTabGroup button");
    buttons.forEach(btn => btn.className = "px-2.5 py-1.5 rounded-lg text-stone-500 transition-all duration-200 cursor-pointer");
    elementButton.className = "px-2.5 py-1.5 rounded-lg active bg-[#355E3B] text-white font-extrabold transition-all duration-200 cursor-pointer";
    userHistoryActiveStatusTabStateGlobal = targetStatus;
    window.renderLiveMysqlUserHistoryCardsGrid();
};

window.triggerUserHistorySearchDebounce = function() {
    clearTimeout(userHistorySearchDebounceTimeout);
    userHistorySearchDebounceTimeout = setTimeout(() => { window.renderLiveMysqlUserHistoryCardsGrid(); }, 300);
};

window.renderLiveMysqlUserHistoryCardsGrid = function() {
    const cardsWrapper = document.getElementById("userHistoryCardsDynamicInjectionWrapper");
    const searchInput = document.getElementById("userHistorySearchInvoiceInputField");
    if (!cardsWrapper) return;
    const query = searchInput ? searchInput.value.trim().toLowerCase() : "";

    setTimeout(() => {
        const mockHistoryOrdersDb = [
            { id: 1024, invoice: "LP-INV-1024", tanggal: "14 Jun 2026", produk_sampul: "Tenda GO Borneo 4P", foto_sampul: "https://images.unsplash.com/photo-1510312305653-8ed496efae75?w=200", total_items: 2, amount: 450000, status: "Pembayaran Diterima" }
        ];
        cardsWrapper.innerHTML = "";
        mockHistoryOrdersDb.forEach(res => {
            const highlightedInvoiceNumber = window.applyLiveReportTextHighlightMarker(res.invoice, query);
            cardsWrapper.innerHTML += `
                <div class="bg-stone-50/40 border border-stone-200/60 rounded-2xl p-3.5 flex flex-col sm:flex-row gap-4 items-center justify-between transition-all duration-300 hover:border-stone-300 fade-in-smooth">
                    <div class="flex items-center gap-3.5 text-left w-full sm:w-auto">
                        <div class="w-14 h-14 rounded-xl bg-white border border-stone-200 overflow-hidden shrink-0"><img src="${res.foto_sampul}" class="w-full h-full object-cover"></div>
                        <div><div class="flex items-center gap-2"><span class="font-mono text-[10px] font-black text-[#355E3B] bg-green-50 px-1.5 rounded">${highlightedInvoiceNumber}</span><span class="text-stone-400 font-mono text-[9px]">${res.tanggal}</span></div><h5 class="text-stone-900 font-serif font-bold text-xs truncate mt-1">${res.produk_sampul}</h5></div>
                    </div>
                    <div class="flex items-center gap-4 text-right"><div class="text-right"><span class="text-[9px] text-stone-400 block">Total Tagihan</span><strong class="font-mono text-stone-900 text-xs block">Rp ${res.amount.toLocaleString('id-ID')}</strong></div><button onclick="openDeepUserHistoryDetailModal(${res.id})" class="bg-white px-2.5 py-1.5 rounded-xl border text-stone-700 text-[11px] font-bold cursor-pointer">Detail</button></div>
                </div>`;
        });
    }, 200);
};

window.applyLiveReportTextHighlightMarker = function(text, query) {
    if (!query) return text;
    const regex = new RegExp(`(${query})`, 'gi');
    return text.replace(regex, '<mark class="bg-yellow-200">$1</mark>');
};

// ==========================================================================
// LANGKAH 9: INTERACTIVE HISTORY DEEP DETAIL OVERLAY MODAL
// ==========================================================================
window.openDeepUserHistoryDetailModal = function(orderId) {
    const modal = document.getElementById("userHistoryDeepDetailOverlayModal");
    if (modal) modal.classList.remove("opacity-0", "pointer-events-none");
    document.getElementById("user-history-modal-lbl-invoice").textContent = "LP-INV-1024";
    document.getElementById("user-history-modal-img-proof").src = "https://images.unsplash.com/photo-1554774853-aae0a22c8aa4?w=400";
    document.getElementById("user-history-modal-txt-method").textContent = "BCA VA";
    document.getElementById("user-history-modal-txt-total").textContent = "Rp 450.000";
    document.getElementById("user-history-modal-items-list-container").innerHTML = `<div class="p-2 flex justify-between"><span>Tenda GO Borneo 4P</span><strong>x1 Unit</strong></div>`;
    document.getElementById("user-history-modal-timeline-trail-wrapper").innerHTML = `<div class="pl-2">Kuitansi sewa lunas terverifikasi manual.</div>`;
};

window.closeDeepUserHistoryDetailModal = function() {
    const modal = document.getElementById("userHistoryDeepDetailOverlayModal");
    if (modal) modal.classList.add("opacity-0", "pointer-events-none");
};

// ==========================================================================
// LANGKAH 10: FLOATING QUICK ACTION RESPONSIVE CONTROL INTERFACE
// ==========================================================================
window.handleUserDashboardScrollStateChangeDispatcher = function() {
    const navbar = document.getElementById("dynamicUserNavbar");
    const navLogo = document.getElementById("userNavbarBrandingLogoText");
    const navSubLogo = document.getElementById("userNavbarBrandingSubLogoText");
    const floatingRow = document.getElementById("userDashboardFloatingQuickActionRow");
    const currentScrollHeight = window.scrollY || document.documentElement.scrollTop;

    if (navbar) {
        if (currentScrollHeight > 20) {
            navbar.className = "fixed top-0 inset-x-0 h-16 bg-white/95 backdrop-blur-md border-b border-stone-200/80 z-50 transition-all duration-300 ease-in-out flex items-center px-4 md:px-8 justify-between font-semibold shadow-sm text-xs text-[#2C3639]";
            if (navLogo) navLogo.className = "font-bold text-stone-900 text-base";
            if (navSubLogo) navSubLogo.className = "text-[#355E3B]";
        } else {
            navbar.className = "fixed top-0 inset-x-0 h-20 bg-transparent text-white border-b border-white/10 z-50 transition-all duration-300 ease-in-out flex items-center px-4 md:px-8 justify-between font-semibold select-none text-xs";
            if (navLogo) navLogo.className = "font-bold text-white text-base";
            if (navSubLogo) navSubLogo.className = "text-emerald-400";
        }
    }

    if (floatingRow) {
        if (currentScrollHeight > 240) floatingRow.classList.remove("opacity-0", "scale-90", "pointer-events-none");
        else floatingRow.classList.add("opacity-0", "scale-90", "pointer-events-none");
    }
};

window.scrollBypassSmoothReturnToTopWindow = function() { window.scrollTo({ top: 0, behavior: "smooth" }); };
window.scrollKilatDirectToMiniCartPanel = function() { document.getElementById("userMiniCartInlineActionPanel")?.scrollIntoView({ behavior: "smooth", block: "center" }); };

// ==========================================================================
// LANGKAH 11: USER DROPDOWN NOTIFICATION CENTER STREAM
// ==========================================================================
window.toggleUserNotificationCenterDropdownMenu = function() {
    const menu = document.getElementById("userNotificationDropdownMenuWrapper");
    if (menu) {
        if (menu.classList.contains("hidden")) menu.classList.remove("hidden");
        else menu.classList.add("hidden");
    }
};

window.syncLiveMysqlUserDashboardNotificationCenter = function() {
    try {
        const listContainer = document.getElementById("userNotificationListItemsInjectionContainer");
        if (listContainer) {
            listContainer.innerHTML = `
                <div class="p-3 flex items-start gap-2.5 bg-stone-50 font-bold border-b">
                    <div class="text-left flex-1"><span class="text-stone-900 font-serif block">Pembayaran Invoice Diverifikasi</span><p class="text-[10px] text-stone-500 mt-0.5">Struk Invoice #LP-1024 dinyatakan valid oleh Ranger Gudang.</p></div>
                </div>`;
            document.getElementById("userNotificationBadgeCountLabel").classList.remove("hidden");
            document.getElementById("userNotificationBadgeCountLabel").textContent = "1";
        }
    } catch (e) { console.error(e); }
};

// ==========================================================================
// LANGKAH 14: SEGMENT ROUTING & SMOOTH TOP PROGRESS BAR
// ==========================================================================
window.bypassRouteSegmentNavigateTransitionHub = function(targetSegmentNameString) {
    const progressBar = document.getElementById("userDashboardTopPaceProgressBarLine");
    const workspaceSegment = document.getElementById("userDashboardSegmentWorkspaceView");
    const rewardSegment = document.getElementById("userDashboardSegmentRewardCatalogView");
    if (!progressBar) return;

    progressBar.style.opacity = "1"; progressBar.style.width = "40%";
    if (workspaceSegment) workspaceSegment.style.opacity = "0";
    if (rewardSegment) rewardSegment.style.opacity = "0";

    setTimeout(() => {
        progressBar.style.width = "100%";
        if (targetSegmentNameString === "workspace") {
            workspaceSegment?.classList.remove("segment-view-hidden"); workspaceSegment?.classList.add("segment-view-active");
            rewardSegment?.classList.remove("segment-view-active"); rewardSegment?.classList.add("segment-view-hidden");
            if (workspaceSegment) workspaceSegment.style.opacity = "1";
        } else {
            workspaceSegment?.classList.remove("segment-view-active"); workspaceSegment?.classList.add("segment-view-hidden");
            rewardSegment?.classList.remove("segment-view-hidden"); rewardSegment?.classList.add("segment-view-active");
            if (rewardSegment) rewardSegment.style.opacity = "1";
        }
        setTimeout(() => { progressBar.style.opacity = "0"; }, 200);
    }, 300);
};

// ==========================================================================
// LANGKAH 16: PAYMENT ORDER CONFIRMATION WITH SUPABASE INSERT
// ==========================================================================
window.executeConfirmPaymentOrder = async function() {
    const SUPABASE_URL = "https://kimbhihdhgmrutmkrdcr.supabase.co";
    const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtpbWJoaWhkaGdtcnV0bWtyZGNyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIwNDA4NjMsImV4cCI6MjA5NzYxNjg2M30.z32S2vJg0071OMpuo-7P0qD-4NoZMsacLv5OeXgKlVo";
    
    const cart = JSON.parse(localStorage.getItem("cart")) || [];
    const returnDate = localStorage.getItem("selectedReturnDate");
    const currentUser = JSON.parse(localStorage.getItem("currentUser")) || null;
    const paymentProofBase64 = document.getElementById("userPaymentProofBase64CachedValue")?.value || "";

    if (!currentUser) {
        alert("🔒 Silakan login terlebih dahulu!");
        return;
    }

    if (cart.length === 0) {
        alert("❌ Keranjang belanja kosong!");
        return;
    }

    if (!returnDate) {
        alert("⚠️ Silakan tentukan tanggal pengembalian barang!");
        return;
    }

    const startDate = localStorage.getItem("selectedStartDate") || new Date().toISOString().split('T')[0];
    const returnDateObj = returnDate ? new Date(returnDate) : new Date();
    const startDateObj = new Date(startDate);
    const duration = Math.max(1, Math.ceil((returnDateObj - startDateObj) / (1000 * 60 * 60 * 24)));
    const perDayTotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
    const totalAmount = perDayTotal * duration;

    try {
        const { createClient } = supabase;
        const supabaseClient = createClient(SUPABASE_URL, SUPABASE_KEY);

        const transactionPayload = {
            user_id: currentUser.id,
            username_customer: currentUser.name || currentUser.username || "Customer",
            amount: totalAmount,
            status: "Menunggu Verifikasi",
            payment_proof: paymentProofBase64,
            date: new Date().toISOString().split('T')[0],
            rental_date: startDate,
            startDate: startDate,
            expectedReturnDate: returnDate,
            duration_days: duration,
            items: JSON.stringify(cart)
        };

        const { data, error } = await supabaseClient
            .from('user_history')
            .insert([transactionPayload])
            .select();

        if (error) {
            console.error("❌ Error inserting to Supabase:", error);
            alert("❌ Gagal menyimpan transaksi ke database. Silakan coba lagi.");
            return;
        }

        console.log("✅ Transaction saved to Supabase:", data);
        alert(`✅ Transaksi Berhasil! Data telah disimpan ke Supabase. Mohon tunggu verifikasi admin.`);

        localStorage.removeItem("cart");
        localStorage.removeItem("selectedReturnDate");

        if (typeof window.renderLiveMysqlUserHistoryCardsGrid === "function") {
            window.renderLiveMysqlUserHistoryCardsGrid();
        }
        if (typeof window.fetchLiveMysqlUserMiniCartSummary === "function") {
            window.fetchLiveMysqlUserMiniCartSummary();
        }

    } catch (err) {
        console.error("❌ Unexpected error:", err);
        alert("❌ Terjadi kesalahan sistem. Silakan coba lagi.");
    }
};