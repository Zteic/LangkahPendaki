console.log("✅ user-dashboard.js loaded");

const SUPABASE_URL = "https://kimbhihdhgmrutmkrdcr.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtpbWJoaWhkaGdtcnV0bWtyZGNyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIwNDA4NjMsImV4cCI6MjA5NzYxNjg2M30.z32S2vJg0071OMpuo-7P0qD-4NoZMsacLv5OeXgKlVo";

if (typeof supabase === 'undefined') {
    console.error("❌ Supabase SDK not loaded! Check CDN script.");
} else {
    console.log("✅ Supabase SDK detected");
}

const { createClient } = supabase;
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_KEY);
console.log("✅ Supabase client initialized");

// ✅ GLOBAL FALLBACK GAMBAR: Tangani semua <img> yang gagal load
(function() {
    const FALLBACK_SVG = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="300" height="200"%3E%3Crect fill="%23f3f4f6" width="300" height="200"/%3E%3Ctext fill="%239ca3af" font-family="Arial" font-size="12" x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle"%3EGambar Tidak Tersedia%3C/text%3E%3C/svg%3E';
    window.addEventListener('error', function(e) {
        if (e.target && e.target.tagName === 'IMG' && !e.target.src.startsWith('data:image')) {
            e.target.onerror = null;
            e.target.src = FALLBACK_SVG;
        }
    }, true);
})();

let currentUserCategoryFilter = "Semua";
let currentPriceFilter = "all";
let currentSort = "default";
let currentSearchTerm = "";
let allInventoryData = [];
let selectedProductId = null;

// ✅ HELPER FUNCTION: Safe JSONB Items Parser
function safeParseItems(items) {
    try {
        let rawItems = typeof items === 'string' ? JSON.parse(items) : items;
        let itemsArray = Array.isArray(rawItems) ? rawItems : (rawItems?.items || []);
        return Array.isArray(itemsArray) ? itemsArray : [];
    } catch (e) {
        console.error("Error parsing items:", e);
        return [];
    }
}

// ✅ HELPER FUNCTION: Resolve Image Path for GitHub Pages
function resolveImagePath(imagePath) {
    if (!imagePath || typeof imagePath !== 'string' || imagePath.trim() === '') {
        return 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="300" height="200"%3E%3Crect fill="%23f3f4f6" width="300" height="200"/%3E%3Ctext fill="%239ca3af" font-family="Arial" font-size="14" x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle"%3ENo Image%3C/text%3E%3C/svg%3E';
    }
    
    let imgPath = imagePath.trim();
    
    // ✅ PRIORITAS PERTAMA: Base64 - langsung return tanpa modifikasi
    if (imgPath.startsWith('data:image')) return imgPath;
    
    // ✅ PRIORITAS KEDUA: URL absolut (http/https)
    if (imgPath.startsWith('http://') || imgPath.startsWith('https://')) return imgPath;
    
    // ✅ PRIORITAS KETIGA: Relative path yang sudah benar
    if (imgPath.startsWith('../')) return imgPath;
    
    // ✅ PRIORITAS KEEMPAT: Path 'public/' -> tambahkan '../'
    if (imgPath.startsWith('public/')) return '../' + imgPath;
    
    // ✅ PRIORITAS KELIMA: Path 'dashboard/public/' -> perbaiki
    if (imgPath.startsWith('dashboard/public/')) return imgPath.replace('dashboard/public/', '../public/');
    
    // ✅ PRIORITAS KEENAM: Absolute path '/' -> tambahkan '..'
    if (imgPath.startsWith('/')) return '..' + imgPath;
    
    // ✅ PRIORITAS TERAKHIR: fallback dengan prefix '../'
    return '../' + imgPath;
}

// ✅ HELPER FUNCTION: Check if status is "Active Rental"
function isActiveRentalStatus(status) {
    const activeStatuses = ['Pembayaran Diterima', 'Diproses', 'Sedang Aktif', 'Terlambat'];
    return activeStatuses.includes(status);
}

// ✅ HELPER FUNCTION: Inline SVG fallback untuk gambar gagal load
function safeImageOnError(imgElement) {
    if (imgElement) {
        imgElement.onerror = null;
        imgElement.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="300" height="200"%3E%3Crect fill="%23f3f4f6" width="300" height="200"/%3E%3Ctext fill="%239ca3af" font-family="Arial" font-size="12" x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle"%3EGambar Tidak Tersedia%3C/text%3E%3C/svg%3E';
    }
}

const menuItems = document.querySelectorAll(".menu-item");
const pages = document.querySelectorAll(".page");

menuItems.forEach(item => {
    item.addEventListener("click", () => {
        menuItems.forEach(i => i.classList.remove("active"));
        item.classList.add("active");
        pages.forEach(p => p.style.display = "none");
        const target = document.getElementById(item.dataset.page);
        if (target) target.style.display = "block";
        if (item.dataset.page === "history") loadHistory();
        if (item.dataset.page === "inventory") loadUserInventory();
    });
});

async function loadUserInventory() {
    const { data, error } = await supabaseClient.from('inventory').select('*');
    if (error) {
        console.error("Gagal mengambil data katalog:", error.message);
    } else {
        allInventoryData = data || [];
        renderProducts();
    }
}

function renderProducts() {
    let filteredData = [...allInventoryData];
    if (currentUserCategoryFilter !== "Semua") {
        filteredData = filteredData.filter(item => item.category === currentUserCategoryFilter);
    }
    if (currentPriceFilter === "low") {
        filteredData = filteredData.filter(item => item.price < 25000);
    } else if (currentPriceFilter === "medium") {
        filteredData = filteredData.filter(item => item.price >= 25000 && item.price <= 50000);
    } else if (currentPriceFilter === "high") {
        filteredData = filteredData.filter(item => item.price > 50000);
    }
    if (currentSearchTerm) {
        filteredData = filteredData.filter(item => item.name.toLowerCase().includes(currentSearchTerm.toLowerCase()));
    }
    if (currentSort === "price-asc") {
        filteredData.sort((a, b) => a.price - b.price);
    } else if (currentSort === "price-desc") {
        filteredData.sort((a, b) => b.price - a.price);
    } else if (currentSort === "name-asc") {
        filteredData.sort((a, b) => a.name.localeCompare(b.name));
    } else if (currentSort === "stock-desc") {
        filteredData.sort((a, b) => b.stock - a.stock);
    }
    const list = document.getElementById("itemList");
    if (!list) return;
    list.innerHTML = "";
    if (filteredData.length === 0) {
        list.innerHTML = `<div class="empty-state">Tidak ada produk yang sesuai dengan filter Anda.</div>`;
        return;
    }
    filteredData.forEach(item => {
        let badgeClass = "product-category";
        if (item.category === "Tenda") badgeClass += " tenda";
        else if (item.category === "Carrier") badgeClass += " carrier";
        
        const finalImageUrl = resolveImagePath(item.image);
        
        const card = document.createElement("div");
        card.className = "product-card";
        card.innerHTML = `
            <img src="${finalImageUrl}" 
                 alt="${item.name}" 
                 class="product-card-image" 
                 onerror="this.onerror=null; this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22300%22 height=%22200%22%3E%3Crect fill=%22%23f3f4f6%22 width=%22300%22 height=%22200%22/%3E%3Ctext fill=%22%239ca3af%22 font-family=%22Arial%22 font-size=%2214%22 x=%2250%25%22 y=%2250%25%22 dominant-baseline=%22middle%22 text-anchor=%22middle%22%3EGambar Tidak Tersedia%3C/text%3E%3C/svg%3E';">
            <div class="product-card-body">
                <span class="${badgeClass}">${item.category || 'Lainnya'}</span>
                <h3>${item.name}</h3>
                <div class="product-card-stock">Stok: ${item.stock} unit</div>
                <div class="product-card-footer">
                    <div class="product-price">Rp ${item.price.toLocaleString()}<span>/hari</span></div>
                    <button onclick="openProductModal(${item.id})" class="btn-view">Detail</button>
                </div>
            </div>
        `;
        list.appendChild(card);
    });
}

window.openProductModal = function(id) {
    selectedProductId = id;
    const product = allInventoryData.find(i => i.id === id);
    if (!product) return;
    
    const modalImageDisplay = resolveImagePath(product.image);
    
    const modalImg = document.getElementById("modalProductImage");
    if (modalImg) {
        modalImg.src = modalImageDisplay;
        modalImg.onerror = function() { safeImageOnError(this); };
    }
    
    document.getElementById("modalProductName").textContent = product.name;
    document.getElementById("modalProductPrice").textContent = "Rp " + product.price.toLocaleString();
    document.getElementById("modalProductStock").textContent = product.stock;
    let badgeClass = "product-category";
    if (product.category === "Tenda") badgeClass += " tenda";
    else if (product.category === "Carrier") badgeClass += " carrier";
    const categoryBadge = document.getElementById("modalProductCategory");
    if (categoryBadge) {
        categoryBadge.textContent = product.category || 'Lainnya';
        categoryBadge.className = badgeClass;
    }
    document.getElementById("productModal").style.display = "flex";
};

window.closeProductModal = function() {
    document.getElementById("productModal").style.display = "none";
    selectedProductId = null;
};

window.addToCartFromModal = function() {
    if (selectedProductId) {
        addToCart(selectedProductId);
        closeProductModal();
    }
};

window.addToCart = async function(id) {
    const product = allInventoryData.find(i => i.id === id);
    if (product && product.stock > 0) {
        let cart = JSON.parse(localStorage.getItem("cart")) || [];
        const existIdx = cart.findIndex(c => c.id === id);
        if (existIdx !== -1) {
            cart[existIdx].qty += 1;
        } else {
            cart.push({ id: product.id, name: product.name, price: product.price, qty: 1 });
        }
        localStorage.setItem("cart", JSON.stringify(cart));
        updateCartUI();
        showCartToast(product.name + " ditambahkan ke keranjang!");
    } else {
        showCartToast("Maaf, stok barang habis.", true);
    }
};

function showCartToast(message, isError) {
    const toast = document.createElement("div");
    toast.style.cssText = "position:fixed; top:90px; right:24px; background:" + (isError ? "#FEF2F2" : "#ECFDF5") + "; border:1px solid " + (isError ? "#FECACA" : "#A7F3D0") + "; color:" + (isError ? "#991B1B" : "#065F46") + "; padding:14px 20px; border-radius:14px; font-size:14px; font-weight:600; z-index:99999; box-shadow:0 8px 24px rgba(0,0,0,0.12); transform:translateX(120%); transition:transform 0.3s cubic-bezier(0.4,0,0.2,1); display:flex; align-items:center; gap:10px; max-width:340px; font-family:'Poppins',sans-serif;";
    toast.innerHTML = "<span style='font-size:18px;'>" + (isError ? "❌" : "✅") + "</span><span>" + message + "</span>";
    document.body.appendChild(toast);
    requestAnimationFrame(() => { toast.style.transform = "translateX(0)"; });
    setTimeout(() => {
        toast.style.transform = "translateX(120%)";
        setTimeout(() => toast.remove(), 300);
    }, 2500);
}

function updateCartUI() {
    const cart = JSON.parse(localStorage.getItem("cart")) || [];
    const cartCount = document.getElementById("cart-count");
    if (cartCount) cartCount.textContent = cart.reduce((sum, item) => sum + item.qty, 0);

    const cartList = document.getElementById("cartItemsList");
    const emptyState = document.getElementById("cartEmptyState");
    const bottomSection = document.getElementById("cartBottomSection");
    const itemCountEl = document.getElementById("cartItemCount");

    if (itemCountEl) {
        const totalItems = cart.reduce((s, i) => s + i.qty, 0);
        itemCountEl.textContent = totalItems + " Item Dipilih";
    }

    if (cart.length === 0) {
        if (cartList) cartList.style.display = "none";
        if (emptyState) emptyState.style.display = "block";
        if (bottomSection) bottomSection.style.display = "none";
        if (document.getElementById("cartTotalDisplay")) document.getElementById("cartTotalDisplay").textContent = "Rp 0";
        return;
    }

    if (cartList) cartList.style.display = "block";
    if (emptyState) emptyState.style.display = "none";
    if (bottomSection) bottomSection.style.display = "block";

    cartList.innerHTML = cart.map((item, index) => {
        const invItem = allInventoryData.find(i => i.id === item.id);
        const imgSrc = resolveImagePath(invItem?.image);
        const category = (invItem && invItem.category) ? invItem.category : "Outdoor";
        const catColors = { "Tenda": "#3B82F6", "Carrier": "#F59E0B", "Gear": "#10B981", "Peripherals": "#8B5CF6" };
        const catColor = catColors[category] || "#6B7280";

        return `
            <div class="cart-drawer-item" style="background:white; border-radius:16px; padding:16px; margin-bottom:12px; border:1px solid #F3F4F6; transition:all 0.3s; display:flex; gap:14px;">
                <img src="${imgSrc}" alt="${item.name}" style="width:80px; height:80px; object-fit:cover; border-radius:12px; flex-shrink:0; border:1px solid #F3F4F6;">
                <div style="flex:1; min-width:0;">
                    <div style="display:flex; justify-content:space-between; align-items:start; margin-bottom:4px;">
                        <div style="min-width:0;">
                            <h4 style="font-size:14px; font-weight:700; color:#1F2937; margin-bottom:2px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${item.name}</h4>
                            <span style="display:inline-block; padding:2px 8px; border-radius:4px; font-size:10px; font-weight:700; background:${catColor}15; color:${catColor};">${category}</span>
                        </div>
                        <button onclick="removeFromCart(${index})" style="width:28px; height:28px; border-radius:8px; border:none; background:#FEF2F2; color:#EF4444; cursor:pointer; font-size:14px; flex-shrink:0; display:flex; align-items:center; justify-content:center;">🗑️</button>
                    </div>
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-top:10px;">
                        <div style="display:flex; align-items:center; gap:0; background:#F3F4F6; border-radius:10px; overflow:hidden;">
                            <button onclick="changeQty(${index}, -1)" style="width:34px; height:34px; border:none; background:transparent; cursor:pointer; font-size:16px; font-weight:700; color:#6B7280;">−</button>
                            <span style="width:36px; text-align:center; font-size:14px; font-weight:700; color:#1F2937;">${item.qty}</span>
                            <button onclick="changeQty(${index}, 1)" style="width:34px; height:34px; border:none; background:transparent; cursor:pointer; font-size:16px; font-weight:700; color:#355E3B;">+</button>
                        </div>
                        <span style="font-size:15px; font-weight:700; color:#1F2937;">Rp ${(item.price * item.qty).toLocaleString()}</span>
                    </div>
                    <div style="font-size:11px; color:#9CA3AF; margin-top:4px;">Rp ${item.price.toLocaleString()}/hari</div>
                </div>
            </div>`;
    }).join("");

    const subtotal = cart.reduce((t, item) => t + (item.price * item.qty), 0);
    const subEl = document.getElementById("cartSubtotal");
    const totalEl = document.getElementById("cartTotalDisplay");
    if (subEl) subEl.textContent = "Rp " + subtotal.toLocaleString();
    if (totalEl) totalEl.textContent = "Rp " + subtotal.toLocaleString();
    updateDuration();
}

window.changeQty = function(index, delta) {
    let cart = JSON.parse(localStorage.getItem("cart")) || [];
    if (cart[index]) {
        cart[index].qty = Math.max(1, cart[index].qty + delta);
        localStorage.setItem("cart", JSON.stringify(cart));
        updateCartUI();
    }
};

window.removeFromCart = function(index) {
    let cart = JSON.parse(localStorage.getItem("cart")) || [];
    cart.splice(index, 1);
    localStorage.setItem("cart", JSON.stringify(cart));
    updateCartUI();
};

window.openCart = function() {
    const drawer = document.getElementById("cartDrawer");
    const backdrop = document.getElementById("cartBackdrop");
    const panel = document.getElementById("cartPanel");
    if (!drawer) return;
    drawer.style.display = "block";
    requestAnimationFrame(() => {
        if (backdrop) backdrop.style.opacity = "1";
        if (panel) panel.style.transform = "translateX(0)";
    });
    document.body.style.overflow = "hidden";
    updateCartUI();
};

window.closeCart = function() {
    const drawer = document.getElementById("cartDrawer");
    const backdrop = document.getElementById("cartBackdrop");
    const panel = document.getElementById("cartPanel");
    if (backdrop) backdrop.style.opacity = "0";
    if (panel) panel.style.transform = "translateX(100%)";
    setTimeout(() => { if (drawer) drawer.style.display = "none"; }, 350);
    document.body.style.overflow = "";
};

function updateDuration() {
    const start = document.getElementById("startDateInput")?.value;
    const end = document.getElementById("returnDateInput")?.value;
    const durationEl = document.getElementById("cartDuration");
    if (start && end && durationEl) {
        const s = new Date(start);
        const e = new Date(end);
        const diff = Math.max(1, Math.ceil((e - s) / (1000 * 60 * 60 * 24)));
        durationEl.textContent = diff + " Hari";
    } else if (durationEl) {
        durationEl.textContent = "Pilih tanggal";
    }
}

window.proceedToCheckout = function() {
    const cart = JSON.parse(localStorage.getItem("cart")) || [];
    const startDate = document.getElementById("startDateInput")?.value;
    const returnDate = document.getElementById("returnDateInput")?.value;
    if (cart.length === 0) return alert("Keranjang masih kosong!");
    if (!startDate) return alert("Silakan pilih tanggal mulai sewa!");
    if (!returnDate) return alert("Silakan pilih tanggal pengembalian!");
    if (new Date(returnDate) <= new Date(startDate)) return alert("Tanggal kembali harus setelah tanggal mulai!");
    localStorage.setItem("selectedStartDate", startDate);
    localStorage.setItem("selectedReturnDate", returnDate);
    closeCart();
    const payMenu = document.querySelector('[data-page="payments"]');
    if (payMenu) payMenu.click();
    updatePaymentDetails();
};

document.addEventListener("DOMContentLoaded", async () => {
    const startInput = document.getElementById("startDateInput");
    const returnInput = document.getElementById("returnDateInput");
    if (startInput) startInput.addEventListener("change", () => { updateDuration(); updateCartUI(); });
    if (returnInput) returnInput.addEventListener("change", () => { updateDuration(); updateCartUI(); });

    const userTabBtns = document.querySelectorAll("#userInventoryTabs .tab-btn");
    userTabBtns.forEach(btn => {
        btn.addEventListener("click", (e) => {
            userTabBtns.forEach(b => b.classList.remove("active"));
            e.target.classList.add("active");
            currentUserCategoryFilter = e.target.dataset.filter;
            renderProducts();
        });
    });
    
    const searchInput = document.getElementById("searchInput");
    if (searchInput) {
        searchInput.addEventListener("input", (e) => {
            currentSearchTerm = e.target.value;
            renderProducts();
        });
    }
    
    const priceFilter = document.getElementById("priceFilter");
    if (priceFilter) {
        priceFilter.addEventListener("change", (e) => {
            currentPriceFilter = e.target.value;
            renderProducts();
        });
    }
    
    const sortFilter = document.getElementById("sortFilter");
    if (sortFilter) {
        sortFilter.addEventListener("change", (e) => {
            currentSort = e.target.value;
            renderProducts();
        });
    }
    
    await loadUserInventory(); 
    updateCartUI(); 
    updatePaymentDetails();
    setInterval(checkStatus, 2000);
});

function updatePaymentDetails() {
    const cart = JSON.parse(localStorage.getItem("cart")) || [];
    const returnDate = localStorage.getItem("selectedReturnDate");
    const transaction = JSON.parse(localStorage.getItem("currentTransaction"));
    const total = cart.reduce((t, item) => t + (item.price * item.qty), 0);

    const grid = document.getElementById("paymentGrid");
    const empty = document.getElementById("paymentEmptyState");
    if (!grid || !empty) return;

    if (cart.length === 0 && !transaction) {
        grid.style.display = "none";
        empty.style.display = "block";
        if (document.getElementById("paymentStatusBanner")) document.getElementById("paymentStatusBanner").style.display = "none";
        return;
    }

    grid.style.display = "grid";
    empty.style.display = "none";

    const statusBanner = document.getElementById("paymentStatusBanner");
    const statusBox = document.getElementById("paymentStatusBox");
    const statusIcon = document.getElementById("paymentStatusIcon");
    const statusText = document.getElementById("paymentStatusText");
    
    if (transaction && statusBanner && statusBox) {
        statusBanner.style.display = "block";
        const statusMap = {
            "Menunggu Verifikasi": { bg: "#FFFBEB", border: "#FDE68A", color: "#92400E", icon: "🟠" },
            "Pembayaran Diterima": { bg: "#ECFDF5", border: "#A7F3D0", color: "#065F46", icon: "🟢" },
            "Dibatalkan": { bg: "#FEF2F2", border: "#FECACA", color: "#991B1B", icon: "🔴" }
        };
        const st = statusMap[transaction.status] || { bg: "#F3F4F6", border: "#E5E7EB", color: "#6B7280", icon: "⏳" };
        statusBox.style.background = st.bg;
        statusBox.style.border = "1px solid " + st.border;
        statusBox.style.color = st.color;
        if (statusIcon) statusIcon.textContent = st.icon;
        if (statusText) statusText.textContent = transaction.status;
    } else if (statusBanner && statusBox) {
        statusBanner.style.display = "block";
        statusBox.style.background = "#FEF9C3";
        statusBox.style.border = "1px solid #FDE68A";
        statusBox.style.color = "#92400E";
        if (statusIcon) statusIcon.textContent = "🟡";
        if (statusText) statusText.textContent = "Menunggu Pembayaran";
    }

    const orderItems = document.getElementById("paymentOrderItems");
    if (orderItems && cart.length > 0) {
        orderItems.innerHTML = cart.map(item => `
            <div style="display:flex; align-items:center; gap:14px; padding:16px 0; border-bottom:1px solid #F3F4F6;">
                <div style="width:44px; height:44px; border-radius:12px; background:#F0FDF4; display:flex; align-items:center; justify-content:center; font-size:20px; flex-shrink:0;">📦</div>
                <div style="flex:1;">
                    <p style="font-size:14px; font-weight:600; color:#1F2937; margin-bottom:2px;">${item.name}</p>
                    <p style="font-size:12px; color:#9CA3AF;">${item.qty}x × Rp ${item.price.toLocaleString()}/hari</p>
                </div>
                <span style="font-size:14px; font-weight:700; color:#1F2937;">Rp ${(item.price * item.qty).toLocaleString()}</span>
            </div>
        `).join("");
    }

    const today = new Date().toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
    if (document.getElementById("paymentRentDate")) document.getElementById("paymentRentDate").textContent = today;
    if (document.getElementById("paymentReturnDate")) document.getElementById("paymentReturnDate").textContent = returnDate || "-";
    
    const durationEl = document.getElementById("paymentDuration");
    if (durationEl) {
        if (returnDate) {
            const start = new Date();
            const end = new Date(returnDate);
            const diff = Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60 * 24)));
            durationEl.textContent = diff + " Hari";
        } else {
            durationEl.textContent = "-";
        }
    }

    if (document.getElementById("paymentSubtotal")) document.getElementById("paymentSubtotal").textContent = "Rp " + total.toLocaleString();
    if (document.getElementById("paymentGrandTotal")) document.getElementById("paymentGrandTotal").textContent = "Rp " + total.toLocaleString();

    renderPaymentProgress(transaction);
    updateCountdown(transaction);

    const uploadSection = document.getElementById("uploadSection");
    if (transaction && (transaction.status === "Pembayaran Diterima" || transaction.status === "Dibatalkan")) {
        if (uploadSection) uploadSection.style.display = "none";
    } else if (uploadSection) {
        uploadSection.style.display = "block";
    }
}

function renderPaymentProgress(transaction) {
    const container = document.getElementById("paymentProgressSteps");
    if (!container) return;

    const steps = [
        { label: "Pesanan Dibuat", done: true },
        { label: "Pembayaran", done: transaction ? true : false },
        { label: "Verifikasi Admin", done: transaction && transaction.status !== "Menunggu Verifikasi" },
        { label: "Sewa Aktif", done: transaction && transaction.status === "Pembayaran Diterima" },
        { label: "Selesai", done: false }
    ];

    const currentStep = transaction ? (transaction.status === "Pembayaran Diterima" ? 3 : transaction.status === "Menunggu Verifikasi" ? 2 : 1) : 1;

    container.innerHTML = steps.map((step, i) => {
        const isActive = i <= currentStep;
        const isCurrent = i === currentStep;
        return `
            <div style="display:flex; gap:14px; align-items:flex-start; ${i < steps.length - 1 ? 'padding-bottom:16px;' : ''}">
                <div style="width:32px; height:32px; border-radius:50%; ${isActive ? 'background:#355E3B; color:white;' : 'background:#F3F4F6; color:#D1D5DB;'} display:flex; align-items:center; justify-content:center; font-size:13px; font-weight:700; flex-shrink:0; ${isCurrent ? 'box-shadow:0 0 0 4px #E8F5E9;' : ''}">${step.done ? '✓' : i + 1}</div>
                <div style="flex:1;">
                    <p style="font-size:14px; font-weight:${isCurrent ? '700' : '500'}; color:${isActive ? '#1F2937' : '#9CA3AF'};">${step.label}</p>
                    ${isCurrent ? '<p style="font-size:11px; color:#355E3B; font-weight:600; margin-top:2px;">Saat ini</p>' : ''}
                </div>
            </div>`;
    }).join("");
}

let countdownInterval = null;
function updateCountdown(transaction) {
    if (countdownInterval) clearInterval(countdownInterval);
    const card = document.getElementById("paymentCountdownCard");
    const el = document.getElementById("paymentCountdown");
    if (!card || !el) return;

    if (!transaction || transaction.status === "Menunggu Verifikasi" || transaction.status === "Pembayaran Diterima") {
        card.style.display = "none";
        return;
    }

    card.style.display = "block";

    let totalSeconds = 24 * 60 * 60 - 1;
    function tick() {
        const h = String(Math.floor(totalSeconds / 3600)).padStart(2, "0");
        const m = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, "0");
        const s = String(totalSeconds % 60).padStart(2, "0");
        el.textContent = h + ":" + m + ":" + s;
        if (totalSeconds <= 0) {
            clearInterval(countdownInterval);
            el.textContent = "00:00:00";
            el.style.color = "#9CA3AF";
        }
        totalSeconds--;
    }
    tick();
    countdownInterval = setInterval(tick, 1000);
}

window.copyVA = function() {
    const va = document.getElementById("virtualAccountNumber")?.textContent.replace(/\s/g, "");
    if (!va) return;
    navigator.clipboard.writeText(va).then(() => {
        const success = document.getElementById("copySuccess");
        const btn = document.getElementById("copyVABtn");
        if (success) { success.style.display = "block"; setTimeout(() => { success.style.display = "none"; }, 2500); }
        if (btn) { btn.textContent = "✓ Tersalin"; setTimeout(() => { btn.textContent = "📋 Salin"; }, 2500); }
    });
};

window.resetProofUpload = function() {
    const input = document.getElementById("proofInput");
    if (input) input.value = "";
};

const proofInput = document.getElementById("proofInput");
if (proofInput) {
    proofInput.addEventListener("change", function(e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = async function(event) {
                const imageData = event.target.result;
                const cart = JSON.parse(localStorage.getItem("cart")) || [];
                const returnDate = localStorage.getItem("selectedReturnDate");
                
                const transaction = {
                    username_customer: localStorage.getItem("loggedInUser") || "Customer",
                    amount: cart.reduce((t, item) => t + (item.price * item.qty), 0),
                    status: "Menunggu Verifikasi",
                    payment_proof: imageData,
                    rental_date: new Date().toISOString(),
                    return_date: returnDate,
                    items: cart,
                    date: new Date().toLocaleDateString('id-ID'),
                    user: localStorage.getItem("loggedInUser") || "Customer"
                };

                const { error } = await supabaseClient
                    .from('user_history')
                    .insert([transaction]);

                if (error) {
                    alert("Gagal mengirim pesanan ke server: " + error.message);
                } else {
                    localStorage.setItem("currentTransaction", JSON.stringify(transaction));
                    updatePaymentDetails();
                    alert("Bukti berhasil diunggah! Admin akan segera memverifikasi.");
                }
            };
            reader.readAsDataURL(file);
        }
    });
}

async function loadHistory() {
    const loggedInUser = localStorage.getItem("loggedInUser") || "Customer";
    try {
        const { data, error } = await supabaseClient
            .from('user_history')
            .select('*')
            .eq('username_customer', loggedInUser);

        const list = document.getElementById("historyList");
        if(!list) return;
        list.innerHTML = "";

        if (error) {
            list.innerHTML = '<div class="empty-state">Gagal memuat riwayat transaksi.</div>';
            return;
        }

        if (!data || data.length === 0) {
            list.innerHTML = '<div class="empty-state">Belum ada riwayat transaksi.</div>';
            return;
        }

        data.slice().reverse().forEach(item => {
            let statusClass = "status-badge pending";
            if(item.status === "Pembayaran Diterima" || item.status === "Selesai") {
                statusClass = "status-badge success";
            }
            
            let itemsHTML = "-";
            try {
                let itemsArray = safeParseItems(item.items);
                if (itemsArray.length > 0) {
                    itemsHTML = itemsArray.map(prod => `${prod.name || 'Produk'} (${prod.qty || 1}x)`).join(', ');
                }
            } catch (e) {
                itemsHTML = "Data tidak valid";
            }
            
            const historyItem = document.createElement("div");
            historyItem.className = "history-item";
            historyItem.innerHTML = `
                <h4>${item.date || 'Tanggal tidak tersedia'}</h4>
                <p>Total: Rp ${(item.amount || 0).toLocaleString()}</p>
                <p>Barang: ${itemsHTML}</p>
                <span class="${statusClass}" style="margin-top: 8px;">${item.status || 'Status tidak diketahui'}</span>
            `;
            list.appendChild(historyItem);
        });
    } catch (error) {
        console.error("Fatal error in loadHistory:", error);
    }
}

window.openImageModal = function(src) {
    const modal = document.getElementById("imageModal");
    const modalImg = document.getElementById("fullSizeImage");
    if(modal && modalImg) {
        modal.style.display = "flex";
        modalImg.src = src;
    }
};

window.closeImageModal = function() {
    const modal = document.getElementById("imageModal");
    if(modal) modal.style.display = "none";
};

function checkStatus() {
    const transaction = JSON.parse(localStorage.getItem("currentTransaction"));
    if (!transaction) return;

    const statusBanner = document.getElementById("paymentStatusBanner");
    const statusBox = document.getElementById("paymentStatusBox");
    const statusIcon = document.getElementById("paymentStatusIcon");
    const statusText = document.getElementById("paymentStatusText");

    if (statusBanner && statusBox) {
        statusBanner.style.display = "block";
        const statusMap = {
            "Menunggu Verifikasi": { bg: "#FFFBEB", border: "#FDE68A", color: "#92400E", icon: "🟠" },
            "Pembayaran Diterima": { bg: "#ECFDF5", border: "#A7F3D0", color: "#065F46", icon: "🟢" },
            "Dibatalkan": { bg: "#FEF2F2", border: "#FECACA", color: "#991B1B", icon: "🔴" }
        };
        const st = statusMap[transaction.status] || { bg: "#F3F4F6", border: "#E5E7EB", color: "#6B7280", icon: "⏳" };
        statusBox.style.background = st.bg;
        statusBox.style.border = "1px solid " + st.border;
        statusBox.style.color = st.color;
        if (statusIcon) statusIcon.textContent = st.icon;
        if (statusText) statusText.textContent = transaction.status === "Pembayaran Diterima" ? "Sedang Sewa (Aktif)" : transaction.status;
    }

    if (transaction.status === "Pembayaran Diterima") {
        showResetButton();
    }
}

function showResetButton() {
    if (!document.getElementById("btnNewOrder")) {
        const btn = document.createElement("button");
        btn.id = "btnNewOrder";
        btn.innerHTML = "🔄 Mulai Sewa Baru";
        btn.style.cssText = "width:100%; padding:14px; background:#355E3B; color:white; border:none; border-radius:12px; font-size:14px; font-weight:600; cursor:pointer; margin-top:12px; font-family:inherit; transition:0.3s;";
        btn.onclick = () => {
            localStorage.removeItem("currentTransaction");
            localStorage.removeItem("cart");
            localStorage.removeItem("selectedReturnDate");
            location.reload();
        };
        const summaryCard = document.getElementById("paymentSummaryCard");
        if (summaryCard) summaryCard.appendChild(btn);
    }
}

document.getElementById("logoutBtn")?.addEventListener("click", () => {
    if(confirm("Logout dari aplikasi?")) {
        localStorage.removeItem("cart");
        window.location.href = "../project-folder/index.html";
    }
});