/**
 * ENGINE CATALOG INTERAKTIF PREMIUM MASTER - LANGKAH PENDAKI 2026
 * UTUH, MANDIRI, TERINTEGRASI PENUH (LANGKAH 1 - LANGKAH 13)
 */

// REGISTRASI VARIABEL GLOBAL STATE MANAJEMEN DATA (LIMIT & OFFSET EMULATOR)
let catalogSearchDebounceTimeout = null;
let currentLoadedItemsLimit = 3; 
const itemsPerPageIncrement = 3; 
let isCatalogFetchLoading = false; 

document.addEventListener("DOMContentLoaded", () => {
    // Inject Mock User Session demi menjamin kelancaran pengetesan kueri data wishlist
    if (!localStorage.getItem("currentUser")) {
        localStorage.setItem("currentUser", JSON.stringify({ id: 99, name: "Pendaki Ranger" }));
    }
    
    // Inisialisasi muatan data katalog utama & pasang observer gulir halaman
    initializePremiumCatalogGrid();
    initCatalogInfiniteScrollObserver();
    updateNavigationCartBadgeUi();
    initCatalogStickyNavbarEngine();

    // LANGKAH 2: Mendaftarkan Event Listener Input Pencarian dengan Debounce 300ms
    const searchInput = document.getElementById("catalogSmartSearchInput");
    if (searchInput) {
        searchInput.addEventListener("input", (e) => {
            clearTimeout(catalogSearchDebounceTimeout);
            catalogSearchDebounceTimeout = setTimeout(() => {
                executeCombinedCatalogFilter();
            }, 300);
        });
    }
});

// ==========================================================================
// RENDER UTAMA GRID KATALOG PRODUK (FOTO DI-HIDE SESUAI INSTRUKSI)
// ==========================================================================
function initializePremiumCatalogGrid() {
    const gridContainer = document.getElementById("premiumCardGridContainer");
    const totalBadge = document.getElementById("catalogTotalItemsBadge");

    if (!gridContainer) return;

    // Seeder database lokal representasi struktur tabel 'inventory' MySQL murni
    if (!localStorage.getItem("inventory")) {
        const defaultInventory = [
            { id: 1, name: "Tenda MIS 2p", category: "Tenda", price: 40000, stock: 5, fav_count: 325 },
            { id: 2, name: "Nesting 300D", category: "Gear", price: 30000, stock: 25, fav_count: 184 },
            { id: 3, name: "Sleeping Bag Polar", category: "Gear", price: 15000, stock: 20, fav_count: 92 },
            { id: 4, name: "Tas Carrier Deuter 60L", category: "Carrier", price: 50000, stock: 12, fav_count: 412 },
            { id: 5, name: "Matras Karet Hitam", category: "Gear", price: 5000, stock: 40, fav_count: 56 },
            { id: 6, name: "Tenda Dome Borneo 4P", category: "Tenda", price: 60000, stock: 3, fav_count: 215 }
        ];
        localStorage.setItem("inventory", JSON.stringify(defaultInventory));
    }

    executeCombinedCatalogFilter();
}

// ==========================================================================
// CENTRAL FILTER MATRIX ENGINE (SEARCH + SIDEBAR FILTER + DROPDOWN SORTING)
// ==========================================================================
window.executeCombinedCatalogFilter = function() {
    const gridContainer = document.getElementById("premiumCardGridContainer");
    const matchBadge = document.getElementById("searchMatchCountText");
    const totalBadge = document.getElementById("catalogTotalItemsBadge");
    if (!gridContainer) return;

    const searchInput = document.getElementById("catalogSmartSearchInput");
    const searchQuery = searchInput ? searchInput.value.toLowerCase().trim() : "";
    
    const priceSlider = document.getElementById("filterPriceRange");
    const maxPrice = priceSlider ? parseInt(priceSlider.value) : 60000;

    const checkedBoxes = document.querySelectorAll("input[name='filterCategory']:checked");
    const selectedCategories = Array.from(checkedBoxes).map(cb => cb.value);

    const sortDropdown = document.getElementById("catalogSortDropdown");
    const sortValue = sortDropdown ? sortDropdown.value : "default";

    const products = JSON.parse(localStorage.getItem("inventory")) || [];
    if (totalBadge) totalBadge.textContent = `${products.length} Items Terdisplay`;

    // A. PEMROSESAN KLAUSA WHERE DAN COMBINE FILTER DATA ONLINE
    let filteredResult = products.filter(p => {
        const matchSearch = searchQuery === "" || 
                            (p.name || "").toLowerCase().includes(searchQuery) || 
                            (p.category || "").toLowerCase().includes(searchQuery);
        const matchPrice = (p.price || 0) <= maxPrice;
        const matchCategory = selectedCategories.length === 0 || selectedCategories.includes(p.category);

        return matchSearch && matchPrice && matchCategory;
    });

    // Indikator teks pencarian box
    if (matchBadge) {
        if (searchQuery !== "") {
            matchBadge.textContent = `${filteredResult.length} Cocok`;
            matchBadge.classList.remove("hidden");
        } else {
            matchBadge.classList.add("hidden");
        }
    }

    // B. SEKTOR SORT EVALUATOR MATRIX (Mencerminkan ORDER BY MySQL)
    if (sortValue === "price-asc") {
        filteredResult.sort((a, b) => (a.price || 0) - (b.price || 0));
    } else if (sortValue === "price-desc") {
        filteredResult.sort((a, b) => (b.price || 0) - (a.price || 0));
    } else if (sortValue === "name-asc") {
        filteredResult.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
    } else if (sortValue === "name-desc") {
        filteredResult.sort((a, b) => (b.name || "").localeCompare(a.name || ""));
    } else if (sortValue === "fav-desc") {
        filteredResult.sort((a, b) => (b.fav_count || 0) - (a.fav_count || 0));
    }

    // C. EMPTY STATE VALIDATOR
    if (filteredResult.length === 0) {
        gridContainer.innerHTML = `
            <div class="col-span-full text-center py-16 text-stone-400 font-medium w-full">
                <p class="text-3xl mb-1">🍃</p>
                <p class="text-xs font-bold">Tidak ada alat outdoor yang cocok dengan kriteria Anda.</p>
            </div>`;
        return;
    }

    // D. LIMIT CHUNK PAGINATION SLICE ATAS (Khusus jika filter pasif/default)
    gridContainer.innerHTML = "";
    let finalDisplayChunk = (searchQuery === "" && selectedCategories.length === 0 && maxPrice === 60000)
        ? filteredResult.slice(0, currentLoadedItemsLimit)
        : filteredResult;

    finalDisplayChunk.forEach(p => {
        renderSingleProductCard(gridContainer, p);
    });
};  

// ==========================================================================
// REUSABLE RE-RENDER CARD LAYOUT COMPONENT WITH AUTOMATED BADGE
// ==========================================================================
function renderSingleProductCard(container, p) {
    const productCategory = p.category || "General";
    const favoriteCount = p.fav_count !== undefined ? p.fav_count : 0;
    const productStock = p.stock !== undefined ? p.stock : 0;
    const productPrice = p.price !== undefined ? p.price : 0;

    // LANGKAH 5: EVALUATOR LOGIKA BADGE DINAMIS (SQL CASE WHEN SIMULATOR)
    let dynamicBadgeHtml = "";
    if (favoriteCount >= 300) {
        dynamicBadgeHtml = `<span class="bg-amber-500 text-stone-950 text-[8px] font-extrabold px-1.5 py-0.5 rounded uppercase tracking-wider animate-pulse"><i class="fa-solid fa-fire mr-0.5"></i> Terlaris</span>`;
    } else if (productStock > 0 && productStock <= 5) {
        dynamicBadgeHtml = `<span class="bg-red-500 text-white text-[8px] font-extrabold px-1.5 py-0.5 rounded uppercase tracking-wider"><i class="fa-solid fa-bolt mr-0.5"></i> Cepat Habis</span>`;
    } else if (p.id === 1 || p.id === 2) {
        dynamicBadgeHtml = `<span class="bg-blue-600 text-white text-[8px] font-extrabold px-1.5 py-0.5 rounded uppercase tracking-wider"><i class="fa-solid fa-sparkles mr-0.5"></i> Baru</span>`;
    }

    // LANGKAH 12: ESTIMASI PICKUP COMPONENT LOGIC
    let pickupStatusHtml = productStock > 0 
        ? `<p class="text-[10px] text-green-600 font-bold flex items-center mt-1"><span class="w-1.5 h-1.5 rounded-full bg-green-600 block mr-1.5 animate-pulse"></span>🟢 Bisa diambil hari ini</p>`
        : `<p class="text-[10px] text-red-500 font-bold flex items-center mt-1"><span class="w-1.5 h-1.5 rounded-full bg-red-500 block mr-1.5"></span>🔴 Menunggu re-stock</p>`;

    let stockBadgeHtml = productStock > 0
        ? `<span class="bg-green-100 text-green-700 text-[9px] font-bold px-2 py-0.5 rounded-md">Tersedia ${productStock} Unit</span>`
        : `<span class="bg-red-100 text-red-700 text-[9px] font-bold px-2 py-0.5 rounded-md">Habis Dipesan</span>`;

    container.innerHTML += `
        <div class="bg-white p-4 rounded-xl border border-stone-200/60 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 ease-out flex flex-col justify-between text-xs font-semibold group relative overflow-hidden animate-fade-in" id="card-item-${p.id}">
            
            <div class="flex justify-between items-center mb-3 pb-2 border-b border-stone-100 gap-2">
                <div class="flex gap-1 items-center flex-wrap">
                    <span class="bg-stone-900 text-white px-2 py-0.5 rounded text-[9px] uppercase font-bold tracking-wider">${productCategory}</span>
                    ${dynamicBadgeHtml} 
                </div>
                <button onclick="toggleWishlistAction(${p.id})" class="text-stone-300 hover:text-red-500 transition active:scale-90 shrink-0 p-1">
                    <i class="fa-solid fa-heart text-xs"></i>
                </button>
            </div>

            <div class="space-y-1 text-left flex-1 flex flex-col justify-between mb-3">
                <div class="cursor-pointer" onclick="openQuickViewModal(${p.id})">
                    <h4 class="text-stone-900 font-serif text-sm font-bold truncate hover:text-[#355E3B] transition">${p.name}</h4>
                    <p class="text-green-700 font-bold text-xs mt-0.5">Rp ${productPrice.toLocaleString('id-ID')} <span class="text-stone-400 font-normal text-[10px]">/ hari</span></p>
                </div>
                <div class="pt-1.5 border-t border-stone-100 space-y-0.5 w-full">
                    <div class="text-[10px] text-stone-400 font-medium flex justify-between items-center">
                        <span>❤️ Disukai <strong class="text-stone-700" id="fav-count-${p.id}">${favoriteCount}</strong> orang</span>
                        ${stockBadgeHtml}
                    </div>
                    ${pickupStatusHtml}
                </div>
            </div>

            <div class="grid grid-cols-4 gap-1.5 pt-2 border-t border-stone-100 w-full">
                <button onclick="quickAddCartAction(${p.id})" class="bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold py-1.5 rounded-lg text-center" title="Tambah ke Keranjang"><i class="fa-solid fa-cart-plus text-xs"></i></button>
                <button onclick="executeDirectRentAction(${p.id})" class="col-span-3 bg-[#355E3B] hover:bg-green-800 text-white font-bold py-1.5 rounded-lg text-center text-[11px]">Sewa Sekarang</button>
            </div>
        </div>`;
}

// ==========================================================================
// LANGKAH 3 - RESET UTILITY
// ==========================================================================
window.updatePriceFilterLabel = function(value) {
    const label = document.getElementById("priceRangeLabel");
    if (label) label.textContent = "Rp " + parseInt(value).toLocaleString('id-ID');
};

window.resetAllCatalogFilters = function() {
    const checkboxes = document.querySelectorAll("input[name='filterCategory']");
    const priceSlider = document.getElementById("filterPriceRange");
    const searchInput = document.getElementById("catalogSmartSearchInput");
    const sortDropdown = document.getElementById("catalogSortDropdown");

    checkboxes.forEach(cb => cb.checked = false);
    if (priceSlider) { priceSlider.value = 60000; updatePriceFilterLabel(60000); }
    if (searchInput) searchInput.value = "";
    if (sortDropdown) sortDropdown.value = "default";

    document.getElementById("searchMatchCountText")?.classList.add("hidden");
    initializePremiumCatalogGrid();
};

// ==========================================================================
// LANGKAH 6 - QUICK VIEW MODAL WINDOW CONTROLLER LAYER
// ==========================================================================
window.openQuickViewModal = function(productId) {
    const modal = document.getElementById("catalogQuickViewModal");
    const modalBody = document.getElementById("quickViewModalDynamicBody");
    if (!modal || !modalBody) return;

    modal.classList.remove("opacity-0", "pointer-events-none");
    modal.querySelector(".transform").classList.remove("scale-95");
    modal.querySelector(".transform").classList.add("scale-100");

    modalBody.innerHTML = `
        <div class="space-y-3 animate-pulse">
            <div class="h-4 bg-stone-200 rounded w-1/3"></div>
            <div class="h-6 bg-stone-200 rounded w-3/4"></div>
            <div class="h-3 bg-stone-100 rounded w-1/2"></div>
        </div>`;

    setTimeout(() => {
        const products = JSON.parse(localStorage.getItem("inventory")) || [];
        const target = products.find(p => p.id === parseInt(productId));

        if (!target) {
            modalBody.innerHTML = `<p class="text-stone-500 font-bold text-center py-4">Gagal memuat rincian data spesifikasi.</p>`;
            return;
        }

        let specificationsHtml = target.category === "Tenda" 
            ? "Kapasitas: 2-4 Orang &bull; Double Layer Waterproof &bull; Pasak Alloy" 
            : "Standar Layanan Ekspedisi: Bersih, Wangi, & Lolos 3 Tahap Sterilisasi QC Antiseptik";

        modalBody.innerHTML = `
            <div>
                <span class="bg-[#355E3B] text-white px-2 py-0.5 rounded text-[9px] uppercase font-bold tracking-wider">${target.category}</span>
                <h3 class="font-serif text-lg font-bold text-stone-900 mt-1">${target.name}</h3>
                <p class="text-green-700 font-bold text-sm mt-0.5">Tarif: Rp ${target.price.toLocaleString('id-ID')} / hari</p>
            </div>
            <div class="pt-2 border-t border-stone-100 text-stone-600 font-medium leading-relaxed">
                <h5 class="text-[9px] font-bold text-stone-400 uppercase tracking-wider mb-0.5">Spesifikasi Fisik</h5>
                <p class="text-stone-800">${specificationsHtml}</p>
            </div>
            <div class="bg-stone-50 p-3 rounded-xl border border-stone-200/50">
                <p class="text-stone-800 font-bold">Manajemen Gudang: Sisa ${target.stock} Unit Tersedia</p>
            </div>
            <div class="grid grid-cols-4 gap-2 pt-2 border-t border-stone-100">
                <button onclick="quickAddCartAction(${target.id}); closeQuickViewModalWindow();" class="bg-stone-100 hover:bg-stone-200 py-2 rounded-xl text-center"><i class="fa-solid fa-cart-plus"></i></button>
                <button onclick="executeDirectRentAction(${target.id}); closeQuickViewModalWindow();" class="col-span-3 bg-[#355E3B] hover:bg-green-800 text-white font-bold py-2 rounded-xl text-center">Sewa Instan</button>
            </div>`;
    }, 450); 
};

window.closeQuickViewModalWindow = function() {
    const modal = document.getElementById("catalogQuickViewModal");
    if (!modal) return;
    modal.classList.add("opacity-0", "pointer-events-none");
    modal.querySelector(".transform").classList.remove("scale-100");
    modal.querySelector(".transform").classList.add("scale-95");
};

// ==========================================================================
// LANGKAH 8 & 11 - WISHLIST PERSISTENCE ENGINE MATRIX (❤️ TRANSACTION)
// ==========================================================================
window.toggleWishlistAction = function(productId) {
    const activeUser = JSON.parse(localStorage.getItem("currentUser")) || null;
    if (!activeUser) {
        alert("🔒 AKUN DIPERLUKAN\nSilakan masuk (login) terlebih dahulu untuk mengisi wishlist!");
        window.location.href = "../auth/login.html";
        return;
    }

    if (!localStorage.getItem("wishlist_db")) localStorage.setItem("wishlist_db", JSON.stringify([]));

    let wishlistDb = JSON.parse(localStorage.getItem("wishlist_db")) || [];
    let inventoryDb = JSON.parse(localStorage.getItem("inventory")) || [];

    const pId = parseInt(productId);
    const existingIndex = wishlistDb.findIndex(w => w.user_id === activeUser.id && w.product_id === pId);
    const targetProduct = inventoryDb.find(p => p.id === pId);
    const favCounterEl = document.getElementById(`fav-count-${pId}`);

    if (existingIndex > -1) {
        wishlistDb.splice(existingIndex, 1);
        if (targetProduct && targetProduct.fav_count > 0) targetProduct.fav_count--;
        alert(`💔 Unit dihapus dari daftar wishlist.`);
    } else {
        wishlistDb.push({ id: Date.now(), user_id: activeUser.id, product_id: pId });
        if (targetProduct) targetProduct.fav_count++;
        alert(`❤️ Sukses ditambahkan ke daftar wishlist!`);
    }

    if (favCounterEl && targetProduct) favCounterEl.textContent = targetProduct.fav_count;

    localStorage.setItem("wishlist_db", JSON.stringify(wishlistDb));
    localStorage.setItem("inventory", JSON.stringify(inventoryDb));
};

// ==========================================================================
// LANGKAH 9 - INFINITE SCROLL WITH INTERSECTION OBSERVER API
// ==========================================================================
function initCatalogInfiniteScrollObserver() {
    const anchor = document.getElementById("infiniteScrollTriggerAnchor");
    const loaderUi = document.getElementById("infiniteScrollLoaderUi");
    const gridContainer = document.getElementById("premiumCardGridContainer");

    if (!anchor || !gridContainer) return;

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting && !isCatalogFetchLoading) {
                const products = JSON.parse(localStorage.getItem("inventory")) || [];
                
                if (currentLoadedItemsLimit >= products.length) {
                    if (loaderUi) loaderUi.classList.add("hidden");
                    return;
                }

                isCatalogFetchLoading = true;
                if (loaderUi) loaderUi.classList.remove("hidden");

                setTimeout(() => {
                    const currentOffsetStart = currentLoadedItemsLimit;
                    currentLoadedItemsLimit += itemsPerPageIncrement;

                    const nextChunk = products.slice(currentOffsetStart, currentLoadedItemsLimit);
                    nextChunk.forEach(p => {
                        renderSingleProductCard(gridContainer, p);
                    });

                    isCatalogFetchLoading = false;
                    if (loaderUi) loaderUi.classList.add("hidden");
                }, 700);
            }
        });
    }, { threshold: 0.1 });
    observer.observe(anchor);
}

// ==========================================================================
// LANGKAH 10 - QUICK ADD CART ENGINE
// ==========================================================================
window.quickAddCartAction = function(productId) {
    const activeUser = JSON.parse(localStorage.getItem("currentUser")) || null;
    if (!activeUser) {
        alert("🔒 AKSES TERKUNCI\nSilakan lakukan login akun terlebih dahulu!");
        return;
    }

    if (!localStorage.getItem("cart")) localStorage.setItem("cart", JSON.stringify([]));
    let cart = JSON.parse(localStorage.getItem("cart")) || [];
    const inventoryDb = JSON.parse(localStorage.getItem("inventory")) || [];
    
    const pId = parseInt(productId);
    const targetProduct = inventoryDb.find(p => p.id === pId);

    if (!targetProduct || targetProduct.stock <= 0) {
        alert("❌ STOK KOSONG / KENDALA SYNC.");
        return;
    }

    const existingItem = cart.find(item => item.id === pId);
    if (existingItem) {
        if (existingItem.qty >= targetProduct.stock) return;
        existingItem.qty++;
    } else {
        cart.push({ 
            id: targetProduct.id, 
            name: targetProduct.name, 
            price: targetProduct.price, 
            qty: 1, 
            image: targetProduct.image || '' 
        });
    }

    localStorage.setItem("cart", JSON.stringify(cart));
    updateNavigationCartBadgeUi();

    const badge = document.getElementById("navCartItemsCounterBadge");
    if (badge) {
        badge.classList.remove("scale-100");
        badge.classList.add("scale-125", "bg-green-500", "text-white");
        setTimeout(() => {
            badge.classList.remove("scale-125", "bg-green-500", "text-white");
            badge.classList.add("scale-100");
        }, 300);
    }
};

function updateNavigationCartBadgeUi() {
    const badge = document.getElementById("navCartItemsCounterBadge");
    if (!badge) return;

    const cart = JSON.parse(localStorage.getItem("cart")) || [];
    const totalCount = cart.reduce((sum, item) => sum + item.qty, 0);
    badge.textContent = totalCount;
}

// ==========================================================================
// LANGKAH 13 - STICKY GLASSMORPHISM NAVBAR LISTENER
// ==========================================================================
function initCatalogStickyNavbarEngine() {
    const navbar = document.getElementById("smartNavbar");
    if (!navbar) return;

    window.addEventListener("scroll", () => {
        if (window.scrollY > 40) {
            navbar.classList.remove("bg-white/70", "text-stone-900", "py-4", "border-b", "border-stone-200/40");
            navbar.classList.add("bg-[#355E3B]", "text-white", "py-3", "shadow-xl");
        } else {
            navbar.classList.remove("bg-[#355E3B]", "text-white", "py-3", "shadow-xl");
            navbar.classList.add("bg-white/70", "text-stone-900", "py-4", "border-b", "border-stone-200/40");
        }
    });
}

window.executeDirectRentAction = function(id) { alert(`Membuka form administrasi penyewaan barang ID: ${id}.`); };